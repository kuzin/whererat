import { openURL } from "expo-linking";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { HeaderThemeWordmark } from "../../components/HeaderThemeWordmark";
import { SightingCard } from "../../components/SightingCard";
import { fetchMovieDetail } from "../../lib/api";
import {
  contrastingForeground,
  posterToneToHex,
  statusBarStyleForBackground,
} from "../../lib/posterTone";
import { type ThemeColors, useTheme } from "../../lib/theme";
import type { MovieDetailResponse, MovieSightingsSort } from "../../lib/types";

type TabKey = "sightings" | "facts" | "reviews" | "related" | "videos" | "images";

const TAB_DEFS: { key: TabKey; label: string }[] = [
  { key: "sightings", label: "Featured Rats" },
  { key: "facts", label: "Facts" },
  { key: "reviews", label: "Reviews" },
  { key: "related", label: "Related" },
  { key: "videos", label: "Video" },
  { key: "images", label: "Stills" },
];

function createMovieStyles(colors: ThemeColors, movieSurface?: string) {
  const surface = movieSurface ?? colors.background;
  const heroChrome = movieSurface ?? colors.headerBg;
  const heroFadeBg =
    colors.mode === "dark" ? "rgba(12,10,9,0.65)" : "rgba(250,250,249,0.82)";

  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: surface },
    scrollContent: { paddingBottom: 40 },
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
      marginBottom: 16,
      overflow: "hidden",
      backgroundColor: heroChrome,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      height: 220,
      opacity: 0.45,
    },
    heroFade: {
      ...StyleSheet.absoluteFillObject,
      height: 220,
      backgroundColor: heroFadeBg,
    },
    heroRow: {
      flexDirection: "row",
      gap: 16,
      padding: 16,
      alignItems: "flex-end",
    },
    poster: {
      width: 112,
      height: 168,
      borderRadius: 8,
      backgroundColor: colors.panel,
    },
    heroText: { flex: 1, gap: 6 },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "800",
      lineHeight: 28,
    },
    meta: { color: colors.accent, fontWeight: "600" },
    genres: { color: colors.textMuted },
    imdbBtn: {
      alignSelf: "flex-start",
      marginTop: 8,
      backgroundColor: colors.chipActive,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accent,
    },
    imdbBtnText: { color: colors.text, fontWeight: "700" },
    summary: {
      color: colors.textMuted,
      fontSize: 16,
      lineHeight: 24,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    softBanner: {
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 10,
      borderRadius: 8,
      backgroundColor: colors.dangerBg,
    },
    softBannerText: { color: colors.dangerText, fontSize: 14 },
    tabRow: {
      paddingHorizontal: 12,
      gap: 8,
      paddingVertical: 8,
      flexDirection: "row",
    },
    tabChip: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: colors.panel,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    tabChipOn: { backgroundColor: colors.chipActive, borderColor: colors.accent },
    tabChipText: { color: colors.textMuted, fontWeight: "600" },
    tabChipTextOn: { color: colors.text },
    section: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
    sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
    chipsRow: { gap: 8, flexDirection: "row", paddingVertical: 4 },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.panel,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    chipOn: { borderColor: colors.accent, backgroundColor: colors.chipActive },
    chipText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
    chipTextOn: { color: colors.text },
    pagingNote: { color: colors.textMuted, fontSize: 14 },
    pager: { flexDirection: "row", gap: 12, marginBottom: 8 },
    pageBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
    },
    pageBtnOff: { opacity: 0.35 },
    pageBtnText: { color: colors.retryOnAccent, fontWeight: "700" },
    factBlock: { flexDirection: "row", gap: 8, marginBottom: 12 },
    factIndex: { color: colors.accent, fontWeight: "700", width: 28 },
    factText: { flex: 1, color: colors.textMuted, fontSize: 15, lineHeight: 22 },
    reviewCard: {
      marginBottom: 16,
      padding: 12,
      borderRadius: 10,
      backgroundColor: colors.panel,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: 6,
    },
    reviewAuthor: { color: colors.text, fontWeight: "700" },
    reviewDate: { color: colors.textMuted, fontSize: 13 },
    reviewSummary: { color: colors.accent, fontStyle: "italic" },
    reviewBody: { color: colors.textMuted, lineHeight: 22 },
    relatedRow: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      marginBottom: 12,
      paddingVertical: 4,
    },
    relatedPoster: { width: 48, height: 72, borderRadius: 6, backgroundColor: colors.panel },
    relatedPosterPh: { alignItems: "center", justifyContent: "center" },
    relatedPosterPhText: { color: colors.textMuted, fontSize: 18 },
    relatedTitle: { color: colors.text, fontWeight: "700", fontSize: 16 },
    videoRow: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      marginBottom: 14,
    },
    videoThumb: { width: 120, height: 68, borderRadius: 6, backgroundColor: colors.panel },
    stillBlock: { marginBottom: 20, gap: 8 },
    stillImg: { width: "100%", aspectRatio: 16 / 9, borderRadius: 8, backgroundColor: colors.panel },
  });
}

