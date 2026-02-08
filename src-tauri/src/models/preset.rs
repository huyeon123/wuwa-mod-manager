use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Preset {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub enabled_mods: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}
