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

interface HuihuiCharacterOption {
  label: string;
  value: string;
}

interface DetailLoadingPanelProps {
  title: string;
  message: string;
}

function DetailLoadingPanel({ title, message }: DetailLoadingPanelProps) {
  return (
    <aside className="w-80 border-l border-border bg-panel flex-shrink-0 flex flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 text-text-muted animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm text-text-muted">{message}</p>
        </div>
      </div>
    </aside>
  );
}

const HUIHUI_CHARACTER_OPTIONS: HuihuiCharacterOption[] = [
  { label: "\uC804\uCCB4", value: "all" },
  { label: "\uC7A5\uB9AC", value: "\u957F\u79BB" },
  { label: "\uAE08\uD76C", value: "\u4ECA\u6C50" },
  { label: "\uCE74\uB974\uD2F0\uC2DC\uC544", value: "\u5361\u63D0\u5E0C\u5A05" },
  { label: "\uC74C\uB9BC", value: "\u541F\u9716" },
  { label: "\uC559\uCF54", value: "\u5B89\u53EF" },
  { label: "\uD30C\uC218\uC778", value: "\u5B88\u5CB8\u4EBA" },
  { label: "\uD398\uBE44", value: "\u83F2\u6BD4" },
  { label: "\uCD98", value: "\u6907" },
  { label: "\uB2E8\uADFC", value: "\u4E39\u747E" },
  { label: "\uB3C4\uAE30", value: "\u6843\u7948" },
  { label: "\uAC10\uC2EC", value: "\u9274\u5FC3" },
  { label: "\uC0B0\uD654", value: "\u6563\u534E" },
  { label: "\uC124\uC9C0", value: "\u767D\u829D" },
  { label: "\uC591\uC591", value: "\u79E7\u79E7" },
  { label: "\uBAA8\uB974\uD14C\uD53C", value: "\u83AB\u7279\u83F2" },
  { label: "\uB85C\uCF54\uCF54", value: "\u6D1B\u53EF\u53EF" },
  { label: "\uC808\uC9C0", value: "\u6298\u679D" },
  { label: "\uCE58\uC0E4", value: "\u70BD\u971E" },
  { label: "\uCE74\uB97C\uB85C\uD0C0", value: "\u73C2\u83B1\u5854" },
  { label: "\uBCA8\uB9AC\uB098", value: "\u7EF4\u91CC\u5948" },
  { label: "\uB4F1\uB4F1", value: "\u706F\u706F" },
  { label: "\uAC08\uBE0C\uB808\uB098", value: "\u5609\u8D1D\u8389\u5A1C" },
  { label: "\uB8E8\uD30C", value: "\u9732\u5E15" },
  { label: "\uC720\uB178", value: "\u5C24\u8BFA" },
  { label: "\uC5D0\uC774\uBA54\uC2A4", value: "\u7231\u5F25\u65AF" },
  { label: "\uCE74\uCE74\uB8E8", value: "\u5361\u5361\u7F57" },
  { label: "\uBC29\uB791\uC790", value: "\u6F02\u6CCA\u8005" },
];

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
  const [huihuiTextQuery, setHuihuiTextQuery] = useState("");
  const [huihuiCharacterMenuOpen, setHuihuiCharacterMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const huihuiCharacterMenuRef = useRef<HTMLDivElement>(null);

  const {
    mods: huihuiMods,
    loading: huihuiLoading,
    loadingMore: huihuiLoadingMore,
    hasMore: huihuiHasMore,
    error: huihuiError,
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

  const selectedHuihuiCharacterLabel = useMemo(
    () =>
      HUIHUI_CHARACTER_OPTIONS.find((option) => option.value === huihuiCharacterFilter)?.label ?? "\uC804\uCCB4",
    [huihuiCharacterFilter],
  );

  const applyHuihuiSearch = useCallback(
    (textQuery: string, characterValue: string, immediate: boolean = false) => {
      const terms: string[] = [];
      const trimmedText = textQuery.trim();
      if (trimmedText !== "") terms.push(trimmedText);
      if (characterValue !== "all") terms.push(characterValue);
      setHuihuiSearchQuery(terms.join(" "), immediate);
    },
    [setHuihuiSearchQuery],
  );

  const handleHuihuiSearchInputChange = useCallback(
    (value: string) => {
      setHuihuiTextQuery(value);
      applyHuihuiSearch(value, huihuiCharacterFilter, false);
    },
    [applyHuihuiSearch, huihuiCharacterFilter],
  );

  const handleHuihuiCharacterSelect = useCallback(
    (value: string) => {
      setHuihuiCharacterFilter(value);
      setHuihuiTextQuery("");
      setHuihuiCharacterMenuOpen(false);
      applyHuihuiSearch("", value, true);
    },
    [applyHuihuiSearch],
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (!nearBottom) return;

    if (source === "gamebanana") {
      if (loading || loadingMore || !hasMore) return;
      void loadMore();
      return;
    }

    if (huihuiLoading || huihuiLoadingMore || !huihuiHasMore) return;
    void loadHuihuiMore();
  }, [source, loading, loadingMore, hasMore, loadMore, huihuiLoading, huihuiLoadingMore, huihuiHasMore, loadHuihuiMore]);

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
    setHuihuiTextQuery("");
    setHuihuiCharacterMenuOpen(false);
    setHuihuiSearchQuery("", true);
  }, [source, setHuihuiSearchQuery]);

  useEffect(() => {
    if (!huihuiCharacterMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        huihuiCharacterMenuRef.current &&
        !huihuiCharacterMenuRef.current.contains(event.target as Node)
      ) {
        setHuihuiCharacterMenuOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHuihuiCharacterMenuOpen(false);
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [huihuiCharacterMenuOpen]);

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
                <span className="text-xs text-text-muted">{huihuiMods.length.toLocaleString()}개 모드</span>
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
                    value={huihuiTextQuery}
                    onChange={(e) => handleHuihuiSearchInputChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon/50 transition-colors"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs text-text-muted">캐릭터</label>
                  <div ref={huihuiCharacterMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setHuihuiCharacterMenuOpen((prev) => !prev)}
                      className="flex items-center justify-between gap-2 min-w-[124px] px-2.5 py-1.5 rounded-md border border-white/10 bg-white/5 text-xs text-text-primary hover:bg-white/10 focus:outline-none focus:border-neon/50 transition-colors"
                      aria-haspopup="listbox"
                      aria-expanded={huihuiCharacterMenuOpen}
                      aria-label="HuiHui character filter"
                    >
                      <span>{selectedHuihuiCharacterLabel}</span>
                      <svg
                        className={`w-3.5 h-3.5 text-text-muted transition-transform ${
                          huihuiCharacterMenuOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {huihuiCharacterMenuOpen && (
                      <div
                        role="listbox"
                        aria-label="HuiHui character options"
                        className="absolute right-0 top-full mt-2 w-44 max-h-56 overflow-y-auto overflow-x-hidden rounded-lg border border-white/10 bg-background-card/95 backdrop-blur shadow-xl z-30"
                      >
                        {HUIHUI_CHARACTER_OPTIONS.map((option) => {
                          const selected = option.value === huihuiCharacterFilter;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleHuihuiCharacterSelect(option.value)}
                              className={`w-full px-3 py-1.5 text-left text-xs transition-colors flex items-center justify-between ${
                                selected ? "bg-neon/10 text-neon" : "text-text-primary hover:bg-white/10"
                              }`}
                              role="option"
                              aria-selected={selected}
                            >
                              <span>{option.label}</span>
                              {selected && (
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
                ) : huihuiMods.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-sm text-text-muted">검색/필터 결과가 없습니다</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {huihuiMods.map((mod) => (
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

        {source === "gamebanana" && detailLoading && (
          <DetailLoadingPanel title="모드 정보" message="모드 정보를 불러오는 중..." />
        )}

        {source === "gamebanana" && selectedModDetail && !detailLoading && (
          <BrowseModDetail
            detail={selectedModDetail}
            detectedCharacterName={detectedCharacterName}
            isDownloading={isDownloading}
            onDownload={handleDownload}
            onClose={clearSelection}
          />
        )}

        {source === "huihui" && huihuiDetailLoading && (
          <DetailLoadingPanel title="HuiHui 모드 정보" message="HuiHui 모드 정보를 불러오는 중..." />
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


