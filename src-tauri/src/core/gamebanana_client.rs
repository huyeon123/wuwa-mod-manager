use crate::models::gamebanana::{
    BrowseResult, GameBananaMod, GameBananaModDetail, PreviewImage, GameBananaFile,
};
use crate::core::character_mapper;
use serde_json::Value;

const BASE_URL: &str = "https://gamebanana.com/apiv11";
const GAME_ID: &str = "20357"; // Wuthering Waves
const USER_AGENT: &str = "WuWa-Mod-Manager";

/// GameBanana API에서 모드 목록 가져오기
pub async fn fetch_mods(page: u32, per_page: u32, sort: &str, search: &str) -> Result<BrowseResult, String> {
    let url = if search.is_empty() {
        // 일반 목록 조회
        format!(
            "{}/Mod/Index?_aFilters[Generic_Game]={}&_nPage={}&_nPerpage={}&_sSort={}",
            BASE_URL, GAME_ID, page, per_page, sort
        )
    } else {
        // 검색 조회 - Util/Search/Results 엔드포인트 사용
        format!(
            "{}/Util/Search/Results?_sSearchString={}&_nPerpage={}&_nPage={}&_idGameRow={}&_sModelName=Mod",
            BASE_URL, search.replace(' ', "+"), per_page, page, GAME_ID
        )
    };

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", USER_AGENT)
        .send()
        .await
        .map_err(|e| format!("모드 목록 요청 실패: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API 오류: {}", response.status()));
    }

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("JSON 파싱 실패: {}", e))?;

    let records = json["_aRecords"]
        .as_array()
        .ok_or_else(|| "응답에 _aRecords 필드가 없습니다".to_string())?;

    let total_count = json["_aMetadata"]["_nRecordCount"]
        .as_u64()
        .unwrap_or(0);

    let mods: Vec<GameBananaMod> = records
        .iter()
        .filter_map(|record| parse_mod_record(record))
        .collect();

    let has_more = if search.is_empty() {
        (page * per_page) < (total_count as u32)
    } else {
        // 검색 엔드포인트는 _bIsComplete로 페이지 완료 여부를 알려줌
        !json["_aMetadata"]["_bIsComplete"].as_bool().unwrap_or(true)
    };

    Ok(BrowseResult {
        mods,
        total_count,
        has_more,
    })
}

/// GameBanana API에서 모드 상세 정보 가져오기
pub async fn fetch_mod_detail(mod_id: u64) -> Result<GameBananaModDetail, String> {
    let url = format!("{}/Mod/{}/ProfilePage", BASE_URL, mod_id);

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", USER_AGENT)
        .send()
        .await
        .map_err(|e| format!("모드 상세 요청 실패: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API 오류: {}", response.status()));
    }

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("JSON 파싱 실패: {}", e))?;

    parse_mod_detail(mod_id, &json)
}

fn parse_mod_record(record: &Value) -> Option<GameBananaMod> {
    let id = record["_idRow"].as_u64()?;
    let name = record["_sName"].as_str()?.to_string();
    let version = record["_sVersion"].as_str().map(String::from);

    // 썸네일 URL 추출
    let thumbnail_url = record["_aPreviewMedia"]["_aImages"]
        .as_array()
        .and_then(|images| images.first())
        .and_then(|img| {
            let base = img["_sBaseUrl"].as_str()?.trim_end_matches('/');
            let file = img["_sFile220"].as_str()?;
            Some(format!("{}/{}", base, file))
        });

    let submitter_name = record["_aSubmitter"]["_sName"]
        .as_str()
        .unwrap_or("Unknown")
        .to_string();

    let submitter_avatar = record["_aSubmitter"]["_sAvatarUrl"]
        .as_str()
        .map(String::from);

    let category = record["_aRootCategory"]["_sName"]
        .as_str()
        .unwrap_or("")
        .to_string();

    let like_count = record["_nLikeCount"].as_u64().unwrap_or(0);
    let view_count = record["_nViewCount"].as_u64().unwrap_or(0);

    let has_files = record["_bHasFiles"].as_bool().unwrap_or(false);

    let date_added = record["_tsDateAdded"].as_u64().unwrap_or(0);
    let date_updated = record["_tsDateUpdated"].as_u64()
        .or_else(|| record["_tsDateModified"].as_u64())
        .unwrap_or(0);

    // 태그 추출
    let tags: Vec<String> = record["_aTags"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|tag| tag.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default();

    Some(GameBananaMod {
        id,
        name,
        version,
        thumbnail_url,
        submitter_name,
        submitter_avatar,
        category,
        like_count,
        view_count,
        date_added,
        date_updated,
        has_files,
        tags,
    })
}

fn parse_mod_detail(mod_id: u64, json: &Value) -> Result<GameBananaModDetail, String> {
    let name = json["_sName"]
        .as_str()
        .ok_or_else(|| "모드 이름이 없습니다".to_string())?
        .to_string();

    let description = json["_sDescription"].as_str().map(String::from);
    let text_html = json["_sText"].as_str().map(String::from);
    let version = json["_sVersion"].as_str().map(String::from);

    let submitter_name = json["_aSubmitter"]["_sName"]
        .as_str()
        .unwrap_or("Unknown")
        .to_string();

    let category_name = json["_aCategory"]["_sName"].as_str().map(String::from);
    let super_category = json["_aSuperCategory"]["_sName"].as_str().map(String::from);

    // 프리뷰 이미지 추출
    let preview_images: Vec<PreviewImage> = json["_aPreviewMedia"]["_aImages"]
        .as_array()
        .map(|images| {
            images
                .iter()
                .filter_map(|img| {
                    let base = img["_sBaseUrl"].as_str()?.trim_end_matches('/');
                    let file = img["_sFile"].as_str()?;
                    let thumb_file = img["_sFile220"].as_str()?;
                    Some(PreviewImage {
                        url: format!("{}/{}", base, file),
                        thumb_url: format!("{}/{}", base, thumb_file),
                    })
                })
                .collect()
        })
        .unwrap_or_default();

    // 파일 목록 추출
    let files: Vec<GameBananaFile> = json["_aFiles"]
        .as_array()
        .map(|file_arr| {
            file_arr
                .iter()
                .filter_map(|file| {
                    let id = file["_idRow"].as_u64()?;
                    let filename = file["_sFile"].as_str()?.to_string();
                    let filesize = file["_nFilesize"].as_u64().unwrap_or(0);
                    let download_url = file["_sDownloadUrl"].as_str()?.to_string();
                    let download_count = file["_nDownloadCount"].as_u64().unwrap_or(0);
                    let description = file["_sDescription"].as_str().map(String::from);
                    let md5 = file["_sMd5Checksum"].as_str().map(String::from);

                    Some(GameBananaFile {
                        id,
                        filename,
                        filesize,
                        download_url,
                        download_count,
                        description,
                        md5,
                    })
                })
                .collect()
        })
        .unwrap_or_default();

    let like_count = json["_nLikeCount"].as_u64().unwrap_or(0);
    let view_count = json["_nViewCount"].as_u64().unwrap_or(0);

    // 캐릭터 감지
    let detected_character_id = character_mapper::detect_character(
        category_name.as_deref(),
        &name,
    );

    Ok(GameBananaModDetail {
        id: mod_id,
        name,
        description,
        text_html,
        version,
        submitter_name,
        category_name,
        super_category,
        preview_images,
        files,
        like_count,
        view_count,
        detected_character_id,
    })
}
