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

    // 3. 임시 디렉토리에 다운로드
    let temp_dir = std::env::temp_dir().join("wuwa_mod_fixer");
    tokio::fs::create_dir_all(&temp_dir).await
        .map_err(|e| format!("임시 폴더 생성 실패: {}", e))?;

    let stable_path = download_file(&client, &stable_textures.browser_download_url, &temp_dir, &stable_textures.name).await?;
    let fixer_path = download_file(&client, &mod_fixer.browser_download_url, &temp_dir, &mod_fixer.name).await?;

    // 4. StableTextures.exe 먼저 실행 (mods_path를 인자로)
    run_exe(&stable_path, mods_path).await?;

    // 5. Wuwa_Mod_Fixer.exe 실행 (mods_path를 인자로)
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
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            std::process::Command::new(&exe_str)
                .arg(&mods_path)
                .creation_flags(0x08000000) // CREATE_NO_WINDOW
                .spawn()
                .map_err(|e| format!("{} 실행 실패: {}", exe_str, e))?;
        }

        #[cfg(not(target_os = "windows"))]
        {
            std::process::Command::new(&exe_str)
                .arg(&mods_path)
                .spawn()
                .map_err(|e| format!("{} 실행 실패: {}", exe_str, e))?;
        }

        Ok::<(), String>(())
    })
    .await
    .map_err(|e| format!("스레드 실행 실패: {}", e))?
}
