import { openURL } from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { HeaderHeightContext } from "@react-navigation/elements";
import { Stack, router, useLocalSearchParams, useNavigation } from "expo-router";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
} from "react";
import {
  ActivityIndicator,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { AppToast } from "../../components/AppToast";
import { EmptyStateCard } from "../../components/EmptyStateCard";
import { HeaderThemeWordmark } from "../../components/HeaderThemeWordmark";
import { SightingCard } from "../../components/SightingCard";
import { fetchMovieDetail, formatApiError } from "../../lib/api";
import { stackMinimalHeaderLeft } from "../../lib/stackMinimalHeaderLeft";
import { extractChromeFromPosterUri } from "../../lib/posterChromeFromImage";
import {
  contrastingForeground,
  movieHeroHeaderChrome,
  mixTowardHex,
  posterToneToHex,
  relativeLuminance,
} from "../../lib/posterTone";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ThemeColors, useTheme } from "../../lib/theme";
import type { MovieDetailResponse, MovieSightingsSort, SightingPublic } from "../../lib/types";

type TabKey = "sightings" | "facts" | "reviews" | "related" | "media" | "meta";
type ReviewSortKey = "latest" | "highest" | "lowest";

const TAB_DEFS: { key: TabKey; label: string }[] = [
  { key: "sightings", label: "Featured Rats" },
  { key: "facts", label: "Rat Facts" },
  { key: "reviews", label: "Reviews" },
  { key: "related", label: "Related" },
  { key: "media", label: "Media" },
  { key: "meta", label: "Meta" },
];
function resolveHeaderBannerUrl(movie: NonNullable<MovieDetailResponse["movie"]>): string {
  return movie.headerBanner?.trim() || movie.posterUrl;
}

function trimMetaValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readSeriesYearRange(snapshot: Record<string, unknown> | undefined): string | undefined {
  const raw =
    typeof snapshot?.Year === "string"
      ? snapshot.Year
      : typeof snapshot?.year === "string"
        ? snapshot.year
        : "";
  const cleaned = raw.trim();
  if (!cleaned) return undefined;
  return cleaned.replace("-", "–");
}

function readSeriesTotalSeasons(snapshot: Record<string, unknown> | undefined): number | undefined {
  const raw = snapshot?.totalSeasons ?? snapshot?.TotalSeasons;
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return n;
}

function isSeriesMovie(movie: NonNullable<MovieDetailResponse["movie"]>): boolean {
  const snapshot =
    movie.metadata && typeof movie.metadata.syncSnapshot === "object"
      ? (movie.metadata.syncSnapshot as Record<string, unknown>)
      : undefined;
  const typeRaw =
    typeof snapshot?.Type === "string" ? snapshot.Type.trim().toLowerCase() : "";
  if (typeRaw === "series") return true;
  return false;
}

function formatReviewDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return value;
  }
}

function sortReviews(
  reviews: NonNullable<MovieDetailResponse["tabs"]>["reviews"],
  sort: ReviewSortKey,
) {
  const copy = [...reviews];
  if (sort === "latest") {
    return copy.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }
  if (sort === "highest") {
    return copy.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  }
  return copy.sort((a, b) => (a.rating ?? 11) - (b.rating ?? 11));
}

