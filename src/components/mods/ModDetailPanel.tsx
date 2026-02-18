import { useState, useRef, useCallback } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { openPath } from "@tauri-apps/plugin-opener";
import type { Mod } from "@/lib/types";

interface ModDetailPanelProps {
  mod: Mod | null;
  onToggle: (mod: Mod) => void;
  onDelete: (mod: Mod) => void;
  isFavorite: boolean;
  onToggleFavorite: (mod: Mod) => void;
}

export function ModDetailPanel({ mod, onToggle, onDelete, isFavorite, onToggleFavorite }: ModDetailPanelProps) {
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
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-text-primary">{mod.name}</h2>
            {mod.author && (
              <p className="text-sm text-text-secondary">by {mod.author}</p>
            )}
          </div>
          <button
            onClick={() => onToggleFavorite(mod)}
            className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
              isFavorite
                ? "text-yellow-400 bg-yellow-400/10"
                : "text-text-muted hover:text-yellow-400/70 bg-white/5 hover:bg-white/10"
            }`}
            title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>
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
          <div className="flex items-center justify-between">
            <span className="text-text-muted">경로</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-text-secondary truncate max-w-[150px]" title={mod.path}>
                {mod.path.split(/[/\\]/).pop()}
              </span>
              <button
                onClick={() => openPath(mod.path)}
                className="flex-shrink-0 text-text-muted hover:text-neon transition-colors"
                title="폴더 열기"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </button>
            </div>
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
