import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import {
  HEADER_TOOLBAR_HIT_PX,
  HEADER_TOOLBAR_ICON,
  HEADER_TOOLBAR_ICON_PX,
} from "../lib/headerToolbarChrome";
import { useTheme } from "../lib/theme";

/** Filled gear — matches other nav bar icon buttons. */
export function InfoMenuHeaderButton() {
  const { colors } = useTheme();
  const ripple =
    Platform.OS === "android"
      ? {
          color: colors.headerActionRipple,
          borderless: true as const,
        }
      : undefined;

  return (
    <View style={[styles.hit, { height: HEADER_TOOLBAR_HIT_PX }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Settings, guidelines, and privacy"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 8 }}
        onPress={() => router.push("/info")}
        android_ripple={ripple}
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
          name={HEADER_TOOLBAR_ICON.settings}
          size={HEADER_TOOLBAR_ICON_PX}
          color={colors.headerToolbarIcon}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: {
    justifyContent: "center",
    alignItems: "center",
  },
  pressInner: {
    width: HEADER_TOOLBAR_HIT_PX,
    height: HEADER_TOOLBAR_HIT_PX,
    justifyContent: "center",
    alignItems: "center",
  },
  pressed: {
    opacity: 0.62,
  },
});
