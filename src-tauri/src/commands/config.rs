use crate::core::config_manager;
use crate::models::AppConfig;

#[tauri::command]
pub async fn get_config(app_handle: tauri::AppHandle) -> Result<AppConfig, String> {
    config_manager::load_config(&app_handle).await
}

#[tauri::command]
pub async fn set_mods_path(
    path: String,
    app_handle: tauri::AppHandle,
) -> Result<bool, String> {
    config_manager::set_mods_path(&path, &app_handle).await
}
