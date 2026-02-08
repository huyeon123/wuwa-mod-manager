import { useState, useRef, useEffect } from "react";
import type { Mod } from "@/lib/types";
import { ModCard } from "./ModCard";

interface ModListProps {
  mods: Mod[];
  selectedMod: Mod | null;
  onSelectMod: (mod: Mod) => void;
  onToggleMod: (mod: Mod) => void;
  onImportZip: () => void;
  onImportFolder: () => void;
  characterName: string;
  onBack: () => void;
  loading: boolean;
}

export function ModList({
  mods,
  selectedMod,
  onSelectMod,
  onToggleMod,
  onImportZip,
  onImportFolder,
  characterName,
  onBack,
  loading,
}: ModListProps) {
  const [showImportMenu, setShowImportMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowImportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">{characterName}</h1>
            <p className="text-sm text-text-muted">
              {loading
                ? "모드를 불러오는 중..."
                : mods.length > 0
                  ? `${mods.length}개의 모드 (${mods.filter((m) => m.enabled).length}개 활성)`
                  : "등록된 모드가 없습니다"}
            </p>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowImportMenu((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon/10 text-neon border border-neon/30 text-sm font-medium hover:bg-neon/20 hover:shadow-[0_0_15px_rgba(53,243,229,0.1)] transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Import
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {showImportMenu && (
              <div className="absolute right-0 mt-1 w-44 rounded-lg border border-white/10 bg-background-card shadow-lg overflow-hidden z-10">
                <button
                  onClick={() => { setShowImportMenu(false); onImportZip(); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  ZIP 파일
                </button>
                <button
                  onClick={() => { setShowImportMenu(false); onImportFolder(); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                  폴더
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-muted">
          <p className="text-sm">불러오는 중...</p>
        </div>
      ) : mods.length > 0 ? (
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
          <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p className="text-lg mb-2">모드가 없습니다</p>
          <p className="text-sm mb-4">ZIP 파일 또는 폴더를 Import하여 시작하세요</p>
          <button
            onClick={onImportZip}
            className="px-4 py-2 rounded-lg bg-neon/10 text-neon border border-neon/30 text-sm font-medium hover:bg-neon/20 transition-colors"
          >
            모드 Import
          </button>
        </div>
      )}
    </main>
  );
}
