import type { DownloadProgress } from "@/lib/gamebanana-types";

interface DownloadProgressModalProps {
  progress: DownloadProgress;
  fileName: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DownloadProgressModal({ progress, fileName }: DownloadProgressModalProps) {
  const phaseText = progress.phase === "downloading" ? "다운로드 중..." : "임포트 중...";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="rounded-xl border border-white/10 bg-panel p-6 w-96 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-text-primary mb-1">{phaseText}</h3>
          <p className="text-sm text-text-muted truncate" title={fileName}>
            {fileName}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">
              {formatBytes(progress.downloaded)} / {formatBytes(progress.total)}
            </span>
            <span className="font-medium text-neon">{progress.percent.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-neon transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>잠시만 기다려주세요</span>
        </div>
      </div>
    </div>
  );
}
