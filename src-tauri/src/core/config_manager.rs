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
    let mut xxmi_launcher_path: Option<String> = None;

    // Common XXMI Launcher locations
    let home = std::env::var("USERPROFILE").unwrap_or_default();
    let common_paths = vec![
        format!("{}\\Desktop\\XXMI Launcher.exe", home),
        format!("{}\\Desktop\\3DMigoto\\XXMI Launcher.exe", home),
        format!("{}\\3DMigoto\\XXMI Launcher.exe", home),
        "C:\\3DMigoto\\XXMI Launcher.exe".to_string(),
        "D:\\3DMigoto\\XXMI Launcher.exe".to_string(),
        format!("{}\\Downloads\\XXMI Launcher.exe", home),
        format!("{}\\Desktop\\WWMI\\XXMI Launcher.exe", home),
        format!("{}\\3DMigoto\\WWMI\\XXMI Launcher.exe", home),
    ];

    for p in &common_paths {
        if std::path::Path::new(p).exists() {
            xxmi_launcher_path = Some(p.clone());
            break;
        }
    }

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
        let mods_paths = vec![
            format!("{}\\Desktop\\3DMigoto\\Mods", home),
            format!("{}\\3DMigoto\\Mods", home),
            "C:\\3DMigoto\\Mods".to_string(),
            "D:\\3DMigoto\\Mods".to_string(),
            format!("{}\\Desktop\\WWMI\\Mods", home),
            format!("{}\\3DMigoto\\WWMI\\Mods", home),
        ];

        for p in &mods_paths {
            if std::path::Path::new(p).exists() {
                mods_path = Some(p.clone());
                break;
            }
        }
    }

    Ok((mods_path, xxmi_launcher_path))
}
