# UI 디자인 시스템

## 디자인 컨셉

**Ethereal Dark** — 에테리얼(몽환적)한 분위기의 다크 UI에 네온 액센트를 더한 게임 런처 스타일.
Glassmorphism 기반의 반투명 패널, 부드러운 블러, 선택/활성 상태에서만 제한적으로 빛나는 Cyan Glow가 핵심.

## 레퍼런스 레이아웃

```
┌─────────────────────────────────────────────────────────────────┐
│  Header (앱 타이틀 + 상단 탭 네비게이션 + 검색/필터)              │
├────────────┬──────────────────────────┬─────────────────────────┤
│  Sidebar   │    Mod Grid (Center)     │    Detail Panel         │
│            │                          │                         │
│  캐릭터     │  "MODS FOR [캐릭터명]     │    MOD DETAILS          │
│  리스트     │   (N installed)"         │                         │
│            │                          │    - 프리뷰 이미지        │
│  - 썸네일   │  ┌──────┐ ┌──────┐      │    - 모드 이름           │
│  - 이름     │  │ Mod  │ │ Mod  │      │    - 제작자              │
│  - 모드 수  │  │ Card │ │ Card │      │    - 버전               │
│            │  │ +토글 │ │ +토글 │      │    - 설명               │
│  선택 시    │  └──────┘ └──────┘      │    - 태그               │
│  Cyan 강조  │  ┌──────┐ ┌──────┐      │    - Enable/Disable 버튼│
│            │  │ Mod  │ │ Mod  │      │                         │
│            │  │ Card │ │ Card │      │                         │
│            │  └──────┘ └──────┘      │                         │
├────────────┴──────────────────────────┴─────────────────────────┤
│  Footer (선택사항: 상태 바, 모드 경로 표시)                       │
└─────────────────────────────────────────────────────────────────┘
```

### 레이아웃 비율

| 영역 | 너비 | 설명 |
|------|------|------|
| Sidebar | `240px` 고정 | 캐릭터 리스트, 접기/펼치기 가능 |
| Mod Grid | `flex-1` (가변) | 모드 카드 그리드, 2~4열 반응형 |
| Detail Panel | `320px` 고정 | 모드 상세 정보, 모드 미선택 시 빈 상태 |

---

## Color Palette

### 기본 팔레트

| 토큰 | 색상 | 용도 |
|------|------|------|
| `--bg-base` | `#0B0E14` | 앱 전체 배경 (Deep Charcoal, Pure Black 아님) |
| `--bg-surface` | `rgba(255, 255, 255, 0.05)` | 카드, 패널 배경 (Glassmorphism) |
| `--bg-surface-hover` | `rgba(255, 255, 255, 0.08)` | 카드/항목 hover 상태 |
| `--bg-surface-active` | `rgba(255, 255, 255, 0.10)` | 카드/항목 active/pressed 상태 |
| `--bg-sidebar` | `rgba(255, 255, 255, 0.03)` | 사이드바 배경 (메인보다 약간 어두움) |
| `--border-default` | `rgba(255, 255, 255, 0.08)` | 기본 border |
| `--border-subtle` | `rgba(255, 255, 255, 0.05)` | 미세한 구분선 |

### 텍스트

| 토큰 | 색상 | 용도 |
|------|------|------|
| `--text-primary` | `#E2E8F0` | 제목, 주요 텍스트 |
| `--text-secondary` | `#94A3B8` | 부제목, 설명 텍스트 |
| `--text-muted` | `#64748B` | 비활성 텍스트, placeholder |
| `--text-on-accent` | `#0B0E14` | Accent 배경 위의 텍스트 |

### 액센트

| 토큰 | 색상 | 용도 |
|------|------|------|
| `--accent-cyan` | `#00F2FF` | Primary — Interactive 요소, Active 상태, 토글 ON |
| `--accent-cyan-hover` | `#00D4E0` | Primary hover 상태 |
| `--accent-cyan-glow` | `rgba(0, 242, 255, 0.3)` | Glow 효과 (box-shadow) |
| `--accent-cyan-subtle` | `rgba(0, 242, 255, 0.1)` | 선택된 항목의 배경 틴트 |
| `--accent-violet` | `#8B5CF6` | Secondary — 태그, 보조 강조, 카테고리 구분 |
| `--accent-violet-hover` | `#7C3AED` | Secondary hover 상태 |
| `--accent-violet-glow` | `rgba(139, 92, 246, 0.25)` | Violet glow 효과 |

