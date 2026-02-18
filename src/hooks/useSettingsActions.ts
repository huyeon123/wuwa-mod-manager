import { useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  autoDetectPaths,
  launchXxmi,
  setAutoLaunchGame,
  setModsPath,
  setXxmiLauncherPath,
} from "../lib/commands";
import type { AppConfig } from "../lib/types";
import type { ToastData } from "../components/ui/Toast";

export type AutoDetectTarget = "mods" | "launcher" | "all";

interface UseSettingsActionsParams {
  addToast: (type: ToastData["type"], message: string, showReport?: boolean) => void;
  setModsPathState: (path: string | null) => void;
  setXxmiLauncherPathState: (path: string | null) => void;
  config: AppConfig | null;
  setConfig: (config: AppConfig) => void;
}

export function useSettingsActions({
  addToast,
  setModsPathState,
  setXxmiLauncherPathState,
  config,
  setConfig,
}: UseSettingsActionsParams) {
  const selectAndPersistPath = useCallback(
    async (
      dialogOptions: Parameters<typeof open>[0],
      persistPath: (path: string) => Promise<boolean>,
      applyPath: (path: string) => void,
      errorLogLabel: string,
      errorMessage: string,
    ) => {
      try {
        const selected = await open(dialogOptions);
        if (typeof selected !== "string") return;
        await persistPath(selected);
        applyPath(selected);
      } catch (err) {
        console.error(errorLogLabel, err);
        addToast("error", `${errorMessage}: ${err}`, true);
      }
    },
    [addToast],
  );

  const handleSelectModsPath = useCallback(async () => {
    await selectAndPersistPath(
      {
        multiple: false,
        directory: true,
        title: "모드 폴더를 선택하세요",
      },
      setModsPath,
      setModsPathState,
      "Failed to set mods path:",
      "모드 경로 설정 실패",
    );
  }, [selectAndPersistPath, setModsPathState]);

  const handleSelectXxmiLauncherPath = useCallback(async () => {
    await selectAndPersistPath(
      {
        multiple: false,
        filters: [{ name: "실행 파일", extensions: ["exe"] }],
        directory: false,
        title: "XXMI Launcher를 선택하세요",
      },
      setXxmiLauncherPath,
      setXxmiLauncherPathState,
      "Failed to set XXMI launcher path:",
      "XXMI 런처 경로 설정 실패",
    );
  }, [selectAndPersistPath, setXxmiLauncherPathState]);

  const handleLaunchXxmi = useCallback(async () => {
    try {
      await launchXxmi();
    } catch (err) {
      console.error("Failed to launch XXMI:", err);
      addToast("error", `게임 실행 실패: ${err}`, true);
    }
  }, [addToast]);

  const handleAutoDetect = useCallback(
    async (target: AutoDetectTarget = "all") => {
      try {
        const [detectedModsPath, detectedXxmiPath] = await autoDetectPaths();

        const applyMods = (target === "mods" || target === "all") && detectedModsPath;
        const applyLauncher =
          (target === "launcher" || target === "all") && detectedXxmiPath;

        if (applyMods) {
          setModsPathState(detectedModsPath);
        }
        if (applyLauncher) {
          setXxmiLauncherPathState(detectedXxmiPath);
        }

        if (applyMods || applyLauncher) {
          const found = [];
          if (applyMods) found.push("모드 폴더");
          if (applyLauncher) found.push("XXMI Launcher");
          addToast("success", `자동 탐지 성공: ${found.join(", ")}을(를) 찾았습니다.`);
        } else {
          const targetName =
            target === "mods"
              ? "모드 폴더"
              : target === "launcher"
                ? "XXMI Launcher"
                : "경로";
          addToast(
            "warning",
            `자동 탐지: ${targetName}를 찾을 수 없습니다. 수동으로 설정해주세요.`,
          );
        }
      } catch (err) {
        console.error("Failed to auto detect paths:", err);
        addToast("error", `자동 탐지 중 오류가 발생했습니다: ${err}`, true);
      }
    },
    [addToast, setModsPathState, setXxmiLauncherPathState],
  );

  const handleToggleAutoLaunch = useCallback(async () => {
    try {
      const nextEnabled = !config?.autoLaunchGame;
      const newConfig = await setAutoLaunchGame(nextEnabled);
      setConfig(newConfig);
    } catch (err) {
      addToast("error", `설정 변경 실패: ${err}`, true);
    }
  }, [config?.autoLaunchGame, setConfig, addToast]);

  return {
    handleSelectModsPath,
    handleSelectXxmiLauncherPath,
    handleLaunchXxmi,
    handleAutoDetect,
    handleToggleAutoLaunch,
  };
}
