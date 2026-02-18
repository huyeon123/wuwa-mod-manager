use std::path::{Path, PathBuf};
use crate::models::{GameMod, game_mod::{ModMetadata, ImportPreviewData}};
use crate::core::mod_content_analyzer::{find_preview_images, parse_keybindings_from_dir};

const MOD_MANAGER_DIR: &str = "mod_manager";
const DISABLED_PREFIX: &str = "DISABLED_";

fn character_base_path(mods_path: &str, character_id: &str) -> PathBuf {
    Path::new(mods_path)
        .join(MOD_MANAGER_DIR)
        .join(character_id)
}

fn enabled_mod_path(base: &Path, mod_id: &str) -> PathBuf {
    base.join(mod_id)
}

fn disabled_mod_name(mod_id: &str) -> String {
    format!("{DISABLED_PREFIX}{mod_id}")
}

fn disabled_mod_path(base: &Path, mod_id: &str) -> PathBuf {
    base.join(disabled_mod_name(mod_id))
}

fn split_mod_folder_name(folder_name: &str) -> (bool, String) {
    if let Some(mod_id) = folder_name.strip_prefix(DISABLED_PREFIX) {
        (false, mod_id.to_string())
    } else {
        (true, folder_name.to_string())
    }
}

fn ensure_mod_slot_available(base: &Path, mod_id: &str) -> Result<(), String> {
    if enabled_mod_path(base, mod_id).exists() || disabled_mod_path(base, mod_id).exists() {
        return Err(format!("이미 동일한 이름의 모드가 존재합니다: {}", mod_id));
    }
    Ok(())
}

async fn prepare_import_destination(
    mods_path: &str,
    character_id: &str,
    mod_id: &str,
) -> Result<PathBuf, String> {
    let base = character_base_path(mods_path, character_id);
    tokio::fs::create_dir_all(&base)
        .await
        .map_err(|e| format!("폴더 생성 실패: {}", e))?;

    ensure_mod_slot_available(&base, mod_id)?;

    let dest = disabled_mod_path(&base, mod_id);
    tokio::fs::create_dir_all(&dest)
        .await
        .map_err(|e| format!("대상 폴더 생성 실패: {}", e))?;

    Ok(dest)
}

