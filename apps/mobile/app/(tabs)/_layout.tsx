import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBar, type BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HeaderThemeWordmark } from "../../components/HeaderThemeWordmark";
import { InfoMenuHeaderButton } from "../../components/InfoMenuHeaderButton";
import { TabBarBackdrop } from "../../components/TabBarBackdrop";
import { useTheme } from "../../lib/theme";

const TAB_BAR_WIDTH = 240;
/** Outer glass capsule rounding. */
const TAB_BAR_CORNER_RADIUS = 28;
/** Selected segment rounding — tighter than the shell so the bar edge stays visibly rounder. */
const TAB_ITEM_CORNER_RADIUS = 20;

type RoutedTabBarProps = ComponentProps<typeof BottomTabBar>;

const PRESS_SCALE = 0.96;

const SPRING_SELECTION = { stiffness: 340, damping: 24, mass: 0.45 };
const SPRING_PRESS = { stiffness: 480, damping: 28, mass: 0.38 };

/** Matches catalog `layoutToggleBtnOn` (list/card toggle). */
const SEGMENT_ACTIVE_BORDER_WIDTH = StyleSheet.hairlineWidth;

/** Keep in sync with `(tabs)/index.tsx` `INSET_X` — catalog chrome / search trailing edge. */
const CATALOG_EDGE_INSET_X = 16;
/** Matches `InfoMenuHeaderButton` tap target width. */
const TAB_HEADER_ACTION_W = 44;
/**
 * Trailing padding for the settings control. iOS navigation chrome already insets bar-button
 * content — adding `INSET_X` again kept the cog visibly left of catalog search.
 */
const TAB_HEADER_COG_TRAILING_PAD =
  Platform.select<number>({
    ios: 0,
    default: CATALOG_EDGE_INSET_X,
  }) ?? CATALOG_EDGE_INSET_X;
/** Same occupied width as trailing slot so Header’s flex doesn’t widen `end` vs empty `start`. */
const TAB_HEADER_SIDE_MIRROR_W = TAB_HEADER_ACTION_W + TAB_HEADER_COG_TRAILING_PAD;

function TabHeaderLeadingMirror() {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      style={{ width: TAB_HEADER_SIDE_MIRROR_W, height: TAB_HEADER_ACTION_W }}
    />
  );
}

