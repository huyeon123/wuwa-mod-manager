# Tauri Command 규칙

## Command 패턴

모든 Tauri Command는 아래 패턴을 따릅니다.

### Rust 측 (Backend)

```rust
#[tauri::command]
async fn command_name(param: String) -> Result<ReturnType, String> {
    // 비즈니스 로직
    Ok(result)
}
```

### TypeScript 측 (Frontend)

```typescript
import { invoke } from "@tauri-apps/api/core";

const result = await invoke<ReturnType>("command_name", { param: "value" });
```

## 필수 Command 목록 (MVP)

### 캐릭터 관련

| Command | 설명 | 파라미터 | 반환값 |
|---------|------|----------|--------|
| `get_characters` | 캐릭터 목록 조회 | - | `Vec<Character>` |

### 모드 관련

| Command | 설명 | 파라미터 | 반환값 |
|---------|------|----------|--------|
| `get_mods` | 캐릭터별 모드 목록 | `character_id` | `Vec<Mod>` |
| `enable_mod` | 모드 활성화 | `mod_id`, `character_id` | `bool` |
| `disable_mod` | 모드 비활성화 | `mod_id`, `character_id` | `bool` |
| `import_mod` | 모드 가져오기 | `path` | `Mod` |
| `delete_mod` | 모드 삭제 | `mod_id`, `character_id` | `bool` |
| `get_mod_detail` | 모드 상세 정보 | `mod_id`, `character_id` | `Mod` |

### Preset 관련

| Command | 설명 | 파라미터 | 반환값 |
|---------|------|----------|--------|
| `get_presets` | 프리셋 목록 | - | `Vec<Preset>` |
| `save_preset` | 프리셋 저장 | `name`, `mod_ids` | `Preset` |
| `apply_preset` | 프리셋 적용 | `preset_id` | `bool` |
| `delete_preset` | 프리셋 삭제 | `preset_id` | `bool` |

### 설정 관련

| Command | 설명 | 파라미터 | 반환값 |
|---------|------|----------|--------|
| `get_config` | 설정 조회 | - | `Config` |
| `set_mods_path` | 모드 경로 설정 | `path` | `bool` |

### Backup / Restore

| Command | 설명 | 파라미터 | 반환값 |
|---------|------|----------|--------|
| `backup_mods` | 모드 백업 | `output_path` | `String` |
| `restore_mods` | 모드 복원 | `backup_path` | `bool` |

## Command 등록

모든 Command는 `lib.rs`에서 등록합니다.

```rust
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        commands::characters::get_characters,
        commands::mods::get_mods,
        commands::mods::enable_mod,
        commands::mods::disable_mod,
        commands::mods::import_mod,
        // ...
    ])
```

## 에러 처리

- 사용자에게 보여줄 에러는 한국어 메시지 포함
- 파일 I/O 에러는 구체적인 경로 정보 포함
- Frontend에서는 try-catch로 감싸서 toast/알림으로 표시

## 이벤트 (장시간 작업)

Import, Backup 등 시간이 걸리는 작업은 Tauri 이벤트로 진행률 전달:

```rust
app_handle.emit("import-progress", ProgressPayload { percent: 50, message: "파일 복사 중..." })?;
```

```typescript
import { listen } from "@tauri-apps/api/event";

await listen<ProgressPayload>("import-progress", (event) => {
  setProgress(event.payload.percent);
});
```