async fn write_default_mod_json(
    dest_dir: &Path,
    mod_id: &str,
    mod_name: &str,
    character_id: &str,
) -> Result<(), String> {
    let dest_mod_json = dest_dir.join("mod.json");
    let metadata = ModMetadata {
        id: mod_id.to_string(),
        name: mod_name.to_string(),
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

    Ok(())
}

pub async fn get_mods_for_character(
    character_id: &str,
    mods_path: &str,
) -> Result<Vec<GameMod>, String> {
    let mut mods = Vec::new();

    // Base directory: <mods_path>/mod_manager/<character_id>/
    let base_path = character_base_path(mods_path, character_id);

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

            let (enabled, mod_id) = split_mod_folder_name(&folder_name);

            if let Ok(game_mod) = read_mod_from_dir(&entry.path(), character_id, enabled, &mod_id).await {
                mods.push(game_mod);
            }
        }
    }

    Ok(mods)
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
    let base = character_base_path(mods_path, character_id);

    let source = disabled_mod_path(&base, mod_id);
    let dest = enabled_mod_path(&base, mod_id);

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
    let base = character_base_path(mods_path, character_id);

    let source = enabled_mod_path(&base, mod_id);
    let dest = disabled_mod_path(&base, mod_id);

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
    custom_name: Option<&str>,
) -> Result<GameMod, String> {
    let source = Path::new(source_path);

    if !source.exists() {
        return Err(format!("파일을 찾을 수 없습니다: {}", source_path));
    }

    if source.is_file() && source_path.to_lowercase().ends_with(".zip") {
        // === ZIP direct extraction (single I/O pass) ===

        // Phase 1: Scan ZIP in memory to detect root_prefix and read mod.json
        let zip_path = source.to_path_buf();
        let (root_prefix, mod_json_content) = tokio::task::spawn_blocking(move || {
            let file = std::fs::File::open(&zip_path)
                .map_err(|e| format!("ZIP 파일 열기 실패: {}", e))?;
            let mut archive = zip::ZipArchive::new(file)
                .map_err(|e| format!("ZIP 파일 읽기 실패: {}", e))?;

            // Detect if all entries share a single root folder
            let mut first_components: std::collections::HashSet<String> = std::collections::HashSet::new();
            for i in 0..archive.len() {
                let entry = archive.by_index(i)
                    .map_err(|e| format!("ZIP 엔트리 읽기 실패: {}", e))?;
                let name = entry.name().to_string();
                if let Some(first) = name.split('/').next() {
                    if !first.is_empty() {
                        first_components.insert(first.to_string());
                    }
                }
            }

            let detected_prefix = if first_components.len() == 1 {
                let single_root = first_components.into_iter().next()
                    .ok_or_else(|| "ZIP 루트 감지 실패".to_string())?;
                // Verify it's actually a directory (has entries under it)
                let prefix_with_slash = format!("{}/", single_root);
                let has_children = (0..archive.len()).any(|i| {
                    archive.by_index(i)
                        .map(|e| {
                            let n = e.name().to_string();
                            n.starts_with(&prefix_with_slash) && n.len() > prefix_with_slash.len()
                        })
                        .unwrap_or(false)
                });
                if has_children {
                    Some(prefix_with_slash)
                } else {
                    None
                }
            } else {
                None
            };

            // Find and read mod.json content in memory
            let mod_json_path = if let Some(ref prefix) = detected_prefix {
                format!("{}mod.json", prefix)
            } else {
                "mod.json".to_string()
            };

            let mut mod_json_str: Option<String> = None;
            for i in 0..archive.len() {
                let mut entry = archive.by_index(i)
                    .map_err(|e| format!("ZIP 엔트리 읽기 실패: {}", e))?;
                if entry.name() == mod_json_path {
                    let mut content = String::new();
                    std::io::Read::read_to_string(&mut entry, &mut content)
                        .map_err(|e| format!("mod.json 읽기 실패: {}", e))?;
                    mod_json_str = Some(content);
                    break;
                }
            }

            Ok::<(Option<String>, Option<String>), String>((detected_prefix, mod_json_str))
        })
        .await
        .map_err(|e| format!("ZIP 처리 중 오류: {}", e))?
        .map_err(|e: String| e)?;

        // Phase 2: Determine mod_id and create target directory
        let zip_stem = source.file_stem()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "unknown_mod".to_string());

        let mod_name = if let Some(name) = custom_name {
            name.to_string()
        } else if let Some(ref prefix) = root_prefix {
            // Use root folder name (strip trailing slash)
            prefix.trim_end_matches('/').to_string()
        } else {
            zip_stem
        };

        let (mod_id, has_mod_json) = if let Some(ref json_content) = mod_json_content {
            let metadata: ModMetadata = serde_json::from_str(json_content)
                .map_err(|e| format!("mod.json 파싱 실패: {}", e))?;
            (metadata.id, true)
        } else {
            (mod_name.clone(), false)
        };

        let dest = prepare_import_destination(mods_path, character_id, &mod_id).await?;

        // Phase 3: Extract using native tar.exe for maximum speed
        // Windows System32 tar.exe is bsdtar (libarchive) which supports ZIP natively
        let zip_path_str = source.to_string_lossy().to_string();
        let dest_str = dest.to_string_lossy().to_string();
        let strip = root_prefix.is_some();
        let tar_result = tokio::task::spawn_blocking(move || {
            // Use Windows native bsdtar for fast ZIP extraction
            let tar_exe = r"C:\Windows\System32\tar.exe";
            let mut cmd = std::process::Command::new(tar_exe);
            cmd.arg("-xf").arg(&zip_path_str).arg("-C").arg(&dest_str);
            if strip {
                cmd.arg("--strip-components=1");
            }
            let output = cmd.output()
                .map_err(|e| format!("tar 실행 실패: {}", e))?;
            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("tar 추출 실패: {}", stderr));
            }
            Ok::<(), String>(())
        })
        .await
        .map_err(|e| format!("ZIP 추출 중 오류: {}", e))?;

        // Fallback to Rust zip crate if tar fails
        if let Err(_tar_err) = tar_result {
            // tar failed, use Rust zip crate as fallback
            let zip_path_for_extract = source.to_path_buf();
            let dest_for_extract = dest.clone();
            let prefix_for_extract = root_prefix.clone();
            tokio::task::spawn_blocking(move || {
                let file = std::fs::File::open(&zip_path_for_extract)
                    .map_err(|e| format!("ZIP 파일 열기 실패: {}", e))?;
                let mut archive = zip::ZipArchive::new(file)
                    .map_err(|e| format!("ZIP 파일 읽기 실패: {}", e))?;

                for i in 0..archive.len() {
                    let mut entry = archive.by_index(i)
                        .map_err(|e| format!("ZIP 엔트리 읽기 실패: {}", e))?;
                    let entry_path = entry.name().to_string();

                    let relative_path = if let Some(ref prefix) = prefix_for_extract {
                        if let Some(stripped) = entry_path.strip_prefix(prefix.as_str()) {
                            stripped.to_string()
                        } else {
                            continue;
                        }
                    } else {
                        entry_path.clone()
                    };

                    if relative_path.is_empty() {
                        continue;
                    }

                    let target = dest_for_extract.join(&relative_path);

                    if entry.is_dir() {
                        std::fs::create_dir_all(&target)
                            .map_err(|e| format!("폴더 생성 실패: {}", e))?;
                    } else {
                        if let Some(parent) = target.parent() {
                            std::fs::create_dir_all(parent)
                                .map_err(|e| format!("폴더 생성 실패: {}", e))?;
                        }
                        let mut outfile = std::fs::File::create(&target)
                            .map_err(|e| format!("파일 생성 실패: {}", e))?;
                        std::io::copy(&mut entry, &mut outfile)
                            .map_err(|e| format!("파일 쓰기 실패: {}", e))?;
                    }
                }

                Ok::<(), String>(())
            })
            .await
            .map_err(|e| format!("ZIP 추출 중 오류: {}", e))?
            .map_err(|e: String| e)?;
        }

        // Write mod.json if it wasn't in the ZIP
        if !has_mod_json {
            write_default_mod_json(&dest, &mod_id, &mod_name, character_id).await?;
        }

        // Return the imported mod (enabled=false)
        read_mod_from_dir(&dest, character_id, false, &mod_id).await
    } else if source.is_dir() {
        // === Folder import (unchanged) ===
        let mod_content_dir = source.to_path_buf();

        // Determine mod name from folder or custom_name
        let mod_name = if let Some(name) = custom_name {
            name.to_string()
        } else {
            mod_content_dir
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "unknown_mod".to_string())
        };

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

        let dest = prepare_import_destination(mods_path, character_id, &mod_id).await?;

        // Recursive copy
        copy_dir_recursive(&mod_content_dir, &dest).await?;

        // Write mod.json if it doesn't exist
        let dest_mod_json = dest.join("mod.json");
        if !dest_mod_json.exists() {
            write_default_mod_json(&dest, &mod_id, &mod_name, character_id).await?;
        }

        // Return the imported mod (enabled=false)
        read_mod_from_dir(&dest, character_id, false, &mod_id).await
    } else {
        Err("지원하지 않는 파일 형식입니다. ZIP 파일 또는 폴더를 선택하세요.".to_string())
    }
}

