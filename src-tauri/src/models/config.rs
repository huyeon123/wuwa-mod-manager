use serde::{Deserialize, Serialize};
use super::preset::Preset;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub mods_path: Option<String>,
    pub game_path: Option<String>,
    pub xxmi_launcher_path: Option<String>,
    #[serde(default)]
    pub favorite_characters: Vec<String>,
    #[serde(default)]
    pub favorite_mods: Vec<String>,
    #[serde(default)]
    pub presets: Vec<Preset>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            mods_path: None,
            game_path: None,
            xxmi_launcher_path: None,
            favorite_characters: Vec::new(),
            favorite_mods: Vec::new(),
            presets: Vec::new(),
        }
    }
}
