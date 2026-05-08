import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppToast } from "../components/AppToast";
import { EmptyStateCard } from "../components/EmptyStateCard";
import { fetchCatalogPage, formatApiError } from "../lib/api";
import { useOptionalBottomTabBarHeight } from "../lib/useOptionalBottomTabBarHeight";
import { mixTowardHex } from "../lib/posterTone";
import { type ThemeColors, useTheme } from "../lib/theme";
import type { CatalogMovieRow, CatalogResponse, CatalogSort } from "../lib/types";

type CatalogLayoutMode = "list" | "card";

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "latest-added-title", label: "Latest titles" },
  { value: "latest-sighting", label: "Latest sighting" },
  { value: "most-rats-logged", label: "Most rats" },
  { value: "total-sightings", label: "Total sightings" },
];

/** One horizontal inset for chrome + scroll content (aligned edges) */
const INSET_X = 16;
const CARD_COLS = 3;
/** Same rhythm everywhere (sections, toolbar gaps, grid gutters) */
const SPACE_Y = 12;
/** Slightly tighter gap between search field and filter row */
const CATALOG_SEARCH_TO_FILTERS_GAP = 8;
const CARD_GAP = SPACE_Y;
const CATALOG_CONTENT_INSET_X = 20;
/** Tighter horizontal inset for list rows than the card grid */
const CATALOG_LIST_INSET_X = 14;
/** Extra inset below catalog scroll plus safe-area (pager sits above home indicator). */
const SCROLL_BOTTOM_EXTRA = 28;
function gridPosterWidthPx(screenWidth: number): number {
  return (screenWidth - CATALOG_CONTENT_INSET_X * 2 - CARD_GAP * (CARD_COLS - 1)) / CARD_COLS;
}