type MovieStyles = ReturnType<typeof createMovieStyles>;

function HeroBlock({
  movie,
  imdbTitleUrl,
  styles,
}: {
  movie: NonNullable<MovieDetailResponse["movie"]>;
  imdbTitleUrl: string | undefined;
  styles: MovieStyles;
}) {
  return (
    <View style={styles.hero}>
      {movie.backdropUrl ? (
        <Image source={{ uri: movie.backdropUrl }} style={styles.backdrop} contentFit="cover" />
      ) : null}
      <View style={styles.heroFade} />
      <View style={styles.heroRow}>
        <Image style={styles.poster} source={{ uri: movie.posterUrl }} accessibilityLabel={movie.posterAlt} />
        <View style={styles.heroText}>
          <Text style={styles.title}>{movie.title}</Text>
          <Text style={styles.meta}>
            {movie.releaseYear} · {movie.runtimeMinutes} min
          </Text>
          <Text style={styles.genres} numberOfLines={2}>
            {movie.genres.join(" · ")}
          </Text>
          {imdbTitleUrl ? (
            <Pressable style={styles.imdbBtn} onPress={() => void openURL(imdbTitleUrl)}>
              <Text style={styles.imdbBtnText}>Open on IMDb</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function SightingsSection({
  featured,
  sortOptions,
  setSightSort,
  setSightPage,
  styles,
}: {
  featured: NonNullable<MovieDetailResponse["featuredRats"]>;
  sortOptions: { value: MovieSightingsSort; label: string }[];
  setSightSort: (s: MovieSightingsSort) => void;
  setSightPage: Dispatch<SetStateAction<number>>;
  styles: MovieStyles;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sort & paging</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {sortOptions.map((opt) => {
          const on = featured.sort === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setSightSort(opt.value)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={styles.pagingNote}>
        {featured.totalCount} sighting{featured.totalCount === 1 ? "" : "s"} · page {featured.page} of{" "}
        {featured.pageCount}
      </Text>
      <View style={styles.pager}>
        <Pressable
          onPress={() => setSightPage((p) => Math.max(1, p - 1))}
          disabled={featured.page <= 1}
          style={[styles.pageBtn, featured.page <= 1 && styles.pageBtnOff]}
        >
          <Text style={styles.pageBtnText}>Prev</Text>
        </Pressable>
        <Pressable
          onPress={() => setSightPage((p) => Math.min(featured.pageCount, p + 1))}
          disabled={featured.page >= featured.pageCount}
          style={[styles.pageBtn, featured.page >= featured.pageCount && styles.pageBtnOff]}
        >
          <Text style={styles.pageBtnText}>Next</Text>
        </Pressable>
      </View>

      {featured.sightings.length === 0 ? (
        <Text style={styles.muted}>No catalog sightings yet for this title.</Text>
      ) : (
        featured.sightings.map((s) => <SightingCard key={s.id} sighting={s} />)
      )}
    </View>
  );
}

export default function MovieScreen() {
  const { colors } = useTheme();

  const { slug: rawSlug } = useLocalSearchParams<{ slug: string }>();
  const slug = useMemo(() => {
    const s = typeof rawSlug === "string" ? rawSlug : rawSlug?.[0];
    return decodeURIComponent(s ?? "").trim();
  }, [rawSlug]);

  const [tab, setTab] = useState<TabKey>("sightings");
  const [sightSort, setSightSort] = useState<MovieSightingsSort>("newest");
  const [sightPage, setSightPage] = useState(1);

  const [data, setData] = useState<MovieDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const movie = data?.movie;

  const movieBar = useMemo(() => {
    if (!movie) return null;
    const bg = posterToneToHex(movie.posterTone, colors.headerBg);
    return {
      bg,
      fg: contrastingForeground(bg),
      status: statusBarStyleForBackground(bg),
    };
  }, [movie, colors.headerBg]);

  const styles = useMemo(
    () => createMovieStyles(colors, movieBar?.bg),
    [colors, movieBar?.bg],
  );

  const load = useCallback(async () => {
    if (!slug) return;
    setError(null);
    try {
      const res = await fetchMovieDetail({
        slug,
        sort: sightSort,
        page: sightPage,
      });
      setData(res);
      setSightPage(res.featuredRats.page);
      setSightSort(res.featuredRats.sort);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load movie.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slug, sightSort, sightPage]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSightPage(1);
  }, [sightSort, slug]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const featured = data?.featuredRats;
  const tabs = data?.tabs;

  const sortOptions = useMemo(() => {
    if (!featured) return [] as { value: MovieSightingsSort; label: string }[];
    return (Object.keys(featured.sortLabels) as MovieSightingsSort[]).map((value) => ({
      value,
      label: featured.sortLabels[value],
    }));
  }, [featured]);

  if (!slug) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Missing movie slug.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: movie?.title ?? "Movie",
          headerTitleAlign: "center" as const,
          headerTitle: () => (
            <HeaderThemeWordmark wordmarkColor={movieBar?.fg} />
          ),
          headerStyle: { backgroundColor: movieBar?.bg ?? colors.headerBg },
          headerTintColor: movieBar?.fg ?? colors.accent,
          contentStyle: { backgroundColor: movieBar?.bg ?? colors.background },
          statusBarStyle: movieBar?.status ?? colors.statusBarStyle,
        }}
      />
      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : null}

      {error && !data ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.primaryBtn} onPress={() => void load()}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {movie && tabs ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <HeroBlock movie={movie} imdbTitleUrl={data.links.imdbTitle} styles={styles} />

          {movie.summary ? <Text style={styles.summary}>{movie.summary}</Text> : null}

          {error ? (
            <View style={styles.softBanner}>
              <Text style={styles.softBannerText}>{error}</Text>
            </View>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {TAB_DEFS.map((t) => {
              const active = tab === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  style={[styles.tabChip, active && styles.tabChipOn]}
                >
                  <Text style={[styles.tabChipText, active && styles.tabChipTextOn]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {tab === "sightings" && featured ? (
            <SightingsSection
              featured={featured}
              sortOptions={sortOptions}
              setSightSort={setSightSort}
              setSightPage={setSightPage}
              styles={styles}
            />
          ) : null}

          {tab === "facts" ? (
            <View style={styles.section}>
              {(tabs.facts?.length ?? 0) === 0 ? (
                <Text style={styles.muted}>No rat-related trivia synced yet.</Text>
              ) : (
                tabs.facts!.map((line, i) => (
                  <View key={`${i}`} style={styles.factBlock}>
                    <Text style={styles.factIndex}>{i + 1}.</Text>
                    <Text style={styles.factText}>{line}</Text>
                  </View>
                ))
              )}
            </View>
          ) : null}

          {tab === "reviews" ? (
            <View style={styles.section}>
              {(tabs.reviews?.length ?? 0) === 0 ? (
                <Text style={styles.muted}>No IMDb user reviews synced yet.</Text>
              ) : (
                tabs.reviews!.map((r) => (
                  <View key={r.id} style={styles.reviewCard}>
                    <Text style={styles.reviewAuthor}>
                      {r.author}
                      {typeof r.rating === "number" ? ` · ${r.rating}/10` : ""}
                    </Text>
                    <Text style={styles.reviewDate}>{r.date}</Text>
                    <Text style={styles.reviewSummary}>{r.summary}</Text>
                    <Text style={styles.reviewBody}>{r.text}</Text>
                  </View>
                ))
              )}
            </View>
          ) : null}

          {tab === "related" ? (
            <View style={styles.section}>
              {(tabs.related?.length ?? 0) === 0 ? (
                <Text style={styles.muted}>No related titles from IMDb yet.</Text>
              ) : (
                tabs.related!.map((r) => (
                  <Pressable
                    key={r.id}
                    style={styles.relatedRow}
                    onPress={() => void openURL(`https://www.imdb.com/title/${r.id}/`)}
                  >
                    {r.posterUrl ? (
                      <Image source={{ uri: r.posterUrl }} style={styles.relatedPoster} />
                    ) : (
                      <View style={[styles.relatedPoster, styles.relatedPosterPh]}>
                        <Text style={styles.relatedPosterPhText}>—</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.relatedTitle}>{r.title}</Text>
                      <Text style={styles.muted}>
                        {typeof r.year === "number" ? `${r.year} · ` : ""}
                        {typeof r.rating === "number" ? `IMDb ${r.rating}` : "IMDb"}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          ) : null}

          {tab === "videos" ? (
            <View style={styles.section}>
              {(tabs.videos?.length ?? 0) === 0 ? (
                <Text style={styles.muted}>No IMDb videos synced yet.</Text>
              ) : (
                tabs.videos!.map((v) => (
                  <Pressable
                    key={v.id}
                    style={styles.videoRow}
                    onPress={() => void openURL(`https://www.imdb.com/video/${v.id}/`)}
                  >
                    {v.thumbnailUrl ? (
                      <Image source={{ uri: v.thumbnailUrl }} style={styles.videoThumb} />
                    ) : (
                      <View style={[styles.videoThumb, styles.relatedPosterPh]}>
                        <Text style={styles.relatedPosterPhText}>▶</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.relatedTitle}>{v.name}</Text>
                      <Text style={styles.muted}>{v.contentType ?? "Video"}</Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          ) : null}

          {tab === "images" ? (
            <View style={styles.section}>
              {(tabs.images?.length ?? 0) === 0 ? (
                <Text style={styles.muted}>No IMDb stills synced yet.</Text>
              ) : (
                tabs.images!.map((im) => (
                  <View key={im.id} style={styles.stillBlock}>
                    <Image source={{ uri: im.url }} style={styles.stillImg} contentFit="contain" />
                    {im.caption ? <Text style={styles.muted}>{im.caption}</Text> : null}
                  </View>
                ))
              )}
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </>
  );
}
