import { useState, useCallback, useRef, useEffect } from "react";
import type { GameBananaMod, GameBananaModDetail, SortOption } from "@/lib/gamebanana-types";
import { browseMods, browseModDetail } from "@/lib/gamebanana-commands";

interface UseGameBananaReturn {
  mods: GameBananaMod[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  totalCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sort: SortOption;
  setSort: (sort: SortOption) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  selectedModDetail: GameBananaModDetail | null;
  detailLoading: boolean;
  selectMod: (id: number) => Promise<void>;
  clearSelection: () => void;
}

export function useGameBanana(): UseGameBananaReturn {
  const [allMods, setAllMods] = useState<GameBananaMod[]>([]);
  const [filteredMods, setFilteredMods] = useState<GameBananaMod[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("Generic_LatestUpdated");
  const [selectedModDetail, setSelectedModDetail] = useState<GameBananaModDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const pageRef = useRef(1);
  const perPage = 20;

  const loadPage = useCallback(
    async (page: number, isInitial: boolean) => {
      try {
        if (isInitial) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const result = await browseMods(page, perPage, sort);

        if (isInitial) {
          setAllMods(result.mods);
          setFilteredMods(result.mods);
        } else {
          setAllMods((prev) => [...prev, ...result.mods]);
          setFilteredMods((prev) => [...prev, ...result.mods]);
        }

        setTotalCount(result.totalCount);
        setHasMore(result.hasMore);
        pageRef.current = page;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error("Failed to load mods:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sort],
  );

  const refresh = useCallback(async () => {
    pageRef.current = 1;
    setHasMore(true);
    await loadPage(1, true);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    await loadPage(pageRef.current + 1, false);
  }, [loadPage, loadingMore, hasMore]);

  const selectMod = useCallback(async (id: number) => {
    try {
      setDetailLoading(true);
      const detail = await browseModDetail(id);
      setSelectedModDetail(detail);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error("Failed to load mod detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedModDetail(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMods(allMods);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allMods.filter((mod) => mod.name.toLowerCase().includes(query));
      setFilteredMods(filtered);
    }
  }, [searchQuery, allMods]);

  return {
    mods: filteredMods,
    loading,
    loadingMore,
    hasMore,
    error,
    totalCount,
    searchQuery,
    setSearchQuery,
    sort,
    setSort,
    loadMore,
    refresh,
    selectedModDetail,
    detailLoading,
    selectMod,
    clearSelection,
  };
}
