import { View } from "react-native";

import { useTheme } from "../lib/theme";
import { WhereRatWordmark } from "./WhereRatWordmark";

type Props = {
  /** When set (e.g. movie bar), overrides theme header text for the wordmark. */
  wordmarkColor?: string;
};

/** Center header title: wordmark replaces screen title (appearance is under Settings). */
export function HeaderThemeWordmark({ wordmarkColor }: Props) {
  const { colors } = useTheme();
  const markColor = wordmarkColor ?? colors.headerText;

  return (
    <View
      style={{
        height: 44,
        justifyContent: "center",
        alignItems: "center",
      }}
      accessibilityRole="header"
      accessibilityLabel="WhereRat"
    >
      <WhereRatWordmark color={markColor} height={24} />
    </View>
  );
}
