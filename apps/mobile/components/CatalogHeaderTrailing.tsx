import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import {
  HEADER_TOOLBAR_EDGE_INSET_ANDROID,
  HEADER_TOOLBAR_HIT_PX,
  HEADER_TOOLBAR_ICON,
  HEADER_TOOLBAR_ICON_PX,
} from "../lib/headerToolbarChrome";
import { useTheme } from "../lib/theme";
import { InfoMenuHeaderButton } from "./InfoMenuHeaderButton";

/** Leading / trailing inset for catalog toolbar (Android only — native bar insets on iOS). */
const EDGE_PAD = HEADER_TOOLBAR_EDGE_INSET_ANDROID;

/** Catalog home — leading “log a sighting” control. */
export function CatalogHeaderLogSightingLeading() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.slotOuter,
        { paddingLeft: EDGE_PAD, height: HEADER_TOOLBAR_HIT_PX },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log a sighting"
        accessibilityHint="Opens the form to submit a rat sighting for review"
        hitSlop={{ top: 10, bottom: 10, left: 6, right: 8 }}
        onPress={() => router.push("/submit")}
        android_ripple={{
          color:
            colors.headerActionRipple,
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
                  borderColor: colors.headerActionOutline,
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
    <View style={EDGE_PAD > 0 ? { paddingRight: EDGE_PAD } : undefined}>
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
