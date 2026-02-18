import { convertFileSrc } from "@tauri-apps/api/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Mod } from "@/lib/types";

interface ModCardProps {
  mod: Mod;
  isSelected: boolean;
  onSelect: (mod: Mod) => void;
  onToggle: (mod: Mod) => void;
  isFavorite: boolean;
  onToggleFavorite: (mod: Mod) => void;
}

export function ModCard({ mod, isSelected, onSelect, onToggle, isFavorite, onToggleFavorite }: ModCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mod.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(mod)}
      className={`group relative rounded-xl border p-3 cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isSelected
          ? "border-neon/50 bg-neon/5 shadow-[0_0_15px_rgba(53,243,229,0.1)]"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
      }`}
    >
      {/* Favorite Button - 왼쪽 상단 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(mod);
        }}
        className={`absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 z-10 ${
          isFavorite
            ? "text-yellow-400 bg-yellow-400/20"
            : "text-text-muted/40 hover:text-yellow-400/70 bg-black/40 hover:bg-black/60 opacity-0 group-hover:opacity-100"
        }`}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      </button>

      {/* Preview Image */}
      <div className="aspect-[3/4] w-full rounded-lg bg-background-card mb-3 overflow-hidden">
        {mod.preview && mod.preview.length > 0 ? (
          <img
            src={convertFileSrc(mod.preview[0]!)}
            alt={mod.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">
            No Preview
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-text-primary truncate">{mod.name}</h3>
        {mod.author && (
          <p className="text-xs text-text-muted truncate">by {mod.author}</p>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(mod);
        }}
        className={`absolute top-2 right-2 w-10 h-6 rounded-full transition-colors duration-200 ${
          mod.enabled ? "bg-neon" : "bg-text-muted/30"
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 mx-1 ${
            mod.enabled ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
