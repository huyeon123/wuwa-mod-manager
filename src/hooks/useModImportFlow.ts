import { useCallback, useState } from "react";
import type { ImportPreviewData } from "../lib/types";
import { cleanupImportTemp, importMod, previewImport } from "../lib/commands";
import type { ToastData } from "../components/ui/Toast";

interface UseModImportFlowParams {
  modsPath: string | null;
  selectedCharacterId: string | null;
  addToast: (type: ToastData["type"], message: string, showReport?: boolean) => void;
  loadMods: (characterId: string) => Promise<void>;
  refreshModCounts: (pathOverride?: string | null) => Promise<void>;
}

function getSourceBaseName(sourcePath: string): string {
  const fileName = sourcePath.split(/[/\\]/).pop() ?? "unknown_mod";
  return fileName.replace(/\.zip$/i, "");
}

function buildFallbackImportPreview(sourcePath: string): ImportPreviewData {
  return {
    defaultName: getSourceBaseName(sourcePath),
    previewImages: [],
    tempDir: null,
  };
}

export function useModImportFlow({
  modsPath,
  selectedCharacterId,
  addToast,
  loadMods,
  refreshModCounts,
}: UseModImportFlowParams) {
  const [importPreview, setImportPreview] = useState<ImportPreviewData | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSourcePath, setImportSourcePath] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const closeImportModal = useCallback(
    (cleanupTempDir: boolean) => {
      if (cleanupTempDir && importPreview?.tempDir) {
        cleanupImportTemp(importPreview.tempDir).catch(console.error);
      }
      setShowImportModal(false);
      setImportPreview(null);
      setImportSourcePath(null);
    },
    [importPreview],
  );

  const openImportPreviewModal = useCallback(
    async (sourcePath: string) => {
      try {
        const preview = await previewImport(sourcePath).catch(() =>
          buildFallbackImportPreview(sourcePath),
        );
        setImportPreview(preview);
        setImportSourcePath(sourcePath);
        setShowImportModal(true);
      } catch (err) {
        console.error("Failed to import mod:", err);
        addToast("error", `Failed to import mod: ${err}`, true);
      }
    },
    [addToast],
  );

  const confirmImport = useCallback(
    async (customName: string) => {
      if (!modsPath || !selectedCharacterId || !importSourcePath) return;

      setIsImporting(true);
      try {
        await importMod(importSourcePath, selectedCharacterId, modsPath, customName);
        await loadMods(selectedCharacterId);
        await refreshModCounts(modsPath);
        addToast("success", `Imported mod \"${customName}\".`);
      } catch (err) {
        console.error("Failed to import mod:", err);
        addToast("error", `Failed to import mod: ${err}`, true);
      } finally {
        setIsImporting(false);
        closeImportModal(true);
      }
    },
    [modsPath, selectedCharacterId, importSourcePath, loadMods, refreshModCounts, addToast, closeImportModal],
  );

  const cancelImport = useCallback(() => {
    closeImportModal(true);
  }, [closeImportModal]);

  const handleDropFiles = useCallback(
    async (paths: string[]) => {
      if (!modsPath || !selectedCharacterId) return;

      if (paths.length === 1) {
        await openImportPreviewModal(paths[0]!);
        return;
      }

      for (const filePath of paths) {
        try {
          await importMod(filePath, selectedCharacterId, modsPath);
        } catch (err) {
          console.error("Failed to import dropped mod:", err);
          addToast("error", `Failed to import mod: ${err}`, true);
        }
      }

      await loadMods(selectedCharacterId);
      await refreshModCounts(modsPath);
    },
    [modsPath, selectedCharacterId, openImportPreviewModal, loadMods, refreshModCounts, addToast],
  );

  return {
    importPreview,
    showImportModal,
    isImporting,
    openImportPreviewModal,
    confirmImport,
    cancelImport,
    handleDropFiles,
  };
}
