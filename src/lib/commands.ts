import { invoke } from "@tauri-apps/api/core";
import type { Character, Mod, AppConfig, Preset, PresetMod, ImportPreviewData } from "./types";

export async function getCharacters(): Promise<Character[]> {
  return invoke<Character[]>("get_characters");
}

export async function getMods(characterId: string, modsPath: string): Promise<Mod[]> {
  return invoke<Mod[]>("get_mods", { characterId, modsPath });
}

export async function enableMod(
  modId: string,
  characterId: string,
  modsPath: string,
): Promise<boolean> {
  return invoke<boolean>("enable_mod", { modId, characterId, modsPath });
}

export async function disableMod(
  modId: string,
  characterId: string,
  modsPath: string,
): Promise<boolean> {
  return invoke<boolean>("disable_mod", { modId, characterId, modsPath });
}

export async function importMod(
  sourcePath: string,
  characterId: string,
  modsPath: string,
  customName?: string,
): Promise<Mod> {
  return invoke<Mod>("import_mod", { sourcePath, characterId, modsPath, customName: customName ?? null });
}

export async function deleteMod(
  modId: string,
  characterId: string,
  modsPath: string,
): Promise<boolean> {
  return invoke<boolean>("delete_mod", { modId, characterId, modsPath });
}

export async function getConfig(): Promise<AppConfig> {
  return invoke<AppConfig>("get_config");
}

export async function setModsPath(path: string): Promise<boolean> {
  return invoke<boolean>("set_mods_path", { path });
}

export async function getModCounts(modsPath: string): Promise<Record<string, [number, number]>> {
  return invoke<Record<string, [number, number]>>("get_mod_counts", { modsPath });
}

export async function setXxmiLauncherPath(path: string): Promise<boolean> {
  return invoke<boolean>("set_xxmi_launcher_path", { path });
}

export async function launchXxmi(): Promise<boolean> {
  return invoke<boolean>("launch_xxmi");
}

export async function autoDetectPaths(): Promise<[string | null, string | null]> {
  return invoke<[string | null, string | null]>("auto_detect_paths");
}

export async function toggleFavoriteCharacter(characterId: string): Promise<AppConfig> {
  return invoke<AppConfig>("toggle_favorite_character", { characterId });
}

export async function toggleFavoriteMod(characterId: string, modId: string): Promise<AppConfig> {
  return invoke<AppConfig>("toggle_favorite_mod", { characterId, modId });
}

export async function getPresets(): Promise<Preset[]> {
  return invoke<Preset[]>("get_presets");
}

export async function createPreset(name: string, mods: PresetMod[]): Promise<Preset> {
  return invoke<Preset>("create_preset", { name, mods });
}

export async function deletePreset(presetId: string): Promise<boolean> {
  return invoke<boolean>("delete_preset", { presetId });
}

export async function togglePreset(presetId: string, enable: boolean, modsPath: string): Promise<boolean> {
  return invoke<boolean>("toggle_preset", { presetId, enable, modsPath });
}

export async function updatePreset(presetId: string, name?: string, mods?: PresetMod[]): Promise<Preset> {
  return invoke<Preset>("update_preset", { presetId, name, mods });
}

export async function previewImport(sourcePath: string): Promise<ImportPreviewData> {
  return invoke<ImportPreviewData>("preview_import", { sourcePath });
}

export async function cleanupImportTemp(tempDir: string): Promise<void> {
  return invoke<void>("cleanup_import_temp", { tempDir });
}
