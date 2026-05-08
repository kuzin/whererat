import { openURL } from "expo-linking";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getApiOrigin } from "../../lib/api";
import { type ThemeColors, useTheme } from "../../lib/theme";

export default function AboutWhereRatScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const origin = getApiOrigin();
  const version =
    Constants.nativeApplicationVersion ?? Constants.expoConfig?.version ?? "—";
  const build =
    Constants.nativeBuildVersion ??
    (typeof Constants.expoConfig?.runtimeVersion === "string"
      ? Constants.expoConfig.runtimeVersion
      : undefined);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>About WhereRat</Text>
        <Text style={styles.infoCardBody}>
          WhereRat is a spoiler-aware catalog of rat appearances in film and TV. The native app mirrors the
          public site: browse titles, sightings, and IMDb reference content with anonymous, read-only requests.
        </Text>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Technology</Text>
        <Text style={styles.infoCardBody}>
          Mobile app: React Native + Expo (Expo Router), written in TypeScript. Web app: Next.js + React.
          Catalog and sightings are served by WhereRat APIs over HTTPS.
        </Text>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Data and API credits</Text>
        <Text style={styles.infoCardBody}>
          Title metadata, posters, and ratings are synchronized from IMDb-linked data providers (including
          OMDb). External links in the app open third-party destinations such as IMDb under their terms.
        </Text>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>AI usage</Text>
        <Text style={styles.infoCardBody}>
          This app was built with significant AI-assisted development support for ideation, coding, refactors,
          copy iteration, and UI polish. Final implementation decisions, reviews, and releases are curated by
          the project owner.
        </Text>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Accessibility</Text>
        <Text style={styles.infoCardBody}>
          WhereRat aims to keep content readable, spoiler-safe by default, and easier to navigate across devices.
          If you run into accessibility issues, please use the public support channels listed on the site.
        </Text>
      </View>
      <View style={styles.metaBlock}>
        <Text style={styles.metaLabel}>Version</Text>
        <Text style={styles.metaValue}>{version}</Text>
        {build ? (
          <>
            <Text style={[styles.metaLabel, styles.metaLabelSpaced]}>Build</Text>
            <Text style={styles.metaValue}>{build}</Text>
          </>
        ) : null}
        <Text style={[styles.metaLabel, styles.metaLabelSpaced]}>Platform</Text>
        <Text style={styles.metaValue}>{Platform.OS === "ios" ? "iOS" : "Android"}</Text>
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Open WhereRat website"
        onPress={() => void openURL(origin)}
        style={({ pressed }) => [styles.linkBtn, pressed && styles.linkBtnPressed]}
      >
        <Ionicons name="open-outline" size={18} color={colors.accent} />
        <Text style={styles.linkBtnText}>whererat.com</Text>
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
    infoCard: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.panel,
      padding: 14,
      marginBottom: 12,
      gap: 6,
    },
    infoCardTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "800",
      lineHeight: 22,
    },
    infoCardBody: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "500",
    },
    metaBlock: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.panel,
      padding: 16,
      marginBottom: 20,
    },
    metaLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
    metaLabelSpaced: { marginTop: 12 },
    metaValue: { color: colors.text, fontSize: 16, fontWeight: "600", marginTop: 4 },
    linkBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "flex-start",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accent,
      backgroundColor: colors.panel,
    },
    linkBtnPressed: { opacity: 0.9 },
    linkBtnText: { color: colors.accent, fontSize: 16, fontWeight: "800" },
  });
}
