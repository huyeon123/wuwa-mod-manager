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

pub async fn run_mod_fixer(mods_path: &str) -> Result<String, String> {
    // 1. GitHub API에서 최신 릴리즈 조회
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

    // 2. StableTextures.exe와 Wuwa_Mod_Fixer_vX.X.X.exe 찾기
    let stable_textures = release.assets.iter()
        .find(|a| a.name.to_lowercase().contains("stabletextures") && a.name.ends_with(".exe"))
        .ok_or("StableTextures.exe를 찾을 수 없습니다")?;

    let mod_fixer = release.assets.iter()
        .find(|a| a.name.to_lowercase().starts_with("wuwa_mod_fixer_v") && a.name.ends_with(".exe"))
        .ok_or("Wuwa_Mod_Fixer.exe를 찾을 수 없습니다")?;

    // 3. 모드 폴더 하위에 다운로드
    let download_dir = PathBuf::from(mods_path).join("mod_fixer");
    tokio::fs::create_dir_all(&download_dir).await
        .map_err(|e| format!("다운로드 폴더 생성 실패: {}", e))?;

    let stable_path = download_file(&client, &stable_textures.browser_download_url, &download_dir, &stable_textures.name).await?;
    let fixer_path = download_file(&client, &mod_fixer.browser_download_url, &download_dir, &mod_fixer.name).await?;

    // 4. StableTextures.exe 실행 (콘솔 창 표시, 완료까지 대기)
    run_exe(&stable_path, mods_path).await?;

    // 5. Wuwa_Mod_Fixer.exe 실행 (콘솔 창 표시, 완료까지 대기)
    run_exe(&fixer_path, mods_path).await?;

    Ok(format!("모드 픽스툴 {} 실행 완료", release.tag_name))
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
