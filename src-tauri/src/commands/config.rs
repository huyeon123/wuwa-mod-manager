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

#[tauri::command]
pub async fn set_xxmi_launcher_path(
    path: String,
    app_handle: tauri::AppHandle,
) -> Result<bool, String> {
    config_manager::set_xxmi_launcher_path(&path, &app_handle).await
}

#[tauri::command]
pub async fn launch_xxmi(app_handle: tauri::AppHandle) -> Result<bool, String> {
    let config = config_manager::load_config(&app_handle).await?;
    let launcher_path = config.xxmi_launcher_path
        .ok_or("XXMI Launcher 경로가 설정되지 않았습니다".to_string())?;

    let path = std::path::Path::new(&launcher_path);
    if !path.exists() {
        return Err(format!("런처를 찾을 수 없습니다: {}", launcher_path));
    }

    std::process::Command::new(&launcher_path)
        .spawn()
        .map_err(|e| format!("런처 실행 실패: {}", e))?;

    Ok(true)
}

#[tauri::command]
pub async fn auto_detect_paths() -> Result<(Option<String>, Option<String>), String> {
    config_manager::auto_detect_paths().await
}