pub async fn delete_mod(
    mod_id: &str,
    character_id: &str,
    mods_path: &str,
) -> Result<bool, String> {
    let base = character_base_path(mods_path, character_id);

    // Check enabled path first
    let enabled_path = enabled_mod_path(&base, mod_id);
    if enabled_path.exists() {
        tokio::fs::remove_dir_all(&enabled_path)
            .await
            .map_err(|e| format!("모드 삭제 실패: {}", e))?;
        return Ok(true);
    }

    // Check disabled path
    let disabled_path = disabled_mod_path(&base, mod_id);
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
    let base_path = Path::new(mods_path).join(MOD_MANAGER_DIR);

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
                    if !name.starts_with(DISABLED_PREFIX) {
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

pub async fn preview_import_source(source_path: &str) -> Result<ImportPreviewData, String> {
    let source = Path::new(source_path);
    if !source.exists() {
        return Err(format!("파일을 찾을 수 없습니다: {}", source_path));
    }

    if source.is_file() && source_path.to_lowercase().ends_with(".zip") {
        let temp_path = std::env::temp_dir().join(format!("wuwa_preview_{}", uuid::Uuid::new_v4()));
        tokio::fs::create_dir_all(&temp_path).await
            .map_err(|e| format!("임시 폴더 생성 실패: {}", e))?;

        let zip_path = source.to_path_buf();
        let extract_path = temp_path.clone();
        let (default_name, preview_images) = tokio::task::spawn_blocking(move || {
            let file = std::fs::File::open(&zip_path)
                .map_err(|e| format!("ZIP 파일 열기 실패: {}", e))?;
            let mut archive = zip::ZipArchive::new(file)
                .map_err(|e| format!("ZIP 파일 읽기 실패: {}", e))?;

            let image_extensions = ["png", "jpg", "jpeg"];
            let mut images: Vec<String> = Vec::new();

            for i in 0..archive.len() {
                let mut entry = archive.by_index(i)
                    .map_err(|e| format!("ZIP 엔트리 읽기 실패: {}", e))?;

                let entry_name = entry.name().to_string();

                // Check if this entry is an image file
                if entry.is_file() {
                    let lower_name = entry_name.to_lowercase();
                    let is_image = image_extensions.iter().any(|ext| lower_name.ends_with(&format!(".{}", ext)));
                    if is_image {
                        // Extract only this image file to temp dir with flat naming
                        let file_name = Path::new(&entry_name)
                            .file_name()
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_else(|| format!("image_{}.png", i));
                        let dest_path = extract_path.join(format!("{}_{}", i, file_name));

                        if let Ok(mut outfile) = std::fs::File::create(&dest_path) {
                            let _ = std::io::copy(&mut entry, &mut outfile);
                            if let Some(path_str) = dest_path.to_str() {
                                images.push(path_str.to_string());
                            }
                        }
                    }
                }
            }

            // Sort: "preview" images first
            images.sort_by(|a, b| {
                let a_preview = a.to_lowercase().contains("preview");
                let b_preview = b.to_lowercase().contains("preview");
                match (a_preview, b_preview) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.cmp(b),
                }
            });

            let name = zip_path.file_stem()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "unknown_mod".to_string());

            Ok::<(String, Vec<String>), String>((name, images))
        }).await
            .map_err(|e| format!("ZIP 처리 중 오류: {}", e))?
            .map_err(|e: String| e)?;

        Ok(ImportPreviewData {
            default_name,
            preview_images,
            temp_dir: Some(temp_path.to_string_lossy().to_string()),
        })
    } else if source.is_dir() {
        let default_name = source.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "unknown_mod".to_string());

        let preview_images = find_preview_images(source).await
            .unwrap_or_default();

        Ok(ImportPreviewData {
            default_name,
            preview_images,
            temp_dir: None,
        })
    } else {
        Err("지원하지 않는 파일 형식입니다. ZIP 파일 또는 폴더를 선택하세요.".to_string())
    }
}

pub async fn cleanup_import_temp(temp_dir: &str) -> Result<(), String> {
    let path = Path::new(temp_dir);
    if path.exists() && path.starts_with(std::env::temp_dir()) {
        tokio::fs::remove_dir_all(path).await
            .map_err(|e| format!("임시 폴더 삭제 실패: {}", e))?;
    }
    Ok(())
}
