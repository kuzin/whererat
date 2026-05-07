import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";

import { HeaderThemeWordmark } from "../../components/HeaderThemeWordmark";
import { InfoMenuHeaderButton } from "../../components/InfoMenuHeaderButton";
import { useTheme } from "../../lib/theme";

/** Matches `InfoMenuHeaderButton` tap target width. */
const TAB_HEADER_ACTION_W = 44;
/**
 * Trailing padding for the settings control. iOS navigation chrome already insets bar-button
 * content — adding catalog edge inset again kept the cog visibly left of catalog search.
 */
const TAB_HEADER_COG_TRAILING_PAD =
  Platform.select<number>({
    ios: 0,
    default: 16,
  }) ?? 16;
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
      headerLeft: () => <TabHeaderLeadingMirror />,
      headerBackButtonDisplayMode: "minimal" as const,
      headerTitleContainerStyle: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 0,
        maxWidth: "100%",
        pointerEvents: "box-none",
      } satisfies ViewStyle,
      headerRightContainerStyle: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: TAB_HEADER_COG_TRAILING_PAD,
      } satisfies ViewStyle,
      ...(Platform.OS === "ios" ? { headerBlurEffect: "none" as const } : {}),
      headerRight: () => <InfoMenuHeaderButton />,
      tabBarActiveTintColor: colors.text,
      tabBarInactiveTintColor: colors.tabInactive,
      tabBarLabelStyle: styles.tabBarLabel,
      tabBarStyle: {
        backgroundColor: colors.background,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
      },
    }),
    [colors],
  );

  return (
    <Tabs screenOptions={screenOptions}>
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
          /** No settings cog — keep wordmark centered without mirroring the catalog trailing slot. */
          headerLeft: () => null,
          headerRight: () => null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarLabel: {
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.35,
  },
});
