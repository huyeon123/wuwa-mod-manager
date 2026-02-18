import { useRef, useCallback } from "react";
import type { Character } from "@/lib/types";
import { useGameBanana } from "@/hooks/useGameBanana";
import { useModDownload } from "@/hooks/useModDownload";
import { BrowseModCard } from "./BrowseModCard";
import { BrowseFilterBar } from "./BrowseFilterBar";
import { BrowseModDetail } from "./BrowseModDetail";
import { DownloadProgressModal } from "./DownloadProgressModal";
import { CharacterSelectModal } from "./CharacterSelectModal";

interface BrowseViewProps {
  characters: Character[];
  modsPath: string | null;
  addToast: (type: "success" | "error" | "warning", message: string, showReport?: boolean) => void;
  refreshModCounts: () => void;
}

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

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loadingMore || !hasMore) return;

    // Load more when scrolled to within 200px of bottom
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
      loadMore();
    }
  }, [loadingMore, hasMore, loadMore]);

  const handleModClick = useCallback(
    (mod: { id: number }) => {
      selectMod(mod.id);
    },
    [selectMod],
  );

  const handleDownload = useCallback(
    (file: { id: number; filename: string; filesize: number; downloadUrl: string; downloadCount: number; description: string | null; md5: string | null }) => {
      if (!selectedModDetail) return;
      startDownload(file, selectedModDetail.detectedCharacterId, selectedModDetail.name);
    },
    [selectedModDetail, startDownload],
  );

  // Get detected character name
  const detectedCharacterName = selectedModDetail?.detectedCharacterId
    ? characters.find((c) => c.id === selectedModDetail.detectedCharacterId)?.name ?? null
    : null;

  return (
    <>
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header and Filter Bar */}
          <div className="p-4 pb-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-text-primary">GameBanana 모드 탐색</h1>
              <span className="text-xs text-text-muted">{totalCount.toLocaleString()}개 모드</span>
            </div>
            <BrowseFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sort={sort}
              onSortChange={setSort}
            />
          </div>

          {/* Mod Grid */}
          <div
            className="flex-1 overflow-y-auto p-4"
            ref={scrollRef}
            onScroll={handleScroll}
          >
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  <svg
                    className="w-8 h-8 text-text-muted animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
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
                    onClick={() => refresh()}
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
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
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
          </div>
        </div>

        {/* Detail Panel */}
        {selectedModDetail && !detailLoading && (
          <BrowseModDetail
            detail={selectedModDetail}
            detectedCharacterName={detectedCharacterName}
            isDownloading={isDownloading}
            onDownload={handleDownload}
            onClose={clearSelection}
          />
        )}
      </main>

      {/* Download Progress Modal */}
      {isDownloading && progress && downloadingFileName && (
        <DownloadProgressModal progress={progress} fileName={downloadingFileName} />
      )}

      {/* Character Select Modal */}
      {showCharacterSelect && pendingDownload && (
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
