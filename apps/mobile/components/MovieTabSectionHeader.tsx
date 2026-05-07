import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ThemeColors } from "../lib/theme";

export type MovieTabSectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  /** Typically `movieThemeColors.accent` so the link chip matches poster chrome */
  accentColor: string;
  colors: ThemeColors;
};

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    rowTrailingMarginCompact: {
      marginBottom: 6,
    },
    titleColumn: {
      flex: 1,
      minWidth: 0,
      paddingRight: 4,
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
      marginTop: 4,
      marginBottom: 8,
    },
    actionBtn: {
      flexShrink: 0,
      maxWidth: "50%",
      minHeight: 36,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accent,
      backgroundColor: colors.panel,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    actionBtnText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "700",
      flexShrink: 1,
    },
  });
}

export function MovieTabSectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  accentColor,
  colors,
}: MovieTabSectionHeaderProps) {
  const s = useMemo(() => createStyles(colors), [colors]);
  const showAction = Boolean(actionLabel && onActionPress);

  return (
    <View style={[s.row, !subtitle ? s.rowTrailingMarginCompact : null]}>
      <View style={s.titleColumn}>
        <Text style={s.title}>{title}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>
      {showAction ? (
        <Pressable
          style={s.actionBtn}
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={s.actionBtnText} numberOfLines={2}>
            {actionLabel}
          </Text>
          <Ionicons name="open-outline" size={13} color={accentColor} />
        </Pressable>
      ) : null}
    </View>
  );
}
