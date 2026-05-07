import { StyleSheet, View } from "react-native";

import { useTheme } from "../lib/theme";

/**
 * Android / web: layered fills from theme (no native blur).
 */
export function TabBarBackdrop() {
  const { colors, mode } = useTheme();

  if (mode === "light") {
    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.panel }]} />
    );
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.blurBaseAndroid }]} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.blurOverlay }]} />
    </View>
  );
}
