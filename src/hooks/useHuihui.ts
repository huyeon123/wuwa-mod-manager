import { useState, useCallback, useRef, useEffect } from "react";
import type { HuihuiMod, HuihuiModDetail } from "@/lib/huihui-types";
import { browseHuihuiMods, browseHuihuiModDetail } from "@/lib/huihui-commands";

interface UseHuihuiReturn {
  mods: HuihuiMod[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  selectedModDetail: HuihuiModDetail | null;
  detailLoading: boolean;
  selectMod: (id: number) => Promise<void>;
  clearSelection: () => void;
}

export function useHuihui(): UseHuihuiReturn {
  const [mods, setMods] = useState<HuihuiMod[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModDetail, setSelectedModDetail] = useState<HuihuiModDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const pageRef = useRef(1);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSearchRef = useRef("");

  const loadPage = useCallback(async (page: number, isInitial: boolean, searchTerm: string) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const result = await browseHuihuiMods(page, searchTerm);
      if (isInitial) {
        setMods(result.mods);
      } else {
        setMods((prev) => [...prev, ...result.mods]);
      }
      setHasMore(result.hasMore);
      pageRef.current = page;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

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
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
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
      const detail = await browseHuihuiModDetail(id);
      setSelectedModDetail(detail);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedModDetail(null);
  }, []);

  useEffect(() => {
    void loadPage(1, true, "");
  }, [loadPage]);

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
    searchQuery,
    setSearchQuery: handleSearchChange,
    loadMore,
    refresh,
    selectedModDetail,
    detailLoading,
    selectMod,
    clearSelection,
  };
}
