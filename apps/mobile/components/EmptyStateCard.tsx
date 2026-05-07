import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ThemeColors } from "../lib/theme";

const base = StyleSheet.create({
  /** Fills ScrollView / section when `expand` (default): flexGrow chains from parent `flexGrow: 1`. */
  boxExpand: {
    flexGrow: 1,
    alignSelf: "stretch",
    width: "100%",
    minHeight: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 22,
    backgroundColor: "transparent",
  },
  /** Inline messages (e.g. filtered lists) stay compact vertically. */
  boxCompact: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 22,
    backgroundColor: "transparent",
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
  /** When false, do not stretch to fill the parent (e.g. auxiliary empty strips inside tab content). */
  expand = true,
  actionLabel,
  onActionPress,
}: {
  emoji?: string;
  title: string;
  body?: string;
  colors: ThemeColors;
  expand?: boolean;
  actionLabel?: string;
  onActionPress?: () => void;
}) {
  const showAction =
    typeof actionLabel === "string" &&
    actionLabel.length > 0 &&
    typeof onActionPress === "function";

  return (
    <View style={[expand ? base.boxExpand : base.boxCompact]}>
      <Text style={base.emoji} accessible={false}>
        {emoji}
      </Text>
      <Text style={[base.title, { color: colors.text }]}>{title}</Text>
      {body ? <Text style={[base.body, { color: colors.textMuted }]}>{body}</Text> : null}
      {showAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onActionPress}
          style={({ pressed }) => [
            {
              marginTop: 22,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 10,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.accent,
              backgroundColor: colors.panel,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={{ color: colors.accent, fontWeight: "800", fontSize: 15 }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
