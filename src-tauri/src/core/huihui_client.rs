use crate::models::huihui::{HuihuiBrowseResult, HuihuiDownloadLink, HuihuiMod, HuihuiModDetail};
use futures_util::stream::{self, StreamExt};
use reqwest::Url;
use scraper::{Html, Selector};
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::sync::{Mutex, OnceLock};
use std::time::Duration;

const BASE_URL: &str = "https://huihui168.org";
const USER_AGENT: &str =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
const MAX_ITEMS_PER_PAGE: usize = 60;

static TRANSLATION_CACHE: OnceLock<Mutex<HashMap<String, String>>> = OnceLock::new();

pub async fn fetch_mods(page: u32, search: &str) -> Result<HuihuiBrowseResult, String> {
    let mut request_url = format!("{}/", BASE_URL);
    if page > 1 || !search.trim().is_empty() {
        let mut url = Url::parse(&request_url).map_err(|e| format!("URL build failed: {}", e))?;
        {
            let mut qp = url.query_pairs_mut();
            if page > 1 {
                qp.append_pair("page", &page.to_string());
            }
            if !search.trim().is_empty() {
                qp.append_pair("keyword", search.trim());
            }
        }
        request_url = url.to_string();
    }

    let html = request_html(&request_url).await?;
    let raw_entries: Vec<(u64, String, String, Option<String>)> = {
        let document = Html::parse_document(&html);
        let a_selector = Selector::parse("a[href]").map_err(|e| format!("Selector error: {}", e))?;
        let img_selector = Selector::parse("img").map_err(|e| format!("Selector error: {}", e))?;

        let mut seen = HashSet::new();
        let mut rows: Vec<(u64, String, String, Option<String>)> = Vec::new();

        for a in document.select(&a_selector) {
            let Some(raw_href) = a.value().attr("href") else {
                continue;
            };
            let Some((id, normalized_href)) = parse_wuwa_post_href(raw_href) else {
                continue;
            };
            if !seen.insert(id) {
                continue;
            }

            let mut original_name = normalize_text(&a.text().collect::<Vec<_>>().join(" "));
            if original_name.is_empty() {
                original_name = a
                    .value()
                    .attr("title")
                    .map(normalize_text)
                    .unwrap_or_default();
            }
            if original_name.is_empty() {
                if let Some(img) = a.select(&img_selector).next() {
                    if let Some(alt) = img.value().attr("alt") {
                        original_name = normalize_text(alt);
                    }
                }
            }
            if original_name.is_empty() {
                original_name = format!("Mod {}", id);
            }

            let thumbnail_url = a
                .select(&img_selector)
                .next()
                .and_then(|img| img.value().attr("src"))
                .and_then(to_absolute_url);

            rows.push((
                id,
                original_name,
                format!("{}{}", BASE_URL, normalized_href),
                thumbnail_url,
            ));
        }

        rows
    };

    let mods: Vec<HuihuiMod> = stream::iter(raw_entries.into_iter())
        .map(|(id, original_name, detail_url, thumbnail_url)| async move {
            let translated = translate_to_korean_cached(&original_name).await;
            let character_name = detect_character_name(&original_name);
            HuihuiMod {
                id,
                name: translated.unwrap_or_else(|| original_name.clone()),
                original_name,
                character_name,
                detail_url,
                thumbnail_url,
            }
        })
        .buffer_unordered(8)
        .collect()
        .await;

    let mut mods = mods;
    mods.sort_by(|a, b| b.id.cmp(&a.id));
    if mods.len() > MAX_ITEMS_PER_PAGE {
        mods.truncate(MAX_ITEMS_PER_PAGE);
    }

    Ok(HuihuiBrowseResult {
        has_more: mods.len() >= 30,
        mods,
    })
}

