import { invoke } from "@tauri-apps/api/core";
import type { HuihuiBrowseResult, HuihuiModDetail } from "./huihui-types";

export async function browseHuihuiMods(
  page: number,
  search: string = "",
  translate: boolean = false,
): Promise<HuihuiBrowseResult> {
  return invoke<HuihuiBrowseResult>("browse_huihui_mods", { page, search, translate });
}

export async function browseHuihuiModDetail(
  modId: number,
  translate: boolean = false,
): Promise<HuihuiModDetail> {
  return invoke<HuihuiModDetail>("browse_huihui_mod_detail", { modId, translate });
}
