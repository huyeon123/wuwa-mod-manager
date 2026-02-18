use std::path::PathBuf;
use serde::Deserialize;

#[derive(Deserialize)]
struct GitHubRelease {
    tag_name: String,
    assets: Vec<GitHubAsset>,
}

#[derive(Deserialize)]
struct GitHubAsset {
    name: String,
    browser_download_url: String,
}

const GITHUB_API_URL: &str = "https://api.github.com/repos/Moonholder/Wuwa_Mod_Fixer/releases/latest";

/// 다운로드 + StableTextures + Fixer 모두 실행
pub async fn run_all(mods_path: &str) -> Result<String, String> {
    let (stable_path, fixer_path, tag) = download_fixers(mods_path).await?;
    run_exe(&stable_path, mods_path).await?;
    run_exe(&fixer_path, mods_path).await?;
    Ok(format!("모드 픽스툴 {} 모두 실행 완료", tag))
}

/// 다운로드 + StableTextures만 실행
pub async fn run_stable_textures(mods_path: &str) -> Result<String, String> {
    let (stable_path, _, tag) = download_fixers(mods_path).await?;
    run_exe(&stable_path, mods_path).await?;
    Ok(format!("StableTextures {} 실행 완료", tag))
}

/// 다운로드 + Fixer만 실행
pub async fn run_fixer_only(mods_path: &str) -> Result<String, String> {
    let (_, fixer_path, tag) = download_fixers(mods_path).await?;
    run_exe(&fixer_path, mods_path).await?;
    Ok(format!("Mod Fixer {} 실행 완료", tag))
}

/// GitHub에서 최신 릴리즈의 두 exe를 다운로드하고 경로 반환
async fn download_fixers(mods_path: &str) -> Result<(PathBuf, PathBuf, String), String> {
    let client = reqwest::Client::builder()
        .user_agent("WuWa-Mod-Manager")
        .build()
        .map_err(|e| format!("HTTP 클라이언트 생성 실패: {}", e))?;

    let release: GitHubRelease = client
        .get(GITHUB_API_URL)
        .send()
        .await
        .map_err(|e| format!("GitHub API 요청 실패: {}", e))?
        .json()
        .await
        .map_err(|e| format!("릴리즈 정보 파싱 실패: {}", e))?;

    let stable_textures = release.assets.iter()
        .find(|a| a.name.to_lowercase().contains("stabletextures") && a.name.ends_with(".exe"))
        .ok_or("StableTextures.exe를 찾을 수 없습니다")?;

    let mod_fixer = release.assets.iter()
        .find(|a| a.name.to_lowercase().starts_with("wuwa_mod_fixer_v") && a.name.ends_with(".exe"))
        .ok_or("Wuwa_Mod_Fixer.exe를 찾을 수 없습니다")?;

    // 모드 폴더 바로 하위에 다운로드
    let download_dir = PathBuf::from(mods_path);

    let stable_path = download_file(&client, &stable_textures.browser_download_url, &download_dir, &stable_textures.name).await?;
    let fixer_path = download_file(&client, &mod_fixer.browser_download_url, &download_dir, &mod_fixer.name).await?;

    Ok((stable_path, fixer_path, release.tag_name))
}

async fn download_file(client: &reqwest::Client, url: &str, dir: &PathBuf, filename: &str) -> Result<PathBuf, String> {
    let file_path = dir.join(filename);

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("{} 다운로드 실패: {}", filename, e))?;

    let bytes = response.bytes().await
        .map_err(|e| format!("{} 데이터 수신 실패: {}", filename, e))?;

    tokio::fs::write(&file_path, &bytes).await
        .map_err(|e| format!("{} 저장 실패: {}", filename, e))?;

    Ok(file_path)
}

async fn run_exe(exe_path: &PathBuf, mods_path: &str) -> Result<(), String> {
    let exe_str = exe_path.to_string_lossy().to_string();
    let mods_path = mods_path.to_string();

    tokio::task::spawn_blocking(move || {
        let status = std::process::Command::new(&exe_str)
            .current_dir(&mods_path)
            .status()
            .map_err(|e| format!("{} 실행 실패: {}", exe_str, e))?;

        if !status.success() {
            return Err(format!("{} 실행 실패 (코드 {:?})", exe_str, status.code()));
        }

        Ok::<(), String>(())
    })
    .await
    .map_err(|e| format!("스레드 실행 실패: {}", e))?
}
