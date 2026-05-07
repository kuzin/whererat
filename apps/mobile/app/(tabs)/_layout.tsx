import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBar, type BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HeaderThemeWordmark } from "../../components/HeaderThemeWordmark";
import { InfoMenuHeaderButton } from "../../components/InfoMenuHeaderButton";
import { TabBarBackdrop } from "../../components/TabBarBackdrop";
import { useTheme } from "../../lib/theme";

const TAB_BAR_WIDTH = 240;

type RoutedTabBarProps = ComponentProps<typeof BottomTabBar>;

const REST_FOCUS = 1;
const REST_IDLE = 0.986;
const SPRING_PRESS = 0.989;

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
  const resting = focused ? REST_FOCUS : REST_IDLE;
  const scale = useRef(new Animated.Value(resting)).current;

  useEffect(() => {
    const next = focused ? REST_FOCUS : REST_IDLE;
    if (reduceMotion) {
      scale.setValue(next);
      return;
    }
    Animated.spring(scale, {
      toValue: next,
      useNativeDriver: true,
      stiffness: 420,
      damping: 28,
      mass: 0.55,
      overshootClamping: true,
    }).start();
  }, [focused, reduceMotion, scale]);

  const pressScale = reduceMotion ? 1 : SPRING_PRESS;

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, selected: focused }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[style, styles.tabBarPressable]}
      android_ripple={{ color: "transparent" }}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.tabButtonInner,
            {
              transform: [{ scale: pressed ? pressScale : scale }],
            },
          ]}
        >
          <View
            style={[
              styles.tabPill,
              focused &&
                (colors.mode === "light"
                  ? {
                      backgroundColor: colors.chipActive,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: colors.accent,
                    }
                  : { backgroundColor: colors.accent }),
            ]}
          >
            {children}
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

function TabsTabBar(props: RoutedTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom + 4, 12);

  return (
    <View pointerEvents="box-none" style={[styles.tabBarWrap, { bottom }]}>
      <View
        style={[
          styles.tabBarShell,
          { borderColor: colors.border },
          colors.mode === "light" && {
            borderWidth: 1,
            borderColor: "rgba(28,25,23,0.26)",
          },
          colors.mode === "light" && { backgroundColor: colors.panel },
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
      ...(Platform.OS === "ios" ? { headerBlurEffect: "none" as const } : {}),
      tabBarStyle: styles.tabBarTransparent,
      tabBarActiveTintColor: colors.headerText,
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
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "film" : "film-outline"}
              size={focused ? size + 1 : size}
              color={color}
            />
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
              size={focused ? size + 1 : size}
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
  tabBarShell: {
    width: TAB_BAR_WIDTH,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      default: {
        elevation: 12,
        shadowColor: "#000",
        shadowOpacity: 0.32,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
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
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 6,
  },
  tabBarLabel: {
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.35,
    marginTop: 3,
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
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  /** Hug icon + label; active pill uses catalog-toggle colors in `ChipTabButton`. */
  tabPill: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "transparent",
  },
});
