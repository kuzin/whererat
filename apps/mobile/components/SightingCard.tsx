import { Image } from "expo-image";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { type ThemeColors, useTheme } from "../lib/theme";
import type { SightingPublic } from "../lib/types";

function createSightingStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: colors.panelMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 16,
    },
    image: {
      width: "100%",
      aspectRatio: 16 / 9,
      backgroundColor: colors.headerBg,
    },
    placeholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    placeholderText: { color: colors.textMuted, fontSize: 14 },
    body: { padding: 12, gap: 6 },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    timestamp: { color: colors.textMuted, fontSize: 13 },
    spoilerBadge: {
      backgroundColor: colors.dangerBg,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    spoilerText: { color: colors.dangerText, fontSize: 11, fontWeight: "600" },
    title: { color: colors.text, fontSize: 18, fontWeight: "700" },
    meta: { color: colors.textMuted, fontSize: 13 },
    desc: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
    submitter: { color: colors.textMuted, fontSize: 13, fontStyle: "italic", marginTop: 4 },
  });
}

type Props = {
  sighting: SightingPublic;
};

function firstImageUrl(s: SightingPublic): string | undefined {
  const fromSlot = s.images?.[0]?.url;
  if (fromSlot) return fromSlot;
  return s.imageUrl;
}

function firstImageAlt(s: SightingPublic): string | undefined {
  const fromSlot = s.images?.[0]?.alt;
  if (fromSlot) return fromSlot;
  return s.imageAlt;
}

export function SightingCard({ sighting }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createSightingStyles(colors), [colors]);

  const img = firstImageUrl(sighting);
  const alt = firstImageAlt(sighting) ?? sighting.title ?? "Sighting still";
  const headline = sighting.title?.trim() || "Rat moment";
  const rats =
    typeof sighting.approximateRatCount === "number"
      ? `${sighting.approximateRatCount} rat(s) (est.)`
      : null;

  return (
    <View style={styles.card}>
      {img ? (
        <Image source={{ uri: img }} style={styles.image} accessibilityLabel={alt} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>No still</Text>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.timestamp}>{sighting.timestamp}</Text>
          {sighting.spoiler ? (
            <View style={styles.spoilerBadge}>
              <Text style={styles.spoilerText}>Spoiler</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.title}>{headline}</Text>
        {rats ? <Text style={styles.meta}>{rats}</Text> : null}
        <Text style={styles.desc} numberOfLines={6}>
          {sighting.description}
        </Text>
        {sighting.submitterName ? (
          <Text style={styles.submitter}>Submitted by {sighting.submitterName}</Text>
        ) : null}
      </View>
    </View>
  );
}
