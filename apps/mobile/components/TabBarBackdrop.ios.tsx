import { BlurView } from "expo-blur";
import { StyleSheet, View } from "react-native";

import { useTheme } from "../lib/theme";

/**
 * iOS: native blur + tint overlay from theme.
 */
export function TabBarBackdrop() {
  const { colors } = useTheme();

  return (
    <>
      <BlurView
        tint={colors.blurTint}
        intensity={colors.mode === "dark" ? 48 : 56}
        blurReductionFactor={4}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.blurOverlay }]} />
    </>
  );
}
