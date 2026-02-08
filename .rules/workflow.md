# 에이전트 작업 규칙

## 작업 방식

- 반드시 작은 단위로 작업한다
- 한 번에 한 컴포넌트 또는 한 기능씩 구현
- 대규모 코드 덤프 금지
- 기존 구조와 스타일을 반드시 따를 것
- 새로운 의존성 추가 전에는 이유를 설명해야 한다

## 코드 작성 규칙

### TypeScript (Frontend)

- 파일명: `PascalCase.tsx` (컴포넌트), `camelCase.ts` (유틸리티)
- 컴포넌트 export: `export function ComponentName()` (default export 지양)
- Props 타입은 컴포넌트 파일 상단에 `interface`로 정의
- 이벤트 핸들러: `handle` 접두사 (예: `handleToggleMod`)

### Rust (Backend)

- 파일명: `snake_case.rs`
- Tauri Command 함수명: `snake_case` (Frontend에서는 camelCase로 호출됨)
- 모듈 구조: `mod.rs` 또는 파일 단위 모듈
- 에러 메시지는 사용자 친화적으로 작성

## 금지 사항

에이전트는 절대 아래 작업을 하지 않습니다.

- 안티치트 우회 기능 구현
- 게임 바이너리 직접 수정
- DLL 인젝션 또는 메모리 패치
- 불필요하게 무거운 프레임워크 도입
- `any` 타입 사용
- `unwrap()` 남용 (Rust)
- 하드코딩된 경로 사용

## 커밋 규칙

- 커밋 메시지는 한국어로 작성
- Conventional Commits 형식 권장: `feat:`, `fix:`, `refactor:`, `chore:`
- 한 커밋에 하나의 논리적 변경만 포함

## 테스트 규칙

- Tauri Command는 단위 테스트 작성 권장
- Frontend 컴포넌트는 주요 상호작용에 대해 테스트 작성
- 파일 시스템 관련 테스트는 임시 디렉토리 사용
