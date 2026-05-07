import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { fetchCatalogPage } from "../lib/api";
import type { CatalogMovieRow, CatalogResponse, CatalogSort } from "../lib/types";

const cream = "#fef3c7";
const amber = "#f59e0b";
const stone = "#a8a29e";
const wash = "#1c1917";
const headerBg = "#292524";

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "latest-added-title", label: "Latest titles" },
  { value: "latest-sighting", label: "Latest sighting" },
  { value: "most-rats-logged", label: "Most rats" },
  { value: "total-sightings", label: "Total sightings" },
];

function MovieRow({
  item,
}: {
  item: CatalogMovieRow;
}) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/movie/${encodeURIComponent(item.slug)}`)}
    >
      <Image source={{ uri: item.posterUrl }} style={styles.poster} accessibilityLabel={item.posterAlt} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.rowMeta}>
          {item.releaseYear} · {item.sightingCount} sighting{item.sightingCount === 1 ? "" : "s"}
        </Text>
        {item.imdbRating ? (
          <Text style={styles.rowRating}>IMDb {item.imdbRating}</Text>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export default function CatalogScreen() {
  const [queryInput, setQueryInput] = useState("");
  const [queryApplied, setQueryApplied] = useState("");
  const [genre, setGenre] = useState("all");
  const [sort, setSort] = useState<CatalogSort>("latest-added-title");
  const [page, setPage] = useState(1);

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
  const genreChips = useMemo(() => ["all", ...genres], [genres]);

  return (
    <>
      <Stack.Screen options={{ title: "Catalog", headerStyle: { backgroundColor: headerBg } }} />
      <View style={styles.screen}>
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Search titles…"
            placeholderTextColor="#78716c"
            value={queryInput}
            onChangeText={setQueryInput}
            style={styles.search}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search catalog"
          />
        </View>

        <Text style={styles.sectionLabel}>Genre</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {genreChips.map((g) => {
            const active = genre === g;
            const label = g === "all" ? "All genres" : g;
            return (
              <Pressable
                key={g}
                onPress={() => setGenre(g)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionLabel}>Sort</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {SORT_OPTIONS.map((opt) => {
            const active = sort === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setSort(opt.value)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

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
            <ActivityIndicator size="large" color={amber} />
          </View>
        ) : null}

        <FlatList
          data={data?.movies ?? []}
          keyExtractor={(m) => m.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={amber} />
          }
          renderItem={({ item }) => <MovieRow item={item} />}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>No titles match these filters.</Text>
            ) : null
          }
          contentContainerStyle={styles.listPad}
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
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: wash,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  search: {
    backgroundColor: "#0c0a09",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: cream,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#44403c",
  },
  sectionLabel: {
    color: stone,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chipsRow: {
    paddingHorizontal: 12,
    gap: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#0c0a09",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#44403c",
  },
  chipActive: {
    backgroundColor: "#422006",
    borderColor: amber,
  },
  chipText: { color: stone, fontSize: 14, fontWeight: "500" },
  chipTextActive: { color: cream },
  listPad: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#44403c",
  },
  poster: {
    width: 52,
    height: 78,
    borderRadius: 6,
    backgroundColor: headerBg,
  },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { color: cream, fontSize: 17, fontWeight: "700" },
  rowMeta: { color: stone, fontSize: 14 },
  rowRating: { color: amber, fontSize: 13 },
  chevron: { color: stone, fontSize: 28, fontWeight: "200" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  empty: { color: stone, textAlign: "center", marginTop: 32, fontSize: 16 },
  banner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#431407",
    gap: 8,
  },
  bannerText: { color: cream },
  retryBtn: {
    alignSelf: "flex-start",
    backgroundColor: amber,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: { color: "#292524", fontWeight: "700" },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#44403c",
    backgroundColor: "#0c0a09",
  },
  pageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: amber,
  },
  pageBtnDisabled: { opacity: 0.35 },
  pageBtnText: { color: "#292524", fontWeight: "700" },
  pageInfo: { color: cream, fontWeight: "600" },
});
