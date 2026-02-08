use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Character {
    pub id: String,
    pub name: String,
    pub name_en: String,
    pub element: Option<String>,
    pub rarity: Option<u8>,
    pub thumbnail: String,
}
