import type { Character } from "@/lib/types";

interface SidebarProps {
  characters: Character[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function Sidebar({ characters, selectedId, onSelect }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          Characters
        </h2>
        <nav className="space-y-1">
          {characters.map((character) => (
            <button
              key={character.id}
              onClick={() => onSelect(character.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                selectedId === character.id
                  ? "bg-neon/10 text-neon border border-neon/30"
                  : "text-text-secondary hover:bg-background-hover hover:text-text-primary border border-transparent"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-background-card flex items-center justify-center text-xs font-bold">
                {character.nameEn.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{character.name}</p>
                <p className="text-xs text-text-muted truncate">{character.nameEn}</p>
              </div>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
