import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-native-markdown-display";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { contrastingForeground } from "../lib/posterTone";
import { type ThemeColors, useTheme } from "../lib/theme";
import type { SightingPublic } from "../lib/types";

function createSightingStyles(colors: ThemeColors, surfaceColor?: string) {
  const strongBorder = colors.mode === "dark" ? colors.dividerStrong : colors.border;
  const dividerBorder = colors.inputBorder;
  return StyleSheet.create({
    card: {
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: surfaceColor ?? colors.panel,
      borderWidth: colors.mode === "dark" ? 1 : StyleSheet.hairlineWidth,
      borderColor: strongBorder,
    },
    image: {
      width: 1,
      aspectRatio: 16 / 9,
      backgroundColor: colors.panel,
    },
    carouselFrame: {
      position: "relative",
    },
    dotsWrap: {
      position: "absolute",
      bottom: 8,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      pointerEvents: "none",
    },
    previewBtnWrap: {
      position: "absolute",
      right: 10,
      bottom: 10,
    },
    previewBtn: {
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.overlayScrim,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    previewBtnText: {
      color: colors.onScrimText,
      fontSize: 12,
      fontWeight: "800",
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 999,
      backgroundColor: colors.chipActive,
    },
    dotOn: { width: 18, backgroundColor: colors.accent },
    spoilerImageOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlayScrimStrong,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    spoilerImageTextWrap: {
      alignItems: "center",
      gap: 8,
      /** Equal breathing room above the headline and below the note */
      paddingVertical: 14,
      paddingHorizontal: 4,
    },
    spoilerImageTitle: {
      color: colors.onScrimText,
      fontSize: 22,
      fontWeight: "800",
      lineHeight: 28,
      textAlign: "center",
      textShadowColor: colors.overlayScrimStrong,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    spoilerImageNote: {
      color: colors.onScrimText,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600",
      textAlign: "center",
      textShadowColor: colors.overlayScrimStrong,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    body: { paddingHorizontal: 18, paddingVertical: 16, gap: 10 },
    row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    timestampTag: {
      alignSelf: "flex-start",
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: dividerBorder,
      backgroundColor: colors.chipActive,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    timestampTagText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
    spoilerBadge: {
      backgroundColor: colors.dangerBg,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    spoilerText: { color: colors.dangerText, fontSize: 11, fontWeight: "600" },
    title: { color: colors.text, fontSize: 19, fontWeight: "700", lineHeight: 25 },
    redactLineStack: {
      gap: 6,
    },
    /** Single title-height redaction stripe (approx one line of title text). */
    redactTitleStripe: {
      marginVertical: 4,
      maxWidth: "92%",
    },
    redactBar: {
      height: 10,
      borderRadius: 4,
      /** Light: softer than body text so redaction reads as placeholder, not heavy black bars. */
      backgroundColor: colors.placeholderFill,
      alignSelf: "stretch",
    },
    redactBarShort: {
      alignSelf: "flex-start",
      width: "62%",
    },
    meta: { color: colors.textMuted, fontSize: 13 },
    ratLine: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
    ratMeterRow: { flexDirection: "row", alignItems: "center", gap: 1 },
    ratMeterGlyph: { fontSize: 14, color: colors.accent },
    ratMeterGlyphOff: { opacity: 0.2 },
    desc: { color: colors.text, fontSize: 15, lineHeight: 22 },
    submitter: { color: colors.textMuted, fontSize: 12, fontStyle: "italic", marginTop: 6 },
    curatorNoteCard: {
      marginTop: 6,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: dividerBorder,
      backgroundColor: colors.panelMuted,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 6,
    },
    curatorNoteLabel: {
      color: colors.textMuted,
      fontSize: 10.5,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    curatorNoteText: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "500",
    },
    contentBlock: {
      paddingTop: 2,
      gap: 4,
    },
    /** Match vertical padding above/below redacted body lines vs surrounding rows */
    contentBlockRedacted: {
      paddingTop: 6,
      paddingBottom: 6,
    },
    footerBlock: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: dividerBorder,
      marginTop: 0,
      paddingTop: 8,
      gap: 8,
    },
  });
}

type Props = {
  sighting: SightingPublic;
  surfaceColor?: string;
  showSpoilers?: boolean;
  onOpenImagePreview?: (slides: { url: string; alt?: string }[], startIndex: number) => void;
};

const PLACEHOLDER_STILL_PATTERN = /placehold\.co\//i;
const MAX_RAT_SLOTS = 5;

function getSightingImageSlides(s: SightingPublic): { url: string; alt?: string }[] {
  const out: { url: string; alt?: string }[] = [];
  const seen = new Set<string>();
  const push = (url?: string, alt?: string) => {
    const trimmed = url?.trim() ?? "";
    if (!trimmed || PLACEHOLDER_STILL_PATTERN.test(trimmed)) return;
    const key = trimmed;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ url: trimmed, alt: alt?.trim() || undefined });
  };

  for (const slot of s.images ?? []) {
    if (out.length >= 5) break;
    push(slot.url, slot.alt);
  }
  if (out.length < 5) {
    push(s.imageUrl, s.imageAlt);
  }
  return out;
}

function estimateRatsForAppearance(sighting: SightingPublic): number {
  const raw = sighting.approximateRatCount;
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 1) {
    return Math.min(9999, Math.floor(raw));
  }
  if (sighting.sceneType === "swarm") return 6;
  return 1;
}

function getRatPresenceSlots(estimatedCount: number): 1 | 2 | 3 | 4 | 5 {
  const n = Math.max(1, Math.min(9999, Math.floor(Number(estimatedCount))));
  if (n === 1) return 1;
  if (n <= 4) return 2;
  if (n <= 9) return 3;
  if (n <= 18) return 4;
  return 5;
}

function formatApproximateRatLine(count: number): string {
  const n = Math.max(1, Math.min(9999, Math.floor(Number(count))));
  return n === 1 ? "1 rat" : `${n} rats`;
}

function parseTimestampPercent(timestamp: string): number | null {
  const match = timestamp.trim().match(/^(\d{1,3})(?:\s*%)?$/);
  if (!match) return null;
  const parsed = Number.parseInt(match[1] ?? "", 10);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(100, parsed));
}

