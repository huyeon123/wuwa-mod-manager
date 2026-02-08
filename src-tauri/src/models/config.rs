use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub mods_path: Option<String>,
    pub game_path: Option<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            mods_path: None,
            game_path: None,
        }
    }
}
