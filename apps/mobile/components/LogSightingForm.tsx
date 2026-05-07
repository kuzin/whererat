import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  fetchImdbMovieSearch,
  type ImdbMovieSearchResult,
  postSightingSubmission,
} from "../lib/api";
import { type ThemeColors, useTheme } from "../lib/theme";

const INSET_X = 16;

function firstReleaseYear(yearStr: string): number | undefined {
  const m = /^(\d{4})/.exec(yearStr.trim());
  if (!m) return undefined;
  const y = Number.parseInt(m[1], 10);
  return Number.isFinite(y) ? y : undefined;
}

function createFormStyles(colors: ThemeColors) {
  const line = colors.mode === "light" ? "rgba(28,25,23,0.22)" : colors.border;
  return StyleSheet.create({
    block: { gap: 8 },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    fieldLabel: { color: colors.text, fontSize: 14, fontWeight: "700" },
    helper: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: line,
      borderRadius: 10,
      backgroundColor: colors.panel,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 12 : 10,
      fontSize: 16,
      color: colors.text,
    },
    textarea: { minHeight: 120, textAlignVertical: "top" },
    searchResults: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: line,
      borderRadius: 10,
      backgroundColor: colors.panel,
      maxHeight: 220,
      overflow: "hidden",
    },
    movieRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: line,
    },
    movieTitle: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" },
    movieMeta: { color: colors.textMuted, fontSize: 12 },
    selectedPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 10,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: line,
      backgroundColor: colors.panelMuted,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: line,
      borderRadius: 10,
      backgroundColor: colors.panel,
      alignSelf: "flex-start",
    },
    stepperBtn: {
      minWidth: 44,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperBtnText: { fontSize: 20, fontWeight: "700", color: colors.textMuted },
    stepperVal: {
      minWidth: 48,
      textAlign: "center",
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    primaryBtnDisabled: { opacity: 0.55 },
    primaryBtnText: { color: colors.retryOnAccent, fontSize: 16, fontWeight: "800" },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    toggleHint: { color: colors.textMuted, fontSize: 12, flex: 1, paddingRight: 12 },
    errorBanner: {
      padding: 12,
      borderRadius: 10,
      backgroundColor: colors.mode === "light" ? "rgba(220,38,38,0.09)" : "rgba(248,113,113,0.12)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.mode === "light" ? "rgba(220,38,38,0.35)" : "rgba(248,113,113,0.35)",
    },
    errorText: {
      color: colors.mode === "light" ? "#991b1b" : "#fecaca",
      fontSize: 13,
      fontWeight: "600",
    },
  });
}

