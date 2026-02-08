use std::path::{Path, PathBuf};
use crate::models::{GameMod, game_mod::{ModMetadata, ModKeybinding}};

pub async fn get_mods_for_character(
    character_id: &str,
    mods_path: &str,
) -> Result<Vec<GameMod>, String> {
    let mut mods = Vec::new();

    // Base directory: <mods_path>/mod_manager/<character_id>/
    let base_path = Path::new(mods_path)
        .join("mod_manager")
        .join(character_id);

    // Create the directory if it doesn't exist
    tokio::fs::create_dir_all(&base_path)
        .await
        .map_err(|e| format!("모드 폴더 생성 실패: {}", e))?;

    let entries = tokio::fs::read_dir(&base_path)
        .await
        .map_err(|e| format!("모드 폴더를 읽을 수 없습니다: {}", e))?;

    let mut entries = entries;
    while let Ok(Some(entry)) = entries.next_entry().await {
        if entry.path().is_dir() {
            let folder_name = entry
                .file_name()
                .to_string_lossy()
                .to_string();

            // Check if folder starts with DISABLED_
            let (enabled, mod_id) = if folder_name.starts_with("DISABLED_") {
                (false, folder_name.strip_prefix("DISABLED_").unwrap().to_string())
            } else {
                (true, folder_name)
            };

            if let Ok(game_mod) = read_mod_from_dir(&entry.path(), character_id, enabled, &mod_id).await {
                mods.push(game_mod);
            }
        }
    }

    Ok(mods)
}

async fn find_preview_images(dir: &Path) -> Option<Vec<String>> {
    let mut entries = match tokio::fs::read_dir(dir).await {
        Ok(e) => e,
        Err(_) => return None,
    };

    let mut images = Vec::new();
    let image_extensions = ["png", "jpg", "jpeg"];

    while let Ok(Some(entry)) = entries.next_entry().await {
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension() {
                let ext_str = ext.to_string_lossy().to_lowercase();
                if image_extensions.contains(&ext_str.as_str()) {
                    if let Some(absolute_path) = path.to_str() {
                        images.push(absolute_path.to_string());
                    }
                }
            }
        }
    }

    if images.is_empty() {
        return None;
    }

    // Sort: "preview" images first, then the rest
    images.sort_by(|a, b| {
        let a_has_preview = a.to_lowercase().contains("preview");
        let b_has_preview = b.to_lowercase().contains("preview");

        match (a_has_preview, b_has_preview) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.cmp(b),
        }
    });

    Some(images)
}

async fn parse_keybindings_from_dir(dir: &Path) -> Option<Vec<ModKeybinding>> {
    let mut keybindings = Vec::new();
    collect_ini_keybindings(dir, &mut keybindings).await;

    if keybindings.is_empty() {
        None
    } else {
        Some(keybindings)
    }
}

async fn collect_ini_keybindings(dir: &Path, keybindings: &mut Vec<ModKeybinding>) {
    let mut entries = match tokio::fs::read_dir(dir).await {
        Ok(e) => e,
        Err(_) => return,
    };

    while let Ok(Some(entry)) = entries.next_entry().await {
        let path = entry.path();
        if path.is_dir() {
            Box::pin(collect_ini_keybindings(&path, keybindings)).await;
        } else if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext.to_string_lossy().to_lowercase() == "ini" {
                    if let Ok(content) = tokio::fs::read_to_string(&path).await {
                        keybindings.extend(parse_ini_keybindings(&content));
                    }
                }
            }
        }
    }
}

