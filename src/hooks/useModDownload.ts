import { useState, useCallback, useEffect } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { DownloadProgress, GameBananaFile } from "@/lib/gamebanana-types";
import { downloadAndImportMod } from "@/lib/gamebanana-commands";

interface UseModDownloadOptions {
  modsPath: string | null;
  addToast: (type: "success" | "error" | "warning", message: string, showReport?: boolean) => void;
  onImportComplete?: () => void;
}

interface PendingDownload {
  file: GameBananaFile;
  modName: string;
}

interface UseModDownloadReturn {
  isDownloading: boolean;
  progress: DownloadProgress | null;
  downloadingFileName: string | null;
  startDownload: (file: GameBananaFile, characterId: string | null, modName: string) => void;
  showCharacterSelect: boolean;
  pendingDownload: PendingDownload | null;
  confirmCharacterAndDownload: (characterId: string) => Promise<void>;
  cancelDownload: () => void;
}

export function useModDownload({
  modsPath,
  addToast,
  onImportComplete,
}: UseModDownloadOptions): UseModDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [downloadingFileName, setDownloadingFileName] = useState<string | null>(null);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [pendingDownload, setPendingDownload] = useState<PendingDownload | null>(null);

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    listen<DownloadProgress>("download-progress", (event) => {
      setProgress(event.payload);
    })
      .then((fn) => {
        unlisten = fn;
      })
      .catch((err) => {
        console.error("Failed to listen to download-progress event:", err);
      });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const executeDownload = useCallback(
    async (file: GameBananaFile, characterId: string, modName: string) => {
      if (!modsPath) {
        addToast("error", "Mods path is not set", true);
        return;
      }

      setIsDownloading(true);
      setDownloadingFileName(file.filename);
      setProgress(null);

      try {
        await downloadAndImportMod(file.id, file.filename, characterId, modsPath);
        addToast("success", `${modName} 모드가 임포트되었습니다`);
        if (onImportComplete) {
          onImportComplete();
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        addToast("error", `다운로드 실패: ${errorMessage}`, true);
        console.error("Failed to download mod:", err);
      } finally {
        setIsDownloading(false);
        setProgress(null);
        setDownloadingFileName(null);
      }
    },
    [modsPath, addToast, onImportComplete],
  );

  const startDownload = useCallback(
    (file: GameBananaFile, characterId: string | null, modName: string) => {
      if (characterId === null) {
        setPendingDownload({ file, modName });
        setShowCharacterSelect(true);
      } else {
        executeDownload(file, characterId, modName);
      }
    },
    [executeDownload],
  );

  const confirmCharacterAndDownload = useCallback(
    async (characterId: string) => {
      if (!pendingDownload) return;

      setShowCharacterSelect(false);
      await executeDownload(pendingDownload.file, characterId, pendingDownload.modName);
      setPendingDownload(null);
    },
    [pendingDownload, executeDownload],
  );

  const cancelDownload = useCallback(() => {
    setShowCharacterSelect(false);
    setPendingDownload(null);
  }, []);

  return {
    isDownloading,
    progress,
    downloadingFileName,
    startDownload,
    showCharacterSelect,
    pendingDownload,
    confirmCharacterAndDownload,
    cancelDownload,
  };
}