export function LogSightingForm() {
  const { colors } = useTheme();
  const styles = useMemo(() => createFormStyles(colors), [colors]);

  const [movieQuery, setMovieQuery] = useState("");
  const [imdbId, setImdbId] = useState("");
  const [movieTitleResolved, setMovieTitleResolved] = useState("");
  const [movieYear, setMovieYear] = useState<number | undefined>(undefined);
  const [moviePosterUrl, setMoviePosterUrl] = useState("");
  const [searchHits, setSearchHits] = useState<ImdbMovieSearchResult[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchConfigured, setSearchConfigured] = useState(true);
  const [searchNotice, setSearchNotice] = useState<string | undefined>(undefined);

  const [sightingTitle, setSightingTitle] = useState("");
  const [filmPct, setFilmPct] = useState(50);
  const [ratCount, setRatCount] = useState(1);
  const [description, setDescription] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [spoiler, setSpoiler] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runImdbSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setSearchHits([]);
      setSearchNotice(undefined);
      return;
    }
    setSearchBusy(true);
    try {
      const res = await fetchImdbMovieSearch({ q: trimmed });
      setSearchConfigured(res.configured);
      setSearchNotice(res.error);
      setSearchHits(res.results);
    } catch {
      setSearchHits([]);
      setSearchNotice("Movie search is unavailable right now.");
    } finally {
      setSearchBusy(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runImdbSearch(movieQuery);
    }, 320);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [movieQuery, runImdbSearch]);

  const selectMovie = useCallback((hit: ImdbMovieSearchResult) => {
    setMovieQuery(`${hit.title} (${hit.year})`);
    setSearchHits([]);
    setMovieTitleResolved(hit.title.trim());
    setMovieYear(firstReleaseYear(hit.year));
    const poster = hit.posterUrl?.trim();
    setMoviePosterUrl(poster ?? "");
    setImdbId(hit.imdbId.trim());
    setFormError(null);
    setSearchNotice(undefined);
  }, []);

  const clearMovie = useCallback(() => {
    setMovieQuery("");
    setImdbId("");
    setMovieTitleResolved("");
    setMovieYear(undefined);
    setMoviePosterUrl("");
    setSearchHits([]);
    setSearchNotice(undefined);
    setFormError(null);
  }, []);

  const validate = useCallback((): string | null => {
    if (!imdbId.trim() || !movieTitleResolved.trim()) {
      return "Pick a movie from IMDb search results.";
    }
    if (!sightingTitle.trim()) return "Add a short sighting title.";
    if (filmPct < 0 || filmPct > 100) return "Film position must be between 0 and 100%.";
    if (!description.trim()) return "Description is required.";
    if (!submitterName.trim()) return "Your name is required.";
    if (submitterEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail.trim())) {
        return "Enter a valid email or leave it blank.";
      }
    }
    return null;
  }, [imdbId, movieTitleResolved, sightingTitle, filmPct, description, submitterName, submitterEmail]);

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

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: INSET_X, paddingBottom: 32, gap: 20 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
    >
      {formError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{formError}</Text>
        </View>
      ) : null}

      <View style={styles.block}>
        <Text style={styles.sectionLabel}>Movie</Text>
        <Text style={styles.helper}>
          {searchConfigured
            ? "Search is powered by OMDb on the server and resolves the canonical IMDb title id (same as the website)."
            : "OMDb isn’t configured on the server yet — results are only from a small embedded seed catalog. Production uses full IMDb title search."}
        </Text>
        {searchNotice && searchHits.length === 0 ? (
          <Text style={[styles.movieMeta, { marginTop: 2 }]}>{searchNotice}</Text>
        ) : null}
        <TextInput
          placeholder="Try The Departed, Ratatouille…"
          placeholderTextColor={colors.textMuted}
          value={movieQuery}
          onChangeText={(t) => {
            setMovieQuery(t);
            if (imdbId) {
              setImdbId("");
              setMovieTitleResolved("");
              setMovieYear(undefined);
              setMoviePosterUrl("");
            }
          }}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="words"
          accessibilityLabel="IMDb movie title search"
        />
        {searchBusy && (
          <View style={{ alignItems: "center", paddingVertical: 8 }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
        {!searchBusy && searchHits.length > 0 ? (
          <View style={styles.searchResults}>
            {searchHits.map((m) => (
              <Pressable
                key={m.imdbId}
                style={styles.movieRow}
                onPress={() => selectMovie(m)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${m.title}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.movieTitle}>{m.title}</Text>
                  <Text style={styles.movieMeta}>
                    {m.year}
                    {m.source === "OMDb" ? " · OMDb" : " · seed"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
        {imdbId ? (
          <View style={[styles.selectedPill]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.movieTitle, { flex: 0 }]}>{movieTitleResolved}</Text>
              <Text style={styles.movieMeta}>
                {movieYear ?? "—"} · IMDb {imdbId}
              </Text>
            </View>
            <Pressable onPress={clearMovie} accessibilityRole="button" accessibilityLabel="Clear movie">
              <Text style={{ color: colors.accent, fontWeight: "800", fontSize: 13 }}>Clear</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.block}>
        <Text style={styles.sectionLabel}>Sighting</Text>
        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput
          placeholder="Short headline for this appearance"
          placeholderTextColor={colors.textMuted}
          value={sightingTitle}
          onChangeText={setSightingTitle}
          style={styles.input}
          accessibilityLabel="Sighting headline"
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.fieldLabel}>Approximate point in film</Text>
        <Text style={[styles.movieMeta, { marginBottom: 4 }]}>{filmPct}% into the runtime</Text>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => setFilmPct((n) => Math.max(0, n - 1))}
            accessibilityRole="button"
            accessibilityLabel="Decrease film position"
          >
            <Text style={styles.stepperBtnText}>−</Text>
          </Pressable>
          <Text style={styles.stepperVal}>{filmPct}</Text>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => setFilmPct((n) => Math.min(100, n + 1))}
            accessibilityRole="button"
            accessibilityLabel="Increase film position"
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.fieldLabel}>Approximate rats on screen</Text>
        <View style={[styles.stepper, { marginTop: 6 }]}>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => setRatCount((n) => Math.max(1, n - 1))}
          >
            <Text style={styles.stepperBtnText}>−</Text>
          </Pressable>
          <Text style={styles.stepperVal}>{ratCount}</Text>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => setRatCount((n) => Math.min(999, n + 1))}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.fieldLabel}>Description</Text>
        <Text style={[styles.helper, { marginBottom: 4 }]}>
          Markdown-friendly (bold, lists, links). Moderators review every submission before it ships.
        </Text>
        <TextInput
          multiline
          placeholder="Where on screen? What happens? What does the rat do?"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textarea]}
          accessibilityLabel="Sighting description"
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.sectionLabel}>You</Text>
        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput
          placeholder="Displayed with the listing if accepted"
          placeholderTextColor={colors.textMuted}
          value={submitterName}
          onChangeText={setSubmitterName}
          style={styles.input}
          autoComplete="name"
          accessibilityLabel="Your name"
        />
        <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Email (optional)</Text>
        <TextInput
          placeholder="moderators-only follow-up"
          placeholderTextColor={colors.textMuted}
          value={submitterEmail}
          onChangeText={setSubmitterEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          accessibilityLabel="Email optional"
        />
      </View>

      <View style={styles.block}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
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

      <Pressable
        style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
        onPress={() => void onSubmit()}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel="Submit sighting"
      >
        {submitting ? (
          <ActivityIndicator color={colors.retryOnAccent} />
        ) : (
          <Text style={styles.primaryBtnText}>Submit for review</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
