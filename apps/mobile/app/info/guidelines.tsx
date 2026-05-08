import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { GUIDELINES_SECTIONS } from "../../lib/guidelines-content";
import { type ThemeColors, useTheme } from "../../lib/theme";

export default function GuidelinesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerBlock}>
        <Text style={styles.headerIcon}>📖</Text>
        <Text style={styles.headerTitle}>Guidelines</Text>
        <Text style={styles.headerBody}>
          Standards for submissions, spoilers, moderation, inclusivity, and accessibility so the catalog
          stays accurate and welcoming.
        </Text>
      </View>
      {GUIDELINES_SECTIONS.map((item) => (
        <View key={item.title} style={styles.card}>
          <Text style={styles.cardTitle}>
            {item.icon} {item.title}
          </Text>
          <Text style={styles.cardBody}>{item.body}</Text>
        </View>
      ))}
      <Text style={styles.epigraph}>
        * rats have seen more films than most critics and charge nothing for their opinions · they prefer the
        middle seat · their tiny claws make no noise during quiet scenes · no rat has ever spoiled an ending ·
        they are, frankly, professionals
      </Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 12 },
    headerBlock: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.mode === "dark" ? "rgba(251,191,36,0.26)" : "rgba(217,119,6,0.4)",
      backgroundColor: colors.mode === "dark" ? "rgba(180,83,9,0.38)" : "#fcd34d",
      paddingHorizontal: 16,
      paddingVertical: 16,
      marginBottom: 2,
      gap: 6,
    },
    headerIcon: {
      fontSize: 28,
      lineHeight: 30,
    },
    headerTitle: {
      color: colors.mode === "dark" ? "#fef3c7" : "#292524",
      fontSize: 28,
      fontWeight: "800",
      lineHeight: 32,
    },
    headerBody: {
      color: colors.mode === "dark" ? "#fde68a" : "#7c2d12",
      fontSize: 14.5,
      lineHeight: 21,
      fontWeight: "600",
    },
    card: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.panel,
      padding: 16,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "800",
      lineHeight: 24,
    },
    cardBody: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 10,
    },
    epigraph: {
      marginTop: 8,
      color: colors.iconMuted,
      fontSize: 10,
      lineHeight: 16,
      textAlign: "center",
      letterSpacing: 0.4,
    },
  });
}
