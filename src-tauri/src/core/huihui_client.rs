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
const TRANSLATE_MAX_TEXT: usize = 700;

static TRANSLATION_CACHE: OnceLock<Mutex<HashMap<String, String>>> = OnceLock::new();

type RawListRow = (u64, String, String, Option<String>);
type ParsedDetail = (
    String,
    Option<String>,
    String,
    Vec<String>,
    Vec<HuihuiDownloadLink>,
);

pub async fn fetch_mods(
    page: u32,
    search: &str,
    translate_enabled: bool,
) -> Result<HuihuiBrowseResult, String> {
    let request_url = build_list_url(page, search)?;
    let html = request_html(&request_url).await?;
    let raw_entries = parse_list_html(&html)?;

    let mods: Vec<HuihuiMod> = stream::iter(raw_entries.into_iter())
        .map(|(id, original_name, detail_url, thumbnail_url)| async move {
            let name = if translate_enabled {
                translate_to_korean_cached(&original_name)
                    .await
                    .unwrap_or_else(|| original_name.clone())
            } else {
                original_name.clone()
            };

            HuihuiMod {
                id,
                name,
                original_name: original_name.clone(),
                character_name: detect_character_name(&original_name),
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

pub async fn fetch_mod_detail(mod_id: u64, translate_enabled: bool) -> Result<HuihuiModDetail, String> {
    let page_url = format!("{}/?list_11/{}.html", BASE_URL, mod_id);
    let html = request_html(&page_url).await?;

    let (original_name, character_name, article_text, preview_images, mut download_links) =
        parse_detail_html(&html, mod_id)?;

    let name = if translate_enabled {
        translate_to_korean_cached(&original_name)
            .await
            .unwrap_or_else(|| original_name.clone())
    } else {
        original_name.clone()
    };

    if translate_enabled {
        for link in &mut download_links {
            if let Some(translated) = translate_to_korean_cached(&link.original_label).await {
                link.label = translated;
            }
        }
    }

    let description = if article_text.is_empty() {
        None
    } else {
        let base: String = article_text.chars().take(450).collect();
        if translate_enabled {
            Some(translate_to_korean_cached(&base).await.unwrap_or(base))
        } else {
            Some(base)
        }
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

fn build_list_url(page: u32, search: &str) -> Result<String, String> {
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
    Ok(request_url)
}

fn parse_list_html(html: &str) -> Result<Vec<RawListRow>, String> {
    let document = Html::parse_document(html);
    let a_selector = Selector::parse("a[href]").map_err(|e| format!("Selector error: {}", e))?;
    let img_selector = Selector::parse("img").map_err(|e| format!("Selector error: {}", e))?;

    let mut seen = HashSet::new();
    let mut rows: Vec<RawListRow> = Vec::new();

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

    Ok(rows)
}

fn parse_detail_html(html: &str, mod_id: u64) -> Result<ParsedDetail, String> {
    let document = Html::parse_document(html);
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

    Ok((
        original_name,
        character_name,
        article_text,
        preview_images,
        download_links,
    ))
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
    let source: String = text.chars().take(TRANSLATE_MAX_TEXT).collect();
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
    text.chars().any(|c| {
        ('\u{4E00}'..='\u{9FFF}').contains(&c)
            || ('\u{3400}'..='\u{4DBF}').contains(&c)
            || ('\u{F900}'..='\u{FAFF}').contains(&c)
    })
}

fn detect_character_name(title: &str) -> Option<String> {
    let map: [(&str, &str); 28] = [
        ("\u{957f}\u{79bb}", "\u{c7a5}\u{b9ac}"),
        ("\u{4eca}\u{6c50}", "\u{ae08}\u{d76c}"),
        ("\u{5361}\u{63d0}\u{5e0c}\u{5a05}", "\u{ce74}\u{d2f0}\u{c2dc}\u{c544}"),
        ("\u{541f}\u{9716}", "\u{c74c}\u{b9bc}"),
        ("\u{5b89}\u{53ef}", "\u{c559}\u{cf54}"),
        ("\u{5b88}\u{5cb8}\u{4eba}", "\u{c218}\u{c548}\u{c778}"),
        ("\u{83f2}\u{6bd4}", "\u{d53c}\u{be44}"),
        ("\u{6907}", "\u{cd98}"),
        ("\u{4e39}\u{747e}", "\u{b2e8}\u{adfc}"),
        ("\u{6843}\u{7948}", "\u{b3c4}\u{ae30}"),
        ("\u{9274}\u{5fc3}", "\u{ac10}\u{c2ec}"),
        ("\u{6563}\u{534e}", "\u{c0b0}\u{d654}"),
        ("\u{767d}\u{829d}", "\u{bc31}\u{c9c0}"),
        ("\u{79e7}\u{79e7}", "\u{c591}\u{c591}"),
        ("\u{83ab}\u{7279}\u{83f2}", "\u{baa8}\u{d14c}\u{d53c}"),
        ("\u{6d1b}\u{53ef}\u{53ef}", "\u{b85c}\u{cf54}\u{cf54}"),
        ("\u{6298}\u{679d}", "\u{c808}\u{c9c0}"),
        ("\u{70bd}\u{971e}", "\u{ce58}\u{c0e4}"),
        ("\u{73c2}\u{83b1}\u{5854}", "\u{cf5c}\u{b808}\u{d0c0}"),
        ("\u{7ef4}\u{91cc}\u{5948}", "\u{bca8}\u{b9ac}\u{b098}"),
        ("\u{706f}\u{706f}", "\u{b4f1}\u{b4f1}"),
        ("\u{5609}\u{8d1d}\u{8389}\u{5a1c}", "\u{ac00}\u{be0c}\u{b9ac}\u{c5d8}\u{b77c}"),
        ("\u{9732}\u{5e15}", "\u{b8e8}\u{d30c}"),
        ("\u{5c24}\u{8bfa}", "\u{c720}\u{b178}"),
        ("\u{7231}\u{5f25}\u{65af}", "\u{c5d0}\u{c774}\u{bbf8}\u{c2a4}"),
        ("\u{5361}\u{5361}\u{7f57}", "\u{ce74}\u{ce74}\u{b85c}"),
        ("\u{9e23}\u{6f6e}", "\u{ba85}\u{c870}"),
        ("Rover", "\u{b85c}\u{bc84}"),
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

    label_lower.contains("download")
        || label.contains("\u{4e0b}\u{8f7d}")
        || context.contains("\u{4e0b}\u{8f7d}")
        || context.contains("\u{89e3}\u{538b}\u{5bc6}\u{7801}")
        || context_lower.contains("password")
}

fn extract_password(text: &str) -> Option<String> {
    let patterns = [
        "\u{89e3}\u{538b}\u{5bc6}\u{7801}",
        "\u{89e3}\u{58d3}\u{5bc6}\u{78bc}",
        "\u{63d0}\u{53d6}\u{7801}",
        "\u{63d0}\u{53d6}\u{78bc}",
        "\u{be44}\u{bc00}\u{bc88}\u{d638}",
        "\u{c554}\u{d638}",
        "password",
        "\u{5bc6}\u{7801}",
        "\u{5bc6}\u{78bc}",
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
                    !c.is_whitespace() && *c != ')' && *c != '）' && *c != ',' && *c != '，'
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