function createCatalogStyles(colors: ThemeColors, scrollBottomPad: number) {
  const warmLine = colors.dividerStrong;
  const warmLineSoft = colors.inputBorder;
  const warmPanel = "transparent";
  /** Slightly darker than app `background`; matches movie tab-scroll treatment a bit more softly */
  const catalogCanvasBg = mixTowardHex(
    colors.background,
    colors.panel,
    colors.mode === "dark" ? 0.17 : 0.055,
  );

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: catalogCanvasBg,
    },
    catalogList: {
      flex: 1,
      backgroundColor: catalogCanvasBg,
    },
    /** Full-width band matching stack header (`headerBg`) */
    catalogHeaderStripe: {
      backgroundColor: colors.headerBg,
      paddingVertical: SPACE_Y,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: warmLine,
    },
    /** Inset content inside the stripe */
    catalogTop: {
      paddingHorizontal: INSET_X,
      gap: CATALOG_SEARCH_TO_FILTERS_GAP,
    },
    searchFieldOuter: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.panel,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.inputBorder,
      overflow: "hidden",
      position: "relative",
    },
    searchFieldOuterFocused: {
      borderColor: colors.inputBorderFocused,
    },
    /** Icon layered on leading edge; typing area starts behind it via padding */
    searchIconWrap: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 44,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      paddingLeft: 44,
      paddingRight: INSET_X,
      paddingVertical: 11,
      color: colors.text,
      fontSize: 16,
      backgroundColor: "transparent",
    },
    /** Room for the trailing clear control when `queryInput` is non-empty. */
    searchInputWithClear: {
      paddingRight: 44,
    },
    searchClearWrap: {
      position: "absolute",
      right: 8,
      top: 0,
      bottom: 0,
      width: 36,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2,
    },
    filterRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACE_Y,
      flexShrink: 0,
      minHeight: 44,
    },
    selectGrow: {
      flex: 1,
      minWidth: 0,
    },
    layoutToggle: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.panel,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: warmLineSoft,
      padding: 3,
      flexShrink: 0,
      gap: 3,
      minHeight: 44,
    },
    layoutToggleBtn: {
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 7,
      justifyContent: "center",
      alignItems: "center",
    },
    layoutToggleBtnOn: {
      backgroundColor: colors.chipActive,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.chipActiveOutline,
    },
    select: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: 0,
      minHeight: 44,
      backgroundColor: colors.panel,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: warmLineSoft,
      paddingHorizontal: 11,
      paddingVertical: 0,
      justifyContent: "center",
    },
    selectText: {
      flex: 1,
      minWidth: 0,
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    selectChevron: { marginLeft: 6, flexShrink: 0 },
    modalRoot: {
      flex: 1,
    },
    sheetBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlayScrim,
    },
    sheetCenterOuter: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      paddingHorizontal: INSET_X,
      pointerEvents: "box-none",
    },
    sheetCard: {
      backgroundColor: colors.panel,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: warmLineSoft,
      paddingTop: SPACE_Y,
      paddingBottom: SPACE_Y,
      maxHeight: 420,
      pointerEvents: "auto",
      overflow: "hidden",
    },
    sheetList: {
      flexGrow: 0,
      maxHeight: 340,
    },
    sheetTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
      paddingHorizontal: INSET_X,
      paddingBottom: SPACE_Y,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: warmLineSoft,
      marginBottom: 2,
    },
    sheetRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 11,
      paddingHorizontal: INSET_X,
      gap: SPACE_Y,
    },
    sheetRowOn: {
      backgroundColor: colors.chipActive,
    },
    sheetRowText: {
      flex: 1,
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: "500",
    },
    sheetRowTextOn: {
      color: colors.text,
      fontWeight: "700",
    },
    /** Shared scroll canvas; combine with list or card inset style */
    catalogScrollContentBase: {
      paddingBottom: scrollBottomPad,
      flexGrow: 1,
      backgroundColor: catalogCanvasBg,
    },
    catalogScrollContentList: {
      paddingHorizontal: CATALOG_LIST_INSET_X,
      paddingTop: CATALOG_LIST_INSET_X,
    },
    catalogScrollContentCard: {
      paddingHorizontal: CATALOG_CONTENT_INSET_X,
      paddingTop: CATALOG_CONTENT_INSET_X,
    },
    cardGridRow: {
      gap: CARD_GAP,
      marginBottom: CARD_GAP + 4,
      justifyContent: "flex-start",
    },
    posterTile: {
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: colors.panel,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: warmLineSoft,
      shadowColor: colors.text,
      shadowOpacity: colors.mode === "light" ? 0.08 : 0,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    posterTileImg: {
      borderRadius: 8,
      backgroundColor: colors.panel,
    },
    catalogListRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 9,
      gap: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: warmLine,
      backgroundColor: warmPanel,
      paddingHorizontal: 2,
    },
    poster: {
      width: 52,
      height: 78,
      borderRadius: 6,
      backgroundColor: colors.headerBg,
    },
    rowText: { flex: 1, gap: 4 },
    rowTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
    rowMeta: { color: colors.textMuted, fontSize: 14 },
    rowRating: { color: colors.accent, fontSize: 13 },
    rowRatingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    rowRatingIcon: { color: colors.accent },
    chevron: { color: colors.textMuted, fontSize: 28, fontWeight: "200" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
    pager: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: INSET_X,
      paddingVertical: SPACE_Y,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.panel,
    },
    pageBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.accent,
    },
    pageBtnDisabled: { opacity: 0.35 },
    pageBtnText: { color: colors.retryOnAccent, fontWeight: "700" },
    pageInfo: { color: colors.text, fontWeight: "600" },
    successBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlayScrim,
    },
    successCenterOuter: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      paddingHorizontal: INSET_X,
      pointerEvents: "box-none",
    },
    successCard: {
      pointerEvents: "auto",
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.chipActiveOutline,
      backgroundColor: colors.panel,
      padding: 16,
      gap: 12,
    },
    successEmoji: { fontSize: 32, lineHeight: 36, textAlign: "center" },
    successTitle: { color: colors.text, fontSize: 20, fontWeight: "800", textAlign: "center" },
    successBody: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    },
    successBtnPrimary: {
      backgroundColor: colors.accent,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
    },
    successBtnPrimaryText: { color: colors.retryOnAccent, fontSize: 15, fontWeight: "800" },
  });
}

