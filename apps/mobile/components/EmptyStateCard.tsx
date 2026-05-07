import { StyleSheet, Text, View } from "react-native";

import type { ThemeColors } from "../lib/theme";

const base = StyleSheet.create({
  box: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 22,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  emoji: { fontSize: 40, lineHeight: 44 },
  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 14,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 320,
    paddingHorizontal: 4,
  },
});

export function EmptyStateCard({
  emoji = "🧀",
  title,
  body,
  colors,
}: {
  emoji?: string;
  title: string;
  body?: string;
  colors: ThemeColors;
}) {
  const warmBg = colors.mode === "light" ? colors.chipActive : "rgba(66,32,6,0.38)";
  const borderCol = colors.mode === "light" ? "rgba(28,25,23,0.28)" : "rgba(254,243,199,0.18)";
  return (
    <View style={[base.box, { borderColor: borderCol, backgroundColor: warmBg }]}>
      <Text style={base.emoji} accessible={false}>
        {emoji}
      </Text>
      <Text style={[base.title, { color: colors.text }]}>{title}</Text>
      {body ? <Text style={[base.body, { color: colors.textMuted }]}>{body}</Text> : null}
    </View>
  );
}
