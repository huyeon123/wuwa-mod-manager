# WWUA Mod Manager

명조(Wuthering Waves) 게임의 3DMigoto/XXMI 모드를 관리하는 데스크톱 애플리케이션입니다.

![WWUA Mod Manager Screenshot](./docs/screenshot-placeholder.png)

---

## 주요 기능

- **캐릭터별 모드 관리** — 활성/비활성 토글 (폴더 이동 방식)
- **모드 Import** — ZIP/폴더/드래그 앤 드롭 지원
- **모드 삭제** — 안전한 삭제 및 경고 알림
- **프리뷰 이미지 표시** — 리사이즈 가능한 모드 미리보기
- **단축키 자동 파싱** — 모드 keybindings 자동 감지 및 표시
- **XXMI Launcher 바로가기** — 게임 실행 버튼
- **경로 자동 탐지** — Windows/macOS/Linux 지원
- **사이드바 UI** — 접기/펼치기 + 캐릭터 검색
- **토스트 알림** — 에러/성공/경고 메시지 시스템

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| **Frontend** | React 19 + TypeScript + Vite 6 + TailwindCSS v4 + shadcn/ui |
| **Backend** | Rust + Tauri v2 |
| **디자인** | Dark UI + Glassmorphism (Accent Cyan: `#00F2FF`) |
| **빌드** | Vite 6 (Frontend) + Cargo (Backend) |
| **배포** | Tauri Bundler (.msi / .dmg / .deb / .AppImage) |

---

## 개발 환경 설정

### 필수 요구 사항

- **Node.js** v22 이상
- **Rust** stable (rustup 권장)
- **Tauri CLI v2**
  ```bash
  npm install -g @tauri-apps/cli
  ```

### 프로젝트 클론 및 의존성 설치

```bash
git clone https://github.com/huyeon123/wuwa-mod-manager.git
cd wuwa-mod-manager
npm install
```

---

## 빌드 및 실행

### 개발 모드

```bash
npm run tauri dev
```

Frontend와 Backend가 동시에 실행되며, 핫 리로드가 활성화됩니다.

### 프로덕션 빌드

```bash
npm run tauri build
```

빌드된 설치 파일은 다음 경로에 생성됩니다:
```
src-tauri/target/release/bundle/
```

**지원 플랫폼별 설치 파일:**
- Windows: `.msi` / `.exe` (NSIS)
- macOS: `.dmg`
- Linux: `.deb` / `.AppImage`

---

## 테스트

### Frontend 타입 체크 및 빌드

```bash
npm run build    # TypeScript 타입 체크 + Vite 빌드
```

### Backend 타입 체크 및 테스트

```bash
cd src-tauri
cargo check      # Rust 타입 체크
cargo test       # 단위 테스트 실행 (구현 시)
```

---

## 프로젝트 구조

```
├── src/                    # Frontend (React + TypeScript)
│   ├── components/         # UI 컴포넌트
│   │   ├── CharacterGrid.tsx
│   │   ├── ModCard.tsx
│   │   ├── ModDetailPanel.tsx
│   │   ├── Sidebar.tsx
│   │   └── ui/            # shadcn/ui 기본 컴포넌트
│   ├── lib/               # 유틸리티, 타입, Tauri 커맨드
│   │   ├── commands.ts    # Tauri 커맨드 호출 함수
│   │   ├── types.ts       # 타입 정의
│   │   └── utils.ts       # 공통 유틸리티
│   └── App.tsx            # 메인 앱 컴포넌트
├── src-tauri/             # Backend (Rust + Tauri)
│   └── src/
│       ├── commands/      # Tauri 커맨드 구현
│       │   ├── character.rs
│       │   ├── mod_manager.rs
│       │   └── preset.rs
│       ├── core/          # 비즈니스 로직
│       │   ├── backup.rs
│       │   ├── import.rs
│       │   └── path.rs
│       ├── models/        # 데이터 모델
│       │   ├── character.rs
│       │   ├── mod.rs
│       │   └── preset.rs
│       └── main.rs        # Tauri 엔트리포인트
├── public/                # 정적 파일
│   └── characters/        # 캐릭터 데이터 (JSON + 썸네일)
├── .rules/                # 개발 규칙 문서
│   ├── project-overview.md
│   ├── tech-stack.md
│   ├── architecture.md
│   ├── mod-system.md
│   ├── design.md
│   ├── workflow.md
│   └── tauri-commands.md
└── README.md              # 이 파일
```

---

## 배포

Tauri는 플랫폼별 네이티브 설치 파일을 자동으로 생성합니다.

```bash
npm run tauri build
```

생성된 파일 위치:
```
src-tauri/target/release/bundle/
├── msi/           # Windows Installer
├── nsis/          # Windows NSIS Installer
├── dmg/           # macOS Disk Image
├── deb/           # Debian Package
└── appimage/      # Linux AppImage
```

---

## 라이선스

MIT License

Copyright (c) 2026 YoungHun

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 기여

이슈 및 풀 리퀘스트는 언제든지 환영합니다.

버그 리포트나 기능 제안은 [GitHub Issues](https://github.com/huyeon123/wuwa-mod-manager/issues)에 올려주세요.

---

**Made with 🎮 for Wuthering Waves Community**
