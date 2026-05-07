import { useMemo } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LogSightingForm } from "../../components/LogSightingForm";
import { type ThemeColors, useTheme } from "../../lib/theme";

const INSET_X = 16;

function createSubmitStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    intro: {
      paddingHorizontal: INSET_X,
      paddingTop: 8,
      paddingBottom: 12,
      gap: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.mode === "light" ? "rgba(28,25,23,0.12)" : colors.border,
      backgroundColor: colors.background,
    },
    lead: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "800",
    },
    body: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
  });
}

export default function SubmitScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createSubmitStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.intro}>
          <Text style={styles.lead}>Log a sighting</Text>
          <Text style={styles.body}>
            Describe the moment, where it sits in the runtime, and roughly how many rats are on frame.
            Moderators review everything before it appears on WhereRat — same pipeline as the website.
          </Text>
        </View>
        <LogSightingForm />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
