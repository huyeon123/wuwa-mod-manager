import { useCallback, useEffect, useState } from "react";
import { createPreset, deletePreset, getPresets, syncPresets, togglePreset, updatePreset } from "../lib/commands";
import type { Preset, PresetMod, AppConfig } from "../lib/types";
import type { ToastData } from "../components/ui/Toast";

interface UsePresetsParams {
  modsPath: string | null;
  addToast: (type: ToastData["type"], message: string, showReport?: boolean) => void;
  refreshModCounts: (pathOverride?: string | null) => Promise<void>;
  config: AppConfig | null;
}

export function usePresets({ modsPath, addToast, refreshModCounts, config }: UsePresetsParams) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePresetIds, setActivePresetIds] = useState<string[]>([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);

  useEffect(() => {
    if (modsPath) {
      syncPresets(modsPath)
        .then(setPresets)
        .catch((err) => console.error("Failed to sync presets:", err));
    } else {
      getPresets()
        .then(setPresets)
        .catch((err) => console.error("Failed to load presets:", err));
    }
  }, [modsPath]);

  useEffect(() => {
    if (config?.activePresetIds) {
      setActivePresetIds(config.activePresetIds);
    }
  }, [config]);

  const openCreatePresetModal = useCallback(() => {
    setEditingPreset(null);
    setShowPresetModal(true);
  }, []);

  const closePresetModal = useCallback(() => {
    setShowPresetModal(false);
    setEditingPreset(null);
  }, []);

  const handleEditPreset = useCallback((preset: Preset) => {
    setEditingPreset(preset);
    setShowPresetModal(true);
  }, []);

  const handleTogglePreset = useCallback(
    async (presetId: string, enable: boolean) => {
      if (!modsPath) return;
      try {
        await togglePreset(presetId, enable, modsPath);
        addToast("success", enable ? "프리셋이 활성화되었습니다" : "프리셋이 비활성화되었습니다");
        setActivePresetIds((prev) =>
          enable ? [...prev, presetId] : prev.filter((id) => id !== presetId),
        );
        await refreshModCounts(modsPath);
      } catch (err) {
        console.error("Failed to toggle preset:", err);
        addToast("error", `프리셋 전환 실패: ${err}`, true);
      }
    },
    [modsPath, addToast, refreshModCounts],
  );

  const handleDeletePreset = useCallback(
    async (presetId: string) => {
      try {
        await deletePreset(presetId);
        setPresets((prev) => prev.filter((p) => p.id !== presetId));
        setActivePresetIds((prev) => prev.filter((id) => id !== presetId));
        addToast("success", "프리셋이 삭제되었습니다");
      } catch (err) {
        console.error("Failed to delete preset:", err);
        addToast("error", `프리셋 삭제 실패: ${err}`, true);
      }
    },
    [addToast],
  );

  const handleCreatePreset = useCallback(
    async (name: string, mods: PresetMod[]) => {
      try {
        const newPreset = await createPreset(name, mods);
        setPresets((prev) => [...prev, newPreset]);
        closePresetModal();
        addToast("success", `프리셋 "${name}"이(가) 추가되었습니다`);
      } catch (err) {
        console.error("Failed to create preset:", err);
        addToast("error", `프리셋 추가 실패: ${err}`, true);
      }
    },
    [addToast, closePresetModal],
  );

  const handleUpdatePreset = useCallback(
    async (name: string, mods: PresetMod[]) => {
      if (!editingPreset) return;
      try {
        const updated = await updatePreset(editingPreset.id, name, mods);
        setPresets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        closePresetModal();
        addToast("success", `프리셋 "${name}"이(가) 수정되었습니다`);
      } catch (err) {
        console.error("Failed to update preset:", err);
        addToast("error", `프리셋 수정 실패: ${err}`, true);
      }
    },
    [editingPreset, addToast, closePresetModal],
  );

  return {
    presets,
    activePresetIds,
    showPresetModal,
    editingPreset,
    openCreatePresetModal,
    closePresetModal,
    handleEditPreset,
    handleTogglePreset,
    handleDeletePreset,
    handleCreatePreset,
    handleUpdatePreset,
  };
}
