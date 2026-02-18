import type { Character } from "@/lib/types";

interface CharacterSelectModalProps {
  characters: Character[];
  onSelect: (characterId: string) => void;
  onCancel: () => void;
  modName: string;
}

const CATEGORY_ORDER = ["방랑자", "캐릭터", "기타"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  방랑자: "Rover",
  캐릭터: "Characters",
  기타: "Others",
};

export function CharacterSelectModal({
  characters,
  onSelect,
  onCancel,
  modName,
}: CharacterSelectModalProps) {
  const groupedCharacters = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    characters: characters.filter((c) => c.category === cat),
  })).filter((g) => g.characters.length > 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="rounded-xl border border-white/10 bg-panel p-6 w-[480px] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-text-primary mb-1">캐릭터 선택</h3>
          <p className="text-sm text-text-muted">
            <span className="text-neon">'{modName}'</span> 모드의 캐릭터를 선택하세요
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {groupedCharacters.map((group) => (
            <div key={group.category}>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-semibold text-text-primary">
                  {group.category}
                  <span className="ml-1.5 text-text-muted font-normal">{group.label}</span>
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {group.characters.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => onSelect(character.id)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:border-neon/40 hover:bg-neon/5 transition-all"
                  >
                    <img
                      src={character.thumbnail}
                      alt={character.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {character.name}
                      </p>
                      <p className="text-xs text-text-muted truncate">{character.nameEn}</p>
                    </div>
                    {character.element && (
                      <img
                        src={`/elements/ic_${character.element}.png`}
                        alt={character.element}
                        className="w-5 h-5 flex-shrink-0"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-text-primary hover:bg-white/10 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}
