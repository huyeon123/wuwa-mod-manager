# 모드 시스템 규칙

## 모드 토글 규칙 (가장 중요)

모드는 반드시 **폴더 이동 방식**으로만 Enable/Disable 합니다.

### Enabled 상태

```
Mods/<character>/<modId>/
```

### Disabled 상태

```
Mods/_disabled/<character>/<modId>/
```

### 금지된 방식

- 런타임 패치
- 바이너리 수정
- DLL 인젝션
- 메모리 패치
- 심볼릭 링크 방식 (일관성 문제)

## 모드 Import 흐름

1. 사용자가 ZIP 파일 또는 폴더를 선택
2. ZIP인 경우 임시 디렉토리에 압축 해제
3. `mod.json` 존재 여부 확인
   - 없으면: 기본 `mod.json`을 생성하도록 사용자에게 정보 입력 요청
   - 있으면: 메타데이터 읽기
4. 대상 캐릭터 폴더(`Mods/<character>/`)로 복사
5. 모드 목록 갱신

## 모드 Enable/Disable 흐름

### Enable

```
Mods/_disabled/<character>/<modId>/  →  Mods/<character>/<modId>/
```

1. disabled 폴더에서 대상 모드 폴더 확인
2. 목적지 폴더에 동일 ID가 없는지 확인
3. 폴더 이동 (`rename` 또는 `move`)
4. 상태 업데이트

### Disable

```
Mods/<character>/<modId>/  →  Mods/_disabled/<character>/<modId>/
```

1. enabled 폴더에서 대상 모드 폴더 확인
2. `_disabled/<character>/` 디렉토리 존재 확인 (없으면 생성)
3. 폴더 이동
4. 상태 업데이트

## 모드 경로 설정

- 기본 모드 경로는 설정 파일(`config.json`)에서 관리
- 사용자가 게임 설치 경로 또는 커스텀 Mods 폴더를 지정할 수 있어야 함
- 경로 유효성 검사는 Backend(Rust)에서 수행

## Backup / Restore

- Backup: 현재 Mods 폴더 전체를 ZIP으로 압축하여 지정 경로에 저장
- Restore: ZIP 파일을 선택하여 Mods 폴더에 복원
- Backup 시 현재 Enable/Disable 상태 정보도 함께 저장 (manifest.json)
- Restore 시 기존 모드와 충돌 여부를 확인하고 사용자에게 선택지 제공

## Preset 시스템

- Preset은 "어떤 모드가 Enable 상태인지"의 스냅샷
- Preset 적용 시: 현재 모든 모드를 Disable → Preset에 포함된 모드만 Enable
- Preset은 `config/presets/` 폴더에 JSON으로 저장
