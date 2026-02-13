import { useState } from "react";
import type { Preset, Character } from "@/lib/types";

interface PresetListProps {
  presets: Preset[];
  characters: Character[];
  onTogglePreset: (presetId: string, enable: boolean) => void;
  onDeletePreset: (presetId: string) => void;
  onCreatePreset: () => void;
  modsPath: string | null;
}

export function PresetList({
  presets,
  characters,
  onTogglePreset,
  onDeletePreset,
  onCreatePreset,
  modsPath,
}: PresetListProps) {
  const [expandedPresetId, setExpandedPresetId] = useState<string | null>(null);

  const getCharacterName = (characterId: string) => {
    return characters.find((c) => c.id === characterId)?.name ?? characterId;
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            프리셋
          </h1>
          <p className="text-sm text-text-muted">
            {presets.length > 0
              ? `${presets.length}개의 프리셋`
              : "등록된 프리셋이 없습니다"}
          </p>
        </div>
        <button
          onClick={onCreatePreset}
          disabled={!modsPath}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon/10 text-neon border border-neon/30 text-sm font-medium hover:bg-neon/20 hover:shadow-[0_0_15px_rgba(53,243,229,0.1)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          프리셋 추가
        </button>
      </div>

      {/* Preset Cards */}
      {presets.length > 0 ? (
        <div className="space-y-3">
          {presets.map((preset) => {
            const isExpanded = expandedPresetId === preset.id;
            const modsByCharacter = preset.mods.reduce<
              Record<string, string[]>
            >((acc, pm) => {
              if (!acc[pm.characterId]) acc[pm.characterId] = [];
              acc[pm.characterId]!.push(pm.modId);
              return acc;
            }, {});

            return (
              <div
                key={preset.id}
                className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
              >
                {/* Preset Header */}
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() =>
                      setExpandedPresetId(isExpanded ? null : preset.id)
                    }
                    className="text-text-muted hover:text-text-primary transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-text-primary truncate">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-text-muted">
                      {Object.keys(modsByCharacter).length}개 캐릭터 ·{" "}
                      {preset.mods.length}개 모드
                    </p>
                  </div>

                  {/* Toggle Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onTogglePreset(preset.id, true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neon/10 text-neon border border-neon/30 hover:bg-neon/20 transition-colors"
                    >
                      ON
                    </button>
                    <button
                      onClick={() => onTogglePreset(preset.id, false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-text-muted border border-white/10 hover:bg-white/10 hover:text-text-primary transition-colors"
                    >
                      OFF
                    </button>
                    <button
                      onClick={() => onDeletePreset(preset.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-white/5">
                    <div className="space-y-2 mt-3">
                      {Object.entries(modsByCharacter).map(
                        ([characterId, modIds]) => (
                          <div key={characterId}>
                            <p className="text-xs font-medium text-text-secondary mb-1">
                              {getCharacterName(characterId)}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {modIds.map((modId) => (
                                <span
                                  key={modId}
                                  className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-text-muted border border-white/10"
                                >
                                  {modId}
                                </span>
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-text-muted">
          <svg
            className="w-12 h-12 mb-3 opacity-30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0l4.179 2.25L12 17.25l-9.75-5.25 4.179-2.25m11.142 0l4.179 2.25L12 21.75l-9.75-5.25 4.179-2.25"
            />
          </svg>
          <p className="text-lg mb-2">프리셋이 없습니다</p>
          <p className="text-sm">
            모드 조합을 프리셋으로 저장하고 한번에 관리하세요
          </p>
        </div>
      )}
    </main>
  );
}
