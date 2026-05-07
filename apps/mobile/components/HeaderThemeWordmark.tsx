import { Platform, Pressable } from "react-native";

import { useTheme } from "../lib/theme";
import { WhereRatWordmark } from "./WhereRatWordmark";

type Props = {
  /** When set (e.g. movie bar), overrides theme header text for the wordmark. */
  wordmarkColor?: string;
};

/** Center header title: wordmark replaces screen title; tap toggles light/dark. */
export function HeaderThemeWordmark({ wordmarkColor }: Props) {
  const { colors, toggleTheme, mode } = useTheme();
  const markColor = wordmarkColor ?? colors.headerText;
  const ripple =
    Platform.OS === "android" ? { color: colors.headerBg, borderless: true as const } : undefined;

  return (
    <Pressable
      onPress={toggleTheme}
      hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
      accessibilityRole="button"
      accessibilityLabel={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      android_ripple={ripple}
      style={{
        height: 44,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <WhereRatWordmark color={markColor} height={24} />
    </Pressable>
  );
}
