import { useState, useEffect, useCallback } from "react";
import { AppShell } from "./components/layout/AppShell";
import { Sidebar } from "./components/layout/Sidebar";
import type { MenuId } from "./components/layout/Sidebar";
import { CharacterGrid } from "./components/characters/CharacterGrid";
import { ModList } from "./components/mods/ModList";
import { ModDetailPanel } from "./components/mods/ModDetailPanel";
import type { Character, Mod } from "./lib/types";
import { getCharacters } from "./lib/commands";

type View = "characters" | "mods";

export function App() {
  const [activeMenu, setActiveMenu] = useState<MenuId>("mods");
  const [view, setView] = useState<View>("characters");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [mods, setMods] = useState<Mod[]>([]);
  const [selectedMod, setSelectedMod] = useState<Mod | null>(null);

  useEffect(() => {
    getCharacters()
      .then((chars) => {
        setCharacters(chars);
      })
      .catch((err) => {
        console.error("Failed to load characters:", err);
      });
  }, []);

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

  const handleMenuSelect = useCallback((id: MenuId) => {
    setActiveMenu(id);
    if (id === "mods") {
      setView("characters");
      setSelectedCharacterId(null);
      setSelectedMod(null);
      setMods([]);
    }
  }, []);

  const handleSelectCharacter = useCallback((id: string) => {
    setSelectedCharacterId(id);
    setSelectedMod(null);
    setMods([]);
    setView("mods");
  }, []);

  const handleBack = useCallback(() => {
    setView("characters");
    setSelectedCharacterId(null);
    setSelectedMod(null);
    setMods([]);
  }, []);

  const handleSelectMod = useCallback((mod: Mod) => {
    setSelectedMod(mod);
  }, []);

  const handleToggleMod = useCallback((mod: Mod) => {
    setMods((prev) =>
      prev.map((m) =>
        m.id === mod.id ? { ...m, enabled: !m.enabled } : m,
      ),
    );
    setSelectedMod((prev) =>
      prev?.id === mod.id ? { ...prev, enabled: !prev.enabled } : prev,
    );
  }, []);

  const renderContent = () => {
    if (activeMenu === "settings") {
      return (
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-xl font-bold text-text-primary mb-2">설정</h1>
          <p className="text-sm text-text-muted">설정 기능은 준비 중입니다.</p>
        </main>
      );
    }

    if (view === "characters") {
      return (
        <CharacterGrid
          characters={characters}
          onSelect={handleSelectCharacter}
        />
      );
    }

    return (
      <ModList
        mods={mods}
        selectedMod={selectedMod}
        onSelectMod={handleSelectMod}
        onToggleMod={handleToggleMod}
        characterName={selectedCharacter?.name ?? ""}
        onBack={handleBack}
      />
    );
  };

  return (
    <AppShell>
      <Sidebar activeMenu={activeMenu} onMenuSelect={handleMenuSelect} />
      {renderContent()}
      {selectedMod && (
        <ModDetailPanel mod={selectedMod} onToggle={handleToggleMod} />
      )}
    </AppShell>
  );
}
