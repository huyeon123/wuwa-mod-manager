use tauri::AppHandle;
use crate::core::{gamebanana_client, gamebanana_downloader};
use crate::models::gamebanana::{BrowseResult, GameBananaModDetail};
use crate::models::GameMod;

#[tauri::command]
pub async fn browse_mods(page: u32, per_page: u32, sort: String) -> Result<BrowseResult, String> {
    gamebanana_client::fetch_mods(page, per_page, &sort).await
}

#[tauri::command]
pub async fn browse_mod_detail(mod_id: u64) -> Result<GameBananaModDetail, String> {
    gamebanana_client::fetch_mod_detail(mod_id).await
}

#[tauri::command]
pub async fn download_and_import_mod(
    file_id: u64,
    file_name: String,
    character_id: String,
    mods_path: String,
    custom_name: Option<String>,
    app_handle: AppHandle,
) -> Result<GameMod, String> {
    gamebanana_downloader::download_and_import(
        file_id,
        &file_name,
        &character_id,
        &mods_path,
        custom_name.as_deref(),
        &app_handle,
    ).await
}