type CatalogStyles = ReturnType<typeof createCatalogStyles>;

type SelectModalProps<T extends string> = {
  visible: boolean;
  title: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
  styles: CatalogStyles;
  accentColor: string;
};

function SelectSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  styles,
  accentColor,
}: SelectModalProps<T>) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.sheetBackdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        <View pointerEvents="box-none" style={styles.sheetCenterOuter}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <FlatList
              data={options}
              keyExtractor={(it) => it.value}
              keyboardShouldPersistTaps="handled"
              style={styles.sheetList}
              nestedScrollEnabled
              renderItem={({ item }) => {
                const on = item.value === selected;
                return (
                  <Pressable
                    onPress={() => {
                      onSelect(item.value);
                      onClose();
                    }}
                    style={[styles.sheetRow, on && styles.sheetRowOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.sheetRowText, on && styles.sheetRowTextOn]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {on ? <Ionicons name="checkmark" size={20} color={accentColor} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PosterTile({
  item,
  posterWidth,
  styles,
  onOpenMovie,
}: {
  item: CatalogMovieRow;
  posterWidth: number;
  styles: CatalogStyles;
  onOpenMovie: (slug: string) => void;
}) {
  const w = posterWidth;
  const h = Math.round(w * 1.52);
  return (
    <Pressable
      onPress={() => onOpenMovie(item.slug)}
      style={[styles.posterTile, { width: w }]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <Image
        source={{ uri: item.posterUrl }}
        style={[styles.posterTileImg, { width: w, height: h }]}
        contentFit="cover"
        accessibilityLabel={item.posterAlt}
        recyclingKey={`${item.id}:${item.posterUrl}`}
      />
    </Pressable>
  );
}

function MovieRow({
  item,
  styles,
  onOpenMovie,
}: {
  item: CatalogMovieRow;
  styles: CatalogStyles;
  onOpenMovie: (slug: string) => void;
}) {
  return (
    <Pressable
      style={styles.catalogListRow}
      onPress={() => onOpenMovie(item.slug)}
    >
      <Image
        source={{ uri: item.posterUrl }}
        style={styles.poster}
        accessibilityLabel={item.posterAlt}
        recyclingKey={`${item.id}:${item.posterUrl}`}
      />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.rowMeta}>
          {item.releaseYear} · {item.sightingCount} sighting{item.sightingCount === 1 ? "" : "s"}
        </Text>
        {item.imdbRating ? (
          <View style={styles.rowRatingRow}>
            <Ionicons name="star" size={12} style={styles.rowRatingIcon} />
            <Text style={styles.rowRating}>IMDb {item.imdbRating}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export default function CatalogScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ success?: string }>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const scrollBottomPad = Math.max(insets.bottom, 14) + SCROLL_BOTTOM_EXTRA;
  const styles = useMemo(() => createCatalogStyles(colors, scrollBottomPad), [colors, scrollBottomPad]);

  const { width: screenWidth } = useWindowDimensions();
  const posterWidth = useMemo(() => gridPosterWidthPx(screenWidth), [screenWidth]);

  const [queryInput, setQueryInput] = useState("");
  const [queryApplied, setQueryApplied] = useState("");
  const [genre, setGenre] = useState("all");
  const [sort, setSort] = useState<CatalogSort>("latest-added-title");
  const [page, setPage] = useState(1);
  const [genreSheetOpen, setGenreSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<CatalogLayoutMode>("list");

  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogSearchFocused, setCatalogSearchFocused] = useState(false);
  const lastMovieNavAtRef = useRef(0);
  const [successPreviewOpen, setSuccessPreviewOpen] = useState(false);

  /**
   * Guard against accidental double-taps that push the same route twice.
   * This keeps back-navigation to a single step.
   */
  const openMovie = useCallback((slug: string) => {
    const now = Date.now();
    if (now - lastMovieNavAtRef.current < 650) return;
    lastMovieNavAtRef.current = now;
    router.push(`/movie/${encodeURIComponent(slug)}`);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQueryApplied(queryInput.trim()), 380);
    return () => clearTimeout(t);
  }, [queryInput]);

  useEffect(() => {
    setPage(1);
  }, [queryApplied, genre, sort]);

  useEffect(() => {
    if (params.success !== "1") return;
    /** Opening modal only — `router.replace("/")` here clears params immediately and can remount catalog state before `successPreviewOpen` sticks (modal never appears). Strip params when the user dismisses instead. */
    setSuccessPreviewOpen(true);
  }, [params.success]);

  const dismissSuccessPreview = useCallback(() => {
    setSuccessPreviewOpen(false);
    if (params.success === "1") {
      router.replace("/");
    }
  }, [params.success]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchCatalogPage({
        q: queryApplied,
        genre,
        sort,
        page,
      });
      setData(res);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [queryApplied, genre, sort, page]);

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

  const resetCatalogFilters = useCallback(() => {
    setQueryInput("");
    setQueryApplied("");
    setGenre("all");
    setSort("latest-added-title");
    setPage(1);
  }, []);

  const emptyListShowsReset =
    (queryInput.trim().length > 0 ||
      queryApplied.trim().length > 0 ||
      genre !== "all" ||
      sort !== "latest-added-title" ||
      page > 1) &&
    !loading &&
    ((data?.movies?.length ?? 0) === 0);

  const genres = data?.genres ?? [];
  const genreOptions = useMemo(
    () =>
      [{ value: "all" as const, label: "All genres" }, ...genres.map((g) => ({ value: g, label: g }))],
    [genres],
  );

  const genreLabel = genre === "all" ? "All genres" : genre;
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort;

  const catalogSearchHasText = queryInput.length > 0;

  const tabBarHeight = useOptionalBottomTabBarHeight();
  const toastBottom = tabBarHeight + Math.max(insets.bottom, 10);

  return (
    <View style={styles.screen}>
      <View style={styles.catalogHeaderStripe}>
        <View style={styles.catalogTop}>
          <View
            style={[styles.searchFieldOuter, catalogSearchFocused && styles.searchFieldOuterFocused]}
          >
            <View style={styles.searchIconWrap} pointerEvents="none">
              <Ionicons name="search" size={20} color={colors.iconMuted} />
            </View>
            <TextInput
              placeholder="Search titles…"
              placeholderTextColor={colors.iconMuted}
              value={queryInput}
              onChangeText={setQueryInput}
              style={[styles.searchInput, catalogSearchHasText && styles.searchInputWithClear]}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Search catalog"
              selectionColor={colors.accent}
              onFocus={() => setCatalogSearchFocused(true)}
              onBlur={() => setCatalogSearchFocused(false)}
              {...(Platform.OS === "android" ? { cursorColor: colors.accent } : {})}
            />
            {catalogSearchHasText ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.searchClearWrap}
                onPress={() => setQueryInput("")}
              >
                <Ionicons name="close-circle" size={22} color={colors.iconMuted} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.filterRow}>
            <Pressable
              style={[styles.select, styles.selectGrow]}
              onPress={() => setGenreSheetOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`Genre filter, ${genreLabel}`}
            >
              <Text style={styles.selectText} numberOfLines={1}>
                {genreLabel}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} style={styles.selectChevron} />
            </Pressable>
            <Pressable
              style={[styles.select, styles.selectGrow]}
              onPress={() => setSortSheetOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`Sort, ${sortLabel}`}
            >
              <Text style={styles.selectText} numberOfLines={1}>
                {sortLabel}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} style={styles.selectChevron} />
            </Pressable>
            <View style={styles.layoutToggle} accessibilityLabel="Catalog layout">
              <Pressable
                onPress={() => setLayoutMode("list")}
                style={[styles.layoutToggleBtn, layoutMode === "list" && styles.layoutToggleBtnOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: layoutMode === "list" }}
                accessibilityLabel="List view"
              >
                <Ionicons name="list" size={22} color={layoutMode === "list" ? colors.text : colors.textMuted} />
              </Pressable>
              <Pressable
                onPress={() => setLayoutMode("card")}
                style={[styles.layoutToggleBtn, layoutMode === "card" && styles.layoutToggleBtnOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: layoutMode === "card" }}
                accessibilityLabel="Card view"
              >
                <Ionicons name="grid" size={20} color={layoutMode === "card" ? colors.text : colors.textMuted} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <SelectSheet<string>
        visible={genreSheetOpen}
        title="Genre"
        options={genreOptions}
        selected={genre}
        onSelect={(v) => setGenre(v)}
        onClose={() => setGenreSheetOpen(false)}
        styles={styles}
        accentColor={colors.accent}
      />
      <SelectSheet<CatalogSort>
        visible={sortSheetOpen}
        title="Sort by"
        options={SORT_OPTIONS}
        selected={sort}
        onSelect={setSort}
        onClose={() => setSortSheetOpen(false)}
        styles={styles}
        accentColor={colors.accent}
      />
      <Modal
        visible={successPreviewOpen}
        transparent
        animationType="fade"
        onRequestClose={dismissSuccessPreview}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.successBackdrop}
            onPress={dismissSuccessPreview}
            accessibilityRole="button"
            accessibilityLabel="Dismiss success message"
          />
          <View style={styles.successCenterOuter}>
            <View style={styles.successCard}>
              <Text style={styles.successEmoji}>🐀</Text>
              <Text style={styles.successTitle}>Sighting submitted!</Text>
              <Text style={styles.successBody}>
                Thanks for logging it. Your sighting is in the moderation queue and will appear after review.
              </Text>
              <Pressable
                style={styles.successBtnPrimary}
                onPress={dismissSuccessPreview}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text style={styles.successBtnPrimaryText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
      <FlatList
        style={styles.catalogList}
        key={layoutMode === "card" ? "catalog-card" : "catalog-list"}
        data={data?.movies ?? []}
        keyExtractor={(m) => m.id}
        numColumns={layoutMode === "card" ? CARD_COLS : 1}
        columnWrapperStyle={layoutMode === "card" ? styles.cardGridRow : undefined}
        refreshControl={
          <RefreshControl
            key={`catalog-refresh-${colors.mode}-${isFocused ? "focused" : "blurred"}`}
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.formCanvas}
            titleColor={colors.accent}
          />
        }
        renderItem={({ item }) =>
          layoutMode === "list" ? (
            <MovieRow item={item} styles={styles} onOpenMovie={openMovie} />
          ) : (
            <PosterTile
              item={item}
              posterWidth={posterWidth}
              styles={styles}
              onOpenMovie={openMovie}
            />
          )
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyStateCard
              colors={colors}
              title="No rats in this hole."
              body="Widen those filters—or check back once more titles land in the catalog."
              actionLabel={
                emptyListShowsReset ? "Reset filters & search" : undefined
              }
              onActionPress={
                emptyListShowsReset ? resetCatalogFilters : undefined
              }
            />
          ) : null
        }
        contentContainerStyle={[
          styles.catalogScrollContentBase,
          layoutMode === "list" ? styles.catalogScrollContentList : styles.catalogScrollContentCard,
        ]}
      />
      )}

      {data && data.pageCount > 1 ? (
        <View style={styles.pager}>
          <Pressable
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
          >
            <Text style={styles.pageBtnText}>Previous</Text>
          </Pressable>
          <Text style={styles.pageInfo}>
            Page {data.page} / {data.pageCount}
          </Text>
          <Pressable
            onPress={() => setPage((p) => Math.min(data.pageCount, p + 1))}
            disabled={page >= data.pageCount}
            style={[styles.pageBtn, page >= data.pageCount && styles.pageBtnDisabled]}
          >
            <Text style={styles.pageBtnText}>Next</Text>
          </Pressable>
        </View>
      ) : null}

      <AppToast
        message={error}
        onDismiss={() => setError(null)}
        bottomOffset={toastBottom}
        action={{ label: "Retry", onPress: () => void load() }}
      />
    </View>
  );
}
