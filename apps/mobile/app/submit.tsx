import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { LogSightingForm } from "../components/LogSightingForm";
import { type ThemeColors, useTheme } from "../lib/theme";

function createSubmitStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      minHeight: 0,
      backgroundColor: colors.background,
    },
    scrollSurface: {
      flex: 1,
      minHeight: 0,
      backgroundColor: colors.formCanvas,
    },
    formFlexFill: {
      flex: 1,
      minHeight: 0,
    },
  });
}

export default function SubmitScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createSubmitStyles(colors), [colors]);

  return (
    <View style={styles.safe}>
      <View style={styles.scrollSurface}>
        <View style={styles.formFlexFill}>
          <LogSightingForm />
        </View>
      </View>
    </View>
  );
}