fn parse_ini_keybindings(content: &str) -> Vec<ModKeybinding> {
    let mut keybindings = Vec::new();
    let mut current_section: Option<String> = None;
    let mut is_key_section = false;

    for line in content.lines() {
        let trimmed = line.trim();

        // Check for section header
        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            let section_name = &trimmed[1..trimmed.len() - 1];

            // Check if this is a Key section (case-insensitive)
            if section_name.to_lowercase().starts_with("key") {
                // Extract action name (remove "Key" prefix)
                let action = if section_name.len() > 3 {
                    section_name[3..].to_string()
                } else {
                    section_name.to_string()
                };
                current_section = Some(action);
                is_key_section = true;
            } else {
                current_section = None;
                is_key_section = false;
            }
            continue;
        }

        // Parse key= line if we're in a Key section
        if is_key_section {
            if let Some(action) = &current_section {
                let lower = trimmed.to_lowercase();
                if lower.starts_with("key=") || lower.starts_with("key =") {
                    // Extract key value
                    if let Some(equals_pos) = trimmed.find('=') {
                        let key_value = trimmed[equals_pos + 1..].trim();
                        if !key_value.is_empty() {
                            let normalized_key = normalize_key(key_value);
                            keybindings.push(ModKeybinding {
                                action: action.clone(),
                                key: normalized_key,
                            });
                        }
                    }
                }
            }
        }
    }

    keybindings
}

fn normalize_key(key: &str) -> String {
    let trimmed = key.trim();

    // Remove VK_ prefix if present
    let without_prefix = if trimmed.to_uppercase().starts_with("VK_") {
        &trimmed[3..]
    } else {
        trimmed
    };

    // Capitalize first letter for consistency
    if without_prefix.is_empty() {
        return trimmed.to_string();
    }

    let mut chars = without_prefix.chars();
    match chars.next() {
        None => String::new(),
        Some(first) => {
            let rest: String = chars.collect();
            format!("{}{}", first.to_uppercase(), rest.to_uppercase())
        }
    }
}

async fn read_mod_from_dir(
    dir: &Path,
    character_id: &str,
    enabled: bool,
    mod_id: &str,
) -> Result<GameMod, String> {
    let mod_json_path = dir.join("mod.json");
    let preview_images = find_preview_images(dir).await;
    let keybindings = parse_keybindings_from_dir(dir).await;

    if mod_json_path.exists() {
        let content = tokio::fs::read_to_string(&mod_json_path)
            .await
            .map_err(|e| format!("mod.json 읽기 실패: {}", e))?;

        let metadata: ModMetadata = serde_json::from_str(&content)
            .map_err(|e| format!("mod.json 파싱 실패: {}", e))?;

        Ok(GameMod {
            id: mod_id.to_string(),
            character_id: metadata.character_id,
            name: metadata.name,
            description: metadata.description,
            author: metadata.author,
            version: metadata.version,
            tags: metadata.tags,
            preview: preview_images,
            enabled,
            path: dir.to_string_lossy().to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
            keybindings,
        })
    } else {
        Ok(GameMod {
            id: mod_id.to_string(),
            character_id: character_id.to_string(),
            name: mod_id.to_string(),
            description: None,
            author: None,
            version: None,
            tags: None,
            preview: preview_images,
            enabled,
            path: dir.to_string_lossy().to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
            keybindings,
        })
    }
}

