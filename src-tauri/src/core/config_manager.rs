use std::path::{Path, PathBuf};
use tauri::Manager;
use crate::models::AppConfig;

fn config_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("앱 설정 경로를 가져올 수 없습니다: {}", e))?;

    Ok(app_dir.join("config.json"))
}

fn first_existing_path(candidates: &[String]) -> Option<String> {
    candidates
        .iter()
        .find(|path| Path::new(path.as_str()).exists())
        .cloned()
}

fn toggle_string_entry(entries: &mut Vec<String>, value: String) {
    if let Some(pos) = entries.iter().position(|item| item == &value) {
        entries.remove(pos);
    } else {
        entries.push(value);
    }
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

pub async fn set_xxmi_launcher_path(
    path: &str,
    app_handle: &tauri::AppHandle,
) -> Result<bool, String> {
    let launcher_path = std::path::Path::new(path);
    if !launcher_path.exists() {
        return Err(format!("경로가 존재하지 않습니다: {}", path));
    }

    let mut config = load_config(app_handle).await?;
    config.xxmi_launcher_path = Some(path.to_string());
    save_config(&config, app_handle).await?;

    Ok(true)
}

pub async fn auto_detect_paths() -> Result<(Option<String>, Option<String>), String> {
    let mut mods_path: Option<String> = None;

    let home = dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    let mut launcher_candidates: Vec<String> = Vec::new();
    let mut mods_candidates: Vec<String> = Vec::new();

    #[cfg(target_os = "windows")]
    {
        let appdata = std::env::var("APPDATA").unwrap_or_default();
        let sep = "\\";
        launcher_candidates.extend([
            format!("{}{sep}XXMI Launcher{sep}Resources{sep}Bin{sep}XXMI Launcher.exe", appdata),
            format!("{}{sep}XXMI Launcher{sep}XXMI Launcher.exe", appdata),
            format!("{}{sep}Desktop{sep}XXMI Launcher.exe", home),
            format!("{}{sep}Desktop{sep}3DMigoto{sep}XXMI Launcher.exe", home),
            format!("{}{sep}3DMigoto{sep}XXMI Launcher.exe", home),
            "C:\\3DMigoto\\XXMI Launcher.exe".to_string(),
            "D:\\3DMigoto\\XXMI Launcher.exe".to_string(),
            format!("{}{sep}Downloads{sep}XXMI Launcher.exe", home),
            format!("{}{sep}Desktop{sep}WWMI{sep}XXMI Launcher.exe", home),
            format!("{}{sep}3DMigoto{sep}WWMI{sep}XXMI Launcher.exe", home),
        ]);
        mods_candidates.extend([
            format!("{}{sep}XXMI Launcher{sep}WWMI{sep}Mods", appdata),
            format!("{}{sep}Desktop{sep}3DMigoto{sep}Mods", home),
            format!("{}{sep}3DMigoto{sep}Mods", home),
            "C:\\3DMigoto\\Mods".to_string(),
            "D:\\3DMigoto\\Mods".to_string(),
            format!("{}{sep}Desktop{sep}WWMI{sep}Mods", home),
            format!("{}{sep}3DMigoto{sep}WWMI{sep}Mods", home),
        ]);
    }

    #[cfg(target_os = "macos")]
    {
        let app_support = dirs::data_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();
        let sep = "/";
        launcher_candidates.extend([
            format!("{}{sep}XXMI Launcher{sep}Resources{sep}Bin{sep}XXMI Launcher", app_support),
            format!("{}{sep}XXMI Launcher{sep}XXMI Launcher", app_support),
            format!("{}{sep}Applications{sep}XXMI Launcher.app", home),
            format!("{}{sep}Desktop{sep}XXMI Launcher", home),
            format!("{}{sep}Desktop{sep}3DMigoto{sep}XXMI Launcher", home),
            format!("{}{sep}3DMigoto{sep}XXMI Launcher", home),
            format!("{}{sep}Downloads{sep}XXMI Launcher", home),
        ]);
        mods_candidates.extend([
            format!("{}{sep}XXMI Launcher{sep}WWMI{sep}Mods", app_support),
            format!("{}{sep}Desktop{sep}3DMigoto{sep}Mods", home),
            format!("{}{sep}3DMigoto{sep}Mods", home),
            format!("{}{sep}Desktop{sep}WWMI{sep}Mods", home),
        ]);
    }

    #[cfg(target_os = "linux")]
    {
        let sep = "/";
        launcher_candidates.extend([
            format!("{}{sep}.local{sep}share{sep}XXMI Launcher{sep}XXMI Launcher", home),
            format!("{}{sep}Desktop{sep}XXMI Launcher", home),
            format!("{}{sep}3DMigoto{sep}XXMI Launcher", home),
        ]);
        mods_candidates.extend([
            format!("{}{sep}.local{sep}share{sep}XXMI Launcher{sep}WWMI{sep}Mods", home),
            format!("{}{sep}Desktop{sep}3DMigoto{sep}Mods", home),
            format!("{}{sep}3DMigoto{sep}Mods", home),
        ]);
    }

    let xxmi_launcher_path = first_existing_path(&launcher_candidates);

    // Try to find Mods folder relative to launcher location
    if let Some(ref launcher) = xxmi_launcher_path {
        let launcher_dir = std::path::Path::new(launcher).parent();
        if let Some(dir) = launcher_dir {
            let mods_dir = dir.join("Mods");
            if mods_dir.exists() {
                mods_path = Some(mods_dir.to_string_lossy().to_string());
            }
        }
    }

    // Also check common Mods folder locations independently
    if mods_path.is_none() {
        mods_path = first_existing_path(&mods_candidates);
    }

    Ok((mods_path, xxmi_launcher_path))
}

pub async fn toggle_favorite_character(
    character_id: &str,
    app_handle: &tauri::AppHandle,
) -> Result<AppConfig, String> {
    let mut config = load_config(app_handle).await?;

    toggle_string_entry(&mut config.favorite_characters, character_id.to_string());

    save_config(&config, app_handle).await?;
    Ok(config)
}

pub async fn toggle_favorite_mod(
    character_id: &str,
    mod_id: &str,
    app_handle: &tauri::AppHandle,
) -> Result<AppConfig, String> {
    let mut config = load_config(app_handle).await?;
    let key = format!("{}/{}", character_id, mod_id);

    toggle_string_entry(&mut config.favorite_mods, key);

    save_config(&config, app_handle).await?;
    Ok(config)
}

pub async fn set_auto_launch_game(
    enabled: bool,
    app_handle: &tauri::AppHandle,
) -> Result<AppConfig, String> {
    let mut config = load_config(app_handle).await?;
    config.auto_launch_game = enabled;
    save_config(&config, app_handle).await?;
    Ok(config)
}
