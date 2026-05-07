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
    scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 12 },
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
