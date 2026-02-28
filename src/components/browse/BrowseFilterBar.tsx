import { useEffect, useMemo, useRef, useState } from "react";
import type { SortOption } from "@/lib/gamebanana-types";

interface BrowseFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "Generic_LatestUpdated", label: "최신순" },
  { value: "Generic_MostDownloaded", label: "인기순" },
  { value: "Generic_MostLiked", label: "좋아요순" },
];

export function BrowseFilterBar({
  searchQuery,
  onSearchChange,
  sort,
  onSortChange,
}: BrowseFilterBarProps) {
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const selectedSortLabel = useMemo(
    () => SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "정렬",
    [sort],
  );

  useEffect(() => {
    if (!sortMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSortMenuOpen(false);
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [sortMenuOpen]);

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          placeholder="모드 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon/50 transition-colors"
        />
      </div>
      <div ref={sortMenuRef} className="relative">
        <button
          type="button"
          onClick={() => setSortMenuOpen((prev) => !prev)}
          className="flex items-center justify-between gap-2 min-w-[150px] px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-text-primary hover:bg-white/10 focus:outline-none focus:border-neon/50 transition-colors"
          aria-haspopup="listbox"
          aria-expanded={sortMenuOpen}
          aria-label="정렬 선택"
        >
          <span>{selectedSortLabel}</span>
          <svg
            className={`w-4 h-4 text-text-muted transition-transform ${
              sortMenuOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {sortMenuOpen && (
          <div
            role="listbox"
            aria-label="정렬 옵션"
            className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-lg border border-white/10 bg-background-card/95 backdrop-blur shadow-xl z-30"
          >
            {SORT_OPTIONS.map((option) => {
              const selected = sort === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onSortChange(option.value);
                    setSortMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                    selected ? "bg-neon/10 text-neon" : "text-text-primary hover:bg-white/10"
                  }`}
                  role="option"
                  aria-selected={selected}
                >
                  <span>{option.label}</span>
                  {selected && (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
