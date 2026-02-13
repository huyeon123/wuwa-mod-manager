import { useState } from "react";
import type { Character } from "@/lib/types";

type MenuId = "mods" | "presets" | "settings";

interface MenuItem {
  id: MenuId;
  label: string;
  icon: React.ReactNode;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "mods",
    label: "모드",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
  },
  {
    id: "presets",
    label: "프리셋",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0l4.179 2.25L12 17.25l-9.75-5.25 4.179-2.25m11.142 0l4.179 2.25L12 21.75l-9.75-5.25 4.179-2.25" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "설정",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  activeMenu: MenuId;
  onMenuSelect: (id: MenuId) => void;
  characters: Character[];
  selectedCharacterId: string | null;
  view: "characters" | "mods";
  onSelectCharacter: (id: string) => void;
  onLaunchXxmi?: () => void;
  xxmiLauncherPath?: string | null;
}

export function Sidebar({
  activeMenu,
  onMenuSelect,
  characters,
  selectedCharacterId,
  view,
  onSelectCharacter,
  onLaunchXxmi,
  xxmiLauncherPath,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [charSearch, setCharSearch] = useState("");

  // Auto-expand dropdown when in mods view with selected character
  const showDropdown = activeMenu === "mods" && !collapsed && view === "mods" && selectedCharacterId !== null;

  // Filter characters by search query
  const filteredCharacters = characters.filter((char) =>
    charSearch === "" ||
    char.name.toLowerCase().includes(charSearch.toLowerCase()) ||
    char.nameEn.toLowerCase().includes(charSearch.toLowerCase())
  );

  // Group filtered characters by category
  const CATEGORY_ORDER = ["방랑자", "캐릭터", "기타"] as const;
  const CATEGORY_LABELS: Record<string, string> = {
    방랑자: "Rover",
    캐릭터: "Characters",
    기타: "Others",
  };

  const groupedCharacters = CATEGORY_ORDER.map(cat => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    characters: filteredCharacters.filter(c => c.category === cat),
  })).filter(g => g.characters.length > 0);

  return (
    <aside
      className={`flex-shrink-0 border-r border-border bg-sidebar flex flex-col py-4 transition-all duration-200 overflow-y-auto overflow-x-hidden ${
        collapsed ? "w-16 items-center" : "w-48"
      }`}
    >
      <div className={`mb-4 ${collapsed ? "" : "px-4"}`}>
        <div className="w-9 h-9 rounded-lg bg-neon/20 flex items-center justify-center text-neon font-bold text-sm">
          W
        </div>
      </div>
      <nav className={`flex flex-col gap-1 flex-1 w-full ${collapsed ? "px-2" : "px-3"}`}>
        {MENU_ITEMS.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => onMenuSelect(item.id)}
              title={collapsed ? item.label : undefined}
              className={`rounded-lg flex items-center transition-all duration-200 w-full ${
                collapsed
                  ? "h-12 justify-center"
                  : "h-11 px-3 gap-3 justify-start"
              } ${
                activeMenu === item.id
                  ? "bg-neon/15 text-neon"
                  : "text-text-muted hover:bg-background-hover hover:text-text-primary"
              }`}
            >
              {item.icon}
              {!collapsed && (
                <span className="text-sm font-medium flex-1 text-left whitespace-nowrap">{item.label}</span>
              )}
              {!collapsed && item.id === "mods" && showDropdown && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              )}
            </button>

            {/* Character Dropdown */}
            {item.id === "mods" && showDropdown && (
              <div className="mt-1 ml-1 space-y-0.5">
                <input
                  type="text"
                  value={charSearch}
                  onChange={(e) => setCharSearch(e.target.value)}
                  placeholder="검색..."
                  className="w-full px-2.5 py-1.5 text-xs bg-background-hover border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon/50 transition-colors"
                />
                {groupedCharacters.map((group, groupIdx) => (
                  <div key={group.category}>
                    {groupIdx > 0 && <div className="h-px bg-border my-1" />}
                    <div className="text-xs text-text-muted px-2 py-1 font-medium">
                      {group.label}
                    </div>
                    {group.characters.map((character) => (
                      <button
                        key={character.id}
                        onClick={() => onSelectCharacter(character.id)}
                        className={`w-full rounded-lg flex items-center gap-2 px-3 py-2 transition-all duration-200 ${
                          selectedCharacterId === character.id
                            ? "bg-neon/10 text-neon"
                            : "text-text-muted hover:bg-background-hover hover:text-text-primary"
                        }`}
                      >
                        <img
                          src={character.thumbnail}
                          alt={character.name}
                          className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                        />
                        <span className="text-xs truncate">{character.name}</span>
                        {character.element && (
                          <img
                            src={`/elements/ic_${character.element}.png`}
                            alt={character.element}
                            className="w-4 h-4 ml-auto flex-shrink-0"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className={`mt-auto space-y-2 w-full ${collapsed ? "px-2" : "px-3"}`}>
        {xxmiLauncherPath && onLaunchXxmi && (
          <button
            onClick={onLaunchXxmi}
            title={collapsed ? "게임 실행" : undefined}
            className={`rounded-lg flex items-center transition-all duration-200 w-full bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 ${
              collapsed
                ? "h-12 justify-center"
                : "h-11 px-3 gap-3 justify-start"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
            </svg>
            {!collapsed && (
              <span className="text-sm font-medium whitespace-nowrap">게임 실행</span>
            )}
          </button>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "펼치기" : "접기"}
          className={`w-full h-11 rounded-lg flex items-center ${collapsed ? "justify-center" : "justify-end pr-3"} text-text-muted hover:bg-background-hover hover:text-text-primary transition-all duration-200`}
        >
          {collapsed ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      </div>
    </aside>
  );
}

export type { MenuId };
