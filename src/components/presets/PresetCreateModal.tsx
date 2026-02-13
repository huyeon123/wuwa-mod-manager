import { useState, useCallback, useMemo, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { Character, Mod, PresetMod } from "@/lib/types";

interface PresetCreateModalProps {
  characters: Character[];
  modsPath: string;
  onClose: () => void;
  onSubmit: (name: string, mods: PresetMod[]) => void;
  getMods: (characterId: string, modsPath: string) => Promise<Mod[]>;
}

export function PresetCreateModal({
  characters,
  modsPath,
  onClose,
  onSubmit,
  getMods,
}: PresetCreateModalProps) {
  const [presetName, setPresetName] = useState("");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null,
  );
  const [characterMods, setCharacterMods] = useState<Record<string, Mod[]>>({});
  const [selectedMods, setSelectedMods] = useState<PresetMod[]>([]);
  const [loadingMods, setLoadingMods] = useState(false);
  const [previewMod, setPreviewMod] = useState<Mod | null>(null);
  const [characterSearch, setCharacterSearch] = useState("");
  const [modSearch, setModSearch] = useState("");
  const [previewWidth, setPreviewWidth] = useState(310);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startWidth: previewWidth };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = dragRef.current.startX - e.clientX;
      const newWidth = Math.min(500, Math.max(150, dragRef.current.startWidth + delta));
      setPreviewWidth(newWidth);
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [previewWidth]);

  const handleSelectCharacter = useCallback(
    async (characterId: string) => {
      setPreviewMod(null);
      setModSearch("");
      setSelectedCharacterId(characterId);
      if (!characterMods[characterId]) {
        setLoadingMods(true);
        try {
          const mods = await getMods(characterId, modsPath);
          setCharacterMods((prev) => ({ ...prev, [characterId]: mods }));
        } catch (err) {
          console.error("Failed to load mods:", err);
        } finally {
          setLoadingMods(false);
        }
      }
    },
    [characterMods, getMods, modsPath],
  );

  const isModSelected = useCallback(
    (characterId: string, modId: string) => {
      return selectedMods.some(
        (m) => m.characterId === characterId && m.modId === modId,
      );
    },
    [selectedMods],
  );

  const handleToggleMod = useCallback(
    (characterId: string, modId: string) => {
      setSelectedMods((prev) => {
        const exists = prev.some(
          (m) => m.characterId === characterId && m.modId === modId,
        );
        if (exists) {
          return prev.filter(
            (m) => !(m.characterId === characterId && m.modId === modId),
          );
        }
        return [...prev, { characterId, modId }];
      });
    },
    [],
  );

  const getSelectedCountForCharacter = useCallback(
    (characterId: string) => {
      return selectedMods.filter((m) => m.characterId === characterId).length;
    },
    [selectedMods],
  );

  const canSubmit = presetName.trim().length > 0 && selectedMods.length > 0;

  const filteredCharacters = useMemo(() => {
    if (!characterSearch.trim()) return characters;
    const q = characterSearch.trim().toLowerCase();
    return characters.filter(
      (c) => c.name.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q),
    );
  }, [characters, characterSearch]);

  const currentMods = selectedCharacterId
    ? (characterMods[selectedCharacterId] ?? [])
    : [];

  const filteredMods = useMemo(() => {
    if (!modSearch.trim()) return currentMods;
    const q = modSearch.trim().toLowerCase();
    return currentMods.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.author?.toLowerCase().includes(q) ?? false),
    );
  }, [currentMods, modSearch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[80vh] mx-4 rounded-2xl border border-white/10 bg-background shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">
              프리셋 추가
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="프리셋 이름을 입력하세요"
            className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-neon/40 transition-colors"
            autoFocus
          />
        </div>

        {/* Body - 3-column layout */}
        <div className="flex flex-1 min-h-[400px]">
          {/* Left: Character List */}
          <div className="w-1/4 border-r border-white/10 flex flex-col">
            <div className="p-2 border-b border-white/5">
              <input
                type="text"
                value={characterSearch}
                onChange={(e) => setCharacterSearch(e.target.value)}
                placeholder="캐릭터 검색"
                className="w-full px-2.5 py-1.5 rounded-md border border-white/10 bg-white/5 text-text-primary placeholder:text-text-muted text-xs focus:outline-none focus:border-neon/40 transition-colors"
              />
            </div>
            <div className="overflow-y-auto p-3 space-y-0.5 flex-1">
            {filteredCharacters.map((character) => {
              const count = getSelectedCountForCharacter(character.id);
              return (
                <button
                  key={character.id}
                  onClick={() => handleSelectCharacter(character.id)}
                  className={`w-full rounded-lg flex items-center gap-2 px-3 py-2 transition-all duration-200 ${
                    selectedCharacterId === character.id
                      ? "bg-neon/10 text-neon"
                      : "text-text-muted hover:bg-white/5 hover:text-text-primary"
                  }`}
                >
                  <img
                    src={character.thumbnail}
                    alt={character.name}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  />
                  <span className="text-xs truncate flex-1 text-left">
                    {character.name}
                  </span>
                  {count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-neon/20 text-neon text-[10px] font-medium">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
            </div>
          </div>

          {/* Middle: Mod Selection */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedCharacterId && !loadingMods && currentMods.length > 0 && (
              <div className="p-2 border-b border-white/5">
                <input
                  type="text"
                  value={modSearch}
                  onChange={(e) => setModSearch(e.target.value)}
                  placeholder="모드 검색"
                  className="w-full px-2.5 py-1.5 rounded-md border border-white/10 bg-white/5 text-text-primary placeholder:text-text-muted text-xs focus:outline-none focus:border-neon/40 transition-colors"
                />
              </div>
            )}
            <div className="overflow-y-auto p-4 flex-1">
            {!selectedCharacterId ? (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">
                캐릭터를 선택하세요
              </div>
            ) : loadingMods ? (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">
                모드를 불러오는 중...
              </div>
            ) : filteredMods.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">
                등록된 모드가 없습니다
              </div>
            ) : (
              <div className="space-y-1">
                {filteredMods.map((mod) => {
                  const checked = isModSelected(selectedCharacterId, mod.id);
                  return (
                    <label
                      key={mod.id}
                      onClick={() => setPreviewMod(mod)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        checked
                          ? "bg-neon/5 border border-neon/30"
                          : "border border-transparent hover:bg-white/5"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          handleToggleMod(selectedCharacterId, mod.id)
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                          checked
                            ? "bg-neon border-neon"
                            : "border-white/20 bg-white/5"
                        }`}
                      >
                        {checked && (
                          <svg
                            className="w-3 h-3 text-background"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">
                          {mod.name}
                        </p>
                        {mod.author && (
                          <p className="text-xs text-text-muted truncate">
                            by {mod.author}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          mod.enabled
                            ? "text-neon bg-neon/10"
                            : "text-text-muted bg-white/5"
                        }`}
                      >
                        {mod.enabled ? "ON" : "OFF"}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            </div>
          </div>

          {/* Drag Handle */}
          <div
            onMouseDown={handleDragStart}
            className="w-1.5 bg-white/5 hover:bg-neon/20 cursor-col-resize flex items-center justify-center transition-colors flex-shrink-0"
          >
            <div className="h-8 w-0.5 rounded-full bg-white/20" />
          </div>

          {/* Right: Preview */}
          <div className="overflow-y-auto p-4 flex flex-col flex-shrink-0" style={{ width: `${previewWidth}px` }}>
            {previewMod && previewMod.preview && previewMod.preview.length > 0 ? (
              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden bg-white/5">
                  <img
                    src={convertFileSrc(previewMod.preview[0]!)}
                    alt={previewMod.name}
                    className="w-full h-auto object-contain max-h-[300px]"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{previewMod.name}</p>
                  {previewMod.author && (
                    <p className="text-xs text-text-muted mt-0.5">by {previewMod.author}</p>
                  )}
                  {previewMod.description && (
                    <p className="text-xs text-text-secondary mt-2">{previewMod.description}</p>
                  )}
                </div>
                {previewMod.preview.length > 1 && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {previewMod.preview.slice(1).map((p, i) => (
                      <div key={i} className="rounded overflow-hidden bg-white/5 aspect-square">
                        <img
                          src={convertFileSrc(p)}
                          alt={`${previewMod.name} preview ${i + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : previewMod ? (
              <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
                미리보기 없음
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
                모드를 선택하면 미리보기가 표시됩니다
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-xs text-text-muted">
            선택된 모드:{" "}
            <span className="text-neon font-medium">
              {selectedMods.length}개
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted border border-white/10 hover:bg-white/5 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() =>
                canSubmit && onSubmit(presetName.trim(), selectedMods)
              }
              disabled={!canSubmit}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-neon/10 text-neon border border-neon/30 hover:bg-neon/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              추가
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
