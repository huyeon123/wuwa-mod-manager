import { useState, useEffect, useCallback, useRef } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { openUrl, revealItemInDir } from "@tauri-apps/plugin-opener";
import { AppShell } from "./components/layout/AppShell";
import { Sidebar } from "./components/layout/Sidebar";
import type { MenuId } from "./components/layout/Sidebar";
import { CharacterGrid } from "./components/characters/CharacterGrid";
import { ModList } from "./components/mods/ModList";
import { ModDetailPanel } from "./components/mods/ModDetailPanel";
import { ModImportModal } from "./components/mods/ModImportModal";
import { PresetList } from "./components/presets/PresetList";
import { PresetCreateModal } from "./components/presets/PresetCreateModal";
import type { Character, Mod, AppConfig } from "./lib/types";
import { ToastContainer, type ToastData } from "./components/ui/Toast";
import { useUpdater } from "./hooks/useUpdater";
import { useModImportFlow } from "./hooks/useModImportFlow";
import { useTauriDragDrop } from "./hooks/useTauriDragDrop";
import { useSettingsActions } from "./hooks/useSettingsActions";
import { usePresets } from "./hooks/usePresets";
import {
  getCharacters,
  getConfig,
  getMods,
  enableMod,
  disableMod,
  deleteMod,
  getModCounts,
  launchXxmi,
  toggleFavoriteCharacter,
  toggleFavoriteMod,
  setModOrder,
} from "./lib/commands";

type View = "characters" | "mods";

