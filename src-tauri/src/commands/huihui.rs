use crate::core::huihui_client;
use crate::models::huihui::{HuihuiBrowseResult, HuihuiModDetail};

#[tauri::command]
pub async fn browse_huihui_mods(page: u32, search: String) -> Result<HuihuiBrowseResult, String> {
    huihui_client::fetch_mods(page, &search).await
}

#[tauri::command]
pub async fn browse_huihui_mod_detail(mod_id: u64) -> Result<HuihuiModDetail, String> {
    huihui_client::fetch_mod_detail(mod_id).await
}
