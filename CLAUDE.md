# WWUA Mod Manager

명조(Wuthering Waves) 모드 관리 데스크톱 앱 — Tauri v2 + React + TypeScript

이 저장소는 AI 에이전트를 활용한 바이브코딩 방식으로 개발됩니다.
모든 에이전트는 아래 규칙 파일들을 반드시 참고합니다.

## 규칙 파일 참조

| 파일 | 언제 참고하는가 |
|------|----------------|
| [.rules/project-overview.md](.rules/project-overview.md) | 프로젝트 목표, MVP 범위, 개발 우선순위를 확인할 때 |
| [.rules/tech-stack.md](.rules/tech-stack.md) | 기술 스택 선택, 의존성 추가, Frontend/Backend 컨벤션을 확인할 때 |
| [.rules/architecture.md](.rules/architecture.md) | 폴더 구조, 데이터 모델(Character/Mod/Preset), Frontend-Backend 통신 패턴을 확인할 때 |
| [.rules/mod-system.md](.rules/mod-system.md) | 모드 Enable/Disable, Import, Backup/Restore, Preset 시스템을 구현할 때 |
| [.rules/design.md](.rules/design.md) | UI 컴포넌트 스타일링, 컬러 팔레트, 레이아웃을 작업할 때 |
| [.rules/workflow.md](.rules/workflow.md) | 코드 작성 규칙, 네이밍 컨벤션, 금지 사항, 커밋/테스트 규칙을 확인할 때 |
| [.rules/tauri-commands.md](.rules/tauri-commands.md) | Tauri Command 구현, API 설계, 에러 처리, 이벤트 패턴을 작업할 때 |

## 핵심 규칙 요약

- **모드 토글은 폴더 이동 방식만 허용** — 런타임 패치, 인젝션 금지
- **Accent Cyan: `#00F2FF` / Violet: `#8B5CF6`** — Ethereal Dark + Glassmorphism
- **작은 단위 작업** — 한 번에 한 컴포넌트/기능씩
- **`any` 금지, `unwrap()` 금지** — 타입 안전성 최우선
