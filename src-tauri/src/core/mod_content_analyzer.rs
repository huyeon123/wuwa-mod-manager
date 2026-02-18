use std::path::Path;
use crate::models::game_mod::ModKeybinding;

pub async fn find_preview_images(dir: &Path) -> Option<Vec<String>> {
    let mut images = Vec::new();
    let image_extensions = ["png", "jpg", "jpeg"];

    let mut entries = match tokio::fs::read_dir(dir).await {
        Ok(e) => e,
        Err(_) => return None,
    };

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

pub async fn parse_keybindings_from_dir(dir: &Path) -> Option<Vec<ModKeybinding>> {
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

        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            let section_name = &trimmed[1..trimmed.len() - 1];

            if section_name.to_lowercase().starts_with("key") {
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

        if is_key_section {
            if let Some(action) = &current_section {
                let lower = trimmed.to_lowercase();
                if lower.starts_with("key=") || lower.starts_with("key =") {
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

    let without_prefix = if trimmed.to_uppercase().starts_with("VK_") {
        &trimmed[3..]
    } else {
        trimmed
    };

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
