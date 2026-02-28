import { invoke } from "@tauri-apps/api/core";
import type { HuihuiBrowseResult, HuihuiModDetail } from "./huihui-types";

export async function browseHuihuiMods(
  page: number,
  search: string = "",
): Promise<HuihuiBrowseResult> {
  return invoke<HuihuiBrowseResult>("browse_huihui_mods", { page, search });
}

export async function browseHuihuiModDetail(modId: number): Promise<HuihuiModDetail> {
  return invoke<HuihuiModDetail>("browse_huihui_mod_detail", { modId });
}