pub async fn fetch_mod_detail(mod_id: u64) -> Result<HuihuiModDetail, String> {
    let page_url = format!("{}/?list_11/{}.html", BASE_URL, mod_id);
    let html = request_html(&page_url).await?;

    let (original_name, character_name, article_text, preview_images, mut download_links) = {
        let document = Html::parse_document(&html);
        let title_selector = Selector::parse("title").map_err(|e| format!("Selector error: {}", e))?;
        let article_selector =
            Selector::parse(".article-content, .content").map_err(|e| format!("Selector error: {}", e))?;
        let img_selector = Selector::parse("img").map_err(|e| format!("Selector error: {}", e))?;
        let p_selector = Selector::parse("p, li, div").map_err(|e| format!("Selector error: {}", e))?;
        let a_selector = Selector::parse("a[href]").map_err(|e| format!("Selector error: {}", e))?;

        let raw_title = document
            .select(&title_selector)
            .next()
            .map(|t| normalize_text(&t.text().collect::<Vec<_>>().join(" ")))
            .unwrap_or_else(|| format!("Mod {}", mod_id));

        let original_name = raw_title
            .replace("-最近更新-Hui站", "")
            .replace("- Hui站", "")
            .trim()
            .to_string();
        let character_name = detect_character_name(&original_name);

        let article = document.select(&article_selector).next();
        let article_text = article
            .as_ref()
            .map(|n| normalize_text(&n.text().collect::<Vec<_>>().join(" ")))
            .unwrap_or_default();
        let global_password = extract_password(&article_text);

        let preview_images = if let Some(node) = article.as_ref() {
            node.select(&img_selector)
                .filter_map(|img| img.value().attr("src"))
                .filter_map(to_absolute_url)
                .filter(|url| {
                    let lower = url.to_lowercase();
                    lower.contains("/static/upload/")
                        || lower.ends_with(".jpg")
                        || lower.ends_with(".jpeg")
                        || lower.ends_with(".png")
                        || lower.ends_with(".webp")
                })
                .collect::<Vec<_>>()
        } else {
            Vec::new()
        };

        let mut links_map: HashMap<String, HuihuiDownloadLink> = HashMap::new();
        if let Some(node) = article.as_ref() {
            for section in node.select(&p_selector) {
                let section_text = normalize_text(&section.text().collect::<Vec<_>>().join(" "));
                let section_password = extract_password(&section_text).or_else(|| global_password.clone());

                for a in section.select(&a_selector) {
                    let Some(raw_href) = a.value().attr("href") else {
                        continue;
                    };
                    let Some(url) = to_absolute_url(raw_href) else {
                        continue;
                    };

                    let label_text = normalize_text(&a.text().collect::<Vec<_>>().join(" "));
                    if !is_download_link(&url, &label_text, &section_text) {
                        continue;
                    }

                    let original_label = if label_text.is_empty() {
                        url.clone()
                    } else {
                        label_text
                    };
                    links_map.entry(url.clone()).or_insert(HuihuiDownloadLink {
                        label: original_label.clone(),
                        original_label,
                        url,
                        password: section_password.clone(),
                    });
                }
            }
        }

        let mut download_links: Vec<HuihuiDownloadLink> = links_map.into_values().collect();
        download_links.sort_by(|a, b| a.url.cmp(&b.url));

        (
            original_name,
            character_name,
            article_text,
            preview_images,
            download_links,
        )
    };

    let name = translate_to_korean_cached(&original_name)
        .await
        .unwrap_or_else(|| original_name.clone());
    for link in &mut download_links {
        if let Some(translated) = translate_to_korean_cached(&link.original_label).await {
            link.label = translated;
        }
    }

    let description = if article_text.is_empty() {
        None
    } else {
        let base: String = article_text.chars().take(450).collect();
        Some(
            translate_to_korean_cached(&base)
                .await
                .unwrap_or(base),
        )
    };

    Ok(HuihuiModDetail {
        id: mod_id,
        name,
        original_name,
        character_name,
        page_url,
        preview_images,
        download_links,
        description,
    })
}

