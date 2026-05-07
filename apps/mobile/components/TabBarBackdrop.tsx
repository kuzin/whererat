import { StyleSheet, View } from "react-native";

import { useTheme } from "../lib/theme";

/**
 * Android / web: layered fills from theme (no native blur).
 */
export function TabBarBackdrop() {
  const { colors } = useTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.blurBaseAndroid }]} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.blurOverlay }]} />
    </View>
  );
}
