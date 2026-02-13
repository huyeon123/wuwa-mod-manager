import { useState, useEffect, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { openUrl } from "@tauri-apps/plugin-opener";
import { AppShell } from "./components/layout/AppShell";
import { Sidebar } from "./components/layout/Sidebar";
import type { MenuId } from "./components/layout/Sidebar";
import { CharacterGrid } from "./components/characters/CharacterGrid";
import { ModList } from "./components/mods/ModList";
import { ModDetailPanel } from "./components/mods/ModDetailPanel";
import { ModImportModal } from "./components/mods/ModImportModal";
import { PresetList } from "./components/presets/PresetList";
import { PresetCreateModal } from "./components/presets/PresetCreateModal";
import type { Character, Mod, Preset, PresetMod, ImportPreviewData, AppConfig } from "./lib/types";
import { ToastContainer, type ToastData } from "./components/ui/Toast";
import {
  getCharacters,
  getConfig,
  getMods,
  enableMod,
  disableMod,
  importMod,
  deleteMod,
  setModsPath,
  getModCounts,
  setXxmiLauncherPath,
  launchXxmi,
  autoDetectPaths,
  toggleFavoriteCharacter,
  toggleFavoriteMod,
  getPresets,
  createPreset,
  deletePreset as deletePresetCmd,
  togglePreset,
  updatePreset,
  previewImport,
  cleanupImportTemp,
  setAutoLaunchGame,
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
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "downloading" | "ready" | "latest" | "error">("idle");
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [favoriteCharacterIds, setFavoriteCharacterIds] = useState<string[]>([]);
  const [favoriteModIds, setFavoriteModIds] = useState<string[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePresetIds, setActivePresetIds] = useState<string[]>([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreviewData | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSourcePath, setImportSourcePath] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
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

  // Load config on startup
  useEffect(() => {
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
    // Load presets
    getPresets().then(setPresets).catch(err => console.error("Failed to load presets:", err));
  }, []);

  // Load characters
  useEffect(() => {
    getCharacters()
      .then(setCharacters)
      .catch((err) => {
        console.error("Failed to load characters:", err);
      });
  }, []);

  // Load mod counts when modsPath changes
  useEffect(() => {
    if (!modsPath) return;
    getModCounts(modsPath)
      .then(setModCounts)
      .catch((err) => console.error("Failed to load mod counts:", err));
  }, [modsPath]);

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

  // Calculate preset counts
  const presetCount = presets.length;
  const activePresetCount = activePresetIds.length;

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
        await loadMods(selectedCharacterId);
        getModCounts(modsPath).then(setModCounts).catch(console.error);
        // Update selectedMod if it was the toggled one
        setSelectedMod((prev) =>
          prev?.id === mod.id ? { ...prev, enabled: !prev.enabled } : prev,
        );
      } catch (err) {
        console.error("Failed to toggle mod:", err);
        addToast("error", `모드 전환 실패: ${err}`, true);
      }
    },
    [modsPath, selectedCharacterId, loadMods, addToast],
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
      let preview: ImportPreviewData;
      try {
        preview = await previewImport(selected);
      } catch {
        // Fallback: extract name from path
        const fileName = selected.split(/[/\\]/).pop() ?? "unknown_mod";
        const defaultName = fileName.replace(/\.zip$/i, "");
        preview = { defaultName, previewImages: [], tempDir: null };
      }
      setImportPreview(preview);
      setImportSourcePath(selected);
      setShowImportModal(true);
    } catch (err) {
      console.error("Failed to import mod:", err);
      addToast("error", `모드 가져오기 실패: ${err}`, true);
    }
  }, [modsPath, selectedCharacterId, addToast]);

  const handleImportModFolder = useCallback(async () => {
    if (!modsPath || !selectedCharacterId) return;
    try {
      const selected = await open({
        multiple: false,
        directory: true,
        title: "모드 폴더를 선택하세요",
      });
      if (!selected) return;
      let preview: ImportPreviewData;
      try {
        preview = await previewImport(selected);
      } catch {
        const defaultName = selected.split(/[/\\]/).pop() ?? "unknown_mod";
        preview = { defaultName, previewImages: [], tempDir: null };
      }
      setImportPreview(preview);
      setImportSourcePath(selected);
      setShowImportModal(true);
    } catch (err) {
      console.error("Failed to import mod:", err);
      addToast("error", `모드 가져오기 실패: ${err}`, true);
    }
  }, [modsPath, selectedCharacterId, addToast]);

  const handleConfirmImport = useCallback(async (customName: string) => {
    if (!modsPath || !selectedCharacterId || !importSourcePath) return;
    setIsImporting(true);
    try {
      await importMod(importSourcePath, selectedCharacterId, modsPath, customName);
      await loadMods(selectedCharacterId);
      getModCounts(modsPath).then(setModCounts).catch(console.error);
      addToast("success", `모드 "${customName}"을(를) 가져왔습니다`);
    } catch (err) {
      console.error("Failed to import mod:", err);
      addToast("error", `모드 가져오기 실패: ${err}`, true);
    } finally {
      setIsImporting(false);
      // Cleanup temp dir if exists
      if (importPreview?.tempDir) {
        cleanupImportTemp(importPreview.tempDir).catch(console.error);
      }
      setShowImportModal(false);
      setImportPreview(null);
      setImportSourcePath(null);
    }
  }, [modsPath, selectedCharacterId, importSourcePath, importPreview, loadMods, addToast]);

  const handleCancelImport = useCallback(() => {
    if (importPreview?.tempDir) {
      cleanupImportTemp(importPreview.tempDir).catch(console.error);
    }
    setShowImportModal(false);
    setImportPreview(null);
    setImportSourcePath(null);
  }, [importPreview]);

  const handleDropFiles = useCallback(async (paths: string[]) => {
    if (!modsPath || !selectedCharacterId) return;
    if (paths.length === 1) {
      // Single file: show preview modal
      try {
        let preview: ImportPreviewData;
        try {
          preview = await previewImport(paths[0]!);
        } catch {
          const fileName = paths[0]!.split(/[/\\]/).pop() ?? "unknown_mod";
          const defaultName = fileName.replace(/\.zip$/i, "");
          preview = { defaultName, previewImages: [], tempDir: null };
        }
        setImportPreview(preview);
        setImportSourcePath(paths[0]!);
        setShowImportModal(true);
      } catch (err) {
        console.error("Failed to import mod:", err);
        addToast("error", `모드 가져오기 실패: ${err}`, true);
      }
    } else {
      // Multiple files: import directly without modal
      for (const filePath of paths) {
        try {
          await importMod(filePath, selectedCharacterId, modsPath);
        } catch (err) {
          console.error("Failed to import dropped mod:", err);
          addToast("error", `모드 가져오기 실패: ${err}`, true);
        }
      }
      await loadMods(selectedCharacterId);
      getModCounts(modsPath).then(setModCounts).catch(console.error);
    }
  }, [modsPath, selectedCharacterId, loadMods, addToast]);

  // Register Tauri drag-drop event listener
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    try {
      getCurrentWebview().onDragDropEvent((event) => {
        if (event.payload.type === "enter" || event.payload.type === "over") {
          setIsDragging(true);
        } else if (event.payload.type === "leave") {
          setIsDragging(false);
        } else if (event.payload.type === "drop") {
          setIsDragging(false);
          if (view === "mods" && selectedCharacterId && modsPath) {
            const paths = event.payload.paths;
            handleDropFiles(paths);
          }
        }
      }).then((fn) => {
        unlisten = fn;
      }).catch((err) => {
        console.error("Failed to register drag-drop listener:", err);
      });
    } catch (err) {
      console.error("Failed to get webview:", err);
    }

    return () => {
      if (unlisten) unlisten();
    };
  }, [view, selectedCharacterId, modsPath, handleDropFiles]);

  const handleDeleteMod = useCallback(
    async (mod: Mod) => {
      if (!modsPath || !selectedCharacterId) return;
      try {
        await deleteMod(mod.id, selectedCharacterId, modsPath);
        setSelectedMod(null);
        await loadMods(selectedCharacterId);
        getModCounts(modsPath).then(setModCounts).catch(console.error);
      } catch (err) {
        console.error("Failed to delete mod:", err);
        addToast("error", `모드 삭제 실패: ${err}`, true);
      }
    },
    [modsPath, selectedCharacterId, loadMods, addToast],
  );

  const handleSelectModsPath = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: true,
        title: "모드 폴더를 선택하세요",
      });
      if (selected) {
        await setModsPath(selected);
        setModsPathState(selected);
      }
    } catch (err) {
      console.error("Failed to set mods path:", err);
      addToast("error", `모드 경로 설정 실패: ${err}`, true);
    }
  }, [addToast]);

  const handleSelectXxmiLauncherPath = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "실행 파일", extensions: ["exe"] }],
        directory: false,
        title: "XXMI Launcher를 선택하세요",
      });
      if (selected) {
        await setXxmiLauncherPath(selected);
        setXxmiLauncherPathState(selected);
      }
    } catch (err) {
      console.error("Failed to set XXMI launcher path:", err);
      addToast("error", `XXMI 런처 경로 설정 실패: ${err}`, true);
    }
  }, [addToast]);

  const handleLaunchXxmi = useCallback(async () => {
    try {
      await launchXxmi();
    } catch (err) {
      console.error("Failed to launch XXMI:", err);
      addToast("error", `게임 실행 실패: ${err}`, true);
    }
  }, [addToast]);

  const handleAutoDetect = useCallback(async (target: "mods" | "launcher" | "all" = "all") => {
    try {
      const [detectedModsPath, detectedXxmiPath] = await autoDetectPaths();

      const applyMods = (target === "mods" || target === "all") && detectedModsPath;
      const applyLauncher = (target === "launcher" || target === "all") && detectedXxmiPath;

      if (applyMods) {
        setModsPathState(detectedModsPath);
      }
      if (applyLauncher) {
        setXxmiLauncherPathState(detectedXxmiPath);
      }

      if (applyMods || applyLauncher) {
        const found = [];
        if (applyMods) found.push("모드 폴더");
        if (applyLauncher) found.push("XXMI Launcher");
        addToast("success", `자동 탐지 성공: ${found.join(", ")}을(를) 찾았습니다.`);
      } else {
        const targetName = target === "mods" ? "모드 폴더" : target === "launcher" ? "XXMI Launcher" : "경로";
        addToast("warning", `자동 탐지: ${targetName}를 찾을 수 없습니다. 수동으로 설정해주세요.`);
      }
    } catch (err) {
      console.error("Failed to auto detect paths:", err);
      addToast("error", `자동 탐지 중 오류가 발생했습니다: ${err}`, true);
    }
  }, [addToast]);

  const handleCheckUpdate = useCallback(async () => {
    setUpdateStatus("checking");
    try {
      const update = await check();
      if (update?.available) {
        setUpdateVersion(update.version);
        setUpdateStatus("downloading");
        setUpdateProgress(0);

        let contentLength = 0;
        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              contentLength = event.data.contentLength ?? 0;
              break;
            case "Progress":
              if (contentLength > 0) {
                setUpdateProgress(Math.round(((event.data.chunkLength ?? 0) / contentLength) * 100));
              }
              break;
            case "Finished":
              break;
          }
        });

        setUpdateStatus("ready");
      } else {
        setUpdateStatus("latest");
        setTimeout(() => setUpdateStatus("idle"), 3000);
      }
    } catch (err) {
      console.error("Update check failed:", err);
      setUpdateStatus("error");
    }
  }, []);

  const handleTogglePreset = useCallback(async (presetId: string, enable: boolean) => {
    if (!modsPath) return;
    try {
      await togglePreset(presetId, enable, modsPath);
      addToast("success", enable ? "프리셋이 활성화되었습니다" : "프리셋이 비활성화되었습니다");
      // Track active preset state
      setActivePresetIds(prev =>
        enable ? [...prev, presetId] : prev.filter(id => id !== presetId)
      );
      // Refresh mod counts
      getModCounts(modsPath).then(setModCounts).catch(console.error);
    } catch (err) {
      console.error("Failed to toggle preset:", err);
      addToast("error", `프리셋 전환 실패: ${err}`, true);
    }
  }, [modsPath, addToast]);

  const handleDeletePreset = useCallback(async (presetId: string) => {
    try {
      await deletePresetCmd(presetId);
      setPresets(prev => prev.filter(p => p.id !== presetId));
      addToast("success", "프리셋이 삭제되었습니다");
    } catch (err) {
      console.error("Failed to delete preset:", err);
      addToast("error", `프리셋 삭제 실패: ${err}`, true);
    }
  }, [addToast]);

  const handleCreatePreset = useCallback(async (name: string, mods: PresetMod[]) => {
    try {
      const newPreset = await createPreset(name, mods);
      setPresets(prev => [...prev, newPreset]);
      setShowPresetModal(false);
      addToast("success", `프리셋 "${name}"이(가) 추가되었습니다`);
    } catch (err) {
      console.error("Failed to create preset:", err);
      addToast("error", `프리셋 추가 실패: ${err}`, true);
    }
  }, [addToast]);

  const handleUpdatePreset = useCallback(async (name: string, mods: PresetMod[]) => {
    if (!editingPreset) return;
    try {
      const updated = await updatePreset(editingPreset.id, name, mods);
      setPresets(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditingPreset(null);
      setShowPresetModal(false);
      addToast("success", `프리셋 "${name}"이(가) 수정되었습니다`);
    } catch (err) {
      console.error("Failed to update preset:", err);
      addToast("error", `프리셋 수정 실패: ${err}`, true);
    }
  }, [editingPreset, addToast]);

  const handleEditPreset = useCallback((preset: Preset) => {
    setEditingPreset(preset);
    setShowPresetModal(true);
  }, []);

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
                onClick={async () => {
                  try {
                    const newConfig = await setAutoLaunchGame(!config?.autoLaunchGame);
                    setConfig(newConfig);
                  } catch (err) {
                    addToast("error", `설정 변경 실패: ${err}`, true);
                  }
                }}
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
          onCreatePreset={() => { setEditingPreset(null); setShowPresetModal(true); }}
          onEditPreset={handleEditPreset}
          modsPath={modsPath}
          activePresetIds={activePresetIds}
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
          onClose={() => {
            setShowPresetModal(false);
            setEditingPreset(null);
          }}
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