export function SightingCard({
  sighting,
  surfaceColor,
  showSpoilers = false,
  onOpenImagePreview,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createSightingStyles(colors, surfaceColor), [colors, surfaceColor]);
  const { width: viewportWidth } = useWindowDimensions();
  const carouselRef = useRef<ScrollView | null>(null);
  const [imageWidth, setImageWidth] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loopInitialized, setLoopInitialized] = useState(false);

  const slides = getSightingImageSlides(sighting);
  const slidesKey = useMemo(() => slides.map((s) => s.url).join("|"), [slides]);
  const carouselSlides =
    slides.length > 1 ? [slides[slides.length - 1]!, ...slides, slides[0]!] : slides;
  const headline = sighting.title?.trim() || "Rat moment";
  const spoilerHidden = sighting.spoiler && !showSpoilers;
  const estimatedRats = estimateRatsForAppearance(sighting);
  const ratLine = formatApproximateRatLine(estimatedRats);
  const ratSlots = getRatPresenceSlots(estimatedRats);
  const slideWidth = imageWidth > 0 ? imageWidth : Math.max(1, Math.floor(viewportWidth - 32));
  const timestampPercent = parseTimestampPercent(sighting.timestamp);
  const timestampLine =
    timestampPercent === null ? sighting.timestamp : `${timestampPercent}% into film`;
  const markdownStyles = useMemo(
    () => ({
      body: { color: colors.text, fontSize: 14, lineHeight: 22, marginTop: 0, marginBottom: 0 },
      paragraph: {
        color: colors.text,
        fontSize: 14,
        lineHeight: 22,
        marginTop: 0,
        marginBottom: 6,
      },
      bullet_list: { marginTop: 2, marginBottom: 8 },
      ordered_list: { marginTop: 2, marginBottom: 8 },
      list_item: { marginTop: 0, marginBottom: 4 },
      strong: {
        color: colors.text,
        fontWeight: "700" as const,
      },
      em: {
        color: colors.text,
        fontStyle: "italic" as const,
      },
      link: {
        color: colors.accent,
        textDecorationLine: "underline" as const,
      },
      code_inline: {
        color: colors.text,
        backgroundColor: colors.chipActive,
      },
      fence: { color: contrastingForeground(colors.chipActive), backgroundColor: colors.chipActive },
      blockquote: {
        color: colors.textMuted,
        borderLeftColor: colors.border,
        borderLeftWidth: 3,
        paddingLeft: 10,
      },
    }),
    [colors],
  );
  const curatorNote = sighting.curatorNote?.trim() || "";

  useEffect(() => {
    setActiveImageIndex(0);
    setLoopInitialized(false);
  }, [slidesKey]);

  useEffect(() => {
    if (slides.length <= 1 || slideWidth <= 0 || loopInitialized) return;
    requestAnimationFrame(() => {
      carouselRef.current?.scrollTo({ x: slideWidth, animated: false });
      setLoopInitialized(true);
    });
  }, [slides.length, slideWidth, loopInitialized]);

  const onImageMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (imageWidth <= 0) return;
    if (slides.length <= 1) {
      setActiveImageIndex(0);
      return;
    }
    const rawIndex = Math.round(event.nativeEvent.contentOffset.x / imageWidth);
    if (rawIndex <= 0) {
      const target = slides.length;
      requestAnimationFrame(() => {
        carouselRef.current?.scrollTo({ x: target * imageWidth, animated: false });
      });
      setActiveImageIndex(slides.length - 1);
      return;
    }
    if (rawIndex >= slides.length + 1) {
      requestAnimationFrame(() => {
        carouselRef.current?.scrollTo({ x: imageWidth, animated: false });
      });
      setActiveImageIndex(0);
      return;
    }
    setActiveImageIndex(Math.max(0, Math.min(slides.length - 1, rawIndex - 1)));
  };

  return (
    <View style={styles.card}>
      {slides.length > 0 ? (
        <View style={styles.carouselFrame} onLayout={(e) => setImageWidth(Math.floor(e.nativeEvent.layout.width))}>
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            scrollEnabled={!spoilerHidden}
            directionalLockEnabled
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onImageMomentumEnd}
            scrollEventThrottle={16}
          >
            {carouselSlides.map((slide, index) => (
              <View key={`${sighting.id}:${slide.url}:${index}`} style={{ width: slideWidth }}>
                <Image
                  source={{ uri: slide.url }}
                  style={[styles.image, { width: slideWidth }]}
                  accessibilityLabel={slide.alt ?? sighting.title ?? "Sighting still"}
                  recyclingKey={`${sighting.id}:${slide.url}`}
                  blurRadius={spoilerHidden ? 48 : 0}
                />
              </View>
            ))}
          </ScrollView>
          {slides.length > 1 && !spoilerHidden ? (
            <View style={styles.dotsWrap}>
              {slides.map((slide, index) => (
                <View key={`${slide.url}:${index}`} style={[styles.dot, index === activeImageIndex && styles.dotOn]} />
              ))}
            </View>
          ) : null}
          {!spoilerHidden && slides.length > 0 && onOpenImagePreview ? (
            <View style={styles.previewBtnWrap}>
              <Pressable
                style={({ pressed }) => [styles.previewBtn, pressed && { opacity: 0.9 }]}
                onPress={() => onOpenImagePreview(slides, activeImageIndex)}
                accessibilityRole="button"
                accessibilityLabel="Open image preview"
              >
                <Text style={styles.previewBtnText}>View image</Text>
              </Pressable>
            </View>
          ) : null}
          {spoilerHidden ? (
            <View style={styles.spoilerImageOverlay} pointerEvents="none">
              <View style={styles.spoilerImageTextWrap}>
                <Text style={styles.spoilerImageTitle}>Spoiler warning</Text>
                <Text style={styles.spoilerImageNote}>Turn on Show spoilers to view these images.</Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            {spoilerHidden ? (
              <View style={[styles.redactLineStack, styles.redactTitleStripe]} pointerEvents="none">
                <View style={styles.redactBar} />
              </View>
            ) : (
              <Text style={styles.title}>{headline}</Text>
            )}
          </View>
          {sighting.spoiler ? (
            <View style={styles.spoilerBadge}>
              <Text style={styles.spoilerText}>Spoiler</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.contentBlock, spoilerHidden && styles.contentBlockRedacted]}>
          {spoilerHidden ? (
            <View style={styles.redactLineStack} pointerEvents="none">
              <View style={styles.redactBar} />
              <View style={styles.redactBar} />
              <View style={[styles.redactBar, styles.redactBarShort]} />
            </View>
          ) : (
            <Markdown style={markdownStyles}>{sighting.description}</Markdown>
          )}
        </View>
        <View style={styles.footerBlock}>
          <View style={styles.row}>
            <View style={styles.ratMeterRow}>
              {Array.from({ length: MAX_RAT_SLOTS }).map((_, index) => (
                <Text key={index} style={[styles.ratMeterGlyph, index >= ratSlots && styles.ratMeterGlyphOff]}>
                  🐀
                </Text>
              ))}
            </View>
            <Text style={styles.ratLine}>{ratLine}</Text>
            <View style={[styles.timestampTag, { marginLeft: "auto" }]}>
              <Text style={styles.timestampTagText}>{timestampLine}</Text>
            </View>
          </View>
          {sighting.submitterName ? (
            <Text style={styles.submitter}>Submitted by {sighting.submitterName}</Text>
          ) : null}
          {curatorNote ? (
            <View style={styles.curatorNoteCard}>
              <Text style={styles.curatorNoteLabel}>Curator note</Text>
              <Text style={styles.curatorNoteText}>{curatorNote}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
