import Slider from "@react-native-community/slider";
import { Image } from "expo-image";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { HeaderHeightContext } from "@react-navigation/elements";
import {
  ActivityIndicator,
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppTextInput } from "./AppTextInput";
import {
  fetchImdbMovieSearch,
  type ImdbMovieSearchResult,
  postSightingSubmission,
} from "../lib/api";
import { contrastingForeground } from "../lib/posterTone";
import { type ThemeColors, useTheme } from "../lib/theme";
import Markdown from "react-native-markdown-display";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const INSET_X = 16;
const IOS_INPUT_ACCESSORY_ID = "LogSightingInputAccessory";
/**
 * 8pt grid — vertical rhythm between labels, controls, and sections (Material / iOS–style density).
 */
const SPACE = { xs: 4, sm: 8, md: 16, lg: 24 } as const;
/** Wait for typing to settle before hitting OMDb (matches web submit field ~300ms, slightly longer for mobile). */
const IMDB_SEARCH_DEBOUNCE_MS = 400;

function firstReleaseYear(yearStr: string): number | undefined {
  const m = /^(\d{4})/.exec(yearStr.trim());
  if (!m) return undefined;
  const y = Number.parseInt(m[1], 10);
  return Number.isFinite(y) ? y : undefined;
}

function formatMovieAutocompleteMeta(hit: ImdbMovieSearchResult): string {
  const runtime = hit.runtime?.trim() || "Runtime TBD";
  const rating = hit.rating?.trim() || "Rating TBD";
  return `${hit.year} · ${runtime} · ${rating}`;
}

const SEARCH_POSTER_W = 88;
/** ~2:3 portrait, aligned with submit page row thumbnails. */
const SEARCH_POSTER_H = Math.round((SEARCH_POSTER_W * 3) / 2);
const SELECTED_POSTER_W = 110;
const SELECTED_POSTER_H = Math.round((SELECTED_POSTER_W * 3) / 2);

function PosterThumb({
  uri,
  title,
  width,
  height,
  borderColor,
  panelColor,
  mutedTextColor,
}: {
  uri: string;
  title: string;
  width: number;
  height: number;
  borderColor: string;
  panelColor: string;
  mutedTextColor: string;
}) {
  const trimmed = uri.trim();
  const [failed, setFailed] = useState(!trimmed);
  if (failed || !trimmed) {
    return (
      <View
        style={{
          width,
          height,
          backgroundColor: panelColor,
          borderRightWidth: StyleSheet.hairlineWidth,
          borderRightColor: borderColor,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 8,
        }}
      >
        <Text
          numberOfLines={4}
          style={{
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 0.16,
            textTransform: "uppercase",
            textAlign: "center",
            color: mutedTextColor,
          }}
        >
          {title}
        </Text>
      </View>
    );
  }
  return (
    <View
      style={{
        width,
        height,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: borderColor,
        backgroundColor: panelColor,
        overflow: "hidden",
      }}
    >
      <Image
        source={{ uri }}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        accessibilityIgnoresInvertColors
        onError={() => setFailed(true)}
      />
    </View>
  );
}

function ratSwarmTier(count: number): { label: string; sublabel: string; fill: number } {
  if (count === 1) return { label: "Lone scout", sublabel: "A solitary rat. Brave.", fill: 1 };
  if (count <= 3) return { label: "Small pack", sublabel: "A couple of friends.", fill: 2 };
  if (count <= 7) return { label: "Growing colony", sublabel: "Things are getting ratty.", fill: 3 };
  if (count <= 15) return { label: "Swarm forming", sublabel: "Someone call an exterminator.", fill: 4 };
  if (count <= 40) return { label: "Full swarm", sublabel: "Absolute chaos.", fill: 5 };
  return { label: "Rat apocalypse", sublabel: "We bow to our new overlords.", fill: 6 };
}

