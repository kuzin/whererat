import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { EmptyStateCard } from "../../components/EmptyStateCard";
import { fetchCatalogPage } from "../../lib/api";
import { type ThemeColors, useTheme } from "../../lib/theme";
import type { CatalogMovieRow, CatalogResponse, CatalogSort } from "../../lib/types";

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
/** Reserve space above floating tab bar + pager */
const SCROLL_BOTTOM_PAD = 92;
const REFRESH_SPINNER_COLOR = "#f59e0b";

function gridPosterWidthPx(screenWidth: number): number {
  return (screenWidth - CATALOG_CONTENT_INSET_X * 2 - CARD_GAP * (CARD_COLS - 1)) / CARD_COLS;
}

function createCatalogStyles(colors: ThemeColors) {
  const warmLine = colors.mode === "light" ? "rgba(28,25,23,0.32)" : colors.border;
  const warmLineSoft = colors.mode === "light" ? "rgba(28,25,23,0.22)" : colors.border;
  const warmPanel = "transparent";

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    catalogList: {
      flex: 1,
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
      borderColor: warmLineSoft,
      overflow: "hidden",
      position: "relative",
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
      borderColor: colors.accent,
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
      backgroundColor: "rgba(0,0,0,0.55)",
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
    /** Same horizontal inset as `catalogTop`; list + card grids share this */
    catalogScrollContent: {
      paddingHorizontal: CATALOG_CONTENT_INSET_X,
      paddingTop: SPACE_Y + 4,
      paddingBottom: SCROLL_BOTTOM_PAD,
      flexGrow: 1,
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
      shadowColor: "#1c1917",
      shadowOpacity: colors.mode === "light" ? 0.08 : 0,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    posterTileImg: {
      borderRadius: 8,
      backgroundColor: colors.panel,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 13,
      gap: SPACE_Y + 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: warmLine,
      backgroundColor: warmPanel,
      borderRadius: 8,
      paddingHorizontal: 8,
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
    banner: {
      marginHorizontal: INSET_X,
      marginBottom: SPACE_Y,
      padding: SPACE_Y,
      borderRadius: 10,
      backgroundColor: colors.dangerBg,
      gap: 8,
    },
    bannerText: { color: colors.dangerText },
    retryBtn: {
      alignSelf: "flex-start",
      backgroundColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    retryText: { color: colors.retryOnAccent, fontWeight: "700" },
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
}: {
  item: CatalogMovieRow;
  posterWidth: number;
  styles: CatalogStyles;
}) {
  const w = posterWidth;
  const h = Math.round(w * 1.52);
  return (
    <Pressable
      onPress={() => router.push(`/movie/${encodeURIComponent(item.slug)}`)}
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
}: {
  item: CatalogMovieRow;
  styles: CatalogStyles;
}) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/movie/${encodeURIComponent(item.slug)}`)}
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
  const styles = useMemo(() => createCatalogStyles(colors), [colors]);

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

  useEffect(() => {
    const t = setTimeout(() => setQueryApplied(queryInput.trim()), 380);
    return () => clearTimeout(t);
  }, [queryInput]);

  useEffect(() => {
    setPage(1);
  }, [queryApplied, genre, sort]);

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
      setError(e instanceof Error ? e.message : "Could not load catalog.");
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

  const genres = data?.genres ?? [];
  const genreOptions = useMemo(
    () =>
      [{ value: "all" as const, label: "All genres" }, ...genres.map((g) => ({ value: g, label: g }))],
    [genres],
  );

  const genreLabel = genre === "all" ? "All genres" : genre;
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort;

  return (
    <View style={styles.screen}>
      <View style={styles.catalogHeaderStripe}>
        <View style={styles.catalogTop}>
          <View style={styles.searchFieldOuter}>
            <View style={styles.searchIconWrap} pointerEvents="none">
              <Ionicons name="search" size={20} color={colors.iconMuted} />
            </View>
            <TextInput
              placeholder="Search titles…"
              placeholderTextColor={colors.iconMuted}
              value={queryInput}
              onChangeText={setQueryInput}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Search catalog"
            />
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

      {error ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : null}

      <FlatList
        style={styles.catalogList}
        key={layoutMode === "card" ? "catalog-card" : "catalog-list"}
        data={data?.movies ?? []}
        keyExtractor={(m) => m.id}
        numColumns={layoutMode === "card" ? CARD_COLS : 1}
        columnWrapperStyle={layoutMode === "card" ? styles.cardGridRow : undefined}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={REFRESH_SPINNER_COLOR}
            colors={[REFRESH_SPINNER_COLOR]}
            progressBackgroundColor={colors.panel}
            titleColor={REFRESH_SPINNER_COLOR}
          />
        }
        renderItem={({ item }) =>
          layoutMode === "list" ? (
            <MovieRow item={item} styles={styles} />
          ) : (
            <PosterTile item={item} posterWidth={posterWidth} styles={styles} />
          )
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ paddingTop: SPACE_Y * 2, paddingBottom: SPACE_Y }}>
              <EmptyStateCard
                colors={colors}
                title="No rats in this hole."
                body="Widen those filters—or check back once more titles land in the catalog."
              />
            </View>
          ) : null
        }
        contentContainerStyle={styles.catalogScrollContent}
      />

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
    </View>
  );
}
