import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable } from "react-native";

import { useTheme } from "../lib/theme";

export function InfoMenuHeaderButton() {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Settings, guidelines, and privacy"
      hitSlop={12}
      onPress={() => router.push("/info")}
      style={({ pressed }) => [
        { marginRight: 6, paddingVertical: 8, paddingLeft: 8 },
        pressed && { opacity: 0.55 },
      ]}
    >
      <Ionicons name="settings-outline" size={22} color={colors.iconMuted} />
    </Pressable>
  );
}