function RatSwarmSignal({
  count,
  styles,
}: {
  count: number;
  styles: ReturnType<typeof createFormStyles>;
}) {
  const { label, sublabel, fill } = ratSwarmTier(count);
  const maxFill = 6;
  const displayRats = Math.min(fill, maxFill);
  return (
    <View
      style={styles.ratMeterCard}
      accessibilityLabel={`${label}. ${sublabel}`}
    >
      <View style={styles.ratEmojiRow} importantForAccessibility="no-hide-descendants">
        {Array.from({ length: maxFill }).map((_, i) => (
          <Text key={i} style={[styles.ratEmoji, i >= displayRats && styles.ratEmojiInactive]}>
            🐀
          </Text>
        ))}
      </View>
      <View style={styles.ratMeterTextCol}>
        <Text style={styles.ratMeterTitle} numberOfLines={1} ellipsizeMode="tail">
          {label}
        </Text>
        <Text style={styles.ratMeterSub} numberOfLines={2} ellipsizeMode="tail">
          {sublabel}
        </Text>
      </View>
    </View>
  );
}

function createFormStyles(colors: ThemeColors) {
  const line = colors.inputBorder;
  const fgOnChip = contrastingForeground(colors.chipActive);
  return StyleSheet.create({
    /** Same as scroll section `gap` — keeps space between field groups aligned with space between major blocks. */
    formSection: { gap: SPACE.lg },
    /** Space inside one logical field (label → helper → control). */
    fieldGroup: { gap: SPACE.sm },
    descModeRow: {
      flexDirection: "row",
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.panelMuted,
      overflow: "hidden",
    },
    descModeBtn: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      backgroundColor: "transparent",
    },
    descModeBtnDivider: {
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.border,
    },
    descModeBtnActive: {
      backgroundColor: colors.chipActive,
    },
    descModeBtnText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textMuted,
    },
    descModeBtnTextActive: {
      color: fgOnChip,
    },
    previewBox: {
      minHeight: 120,
      padding: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: line,
      backgroundColor: colors.panel,
    },
    previewEmpty: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      fontStyle: "italic",
    },
    filmPctBig: {
      fontSize: 22,
      fontWeight: "900",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    filmSliderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACE.sm,
    },
    filmSlider: {
      flex: 1,
      minWidth: 0,
      height: Platform.OS === "ios" ? 44 : 40,
    },
    filmPctInline: {
      alignItems: "flex-end",
      justifyContent: "center",
      minWidth: 56,
    },
    sliderEndLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: SPACE.xs,
    },
    sliderEndLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textMuted,
    },
    /** Stepper + meter stack vertically so the swarm scale stays full width and nothing shares a cramped row. */
    ratControlsStack: {
      gap: SPACE.md,
      alignItems: "stretch",
    },
    /** Full-width segmented control aligned with `AppTextInput` chrome and height. */
    ratStepperOuter: {
      width: "100%",
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "stretch",
      minHeight: Platform.OS === "ios" ? 48 : 46,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      backgroundColor: colors.panel,
      overflow: "hidden",
    },
    ratStepperOuterDisabled: {
      borderColor: colors.inputBorderDisabled,
      backgroundColor: colors.inputBackgroundDisabled,
    },
    ratStepperBtn: {
      width: 48,
      flexShrink: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    ratStepperMid: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
      alignItems: "center",
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderColor: colors.inputBorder,
    },
    ratStepperMidDisabled: {
      borderColor: colors.inputBorderDisabled,
    },
    ratStepperVal: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    ratMeterCard: {
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: line,
      backgroundColor: colors.panelMuted,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    ratEmojiRow: {
      flexDirection: "row",
      flexShrink: 0,
      gap: 2,
    },
    ratEmoji: { fontSize: 16, lineHeight: 18, opacity: 1 },
    ratEmojiInactive: { opacity: 0.15 },
    ratMeterTextCol: { flex: 1, minWidth: 0, justifyContent: "center" },
    ratMeterTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.text,
    },
    ratMeterSub: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.textMuted,
    },
    fieldLabel: { color: colors.text, fontSize: 14, fontWeight: "700" },
    helper: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
    textarea: { minHeight: 120, textAlignVertical: "top" },
    searchResultsWrap: {
      gap: 12,
    },
    movieHitCard: {
      flexDirection: "row",
      alignItems: "stretch",
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: line,
      backgroundColor: colors.panel,
      overflow: "hidden",
    },
    movieHitBody: {
      flex: 1,
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 6,
      minWidth: 0,
    },
    movieHitTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "800",
      lineHeight: 22,
    },
    movieHitMeta: { color: colors.textMuted, fontSize: 13, fontWeight: "600", lineHeight: 18 },
    movieHitImdb: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: colors.accent,
    },
    selectedCard: {
      flexDirection: "row",
      alignItems: "stretch",
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: line,
      backgroundColor: colors.panel,
      overflow: "hidden",
    },
    selectedBody: {
      flex: 1,
      padding: 16,
      gap: 6,
      justifyContent: "center",
      minWidth: 0,
    },
    selectedTitle: { color: colors.text, fontSize: 20, fontWeight: "800", lineHeight: 26 },
    selectedMeta: { color: colors.textMuted, fontSize: 14, fontWeight: "600", lineHeight: 20 },
    selectedImdb: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: colors.accent,
    },
    selectedClearBtn: {
      marginTop: SPACE.sm,
      alignSelf: "flex-start",
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: line,
      backgroundColor: colors.panelMuted,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    selectedClearBtnText: { color: colors.accent, fontSize: 13, fontWeight: "800" },
    movieMeta: { color: colors.textMuted, fontSize: 12 },
    stepperBtnText: { fontSize: 20, fontWeight: "700", color: colors.textMuted },
    formRoot: {
      flex: 1,
      minHeight: 0,
      alignSelf: "stretch",
      width: "100%",
    },
    formScroll: {
      flex: 1,
      alignSelf: "stretch",
      width: "100%",
      backgroundColor: "transparent",
    },
    submitFooter: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: line,
      backgroundColor: colors.panel,
      paddingHorizontal: INSET_X,
      paddingTop: SPACE.md,
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      alignSelf: "stretch",
    },
    primaryBtnDisabled: { opacity: 0.55 },
    primaryBtnText: { color: colors.retryOnAccent, fontSize: 16, fontWeight: "800" },
    keyboardAvoidRoot: {
      flex: 1,
      minHeight: 0,
      alignSelf: "stretch",
      width: "100%",
    },
    inputAccessoryBar: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      paddingHorizontal: INSET_X,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: line,
      backgroundColor: colors.panel,
    },
    inputAccessoryDone: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.accent,
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: SPACE.sm,
    },
    spoilerSection: { paddingBottom: SPACE.md },
    toggleLabelStack: {
      flex: 1,
      minWidth: 0,
      gap: SPACE.xs,
      paddingRight: SPACE.md,
    },
    toggleHint: { color: colors.textMuted, fontSize: 12, lineHeight: 16 },
    errorBanner: {
      padding: 12,
      borderRadius: 10,
      backgroundColor: colors.dangerBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.inputBorder,
    },
    errorText: {
      color: colors.dangerText,
      fontSize: 13,
      fontWeight: "600",
    },
    formIntroCard: { gap: SPACE.xs, paddingTop: SPACE.sm },
    formIntroTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: 0.2,
    },
    formIntroBody: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
    formStartDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.dividerStrong },
    searchBusyWrap: {
      alignItems: "center",
      paddingVertical: SPACE.sm,
    },
    loadMoreBtn: {
      marginTop: SPACE.xs,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: line,
      backgroundColor: colors.panel,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
    },
    loadMoreBtnDisabled: { opacity: 0.55 },
    loadMoreText: { color: colors.accent, fontSize: 15, fontWeight: "800" },
  });
}

