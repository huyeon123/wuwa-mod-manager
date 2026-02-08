use std::path::Path;
use crate::models::{GameMod, game_mod::ModMetadata};

pub async fn get_mods_for_character(
    character_id: &str,
    mods_path: &str,
) -> Result<Vec<GameMod>, String> {
    let mut mods = Vec::new();

    // Enabled mods: Mods/<character>/
    let enabled_path = Path::new(mods_path).join(character_id);
    if enabled_path.exists() {
        let entries = tokio::fs::read_dir(&enabled_path)
            .await
            .map_err(|e| format!("모드 폴더를 읽을 수 없습니다: {}", e))?;

        let mut entries = entries;
        while let Ok(Some(entry)) = entries.next_entry().await {
            if entry.path().is_dir() {
                if let Ok(game_mod) = read_mod_from_dir(&entry.path(), character_id, true).await {
                    mods.push(game_mod);
                }
            }
        }
    }

    // Disabled mods: Mods/_disabled/<character>/
    let disabled_path = Path::new(mods_path).join("_disabled").join(character_id);
    if disabled_path.exists() {
        let entries = tokio::fs::read_dir(&disabled_path)
            .await
            .map_err(|e| format!("비활성 모드 폴더를 읽을 수 없습니다: {}", e))?;

        let mut entries = entries;
        while let Ok(Some(entry)) = entries.next_entry().await {
            if entry.path().is_dir() {
                if let Ok(game_mod) = read_mod_from_dir(&entry.path(), character_id, false).await {
                    mods.push(game_mod);
                }
            }
        }
    }

    Ok(mods)
}

async fn read_mod_from_dir(
    dir: &Path,
    character_id: &str,
    enabled: bool,
) -> Result<GameMod, String> {
    let mod_json_path = dir.join("mod.json");

    if mod_json_path.exists() {
        let content = tokio::fs::read_to_string(&mod_json_path)
            .await
            .map_err(|e| format!("mod.json 읽기 실패: {}", e))?;

        let metadata: ModMetadata = serde_json::from_str(&content)
            .map_err(|e| format!("mod.json 파싱 실패: {}", e))?;

        Ok(GameMod {
            id: metadata.id,
            character_id: metadata.character_id,
            name: metadata.name,
            description: metadata.description,
            author: metadata.author,
            version: metadata.version,
            tags: metadata.tags,
            preview: metadata.preview,
            enabled,
            path: dir.to_string_lossy().to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
        })
    } else {
        let folder_name = dir
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "unknown".to_string());

        Ok(GameMod {
            id: folder_name.clone(),
            character_id: character_id.to_string(),
            name: folder_name,
            description: None,
            author: None,
            version: None,
            tags: None,
            preview: None,
            enabled,
            path: dir.to_string_lossy().to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
        })
    }
}

pub async fn enable_mod(
    mod_id: &str,
    character_id: &str,
    mods_path: &str,
) -> Result<bool, String> {
    let source = Path::new(mods_path)
        .join("_disabled")
        .join(character_id)
        .join(mod_id);

    let dest = Path::new(mods_path).join(character_id).join(mod_id);

    if !source.exists() {
        return Err(format!("비활성 모드를 찾을 수 없습니다: {}", mod_id));
    }

    if dest.exists() {
        return Err(format!("이미 활성화된 모드입니다: {}", mod_id));
    }

    // Ensure destination parent exists
    if let Some(parent) = dest.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("폴더 생성 실패: {}", e))?;
    }

    tokio::fs::rename(&source, &dest)
        .await
        .map_err(|e| format!("모드 활성화 실패: {}", e))?;

    Ok(true)
}

pub async fn disable_mod(
    mod_id: &str,
    character_id: &str,
    mods_path: &str,
) -> Result<bool, String> {
    let source = Path::new(mods_path).join(character_id).join(mod_id);

    let dest = Path::new(mods_path)
        .join("_disabled")
        .join(character_id)
        .join(mod_id);

    if !source.exists() {
        return Err(format!("활성 모드를 찾을 수 없습니다: {}", mod_id));
    }

    if dest.exists() {
        return Err(format!("이미 비활성화된 모드입니다: {}", mod_id));
    }

    // Ensure destination parent exists
    if let Some(parent) = dest.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("폴더 생성 실패: {}", e))?;
    }

    tokio::fs::rename(&source, &dest)
        .await
        .map_err(|e| format!("모드 비활성화 실패: {}", e))?;

    Ok(true)
}
