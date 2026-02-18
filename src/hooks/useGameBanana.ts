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
  const [mods, setMods] = useState<GameBananaMod[]>([]);
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
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSearchRef = useRef("");

  const loadPage = useCallback(
    async (page: number, isInitial: boolean, searchTerm: string) => {
      try {
        if (isInitial) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const result = await browseMods(page, perPage, sort, searchTerm);

        if (isInitial) {
          setMods(result.mods);
        } else {
          setMods((prev) => [...prev, ...result.mods]);
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
    await loadPage(1, true, currentSearchRef.current);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    await loadPage(pageRef.current + 1, false, currentSearchRef.current);
  }, [loadPage, loadingMore, hasMore]);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);

      // Debounce: clear previous timer
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }

      // Debounce search by 500ms
      searchTimerRef.current = setTimeout(() => {
        currentSearchRef.current = query.trim();
        pageRef.current = 1;
        setHasMore(true);
        loadPage(1, true, query.trim());
      }, 500);
    },
    [loadPage],
  );

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

  // Initial load and re-load when sort changes
  useEffect(() => {
    currentSearchRef.current = searchQuery.trim();
    pageRef.current = 1;
    setHasMore(true);
    loadPage(1, true, searchQuery.trim());
  }, [sort]); // Only trigger on sort change, NOT on searchQuery (that's handled by debounce)

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  return {
    mods,
    loading,
    loadingMore,
    hasMore,
    error,
    totalCount,
    searchQuery,
    setSearchQuery: handleSearchChange,
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
