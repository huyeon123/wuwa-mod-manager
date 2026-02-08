import { useState, useEffect, useCallback } from "react";
import { AppShell } from "./components/layout/AppShell";
import { Sidebar } from "./components/layout/Sidebar";
import { ModList } from "./components/mods/ModList";
import { ModDetailPanel } from "./components/mods/ModDetailPanel";
import type { Character, Mod } from "./lib/types";
import { getCharacters } from "./lib/commands";

export function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [mods, setMods] = useState<Mod[]>([]);
  const [selectedMod, setSelectedMod] = useState<Mod | null>(null);

  useEffect(() => {
    getCharacters()
      .then((chars) => {
        setCharacters(chars);
        if (chars.length > 0 && chars[0]) {
          setSelectedCharacterId(chars[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to load characters:", err);
      });
  }, []);

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

  const handleSelectCharacter = useCallback((id: string) => {
    setSelectedCharacterId(id);
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
    if (selectedMod?.id === mod.id) {
      setSelectedMod((prev) => (prev ? { ...prev, enabled: !prev.enabled } : null));
    }
  }, [selectedMod]);

  return (
    <AppShell>
      <Sidebar
        characters={characters}
        selectedId={selectedCharacterId}
        onSelect={handleSelectCharacter}
      />
      <ModList
        mods={mods}
        selectedMod={selectedMod}
        onSelectMod={handleSelectMod}
        onToggleMod={handleToggleMod}
        characterName={selectedCharacter?.name ?? "캐릭터를 선택하세요"}
      />
      <ModDetailPanel mod={selectedMod} onToggle={handleToggleMod} />
    </AppShell>
  );
}
