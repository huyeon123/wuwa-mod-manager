import { useState, useEffect, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { AppShell } from "./components/layout/AppShell";
import { Sidebar } from "./components/layout/Sidebar";
import type { MenuId } from "./components/layout/Sidebar";
import { CharacterGrid } from "./components/characters/CharacterGrid";
import { ModList } from "./components/mods/ModList";
import { ModDetailPanel } from "./components/mods/ModDetailPanel";
import type { Character, Mod } from "./lib/types";
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
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [modCounts, setModCounts] = useState<Record<string, [number, number]>>({});

  // Load config on startup
  useEffect(() => {
    getConfig()
      .then((config) => {
        if (config.modsPath) {
          setModsPathState(config.modsPath);
        }
      })
      .catch((err) => {
        console.error("Failed to load config:", err);
      });
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
      }
    },
    [modsPath, selectedCharacterId, loadMods],
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
    }
  }, [modsPath, selectedCharacterId, loadMods]);

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
    }
  }, [modsPath, selectedCharacterId, loadMods]);

  const handleDropFiles = useCallback(async (paths: string[]) => {
    if (!modsPath || !selectedCharacterId) return;
    for (const filePath of paths) {
      try {
        await importMod(filePath, selectedCharacterId, modsPath);
      } catch (err) {
        console.error("Failed to import dropped mod:", err);
      }
    }
    await loadMods(selectedCharacterId);
    getModCounts(modsPath).then(setModCounts).catch(console.error);
  }, [modsPath, selectedCharacterId, loadMods]);

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
      }
    },
    [modsPath, selectedCharacterId, loadMods],
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
    }
  }, []);

  const renderContent = () => {
    if (activeMenu === "settings") {
      return (
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-xl font-bold text-text-primary mb-4">설정</h1>
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
          </div>
        </main>
      );
    }

    if (!modsPath) {
      return (
        <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-xl font-bold text-text-primary">모드 폴더를 설정하세요</h1>
            <p className="text-sm text-text-muted">
              모드를 관리하려면 먼저 Mods 폴더 경로를 지정해야 합니다.
            </p>
            <button
              onClick={handleSelectModsPath}
              className="px-6 py-3 rounded-xl bg-neon/10 text-neon border border-neon/30 font-medium hover:bg-neon/20 hover:shadow-[0_0_20px_rgba(53,243,229,0.15)] transition-all duration-200"
            >
              폴더 선택
            </button>
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
    <AppShell>
      <Sidebar
        activeMenu={activeMenu}
        onMenuSelect={handleMenuSelect}
        characters={characters}
        selectedCharacterId={selectedCharacterId}
        view={view}
        onSelectCharacter={handleSelectCharacter}
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
  );
}
