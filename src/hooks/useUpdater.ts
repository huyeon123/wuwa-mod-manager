import { useCallback, useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "downloading"
  | "ready"
  | "latest"
  | "error";

interface UseUpdaterParams {
  addToast?: (type: "success" | "warning" | "error", message: string, showReport?: boolean) => void;
  autoCheck?: boolean;
}

export function useUpdater({ addToast, autoCheck = false }: UseUpdaterParams = {}) {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);

  const checkForUpdates = useCallback(async () => {
    setUpdateStatus("checking");

    try {
      const update = await check();
      if (!update?.available) {
        setUpdateStatus("latest");
        addToast?.("success", "현재 최신 버전입니다.");
        setTimeout(() => setUpdateStatus("idle"), 3000);
        return;
      }

      setUpdateVersion(update.version);
      setUpdateStatus("downloading");
      setUpdateProgress(0);
      addToast?.("success", `새 버전 v${update.version}을 다운로드 중입니다...`);

      let contentLength = 0;
      let downloaded = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength ?? 0;
            downloaded = 0;
            break;
          case "Progress": {
            if (contentLength <= 0) break;
            downloaded += event.data.chunkLength ?? 0;
            const progress = Math.min(100, Math.round((downloaded / contentLength) * 100));
            setUpdateProgress(progress);
            break;
          }
          case "Finished":
            break;
        }
      });

      setUpdateStatus("ready");
      addToast?.("success", "업데이트가 완료되었습니다. 앱을 재시작합니다...");

      // Auto-relaunch after short delay
      setTimeout(() => {
        relaunch().catch(console.error);
      }, 1500);
    } catch (err) {
      console.error("Update check failed:", err);
      setUpdateStatus("error");
    }
  }, [addToast]);

  // Auto-check on mount if enabled
  useEffect(() => {
    if (autoCheck) {
      checkForUpdates();
    }
  }, [autoCheck, checkForUpdates]);

  return {
    updateStatus,
    updateProgress,
    updateVersion,
    checkForUpdates,
  };
}
