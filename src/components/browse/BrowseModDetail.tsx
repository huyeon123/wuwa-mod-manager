import type { GameBananaModDetail, GameBananaFile } from "@/lib/gamebanana-types";
import { useState } from "react";

interface BrowseModDetailProps {
  detail: GameBananaModDetail;
  detectedCharacterName: string | null;
  isDownloading: boolean;
  onDownload: (file: GameBananaFile) => void;
  onClose: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BrowseModDetail({
  detail,
  detectedCharacterName,
  isDownloading,
  onDownload,
  onClose,
}: BrowseModDetailProps) {
  const [selectedPreview, setSelectedPreview] = useState(0);

  return (
    <aside className="w-80 border-l border-border bg-panel overflow-y-auto flex-shrink-0">
      <div className="sticky top-0 bg-panel border-b border-border p-4 flex items-center justify-between z-10">
        <h2 className="text-sm font-semibold text-text-primary">모드 정보</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {detail.previewImages.length > 0 && detail.previewImages[selectedPreview] && (
          <div className="space-y-2">
            <div className="aspect-[4/3] bg-background-card rounded-lg overflow-hidden">
              <img
                src={detail.previewImages[selectedPreview].url}
                alt={`Preview ${selectedPreview + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            {detail.previewImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {detail.previewImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPreview(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPreview === idx
                        ? "border-neon"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img
                      src={img.thumbUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <h3 className="text-base font-bold text-text-primary mb-1">{detail.name}</h3>
          <p className="text-xs text-text-muted">{detail.submitterName}</p>
          {detail.version && (
            <p className="text-xs text-text-muted mt-1">버전: {detail.version}</p>
          )}
        </div>

        {detectedCharacterName && (
          <div className="px-3 py-2 rounded-lg bg-neon/10 border border-neon/30">
            <p className="text-xs text-text-muted mb-0.5">감지된 캐릭터</p>
            <p className="text-sm font-medium text-neon">{detectedCharacterName}</p>
          </div>
        )}

        {detail.description && (
          <div>
            <h4 className="text-xs font-semibold text-text-primary mb-2">설명</h4>
            <div className="text-xs text-text-muted max-h-48 overflow-y-auto leading-relaxed">
              {detail.description}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-text-muted">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.003-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            <span>{detail.likeCount} 좋아요</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{detail.viewCount} 조회</span>
          </div>
        </div>

        {detail.files.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-text-primary mb-2">다운로드 파일</h4>
            <div className="space-y-2">
              {detail.files.map((file) => (
                <div
                  key={file.id}
                  className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-2"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary truncate" title={file.filename}>
                      {file.filename}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatFileSize(file.filesize)} · {file.downloadCount.toLocaleString()} 다운로드
                    </p>
                  </div>
                  {file.description && (
                    <p className="text-xs text-text-muted line-clamp-2">{file.description}</p>
                  )}
                  <button
                    onClick={() => onDownload(file)}
                    disabled={isDownloading}
                    className="w-full px-3 py-2 rounded-lg bg-neon/10 text-neon border border-neon/30 hover:bg-neon/20 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloading ? "다운로드 중..." : "다운로드"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
