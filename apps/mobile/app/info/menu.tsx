import { openURL } from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation();

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
        <View style={styles.socialRow}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="LinkedIn, opens website"
            onPress={() => void openURL("https://www.linkedin.com/in/mikekuzin")}
            style={({ pressed }) => [styles.socialIconBtn, pressed && styles.rowPressed]}
          >
            <Ionicons name="logo-linkedin" size={17} color={colors.accent} />
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="X, opens website"
            onPress={() => void openURL("https://x.com/kuzin")}
            style={({ pressed }) => [styles.socialIconBtn, pressed && styles.rowPressed]}
          >
            <Text style={styles.socialX}>X</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Instagram, opens website"
            onPress={() => void openURL("https://instagram.com/kuzin")}
            style={({ pressed }) => [styles.socialIconBtn, pressed && styles.rowPressed]}
          >
            <Ionicons name="logo-instagram" size={17} color={colors.accent} />
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Dribbble, opens website"
            onPress={() => void openURL("https://dribbble.com/kuzin")}
            style={({ pressed }) => [styles.socialIconBtn, pressed && styles.rowPressed]}
          >
            <Ionicons name="logo-dribbble" size={17} color={colors.accent} />
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="GitHub, opens website"
            onPress={() => void openURL("https://github.com/kuzin")}
            style={({ pressed }) => [styles.socialIconBtn, pressed && styles.rowPressed]}
          >
            <Ionicons name="logo-github" size={17} color={colors.accent} />
          </Pressable>
        </View>
        <Text style={styles.copyrightLine}>
          © 2026. Design by{" "}
          <Text
            accessibilityRole="link"
            accessibilityLabel="Kuz, opens website"
            onPress={() => void openURL("https://kuzn.me")}
            style={styles.copyrightLink}
          >
            kuz
          </Text>
          .
        </Text>
        <Text style={styles.copyrightLine}>
          All rights reserved.
        </Text>
        <Text style={styles.footerDedication}>For Kaitlyn. ❤️</Text>
      </View>
    </ScrollView>
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
      gap: 8,
      marginTop: 28,
      paddingTop: 18,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: border,
      paddingBottom: 14,
    },
    socialRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 2,
    },
    socialIconBtn: {
      width: 32,
      height: 32,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      backgroundColor: colors.panel,
      alignItems: "center",
      justifyContent: "center",
    },
    socialX: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 16,
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
