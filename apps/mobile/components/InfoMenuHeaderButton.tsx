import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { useTheme } from "../lib/theme";

/** Filled gear, light grey — quieter than outline + accent; aligns with centered title row. */
export function InfoMenuHeaderButton() {
  const { colors } = useTheme();
  const iconGrey =
    colors.mode === "light" ? "rgba(120, 113, 106, 0.55)" : "rgba(212, 207, 205, 0.42)";

  return (
    <View style={styles.hit}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Settings, guidelines, and privacy"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 8 }}
        onPress={() => router.push("/info")}
        style={({ pressed }) => [styles.pressInner, pressed && styles.pressed]}
      >
        <Ionicons name="settings" size={20} color={iconGrey} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    /** Match header title `marginTop` on wordmark tap target — keeps gear optically centered with logo. */
    marginTop: 4,
  },
  pressInner: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  pressed: {
    opacity: 0.62,
  },
});