pub async fn enable_mod(
    mod_id: &str,
    character_id: &str,
    mods_path: &str,
) -> Result<bool, String> {
    let base = Path::new(mods_path)
        .join("mod_manager")
        .join(character_id);

    let source = base.join(format!("DISABLED_{}", mod_id));
    let dest = base.join(mod_id);

    if !source.exists() {
        return Err(format!("비활성 모드를 찾을 수 없습니다: {}", mod_id));
    }

    if dest.exists() {
        return Err(format!("이미 활성화된 모드입니다: {}", mod_id));
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
    let base = Path::new(mods_path)
        .join("mod_manager")
        .join(character_id);

    let source = base.join(mod_id);
    let dest = base.join(format!("DISABLED_{}", mod_id));

    if !source.exists() {
        return Err(format!("활성 모드를 찾을 수 없습니다: {}", mod_id));
    }

    if dest.exists() {
        return Err(format!("이미 비활성화된 모드입니다: {}", mod_id));
    }

    tokio::fs::rename(&source, &dest)
        .await
        .map_err(|e| format!("모드 비활성화 실패: {}", e))?;

    Ok(true)
}

pub async fn import_mod(
    source_path: &str,
    character_id: &str,
    mods_path: &str,
) -> Result<GameMod, String> {
    let source = Path::new(source_path);

    if !source.exists() {
        return Err(format!("파일을 찾을 수 없습니다: {}", source_path));
    }

    // Determine the mod content directory
    let mod_content_dir: PathBuf;
    let _temp_dir: Option<PathBuf>;

    if source.is_file() && source_path.to_lowercase().ends_with(".zip") {
        // Extract ZIP to temp directory
        let temp_path = std::env::temp_dir().join(format!("wwua_import_{}", uuid::Uuid::new_v4()));
        tokio::fs::create_dir_all(&temp_path)
            .await
            .map_err(|e| format!("임시 폴더 생성 실패: {}", e))?;

        // ZIP extraction (synchronous, run in blocking task)
        let zip_path = source.to_path_buf();
        let extract_path = temp_path.clone();
        tokio::task::spawn_blocking(move || {
            let file = std::fs::File::open(&zip_path)
                .map_err(|e| format!("ZIP 파일 열기 실패: {}", e))?;
            let mut archive = zip::ZipArchive::new(file)
                .map_err(|e| format!("ZIP 파일 읽기 실패: {}", e))?;
            archive.extract(&extract_path)
                .map_err(|e| format!("ZIP 압축 해제 실패: {}", e))?;
            Ok::<(), String>(())
        })
        .await
        .map_err(|e| format!("ZIP 처리 중 오류: {}", e))?
        .map_err(|e: String| e)?;

        // Check if ZIP contains a single root folder
        let mut entries = tokio::fs::read_dir(&temp_path)
            .await
            .map_err(|e| format!("임시 폴더 읽기 실패: {}", e))?;

        let mut children: Vec<PathBuf> = Vec::new();
        while let Ok(Some(entry)) = entries.next_entry().await {
            children.push(entry.path());
        }

        if children.len() == 1 && children[0].is_dir() {
            mod_content_dir = children[0].clone();
        } else {
            mod_content_dir = temp_path.clone();
        }
        _temp_dir = Some(temp_path);
    } else if source.is_dir() {
        mod_content_dir = source.to_path_buf();
        _temp_dir = None;
    } else {
        return Err("지원하지 않는 파일 형식입니다. ZIP 파일 또는 폴더를 선택하세요.".to_string());
    }

    // Determine mod name from folder
    let mod_name = mod_content_dir
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown_mod".to_string());

    // Read or create mod metadata
    let mod_json_path = mod_content_dir.join("mod.json");
    let mod_id = if mod_json_path.exists() {
        let content = tokio::fs::read_to_string(&mod_json_path)
            .await
            .map_err(|e| format!("mod.json 읽기 실패: {}", e))?;
        let metadata: ModMetadata = serde_json::from_str(&content)
            .map_err(|e| format!("mod.json 파싱 실패: {}", e))?;
        metadata.id
    } else {
        mod_name.clone()
    };

    // Base directory: <mods_path>/mod_manager/<character_id>/
    let base = Path::new(mods_path)
        .join("mod_manager")
        .join(character_id);

    // Create base directory if it doesn't exist
    tokio::fs::create_dir_all(&base)
        .await
        .map_err(|e| format!("폴더 생성 실패: {}", e))?;

    // Copy to destination as DISABLED: <base>/DISABLED_<mod_id>/
    let dest = base.join(format!("DISABLED_{}", mod_id));
    if dest.exists() {
        return Err(format!("이미 동일한 이름의 모드가 존재합니다: {}", mod_id));
    }

    // Also check if enabled version exists
    let enabled_dest = base.join(&mod_id);
    if enabled_dest.exists() {
        return Err(format!("이미 동일한 이름의 모드가 존재합니다: {}", mod_id));
    }

    // Recursive copy
    copy_dir_recursive(&mod_content_dir, &dest).await?;

    // Write mod.json if it doesn't exist
    let dest_mod_json = dest.join("mod.json");
    if !dest_mod_json.exists() {
        let metadata = ModMetadata {
            id: mod_id.clone(),
            name: mod_name.clone(),
            character_id: character_id.to_string(),
            description: None,
            author: None,
            version: None,
            tags: None,
            preview: None,
        };
        let json = serde_json::to_string_pretty(&metadata)
            .map_err(|e| format!("mod.json 생성 실패: {}", e))?;
        tokio::fs::write(&dest_mod_json, json)
            .await
            .map_err(|e| format!("mod.json 쓰기 실패: {}", e))?;
    }

    // Clean up temp directory
    if let Some(temp) = _temp_dir {
        let _ = tokio::fs::remove_dir_all(&temp).await;
    }

    // Return the imported mod (enabled=false)
    read_mod_from_dir(&dest, character_id, false, &mod_id).await
}

pub async fn delete_mod(
    mod_id: &str,
    character_id: &str,
    mods_path: &str,
) -> Result<bool, String> {
    let base = Path::new(mods_path)
        .join("mod_manager")
        .join(character_id);

    // Check enabled path first
    let enabled_path = base.join(mod_id);
    if enabled_path.exists() {
        tokio::fs::remove_dir_all(&enabled_path)
            .await
            .map_err(|e| format!("모드 삭제 실패: {}", e))?;
        return Ok(true);
    }

    // Check disabled path
    let disabled_path = base.join(format!("DISABLED_{}", mod_id));
    if disabled_path.exists() {
        tokio::fs::remove_dir_all(&disabled_path)
            .await
            .map_err(|e| format!("모드 삭제 실패: {}", e))?;
        return Ok(true);
    }

    Err(format!("모드를 찾을 수 없습니다: {}", mod_id))
}

pub async fn get_mod_counts(
    mods_path: &str,
) -> Result<std::collections::HashMap<String, (u32, u32)>, String> {
    let mut counts = std::collections::HashMap::new();
    let base_path = Path::new(mods_path).join("mod_manager");

    if !base_path.exists() {
        return Ok(counts);
    }

    let mut entries = tokio::fs::read_dir(&base_path)
        .await
        .map_err(|e| format!("mod_manager 폴더 읽기 실패: {}", e))?;

    while let Ok(Some(entry)) = entries.next_entry().await {
        if entry.path().is_dir() {
            let character_id = entry.file_name().to_string_lossy().to_string();
            let mut enabled: u32 = 0;
            let mut total: u32 = 0;

            let mut sub_entries = match tokio::fs::read_dir(entry.path()).await {
                Ok(e) => e,
                Err(_) => continue,
            };

            while let Ok(Some(sub_entry)) = sub_entries.next_entry().await {
                if sub_entry.path().is_dir() {
                    total += 1;
                    let name = sub_entry.file_name().to_string_lossy().to_string();
                    if !name.starts_with("DISABLED_") {
                        enabled += 1;
                    }
                }
            }

            counts.insert(character_id, (enabled, total));
        }
    }

    Ok(counts)
}

async fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    tokio::fs::create_dir_all(dst)
        .await
        .map_err(|e| format!("폴더 생성 실패: {}", e))?;

    let mut entries = tokio::fs::read_dir(src)
        .await
        .map_err(|e| format!("폴더 읽기 실패: {}", e))?;

    while let Ok(Some(entry)) = entries.next_entry().await {
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            Box::pin(copy_dir_recursive(&src_path, &dst_path)).await?;
        } else {
            tokio::fs::copy(&src_path, &dst_path)
                .await
                .map_err(|e| format!("파일 복사 실패: {}", e))?;
        }
    }

    Ok(())
}
