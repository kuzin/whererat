import { openURL } from "expo-linking";
import { useMemo, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getPrivacyPolicyWebUrl } from "../../lib/api";
import { type ThemeColors, useTheme } from "../../lib/theme";

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const privacyUrl = getPrivacyPolicyWebUrl();

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.effective}>Last updated: May 2026</Text>

      <Section styles={styles} title="Introduction">
        <Text style={styles.paragraph}>
          WhereRat hosts a public catalog on the web. This privacy policy describes how the native companion
          application (the &ldquo;app&rdquo;) handles information when you browse the catalog on your device.
          The official, versioned policy maintained for the full product is published on our website; this
          screen focuses on the shipped <Text style={styles.bold}>v1</Text> read-only mobile experience.
        </Text>
      </Section>

      <Section styles={styles} title="Scope">
        <Text style={styles.paragraph}>
          The v1 app does not include sign-in, submissions, or uploads. It is designed to mirror the public
          browsing experience: viewing movies, sightings, and linked reference content already shown on the site.
        </Text>
      </Section>

      <Section styles={styles} title="Information we collect">
        <Text style={styles.paragraph}>
          The app loads catalog and detail data by sending <Text style={styles.bold}>read-only HTTPS GET</Text>{" "}
          requests to WhereRat APIs. It does not transmit account credentials because authentication is not built into
          {" "}v1.
        </Text>
        <Text style={styles.paragraph}>
          When you view posters, banners, or similar media, your device may reach image hosts referenced in
          catalog data (for example third-party CDNs). Separately, tapping external links (such as IMDb) sends
          HTTP requests to those sites under their own privacy terms.
        </Text>
      </Section>

      <Section styles={styles} title="How we use information">
        <Text style={styles.paragraph}>
          Data received from our APIs is used only to display catalog content in the app on your device.
          WhereRat does not rely on v1 app flows to build a user account or profile tied to you.
        </Text>
      </Section>

      <Section styles={styles} title="Analytics and diagnostics">
        <Text style={styles.paragraph}>
          Apple and Google operating systems, and any crash or analytics tools you enable in your Expo / EAS build
          pipeline, may generate device or fault data outside WhereRat's JavaScript layer. Disclose those controls
          consistently in App Store Connect and Google Play Console for each production build.
        </Text>
      </Section>

      <Section styles={styles} title="Children's privacy">
        <Text style={styles.paragraph}>
          The catalog is public and the v1 app requests no child-specific identifiers. If your store listing
          targets minors, ensure your age rating, parental controls, and disclosures match your actual data
          practices.
        </Text>
      </Section>

      <Section styles={styles} title="Changes to this policy">
        <Text style={styles.paragraph}>
          When you add authentication, submissions from the app, marketing analytics, or materially new data
          flows, update this policy and the canonical page on the website before shipping those features.
        </Text>
      </Section>

      <Section styles={styles} title="Contact">
        <Text style={styles.paragraph}>
          Use the public contact information you publish on WhereRat.com and in your store listings for
          moderator, legal, or data inquiries, so answers match app review and storefront records.
        </Text>
      </Section>

      <Section styles={styles} title="Full policy on the web">
        <Text style={styles.paragraph}>
          For the authoritative page and future updates, open the site:
        </Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Open privacy policy on website"
          onPress={() => void openURL(privacyUrl)}
          style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
        >
          <Text style={styles.linkText}>whererat.com/privacy</Text>
        </Pressable>
      </Section>
    </ScrollView>
  );
}

function Section({
  styles,
  title,
  children,
}: {
  styles: ReturnType<typeof createStyles>;
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
    effective: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 24,
    },
    section: {
      marginBottom: 22,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "800",
      marginBottom: 10,
    },
    paragraph: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 12,
    },
    bold: { color: colors.textMuted, fontWeight: "700" },
    link: {
      alignSelf: "flex-start",
      paddingVertical: 4,
      paddingHorizontal: 0,
    },
    linkPressed: { opacity: 0.85 },
    linkText: { color: colors.accent, fontSize: 15, fontWeight: "700" },
  });
}
