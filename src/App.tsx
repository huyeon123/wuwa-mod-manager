import { useState, useEffect, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getVersion } from "@tauri-apps/api/app";
import { AppShell } from "./components/layout/AppShell";
import { Sidebar } from "./components/layout/Sidebar";
import type { MenuId } from "./components/layout/Sidebar";
import { CharacterGrid } from "./components/characters/CharacterGrid";
import { ModList } from "./components/mods/ModList";
import { ModDetailPanel } from "./components/mods/ModDetailPanel";
import type { Character, Mod } from "./lib/types";
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
      .then((config) => {
        if (config.modsPath) {
          setModsPathState(config.modsPath);
        }
        if (config.xxmiLauncherPath) {
          setXxmiLauncherPathState(config.xxmiLauncherPath);
        }
        // If no modsPath, redirect to settings
        if (!config.modsPath) {
          setActiveMenu("settings");
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

  // Load mod counts when modsPath changes
  useEffect(() => {
    if (!modsPath) return;
    getModCounts(modsPath)
      .then(setModCounts)
      .catch((err) => console.error("Failed to load mod counts:", err));
  }, [modsPath]);

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

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
      await importMod(selected, selectedCharacterId, modsPath);
      await loadMods(selectedCharacterId);
      getModCounts(modsPath).then(setModCounts).catch(console.error);
    } catch (err) {
      console.error("Failed to import mod:", err);
      addToast("error", `모드 가져오기 실패: ${err}`, true);
    }
  }, [modsPath, selectedCharacterId, loadMods, addToast]);

  const handleImportModFolder = useCallback(async () => {
    if (!modsPath || !selectedCharacterId) return;
    try {
      const selected = await open({
        multiple: false,
        directory: true,
        title: "모드 폴더를 선택하세요",
      });
      if (!selected) return;
      await importMod(selected, selectedCharacterId, modsPath);
      await loadMods(selectedCharacterId);
      getModCounts(modsPath).then(setModCounts).catch(console.error);
    } catch (err) {
      console.error("Failed to import mod:", err);
      addToast("error", `모드 가져오기 실패: ${err}`, true);
    }
  }, [modsPath, selectedCharacterId, loadMods, addToast]);

  const handleDropFiles = useCallback(async (paths: string[]) => {
    if (!modsPath || !selectedCharacterId) return;
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
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">앱 버전</p>
                  <p className="text-xs text-text-muted mt-1">WWUA Mod Manager</p>
                </div>
                <span className="text-sm text-text-secondary font-mono">v{appVersion}</span>
              </div>
            </div>
          </div>
        </main>
      );
    }

    if (view === "characters") {
      return (
        <CharacterGrid
          characters={characters}
          onSelect={handleSelectCharacter}
          modCounts={modCounts}
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
        />
        {renderContent()}
        {selectedMod && (
          <ModDetailPanel
            mod={selectedMod}
            onToggle={handleToggleMod}
            onDelete={handleDeleteMod}
          />
        )}
      </AppShell>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
