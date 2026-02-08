# 아키텍처 규칙

## 폴더 구조

프로젝트는 아래 구조를 유지합니다. 에이전트는 임의의 폴더를 추가 생성하지 않습니다.

```
src/                        # Frontend (React)
  components/
    layout/                 # AppShell, Sidebar, Header 등 레이아웃
    characters/             # 캐릭터 선택 그리드, 카드
    mods/                   # 모드 리스트, 모드 카드, 상세 패널
    ui/                     # shadcn/ui 기반 공통 컴포넌트
  pages/                    # 페이지 단위 뷰
  lib/                      # 유틸리티, Tauri invoke 래퍼, 타입 정의
  hooks/                    # 커스텀 React 훅
  stores/                   # 상태 관리 (Context 또는 Zustand)

src-tauri/                  # Backend (Rust + Tauri)
  src/
    commands/               # Tauri Command 핸들러 (Frontend에서 호출)
    core/                   # 비즈니스 로직 (모드 관리, 파일 처리)
    models/                 # 데이터 모델 (Character, Mod, Preset)
    lib.rs                  # Tauri 앱 빌더 및 커맨드 등록
    main.rs                 # 엔트리포인트
  tauri.conf.json           # Tauri 설정 (윈도우, 권한 등)
  Cargo.toml                # Rust 의존성
```

## 데이터 모델

기본 모델은 다음 3개로 고정합니다.

### Character

```typescript
interface Character {
  id: string;            // 고유 식별자 (예: "rover-male")
  name: string;          // 표시 이름 (예: "로버 (남)")
  nameEn: string;        // 영문 이름
  element?: string;      // 속성 (선택)
  rarity?: number;       // 레어리티 (선택)
  thumbnail: string;     // 썸네일 이미지 경로
}
```

### Mod

```typescript
interface Mod {
  id: string;            // 고유 식별자
  characterId: string;   // 대상 캐릭터 ID
  name: string;          // 모드 이름
  description?: string;  // 설명
  author?: string;       // 제작자
  version?: string;      // 버전
  tags?: string[];       // 태그 (예: ["costume", "hair"])
  preview?: string[];    // 프리뷰 이미지 경로 배열
  enabled: boolean;      // 활성화 상태
  path: string;          // 모드 폴더 경로
  createdAt: string;     // 추가 일시
}
```

### Preset

```typescript
interface Preset {
  id: string;            // 고유 식별자
  name: string;          // 프리셋 이름
  description?: string;  // 설명
  enabledMods: string[]; // 활성화할 모드 ID 배열
  createdAt: string;     // 생성 일시
  updatedAt: string;     // 수정 일시
}
```

### mod.json (모드 메타파일)

각 모드 폴더에는 반드시 `mod.json` 파일이 포함되어야 합니다.

```json
{
  "id": "unique-mod-id",
  "name": "Mod Name",
  "characterId": "character-id",
  "description": "모드 설명",
  "author": "Author Name",
  "version": "1.0.0",
  "tags": ["costume"],
  "preview": ["preview1.png", "preview2.png"]
}
```

## Frontend-Backend 통신

- Frontend에서 Backend 호출은 반드시 `invoke` 사용
- 대용량 파일 처리는 Backend(Rust)에서 수행
- Frontend는 UI 렌더링과 상태 관리에만 집중
- Tauri 이벤트 시스템을 통한 비동기 진행 상태 전달 (Import, Backup 등)