async fn request_html(url: &str) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .connect_timeout(Duration::from_secs(10))
        .http1_only()
        .build()
        .map_err(|e| format!("HTTP client build failed: {}", e))?;

    let mut last_error: Option<String> = None;
    for _ in 0..3 {
        let response_result = client
            .get(url)
            .header("User-Agent", USER_AGENT)
            .header(
                "Accept",
                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            )
            .header("Accept-Language", "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7")
            .header("Referer", BASE_URL)
            .send()
            .await;

        let response = match response_result {
            Ok(v) => v,
            Err(e) => {
                last_error = Some(format!("{:?}", e));
                tokio::time::sleep(Duration::from_millis(350)).await;
                continue;
            }
        };

        if !response.status().is_success() {
            last_error = Some(format!("HTTP {}", response.status()));
            tokio::time::sleep(Duration::from_millis(350)).await;
            continue;
        }

        return response
            .text()
            .await
            .map_err(|e| format!("Body parse failed: {}", e));
    }

    Err(format!(
        "Request failed: {} ({})",
        url,
        last_error.unwrap_or_else(|| "unknown".to_string())
    ))
}

async fn translate_to_korean_cached(text: &str) -> Option<String> {
    let source = normalize_text(text);
    if source.is_empty() || !contains_cjk(&source) {
        return None;
    }

    let cache = TRANSLATION_CACHE.get_or_init(|| Mutex::new(HashMap::new()));
    if let Ok(map) = cache.lock() {
        if let Some(cached) = map.get(&source) {
            return Some(cached.clone());
        }
    }

    let translated = translate_to_korean(&source).await.ok()?;
    if translated.is_empty() || translated == source {
        return None;
    }

    if let Ok(mut map) = cache.lock() {
        map.insert(source, translated.clone());
    }
    Some(translated)
}

async fn translate_to_korean(text: &str) -> Result<String, String> {
    let source: String = text.chars().take(700).collect();
    let url = Url::parse_with_params(
        "https://translate.googleapis.com/translate_a/single",
        &[
            ("client", "gtx"),
            ("sl", "auto"),
            ("tl", "ko"),
            ("dt", "t"),
            ("q", source.as_str()),
        ],
    )
    .map_err(|e| format!("Translate URL build failed: {}", e))?;

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(12))
        .connect_timeout(Duration::from_secs(8))
        .build()
        .map_err(|e| format!("Translate client build failed: {}", e))?;

    let response = client
        .get(url)
        .header("User-Agent", USER_AGENT)
        .header("Accept-Language", "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7")
        .send()
        .await
        .map_err(|e| format!("Translate request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Translate HTTP {}", response.status()));
    }

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("Translate JSON parse failed: {}", e))?;

    let segments = json
        .get(0)
        .and_then(|v| v.as_array())
        .ok_or_else(|| "Translate response shape invalid".to_string())?;

    let mut out = String::new();
    for seg in segments {
        if let Some(piece) = seg.get(0).and_then(|v| v.as_str()) {
            out.push_str(piece);
        }
    }
    Ok(normalize_text(&out))
}

fn parse_wuwa_post_href(raw_href: &str) -> Option<(u64, String)> {
    let href = raw_href.trim();
    let marker = "list_11/";
    let marker_pos = href.find(marker)?;
    let after = &href[(marker_pos + marker.len())..];
    let id_part = after.split('.').next()?;
    let id = id_part.parse::<u64>().ok()?;
    Some((id, format!("/?list_11/{}.html", id)))
}

fn normalize_text(input: &str) -> String {
    input
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .trim()
        .to_string()
}

fn to_absolute_url(raw: &str) -> Option<String> {
    if raw.starts_with("javascript:") || raw.starts_with('#') || raw.is_empty() {
        return None;
    }
    if raw.starts_with("http://") || raw.starts_with("https://") {
        return Some(raw.to_string());
    }
    if raw.starts_with("//") {
        return Some(format!("https:{}", raw));
    }
    if raw.starts_with('/') {
        return Some(format!("{}{}", BASE_URL, raw));
    }
    Some(format!("{}/{}", BASE_URL, raw.trim_start_matches("./")))
}

