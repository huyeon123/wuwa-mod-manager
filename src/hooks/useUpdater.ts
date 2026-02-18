import { useCallback, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "downloading"
  | "ready"
  | "latest"
  | "error";

export function useUpdater() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);

  const checkForUpdates = useCallback(async () => {
    setUpdateStatus("checking");

    try {
      const update = await check();
      if (!update?.available) {
        setUpdateStatus("latest");
        setTimeout(() => setUpdateStatus("idle"), 3000);
        return;
      }

      setUpdateVersion(update.version);
      setUpdateStatus("downloading");
      setUpdateProgress(0);

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
    } catch (err) {
      console.error("Update check failed:", err);
      setUpdateStatus("error");
    }
  }, []);

  return {
    updateStatus,
    updateProgress,
    updateVersion,
    checkForUpdates,
  };
}
