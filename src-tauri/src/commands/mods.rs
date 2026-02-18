use crate::core::{mod_manager, preset_manager};
use crate::models::{GameMod, ImportPreviewData};

#[tauri::command]
pub async fn get_mods(
    character_id: String,
    mods_path: String,
) -> Result<Vec<GameMod>, String> {
    mod_manager::get_mods_for_character(&character_id, &mods_path).await
}

#[tauri::command]
pub async fn enable_mod(
    mod_id: String,
    character_id: String,
    mods_path: String,
) -> Result<bool, String> {
    mod_manager::enable_mod(&mod_id, &character_id, &mods_path).await
}

#[tauri::command]
pub async fn disable_mod(
    mod_id: String,
    character_id: String,
    mods_path: String,
) -> Result<bool, String> {
    mod_manager::disable_mod(&mod_id, &character_id, &mods_path).await
}

#[tauri::command]
pub async fn import_mod(
    source_path: String,
    character_id: String,
    mods_path: String,
    custom_name: Option<String>,
) -> Result<GameMod, String> {
    mod_manager::import_mod(&source_path, &character_id, &mods_path, custom_name.as_deref()).await
}

#[tauri::command]
pub async fn delete_mod(
    mod_id: String,
    character_id: String,
    mods_path: String,
    app_handle: tauri::AppHandle,
) -> Result<bool, String> {
    let result = mod_manager::delete_mod(&mod_id, &character_id, &mods_path).await?;

    // 삭제된 모드를 참조하는 프리셋 자동 정리
    if let Err(e) = preset_manager::remove_mod_from_presets(&character_id, &mod_id, &app_handle).await {
        eprintln!("프리셋 정리 실패: {}", e);
    }

    Ok(result)
}

#[tauri::command]
pub async fn get_mod_counts(mods_path: String) -> Result<std::collections::HashMap<String, (u32, u32)>, String> {
    mod_manager::get_mod_counts(&mods_path).await
}

#[tauri::command]
pub async fn preview_import(source_path: String) -> Result<ImportPreviewData, String> {
    mod_manager::preview_import_source(&source_path).await
}

#[tauri::command]
pub async fn cleanup_import_temp(temp_dir: String) -> Result<(), String> {
    mod_manager::cleanup_import_temp(&temp_dir).await
}
