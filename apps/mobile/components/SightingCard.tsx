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
  const sectionDivider = colors.mode === "dark" ? colors.dividerStrong : dividerBorder;
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
    body: { paddingHorizontal: 18, paddingVertical: 18, gap: 6 },
    row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    tagCloudRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    titleContent: { minWidth: 0, flex: 1 },
    timestampTag: {
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: dividerBorder,
      backgroundColor: colors.chipActive,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    timestampTagText: { color: colors.textMuted, fontSize: 12.5, fontWeight: "700" },
    episodeTag: {
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accent,
      backgroundColor: colors.panel,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    episodeTagText: { color: colors.accent, fontSize: 12.5, fontWeight: "800" },
    spoilerBadge: {
      backgroundColor: colors.dangerBg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    spoilerText: { color: colors.dangerText, fontSize: 12, fontWeight: "600" },
    title: { color: colors.text, fontSize: 20, fontWeight: "700", lineHeight: 26 },
    redactLineStack: {
      gap: 8,
    },
    /** Single title-height redaction stripe (approx one line of title text). */
    redactTitleStripe: {
      marginTop: 0,
      marginBottom: 2,
      maxWidth: "92%",
    },
    redactBar: {
      height: 12,
      borderRadius: 5,
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
    ratTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: dividerBorder,
      backgroundColor: colors.panelMuted,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    ratTagText: { color: colors.textMuted, fontSize: 12.5, fontWeight: "700" },
    desc: { color: colors.text, fontSize: 15, lineHeight: 22 },
    submitter: { color: colors.textMuted, fontSize: 13, fontStyle: "italic", marginBottom: 6 },
    curatorNoteDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: sectionDivider,
      marginTop: 0,
      marginBottom: 8,
    },
    curatorNoteText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "500",
    },
    contentBlock: {
      paddingTop: 0,
      gap: 2,
    },
    /** Match vertical padding above/below redacted body lines vs surrounding rows */
    contentBlockRedacted: {
      paddingTop: 6,
      paddingBottom: 6,
    },
    footerBlock: {
      marginTop: 0,
      paddingTop: 10,
      gap: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: sectionDivider,
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

function formatEpisodeContext(sighting: SightingPublic): string | undefined {
  if (sighting.imdbKind !== "series") return undefined;
  const s = sighting.seasonNumber;
  const e = sighting.episodeNumber;
  if (!Number.isFinite(s) || !Number.isFinite(e) || !s || !e) return undefined;
  const code = `S${s}E${e}`;
  const title = sighting.episodeTitle?.trim();
  return title ? `${code} · ${title}` : code;
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
  const episodeContext = formatEpisodeContext(sighting);
  const timestampLine =
    timestampPercent === null
      ? sighting.timestamp
      : `${timestampPercent}% into ${sighting.imdbKind === "series" ? "episode" : "film"}`;
  const markdownStyles = useMemo(
    () => ({
      body: { color: colors.text, fontSize: 16, lineHeight: 24, marginTop: 0, marginBottom: 0 },
      paragraph: {
        color: colors.text,
        fontSize: 16,
        lineHeight: 24,
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
          <View style={styles.titleContent}>
            {spoilerHidden ? (
              <View style={[styles.redactLineStack, styles.redactTitleStripe]} pointerEvents="none">
                <View style={styles.redactBar} />
              </View>
            ) : (
              <Text style={styles.title}>{headline}</Text>
            )}
          </View>
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
        {sighting.submitterName ? <Text style={styles.submitter}>Submitted by {sighting.submitterName}</Text> : null}
        <View style={styles.footerBlock}>
          <View style={styles.tagCloudRow}>
            <View style={styles.ratTag}>
              <View style={styles.ratMeterRow}>
                {Array.from({ length: ratSlots }).map((_, index) => (
                  <Text key={index} style={styles.ratMeterGlyph}>
                    🐀
                  </Text>
                ))}
              </View>
              <Text style={styles.ratTagText}>{ratLine}</Text>
            </View>
            {episodeContext ? (
              <View style={styles.episodeTag}>
                <Text style={styles.episodeTagText} numberOfLines={1}>
                  {episodeContext}
                </Text>
              </View>
            ) : null}
            <View style={styles.timestampTag}>
              <Text style={styles.timestampTagText}>{timestampLine}</Text>
            </View>
            {sighting.spoiler ? (
              <View style={styles.spoilerBadge}>
                <Text style={styles.spoilerText}>Spoiler</Text>
              </View>
            ) : null}
          </View>
          {curatorNote ? (
            <>
              <View style={styles.curatorNoteDivider} />
              <Text style={styles.curatorNoteText}>
                <Text style={{ fontWeight: "800" }}>From the curator: </Text>
                {curatorNote}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}
