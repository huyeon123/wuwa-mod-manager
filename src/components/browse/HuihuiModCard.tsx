import { useState } from "react";
import type { HuihuiMod } from "@/lib/huihui-types";

interface HuihuiModCardProps {
  mod: HuihuiMod;
  isSelected: boolean;
  onClick: (mod: HuihuiMod) => void;
}

export function HuihuiModCard({ mod, isSelected, onClick }: HuihuiModCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={() => onClick(mod)}
      className={`rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? "border-neon/30 bg-neon/5"
          : "border-white/10 bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="aspect-[4/3] bg-background-card rounded-t-xl overflow-hidden flex items-center justify-center">
        {mod.thumbnailUrl && !imageError ? (
          <img
            src={mod.thumbnailUrl}
            alt={mod.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <svg
            className="w-12 h-12 text-text-muted opacity-30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"
            />
          </svg>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-medium text-text-primary line-clamp-2 min-h-[2.75rem]" title={mod.name}>
          {mod.name}
        </h3>
        {mod.originalName !== mod.name && (
          <p className="mt-1 text-[11px] text-text-muted truncate" title={mod.originalName}>
            {mod.originalName}
          </p>
        )}
        {mod.characterName && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-neon/10 border border-neon/30 text-neon">
              {mod.characterName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
