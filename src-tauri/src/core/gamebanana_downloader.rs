use std::path::PathBuf;
use std::time::Instant;
use futures_util::StreamExt;
use tauri::{AppHandle, Emitter};
use crate::models::gamebanana::DownloadProgress;
use crate::models::GameMod;
use crate::core::mod_manager;

const USER_AGENT: &str = "WuWa-Mod-Manager";
const PROGRESS_THROTTLE_MS: u128 = 100; // Emit progress every 100ms minimum
const PROGRESS_THROTTLE_PERCENT: f32 = 1.0; // Or every 1% change

/// GameBanana에서 모드를 다운로드하고 임포트
pub async fn download_and_import(
    file_id: u64,
    file_name: &str,
    character_id: &str,
    mods_path: &str,
    custom_name: Option<&str>,
    app_handle: &AppHandle,
) -> Result<GameMod, String> {
    // 1. 임시 디렉토리 생성
    let temp_dir = std::env::temp_dir().join(format!("wuwa_gb_{}", uuid::Uuid::new_v4()));
    tokio::fs::create_dir_all(&temp_dir).await
        .map_err(|e| format!("임시 폴더 생성 실패: {}", e))?;

    let download_path = temp_dir.join(file_name);
    let download_url = format!("https://gamebanana.com/dl/{}", file_id);

    // 2. 스트리밍 다운로드 + 진행률 이벤트
    download_with_progress(&download_url, &download_path, file_id, app_handle).await?;

    // 3. ZIP 파일 확인
    let lower_name = file_name.to_lowercase();
    if !lower_name.ends_with(".zip") {
        // 임시 파일 정리
        let _ = tokio::fs::remove_dir_all(&temp_dir).await;
        if lower_name.ends_with(".rar") || lower_name.ends_with(".7z") {
            return Err("RAR/7z 형식은 지원하지 않습니다. ZIP 파일만 다운로드할 수 있습니다.".to_string());
        }
        return Err(format!("지원하지 않는 파일 형식입니다: {}", file_name));
    }

    // 4. 임포트 단계 이벤트
    let _ = app_handle.emit("download-progress", DownloadProgress {
        file_id,
        downloaded: 0,
        total: 0,
        percent: 100.0,
        phase: "importing".to_string(),
    });

    // 5. 기존 import_mod 재사용
    let source_path_str = download_path.to_string_lossy().to_string();
    let result = mod_manager::import_mod(
        &source_path_str,
        character_id,
        mods_path,
        custom_name,
    ).await;

    // 6. 임시 파일 정리
    let _ = tokio::fs::remove_dir_all(&temp_dir).await;

    result
}

async fn download_with_progress(
    url: &str,
    dest: &PathBuf,
    file_id: u64,
    app_handle: &AppHandle,
) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .build()
        .map_err(|e| format!("HTTP 클라이언트 생성 실패: {}", e))?;

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("다운로드 요청 실패: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("다운로드 실패 (HTTP {})", response.status()));
    }

    let total_size = response.content_length().unwrap_or(0);
    let mut stream = response.bytes_stream();
    let mut downloaded: u64 = 0;
    let mut file = tokio::fs::File::create(dest).await
        .map_err(|e| format!("파일 생성 실패: {}", e))?;

    use tokio::io::AsyncWriteExt;

    let mut last_emit_time = Instant::now();
    let mut last_emit_percent: f32 = 0.0;

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result
            .map_err(|e| format!("데이터 수신 실패: {}", e))?;

        file.write_all(&chunk).await
            .map_err(|e| format!("파일 쓰기 실패: {}", e))?;

        downloaded += chunk.len() as u64;

        let percent = if total_size > 0 {
            (downloaded as f32 / total_size as f32) * 100.0
        } else {
            0.0
        };

        // Throttle progress events: emit only if 100ms passed OR 1% changed
        let elapsed = last_emit_time.elapsed().as_millis();
        let percent_delta = (percent - last_emit_percent).abs();

        if elapsed >= PROGRESS_THROTTLE_MS || percent_delta >= PROGRESS_THROTTLE_PERCENT {
            let _ = app_handle.emit("download-progress", DownloadProgress {
                file_id,
                downloaded,
                total: total_size,
                percent,
                phase: "downloading".to_string(),
            });
            last_emit_time = Instant::now();
            last_emit_percent = percent;
        }
    }

    // Final progress event at 100%
    let _ = app_handle.emit("download-progress", DownloadProgress {
        file_id,
        downloaded,
        total: total_size,
        percent: 100.0,
        phase: "downloading".to_string(),
    });

    file.flush().await
        .map_err(|e| format!("파일 플러시 실패: {}", e))?;

    Ok(())
}