function splitCreditNames(line: string): string[] {
  return line
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getImdbNameSearchUrl(name: string): string {
  const stripped = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const q = stripped.length > 0 ? stripped : name.trim();
  return `https://www.imdb.com/find/?q=${encodeURIComponent(q)}&s=nm`;
}

/** List thumbnail: scales to meta section width, caps height. */
function computeStillThumbHeight(
  screenWidth: number,
  im?: { width?: number; height?: number },
  horizontalInsetPx = 28,
): number {
  const contentW = Math.max(1, screenWidth - horizontalInsetPx);
  const maxH = 280;
  const w = im?.width;
  const h = im?.height;
  if (typeof w === "number" && typeof h === "number" && w > 0 && h > 0) {
    const scaled = contentW * (h / w);
    return Math.min(maxH, Math.max(140, Math.round(scaled)));
  }
  return Math.min(maxH, Math.round(contentW * (9 / 16)));
}

/** Fullscreen stills lightbox: always dark chrome, even when the app is in light mode. */
const MEDIA_LIGHTBOX = {
  background: "#0c0a09",
  captionBg: "rgba(12,10,9,0.94)",
  captionBorder: "rgba(254,243,199,0.15)",
  text: "#f5f5f4",
  closeIcon: "#f5f5f4",
} as const;

/** iOS movie hero: fixed inset below transparent header (long-standing catalog layout feel). */
const IOS_MOVIE_HERO_TOP_INSET_PX = 136;
const MOVIE_PREFS_KEY = "whererat.mobile.moviePrefs.v1";

/** Android only — gap under toolbar when deriving inset from measured bar height + safe area. */
const HERO_UNDER_TOOLBAR_GAP_ANDROID_PX = 28;

/** Android only — min toolbar height when measurement missing or unreliable. */
const HERO_MIN_TOOLBAR_FALLBACK_ANDROID_PX = 58;
const MOVIE_REFRESH_OFFSET = 56;
const IOS_PULL_REFRESH_TRIGGER = -88;

function liftDarkCustomColor(hex: string, minLuminance: number): string {
  const normalized = hex.trim();
  if (!/^#?[0-9a-f]{6}$/i.test(normalized)) return hex;
  const withHash = normalized.startsWith("#") ? normalized : `#${normalized}`;
  if (relativeLuminance(withHash) >= minLuminance) return withHash;
  let mixed = withHash;
  for (let i = 0; i < 8; i++) {
    mixed = mixTowardHex(mixed, "#ffffff", 0.12);
    if (relativeLuminance(mixed) >= minLuminance) break;
  }
  return mixed;
}

function createMovieStyles(colors: ThemeColors, heroTopInset: number) {
  const surface = colors.headerBg;
  /** Label/icon on poster-tinted `chipActive` (selected sheet rows, media segment). */
  const fgOnChip = contrastingForeground(colors.chipActive);
  /** Canvas behind sighting lists / meta only — sticky chrome stays `headerBg`. */
  const tabScrollCanvasBg = mixTowardHex(
    colors.headerBg,
    colors.panel,
    colors.mode === "dark" ? 0.22 : 0.072,
  );

  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: surface },
    fixedBackdrop: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.54,
    },
    fixedBackdropTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlayScrim,
    },
    /** Canvas: visible when overscrolling / pulling from top; slightly darker than sticky chrome. */
    scroll: { flex: 1, backgroundColor: tabScrollCanvasBg },
    scrollContent: { paddingBottom: 40, flexGrow: 1, position: "relative" },
    /** White body zone for all tab content — horizontal + top/bottom inset is shared across tabs. */
    scrollBodyPanel: {
      flexGrow: 1,
      backgroundColor: tabScrollCanvasBg,
      gap: 12,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 12,
      overflow: "hidden",
    },
    /** Matches default top inset even with sticky chrome (no double stack with section padding). */
    scrollBodyPanelTightTop: {
      paddingTop: 14,
    },
    /** Vertical stack for sibling cards/lists inside a tab (reviews, media videos, …). */
    tabContentStack: {
      alignSelf: "stretch",
      gap: 12,
    },
    /** Holds filter bars / media segment controls fixed under tab bar while list scrolls. */
    tabStickyChrome: {
      backgroundColor: colors.headerBg,
      padding: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.tabDivider,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      backgroundColor: surface,
    },
    muted: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
    errorText: { color: colors.text, textAlign: "center", marginBottom: 16 },
    primaryBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
    },
    primaryBtnText: { color: colors.retryOnAccent, fontWeight: "700" },
    hero: {
      position: "relative",
      marginBottom: 12,
      overflow: "hidden",
      backgroundColor: "transparent",
      minHeight: 170,
    },
    heroRow: {
      flexDirection: "row",
      gap: 24,
      paddingHorizontal: 16,
      paddingTop: heroTopInset,
      paddingBottom: 14,
      alignItems: "center",
    },
    poster: {
      width: 96,
      height: 144,
      borderRadius: 8,
      backgroundColor: colors.panel,
      shadowColor: colors.text,
      shadowOpacity: 0.26,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 7,
    },
    heroText: { flex: 1, alignItems: "flex-start", gap: 5 },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "800",
      lineHeight: 28,
      textShadowColor: colors.overlayScrim,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    meta: {
      color: colors.accent,
      fontWeight: "700",
      textShadowColor: colors.overlayScrim,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    genres: { color: colors.textMuted, opacity: 1 },
    heroStatsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-start",
      gap: 4,
      marginTop: 6,
    },
    heroStatChip: {
      backgroundColor: colors.chipActive,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.chipActiveOutline,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    heroStatChipText: {
      color: fgOnChip,
      fontSize: 11.5,
      fontWeight: "600",
      lineHeight: 14,
    },
    heroStatChipRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    heroStatChipIcon: { color: colors.accent },
    imdbBtn: {
      alignSelf: "flex-start",
      marginTop: 6,
      backgroundColor: colors.panel,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accent,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    imdbBtnText: { color: colors.text, fontWeight: "700" },
    imdbBtnIcon: { color: colors.text },
    heroTabsStrip: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingHorizontal: 0,
      paddingTop: 6,
      paddingBottom: 0,
      backgroundColor: colors.headerBg,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      overflow: "hidden",
    },
    heroTabsRow: {
      gap: 0,
      flexDirection: "row",
      paddingHorizontal: 10,
    },
    tabChip: {
      borderRadius: 0,
      paddingHorizontal: 14,
      paddingVertical: 14,
      backgroundColor: "transparent",
      borderWidth: 0,
      borderBottomWidth: 3,
      borderBottomColor: "transparent",
      minHeight: 50,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
    },
    tabChipOn: { borderBottomColor: colors.accent },
    tabChipText: { color: colors.text, opacity: 0.78, fontWeight: "600", fontSize: 14 },
    tabChipTextOn: { color: colors.accent, fontWeight: "800", opacity: 1 },
    section: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      marginHorizontal: 12,
      backgroundColor: colors.panel,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    sightingsSection: {
      flex: 1,
      alignSelf: "stretch",
      minHeight: 0,
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 0,
      gap: 12,
    },
    metaSection: {
      flex: 1,
      alignSelf: "stretch",
      minHeight: 0,
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 0,
      gap: 12,
    },
    sightingsList: {
      gap: 12,
    },
    sortRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 4,
    },
    filterBar: { flexDirection: "row", alignItems: "center", gap: 8 },
    tabSectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      alignSelf: "stretch",
    },
    filterSortBtn: {
      borderRadius: 9,
      borderWidth: 2,
      borderColor: colors.inputBorder,
      backgroundColor: colors.panel,
      paddingHorizontal: 10,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
      minHeight: 44,
    },
    /** Label + current value flex; chevron aligns trailing (matches catalog `chevron-down`). */
    filterSortBtnMain: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minWidth: 0,
    },
    filterSortBtnFull: { width: "100%" },
    filterSortBtnLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
    filterSortBtnText: { color: colors.text, fontSize: 12.5, fontWeight: "700", flex: 1, minWidth: 0 },
    sortSelect: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: 170,
      maxWidth: "75%",
      backgroundColor: colors.panel,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: colors.inputBorder,
      paddingHorizontal: 11,
      paddingVertical: 9,
      gap: 8,
    },
    sortLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
    sortSelectText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
      flexShrink: 1,
    },
    sortSelectChevron: { flexShrink: 0, marginLeft: 6 },
    loadingMoreWrap: {
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingCenterWrap: {
      flex: 1,
      minHeight: 220,
      alignItems: "center",
      justifyContent: "center",
    },
    refreshNativeLikeWrap: {
      alignSelf: "stretch",
      minHeight: 30,
      justifyContent: "center",
      marginTop: 10,
      marginBottom: 8,
      alignItems: "center",
    },
    sheetBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlayScrim,
    },
    sheetCenterOuter: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      paddingHorizontal: 16,
      pointerEvents: "box-none",
    },
    sheetCard: {
      backgroundColor: colors.panel,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.inputBorder,
      paddingVertical: 8,
      pointerEvents: "auto",
      overflow: "hidden",
    },
    sheetTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
      paddingHorizontal: 14,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      marginBottom: 2,
    },
    sheetRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 14,
      gap: 10,
    },
    sheetRowOn: { backgroundColor: colors.chipActive },
    sheetRowText: { flex: 1, color: colors.textMuted, fontSize: 15, fontWeight: "500" },
    sheetRowTextOn: { color: fgOnChip, fontWeight: "700" },
    sheetCheck: { color: fgOnChip, fontWeight: "800" },
    factCard: {
      padding: 12,
      borderRadius: 10,
      backgroundColor: colors.panel,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: 6,
    },
    factCardTitle: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    factText: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
    reviewCard: {
      padding: 12,
      borderRadius: 10,
      backgroundColor: colors.panel,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: 7,
    },
    reviewCardTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10,
    },
    reviewTitleStack: {
      flex: 1,
      minWidth: 0,
      gap: 6,
    },
    reviewRatCorner: { fontSize: 20, lineHeight: 22, paddingTop: 1 },
    reviewStars: { flexDirection: "row", alignItems: "center", gap: 3, flexWrap: "wrap" },
    reviewStarOn: { color: colors.accent, fontSize: 15 },
    reviewStarOff: { color: colors.border, fontSize: 15 },
    reviewRatingText: { color: colors.textMuted, fontSize: 13, fontWeight: "700", marginLeft: 5 },
    readMoreBtn: { alignSelf: "flex-start", marginTop: 2 },
    readMoreText: { color: colors.accent, fontSize: 12, fontWeight: "700" },
    reviewAuthor: { color: colors.text, fontSize: 13, fontWeight: "700" },
    reviewDate: { color: colors.textMuted, fontSize: 12.5 },
    reviewSummary: { color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: "800" },
    reviewMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 2,
    },
    reviewBody: { color: colors.textMuted, lineHeight: 22 },
    relatedListRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    relatedListPoster: { width: 52, height: 78, borderRadius: 6, backgroundColor: colors.panel },
    relatedPosterPh: { alignItems: "center", justifyContent: "center" },
    relatedPosterPhText: { color: colors.textMuted, fontSize: 18 },
    relatedListTextCol: { flex: 1, minWidth: 0, gap: 4 },
    relatedListTitle: { color: colors.text, fontSize: 17, fontWeight: "700", lineHeight: 22 },
    relatedListMeta: { color: colors.textMuted, fontSize: 14 },
    relatedListRatingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
    relatedListRatingIcon: { color: colors.accent },
    relatedListRatingText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
    relatedListWrap: {
      alignSelf: "stretch",
      paddingHorizontal: 2,
      paddingTop: 2,
      paddingBottom: 2,
    },
    relatedTitle: { color: colors.text, fontWeight: "700", fontSize: 16 },
    videoRow: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      paddingVertical: 4,
    },
    videoThumb: { width: 120, height: 68, borderRadius: 6, backgroundColor: colors.panel },
    videoOpenBtn: {
      flexShrink: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 9,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accent,
      backgroundColor: colors.panel,
    },
    videoOpenBtnText: { color: colors.accent, fontSize: 12, fontWeight: "800" },
    mediaSegmentBar: {
      flexDirection: "row",
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.inputBorder,
      overflow: "hidden",
      alignSelf: "stretch",
    },
    mediaSegmentSlot: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.panelMuted,
    },
    mediaSegmentSlotOn: { backgroundColor: colors.accent },
    mediaSegmentSlotText: { fontSize: 14, fontWeight: "600", color: colors.textMuted },
    mediaSegmentSlotTextOn: { fontWeight: "800", color: "#ffffff" },
    mediaStillsColumn: {
      alignSelf: "stretch",
      gap: 12,
    },
    mediaStillCard: {
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: colors.panel,
      alignSelf: "stretch",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    mediaStillImage: { width: "100%", height: "100%" },
    mediaLightboxRoot: { flex: 1, backgroundColor: MEDIA_LIGHTBOX.background },
    mediaLightboxClose: {
      position: "absolute",
      right: 12,
      zIndex: 2,
      padding: 10,
    },
    mediaLightboxImageSlot: {
      flex: 1,
      minHeight: 0,
      justifyContent: "center",
      paddingHorizontal: 0,
    },
    mediaLightboxPager: { flex: 1 },
    mediaLightboxSlide: { justifyContent: "center", alignItems: "center" },
    mediaLightboxCaptionWrap: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 10,
      backgroundColor: MEDIA_LIGHTBOX.captionBg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: MEDIA_LIGHTBOX.captionBorder,
    },
    mediaLightboxCaption: {
      color: MEDIA_LIGHTBOX.text,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
    },
    mediaLightboxNavBtn: {
      position: "absolute",
      marginTop: -22,
      zIndex: 2,
      width: 44,
      height: 44,
      borderRadius: 999,
      backgroundColor: "rgba(12,10,9,0.7)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(254,243,199,0.28)",
    },
    mediaLightboxNavBtnLeft: { left: 12 },
    mediaLightboxNavBtnRight: { right: 12 },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingTop: 5,
      paddingBottom: 15,
    },
    metaLabel: { color: colors.textMuted, fontSize: 13.5, fontWeight: "700", width: 118, lineHeight: 20 },
    metaValue: {
      color: colors.text,
      fontSize: 14.5,
      fontWeight: "600",
      flex: 1,
      textAlign: "right",
      lineHeight: 21,
    },
    metaLink: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "700",
      textDecorationLine: "underline",
      textDecorationStyle: "solid",
      textDecorationColor: "#ea580c",
    },
    metaSynopsisWrap: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingTop: 5,
      paddingBottom: 15,
      gap: 6,
    },
    metaSynopsisBodyFull: {
      color: colors.text,
      fontSize: 13.5,
      fontWeight: "500",
      lineHeight: 20,
    },
    metaLinksWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-end",
      gap: 5,
      flex: 1,
    },
    metaPersonLink: {
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    metaPersonText: {
      color: colors.accent,
      fontSize: 13.5,
      fontWeight: "700",
      lineHeight: 20,
      textDecorationLine: "underline",
      textDecorationStyle: "solid",
      textDecorationColor: "#ea580c",
    },
  });
}

