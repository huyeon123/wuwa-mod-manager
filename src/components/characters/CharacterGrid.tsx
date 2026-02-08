import type { Character } from "@/lib/types";

interface CharacterGridProps {
  characters: Character[];
  onSelect: (id: string) => void;
}

export function CharacterGrid({ characters, onSelect }: CharacterGridProps) {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">캐릭터</h1>
        <p className="text-sm text-text-muted">모드를 관리할 캐릭터를 선택하세요</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {characters.map((character) => (
          <button
            key={character.id}
            onClick={() => onSelect(character.id)}
            className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-neon/40 hover:bg-neon/5 hover:shadow-[0_0_20px_rgba(53,243,229,0.1)] transition-all duration-200 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-background-card border border-white/10 flex items-center justify-center text-lg font-bold text-text-secondary group-hover:text-neon group-hover:border-neon/30 transition-colors duration-200">
              {character.nameEn.charAt(0)}
            </div>
            <div className="text-center min-w-0 w-full">
              <p className="text-sm font-medium text-text-primary truncate">{character.name}</p>
              <p className="text-xs text-text-muted truncate">{character.nameEn}</p>
            </div>
            {character.element && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-muted border border-white/10">
                {character.element}
              </span>
            )}
          </button>
        ))}
      </div>
    </main>
  );
}
