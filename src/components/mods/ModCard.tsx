import { convertFileSrc } from "@tauri-apps/api/core";
import type { Mod } from "@/lib/types";

interface ModCardProps {
  mod: Mod;
  isSelected: boolean;
  onSelect: (mod: Mod) => void;
  onToggle: (mod: Mod) => void;
}

export function ModCard({ mod, isSelected, onSelect, onToggle }: ModCardProps) {
  return (
    <div
      onClick={() => onSelect(mod)}
      className={`group relative rounded-xl border p-3 cursor-pointer transition-all duration-200 ${
        isSelected
          ? "border-neon/50 bg-neon/5 shadow-[0_0_15px_rgba(53,243,229,0.1)]"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
      }`}
    >
      {/* Preview Image */}
      <div className="aspect-[3/4] w-full rounded-lg bg-background-card mb-3 overflow-hidden">
        {mod.preview && mod.preview.length > 0 ? (
          <img
            src={convertFileSrc(mod.preview[0])}
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
