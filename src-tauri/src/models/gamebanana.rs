use serde::{Deserialize, Serialize};

// 프론트엔드로 전달하는 브라우저 결과
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowseResult {
    pub mods: Vec<GameBananaMod>,
    pub total_count: u64,
    pub has_more: bool,
}

// 목록에서 표시할 모드 정보
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameBananaMod {
    pub id: u64,
    pub name: String,
    pub version: Option<String>,
    pub thumbnail_url: Option<String>,
    pub submitter_name: String,
    pub submitter_avatar: Option<String>,
    pub category: String,
    pub like_count: u64,
    pub view_count: u64,
    pub date_added: u64,
    pub date_updated: u64,
    pub has_files: bool,
    pub tags: Vec<String>,
}

// 상세 페이지에서 표시할 모드 정보
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameBananaModDetail {
    pub id: u64,
    pub name: String,
    pub description: Option<String>,
    pub text_html: Option<String>,
    pub version: Option<String>,
    pub submitter_name: String,
    pub category_name: Option<String>,     // 캐릭터명 (예: "Aemeath")
    pub super_category: Option<String>,    // "Skins" 등
    pub preview_images: Vec<PreviewImage>,
    pub files: Vec<GameBananaFile>,
    pub like_count: u64,
    pub view_count: u64,
    pub detected_character_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreviewImage {
    pub url: String,
    pub thumb_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameBananaFile {
    pub id: u64,
    pub filename: String,
    pub filesize: u64,
    pub download_url: String,
    pub download_count: u64,
    pub description: Option<String>,
    pub md5: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    pub file_id: u64,
    pub downloaded: u64,
    pub total: u64,
    pub percent: f32,
    pub phase: String,
}
