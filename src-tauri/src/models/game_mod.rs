use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameMod {
    pub id: String,
    pub character_id: String,
    pub name: String,
    pub description: Option<String>,
    pub author: Option<String>,
    pub version: Option<String>,
    pub tags: Option<Vec<String>>,
    pub preview: Option<Vec<String>>,
    pub enabled: bool,
    pub path: String,
    pub created_at: String,
    pub keybindings: Option<Vec<ModKeybinding>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModKeybinding {
    pub action: String,
    pub key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModMetadata {
    pub id: String,
    pub name: String,
    pub character_id: String,
    pub description: Option<String>,
    pub author: Option<String>,
    pub version: Option<String>,
    pub tags: Option<Vec<String>>,
    pub preview: Option<Vec<String>>,
}