export function App() {
  const [activeMenu, setActiveMenu] = useState<MenuId>("mods");
  const [view, setView] = useState<View>("characters");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [mods, setMods] = useState<Mod[]>([]);
  const [selectedMod, setSelectedMod] = useState<Mod | null>(null);
  const [modsPath, setModsPathState] = useState<string | null>(null);
  const [xxmiLauncherPath, setXxmiLauncherPathState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [modCounts, setModCounts] = useState<Record<string, [number, number]>>({});
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [appVersion, setAppVersion] = useState<string>("");
  const [favoriteCharacterIds, setFavoriteCharacterIds] = useState<string[]>([]);
  const [favoriteModIds, setFavoriteModIds] = useState<string[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);

  const addToast = useCallback((type: ToastData["type"], message: string, showReport?: boolean) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message, showReport }]);
    if (type !== "error") {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const { updateStatus, updateProgress, updateVersion, checkForUpdates } = useUpdater({
    addToast,
    autoCheck: true,
  });

  const hasInitialized = useRef(false);

  // Load config on startup
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    getConfig()
      .then((loadedConfig) => {
        setConfig(loadedConfig);
        if (loadedConfig.modsPath) {
          setModsPathState(loadedConfig.modsPath);
        }
        if (loadedConfig.xxmiLauncherPath) {
          setXxmiLauncherPathState(loadedConfig.xxmiLauncherPath);
        }
        // Load favorites
        setFavoriteCharacterIds(loadedConfig.favoriteCharacters ?? []);
        setFavoriteModIds(loadedConfig.favoriteMods ?? []);
        // If no modsPath, redirect to settings
        if (!loadedConfig.modsPath) {
          setActiveMenu("settings");
        }
        // Auto-launch game if enabled
        if (loadedConfig.autoLaunchGame && loadedConfig.xxmiLauncherPath) {
          launchXxmi().catch((err) => {
            console.error("Auto-launch failed:", err);
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load config:", err);
      });
    getVersion().then(setAppVersion).catch(console.error);
  }, []);

  // Load characters
  useEffect(() => {
    getCharacters()
      .then(setCharacters)
      .catch((err) => {
        console.error("Failed to load characters:", err);
      });
  }, []);

  const refreshModCounts = useCallback(
    async (pathOverride?: string | null) => {
      const targetPath = pathOverride ?? modsPath;
      if (!targetPath) return;
      try {
        const counts = await getModCounts(targetPath);
        setModCounts(counts);
      } catch (err) {
        console.error("Failed to load mod counts:", err);
      }
    },
    [modsPath],
  );

  // Load mod counts when modsPath changes
  useEffect(() => {
    refreshModCounts();
  }, [refreshModCounts]);

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

  // Calculate total enabled mods
  const totalEnabledMods = Object.values(modCounts).reduce(
    (sum, [enabled]) => sum + enabled,
    0
  );

  // Calculate total mods
  const totalMods = Object.values(modCounts).reduce(
    (sum, [, total]) => sum + total,
    0
  );

  // Load mods when character is selected
  const loadMods = useCallback(
    async (characterId: string) => {
      if (!modsPath) return;
      setLoading(true);
      try {
        const result = await getMods(characterId, modsPath);
        setMods(result);
      } catch (err) {
        console.error("Failed to load mods:", err);
        setMods([]);
      } finally {
        setLoading(false);
      }
    },
    [modsPath],
  );

  const {
    importPreview,
    showImportModal,
    isImporting,
    openImportPreviewModal,
    confirmImport: handleConfirmImport,
    cancelImport: handleCancelImport,
    handleDropFiles,
  } = useModImportFlow({
    modsPath,
    selectedCharacterId,
    addToast,
    loadMods,
    refreshModCounts,
  });

  const {
    handleSelectModsPath,
    handleSelectXxmiLauncherPath,
    handleLaunchXxmi,
    handleAutoDetect,
    handleToggleAutoLaunch,
  } = useSettingsActions({
    addToast,
    setModsPathState,
    setXxmiLauncherPathState,
    config,
    setConfig,
  });

  const {
    presets,
    activePresetIds,
    showPresetModal,
    editingPreset,
    openCreatePresetModal,
    closePresetModal,
    handleEditPreset,
    handleTogglePreset,
    handleDeletePreset,
    handleCreatePreset,
    handleUpdatePreset,
    modStatusVersion,
  } = usePresets({
    modsPath,
    addToast,
    refreshModCounts,
    config,
  });

  // Calculate preset counts
  const presetCount = presets.length;
  const activePresetCount = activePresetIds.length;

  const handleMenuSelect = useCallback((id: MenuId) => {
    setActiveMenu(id);
    if (id === "mods") {
      setView("characters");
      setSelectedCharacterId(null);
      setSelectedMod(null);
      setMods([]);
    }
  }, []);

  const handleSelectCharacter = useCallback(
    (id: string) => {
      setSelectedCharacterId(id);
      setSelectedMod(null);
      setView("mods");
      loadMods(id);
    },
    [loadMods],
  );

  const handleBack = useCallback(() => {
    setView("characters");
    setSelectedCharacterId(null);
    setSelectedMod(null);
    setMods([]);
  }, []);

  const handleToggleFavoriteCharacter = useCallback(async (characterId: string) => {
    try {
      const updatedConfig = await toggleFavoriteCharacter(characterId);
      setFavoriteCharacterIds(updatedConfig.favoriteCharacters ?? []);
    } catch (err) {
      console.error("Failed to toggle favorite character:", err);
      addToast("error", `즐겨찾기 변경 실패: ${err}`, true);
    }
  }, [addToast]);

  const handleToggleFavoriteMod = useCallback(async (mod: Mod) => {
    if (!selectedCharacterId) return;
    try {
      const updatedConfig = await toggleFavoriteMod(selectedCharacterId, mod.id);
      setFavoriteModIds(updatedConfig.favoriteMods ?? []);
    } catch (err) {
      console.error("Failed to toggle favorite mod:", err);
      addToast("error", `즐겨찾기 변경 실패: ${err}`, true);
    }
  }, [selectedCharacterId, addToast]);

  const handleReorderMods = useCallback(
    async (characterId: string, modIds: string[]) => {
      try {
        const newConfig = await setModOrder(characterId, modIds);
        setConfig(newConfig);
      } catch (err) {
        console.error("Failed to set mod order:", err);
      }
    },
    [],
  );

  const handleSelectMod = useCallback((mod: Mod) => {
    setSelectedMod(mod);
  }, []);

  const handleToggleMod = useCallback(
    async (mod: Mod) => {
      if (!modsPath || !selectedCharacterId) return;
      try {
        if (mod.enabled) {
          await disableMod(mod.id, selectedCharacterId, modsPath);
        } else {
          await enableMod(mod.id, selectedCharacterId, modsPath);
        }
        const updatedMods = await getMods(selectedCharacterId, modsPath);
        setMods(updatedMods);
        refreshModCounts(modsPath);
        setSelectedMod((prev) =>
          prev?.id === mod.id ? { ...prev, enabled: !prev.enabled } : prev,
        );
      } catch (err) {
        console.error("Failed to toggle mod:", err);
        addToast("error", `모드 전환 실패: ${err}`, true);
      }
    },
    [modsPath, selectedCharacterId, addToast, refreshModCounts],
  );

  const handleImportModZip = useCallback(async () => {
    if (!modsPath || !selectedCharacterId) return;
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "ZIP 파일", extensions: ["zip"] }],
        directory: false,
        title: "모드 ZIP 파일을 선택하세요",
      });
      if (!selected) return;
      await openImportPreviewModal(selected);
    } catch (err) {
      console.error("Failed to import mod:", err);
      addToast("error", `모드 가져오기 실패: ${err}`, true);
    }
  }, [modsPath, selectedCharacterId, addToast, openImportPreviewModal]);

  const handleImportModFolder = useCallback(async () => {
    if (!modsPath || !selectedCharacterId) return;
    try {
      const selected = await open({
        multiple: false,
        directory: true,
        title: "모드 폴더를 선택하세요",
      });
      if (!selected) return;
      await openImportPreviewModal(selected);
    } catch (err) {
      console.error("Failed to import mod:", err);
      addToast("error", `모드 가져오기 실패: ${err}`, true);
    }
  }, [modsPath, selectedCharacterId, addToast, openImportPreviewModal]);

  useTauriDragDrop({
    enabled: view === "mods" && Boolean(selectedCharacterId) && Boolean(modsPath),
    onDraggingChange: setIsDragging,
    onDropPaths: handleDropFiles,
  });

  const handleDeleteMod = useCallback(
    async (mod: Mod) => {
      if (!modsPath || !selectedCharacterId) return;
      try {
        await deleteMod(mod.id, selectedCharacterId, modsPath);
        setSelectedMod(null);
        await loadMods(selectedCharacterId);
        refreshModCounts(modsPath);
      } catch (err) {
        console.error("Failed to delete mod:", err);
        addToast("error", `모드 삭제 실패: ${err}`, true);
      }
    },
    [modsPath, selectedCharacterId, loadMods, addToast, refreshModCounts],
  );

  const handleCheckUpdate = useCallback(() => {
    void checkForUpdates();
  }, [checkForUpdates]);

  const renderContent = () => {
    if (activeMenu === "settings") {
      return (
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-xl font-bold text-text-primary mb-4">설정</h1>
          {!modsPath && (
            <div className="mb-4 p-4 rounded-xl border border-neon/30 bg-neon/5">
              <p className="text-sm text-neon font-medium">
                처음 사용하시나요? 아래에서 경로를 설정하거나 자동 탐지를 사용하세요.
              </p>
            </div>
          )}
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <label className="text-sm font-medium text-text-primary block mb-2">
                모드 폴더 경로
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-text-secondary truncate">
                  {modsPath ?? "설정되지 않음"}
                </div>
                {modsPath && (
                  <button
                    onClick={() => revealItemInDir(modsPath)}
                    className="px-4 py-2 rounded-lg bg-white/5 text-text-muted border border-white/10 text-sm font-medium hover:bg-white/10 hover:text-text-primary transition-colors"
                    title="폴더 열기"
                  >
                    열기
                  </button>
                )}
                <button
                  onClick={() => handleAutoDetect("mods")}
                  className="px-4 py-2 rounded-lg bg-white/5 text-text-muted border border-white/10 text-sm font-medium hover:bg-white/10 hover:text-text-primary transition-colors"
                >
                  자동 탐지
                </button>
                <button
                  onClick={handleSelectModsPath}
                  className="px-4 py-2 rounded-lg bg-neon/10 text-neon border border-neon/30 text-sm font-medium hover:bg-neon/20 transition-colors"
                >
                  변경
                </button>
              </div>
              <p className="text-xs text-text-muted mt-2">
                WWMI mods 폴더를 선택하세요
              </p>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <label className="text-sm font-medium text-text-primary block mb-2">
                XXMI Launcher 경로
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-text-secondary truncate">
                  {xxmiLauncherPath ?? "설정되지 않음"}
                </div>
                {xxmiLauncherPath && (
                  <button
                    onClick={() => revealItemInDir(xxmiLauncherPath)}
                    className="px-4 py-2 rounded-lg bg-white/5 text-text-muted border border-white/10 text-sm font-medium hover:bg-white/10 hover:text-text-primary transition-colors"
                    title="폴더 열기"
                  >
                    열기
                  </button>
                )}
                <button
                  onClick={() => handleAutoDetect("launcher")}
                  className="px-4 py-2 rounded-lg bg-white/5 text-text-muted border border-white/10 text-sm font-medium hover:bg-white/10 hover:text-text-primary transition-colors"
                >
                  자동 탐지
                </button>
                <button
                  onClick={handleSelectXxmiLauncherPath}
                  className="px-4 py-2 rounded-lg bg-neon/10 text-neon border border-neon/30 text-sm font-medium hover:bg-neon/20 transition-colors"
                >
                  변경
                </button>
              </div>
              <p className="text-xs text-text-muted mt-2">
                XXMI Launcher (XXMI Launcher.exe)를 선택하세요
              </p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <h3 className="text-sm font-medium text-text-primary">게임 자동실행</h3>
                <p className="text-xs text-text-muted mt-0.5">앱 실행 시 자동으로 게임을 시작합니다</p>
              </div>
              <button
                onClick={handleToggleAutoLaunch}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  config?.autoLaunchGame
                    ? "bg-neon/30"
                    : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-200 ${
                    config?.autoLaunchGame
                      ? "translate-x-5 bg-neon"
                      : "translate-x-0 bg-white/40"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <h3 className="text-sm font-medium text-text-primary">문제 신고하기</h3>
                <p className="text-xs text-text-muted mt-0.5">버그 리포트 또는 기능 요청을 제출합니다</p>
              </div>
              <button
                onClick={() => openUrl("https://github.com/huyeon123/wuwa-mod-manager/issues/new/choose")}
                className="px-4 py-2 rounded-lg bg-white/5 text-text-muted border border-white/10 text-sm font-medium hover:bg-white/10 hover:text-text-primary transition-colors"
              >
                신고하기
              </button>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">앱 버전</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-text-muted font-mono">v{appVersion}</span>
                    {updateStatus === "ready" ? (
                      <button
                        onClick={() => relaunch()}
                        className="text-xs text-green-400 hover:text-green-300 transition-colors"
                      >
                        재시작하여 적용 (v{updateVersion})
                      </button>
                    ) : updateStatus === "latest" ? (
                      <span className="text-xs text-green-400">최신 버전</span>
                    ) : updateStatus === "error" ? (
                      <span className="text-xs text-red-400">확인 실패</span>
                    ) : updateStatus === "checking" ? (
                      <span className="text-xs text-text-muted">확인 중...</span>
                    ) : updateStatus === "downloading" ? (
                      <span className="text-xs text-neon">다운로드 중 {updateProgress}%</span>
                    ) : null}
                  </div>
                </div>
                {updateStatus !== "ready" && (
                  <button
                    onClick={handleCheckUpdate}
                    disabled={updateStatus === "checking" || updateStatus === "downloading"}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-text-muted border border-white/10 text-xs font-medium hover:bg-white/10 hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    업데이트 확인
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      );
    }

    if (activeMenu === "presets") {
      return (
        <PresetList
          presets={presets}
          characters={characters}
          onTogglePreset={handleTogglePreset}
          onDeletePreset={handleDeletePreset}
          onCreatePreset={openCreatePresetModal}
          onEditPreset={handleEditPreset}
          modsPath={modsPath}
          modStatusVersion={modStatusVersion}
        />
      );
    }

    if (view === "characters") {
      return (
        <CharacterGrid
          characters={characters}
          onSelect={handleSelectCharacter}
          modCounts={modCounts}
          favoriteCharacterIds={favoriteCharacterIds}
          onToggleFavoriteCharacter={handleToggleFavoriteCharacter}
        />
      );
    }

    return (
      <ModList
        mods={mods}
        selectedMod={selectedMod}
        onSelectMod={handleSelectMod}
        onToggleMod={handleToggleMod}
        onImportZip={handleImportModZip}
        onImportFolder={handleImportModFolder}
        characterName={selectedCharacter?.name ?? ""}
        onBack={handleBack}
        loading={loading}
        isDragging={isDragging}
        onDropFiles={handleDropFiles}
        favoriteModIds={favoriteModIds
          .filter(id => id.startsWith(`${selectedCharacterId}/`))
          .map(id => id.split("/").slice(1).join("/"))}
        onToggleFavoriteMod={handleToggleFavoriteMod}
        modOrder={config?.modOrder ?? {}}
        onReorderMods={handleReorderMods}
        selectedCharacterId={selectedCharacterId}
        onDragGroupWarning={() => addToast("warning", "즐겨찾기 모드는 즐겨찾기 영역 내에서만 이동할 수 있습니다")}
      />
    );
  };

  return (
    <>
      <AppShell>
        <Sidebar
          activeMenu={activeMenu}
          onMenuSelect={handleMenuSelect}
          characters={characters}
          selectedCharacterId={selectedCharacterId}
          view={view}
          onSelectCharacter={handleSelectCharacter}
          onLaunchXxmi={handleLaunchXxmi}
          xxmiLauncherPath={xxmiLauncherPath}
          totalEnabledMods={totalEnabledMods}
          totalMods={totalMods}
          presetCount={presetCount}
          activePresetCount={activePresetCount}
        />
        {renderContent()}
        {selectedMod && (
          <ModDetailPanel
            mod={selectedMod}
            onToggle={handleToggleMod}
            onDelete={handleDeleteMod}
            isFavorite={favoriteModIds.includes(`${selectedCharacterId}/${selectedMod.id}`)}
            onToggleFavorite={handleToggleFavoriteMod}
          />
        )}
      </AppShell>
      {showPresetModal && modsPath && (
        <PresetCreateModal
          characters={characters}
          modsPath={modsPath}
          onClose={closePresetModal}
          onSubmit={editingPreset ? handleUpdatePreset : handleCreatePreset}
          getMods={getMods}
          editPreset={editingPreset ?? undefined}
        />
      )}
      {showImportModal && importPreview && (
        <ModImportModal
          defaultName={importPreview.defaultName}
          previewImages={importPreview.previewImages}
          isImporting={isImporting}
          onConfirm={handleConfirmImport}
          onCancel={handleCancelImport}
        />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
