import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import type { SightingPublic } from "../lib/types";

const cream = "#fef3c7";
const stone = "#a8a29e";
const wash = "#292524";

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

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1c1917",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#44403c",
    marginBottom: 16,
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: wash,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { color: stone, fontSize: 14 },
  body: { padding: 12, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  timestamp: { color: stone, fontSize: 13 },
  spoilerBadge: {
    backgroundColor: "#7f1d1d",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  spoilerText: { color: cream, fontSize: 11, fontWeight: "600" },
  title: { color: cream, fontSize: 18, fontWeight: "700" },
  meta: { color: stone, fontSize: 13 },
  desc: { color: "#d6d3d1", fontSize: 15, lineHeight: 22 },
  submitter: { color: stone, fontSize: 13, fontStyle: "italic", marginTop: 4 },
});
