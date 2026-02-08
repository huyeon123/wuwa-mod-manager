import { invoke } from "@tauri-apps/api/core";
import type { Character, Mod, AppConfig } from "./types";

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
): Promise<Mod> {
  return invoke<Mod>("import_mod", { sourcePath, characterId, modsPath });
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
