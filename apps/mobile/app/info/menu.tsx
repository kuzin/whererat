import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { type ThemeColors, useTheme } from "../../lib/theme";

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
    title: "Privacy",
    subtitle: "How data works in the native app (v1)",
    href: "/info/privacy",
  },
];

export default function InfoSettingsMenuScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation();

  /**
   * Popping the hub would surface the hidden `/info` gate — leave the flow for tabs instead.
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
      router.replace("/(tabs)");
    });
    return unsubscribe;
  }, [navigation]);

  /** Menu stays mounted under pushed screens — only handle Android back while this screen is focused. */
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        router.replace("/(tabs)");
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.lead}>
        Catalog info and policies — same spirit as whererat.com, formatted for the app.
      </Text>
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
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  const border = colors.border;
  return StyleSheet.create({
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 },
    lead: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 20,
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
