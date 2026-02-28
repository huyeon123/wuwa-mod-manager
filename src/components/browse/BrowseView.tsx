import { useRef, useCallback, useEffect, useMemo, useState } from "react";
import type { Character } from "@/lib/types";
import { useGameBanana } from "@/hooks/useGameBanana";
import { useHuihui } from "@/hooks/useHuihui";
import { useModDownload } from "@/hooks/useModDownload";
import { BrowseModCard } from "./BrowseModCard";
import { BrowseFilterBar } from "./BrowseFilterBar";
import { BrowseModDetail } from "./BrowseModDetail";
import { DownloadProgressModal } from "./DownloadProgressModal";
import { CharacterSelectModal } from "./CharacterSelectModal";
import { HuihuiModCard } from "./HuihuiModCard";
import { HuihuiModDetail } from "./HuihuiModDetail";

interface BrowseViewProps {
  characters: Character[];
  modsPath: string | null;
  addToast: (type: "success" | "error" | "warning", message: string, showReport?: boolean) => void;
  refreshModCounts: () => void;
}

type BrowseSource = "gamebanana" | "huihui";

export function BrowseView({
  characters,
  modsPath,
  addToast,
  refreshModCounts,
}: BrowseViewProps) {
  const {
    mods,
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
  } = useGameBanana();

  const [source, setSource] = useState<BrowseSource>("gamebanana");
  const [huihuiTranslateEnabled, setHuihuiTranslateEnabled] = useState(false);
  const [huihuiCharacterFilter, setHuihuiCharacterFilter] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    mods: huihuiMods,
    loading: huihuiLoading,
    loadingMore: huihuiLoadingMore,
    hasMore: huihuiHasMore,
    error: huihuiError,
    searchQuery: huihuiSearchQuery,
    setSearchQuery: setHuihuiSearchQuery,
    loadMore: loadHuihuiMore,
    refresh: refreshHuihui,
    selectedModDetail: selectedHuihuiDetail,
    detailLoading: huihuiDetailLoading,
    selectMod: selectHuihuiMod,
    clearSelection: clearHuihuiSelection,
  } = useHuihui(huihuiTranslateEnabled);

  const {
    isDownloading,
    progress,
    downloadingFileName,
    startDownload,
    showCharacterSelect,
    pendingDownload,
    confirmCharacterAndDownload,
    cancelDownload,
  } = useModDownload({
    modsPath,
    addToast,
    onImportComplete: () => {
      refreshModCounts();
    },
  });

  const huihuiCharacterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const mod of huihuiMods) {
      if (mod.characterName) set.add(mod.characterName);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [huihuiMods]);

  const filteredHuihuiMods = useMemo(() => {
    if (huihuiCharacterFilter === "all") return huihuiMods;
    return huihuiMods.filter((mod) => mod.characterName === huihuiCharacterFilter);
  }, [huihuiMods, huihuiCharacterFilter]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (!nearBottom) return;

    if (source === "gamebanana") {
      if (loadingMore || !hasMore) return;
      void loadMore();
      return;
    }

    if (huihuiLoadingMore || !huihuiHasMore) return;
    void loadHuihuiMore();
  }, [source, loadingMore, hasMore, loadMore, huihuiLoadingMore, huihuiHasMore, loadHuihuiMore]);

  const handleModClick = useCallback(
    (mod: { id: number }) => {
      void selectMod(mod.id);
    },
    [selectMod],
  );

  const handleHuihuiModClick = useCallback(
    (mod: { id: number }) => {
      void selectHuihuiMod(mod.id);
    },
    [selectHuihuiMod],
  );

  const handleDownload = useCallback(
    (file: {
      id: number;
      filename: string;
      filesize: number;
      downloadUrl: string;
      downloadCount: number;
      description: string | null;
      md5: string | null;
    }) => {
      if (!selectedModDetail) return;
      startDownload(file, selectedModDetail.detectedCharacterId, selectedModDetail.name);
    },
    [selectedModDetail, startDownload],
  );

  const detectedCharacterName = selectedModDetail?.detectedCharacterId
    ? characters.find((c) => c.id === selectedModDetail.detectedCharacterId)?.name ?? null
    : null;

  useEffect(() => {
    if (source !== "gamebanana") clearSelection();
    if (source !== "huihui") clearHuihuiSelection();
  }, [source, clearSelection, clearHuihuiSelection]);

  useEffect(() => {
    if (source !== "huihui") return;
    setHuihuiCharacterFilter("all");
  }, [huihuiSearchQuery, huihuiTranslateEnabled, source]);

  return (
    <>
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 pb-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-text-primary">모드 탐색</h1>
              {source === "gamebanana" ? (
                <span className="text-xs text-text-muted">{totalCount.toLocaleString()}개 모드</span>
              ) : (
                <span className="text-xs text-text-muted">{filteredHuihuiMods.length.toLocaleString()}개 모드</span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setSource("gamebanana")}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                  source === "gamebanana"
                    ? "border-neon/40 bg-neon/10 text-neon"
                    : "border-white/10 bg-white/5 text-text-muted hover:text-text-primary hover:bg-white/10"
                }`}
              >
                GameBanana
              </button>
              <button
                type="button"
                onClick={() => setSource("huihui")}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                  source === "huihui"
                    ? "border-neon/40 bg-neon/10 text-neon"
                    : "border-white/10 bg-white/5 text-text-muted hover:text-text-primary hover:bg-white/10"
                }`}
              >
                HuiHui (WuWa)
              </button>
            </div>

            {source === "gamebanana" ? (
              <BrowseFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sort={sort}
                onSortChange={setSort}
              />
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <svg
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="HuiHui 모드 검색..."
                    value={huihuiSearchQuery}
                    onChange={(e) => setHuihuiSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon/50 transition-colors"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs text-text-muted">캐릭터</label>
                  <select
                    value={huihuiCharacterFilter}
                    onChange={(e) => setHuihuiCharacterFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-md border border-white/10 bg-white/5 text-xs text-text-primary focus:outline-none focus:border-neon/50"
                  >
                    {huihuiCharacterOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === "all" ? "전체" : option}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setHuihuiTranslateEnabled((prev) => !prev)}
                    className={`px-2.5 py-1.5 rounded-md border text-xs transition-colors ${
                      huihuiTranslateEnabled
                        ? "border-neon/40 bg-neon/10 text-neon"
                        : "border-white/10 bg-white/5 text-text-muted hover:text-text-primary hover:bg-white/10"
                    }`}
                  >
                    번역 {huihuiTranslateEnabled ? "ON" : "OFF"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4" ref={scrollRef} onScroll={handleScroll}>
            {source === "gamebanana" ? (
              <>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-8 h-8 text-text-muted animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <p className="text-sm text-text-muted">모드 목록 불러오는 중...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center space-y-3">
                      <p className="text-sm text-red-400">{error}</p>
                      <button
                        onClick={() => void refresh()}
                        className="px-4 py-2 rounded-lg bg-neon/10 text-neon border border-neon/30 text-sm font-medium hover:bg-neon/20 transition-colors"
                      >
                        다시 시도
                      </button>
                    </div>
                  </div>
                ) : mods.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-sm text-text-muted">
                      {searchQuery.trim() !== "" ? "검색 결과가 없습니다" : "모드가 없습니다"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {mods.map((mod) => (
                      <BrowseModCard
                        key={mod.id}
                        mod={mod}
                        isSelected={selectedModDetail?.id === mod.id}
                        onClick={handleModClick}
                      />
                    ))}
                  </div>
                )}

                {loadingMore && (
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>추가 로드 중...</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {huihuiLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-8 h-8 text-text-muted animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <p className="text-sm text-text-muted">HuiHui 목록 불러오는 중...</p>
                    </div>
                  </div>
                ) : huihuiError ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center space-y-3">
                      <p className="text-sm text-red-400">{huihuiError}</p>
                      <button
                        onClick={() => void refreshHuihui()}
                        className="px-4 py-2 rounded-lg bg-neon/10 text-neon border border-neon/30 text-sm font-medium hover:bg-neon/20 transition-colors"
                      >
                        다시 시도
                      </button>
                    </div>
                  </div>
                ) : filteredHuihuiMods.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-sm text-text-muted">검색/필터 결과가 없습니다</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {filteredHuihuiMods.map((mod) => (
                      <HuihuiModCard
                        key={mod.id}
                        mod={mod}
                        isSelected={selectedHuihuiDetail?.id === mod.id}
                        onClick={handleHuihuiModClick}
                      />
                    ))}
                  </div>
                )}

                {huihuiLoadingMore && (
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>추가 로드 중...</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {source === "gamebanana" && selectedModDetail && !detailLoading && (
          <BrowseModDetail
            detail={selectedModDetail}
            detectedCharacterName={detectedCharacterName}
            isDownloading={isDownloading}
            onDownload={handleDownload}
            onClose={clearSelection}
          />
        )}

        {source === "huihui" && selectedHuihuiDetail && !huihuiDetailLoading && (
          <HuihuiModDetail detail={selectedHuihuiDetail} onClose={clearHuihuiSelection} />
        )}
      </main>

      {source === "gamebanana" && isDownloading && progress && downloadingFileName && (
        <DownloadProgressModal progress={progress} fileName={downloadingFileName} />
      )}

      {source === "gamebanana" && showCharacterSelect && pendingDownload && (
        <CharacterSelectModal
          characters={characters}
          onSelect={confirmCharacterAndDownload}
          onCancel={cancelDownload}
          modName={pendingDownload.modName}
        />
      )}
    </>
  );
}
