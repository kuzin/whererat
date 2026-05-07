import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import {
  HEADER_TOOLBAR_HIT_PX,
  HEADER_TOOLBAR_ICON,
  HEADER_TOOLBAR_ICON_PX,
} from "../lib/headerToolbarChrome";
import { useTheme } from "../lib/theme";
import { InfoMenuHeaderButton } from "./InfoMenuHeaderButton";

/** Mirrors settings trailing inset on catalog so the logo stays visually centered (Android edge padding). */
const EDGE_PAD = Platform.select<number>({ ios: 0, default: 16 }) ?? 16;

/** Catalog home — leading “log a sighting” control. */
export function CatalogHeaderLogSightingLeading() {
  const { colors } = useTheme();

  return (
    <View style={[styles.slotOuter, { paddingLeft: EDGE_PAD, height: HEADER_TOOLBAR_HIT_PX }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log a sighting"
        accessibilityHint="Opens the form to submit a rat sighting for review"
        hitSlop={{ top: 10, bottom: 10, left: 6, right: 8 }}
        onPress={() => router.push("/submit")}
        android_ripple={{
          color:
            colors.mode === "dark" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)",
          borderless: true,
        }}
        style={({ pressed }) => [
          styles.pressInner,
          {
            backgroundColor: colors.headerActionFill,
            borderRadius: HEADER_TOOLBAR_HIT_PX / 2,
            ...(colors.mode === "light"
              ? {
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: "rgba(28,25,23,0.14)",
                }
              : {}),
          },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name={HEADER_TOOLBAR_ICON.add}
          size={HEADER_TOOLBAR_ICON_PX}
          color={colors.headerToolbarIcon}
        />
      </Pressable>
    </View>
  );
}

/** Catalog home — trailing settings only. */
export function CatalogHeaderSettingsTrailing() {
  return (
    <View style={Platform.OS === "android" ? { paddingRight: EDGE_PAD } : undefined}>
      <InfoMenuHeaderButton />
    </View>
  );
}

const styles = StyleSheet.create({
  slotOuter: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  pressInner: {
    width: HEADER_TOOLBAR_HIT_PX,
    height: HEADER_TOOLBAR_HIT_PX,
    justifyContent: "center",
    alignItems: "center",
  },
  pressed: { opacity: 0.62 },
});
