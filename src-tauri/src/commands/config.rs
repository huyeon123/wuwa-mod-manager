use crate::core::config_manager;
use crate::models::AppConfig;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

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

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &launcher_path, "--nogui", "--xxmi", "WWMI"])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .spawn()
            .map_err(|e| format!("런처 실행 실패: {}", e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new(&launcher_path)
            .args(["--nogui", "--xxmi", "WWMI"])
            .spawn()
            .map_err(|e| format!("런처 실행 실패: {}", e))?;
    }

    Ok(true)
}

#[tauri::command]
pub async fn auto_detect_paths(app_handle: tauri::AppHandle) -> Result<(Option<String>, Option<String>), String> {
    let (mods_path, xxmi_launcher_path) = config_manager::auto_detect_paths().await?;

    // Save detected paths to config
    let mut config = config_manager::load_config(&app_handle).await?;
    let mut changed = false;

    if let Some(ref path) = mods_path {
        config.mods_path = Some(path.clone());
        changed = true;
    }
    if let Some(ref path) = xxmi_launcher_path {
        config.xxmi_launcher_path = Some(path.clone());
        changed = true;
    }
    if changed {
        config_manager::save_config(&config, &app_handle).await?;
    }

    Ok((mods_path, xxmi_launcher_path))
}