### 시맨틱

| 토큰 | 색상 | 용도 |
|------|------|------|
| `--color-danger` | `#EF4444` | 삭제, 에러 |
| `--color-success` | `#22C55E` | 성공, 완료 |
| `--color-warning` | `#F59E0B` | 경고 |

---

## Typography

### 폰트

```
Main Font: 'Inter', 'Pretendard', system-ui, sans-serif
Mono Font: 'JetBrains Mono', 'Fira Code', monospace  (경로, 코드 표시용)
```

### 스케일

| 역할 | 크기 | 무게 | 용도 |
|------|------|------|------|
| Display | `24px` / `1.5rem` | Bold (700) | 앱 타이틀, 섹션 헤더 |
| Title | `18px` / `1.125rem` | SemiBold (600) | 패널 제목, 모드 이름 |
| Body | `14px` / `0.875rem` | Regular (400) | 본문 텍스트, 설명 |
| Small | `12px` / `0.75rem` | Regular (400) | 보조 정보, 메타데이터 |
| Tag/Label | `11px` / `0.6875rem` | Medium (500), `uppercase`, `tracking-wider` | 태그, 라벨, 상태 표시 |

---

## Effects

### Glassmorphism

```css
/* 카드, 패널 공통 */
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}
```

### Glow (Cyan)

```css
/* 선택/활성 상태 */
.glow-cyan {
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.3);
  border-color: #00F2FF;
}

/* 미세한 glow (hover) */
.glow-cyan-subtle {
  box-shadow: 0 0 8px rgba(0, 242, 255, 0.15);
}
```

### Glow (Violet)

```css
.glow-violet {
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.25);
  border-color: #8B5CF6;
}
```

### 트랜지션

```css
/* 모든 인터랙티브 요소 공통 */
transition: all 200ms ease-in-out;
```

---

## 컴포넌트 스타일 가이드

### Sidebar (캐릭터 리스트)

```
- 너비: 240px 고정
- 배경: --bg-sidebar
- 각 항목: 캐릭터 썸네일(작은 원형 or 사각) + 이름 + 모드 수 뱃지
- 기본 상태: --text-secondary, 투명 배경
- Hover: --bg-surface-hover
- 선택됨: 좌측 2px --accent-cyan 바 + --accent-cyan-subtle 배경 틴트 + --text-primary
- 구분: --border-subtle 하단 라인
- 접기 시: 아이콘(썸네일)만 표시
```

### Header (상단 바)

```
- 앱 타이틀 (좌측)
- 탭 네비게이션: [Mods] [Presets] [Settings] 등
- 활성 탭: --accent-cyan 하단 바 + --text-primary
- 비활성 탭: --text-secondary
- 우측: 검색 입력, 필터 아이콘
```

### Mod Card (모드 카드)

```
- 크기: 그리드 반응형 (min 200px)
- 모서리: rounded-xl (12px)
- 배경: glass 효과
- 구조:
  ┌─────────────────┐
  │                 │
  │   썸네일 이미지   │  ← aspect-ratio: 3/4 또는 4/5
  │                 │
  ├─────────────────┤
  │ 모드 이름        │  ← Title 14px, SemiBold
  │ 제작자      [토글]│  ← Small 12px, Secondary + 토글 스위치
  └─────────────────┘

- 기본: --border-default
- Hover: --bg-surface-hover + glow-cyan-subtle
- 선택됨 (상세 보기 중): --accent-cyan border + glow-cyan
- Enabled 모드: 토글 ON (--accent-cyan)
- Disabled 모드: 토글 OFF (--text-muted 배경)
```

### Mod Grid (모드 그리드)

```
- 헤더: "MODS FOR [캐릭터명] (N installed)" — Tag/Label 스타일, uppercase
- 그리드: CSS Grid, auto-fill, minmax(200px, 1fr)
- gap: 16px
- 패딩: 24px
- 빈 상태: 중앙 정렬 placeholder 텍스트 + Import 버튼
```

### Detail Panel (모드 상세)

