import { useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { HuihuiModDetail as HuihuiModDetailType } from "@/lib/huihui-types";

interface HuihuiModDetailProps {
  detail: HuihuiModDetailType;
  onClose: () => void;
}

export function HuihuiModDetail({ detail, onClose }: HuihuiModDetailProps) {
  const [selectedPreview, setSelectedPreview] = useState(0);

  return (
    <aside className="w-80 border-l border-border bg-panel overflow-y-auto flex-shrink-0">
      <div className="sticky top-0 bg-panel border-b border-border p-4 flex items-center justify-between z-10">
        <h2 className="text-sm font-semibold text-text-primary">HuiHui 모드 정보</h2>
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
                src={detail.previewImages[selectedPreview]}
                alt={`Preview ${selectedPreview + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            {detail.previewImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {detail.previewImages.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    onClick={() => setSelectedPreview(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPreview === idx
                        ? "border-neon"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <h3 className="text-base font-bold text-text-primary mb-1">{detail.name}</h3>
          {detail.originalName !== detail.name && (
            <p className="text-xs text-text-muted mb-1">{detail.originalName}</p>
          )}
          {detail.characterName && (
            <p className="text-xs text-neon mb-1">캐릭터: {detail.characterName}</p>
          )}
          <button
            onClick={() => openUrl(detail.pageUrl)}
            className="text-xs text-neon hover:text-neon-hover transition-colors"
          >
            원문 페이지 열기
          </button>
        </div>

        {detail.description && (
          <div>
            <h4 className="text-xs font-semibold text-text-primary mb-2">본문 요약</h4>
            <p className="text-xs text-text-muted leading-relaxed">{detail.description}</p>
          </div>
        )}

        <div>
          <h4 className="text-xs font-semibold text-text-primary mb-2">다운로드 링크</h4>
          {detail.downloadLinks.length === 0 ? (
            <p className="text-xs text-text-muted">추출된 다운로드 링크가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {detail.downloadLinks.map((link) => (
                <div
                  key={link.url}
                  className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-2"
                >
                  <p className="text-sm text-text-primary break-words">{link.label}</p>
                  {link.originalLabel !== link.label && (
                    <p className="text-xs text-text-muted break-words">{link.originalLabel}</p>
                  )}
                  {link.password && (
                    <p className="text-xs text-neon">
                      비밀번호: <span className="font-mono">{link.password}</span>
                    </p>
                  )}
                  <button
                    onClick={() => openUrl(link.url)}
                    className="w-full px-3 py-2 rounded-lg bg-neon/10 text-neon border border-neon/30 hover:bg-neon/20 text-sm font-medium transition-all"
                  >
                    링크 열기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
