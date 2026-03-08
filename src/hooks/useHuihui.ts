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
  setSearchQuery: (query: string, immediate?: boolean) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  selectedModDetail: HuihuiModDetail | null;
  detailLoading: boolean;
  selectMod: (id: number) => Promise<void>;
  clearSelection: () => void;
}

export function useHuihui(translateEnabled: boolean): UseHuihuiReturn {
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
  const queryVersionRef = useRef(0);

  const loadPage = useCallback(async (page: number, isInitial: boolean, searchTerm: string, requestVersion: number = queryVersionRef.current) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const result = await browseHuihuiMods(page, searchTerm, translateEnabled);

      if (requestVersion !== queryVersionRef.current) {
        return;
      }

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
      if (requestVersion === queryVersionRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [translateEnabled]);

  const refresh = useCallback(async () => {
    pageRef.current = 1;
    setHasMore(true);
    await loadPage(1, true, currentSearchRef.current, queryVersionRef.current);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    await loadPage(pageRef.current + 1, false, currentSearchRef.current, queryVersionRef.current);
  }, [loadPage, loadingMore, hasMore]);

  const handleSearchChange = useCallback(
    (query: string, immediate: boolean = false) => {
      setSearchQuery(query);
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }

      const trimmed = query.trim();
      if (immediate) {
        queryVersionRef.current += 1;
        const version = queryVersionRef.current;
        currentSearchRef.current = trimmed;
        pageRef.current = 1;
        setHasMore(true);
        setMods([]);
        void loadPage(1, true, trimmed, version);
        return;
      }

      searchTimerRef.current = setTimeout(() => {
        queryVersionRef.current += 1;
        const version = queryVersionRef.current;
        currentSearchRef.current = trimmed;
        pageRef.current = 1;
        setHasMore(true);
        void loadPage(1, true, trimmed, version);
      }, 500);
    },
    [loadPage],
  );

  const selectMod = useCallback(async (id: number) => {
    try {
      setDetailLoading(true);
      const detail = await browseHuihuiModDetail(id, translateEnabled);
      setSelectedModDetail(detail);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setDetailLoading(false);
    }
  }, [translateEnabled]);

  const clearSelection = useCallback(() => {
    setSelectedModDetail(null);
  }, []);

  useEffect(() => {
    void loadPage(1, true, "");
  }, [loadPage]);

  useEffect(() => {
    setSelectedModDetail(null);
  }, [translateEnabled]);

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
