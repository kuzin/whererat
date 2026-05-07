import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable } from "react-native";

import { useTheme } from "../lib/theme";

export function InfoStackCloseButton() {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close and return to catalog"
      hitSlop={12}
      onPress={() => router.replace("/(tabs)")}
      style={({ pressed }) => [
        { marginLeft: 8, paddingVertical: 8, paddingHorizontal: 4 },
        pressed && { opacity: 0.55 },
      ]}
    >
      <Ionicons name="close" size={26} color={colors.text} />
    </Pressable>
  );
}
