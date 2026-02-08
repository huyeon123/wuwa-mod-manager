import { convertFileSrc } from "@tauri-apps/api/core";
import type { Mod } from "@/lib/types";

interface ModDetailPanelProps {
  mod: Mod | null;
  onToggle: (mod: Mod) => void;
  onDelete: (mod: Mod) => void;
}

export function ModDetailPanel({ mod, onToggle, onDelete }: ModDetailPanelProps) {
  if (!mod) {
    return (
      <aside className="w-80 flex-shrink-0 border-l border-border bg-sidebar p-6 flex items-center justify-center">
        <p className="text-text-muted text-sm">모드를 선택하세요</p>
      </aside>
    );
  }

  return (
    <aside className="w-80 flex-shrink-0 border-l border-border bg-sidebar overflow-y-auto">
      {/* Preview */}
      <div className="aspect-video w-full bg-background-card flex items-center justify-center text-text-muted">
        {mod.preview && mod.preview.length > 0 ? (
          <img
            src={convertFileSrc(mod.preview[0])}
            alt={mod.name}
            className="w-full h-full object-cover"
          />
        ) : (
          "No Preview"
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-text-primary">{mod.name}</h2>
          {mod.author && (
            <p className="text-sm text-text-secondary">by {mod.author}</p>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => onToggle(mod)}
          className={`w-full py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            mod.enabled
              ? "bg-neon/10 text-neon border border-neon/30 hover:bg-neon/20"
              : "bg-text-muted/10 text-text-secondary border border-white/10 hover:bg-white/10"
          }`}
        >
          {mod.enabled ? "활성화됨" : "비활성화됨"}
        </button>

        {/* Details */}
        <div className="space-y-3 text-sm">
          {mod.version && (
            <div className="flex justify-between">
              <span className="text-text-muted">버전</span>
              <span className="text-text-secondary">{mod.version}</span>
            </div>
          )}
          {mod.description && (
            <div>
              <p className="text-text-muted mb-1">설명</p>
              <p className="text-text-secondary">{mod.description}</p>
            </div>
          )}
          {mod.tags && mod.tags.length > 0 && (
            <div>
              <p className="text-text-muted mb-1">태그</p>
              <div className="flex flex-wrap gap-1">
                {mod.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-text-secondary border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-text-muted">경로</span>
            <span className="text-text-secondary truncate max-w-[180px]" title={mod.path}>
              {mod.path.split(/[/\\]/).pop()}
            </span>
          </div>
        </div>

        {/* Delete Button */}
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={() => onDelete(mod)}
            className="w-full py-2 rounded-lg text-sm font-medium text-red-400 border border-red-400/20 bg-red-400/5 hover:bg-red-400/10 transition-colors"
          >
            모드 삭제
          </button>
        </div>
      </div>
    </aside>
  );
}
