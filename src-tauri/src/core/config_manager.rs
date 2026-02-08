use std::path::PathBuf;
use tauri::Manager;
use crate::models::AppConfig;

fn config_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("앱 설정 경로를 가져올 수 없습니다: {}", e))?;

    Ok(app_dir.join("config.json"))
}

pub async fn load_config(app_handle: &tauri::AppHandle) -> Result<AppConfig, String> {
    let path = config_path(app_handle)?;

    if !path.exists() {
        return Ok(AppConfig::default());
    }

    let content = tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("설정 파일 읽기 실패: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("설정 파일 파싱 실패: {}", e))
}

pub async fn save_config(
    config: &AppConfig,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    let path = config_path(app_handle)?;

    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("설정 폴더 생성 실패: {}", e))?;
    }

    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("설정 직렬화 실패: {}", e))?;

    tokio::fs::write(&path, content)
        .await
        .map_err(|e| format!("설정 파일 저장 실패: {}", e))?;

    Ok(())
}

pub async fn set_mods_path(
    path: &str,
    app_handle: &tauri::AppHandle,
) -> Result<bool, String> {
    let mods_dir = std::path::Path::new(path);
    if !mods_dir.exists() {
        return Err(format!("경로가 존재하지 않습니다: {}", path));
    }

    let mut config = load_config(app_handle).await?;
    config.mods_path = Some(path.to_string());
    save_config(&config, app_handle).await?;

    Ok(true)
}
