import { BlurView } from "expo-blur";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform, StyleSheet, View } from "react-native";

import { useTheme } from "../lib/theme";

/** Warm wash on top of system material so the bar fits the cream / stone UI. */
function glassTintOverlay(mode: "light" | "dark") {
  return mode === "light" ? "rgba(255, 250, 243, 0.38)" : "rgba(41, 37, 36, 0.42)";
}

/**
 * Frosted “liquid glass” behind the floating tab bar.
 * — iOS: `expo-blur` system thin material + tint wash (falls back when Reduce Transparency is on).
 * — Android / web: translucent stack (experimental blur omitted for predictable performance).
 */
export function TabBarBackdrop() {
  const { colors, mode } = useTheme();
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    let alive = true;
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((v) => {
        if (alive) setReduceTransparency(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceTransparencyChanged", (v: boolean) => {
      setReduceTransparency(v);
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  if (Platform.OS === "ios" && !reduceTransparency) {
    const tint = mode === "light" ? ("systemThinMaterialLight" as const) : ("systemThinMaterialDark" as const);
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <BlurView intensity={88} tint={tint} style={StyleSheet.absoluteFillObject} />
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: glassTintOverlay(mode) }]}
        />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor:
                mode === "light" ? "rgba(255, 255, 255, 0.42)" : "rgba(254, 243, 199, 0.06)",
            },
          ]}
        />
      </View>
    );
  }

  if (mode === "light") {
    const bg =
      Platform.OS === "ios" ? colors.panel : "rgba(255, 253, 250, 0.92)";
    return <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: bg }]} />;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.blurBaseAndroid }]} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.blurOverlay }]} />
    </View>
  );
}