fn contains_cjk(text: &str) -> bool {
    text.chars()
        .any(|c| ('\u{4E00}'..='\u{9FFF}').contains(&c) || ('\u{3400}'..='\u{4DBF}').contains(&c))
}

fn detect_character_name(title: &str) -> Option<String> {
    // Chinese keywords mapped to Korean labels.
    let map: [(&str, &str); 38] = [
        ("长离", "장리"),
        ("今汐", "금희"),
        ("卡提希娅", "카티시아"),
        ("吟霖", "음림"),
        ("安可", "앙코"),
        ("守岸人", "수안인"),
        ("菲比", "피비"),
        ("椿", "춘"),
        ("丹瑾", "단근"),
        ("桃祈", "도기"),
        ("鉴心", "감심"),
        ("散华", "산화"),
        ("白芷", "백지"),
        ("秧秧", "양양"),
        ("莫特斐", "모테피"),
        ("洛可可", "로코코"),
        ("折枝", "절지"),
        ("炽霞", "치샤"),
        ("珂莱塔", "콜레타"),
        ("维里奈", "벨리나"),
        ("灯灯", "등등"),
        ("嘉贝莉娜", "가브리엘라"),
        ("露帕", "루파"),
        ("尤诺", "유노"),
        ("爱弥斯", "에이미스"),
        ("卜灵", "부링"),
        ("琳奈", "린나"),
        ("千咲", "치사키"),
        ("鸣潮", "명조"),
        ("Rover", "로버"),
        ("로버", "로버"),
        ("장리", "장리"),
        ("금희", "금희"),
        ("음림", "음림"),
        ("산화", "산화"),
        ("양양", "양양"),
        ("백지", "백지"),
        ("도기", "도기"),
    ];

    for (keyword, label) in map {
        if title.contains(keyword) {
            return Some(label.to_string());
        }
    }
    None
}

fn is_download_link(url: &str, label: &str, context: &str) -> bool {
    let lower = url.to_lowercase();
    let label_lower = label.to_lowercase();
    let context_lower = context.to_lowercase();

    let deny_domains = [
        "tmall.com",
        "taobao.com",
        "tttizi.com",
        "xn--i8s951di30azba.com",
        "lilt-pupu.cc",
        "mengzhan24.xyz",
        "qoxom.cc",
        "sailingnet.pro",
        "mguawu.org",
        "fontawesome",
        "jsdelivr.net",
    ];
    if deny_domains.iter().any(|d| lower.contains(d)) {
        return false;
    }

    let allow_domains = [
        "cloudreve",
        "pan.quark.cn",
        "123pan",
        "lanzou",
        "aliyundrive",
        "alipan",
        "pan.baidu.com",
        "drive.google.com",
        "dropbox.com",
        "onedrive",
        "mediafire.com",
        "mega.nz",
        "gofile.io",
    ];
    if allow_domains.iter().any(|d| lower.contains(d)) {
        return true;
    }

    label_lower.contains("다운로드")
        || label.contains("下载")
        || context.contains("下载")
        || context.contains("解压密码")
        || context_lower.contains("password")
}

fn extract_password(text: &str) -> Option<String> {
    let patterns = [
        "解压密码",
        "解壓密碼",
        "提取码",
        "提取碼",
        "비밀번호",
        "암호",
        "password",
        "密码",
        "密碼",
        "code",
    ];

    let lowered = text.to_lowercase();
    for key in patterns {
        if let Some(pos) = lowered.find(&key.to_lowercase()) {
            let slice = &text[pos + key.len()..];
            let cleaned = slice
                .trim_start_matches(|c: char| c == ':' || c == '：' || c.is_whitespace())
                .chars()
                .take_while(|c| {
                    !c.is_whitespace() && *c != '）' && *c != ')' && *c != '，' && *c != ','
                })
                .collect::<String>()
                .trim()
                .to_string();
            if cleaned.len() >= 2 {
                return Some(cleaned);
            }
        }
    }
    None
}
