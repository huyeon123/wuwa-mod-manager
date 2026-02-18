use crate::models::{Preset, PresetMod};
use crate::core::config_manager;
use crate::core::mod_manager;
use chrono::Utc;
use uuid::Uuid;

pub async fn get_presets(app_handle: &tauri::AppHandle) -> Result<Vec<Preset>, String> {
    let config = config_manager::load_config(app_handle).await?;
    Ok(config.presets)
}

pub async fn create_preset(
    name: &str,
    mods: Vec<PresetMod>,
    app_handle: &tauri::AppHandle,
) -> Result<Preset, String> {
    let mut config = config_manager::load_config(app_handle).await?;

    let preset = Preset {
        id: Uuid::new_v4().to_string(),
        name: name.to_string(),
        mods,
        created_at: Utc::now().to_rfc3339(),
    };

    config.presets.push(preset.clone());
    config_manager::save_config(&config, app_handle).await?;

    Ok(preset)
}

pub async fn delete_preset(
    preset_id: &str,
    app_handle: &tauri::AppHandle,
) -> Result<bool, String> {
    let mut config = config_manager::load_config(app_handle).await?;

    let original_len = config.presets.len();
    config.presets.retain(|p| p.id != preset_id);

    if config.presets.len() == original_len {
        return Err("프리셋을 찾을 수 없습니다".to_string());
    }

    // Remove from active preset IDs
    config.active_preset_ids.retain(|id| id != preset_id);

    config_manager::save_config(&config, app_handle).await?;
    Ok(true)
}

pub async fn toggle_preset(
    preset_id: &str,
    enable: bool,
    mods_path: &str,
    app_handle: &tauri::AppHandle,
) -> Result<bool, String> {
    let mut config = config_manager::load_config(app_handle).await?;

    let preset = config.presets.iter()
        .find(|p| p.id == preset_id)
        .ok_or("프리셋을 찾을 수 없습니다".to_string())?;

    for preset_mod in &preset.mods {
        let result = if enable {
            mod_manager::enable_mod(&preset_mod.mod_id, &preset_mod.character_id, mods_path).await
        } else {
            mod_manager::disable_mod(&preset_mod.mod_id, &preset_mod.character_id, mods_path).await
        };

        // Log but continue if individual mod fails (might already be in target state)
        if let Err(e) = result {
            eprintln!("프리셋 모드 전환 실패 ({}/{}): {}", preset_mod.character_id, preset_mod.mod_id, e);
        }
    }

    // Update active preset IDs
    if enable {
        if !config.active_preset_ids.contains(&preset_id.to_string()) {
            config.active_preset_ids.push(preset_id.to_string());
        }
    } else {
        config.active_preset_ids.retain(|id| id != preset_id);
    }
    config_manager::save_config(&config, app_handle).await?;

    Ok(true)
}

pub async fn update_preset(
    preset_id: &str,
    name: Option<String>,
    mods: Option<Vec<PresetMod>>,
    app_handle: &tauri::AppHandle,
) -> Result<Preset, String> {
    let mut config = config_manager::load_config(app_handle).await?;

    let preset = config.presets.iter_mut()
        .find(|p| p.id == preset_id)
        .ok_or("프리셋을 찾을 수 없습니다".to_string())?;

    if let Some(new_name) = name {
        preset.name = new_name;
    }
    if let Some(new_mods) = mods {
        preset.mods = new_mods;
    }

    let updated = preset.clone();
    config_manager::save_config(&config, app_handle).await?;

    Ok(updated)
}

/// 특정 모드를 모든 프리셋에서 제거하고, 모드가 0개가 된 프리셋은 삭제
pub async fn remove_mod_from_presets(
    character_id: &str,
    mod_id: &str,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    let mut config = config_manager::load_config(app_handle).await?;

    let mut changed = false;

    // 각 프리셋에서 해당 모드 제거
    for preset in &mut config.presets {
        let before_len = preset.mods.len();
        preset.mods.retain(|m| !(m.character_id == character_id && m.mod_id == mod_id));
        if preset.mods.len() != before_len {
            changed = true;
        }
    }

    // 모드가 0개인 프리셋 삭제 + active_preset_ids에서도 제거
    let empty_preset_ids: Vec<String> = config.presets.iter()
        .filter(|p| p.mods.is_empty())
        .map(|p| p.id.clone())
        .collect();

    if !empty_preset_ids.is_empty() {
        config.presets.retain(|p| !p.mods.is_empty());
        config.active_preset_ids.retain(|id| !empty_preset_ids.contains(id));
        changed = true;
    }

    if changed {
        config_manager::save_config(&config, app_handle).await?;
    }

    Ok(())
}
