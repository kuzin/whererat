import { openURL } from "expo-linking";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Stack, useLocalSearchParams, useNavigation } from "expo-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type Dispatch,
} from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
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
import { extractChromeFromPosterUri } from "../../lib/posterChromeFromImage";
import {
  contrastingForeground,
  posterToneToHex,
  statusBarStyleForBackground,
} from "../../lib/posterTone";
import { type ThemeColors, useTheme } from "../../lib/theme";
import type { MovieDetailResponse, MovieSightingsSort, SightingPublic } from "../../lib/types";

type TabKey = "sightings" | "facts" | "reviews" | "related" | "videos" | "images";

const TAB_DEFS: { key: TabKey; label: string }[] = [
  { key: "sightings", label: "Featured Rats" },
  { key: "facts", label: "Facts" },
  { key: "reviews", label: "Reviews" },
  { key: "related", label: "Related" },
  { key: "videos", label: "Video" },
  { key: "images", label: "Stills" },
];

function resolveHeaderBannerUrl(movie: NonNullable<MovieDetailResponse["movie"]>): string {
  return movie.headerBanner?.trim() || movie.posterUrl;
}

function createMovieStyles(colors: ThemeColors) {
  const surface = colors.headerBg;
  const heroTopInset = Platform.OS === "ios" ? 116 : 20;

  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: surface },
    fixedBackdrop: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.54,
    },
    /** Canvas: visible when overscrolling / pulling from top; not between white section cards. */
    scroll: { flex: 1, backgroundColor: "transparent" },
    scrollContent: { paddingBottom: 40, flexGrow: 1, position: "relative" },
    /** White body zone for all content sections below the top zone. */
    scrollBodyPanel: {
      flexGrow: 1,
      backgroundColor: colors.headerBg,
      gap: 12,
      paddingTop: 16,
      overflow: "hidden",
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
      marginBottom: 0,
      overflow: "hidden",
      backgroundColor: "transparent",
      minHeight: 170,
    },
    heroRow: {
      flexDirection: "row",
      gap: 16,
      padding: 16,
      paddingTop: heroTopInset,
      alignItems: "flex-end",
    },
    heroTitleBarBlur: {
      margin: 10,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: "rgba(255,255,255,0.08)",
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
    heroTabsStrip: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 12,
      backgroundColor: colors.headerBg,
    },
    heroTabsRow: {
      gap: 4,
      flexDirection: "row",
      paddingHorizontal: 2,
    },
    softBanner: {
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 10,
      borderRadius: 8,
      backgroundColor: colors.dangerBg,
    },
    softBannerText: { color: colors.dangerText, fontSize: 14 },
    tabChip: {
      borderRadius: 0,
      paddingHorizontal: 14,
      paddingVertical: 14,
      backgroundColor: "transparent",
      borderWidth: 0,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabChipOn: { borderBottomColor: colors.accent },
    tabChipText: { color: colors.textMuted, fontWeight: "600", fontSize: 14 },
    tabChipTextOn: { color: colors.text, fontWeight: "700" },
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
    sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
    sortRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 4,
    },
    sortSelect: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: 170,
      maxWidth: "75%",
      backgroundColor: colors.panel,
      borderRadius: 9,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
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
    sortSelectChevron: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
    pagingNote: { color: colors.textMuted, fontSize: 14, marginBottom: 8 },
    loadingMoreWrap: { paddingVertical: 12, alignItems: "center", justifyContent: "center" },
    sheetBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
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
    sheetRowTextOn: { color: colors.text, fontWeight: "700" },
    sheetCheck: { color: colors.accent, fontWeight: "800" },
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
  tab,
  setTab,
  blurTint,
  styles,
}: {
  movie: NonNullable<MovieDetailResponse["movie"]>;
  imdbTitleUrl: string | undefined;
  tab: TabKey;
  setTab: (next: TabKey) => void;
  blurTint: "light" | "dark";
  styles: MovieStyles;
}) {
  return (
    <View style={styles.hero}>
      <BlurView intensity={36} tint={blurTint} style={styles.heroTitleBarBlur}>
        <View style={styles.heroRow}>
          <Image
            style={styles.poster}
            source={{ uri: movie.posterUrl }}
            accessibilityLabel={movie.posterAlt}
            recyclingKey={`${movie.id}:${movie.posterUrl}`}
          />
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
      </BlurView>
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

function SightingsSection({
  sightings,
  totalCount,
  currentPage,
  pageCount,
  loadingMore,
  sortOptions,
  activeSort,
  setSightSort,
  isSortOpen,
  setSortOpen,
  styles,
}: {
  sightings: SightingPublic[];
  totalCount: number;
  currentPage: number;
  pageCount: number;
  loadingMore: boolean;
  sortOptions: { value: MovieSightingsSort; label: string }[];
  activeSort: MovieSightingsSort;
  setSightSort: (s: MovieSightingsSort) => void;
  isSortOpen: boolean;
  setSortOpen: Dispatch<boolean>;
  styles: MovieStyles;
}) {
  const activeSortLabel = sortOptions.find((opt) => opt.value === activeSort)?.label ?? "Newest";
  return (
    <View style={styles.section}>
      <View style={styles.sortRow}>
        <Text style={styles.sectionTitle}>Featured Rats</Text>
        <Pressable style={styles.sortSelect} onPress={() => setSortOpen(true)}>
          <Text style={styles.sortLabel}>Sort</Text>
          <Text numberOfLines={1} style={styles.sortSelectText}>
            {activeSortLabel}
          </Text>
          <Text style={styles.sortSelectChevron}>▼</Text>
        </Pressable>
      </View>
      <Text style={styles.pagingNote}>
        {totalCount} sighting{totalCount === 1 ? "" : "s"} · loaded page {currentPage} of {pageCount}
      </Text>
      {sightings.length === 0 ? (
        <Text style={styles.muted}>No catalog sightings yet for this title.</Text>
      ) : (
        sightings.map((s) => <SightingCard key={s.id} sighting={s} />)
      )}
      {loadingMore ? (
        <View style={styles.loadingMoreWrap}>
          <ActivityIndicator size="small" />
        </View>
      ) : null}
      <Modal transparent visible={isSortOpen} animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <View style={styles.sheetBackdrop} />
        <View style={styles.sheetCenterOuter}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Sort featured rats</Text>
            {sortOptions.map((opt) => {
              const on = activeSort === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    setSortOpen(false);
                    setSightSort(opt.value);
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
  const [sightings, setSightings] = useState<SightingPublic[]>([]);
  const [sightPageMeta, setSightPageMeta] = useState({ page: 1, pageCount: 1, totalCount: 0 });
  const [loadingMoreSightings, setLoadingMoreSightings] = useState(false);

  const [data, setData] = useState<MovieDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const movie = data?.movie;

  const apiChromeFallback = useMemo(() => {
    if (!movie) return colors.headerBg;
    const apiPaletteChrome =
      typeof movie.pagePalette?.heroBloom === "string" ? movie.pagePalette.heroBloom.trim() : "";
    if (apiPaletteChrome) return apiPaletteChrome;
    return posterToneToHex(movie.posterTone, colors.headerBg);
  }, [movie, colors.headerBg]);

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
    return {
      bg,
      fg: contrastingForeground(bg),
      status: statusBarStyleForBackground(bg),
    };
  }, [movie, posterChromeHex, apiChromeFallback]);

  /** Native stack merges options oddly with iOS 26 scroll chrome; set here so poster headers update reliably. */
  useLayoutEffect(() => {
    const sceneBgChrome = colors.headerBg;
    const fgChrome = movieBar?.fg ?? colors.accent;
    const statusChrome = movieBar?.status ?? colors.statusBarStyle;
    const next: NativeStackNavigationOptions = {
      title: movie?.title ?? "Movie",
      headerTitleAlign: "center",
      headerTitle: () => <HeaderThemeWordmark wordmarkColor={movieBar?.fg} />,
      headerStyle: { backgroundColor: "transparent" },
      headerTransparent: Platform.OS === "ios",
      headerTintColor: fgChrome,
      headerShadowVisible: false,
      headerBackButtonDisplayMode: "minimal",
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
    colors.headerBg,
    colors.accent,
    colors.statusBarStyle,
  ]);

  const styles = useMemo(() => createMovieStyles(colors), [colors]);

  const load = useCallback(async () => {
    if (!slug) return;
    const slugSnap = decodeURIComponent(slug).trim();
    const sortSnap = sightSort;
    const pageSnap = 1;
    setError(null);
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
        setError(e instanceof Error ? e.message : "Could not load movie.");
        setData(null);
        setSightings([]);
        setSightPageMeta({ page: 1, pageCount: 1, totalCount: 0 });
      }
    } finally {
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
      setError(e instanceof Error ? e.message : "Could not load more sightings.");
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

  if (!slug) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Missing movie slug.</Text>
      </View>
    );
  }

  return (
    <>
      {/* Options are pushed in `useLayoutEffect` above (poster chrome + iOS scroll-edge fixes). */}
      <Stack.Screen options={{ headerShown: true }} />
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
        <View style={styles.screen}>
          <Image
            source={{ uri: heroBannerUrl }}
            style={styles.fixedBackdrop}
            contentFit="cover"
            blurRadius={6}
            recyclingKey={`${movie.id}:fixed-bg:${heroBannerUrl}`}
            pointerEvents="none"
          />
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
            }
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            onScroll={onMainScroll}
            scrollEventThrottle={16}
            stickyHeaderIndices={[0, 1]}
          >
            <HeroBlock
              movie={movie}
              imdbTitleUrl={data.links.imdbTitle}
              tab={tab}
              setTab={setTab}
              blurTint={colors.blurTint}
              styles={styles}
            />
            <MovieTabsBar tab={tab} setTab={setTab} styles={styles} />

            <View style={styles.scrollBodyPanel}>
            {error ? (
              <View style={styles.softBanner}>
                <Text style={styles.softBannerText}>{error}</Text>
              </View>
            ) : null}

            {tab === "sightings" && featured ? (
              <SightingsSection
                sightings={sightings}
                totalCount={sightPageMeta.totalCount}
                currentPage={sightPageMeta.page}
                pageCount={sightPageMeta.pageCount}
                loadingMore={loadingMoreSightings}
                sortOptions={sortOptions}
                activeSort={sightSort}
                setSightSort={setSightSort}
                isSortOpen={isSortOpen}
                setSortOpen={setSortOpen}
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
                        <Image
                          source={{ uri: r.posterUrl }}
                          style={styles.relatedPoster}
                          recyclingKey={`${movie.id}:related:${r.id}:${r.posterUrl}`}
                        />
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
                      <Image
                        source={{ uri: im.url }}
                        style={styles.stillImg}
                        contentFit="contain"
                        recyclingKey={`${movie.id}:still:${im.id}:${im.url}`}
                      />
                      {im.caption ? <Text style={styles.muted}>{im.caption}</Text> : null}
                    </View>
                  ))
                )}
              </View>
            ) : null}
            </View>
          </ScrollView>
        </View>
      ) : null}
    </>
  );
}
