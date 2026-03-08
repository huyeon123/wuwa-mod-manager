use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HuihuiBrowseResult {
    pub mods: Vec<HuihuiMod>,
    pub has_more: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HuihuiMod {
    pub id: u64,
    pub name: String,
    pub original_name: String,
    pub character_name: Option<String>,
    pub detail_url: String,
    pub thumbnail_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HuihuiModDetail {
    pub id: u64,
    pub name: String,
    pub original_name: String,
    pub character_name: Option<String>,
    pub page_url: String,
    pub preview_images: Vec<String>,
    pub download_links: Vec<HuihuiDownloadLink>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HuihuiDownloadLink {
    pub label: String,
    pub original_label: String,
    pub url: String,
    pub password: Option<String>,
}
