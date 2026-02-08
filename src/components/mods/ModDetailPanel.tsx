import type { Mod } from "@/lib/types";

interface ModDetailPanelProps {
  mod: Mod | null;
  onToggle: (mod: Mod) => void;
}

export function ModDetailPanel({ mod, onToggle }: ModDetailPanelProps) {
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
        No Preview
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
          {mod.enabled ? "Enabled" : "Disabled"}
        </button>

        {/* Details */}
        <div className="space-y-3 text-sm">
          {mod.version && (
            <div className="flex justify-between">
              <span className="text-text-muted">Version</span>
              <span className="text-text-secondary">{mod.version}</span>
            </div>
          )}
          {mod.description && (
            <div>
              <p className="text-text-muted mb-1">Description</p>
              <p className="text-text-secondary">{mod.description}</p>
            </div>
          )}
          {mod.tags && mod.tags.length > 0 && (
            <div>
              <p className="text-text-muted mb-1">Tags</p>
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
        </div>
      </div>
    </aside>
  );
}
