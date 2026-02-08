use crate::core::mod_manager;
use crate::models::GameMod;

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
) -> Result<GameMod, String> {
    mod_manager::import_mod(&source_path, &character_id, &mods_path).await
}

#[tauri::command]
pub async fn delete_mod(
    mod_id: String,
    character_id: String,
    mods_path: String,
) -> Result<bool, String> {
    mod_manager::delete_mod(&mod_id, &character_id, &mods_path).await
}

#[tauri::command]
pub async fn get_mod_counts(mods_path: String) -> Result<std::collections::HashMap<String, (u32, u32)>, String> {
    mod_manager::get_mod_counts(&mods_path).await
}