/** `interpolateColor` needs an rgba(…, 0) pair for transparent → fill transitions. */
function hexToRgbStringAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(245,158,11,${alpha})`;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function useReduceMotionEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let canceled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (!canceled) setEnabled(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v: boolean) => {
      setEnabled(v);
    });
    return () => {
      canceled = true;
      sub.remove();
    };
  }, []);

  return enabled;
}

function ChipTabButton(props: BottomTabBarButtonProps) {
  const {
    accessibilityState,
    accessibilityLabel,
    testID,
    children,
    style,
    onPress,
    onLongPress,
    onPressIn,
    onPressOut,
    ...rawRest
  } = props;
  /** Ref types from `tabBarButton` overlap `LegacyRef` in Pressable typings; omit from spread. */
  const { ref: _unusedTabRef, ...rest } = rawRest as typeof rawRest & { ref?: unknown };
  void _unusedTabRef;
  const { colors } = useTheme();
  /** `BottomTabItem` sets `aria-selected` but often omits `accessibilityState.selected`. */
  const ariaSel = (rest as { "aria-selected"?: boolean | string })["aria-selected"];
  const focused =
    Boolean(accessibilityState?.selected) || ariaSel === true || ariaSel === "true";
  const reduceMotion = useReduceMotionEnabled();

  const chipClear = useMemo(() => hexToRgbStringAlpha(colors.chipActive, 0), [colors.chipActive]);
  const outlineClear = useMemo(
    () => hexToRgbStringAlpha(colors.chipActiveOutline, 0),
    [colors.chipActiveOutline],
  );
  const focusProgress = useSharedValue(focused ? 1 : 0);
  const pressDepth = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      focusProgress.value = focused ? 1 : 0;
      return;
    }
    focusProgress.value = withSpring(focused ? 1 : 0, SPRING_SELECTION);
  }, [focused, reduceMotion]);

  const pillStyle = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(focusProgress.value, [0, 1], [chipClear, colors.chipActive]),
      borderWidth: interpolate(focusProgress.value, [0, 1], [0, SEGMENT_ACTIVE_BORDER_WIDTH]),
      borderColor: interpolateColor(focusProgress.value, [0, 1], [outlineClear, colors.chipActiveOutline]),
    }),
    [chipClear, colors.chipActive, colors.chipActiveOutline, outlineClear],
  );

  /** Press squash only — selection motion lives in `pillStyle` tint spring. */
  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressDepth.value, [0, 1], [1, PRESS_SCALE]) }],
  }));

  const handlePressIn = (e: Parameters<NonNullable<typeof onPressIn>>[0]) => {
    onPressIn?.(e);
    if (reduceMotion) {
      pressDepth.value = 1;
      return;
    }
    pressDepth.value = withSpring(1, SPRING_PRESS);
  };

  const handlePressOut = (e: Parameters<NonNullable<typeof onPressOut>>[0]) => {
    onPressOut?.(e);
    if (reduceMotion) {
      pressDepth.value = 0;
      return;
    }
    pressDepth.value = withSpring(0, SPRING_PRESS);
  };

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, selected: focused }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, styles.tabBarPressable]}
      android_ripple={{ color: "transparent" }}
    >
      <Animated.View style={[styles.tabButtonInner, innerStyle]}>
        <Animated.View style={[styles.tabPill, pillStyle]}>{children}</Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function TabsTabBar(props: RoutedTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom + 4, 12);

  return (
    <View pointerEvents="box-none" style={[styles.tabBarWrap, { bottom }]}>
      <View style={styles.tabBarShellShadow}>
        <View
          style={[
            styles.tabBarShellInner,
            Platform.OS === "ios"
              ? {
                  backgroundColor: "transparent",
                  borderColor:
                    colors.mode === "light"
                      ? "rgba(28, 25, 23, 0.11)"
                      : "rgba(254, 243, 199, 0.13)",
                }
              : [
                  { borderColor: colors.border },
                  ...(colors.mode === "light"
                    ? ([
                        {
                          borderWidth: 1,
                          borderColor: "rgba(28,25,23,0.26)",
                          backgroundColor: colors.panel,
                        },
                      ] satisfies [ViewStyle])
                    : []),
                ],
          ]}
        >
          <TabBarBackdrop />
          <BottomTabBar
            {...props}
            insets={{ ...props.insets, bottom: 0 }}
            style={[styles.tabBarTransparent, styles.tabBar, props.style]}
          />
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.headerBg },
      headerTintColor: colors.headerText,
      headerTitleStyle: { fontWeight: "700" as const },
      headerShadowVisible: false,
      headerTitleAlign: "center" as const,
      headerTitle: () => <HeaderThemeWordmark />,
      /**
       * Mirrors trailing control width (`TabHeaderLeadingMirror`) so `start` / `end` min widths
       * match and the wordmark stays visually centered (`@react-navigation/elements` Header).
       */
      headerLeft: () => <TabHeaderLeadingMirror />,
      /**
       * Tab root has no back button — keep `minimal` so centered `maxWidth` math doesn’t assume
       * a full default back chevron (80pt) for the leading slot.
       */
      headerBackButtonDisplayMode: "minimal" as const,
      headerTitleContainerStyle: {
        /**
         * True screen-center: removed from header row flex (`position: absolute`) so asymmetric
         * `start` / `end` min widths cannot shift the title (gear slot stays unchanged).
         */
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        /** Default Header title uses `marginHorizontal: 16`; override + beat its `maxWidth` cap. */
        marginHorizontal: 0,
        maxWidth: "100%",
        pointerEvents: "box-none",
      } satisfies ViewStyle,
      /**
       * Do not set `flexGrow: 0` / fixed width — must keep Header’s `styles.expand` so flex
       * balances around the title; use `paddingRight` + matching `headerLeft` width for alignment.
       */
      headerRightContainerStyle: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: TAB_HEADER_COG_TRAILING_PAD,
      } satisfies ViewStyle,
      ...(Platform.OS === "ios" ? { headerBlurEffect: "none" as const } : {}),
      tabBarStyle: styles.tabBarTransparent,
      tabBarActiveTintColor: colors.text,
      tabBarInactiveTintColor: colors.tabInactive,
      tabBarLabelStyle: styles.tabBarLabel,
      tabBarItemStyle: styles.tabBarItem,
      tabBarIconStyle: styles.tabBarIcon,
      tabBarButton: (props: BottomTabBarButtonProps) => <ChipTabButton {...props} />,
      headerRight: () => <InfoMenuHeaderButton />,
    }),
    [colors],
  );

  return (
    <Tabs tabBar={(props) => <TabsTabBar {...props} />} screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Catalog",
          tabBarLabel: "Catalog",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="rodent" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="submit"
        options={{
          title: "Submit",
          tabBarLabel: "Submit",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "add-circle" : "add-circle-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  /** Outer shell only — shadows are clipped if `overflow: hidden` sits on this view (iOS). */
  tabBarShellShadow: {
    width: TAB_BAR_WIDTH,
    borderRadius: TAB_BAR_CORNER_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.16,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
      },
      default: {
        elevation: 8,
      },
    }),
  },
  tabBarShellInner: {
    borderRadius: TAB_BAR_CORNER_RADIUS,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabBarTransparent: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    position: "relative",
  },
  tabBar: {
    width: TAB_BAR_WIDTH,
    borderRadius: 0,
    height: 72,
    /** Inset from the glass shell (outer “air” around both tabs). */
    padding: 8,
  },
  tabBarLabel: {
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.35,
    marginTop: 1,
  },
  tabBarItem: {
    flex: 1,
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: 0,
    minWidth: 0,
  },
  tabBarIcon: {
    marginBottom: 0,
    marginTop: -1,
  },
  tabBarPressable: {
    flex: 1,
    minWidth: 0,
    alignSelf: "stretch",
  },
  tabButtonInner: {
    flex: 1,
    alignSelf: "stretch",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  /** Active fill radius is smaller than the outer shell for a nested “inset chip” silhouette. */
  tabPill: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: TAB_ITEM_CORNER_RADIUS,
    backgroundColor: "transparent",
    alignSelf: "stretch",
    maxWidth: "100%",
    /** No side margin — tabs meet in the middle for a tighter pair. */
    marginHorizontal: 0,
    overflow: "hidden",
  },
});
