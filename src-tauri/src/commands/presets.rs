use crate::core::preset_manager;
use crate::models::{Preset, PresetMod};

#[tauri::command]
pub async fn get_presets(
    app_handle: tauri::AppHandle,
) -> Result<Vec<Preset>, String> {
    preset_manager::get_presets(&app_handle).await
}

#[tauri::command]
pub async fn create_preset(
    name: String,
    mods: Vec<PresetMod>,
    app_handle: tauri::AppHandle,
) -> Result<Preset, String> {
    preset_manager::create_preset(&name, mods, &app_handle).await
}

#[tauri::command]
pub async fn delete_preset(
    preset_id: String,
    app_handle: tauri::AppHandle,
) -> Result<bool, String> {
    preset_manager::delete_preset(&preset_id, &app_handle).await
}

#[tauri::command]
pub async fn toggle_preset(
    preset_id: String,
    enable: bool,
    mods_path: String,
    app_handle: tauri::AppHandle,
) -> Result<bool, String> {
    preset_manager::toggle_preset(&preset_id, enable, &mods_path, &app_handle).await
}

#[tauri::command]
pub async fn update_preset(
    preset_id: String,
    name: Option<String>,
    mods: Option<Vec<PresetMod>>,
    app_handle: tauri::AppHandle,
) -> Result<Preset, String> {
    preset_manager::update_preset(&preset_id, name, mods, &app_handle).await
}

#[tauri::command]
pub async fn sync_presets(
    mods_path: String,
    app_handle: tauri::AppHandle,
) -> Result<Vec<Preset>, String> {
    preset_manager::sync_presets(&mods_path, &app_handle).await
}