type MovieStyles = ReturnType<typeof createMovieStyles>;

function HeroBlock({
  movie,
  imdbTitleUrl,
  heroFg,
  heroAccent,
  styles,
}: {
  movie: NonNullable<MovieDetailResponse["movie"]>;
  imdbTitleUrl: string | undefined;
  heroFg: string;
  heroAccent: string;
  styles: MovieStyles;
}) {
  const contentRating =
    typeof movie.metadata?.rating === "string" ? movie.metadata.rating.trim() : "";
  const imdbStarRating =
    typeof movie.metadata?.imdbRating === "string" ? movie.metadata.imdbRating.trim() : "";
  const syncSnapshot =
    movie.metadata && typeof movie.metadata.syncSnapshot === "object"
      ? (movie.metadata.syncSnapshot as Record<string, unknown>)
      : undefined;
  const series = isSeriesMovie(movie);
  const metaLine = series
    ? [
        readSeriesYearRange(syncSnapshot) ?? String(movie.releaseYear),
        readSeriesTotalSeasons(syncSnapshot)
          ? `${readSeriesTotalSeasons(syncSnapshot)} ${readSeriesTotalSeasons(syncSnapshot) === 1 ? "season" : "seasons"}`
          : undefined,
        contentRating,
      ]
        .filter(Boolean)
        .join(" · ")
    : [String(movie.releaseYear), `${movie.runtimeMinutes} min`, contentRating]
        .filter(Boolean)
        .join(" · ");
  const statsBits: { key: string; label: string; imdb?: boolean }[] = [
    typeof movie.sightingCount === "number"
      ? {
          key: "sightings",
          label: `${movie.sightingCount} sighting${movie.sightingCount === 1 ? "" : "s"}`,
        }
      : null,
    typeof movie.approxRatsOnScreen === "number"
      ? {
          key: "rats-on-screen",
          label: `${movie.approxRatsOnScreen} rat${movie.approxRatsOnScreen === 1 ? "" : "s"} on screen`,
        }
      : null,
    imdbStarRating
      ? {
          key: "imdb",
          label: `IMDb ${imdbStarRating}`,
          imdb: true,
        }
      : null,
  ].filter((bit): bit is { key: string; label: string; imdb?: boolean } => Boolean(bit));
  const heroSubtitle = mixTowardHex(heroFg, heroAccent, 0.2);
  const heroMuted = mixTowardHex(heroFg, heroAccent, 0.32);

  return (
    <View style={styles.hero}>
      <View style={styles.heroRow}>
        <View style={styles.heroText}>
          <Text
            style={[
              styles.title,
              { color: heroFg },
            ]}
          >
            {movie.title}
          </Text>
          <Text style={[styles.meta, { color: heroSubtitle }]}>{metaLine}</Text>
          <Text style={[styles.genres, { color: heroMuted, opacity: 1 }]} numberOfLines={2}>
            {movie.genres.join(" · ")}
          </Text>
          {statsBits.length ? (
            <View style={styles.heroStatsRow}>
              {statsBits.map((bit) => (
                <View key={bit.key} style={styles.heroStatChip}>
                  <View style={styles.heroStatChipRow}>
                    {bit.imdb ? <Ionicons name="star" size={12} style={styles.heroStatChipIcon} /> : null}
                    <Text style={styles.heroStatChipText}>{bit.label}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
          <Pressable
            style={styles.imdbBtn}
            onPress={() =>
              router.push({
                pathname: "/submit",
                params: {
                  prefill: "1",
                  imdbId: movie.externalIds.imdb,
                  title: movie.title,
                  year: String(movie.releaseYear),
                  kind: isSeriesMovie(movie) ? "series" : "movie",
                  posterUrl: movie.posterUrl,
                },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Add a sighting for ${movie.title}`}
            accessibilityHint="Opens submit form with this movie preselected"
          >
            <Ionicons name="add-circle-outline" size={15} style={styles.imdbBtnIcon} />
            <Text style={styles.imdbBtnText}>Add a sighting</Text>
          </Pressable>
        </View>
        <Image
          style={styles.poster}
          source={{ uri: movie.posterUrl }}
          accessibilityLabel={movie.posterAlt}
          recyclingKey={`${movie.id}:${movie.posterUrl}`}
        />
      </View>
    </View>
  );
}

function MovieTabsBar({
  tab,
  setTab,
  styles,
}: {
  tab: TabKey;
  setTab: (next: TabKey) => void;
  styles: MovieStyles;
}) {
  return (
    <View style={styles.heroTabsStrip}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heroTabsRow}>
        {TAB_DEFS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tabChip, active && styles.tabChipOn]}>
              <Text style={[styles.tabChipText, active && styles.tabChipTextOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function FilterSortBar({
  primaryLabel,
  primaryValue,
  onPressPrimary,
  secondaryLabel,
  secondaryValue,
  onPressSecondary,
  styles,
  chevronMutedColor,
}: {
  primaryLabel: string;
  primaryValue: string;
  onPressPrimary: () => void;
  secondaryLabel?: string;
  secondaryValue?: string;
  onPressSecondary?: () => void;
  styles: MovieStyles;
  chevronMutedColor: string;
}) {
  const hasSecondary =
    typeof secondaryLabel === "string" &&
    secondaryLabel.length > 0 &&
    typeof secondaryValue === "string" &&
    secondaryValue.length > 0 &&
    typeof onPressSecondary === "function";
  return (
    <View style={styles.filterBar}>
      <Pressable style={[styles.filterSortBtn, !hasSecondary && styles.filterSortBtnFull]} onPress={onPressPrimary}>
        <View style={styles.filterSortBtnMain}>
          <Text style={styles.filterSortBtnLabel}>{primaryLabel}</Text>
          <Text style={styles.filterSortBtnText} numberOfLines={1}>
            {primaryValue}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={18}
          color={chevronMutedColor}
          style={styles.sortSelectChevron}
        />
      </Pressable>
      {hasSecondary ? (
        <Pressable style={styles.filterSortBtn} onPress={onPressSecondary}>
          <View style={styles.filterSortBtnMain}>
            <Text style={styles.filterSortBtnLabel}>{secondaryLabel}</Text>
            <Text style={styles.filterSortBtnText} numberOfLines={1}>
              {secondaryValue}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={18}
            color={chevronMutedColor}
            style={styles.sortSelectChevron}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

function SortOptionsSheet<T extends string>({
  open,
  setOpen,
  title,
  options,
  activeValue,
  onSelect,
  styles,
}: {
  open: boolean;
  setOpen: Dispatch<boolean>;
  title: string;
  options: { value: T; label: string }[];
  activeValue: T;
  onSelect: (value: T) => void;
  styles: MovieStyles;
}) {
  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.sheetBackdrop} />
      <View style={styles.sheetCenterOuter}>
        <View style={styles.sheetCard}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map((opt) => {
            const on = activeValue === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  setOpen(false);
                  onSelect(opt.value);
                }}
                style={[styles.sheetRow, on && styles.sheetRowOn]}
              >
                <Text style={[styles.sheetRowText, on && styles.sheetRowTextOn]}>{opt.label}</Text>
                {on ? <Text style={styles.sheetCheck}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

/** Sticky under tab strip: sightings sort + spoilers (Featured Rats). */
function SightingsStickyChrome({
  sightings,
  activeSort,
  sortOptions,
  setSortOpen,
  showSpoilers,
  setShowSpoilers,
  styles,
  chevronMutedColor,
}: {
  sightings: SightingPublic[];
  activeSort: MovieSightingsSort;
  sortOptions: { value: MovieSightingsSort; label: string }[];
  setSortOpen: Dispatch<boolean>;
  showSpoilers: boolean;
  setShowSpoilers: Dispatch<boolean>;
  styles: MovieStyles;
  chevronMutedColor: string;
}) {
  const activeSortLabel = sortOptions.find((opt) => opt.value === activeSort)?.label ?? "Newest";
  const spoilerCount = sightings.filter((s) => s.spoiler).length;
  const [spoilerModeOpen, setSpoilerModeOpen] = useState(false);
  const spoilerMode = showSpoilers ? "shown" : "hidden";
  return (
    <View style={styles.tabStickyChrome}>
      <FilterSortBar
        primaryLabel="Sort"
        primaryValue={activeSortLabel}
        onPressPrimary={() => setSortOpen(true)}
        secondaryLabel={spoilerCount > 0 ? "Spoilers" : undefined}
        secondaryValue={
          spoilerCount > 0
            ? `${showSpoilers ? "Show all" : "Hide spoiler text"} (${spoilerCount})`
            : undefined
        }
        onPressSecondary={spoilerCount > 0 ? () => setSpoilerModeOpen(true) : undefined}
        styles={styles}
        chevronMutedColor={chevronMutedColor}
      />
      <SortOptionsSheet
        open={spoilerModeOpen}
        setOpen={setSpoilerModeOpen}
        title="Spoiler mode"
        options={[
          { value: "hidden", label: "Hide spoiler text" },
          { value: "shown", label: "Show all spoilers" },
        ]}
        activeValue={spoilerMode}
        onSelect={(value) => setShowSpoilers(value === "shown")}
        styles={styles}
      />
    </View>
  );
}

function ReviewsStickyChrome({
  reviews,
  reviewSort,
  reviewsRatOnly,
  setReviewSortOpen,
  setReviewFilterOpen,
  styles,
  chevronMutedColor,
}: {
  reviews: NonNullable<MovieDetailResponse["tabs"]["reviews"]>;
  reviewSort: ReviewSortKey;
  reviewsRatOnly: boolean;
  setReviewSortOpen: Dispatch<boolean>;
  setReviewFilterOpen: Dispatch<boolean>;
  styles: MovieStyles;
  chevronMutedColor: string;
}) {
  const ratCount = reviews.filter((r) => r.mentionsRat).length;
  const reviewSortOptions = [
    { value: "latest" as const, label: "Latest" },
    { value: "highest" as const, label: "Highest rated" },
    { value: "lowest" as const, label: "Lowest rated" },
  ];
  const activeReviewSortLabel =
    reviewSortOptions.find((opt) => opt.value === reviewSort)?.label ?? "Latest";

  return (
    <View style={styles.tabStickyChrome}>
      <FilterSortBar
        primaryLabel="Sort"
        primaryValue={activeReviewSortLabel}
        onPressPrimary={() => setReviewSortOpen(true)}
        secondaryLabel={ratCount > 0 ? "Filter" : undefined}
        secondaryValue={
          ratCount > 0
            ? reviewsRatOnly
              ? `Rat-only (${ratCount})`
              : `All reviews (${reviews.length})`
            : undefined
        }
        onPressSecondary={ratCount > 0 ? () => setReviewFilterOpen(true) : undefined}
        styles={styles}
        chevronMutedColor={chevronMutedColor}
      />
    </View>
  );
}

/** Sticky Stills / Videos switcher (media tab when both exist). */
function MediaSegmentStickyChrome({
  mediaSegment,
  setMediaSegment,
  stillsCount,
  videosCount,
  styles,
}: {
  mediaSegment: "stills" | "videos";
  setMediaSegment: Dispatch<"stills" | "videos">;
  stillsCount: number;
  videosCount: number;
  styles: MovieStyles;
}) {
  return (
    <View style={styles.tabStickyChrome}>
      <View style={styles.mediaSegmentBar}>
        <Pressable
          style={[styles.mediaSegmentSlot, mediaSegment === "stills" ? styles.mediaSegmentSlotOn : undefined]}
          onPress={() => setMediaSegment("stills")}
        >
          <Text
            style={[
              styles.mediaSegmentSlotText,
              mediaSegment === "stills" ? styles.mediaSegmentSlotTextOn : undefined,
            ]}
          >
            Stills ({stillsCount})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.mediaSegmentSlot, mediaSegment === "videos" ? styles.mediaSegmentSlotOn : undefined]}
          onPress={() => setMediaSegment("videos")}
        >
          <Text
            style={[
              styles.mediaSegmentSlotText,
              mediaSegment === "videos" ? styles.mediaSegmentSlotTextOn : undefined,
            ]}
          >
            Videos ({videosCount})
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SightingsSection({
  sightings,
  loadingInitial,
  loadingMore,
  sortOptions,
  activeSort,
  setSightSort,
  isSortOpen,
  setSortOpen,
  showSpoilers,
  onOpenImagePreview,
  sightingCardSurface,
  themeColors,
  styles,
}: {
  sightings: SightingPublic[];
  loadingInitial: boolean;
  loadingMore: boolean;
  sortOptions: { value: MovieSightingsSort; label: string }[];
  activeSort: MovieSightingsSort;
  setSightSort: (s: MovieSightingsSort) => void;
  isSortOpen: boolean;
  setSortOpen: Dispatch<boolean>;
  showSpoilers: boolean;
  onOpenImagePreview: (slides: { url: string; alt?: string }[], startIndex: number) => void;
  sightingCardSurface?: string;
  themeColors: ThemeColors;
  styles: MovieStyles;
}) {
  return (
    <View style={styles.sightingsSection}>
      {loadingInitial && sightings.length === 0 ? (
        <View style={styles.loadingCenterWrap}>
          <ActivityIndicator size="small" color={themeColors.accent} />
        </View>
      ) : sightings.length === 0 ? (
        <EmptyStateCard
          colors={themeColors}
          title="No sightings yet for this title."
          body="Catalog curators haven't published rat cameos here yet. Check back after the queue catches up."
        />
      ) : (
        <View style={styles.sightingsList}>
          {sightings.map((s) => (
            <SightingCard
              key={s.id}
              sighting={s}
              surfaceColor={sightingCardSurface}
              showSpoilers={showSpoilers}
              onOpenImagePreview={onOpenImagePreview}
            />
          ))}
        </View>
      )}
      {loadingMore ? (
        <View style={styles.loadingMoreWrap}>
          <ActivityIndicator size="small" color={themeColors.accent} />
        </View>
      ) : null}
      <SortOptionsSheet
        open={isSortOpen}
        setOpen={setSortOpen}
        title="Sort featured rats"
        options={sortOptions}
        activeValue={activeSort}
        onSelect={setSightSort}
        styles={styles}
      />
    </View>
  );
}

export default function MovieScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const { slug: rawSlug } = useLocalSearchParams<{ slug: string }>();
  const slug = useMemo(() => {
    const s = typeof rawSlug === "string" ? rawSlug : rawSlug?.[0];
    return decodeURIComponent(s ?? "").trim();
  }, [rawSlug]);

  const [tab, setTab] = useState<TabKey>("sightings");
  const [sightSort, setSightSort] = useState<MovieSightingsSort>("newest");
  const [isSortOpen, setSortOpen] = useState(false);
  const [reviewSort, setReviewSort] = useState<ReviewSortKey>("latest");
  const [reviewSortOpen, setReviewSortOpen] = useState(false);
  const [reviewFilterOpen, setReviewFilterOpen] = useState(false);
  const [reviewsRatOnly, setReviewsRatOnly] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [sightings, setSightings] = useState<SightingPublic[]>([]);
  const [sightPageMeta, setSightPageMeta] = useState({ page: 1, pageCount: 1, totalCount: 0 });
  const [loadingSightings, setLoadingSightings] = useState(false);
  const [loadingMoreSightings, setLoadingMoreSightings] = useState(false);

  const [data, setData] = useState<MovieDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const movie = data?.movie;

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const measuredHeaderHeight = useContext(HeaderHeightContext);
  const [mediaSegment, setMediaSegment] = useState<"stills" | "videos">("stills");
  const [mediaLightboxIndex, setMediaLightboxIndex] = useState<number | null>(null);
  const [mediaLightboxSlides, setMediaLightboxSlides] = useState<
    { id: string; url: string; caption?: string }[]
  >([]);
  const moviePrefsHydratedRef = useRef(false);

  useEffect(() => {
    let canceled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(MOVIE_PREFS_KEY);
        if (!raw || canceled) return;
        const parsed = JSON.parse(raw) as {
          sightSort?: MovieSightingsSort;
          reviewSort?: ReviewSortKey;
          reviewsRatOnly?: boolean;
          showSpoilers?: boolean;
        };
        if (
          parsed.sightSort === "newest" ||
          parsed.sightSort === "rats" ||
          parsed.sightSort === "appearance-early" ||
          parsed.sightSort === "appearance-late" ||
          parsed.sightSort === "episode"
        ) {
          setSightSort(parsed.sightSort);
        }
        if (
          parsed.reviewSort === "latest" ||
          parsed.reviewSort === "highest" ||
          parsed.reviewSort === "lowest"
        ) {
          setReviewSort(parsed.reviewSort);
        }
        if (typeof parsed.reviewsRatOnly === "boolean") {
          setReviewsRatOnly(parsed.reviewsRatOnly);
        }
        if (typeof parsed.showSpoilers === "boolean") {
          setShowSpoilers(parsed.showSpoilers);
        }
      } catch {
        // Ignore preference hydration errors and keep defaults.
      } finally {
        if (!canceled) moviePrefsHydratedRef.current = true;
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!moviePrefsHydratedRef.current) return;
    void AsyncStorage.setItem(
      MOVIE_PREFS_KEY,
      JSON.stringify({
        sightSort,
        reviewSort,
        reviewsRatOnly,
        showSpoilers,
      }),
    );
  }, [sightSort, reviewSort, reviewsRatOnly, showSpoilers]);

  const apiChromeFallback = useMemo(() => {
    if (!movie) return colors.headerBg;
    const paletteForMode = colors.mode === "dark" ? movie.pagePaletteDark : movie.pagePalette;
    const apiPaletteChrome =
      typeof paletteForMode?.heroBloom === "string" ? paletteForMode.heroBloom.trim() : "";
    if (apiPaletteChrome) {
      return liftDarkCustomColor(
        apiPaletteChrome,
        colors.mode === "dark" ? 0.1 : 0.16,
      );
    }
    return posterToneToHex(movie.posterTone, colors.headerBg);
  }, [movie, colors.headerBg, colors.mode]);

  /** From poster bitmap via `react-native-image-colors`; null until extracted or skip. */
  const [posterChromeHex, setPosterChromeHex] = useState<string | null>(null);

  useEffect(() => {
    if (!movie?.posterUrl?.trim()) {
      setPosterChromeHex(null);
      return;
    }
    let canceled = false;
    setPosterChromeHex(null);

    void extractChromeFromPosterUri(movie.posterUrl, {
      fallback: apiChromeFallback,
      cacheKey: `${movie.slug}:${movie.posterUrl}`,
    }).then((hex) => {
      if (!canceled && hex) setPosterChromeHex(hex);
    });

    return () => {
      canceled = true;
    };
  }, [movie?.posterUrl, movie?.slug, apiChromeFallback]);

  const movieBar = useMemo(() => {
    if (!movie) return null;
    const bg = posterChromeHex ?? apiChromeFallback;
    const { fg, statusBar } = movieHeroHeaderChrome(bg, colors.mode);
    return { bg, fg, status: statusBar };
  }, [movie, posterChromeHex, apiChromeFallback, colors.mode]);

  const movieThemeColors = useMemo(() => {
    const p = colors.mode === "dark" ? movie?.pagePaletteDark : movie?.pagePalette;
    const rawAccent = typeof p?.accent === "string" ? p.accent.trim() : "";
    const accent = rawAccent
      ? liftDarkCustomColor(rawAccent, colors.mode === "dark" ? 0.2 : 0.16)
      : "";
    if (!p || !accent) return colors;
    /** Segment / sheet-selected surfaces follow poster accent instead of global `chipActive`. */
    const chipActive =
      colors.mode === "dark"
        ? mixTowardHex(accent, colors.panel, 0.7)
        : mixTowardHex(accent, colors.panelMuted, 0.76);
    return {
      ...colors,
      accent,
      chipActive,
    };
  }, [colors, movie?.pagePalette, movie?.pagePaletteDark, colors.mode]);

  /** Native stack merges options oddly with iOS 26 scroll chrome; set here so poster headers update reliably. */
  useLayoutEffect(() => {
    const sceneBgChrome = movieThemeColors.headerBg;
    const fgChrome = movieBar?.fg ?? movieThemeColors.accent;
    const statusChrome = movieBar?.status ?? movieThemeColors.statusBarStyle;
    const next: NativeStackNavigationOptions = {
      title: movie?.title ?? "Movie",
      headerTitleAlign: "center",
      headerTitle: () => <HeaderThemeWordmark wordmarkColor={fgChrome} />,
      headerStyle: { backgroundColor: "transparent" },
      headerTransparent: true,
      /** Toolbar/back tint; wordmark stays `fgChrome` for contrast on the poster. */
      headerTintColor: movieThemeColors.headerToolbarIcon,
      headerShadowVisible: false,
      headerBackButtonDisplayMode: "minimal",
      headerLeft: stackMinimalHeaderLeft(() => navigation.goBack()),
      contentStyle: { backgroundColor: sceneBgChrome },
      statusBarStyle: statusChrome,
    };
    if (Platform.OS === "ios") {
      next.headerBlurEffect = "none";
      next.scrollEdgeEffects = {
        top: "hidden",
        bottom: "hidden",
        left: "hidden",
        right: "hidden",
      };
    }
    navigation.setOptions(next);
  }, [
    navigation,
    movie?.title,
    movieBar,
    movieThemeColors.headerBg,
    movieThemeColors.accent,
    movieThemeColors.headerToolbarIcon,
    movieThemeColors.statusBarStyle,
  ]);

  const heroTopInset = useMemo(() => {
    if (Platform.OS === "ios") {
      return IOS_MOVIE_HERO_TOP_INSET_PX;
    }
    const minBar = HERO_MIN_TOOLBAR_FALLBACK_ANDROID_PX;
    const measured = measuredHeaderHeight;
    const plausible = measured != null && measured >= minBar * 0.55;
    const barH = plausible ? Math.max(measured, minBar) : minBar;
    return Math.round(insets.top + barH + HERO_UNDER_TOOLBAR_GAP_ANDROID_PX);
  }, [insets.top, measuredHeaderHeight]);

  const styles = useMemo(
    () => createMovieStyles(movieThemeColors, heroTopInset),
    [movieThemeColors, heroTopInset],
  );
  const sightingCardSurface = useMemo(() => {
    if (movieThemeColors.mode !== "dark") return undefined;
    return mixTowardHex(movieThemeColors.headerBg, movieThemeColors.panel, 0.42);
  }, [movieThemeColors.mode, movieThemeColors.headerBg, movieThemeColors.panel]);

  const load = useCallback(async () => {
    if (!slug) return;
    const slugSnap = decodeURIComponent(slug).trim();
    const sortSnap = sightSort;
    const pageSnap = 1;
    setError(null);
    setLoadingSightings(true);
    try {
      const res = await fetchMovieDetail({
        slug,
        sort: sortSnap,
        page: pageSnap,
      });

      const routeUnchanged = decodeURIComponent(slug).trim() === slugSnap && sightSort === sortSnap;
      if (!routeUnchanged) return;

      if (res.movie.slug.trim().toLowerCase() !== slugSnap.toLowerCase()) {
        setError("Movie data does not match this page.");
        setData(null);
        return;
      }

      setData(res);
      setSightSort(res.featuredRats.sort);
      setSightings(res.featuredRats.sightings);
      setSightPageMeta({
        page: res.featuredRats.page,
        pageCount: res.featuredRats.pageCount,
        totalCount: res.featuredRats.totalCount,
      });
    } catch (e) {
      if (decodeURIComponent(slug).trim() === slugSnap && sightSort === sortSnap) {
        setError(formatApiError(e));
        setData(null);
        setSightings([]);
        setSightPageMeta({ page: 1, pageCount: 1, totalCount: 0 });
      }
    } finally {
      if (decodeURIComponent(slug).trim() === slugSnap && sightSort === sortSnap) {
        setLoadingSightings(false);
      }
      if (decodeURIComponent(slug).trim() === slugSnap && sightSort === sortSnap) {
        setLoading(false);
      }
    }
  }, [slug, sightSort]);

  /** Sync reset before `load` runs so we never fetch the wrong page or flash the previous movie's art. */
  useLayoutEffect(() => {
    setData(null);
    setPosterChromeHex(null);
    setError(null);
    setLoading(true);
    setSightings([]);
    setSightPageMeta({ page: 1, pageCount: 1, totalCount: 0 });
    setSortOpen(false);
  }, [slug]);

  useLayoutEffect(() => {
    setSightings([]);
    setSightPageMeta({ page: 1, pageCount: 1, totalCount: 0 });
    setLoadingSightings(true);
  }, [sightSort]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const onMovieScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (Platform.OS !== "ios") return;
      if (refreshing) return;
      if (event.nativeEvent.contentOffset.y <= IOS_PULL_REFRESH_TRIGGER) {
        void onRefresh();
      }
    },
    [onRefresh, refreshing],
  );

  const featured = data?.featuredRats;
  const tabs = data?.tabs;
  const heroBannerUrl = movie ? resolveHeaderBannerUrl(movie) : "";

  const sortOptions = useMemo(() => {
    if (!featured) return [] as { value: MovieSightingsSort; label: string }[];
    return (Object.keys(featured.sortLabels) as MovieSightingsSort[]).map((value) => ({
      value,
      label: featured.sortLabels[value],
    }));
  }, [featured]);

  const mediaImgsLen = tabs?.images?.length ?? 0;
  const mediaVidsLen = tabs?.videos?.length ?? 0;
  const lightboxImages = mediaLightboxSlides;
  const lightboxCaptionHeight = insets.bottom + 42;
  const lightboxImageTopInset = insets.top + 44;
  const lightboxImageAreaHeight = Math.max(
    120,
    windowHeight - lightboxImageTopInset - lightboxCaptionHeight,
  );
  const lightboxNavTop = lightboxImageTopInset + lightboxImageAreaHeight / 2;
  const stickySightingsChrome = Boolean(featured && tab === "sightings");
  const stickyReviewsChrome = tab === "reviews" && (tabs?.reviews?.length ?? 0) > 0;
  const stickyMediaChrome = tab === "media" && mediaImgsLen > 0 && mediaVidsLen > 0;
  const tabStickyChromeVisible = stickySightingsChrome || stickyReviewsChrome || stickyMediaChrome;

  const loadMoreSightings = useCallback(async () => {
    if (!slug || tab !== "sightings" || loading || refreshing || loadingMoreSightings) return;
    if (sightPageMeta.page >= sightPageMeta.pageCount) return;
    const nextPage = sightPageMeta.page + 1;
    setLoadingMoreSightings(true);
    try {
      const res = await fetchMovieDetail({ slug, sort: sightSort, page: nextPage });
      if (res.movie.slug.trim().toLowerCase() !== decodeURIComponent(slug).trim().toLowerCase()) return;
      setSightings((prev) => {
        const seen = new Set(prev.map((s) => s.id));
        const merged = [...prev];
        for (const s of res.featuredRats.sightings) {
          if (!seen.has(s.id)) merged.push(s);
        }
        return merged;
      });
      setSightPageMeta({
        page: res.featuredRats.page,
        pageCount: res.featuredRats.pageCount,
        totalCount: res.featuredRats.totalCount,
      });
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoadingMoreSightings(false);
    }
  }, [slug, tab, loading, refreshing, loadingMoreSightings, sightPageMeta, sightSort]);

  const onMainScroll = useCallback(
    (e: { nativeEvent: { layoutMeasurement: { height: number }; contentOffset: { y: number }; contentSize: { height: number } } }) => {
      if (tab !== "sightings") return;
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const remaining = contentSize.height - (contentOffset.y + layoutMeasurement.height);
      if (remaining < 220) void loadMoreSightings();
    },
    [tab, loadMoreSightings],
  );

  useEffect(() => {
    setMediaLightboxIndex(null);
    setMediaLightboxSlides([]);
  }, [slug]);

  useEffect(() => {
    if (tab !== "media") {
      setMediaLightboxIndex(null);
      setMediaLightboxSlides([]);
    }
  }, [tab]);

  useEffect(() => {
    const im = tabs?.images?.length ?? 0;
    const vi = tabs?.videos?.length ?? 0;
    if (!movie?.slug) return;
    if (im === 0 && vi > 0) setMediaSegment("videos");
    else setMediaSegment("stills");
  }, [movie?.slug, tabs?.images?.length, tabs?.videos?.length]);

  if (!slug) {
    return (
      <View style={[styles.center, { paddingHorizontal: 20 }]}>
        <EmptyStateCard
          colors={colors}
          title="That link looks a little gnawed."
          body="Missing movie slug — go back and pick a title from the catalog."
        />
      </View>
    );
  }

  return (
    <>
      {/* Options are pushed in `useLayoutEffect` above (poster chrome + iOS scroll-edge fixes). */}
      <Stack.Screen options={{ headerShown: true }} />
      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={movieThemeColors.accent} />
        </View>
      ) : null}

      {error && !data ? (
        <View style={[styles.center, { flex: 1 }]}>
          <EmptyStateCard
            colors={colors}
            title="Couldn’t load this title"
            body="Check your connection, then try again. You can also pull to refresh once the page opens."
          />
        </View>
      ) : null}

      {movie && tabs ? (
        <View style={styles.screen}>
          <Image
            source={{ uri: heroBannerUrl }}
            style={styles.fixedBackdrop}
            contentFit="cover"
            blurRadius={10}
            recyclingKey={`${movie.id}:fixed-bg:${heroBannerUrl}`}
            pointerEvents="none"
          />
          <View style={styles.fixedBackdropTint} pointerEvents="none" />
          <HeroBlock
            movie={movie}
            imdbTitleUrl={data.links.imdbTitle}
            heroFg={movieBar?.fg ?? contrastingForeground(movieBar?.bg ?? apiChromeFallback)}
            heroAccent={movieThemeColors.accent}
            styles={styles}
          />
          <MovieTabsBar tab={tab} setTab={setTab} styles={styles} />

          <View style={{ flex: 1, minHeight: 0, backgroundColor: movieThemeColors.headerBg }}>
            {stickySightingsChrome ? (
              <SightingsStickyChrome
                sightings={sightings}
                activeSort={sightSort}
                sortOptions={sortOptions}
                setSortOpen={setSortOpen}
                showSpoilers={showSpoilers}
                setShowSpoilers={setShowSpoilers}
                styles={styles}
                chevronMutedColor={movieThemeColors.textMuted}
              />
            ) : stickyReviewsChrome ? (
              <ReviewsStickyChrome
                reviews={tabs.reviews}
                reviewSort={reviewSort}
                reviewsRatOnly={reviewsRatOnly}
                setReviewSortOpen={setReviewSortOpen}
                setReviewFilterOpen={setReviewFilterOpen}
                styles={styles}
                chevronMutedColor={movieThemeColors.textMuted}
              />
            ) : stickyMediaChrome ? (
              <MediaSegmentStickyChrome
                mediaSegment={mediaSegment}
                setMediaSegment={setMediaSegment}
                stillsCount={mediaImgsLen}
                videosCount={mediaVidsLen}
                styles={styles}
              />
            ) : null}

            <ScrollView
              refreshControl={
                Platform.OS === "ios" ? undefined : (
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    progressViewOffset={MOVIE_REFRESH_OFFSET}
                    tintColor={movieThemeColors.mode === "dark" ? "#f8fafc" : movieThemeColors.accent}
                    colors={[movieThemeColors.mode === "dark" ? "#f8fafc" : movieThemeColors.accent]}
                    progressBackgroundColor={
                      movieThemeColors.mode === "dark"
                        ? "#334155"
                        : movieThemeColors.panel
                    }
                    titleColor={movieThemeColors.mode === "dark" ? "#f8fafc" : movieThemeColors.accent}
                  />
                )
              }
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              onScroll={onMainScroll}
              scrollEventThrottle={16}
              bounces
              alwaysBounceVertical
              onScrollEndDrag={onMovieScrollEndDrag}
            >
              {refreshing ? (
                <View style={styles.refreshNativeLikeWrap} pointerEvents="none">
                  <ActivityIndicator
                    size="small"
                    color={movieThemeColors.mode === "dark" ? "#f8fafc" : movieThemeColors.accent}
                  />
                </View>
              ) : null}
              <View
                style={[styles.scrollBodyPanel, tabStickyChromeVisible && styles.scrollBodyPanelTightTop]}
              >
              {tab === "sightings" && featured ? (
                <SightingsSection
                  sightings={sightings}
                  loadingInitial={loadingSightings}
                  loadingMore={loadingMoreSightings}
                  sortOptions={sortOptions}
                  activeSort={sightSort}
                  setSightSort={setSightSort}
                  isSortOpen={isSortOpen}
                  setSortOpen={setSortOpen}
                  showSpoilers={showSpoilers}
                  onOpenImagePreview={(slides, startIndex) => {
                    const mapped = slides.map((slide, idx) => ({
                      id: `sighting:${idx}:${slide.url}`,
                      url: slide.url,
                      caption: slide.alt,
                    }));
                    setMediaLightboxSlides(mapped);
                    setMediaLightboxIndex(
                      Math.max(0, Math.min(mapped.length - 1, startIndex)),
                    );
                  }}
                  sightingCardSurface={sightingCardSurface}
                  themeColors={movieThemeColors}
                  styles={styles}
                />
              ) : null}

              {tab === "facts" ? (
                <View style={styles.metaSection}>
                  {(tabs.facts?.length ?? 0) === 0 ? (
                    <EmptyStateCard
                      colors={movieThemeColors}
                      title="No rat facts yet"
                      body="IMDb trivia hasn't been synced for this title, or nothing rat-related turned up. Try again after a resync."
                    />
                  ) : (
                    tabs.facts!.map((line, i) => (
                      <View key={`${i}`} style={styles.factCard}>
                        <Text style={styles.factCardTitle}>Rat Fact #{i + 1}</Text>
                        <Text style={styles.factText}>{line}</Text>
                      </View>
                    ))
                  )}
                </View>
              ) : null}

              {tab === "meta" ? (
                <View style={styles.metaSection}>
                  {movie.summary.trim() ? (
                    <View style={styles.metaSynopsisWrap}>
                      <Text style={styles.metaLabel}>Synopsis</Text>
                      <Text style={styles.metaSynopsisBodyFull}>{movie.summary.trim()}</Text>
                    </View>
                  ) : null}
                  {[
                    ["Runtime", `${movie.runtimeMinutes} min`],
                    ["Rating", trimMetaValue(movie.metadata?.rating)],
                    ["IMDb", trimMetaValue(movie.metadata?.imdbRating)],
                    ["IMDb votes", trimMetaValue(movie.metadata?.imdbVotes)],
                    ["Metascore", trimMetaValue(movie.metadata?.metascore)],
                    ["Language", trimMetaValue(movie.metadata?.originalLanguage)],
                    [
                      "Countries",
                      Array.isArray(movie.metadata?.productionCountries)
                        ? movie.metadata.productionCountries
                            .map((c) => (typeof c === "string" ? c.trim() : ""))
                            .filter(Boolean)
                            .join(", ")
                        : "",
                    ],
                    ["Awards", trimMetaValue(movie.metadata?.awards)],
                  ]
                    .filter(([, value]) => Boolean(value))
                    .map(([label, value]) => (
                      <View key={label} style={styles.metaRow}>
                        <Text style={styles.metaLabel}>{label}</Text>
                        <Text style={styles.metaValue}>{value}</Text>
                      </View>
                    ))}
                  {(
                    [
                      { label: "Director", names: splitCreditNames(trimMetaValue(movie.metadata?.director)) },
                      { label: "Writers", names: splitCreditNames(trimMetaValue(movie.metadata?.writers)) },
                      { label: "Cast", names: splitCreditNames(trimMetaValue(movie.metadata?.cast)) },
                    ] as { label: string; names: string[] }[]
                  )
                    .filter((row) => row.names.length > 0)
                    .map((row) => (
                      <View key={row.label} style={styles.metaRow}>
                        <Text style={styles.metaLabel}>{row.label}</Text>
                        <View style={styles.metaLinksWrap}>
                          {row.names.map((name) => (
                            <Pressable
                              key={`${row.label}:${name}`}
                              style={styles.metaPersonLink}
                              onPress={() => void openURL(getImdbNameSearchUrl(name))}
                            >
                              <Text style={styles.metaPersonText}>{name}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    ))}
                </View>
              ) : null}

            {tab === "reviews" ? (
              <View style={styles.metaSection}>
                {(tabs.reviews?.length ?? 0) === 0 ? (
                  <EmptyStateCard
                    colors={movieThemeColors}
                    title="No reviews yet"
                    body="IMDb user reviews haven't been synced for this title yet. Pull to refresh, or browse reviews on IMDb."
                  />
                ) : (
                  (() => {
                    const all = tabs.reviews!;
                    const ratCount = all.filter((r) => r.mentionsRat).length;
                    const ordered = sortReviews(all, reviewSort);
                    const visible = reviewsRatOnly ? ordered.filter((r) => r.mentionsRat) : ordered;
                    const reviewSortOptions = [
                      { value: "latest" as const, label: "Latest" },
                      { value: "highest" as const, label: "Highest rated" },
                      { value: "lowest" as const, label: "Lowest rated" },
                    ];
                    return (
                      <>
                        <View style={styles.tabContentStack}>
                          {ratCount > 0 && reviewsRatOnly && visible.length === 0 ? (
                            <EmptyStateCard
                              expand={false}
                              colors={movieThemeColors}
                              title="No rat-tagged reviews"
                              body="Switch the filter to All reviews to see everything in the list."
                            />
                          ) : null}
                          {visible.map((r) => {
                            const isLong = (r.text?.length ?? 0) > 400;
                            const expanded = Boolean(expandedReviews[r.id]);
                            const bodyText = !isLong || expanded ? r.text : `${r.text.slice(0, 280).trimEnd()}...`;
                            const rating = typeof r.rating === "number" ? Math.max(0, Math.min(10, r.rating)) : null;
                            const filledStars =
                              rating === null ? 0 : Math.max(0, Math.min(5, Math.round(rating / 2)));
                            return (
                              <View key={r.id} style={styles.reviewCard}>
                              <View style={styles.reviewCardTopRow}>
                                <View style={styles.reviewTitleStack}>
                                  <Text style={styles.reviewSummary}>{r.summary}</Text>
                                  <View style={styles.reviewStars}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Ionicons
                                        key={i}
                                        name="star"
                                        style={i < filledStars ? styles.reviewStarOn : styles.reviewStarOff}
                                      />
                                    ))}
                                    {rating !== null ? (
                                      <Text style={styles.reviewRatingText}>{rating}/10</Text>
                                    ) : null}
                                  </View>
                                </View>
                                {r.mentionsRat ? (
                                  <Text
                                    style={styles.reviewRatCorner}
                                    accessibilityRole="image"
                                    accessibilityLabel="Review mentions rats"
                                  >
                                    🐀
                                  </Text>
                                ) : null}
                              </View>
                              <View style={styles.reviewMetaRow}>
                                <Text style={styles.reviewAuthor}>{r.author}</Text>
                                <Text style={styles.reviewDate}>{formatReviewDate(r.date)}</Text>
                              </View>
                              <Text style={styles.reviewBody}>{bodyText}</Text>
                              {isLong ? (
                                <Pressable
                                  style={styles.readMoreBtn}
                                  onPress={() =>
                                    setExpandedReviews((prev) => ({
                                      ...prev,
                                      [r.id]: !prev[r.id],
                                    }))
                                  }
                                >
                                  <Text style={styles.readMoreText}>
                                    {expanded ? "Show less ↑" : "Read more ↓"}
                                  </Text>
                                </Pressable>
                              ) : null}
                              </View>
                            );
                          })}
                        </View>
                        <SortOptionsSheet
                          open={reviewSortOpen}
                          setOpen={setReviewSortOpen}
                          title="Sort reviews"
                          options={reviewSortOptions}
                          activeValue={reviewSort}
                          onSelect={setReviewSort}
                          styles={styles}
                        />
                        <SortOptionsSheet
                          open={reviewFilterOpen}
                          setOpen={setReviewFilterOpen}
                          title="Review filter"
                          options={[
                            { value: "all", label: `All reviews (${all.length})` },
                            { value: "rat", label: `Rat-only (${ratCount})` },
                          ]}
                          activeValue={reviewsRatOnly ? "rat" : "all"}
                          onSelect={(value) => setReviewsRatOnly(value === "rat")}
                          styles={styles}
                        />
                      </>
                    );
                  })()
                )}
              </View>
            ) : null}

            {tab === "related" ? (
              <View style={styles.metaSection}>
                {(tabs.related?.length ?? 0) === 0 ? (
                  <EmptyStateCard
                    colors={movieThemeColors}
                    title="No related titles yet"
                    body="IMDb hasn't returned related titles for this movie yet. Check back after a catalog refresh."
                  />
                ) : (
                  <View style={styles.relatedListWrap}>
                    {tabs.related!.map((r) => (
                      <Pressable
                        key={r.id}
                        style={styles.relatedListRow}
                        onPress={() => void openURL(`https://www.imdb.com/title/${r.id}/`)}
                        accessibilityRole="link"
                        accessibilityHint="Opens this title on IMDb in your browser"
                        accessibilityLabel={`${r.title}${typeof r.year === "number" ? ` (${r.year})` : ""} on IMDb`}
                      >
                        {r.posterUrl ? (
                          <Image
                            source={{ uri: r.posterUrl }}
                            style={styles.relatedListPoster}
                            recyclingKey={`${movie.id}:related:${r.id}:${r.posterUrl}`}
                          />
                        ) : (
                          <View style={[styles.relatedListPoster, styles.relatedPosterPh]}>
                            <Text style={styles.relatedPosterPhText}>—</Text>
                          </View>
                        )}
                        <View style={styles.relatedListTextCol}>
                          <Text style={styles.relatedListTitle} numberOfLines={2}>
                            {r.title}
                          </Text>
                          {typeof r.year === "number" ? (
                            <Text style={styles.relatedListMeta}>{r.year}</Text>
                          ) : null}
                          {typeof r.rating === "number" ? (
                            <View style={styles.relatedListRatingRow}>
                              <Ionicons name="star" size={12} style={styles.relatedListRatingIcon} />
                              <Text style={styles.relatedListRatingText}>IMDb {r.rating}</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={styles.videoOpenBtn} pointerEvents="none" importantForAccessibility="no-hide-descendants">
                          <Ionicons name="open-outline" size={16} color={movieThemeColors.accent} />
                          <Text style={styles.videoOpenBtnText}>IMDB</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            {tab === "media" ? (
              <View style={styles.metaSection}>
                {(() => {
                  const vids = tabs.videos ?? [];
                  const imgs = tabs.images ?? [];
                  const hasVideos = vids.length > 0;
                  const hasImages = imgs.length > 0;
                  if (!hasVideos && !hasImages) {
                    return (
                      <EmptyStateCard
                        colors={movieThemeColors}
                        title="No media yet"
                        body="Photos and videos haven't synced from IMDb for this title. Pull to refresh, or open media on IMDb."
                      />
                    );
                  }
                  const showSegment = hasVideos && hasImages;
                  const showStills = hasImages && (!showSegment || mediaSegment === "stills");
                  const showVideos = hasVideos && (!showSegment || mediaSegment === "videos");
                  return (
                    <>
                      {showStills ? (
                        <View style={styles.mediaStillsColumn}>
                          {imgs.map((im) => (
                            <Pressable
                              key={im.id}
                              style={styles.mediaStillCard}
                              onPress={() => {
                                setMediaLightboxSlides(
                                  imgs.map((x) => ({
                                    id: x.id,
                                    url: x.url,
                                    caption: x.caption,
                                  })),
                                );
                                setMediaLightboxIndex(
                                  Math.max(0, imgs.findIndex((x) => x.id === im.id)),
                                );
                              }}
                            >
                              <View
                                style={{
                                  alignSelf: "stretch",
                                  width: "100%",
                                  height: computeStillThumbHeight(windowWidth, im),
                                }}
                              >
                                <Image
                                  source={{ uri: im.url }}
                                  style={styles.mediaStillImage}
                                  contentFit="cover"
                                  recyclingKey={`${movie.id}:still:${im.id}:${im.url}`}
                                />
                              </View>
                            </Pressable>
                          ))}
                        </View>
                      ) : null}
                      {showVideos ? (
                        <View style={styles.tabContentStack}>
                          {vids.map((v) => (
                            <Pressable
                              key={v.id}
                              style={styles.videoRow}
                              onPress={() => void openURL(`https://www.imdb.com/video/${v.id}/`)}
                              accessibilityRole="link"
                              accessibilityHint="Opens this trailer or clip on IMDb in your browser"
                              accessibilityLabel={`${v.name}, open on IMDb`}
                            >
                              {v.thumbnailUrl ? (
                                <Image
                                  source={{ uri: v.thumbnailUrl }}
                                  style={styles.videoThumb}
                                  recyclingKey={`${movie.id}:vid:${v.id}:${v.thumbnailUrl}`}
                                />
                              ) : (
                                <View style={[styles.videoThumb, styles.relatedPosterPh]}>
                                  <Text style={styles.relatedPosterPhText}>▶</Text>
                                </View>
                              )}
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={styles.relatedTitle} numberOfLines={2}>
                                  {v.name}
                                </Text>
                                <Text style={styles.muted}>{v.contentType ?? "Video"}</Text>
                              </View>
                              <View style={styles.videoOpenBtn} pointerEvents="none" importantForAccessibility="no-hide-descendants">
                                <Ionicons name="open-outline" size={16} color={movieThemeColors.accent} />
                                <Text style={styles.videoOpenBtnText}>IMDB</Text>
                              </View>
                            </Pressable>
                          ))}
                        </View>
                      ) : null}
                    </>
                  );
                })()}
              </View>
            ) : null}
              </View>
            </ScrollView>
          </View>
        </View>
      ) : null}
      <Modal
        visible={mediaLightboxIndex !== null}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setMediaLightboxIndex(null)}
      >
        <View style={[styles.mediaLightboxRoot, { paddingBottom: insets.bottom }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close fullscreen image"
            hitSlop={12}
            style={[styles.mediaLightboxClose, { top: insets.top + 6 }]}
            onPress={() => setMediaLightboxIndex(null)}
          >
            <Ionicons name="close" size={30} color={MEDIA_LIGHTBOX.closeIcon} />
          </Pressable>
          <View style={[styles.mediaLightboxImageSlot, { paddingTop: insets.top + 44 }]}>
            {lightboxImages.length > 0 && mediaLightboxIndex !== null ? (
              <>
                <ScrollView
                  key={`lightbox:${movie?.id ?? "movie"}:${mediaLightboxIndex}`}
                  horizontal
                  pagingEnabled
                  style={styles.mediaLightboxPager}
                  showsHorizontalScrollIndicator={false}
                  contentOffset={{ x: mediaLightboxIndex * windowWidth, y: 0 }}
                  onMomentumScrollEnd={(event) => {
                    const x = event.nativeEvent.contentOffset.x;
                    const idx = Math.round(x / Math.max(1, windowWidth));
                    const safe = Math.max(0, Math.min(lightboxImages.length - 1, idx));
                    setMediaLightboxIndex(safe);
                  }}
                >
                  {lightboxImages.map((im) => (
                    <View key={`lightbox-slide:${im.id}`} style={[styles.mediaLightboxSlide, { width: windowWidth }]}>
                      <Image
                        source={{ uri: im.url }}
                        style={{ width: windowWidth, flex: 1 }}
                        contentFit="contain"
                        recyclingKey={`lightbox:${im.id}:${im.url}`}
                      />
                    </View>
                  ))}
                </ScrollView>
                {lightboxImages.length > 1 ? (
                  <>
                    <Pressable
                      style={[styles.mediaLightboxNavBtn, styles.mediaLightboxNavBtnLeft, { top: lightboxNavTop }]}
                      onPress={() =>
                        setMediaLightboxIndex((prev) => {
                          if (prev === null) return 0;
                          return prev <= 0 ? lightboxImages.length - 1 : prev - 1;
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Previous image"
                    >
                      <Ionicons name="chevron-back" size={24} color={MEDIA_LIGHTBOX.closeIcon} />
                    </Pressable>
                    <Pressable
                      style={[styles.mediaLightboxNavBtn, styles.mediaLightboxNavBtnRight, { top: lightboxNavTop }]}
                      onPress={() =>
                        setMediaLightboxIndex((prev) => {
                          if (prev === null) return 0;
                          return prev >= lightboxImages.length - 1 ? 0 : prev + 1;
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Next image"
                    >
                      <Ionicons name="chevron-forward" size={24} color={MEDIA_LIGHTBOX.closeIcon} />
                    </Pressable>
                  </>
                ) : null}
              </>
            ) : null}
          </View>
          <View style={styles.mediaLightboxCaptionWrap}>
            <Text style={styles.mediaLightboxCaption}>
              {mediaLightboxIndex !== null
                ? `${mediaLightboxIndex + 1}/${Math.max(1, lightboxImages.length)}${lightboxImages[mediaLightboxIndex]?.caption?.trim() ? ` · ${lightboxImages[mediaLightboxIndex]?.caption?.trim()}` : ""}`
                : " "}
            </Text>
          </View>
        </View>
      </Modal>

      <AppToast
        message={error}
        onDismiss={() => setError(null)}
        bottomOffset={Math.max(insets.bottom, 12) + 8}
        action={{ label: "Retry", onPress: () => void load() }}
      />
    </>
  );
}
