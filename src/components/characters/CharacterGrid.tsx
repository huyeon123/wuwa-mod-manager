import { useState, useMemo } from "react";
import type { Character } from "@/lib/types";

interface CharacterGridProps {
  characters: Character[];
  onSelect: (id: string) => void;
  modCounts: Record<string, [number, number]>;
  favoriteCharacterIds: string[];
  onToggleFavoriteCharacter: (characterId: string) => void;
}

const ELEMENT_ORDER = ["기류", "용융", "응결", "인멸", "전도", "회절"] as const;

const ELEMENT_LABELS: Record<string, string> = {
  기류: "Aero",
  용융: "Fusion",
  응결: "Glacio",
  인멸: "Havoc",
  전도: "Electro",
  회절: "Spectro",
};

type SortKey = "name" | "element";

export function CharacterGrid({ characters, onSelect, modCounts, favoriteCharacterIds, onToggleFavoriteCharacter }: CharacterGridProps) {
  const [sortBy, setSortBy] = useState<SortKey>("element");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return characters;
    const q = searchQuery.toLowerCase();
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q),
    );
  }, [characters, searchQuery]);

  const grouped = useMemo(() => {
    // 즐겨찾기 그룹 생성
    const favoriteChars = filtered.filter(c => favoriteCharacterIds.includes(c.id))
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));

    if (sortBy === "name") {
      const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "ko"));
      return [
        ...(favoriteChars.length > 0 ? [{ element: "즐겨찾기", label: "Favorites", characters: favoriteChars }] : []),
        { element: null, label: null, characters: sorted },
      ];
    }

    // 1. 방랑자 그룹
    const rovers = filtered.filter(c => c.category === "방랑자")
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));

    // 2. 캐릭터 - 속성별 그룹 (기존 로직)
    const elementGroups = ELEMENT_ORDER.map(element => ({
      element,
      label: ELEMENT_LABELS[element],
      characters: filtered.filter(c => c.category === "캐릭터" && c.element === element)
        .sort((a, b) => a.name.localeCompare(b.name, "ko")),
    })).filter(g => g.characters.length > 0);

    // 3. 기타 카테고리
    const others = filtered.filter(c => c.category === "기타")
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));

    // 합치기
    return [
      ...(favoriteChars.length > 0 ? [{ element: "즐겨찾기", label: "Favorites", characters: favoriteChars }] : []),
      ...(rovers.length > 0 ? [{ element: "방랑자", label: "Rover", characters: rovers }] : []),
      ...elementGroups,
      ...(others.length > 0 ? [{ element: "기타", label: "Others", characters: others }] : []),
    ];
  }, [filtered, sortBy, favoriteCharacterIds]);

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">모드 대상 선택</h1>
          <p className="text-sm text-text-muted">
            모드를 관리할 대상을 선택하세요
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 pl-8 pr-3 py-1.5 text-sm rounded-lg border border-white/10 bg-white/5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon/40 transition-colors"
            />
          </div>
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            <button
              onClick={() => setSortBy("element")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                sortBy === "element"
                  ? "bg-neon/20 text-neon border-r border-white/10"
                  : "bg-white/5 text-text-muted hover:text-text-primary border-r border-white/10"
              }`}
            >
              속성별
            </button>
            <button
              onClick={() => setSortBy("name")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                sortBy === "name"
                  ? "bg-neon/20 text-neon"
                  : "bg-white/5 text-text-muted hover:text-text-primary"
              }`}
            >
              이름순
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {grouped.map((group) => (
          <section key={group.element ?? "all"}>
            {group.element && (
              <div className="flex items-center gap-2 mb-3">
                {group.element === "즐겨찾기" ? (
                  <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1}>
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                ) : ["기류", "용융", "응결", "인멸", "전도", "회절"].includes(group.element) && (
                  <img
                    src={`/elements/ic_${group.element}.png`}
                    alt={group.element}
                    className="w-5 h-5"
                  />
                )}
                <h2 className="text-sm font-semibold text-text-primary">
                  {group.element}
                  <span className="ml-1.5 text-text-muted font-normal">
                    {group.label}
                  </span>
                </h2>
                <span className="text-xs text-text-muted">
                  ({group.characters.length})
                </span>
              </div>
            )}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {group.characters.map((character) => (
                <div
                  key={character.id}
                  onClick={() => onSelect(character.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(character.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-neon/40 hover:bg-neon/5 hover:shadow-[0_0_20px_rgba(53,243,229,0.1)] transition-all duration-200 cursor-pointer"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavoriteCharacter(character.id);
                    }}
                    className={`absolute top-2 left-2 w-6 h-6 flex items-center justify-center rounded-full transition-all duration-200 z-10 ${
                      favoriteCharacterIds.includes(character.id)
                        ? "text-yellow-400 bg-yellow-400/20"
                        : "text-text-muted/40 hover:text-yellow-400/70 bg-transparent hover:bg-white/10 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={favoriteCharacterIds.includes(character.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </button>
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-background-card border border-white/10 text-[11px] font-medium leading-none z-10">
                    <span className="text-neon">{modCounts[character.id]?.[0] ?? 0}</span>
                    <span className="text-text-muted">/{modCounts[character.id]?.[1] ?? 0}</span>
                  </span>
                  <div className="w-16 h-16 rounded-full bg-background-card border border-white/10 overflow-hidden group-hover:border-neon/30 transition-colors duration-200">
                    <img
                      src={character.thumbnail}
                      alt={character.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="text-center min-w-0 w-full">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {character.name}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {character.nameEn}
                    </p>
                  </div>
                  {sortBy === "name" && character.element && (
                    <img
                      src={`/elements/ic_${character.element}.png`}
                      alt={character.element}
                      className="absolute bottom-2 right-2 w-5 h-5"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