export function LogSightingForm() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const headerOffset = useContext(HeaderHeightContext) ?? 0;
  const styles = useMemo(() => createFormStyles(colors), [colors]);

  const movieInputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const cardDivider = colors.inputBorder;
  /** Matches global accent + themed neutral track for contrast in both modes. */
  const filmTrackMin = colors.accent;
  const filmTrackMax = colors.sliderTrackMax;
  const filmThumbTint = colors.panel;

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
      strong: { color: colors.text, fontWeight: "700" as const },
      em: { color: colors.text, fontStyle: "italic" as const },
      link: { color: colors.accent, textDecorationLine: "underline" as const },
      code_inline: { color: colors.text, backgroundColor: colors.chipActive },
      fence: {
        color: contrastingForeground(colors.chipActive),
        backgroundColor: colors.chipActive,
      },
      blockquote: {
        color: colors.textMuted,
        borderLeftColor: colors.border,
        borderLeftWidth: 3,
        paddingLeft: 10,
      },
    }),
    [colors],
  );

  const [movieQuery, setMovieQuery] = useState("");
  const [imdbId, setImdbId] = useState("");
  const [movieTitleResolved, setMovieTitleResolved] = useState("");
  const [movieYear, setMovieYear] = useState<number | undefined>(undefined);
  const [moviePosterUrl, setMoviePosterUrl] = useState("");
  const [searchHits, setSearchHits] = useState<ImdbMovieSearchResult[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchLoadMoreBusy, setSearchLoadMoreBusy] = useState(false);
  const [searchNotice, setSearchNotice] = useState<string | undefined>(undefined);
  /** OMDb returns 10 titles per page; `hasMore` enables paging. */
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  /** Full hit for autocomplete + selected-card layout (poster, runtime, rating, source). */
  const [selectedHit, setSelectedHit] = useState<ImdbMovieSearchResult | null>(null);

  const [sightingTitle, setSightingTitle] = useState("");
  const [filmPct, setFilmPct] = useState(50);
  const [ratCount, setRatCount] = useState(1);
  const [description, setDescription] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [descriptionMode, setDescriptionMode] = useState<"write" | "preview">("write");

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Invalidate in-flight IMDb search when a movie is picked so late responses can't repopulate the list. */
  const imdbSearchSeqRef = useRef(0);

  const runImdbSearch = useCallback(async (q: string) => {
    const seq = ++imdbSearchSeqRef.current;
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setSearchHits([]);
      setSearchNotice(undefined);
      setSearchHasMore(false);
      setSearchPage(1);
      return;
    }
    setSearchBusy(true);
    try {
      const res = await fetchImdbMovieSearch({ q: trimmed, page: 1 });
      if (imdbSearchSeqRef.current !== seq) return;
      setSearchNotice(res.error);
      setSearchHits(res.results);
      setSearchHasMore(Boolean(res.hasMore));
      setSearchPage(res.page ?? 1);
    } catch {
      if (imdbSearchSeqRef.current !== seq) return;
      setSearchHits([]);
      setSearchHasMore(false);
      setSearchPage(1);
      setSearchNotice("Movie search is unavailable right now.");
    } finally {
      setSearchBusy(false);
    }
  }, []);

  const loadMoreSearchResults = useCallback(async () => {
    const trimmed = movieQuery.trim();
    if (trimmed.length < 2 || !searchHasMore || searchBusy || searchLoadMoreBusy || submitting) {
      return;
    }
    const seqAtStart = imdbSearchSeqRef.current;
    const nextPage = searchPage + 1;
    setSearchLoadMoreBusy(true);
    try {
      const res = await fetchImdbMovieSearch({ q: trimmed, page: nextPage });
      if (imdbSearchSeqRef.current !== seqAtStart) return;
      setSearchHits((prev) => {
        const seen = new Set(prev.map((h) => h.imdbId.toLowerCase()));
        const merged = res.results.filter((h) => !seen.has(h.imdbId.toLowerCase()));
        return merged.length ? [...prev, ...merged] : prev;
      });
      setSearchHasMore(Boolean(res.hasMore));
      setSearchPage(res.page ?? nextPage);
      if (res.error && res.results.length === 0) {
        setSearchNotice(res.error);
      }
    } catch {
      if (imdbSearchSeqRef.current !== seqAtStart) return;
      setSearchNotice("Couldn’t load more results. Try again.");
    } finally {
      if (imdbSearchSeqRef.current === seqAtStart) {
        setSearchLoadMoreBusy(false);
      }
    }
  }, [
    movieQuery,
    searchHasMore,
    searchBusy,
    searchLoadMoreBusy,
    submitting,
    searchPage,
  ]);

  useEffect(() => {
    if (imdbId.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runImdbSearch(movieQuery);
    }, IMDB_SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [movieQuery, imdbId, runImdbSearch]);

  const selectMovie = useCallback((hit: ImdbMovieSearchResult) => {
    imdbSearchSeqRef.current += 1;
    setMovieQuery("");
    setSearchHits([]);
    setSearchHasMore(false);
    setSearchPage(1);
    setMovieTitleResolved(hit.title.trim());
    setMovieYear(firstReleaseYear(hit.year));
    const poster = hit.posterUrl?.trim();
    setMoviePosterUrl(poster ?? "");
    setImdbId(hit.imdbId.trim());
    setSelectedHit(hit);
    setFormError(null);
    setSearchNotice(undefined);
  }, []);

  const clearMovie = useCallback(() => {
    setMovieQuery("");
    setImdbId("");
    setMovieTitleResolved("");
    setMovieYear(undefined);
    setMoviePosterUrl("");
    setSelectedHit(null);
    setSearchHits([]);
    setSearchNotice(undefined);
    setSearchHasMore(false);
    setSearchPage(1);
    setFormError(null);
  }, []);

  const validate = useCallback((): string | null => {
    if (!movieTitleResolved.trim()) {
      return "Select a movie from search.";
    }
    if (!imdbId.trim()) {
      return "Pick a result from IMDb search so the title links to a real IMDb ID.";
    }
    if (!sightingTitle.trim()) return "Sighting title is required.";
    if (filmPct < 0 || filmPct > 100) return "Use a percentage from 0 to 100.";
    if (!description.trim()) return "Description is required.";
    if (!submitterName.trim()) return "Your name is required.";
    if (submitterEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail.trim())) {
        return "Enter a valid email address or leave it blank.";
      }
    }
    return null;
  }, [imdbId, movieTitleResolved, sightingTitle, filmPct, description, submitterName, submitterEmail]);

  const formComplete = useMemo(() => validate() === null, [validate]);

  const onSubmit = useCallback(async () => {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("movieTitle", movieTitleResolved.trim());
      fd.append("imdbId", imdbId.trim());
      if (movieYear !== undefined) fd.append("movieYear", String(movieYear));
      if (moviePosterUrl.trim()) fd.append("moviePosterUrl", moviePosterUrl.trim());
      fd.append("sightingTitle", sightingTitle.trim());
      fd.append("timestamp", `${filmPct}%`);
      fd.append("description", description.trim());
      fd.append("submitterName", submitterName.trim());
      if (submitterEmail.trim()) fd.append("submitterEmail", submitterEmail.trim());
      fd.append("approximateRatCount", String(ratCount));
      if (spoiler) fd.append("spoiler", "on");

      await postSightingSubmission(fd);
      setSightingTitle("");
      setDescription("");
      setSubmitterEmail("");
      setRatCount(1);
      setFilmPct(50);
      setSpoiler(false);
      setDescriptionMode("write");
      clearMovie();
      Alert.alert(
        "Thanks!",
        "Your sighting is in the moderator review queue. You’ll see it live after approval.",
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Submission failed.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    validate,
    movieTitleResolved,
    imdbId,
    movieYear,
    moviePosterUrl,
    sightingTitle,
    filmPct,
    description,
    submitterName,
    submitterEmail,
    ratCount,
    spoiler,
    clearMovie,
  ]);

  const footerBottomPad = 12 + insets.bottom;

  const focusAfterTitle = useCallback(() => {
    if (descriptionMode === "write") {
      descriptionInputRef.current?.focus();
    } else {
      nameInputRef.current?.focus();
    }
  }, [descriptionMode]);

  const iosAccessoryProps =
    Platform.OS === "ios" ? ({ inputAccessoryViewID: IOS_INPUT_ACCESSORY_ID } as const) : {};

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidRoot}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerOffset}
    >
      {Platform.OS === "ios" ? (
        <InputAccessoryView nativeID={IOS_INPUT_ACCESSORY_ID}>
          <View style={styles.inputAccessoryBar}>
            <Pressable
              onPress={() => Keyboard.dismiss()}
              accessibilityRole="button"
              accessibilityLabel="Dismiss keyboard"
            >
              <Text style={styles.inputAccessoryDone}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}

      <View style={styles.formRoot}>
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={{
          paddingHorizontal: INSET_X,
          paddingTop: SPACE.md,
          paddingBottom: SPACE.md,
          gap: SPACE.lg,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      >
      <View style={styles.formIntroCard}>
        <Text style={styles.formIntroTitle}>Log a 🐀 sighting</Text>
        <Text style={styles.formIntroBody}>
          Capture where it appears and what happens on screen. Every submission is reviewed before it goes live.
        </Text>
      </View>
      <View style={styles.formStartDivider} />

      {formError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{formError}</Text>
        </View>
      ) : null}

      <View style={styles.formSection}>
        {!(imdbId && selectedHit) ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Search for a title…</Text>
            {searchNotice && searchHits.length === 0 ? (
              <Text style={styles.movieMeta}>{searchNotice}</Text>
            ) : null}
            <AppTextInput
              ref={movieInputRef}
              placeholder="Try The Departed, Ratatouille…"
              value={movieQuery}
              disabled={submitting}
              onChangeText={(t) => {
                setMovieQuery(t);
                if (imdbId) {
                  setImdbId("");
                  setMovieTitleResolved("");
                  setMovieYear(undefined);
                  setMoviePosterUrl("");
                  setSelectedHit(null);
                }
              }}
              autoCorrect={false}
              autoCapitalize="words"
              accessibilityLabel="Search for a title"
              returnKeyType="next"
              onSubmitEditing={() => titleInputRef.current?.focus()}
              {...iosAccessoryProps}
            />
            {searchBusy ? (
              <View style={styles.searchBusyWrap}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : null}
            {!searchBusy && searchHits.length > 0 ? (
              <View style={styles.searchResultsWrap}>
                {searchHits.map((m) => (
                  <Pressable
                    key={m.imdbId}
                    style={({ pressed }) => [styles.movieHitCard, pressed && { opacity: 0.92 }]}
                    onPress={() => selectMovie(m)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${m.title}`}
                  >
                    <PosterThumb
                      uri={m.posterUrl}
                      title={m.title}
                      width={SEARCH_POSTER_W}
                      height={SEARCH_POSTER_H}
                      borderColor={cardDivider}
                      panelColor={colors.panelMuted}
                      mutedTextColor={colors.textMuted}
                    />
                    <View style={styles.movieHitBody}>
                      <Text style={styles.movieHitTitle} numberOfLines={3}>
                        {m.title}
                      </Text>
                      <Text style={styles.movieHitMeta} numberOfLines={2}>
                        {formatMovieAutocompleteMeta(m)}
                      </Text>
                      <Text style={styles.movieHitImdb}>
                        IMDb {m.imdbId} · {m.source}
                      </Text>
                    </View>
                  </Pressable>
                ))}
                {searchHasMore ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.loadMoreBtn,
                      (searchLoadMoreBusy || submitting) && styles.loadMoreBtnDisabled,
                      pressed && !searchLoadMoreBusy && { opacity: 0.88 },
                    ]}
                    onPress={() => void loadMoreSearchResults()}
                    disabled={searchLoadMoreBusy || submitting}
                    accessibilityRole="button"
                    accessibilityLabel="Show more movie search results"
                  >
                    {searchLoadMoreBusy ? (
                      <ActivityIndicator color={colors.accent} />
                    ) : (
                      <Text style={styles.loadMoreText}>Show more results</Text>
                    )}
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
        {imdbId && selectedHit ? (
          <View style={styles.selectedCard}>
            <PosterThumb
              uri={selectedHit.posterUrl}
              title={selectedHit.title}
              width={SELECTED_POSTER_W}
              height={SELECTED_POSTER_H}
              borderColor={cardDivider}
              panelColor={colors.panelMuted}
              mutedTextColor={colors.textMuted}
            />
            <View style={styles.selectedBody}>
              <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                <Text style={styles.selectedTitle} numberOfLines={4}>
                  {selectedHit.title}
                </Text>
                <Text style={styles.selectedMeta} numberOfLines={2}>
                  {formatMovieAutocompleteMeta(selectedHit)}
                </Text>
                <Text style={styles.selectedImdb}>
                  IMDb {selectedHit.imdbId} · {selectedHit.source}
                </Text>
              </View>
              <Pressable
                style={styles.selectedClearBtn}
                onPress={clearMovie}
                accessibilityRole="button"
                accessibilityLabel="Clear selection"
              >
                <Text style={styles.selectedClearBtnText}>Clear selection</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.formSection}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Sighting title</Text>
          <AppTextInput
            ref={titleInputRef}
            placeholder="Short headline for this appearance"
            value={sightingTitle}
            disabled={submitting}
            onChangeText={setSightingTitle}
            accessibilityLabel="Sighting title"
            returnKeyType="next"
            onSubmitEditing={focusAfterTitle}
            {...iosAccessoryProps}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            How far into the film did you spot the rat(s)?
          </Text>
          <View style={styles.filmSliderRow}>
            <Slider
              style={styles.filmSlider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={filmPct}
              onValueChange={(v) => setFilmPct(Math.round(v))}
              minimumTrackTintColor={filmTrackMin}
              maximumTrackTintColor={filmTrackMax}
              thumbTintColor={filmThumbTint}
              disabled={submitting}
              accessibilityLabel="How far into the film did you spot the rat(s)?"
            />
            <View style={styles.filmPctInline} pointerEvents="none">
              <Text style={styles.filmPctBig}>{filmPct}%</Text>
            </View>
          </View>
          <View style={styles.sliderEndLabels}>
            <Text style={styles.sliderEndLabel}>Opening</Text>
            <Text style={styles.sliderEndLabel}>Ending</Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Approximate rats on screen</Text>
          <View style={styles.ratControlsStack}>
            <View
              style={[
                styles.ratStepperOuter,
                submitting && styles.ratStepperOuterDisabled,
              ]}
            >
              <Pressable
                style={styles.ratStepperBtn}
                onPress={() => setRatCount((n) => Math.max(1, n - 1))}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Decrease rat count"
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </Pressable>
              <View
                style={[
                  styles.ratStepperMid,
                  submitting && styles.ratStepperMidDisabled,
                ]}
              >
                <Text style={styles.ratStepperVal}>{ratCount}</Text>
              </View>
              <Pressable
                style={styles.ratStepperBtn}
                onPress={() => setRatCount((n) => Math.min(999, n + 1))}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Increase rat count"
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
            <RatSwarmSignal count={ratCount} styles={styles} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Description</Text>
          <Text style={styles.helper}>
            Markdown-friendly (bold, lists, links). Moderators review every submission before it ships.
          </Text>
          <View style={styles.descModeRow}>
            <Pressable
              onPress={() => setDescriptionMode("write")}
              style={({ pressed }) => [
                styles.descModeBtn,
                descriptionMode === "write" && styles.descModeBtnActive,
                pressed && { opacity: 0.88 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: descriptionMode === "write" }}
              accessibilityLabel="Write description"
            >
              <Text
                style={[
                  styles.descModeBtnText,
                  descriptionMode === "write" && styles.descModeBtnTextActive,
                ]}
              >
                Write
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setDescriptionMode("preview")}
              style={({ pressed }) => [
                styles.descModeBtn,
                styles.descModeBtnDivider,
                descriptionMode === "preview" && styles.descModeBtnActive,
                pressed && { opacity: 0.88 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: descriptionMode === "preview" }}
              accessibilityLabel="Preview markdown"
            >
              <Text
                style={[
                  styles.descModeBtnText,
                  descriptionMode === "preview" && styles.descModeBtnTextActive,
                ]}
              >
                Preview
              </Text>
            </Pressable>
          </View>
          {descriptionMode === "write" ? (
            <AppTextInput
              ref={descriptionInputRef}
              multiline
              placeholder="Where on screen? What happens? What does the rat do?"
              value={description}
              disabled={submitting}
              onChangeText={setDescription}
              style={styles.textarea}
              accessibilityLabel="Sighting description"
              blurOnSubmit={false}
              {...iosAccessoryProps}
            />
          ) : (
            <View style={styles.previewBox}>
              {description.trim() ? (
                <Markdown style={markdownStyles}>{description}</Markdown>
              ) : (
                <Text style={styles.previewEmpty}>Nothing to preview yet.</Text>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.formSection}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Your Name</Text>
          <AppTextInput
            ref={nameInputRef}
            placeholder="Displayed with the listing if accepted"
            value={submitterName}
            disabled={submitting}
            onChangeText={setSubmitterName}
            autoComplete="name"
            accessibilityLabel="Your name"
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current?.focus()}
            {...iosAccessoryProps}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Your Email (optional)</Text>
          <AppTextInput
            ref={emailInputRef}
            placeholder="moderators-only follow-up"
            value={submitterEmail}
            disabled={submitting}
            onChangeText={setSubmitterEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            accessibilityLabel="Your email (optional)"
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            {...iosAccessoryProps}
          />
        </View>
      </View>

      <View style={[styles.formSection, styles.spoilerSection]}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabelStack}>
            <Text style={styles.fieldLabel}>Contains plot spoilers</Text>
            <Text style={styles.toggleHint}>Check if revealing this moment ruins a major twist.</Text>
          </View>
          <Pressable
            onPress={() => setSpoiler((s) => !s)}
            accessibilityRole="switch"
            accessibilityState={{ checked: spoiler }}
            style={{
              width: 52,
              height: 32,
              borderRadius: 16,
              backgroundColor: spoiler ? colors.accent : colors.border,
              justifyContent: "center",
              paddingHorizontal: 3,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: colors.panel,
                alignSelf: spoiler ? "flex-end" : "flex-start",
              }}
            />
          </Pressable>
        </View>
      </View>
      </ScrollView>

      <View style={[styles.submitFooter, { paddingBottom: footerBottomPad }]}>
        <Pressable
          style={[
            styles.primaryBtn,
            (!formComplete || submitting) && styles.primaryBtnDisabled,
          ]}
          onPress={() => void onSubmit()}
          disabled={!formComplete || submitting}
          accessibilityRole="button"
          accessibilityState={{ disabled: !formComplete || submitting }}
          accessibilityLabel="Submit sighting for review"
        >
          {submitting ? (
            <ActivityIndicator color={colors.retryOnAccent} />
          ) : (
            <Text style={styles.primaryBtnText}>Submit for review</Text>
          )}
        </Pressable>
      </View>
    </View>
    </KeyboardAvoidingView>
  );
}
