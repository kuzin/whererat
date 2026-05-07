import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { type ThemeColors, useTheme } from "../../lib/theme";

function createSubmitStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
      gap: 12,
      justifyContent: "center",
    },
    lead: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
      textAlign: "center",
    },
    body: {
      color: colors.textMuted,
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
      paddingHorizontal: 8,
    },
  });
}

export default function SubmitScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createSubmitStyles(colors), [colors]);

  return (
    <View style={styles.screen}>
      <Text style={styles.lead}>Log a sighting</Text>
      <Text style={styles.body}>Use this tab to submit a new rat sighting. We’ll wire up the flow next.</Text>
    </View>
  );
}
