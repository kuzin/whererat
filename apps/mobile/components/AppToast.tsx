import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { type ThemeColors, useTheme } from "../lib/theme";

const AUTO_DISMISS_MS = 5200;

type Props = {
  /** When null/empty, nothing is shown. */
  message: string | null | undefined;
  onDismiss: () => void;
  /** Distance from the bottom safe edge (include tab bar height when inside tabs). */
  bottomOffset: number;
  variant?: "error" | "neutral";
  action?: { label: string; onPress: () => void };
};

export function AppToast({
  message,
  onDismiss,
  bottomOffset,
  variant = "error",
  action,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createToastStyles(colors, variant), [colors, variant]);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const visible = Boolean(message?.trim());

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      translateY.setValue(12);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const t = setTimeout(() => dismissRef.current(), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [message, visible, opacity, translateY]);

  if (!visible) return null;

  return (
    <View
      style={[styles.overlay, { paddingBottom: bottomOffset }]}
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
    >
      <Animated.View
        style={[
          styles.chip,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Ionicons
          name={variant === "error" ? "alert-circle" : "information-circle"}
          size={22}
          color={variant === "error" ? colors.dangerText : colors.accent}
          style={styles.leadIcon}
        />
        <Text style={styles.messageText}>{message}</Text>
        {action ? (
          <Pressable
            onPress={action.onPress}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onDismiss}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Dismiss message"
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

function createToastStyles(colors: ThemeColors, variant: "error" | "neutral") {
  const bg =
    variant === "error"
      ? colors.dangerBg
      : colors.mode === "dark"
        ? colors.panelMuted
        : colors.panel;

  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "flex-end",
      alignItems: "center",
      paddingHorizontal: 14,
      zIndex: 50,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      maxWidth: 440,
      width: "100%",
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: bg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.inputBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOpacity: 0.22,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        },
        android: { elevation: 6 },
      }),
    },
    leadIcon: { flexShrink: 0 },
    messageText: {
      flex: 1,
      minWidth: 0,
      color: variant === "error" ? colors.dangerText : colors.text,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
    },
    actionBtn: {
      flexShrink: 0,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: colors.accent,
    },
    actionLabel: {
      color: colors.retryOnAccent,
      fontWeight: "800",
      fontSize: 13,
    },
    closeBtn: { flexShrink: 0, marginLeft: -4 },
  });
}
