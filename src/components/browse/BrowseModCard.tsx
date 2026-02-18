import type { GameBananaMod } from "@/lib/gamebanana-types";
import { useState } from "react";

interface BrowseModCardProps {
  mod: GameBananaMod;
  isSelected: boolean;
  onClick: (mod: GameBananaMod) => void;
}

export function BrowseModCard({ mod, isSelected, onClick }: BrowseModCardProps) {
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
          <svg className="w-12 h-12 text-text-muted opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        )}
      </div>
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-medium text-text-primary truncate" title={mod.name}>
          {mod.name}
        </h3>
        <p className="text-xs text-text-muted truncate">{mod.submitterName}</p>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.003-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            <span>{mod.likeCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{mod.viewCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
