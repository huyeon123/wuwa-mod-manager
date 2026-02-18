import { invoke } from "@tauri-apps/api/core";
import type { BrowseResult, GameBananaModDetail, SortOption } from "./gamebanana-types";
import type { Mod } from "./types";

export async function browseMods(
  page: number,
  perPage: number,
  sort: SortOption,
  search: string = "",
): Promise<BrowseResult> {
  return invoke<BrowseResult>("browse_mods", { page, perPage, sort, search });
}

export async function browseModDetail(modId: number): Promise<GameBananaModDetail> {
  return invoke<GameBananaModDetail>("browse_mod_detail", { modId });
}

export async function downloadAndImportMod(
  fileId: number,
  fileName: string,
  characterId: string,
  modsPath: string,
  customName?: string,
): Promise<Mod> {
  return invoke<Mod>("download_and_import_mod", {
    fileId,
    fileName,
    characterId,
    modsPath,
    customName: customName ?? null,
  });
}
