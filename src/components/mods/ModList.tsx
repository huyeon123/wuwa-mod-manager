import type { Mod } from "@/lib/types";
import { ModCard } from "./ModCard";

interface ModListProps {
  mods: Mod[];
  selectedMod: Mod | null;
  onSelectMod: (mod: Mod) => void;
  onToggleMod: (mod: Mod) => void;
  characterName: string;
  onBack: () => void;
}

export function ModList({
  mods,
  selectedMod,
  onSelectMod,
  onToggleMod,
  characterName,
  onBack,
}: ModListProps) {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-neon transition-colors duration-200 mb-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          캐릭터 목록
        </button>
        <h1 className="text-xl font-bold text-text-primary">{characterName}</h1>
        <p className="text-sm text-text-muted">
          {mods.length > 0
            ? `${mods.length}개의 모드 (${mods.filter((m) => m.enabled).length}개 활성)`
            : "등록된 모드가 없습니다"}
        </p>
      </div>

      {mods.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mods.map((mod) => (
            <ModCard
              key={mod.id}
              mod={mod}
              isSelected={selectedMod?.id === mod.id}
              onSelect={onSelectMod}
              onToggle={onToggleMod}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-text-muted">
          <p className="text-lg mb-2">모드가 없습니다</p>
          <p className="text-sm">모드를 Import하여 시작하세요</p>
        </div>
      )}
    </main>
  );
}
