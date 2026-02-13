import { useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";

interface ModImportModalProps {
  defaultName: string;
  previewImages: string[];
  onConfirm: (customName: string) => void;
  onCancel: () => void;
}

export function ModImportModal({
  defaultName,
  previewImages,
  onConfirm,
  onCancel,
}: ModImportModalProps) {
  const [modName, setModName] = useState(defaultName);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const canSubmit = modName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-white/10 bg-background shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">
              모드 가져오기
            </h2>
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
            >
              {/* X icon SVG */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Preview Images */}
          {previewImages.length > 0 && (
            <div className="space-y-2">
              {/* Main preview */}
              <div className="rounded-lg overflow-hidden bg-white/5 border border-white/10">
                <img
                  src={convertFileSrc(previewImages[selectedImageIndex]!)}
                  alt="모드 미리보기"
                  className="w-full h-auto object-contain max-h-[300px]"
                />
              </div>
              {/* Thumbnail grid if multiple images */}
              {previewImages.length > 1 && (
                <div className="grid grid-cols-5 gap-1.5">
                  {previewImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImageIndex(i)}
                      className={`rounded overflow-hidden bg-white/5 aspect-square border transition-colors ${
                        i === selectedImageIndex
                          ? "border-neon/50"
                          : "border-transparent hover:border-white/20"
                      }`}
                    >
                      <img
                        src={convertFileSrc(img)}
                        alt={`미리보기 ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No preview fallback */}
          {previewImages.length === 0 && (
            <div className="h-32 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
                <p className="text-xs text-text-muted">미리보기 이미지 없음</p>
              </div>
            </div>
          )}

          {/* Mod Name Input */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              모드 이름
            </label>
            <input
              type="text"
              value={modName}
              onChange={(e) => setModName(e.target.value)}
              placeholder="모드 이름을 입력하세요"
              className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-neon/40 transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) {
                  onConfirm(modName.trim());
                }
              }}
            />
            <p className="text-xs text-text-muted mt-1">
              가져올 모드의 이름을 지정하세요. 기본값은 폴더/파일명입니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted border border-white/10 hover:bg-white/5 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => canSubmit && onConfirm(modName.trim())}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-neon/10 text-neon border border-neon/30 hover:bg-neon/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            가져오기
          </button>
        </div>
      </div>
    </div>
  );
}
