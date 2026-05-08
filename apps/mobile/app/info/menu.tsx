import { openURL } from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppToast } from "../../components/AppToast";
import { type ThemeColors, type ThemePreference, useTheme } from "../../lib/theme";

type Row = {
  title: string;
  subtitle: string;
  href: "/info/about" | "/info/guidelines" | "/info/privacy";
};

const ROWS: Row[] = [
  {
    title: "About WhereRat",
    subtitle: "What this app is and how to find the site",
    href: "/info/about",
  },
  {
    title: "Guidelines",
    subtitle: "Submissions, spoilers, moderation, and accessibility",
    href: "/info/guidelines",
  },
  {
    title: "Privacy policy",
    subtitle: "How we handle data in the native app (v1)",
    href: "/info/privacy",
  },
];

const APPEARANCE_OPTIONS: { value: ThemePreference; title: string; subtitle: string }[] = [
  { value: "light", title: "Light", subtitle: "Always use light appearance" },
  { value: "dark", title: "Dark", subtitle: "Always use dark appearance" },
  {
    value: "system",
    title: "Match system",
    subtitle: "Follow your device light/dark mode",
  },
];

export default function InfoSettingsMenuScreen() {
  const { colors, themePreference, setThemePreference } = useTheme();
  const insets = useSafeAreaInsets();
  const [previewToast, setPreviewToast] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation();
  const toastBottom = Math.max(insets.bottom, 12);

  /**
   * Popping the hub would surface the hidden `/info` gate — leave the stack flow for catalog instead.
   * Only when `index` sits under `menu` (normal entry from Catalog); deep links without the gate use the default pop.
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      const data = "data" in e ? e.data : undefined;
      const actionObj =
        data && typeof data === "object" && "action" in data ? (data as { action?: { type?: string } }).action : undefined;
      const type = typeof actionObj?.type === "string" ? actionObj.type : "";
      if (type !== "POP" && type !== "GO_BACK") return;

      const routes = navigation.getState()?.routes ?? [];
      const menuIdx = routes.findIndex((r) => r.name === "menu");
      const prev = menuIdx > 0 ? routes[menuIdx - 1] : undefined;
      if (prev?.name !== "index") return;

      e.preventDefault();
      router.replace("/");
    });
    return unsubscribe;
  }, [navigation]);

  /** Menu stays mounted under pushed screens — only handle Android back while this screen is focused. */
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        router.replace("/");
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.sectionHeading}>Appearance</Text>
      <View style={styles.list}>
        {APPEARANCE_OPTIONS.map((opt, index) => (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityLabel={`${opt.title}. ${opt.subtitle}`}
            accessibilityState={{ selected: themePreference === opt.value }}
            onPress={() => setThemePreference(opt.value)}
            style={({ pressed }) => [
              styles.row,
              index === APPEARANCE_OPTIONS.length - 1 && styles.rowLast,
              pressed && styles.rowPressed,
            ]}
          >
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>{opt.title}</Text>
              <Text style={styles.rowSubtitle}>{opt.subtitle}</Text>
            </View>
            {themePreference === opt.value ? (
              <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
            ) : (
              <View style={styles.radioPlaceholder} />
            )}
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionHeading, styles.sectionHeadingSpaced]}>About</Text>
      <View style={styles.list}>
        {ROWS.map((row, index) => (
          <Pressable
            key={row.href}
            accessibilityRole="button"
            accessibilityLabel={`${row.title}. ${row.subtitle}`}
            onPress={() => router.push(row.href)}
            style={({ pressed }) => [
              styles.row,
              index === ROWS.length - 1 && styles.rowLast,
              pressed && styles.rowPressed,
            ]}
          >
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconMuted} />
          </Pressable>
        ))}
      </View>

      <View style={styles.hubFooter}>
        <Text style={styles.footerTagline}>
          Spoiler-aware · Crowd-sourced · Obsessively maintained
        </Text>
        <Text style={styles.footerDedication}>For Kaitlyn. ❤️</Text>
        <Text style={styles.copyrightLine}>
          Copyright 2026. Design by{" "}
          <Text
            accessibilityRole="link"
            accessibilityLabel="Kuz, opens website"
            onPress={() => void openURL("https://kuzn.me")}
            style={styles.copyrightLink}
          >
            Kuz
          </Text>
          . All rights reserved.
        </Text>
      </View>

      {__DEV__ ? (
        <>
          <Text style={[styles.sectionHeading, styles.sectionHeadingSpaced]}>
            Developer
          </Text>
          <View style={styles.list}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Preview error toast"
              onPress={() =>
                setPreviewToast(
                  "Something went wrong (preview). This is not a real error.",
                )
              }
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.rowTextCol}>
                <Text style={styles.rowTitle}>Preview error toast</Text>
                <Text style={styles.rowSubtitle}>
                  Shows the same banner used for API failures
                </Text>
              </View>
              <Ionicons name="flask-outline" size={20} color={colors.iconMuted} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Preview sighting submitted modal"
              onPress={() =>
                router.replace({ pathname: "/", params: { success: "1" } })
              }
              style={({ pressed }) => [styles.row, styles.rowLast, pressed && styles.rowPressed]}
            >
              <View style={styles.rowTextCol}>
                <Text style={styles.rowTitle}>Preview submit success modal</Text>
                <Text style={styles.rowSubtitle}>
                  Opens catalog with the post-submit celebration sheet
                </Text>
              </View>
              <Ionicons name="checkmark-done-outline" size={20} color={colors.iconMuted} />
            </Pressable>
          </View>
        </>
      ) : null}
    </ScrollView>
    <AppToast
      message={previewToast}
      onDismiss={() => setPreviewToast(null)}
      bottomOffset={toastBottom}
    />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  const border = colors.border;
  return StyleSheet.create({
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },
    sectionHeading: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
      marginBottom: 8,
      marginLeft: 4,
    },
    sectionHeadingSpaced: {
      marginTop: 28,
    },
    radioPlaceholder: { width: 22, height: 22 },
    hubFooter: {
      alignItems: "center",
      gap: 10,
      marginTop: 24,
      paddingTop: 22,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: border,
      paddingBottom: 8,
    },
    footerTagline: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
      textAlign: "center",
    },
    footerDedication: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      fontStyle: "italic",
      opacity: 0.92,
      textAlign: "center",
    },
    copyrightLine: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 22,
      textAlign: "center",
      maxWidth: 420,
      alignSelf: "center",
    },
    copyrightLink: {
      color: colors.accent,
      fontWeight: "700",
      textDecorationLine: "underline",
      textDecorationColor: colors.accent,
    },
    list: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      overflow: "hidden",
      backgroundColor: colors.panel,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: border,
    },
    rowLast: { borderBottomWidth: 0 },
    rowPressed: { opacity: 0.88 },
    rowTextCol: { flex: 1, minWidth: 0, gap: 4 },
    rowTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
    rowSubtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 19 },
  });
}