```
- 너비: 320px 고정
- 배경: glass 효과 (사이드바보다 약간 밝음)
- 헤더: "MOD DETAILS" — Tag/Label 스타일, --text-muted
- 구조:
  ┌─────────────────────┐
  │  MOD DETAILS        │  ← Label, uppercase
  ├─────────────────────┤
  │                     │
  │  프리뷰 이미지 캐러셀  │  ← rounded-lg, 1:1 or 16:9
  │  (< ● ● ● >)       │
  │                     │
  ├─────────────────────┤
  │  모드 이름           │  ← Title
  │  by 제작자           │  ← Small, --text-secondary
  │                     │
  │  v1.0.0             │  ← Tag, --accent-violet 뱃지
  │  #costume #hair     │  ← Tag 뱃지들
  │                     │
  │  설명 텍스트...       │  ← Body, --text-secondary
  │                     │
  ├─────────────────────┤
  │  [  Enable/Disable ]│  ← Cyan 버튼, 전체 너비
  │  [     Delete      ]│  ← Ghost 버튼, --color-danger
  └─────────────────────┘

- 모드 미선택 시: 빈 상태 메시지 ("모드를 선택하세요")
```

### 토글 스위치

```
- 크기: 36px x 20px
- ON: --accent-cyan 배경, 흰색 원형 노브
- OFF: rgba(255, 255, 255, 0.15) 배경, 회색 노브
- 트랜지션: 200ms ease
- 클릭 시 즉시 시각적 반응 (optimistic update)
```

### 버튼

| 종류 | 스타일 |
|------|--------|
| Primary | `bg: --accent-cyan`, `text: --text-on-accent`, `hover: --accent-cyan-hover`, `glow-cyan-subtle` |
| Secondary | `bg: --accent-violet`, `text: white`, `hover: --accent-violet-hover` |
| Ghost | `bg: transparent`, `border: --border-default`, `text: --text-secondary`, `hover: --bg-surface-hover` |
| Danger | `bg: transparent`, `border: --color-danger`, `text: --color-danger`, `hover: bg --color-danger, text white` |

### 태그 뱃지

```
- 배경: rgba(139, 92, 246, 0.15) (Violet 계열) 또는 rgba(0, 242, 255, 0.1) (Cyan 계열)
- 텍스트: 해당 accent 색상
- 크기: Tag/Label 스케일 (11px)
- 모서리: rounded-full
- 패딩: px-2 py-0.5
```

### 검색 / 입력 필드

```
- 배경: rgba(255, 255, 255, 0.05)
- Border: --border-default
- Focus: --accent-cyan border + glow-cyan-subtle
- Placeholder: --text-muted
- 텍스트: --text-primary
- 모서리: rounded-lg
```

---

## Tailwind CSS 설정 가이드

```typescript
// tailwind.config.ts 에서 사용할 커스텀 토큰 예시
const config = {
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0B0E14',
          surface: 'rgba(255, 255, 255, 0.05)',
          'surface-hover': 'rgba(255, 255, 255, 0.08)',
          sidebar: 'rgba(255, 255, 255, 0.03)',
        },
        accent: {
          cyan: '#00F2FF',
          'cyan-hover': '#00D4E0',
          violet: '#8B5CF6',
          'violet-hover': '#7C3AED',
        },
        text: {
          primary: '#E2E8F0',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Pretendard', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backdropBlur: {
        glass: '12px',
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 242, 255, 0.3)',
        'glow-cyan-sm': '0 0 8px rgba(0, 242, 255, 0.15)',
        'glow-violet': '0 0 12px rgba(139, 92, 246, 0.25)',
      },
    },
  },
};
```

---

## 반응형 규칙

- 최소 창 크기: `1024 x 768`
- 데스크톱 전용 (모바일 대응 불필요)
- 사이드바: 접기/펼치기 가능 (아이콘만 모드)
- Detail Panel: 모드 미선택 시 숨김 가능 → Mod Grid 확장
- Mod Grid 열 수: 창 너비에 따라 2~4열 자동 조절

## 이미지 처리

- 모드 썸네일: `lazy loading` + `object-cover`
- 이미지 없는 모드: 기본 placeholder (모드 아이콘 + 이름 텍스트)
- 프리뷰 이미지: Detail Panel 내 캐러셀, 클릭 시 모달 확대
- 캐릭터 썸네일: 사이드바에서 `40x40` 원형 또는 `rounded-lg`

## 애니메이션 규칙

- 모든 인터랙션: `duration-200 ease-in-out`
- 패널 열기/닫기: `duration-300 ease-out`
- 카드 등장: `fade-in + slight scale` (staggered)
- 과도한 애니메이션 금지 — 부드럽고 빠르게
