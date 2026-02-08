import { useState, useRef, useCallback } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { Mod } from "@/lib/types";

interface ModDetailPanelProps {
  mod: Mod | null;
  onToggle: (mod: Mod) => void;
  onDelete: (mod: Mod) => void;
}

export function ModDetailPanel({ mod, onToggle, onDelete }: ModDetailPanelProps) {
  const [thumbnailHeight, setThumbnailHeight] = useState(400);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startHeight: thumbnailHeight };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = e.clientY - dragRef.current.startY;
      const newHeight = Math.min(600, Math.max(100, dragRef.current.startHeight + delta));
      setThumbnailHeight(newHeight);
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [thumbnailHeight]);

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
      <div
        className="w-full bg-background-card flex items-center justify-center text-text-muted overflow-hidden"
        style={{ height: `${thumbnailHeight}px` }}
      >
        {mod.preview && mod.preview.length > 0 ? (
          <img
            src={convertFileSrc(mod.preview[0]!)}
            alt={mod.name}
            className="w-full h-full object-cover"
          />
        ) : (
          "No Preview"
        )}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={handleDragStart}
        className="w-full h-1.5 bg-white/5 hover:bg-neon/20 cursor-row-resize flex items-center justify-center transition-colors"
      >
        <div className="w-8 h-0.5 rounded-full bg-white/20" />
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
          {mod.keybindings && mod.keybindings.length > 0 && (
            <div>
              <p className="text-text-muted mb-1">단축키</p>
              <div className="space-y-1">
                {mod.keybindings.map((kb, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-text-secondary text-xs">{kb.action}</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-text-primary border border-white/20">
                      {kb.key}
                    </kbd>
                  </div>
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
