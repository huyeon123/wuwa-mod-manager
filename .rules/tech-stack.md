# 기술 스택 규칙

## Frontend

- **React 18+** + **TypeScript** (strict mode)
- **TailwindCSS** 유틸리티 기반 스타일링
- **shadcn/ui** 기반 컴포넌트 설계
- **Vite** 번들러 (Tauri 기본 설정)

### Frontend 컨벤션

- 컴포넌트는 함수형 컴포넌트만 사용
- 상태 관리는 React Context 또는 Zustand (필요 시)
- Tauri API 호출은 `@tauri-apps/api`의 `invoke`를 사용
- 타입은 별도 `types.ts` 파일에 정의하거나 모델과 함께 배치
- `any` 타입 사용 금지 — 반드시 구체적인 타입을 명시

## Backend

- **Rust** + **Tauri v2** Commands
- 파일 시스템 기반 모드 관리
- MVP 단계에서는 DB 없이 **JSON 파일 저장**으로 충분

### Backend 컨벤션

- Tauri Command는 `#[tauri::command]` 매크로 사용
- 에러 처리는 `Result<T, String>` 또는 커스텀 에러 타입 사용
- 파일 I/O는 반드시 비동기(`tokio::fs`) 사용
- `unwrap()` 금지 — 반드시 에러를 핸들링할 것
- serde를 사용한 직렬화/역직렬화

## 패키지 의존성 규칙

- 새로운 의존성 추가 전에는 반드시 이유를 설명해야 한다
- 불필요하게 무거운 프레임워크 도입 금지
- Tauri 플러그인 추가 시 `tauri.conf.json`의 permissions도 함께 업데이트
