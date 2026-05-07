import { openURL } from "expo-linking";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getApiOrigin } from "../../lib/api";
import { type ThemeColors, useTheme } from "../../lib/theme";

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const origin = getApiOrigin();

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.p1}>
        WhereRat is primarily a curated catalog public on the web. The companion native app <Text style={styles.bold}>(v1)</Text>{" "}
        mirrors that anonymous experience: browse movies, sightings, and IMDb-related reference content we
        already expose on the website. Sign-in, submissions, and uploads are intentionally out of scope for the
        initial mobile release.
      </Text>

      <Text style={styles.h2}>Native app — v1</Text>
      <View style={styles.bulletBlock}>
        <Text style={styles.bullet}>
          • Requests go to WhereRat HTTPS APIs to load catalog and movie payloads. Requests are{" "}
          <Text style={styles.bold}>read-only GET</Text> calls; the app does not send account credentials
          because v1 includes no authentication.
        </Text>
        <Text style={styles.bullet}>
          • Posters and stills displayed in-app are sourced from public URLs referenced in catalog data (for
          example CDN hosts used on the web). Those third parties&apos; servers may receive standard HTTP
          requests from your device when images load or when you tap through to linked pages such as IMDb.
        </Text>
        <Text style={styles.bullet}>
          • Routine device logs (via Apple or Google, crash analytics if you configure them in EAS) may apply
          outside WhereRat's codebase; disclose those in App Store Connect / Play Console as you enable
          them for production builds.
        </Text>
      </View>

      <Text style={styles.h2}>Full policy on the web</Text>
      <Text style={styles.p2}>
        For the canonical page (and updates when features change), open the site:
      </Text>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Open privacy page on website"
        onPress={() => void openURL(`${origin}/privacy`)}
        style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
      >
        <Text style={styles.linkText}>{origin}/privacy</Text>
      </Pressable>

      <Text style={styles.h2}>Questions</Text>
      <Text style={styles.p2}>
        For moderator, legal, or data questions, use the public contact you publish on WhereRat.com and in App
        Store Connect / Play Console so it matches editorial review answers.
      </Text>
      <Text style={styles.small}>
        This screen summarizes the shipped v1 read-only mobile scope — update the website when you add
        authenticated features, submissions from the app, or third-party analytics.
      </Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
    p1: { color: colors.text, fontSize: 16, lineHeight: 24, marginBottom: 20 },
    bold: { fontWeight: "700" },
    h2: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "800",
      marginTop: 8,
      marginBottom: 10,
    },
    bulletBlock: { gap: 12, marginBottom: 20 },
    bullet: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
    p2: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 10 },
    link: {
      alignSelf: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 4,
      marginBottom: 16,
    },
    linkPressed: { opacity: 0.85 },
    linkText: { color: colors.accent, fontSize: 15, fontWeight: "800" },
    small: {
      color: colors.iconMuted,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 12,
    },
  });
}
