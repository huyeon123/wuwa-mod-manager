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
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-text-primary focus:outline-none focus:border-neon/50 transition-colors cursor-pointer"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
