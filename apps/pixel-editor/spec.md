# 픽셀 아트 에디터 — 구현 계획 (spec)

## 1. 개요

- **앱 이름**: 픽셀 에디터 (폴더: `apps/pixel-editor/`, 페이지 제목: `픽셀 에디터 · woogi.log`)
- **한 줄 설명**: 16×16 격자에 도트를 찍어 픽셀 아트를 그리고 PNG로 저장하는 에디터.
- **블로그 카드 문구**
  - 제목: `픽셀 에디터`
  - 설명: `16×16 격자에 도트를 찍어 그림을 그리고 PNG로 저장하세요. 16색 팔레트, 채우기·스포이트, 되돌리기 지원.`
  - 라벨(태그): `tool`, `art`

## 2. 그리기 기능

### 포함 (필수)
| 도구/기능 | 동작 | 단축키 |
|---|---|---|
| **연필** (기본 도구) | 클릭한 칸을 현재 색으로 칠함. 누른 채 드래그하면 지나간 칸을 연속으로 칠함(빠른 드래그에도 칸이 비지 않도록 직전 칸~현재 칸 사이를 직선 보간) | `B` |
| **지우개** | 칸을 빈 칸(투명)으로. 드래그 연속 지우기 동일 | `E` |
| **채우기** | 누른 칸과 **같은 색(빈 칸 포함)으로 상하좌우 연결된 영역**을 현재 색으로 채움. 드래그 없음(누를 때 한 번) | `F` |
| **스포이트** | 누른 칸의 색을 현재 색으로 가져온 뒤 **자동으로 연필로 복귀**. 빈 칸이면 색 변화 없이 안내(`빈 칸에는 색이 없습니다`) | `I` |
| **되돌리기 / 다시하기** | 획 단위 히스토리(최대 100단계, 메모리만, 새로고침 시 초기화) | `Ctrl/⌘+Z` / `Ctrl/⌘+Shift+Z`, `Ctrl+Y` |
| **전체 지우기** | 그림이 비어 있지 않으면 `confirm('그림을 모두 지울까요?')` 후 지움. 이 동작도 히스토리에 들어가 되돌리기 가능 | 없음(실수 방지) |
| **격자선 표시 토글** | 칸 경계선 표시/숨김. 기본 켜짐, 설정 저장. PNG에는 격자선이 들어가지 않음 | `G` |

- **획(stroke) = 히스토리 1단계**: `pointerdown`부터 `pointerup`/`pointercancel`까지의 변경을 한 번에 커밋. 아무 칸도 바뀌지 않은 획(같은 색 위 칠하기 등)은 커밋하지 않는다.
- 채우기에서 대상 색과 현재 색이 같으면 아무 일도 하지 않는다(히스토리 미기록).
- 단축키는 포커스가 `input`/`select`/`textarea`가 아닐 때만, `Ctrl/⌘` 조합은 되돌리기·다시하기에만 사용(`event.preventDefault()`). 한글 입력 상태 대비 `event.code`(`KeyB` 등)로 판정.

### 범위 밖
14절 참고(도형, 선택·이동, 확대/축소, 좌우 대칭 등).

## 3. 팔레트

- **기본 16색 고정 팔레트**: PICO-8 팔레트(픽셀 아트용으로 널리 쓰이는 균형 잡힌 16색) → **사용자 확인 필요 1**.

| # | 이름 | 값 | # | 이름 | 값 |
|---|---|---|---|---|---|
| 1 | 검정 | `#000000` | 9 | 빨강 | `#ff004d` |
| 2 | 남색 | `#1d2b53` | 10 | 주황 | `#ffa300` |
| 3 | 자주 | `#7e2553` | 11 | 노랑 | `#ffec27` |
| 4 | 진초록 | `#008751` | 12 | 연두 | `#00e436` |
| 5 | 갈색 | `#ab5236` | 13 | 하늘 | `#29adff` |
| 6 | 진회색 | `#5f574f` | 14 | 보라 | `#83769c` |
| 7 | 회색 | `#c2c3c7` | 15 | 분홍 | `#ff77a8` |
| 8 | 흰색 | `#fff1e8` | 16 | 살구 | `#ffccaa` |

- **사용자 지정 색 1칸**: 팔레트 끝의 `<input type="color">`(라벨 `직접 선택`). 값을 바꾸면 그 색이 현재 색이 되고, 이 칸의 견본도 그 색으로 바뀐다. 마지막 지정 색은 설정에 저장. 스포이트로 팔레트에 없는 색을 가져오면 이 칸 값으로 들어간다.
- **현재 색 표시**: 도구 막대 옆에 큰 견본(40×40) + 모노 글꼴 hex 텍스트(`#ff004d`). 선택된 팔레트 칸에는 선택 링 표시.
- **기본 현재 색**: `#ff004d`(빨강). 다크 배경에서 바로 눈에 보이는 색.
- **색 값 형식**: 항상 소문자 `#rrggbb` 7자 문자열. 알파(반투명)는 없다. 외부 입력(저장소, color input)은 `normalizeColor()`로 검증 후 사용.

### 블로그 "색은 토큰으로만" 규칙과의 관계 (예외 처리)
- 이 규칙은 **UI 크롬**(배경, 글자, 버튼, 테두리, 체커보드, 격자선, 선택 링)에 적용한다. `style.css`에는 hex/rgb 값을 `:root` 토큰 정의 외에 쓰지 않는다.
- **그림 픽셀 색과 팔레트 견본 색은 사용자 데이터**이므로 예외다.
  - 기본 팔레트는 CSS가 아닌 **JS 데이터**(`editor.js`의 `DEFAULT_PALETTE` 상수, 이름+값)로 둔다.
  - 화면에는 JS에서 `element.style.backgroundColor = color`로만 적용한다(검증된 `#rrggbb`만).
  - 픽셀 색은 테마(다크/라이트)와 관계없이 **그대로** 표시한다. PNG 결과와 화면 색이 같아야 하기 때문.
  - 이 예외를 `style.css`와 `editor.js` 상단 주석에 한 줄로 명시한다.

## 4. 투명 배경

- 빈 칸은 데이터상 `null`(투명).
- 화면에서는 **체커보드**로 표시: 보드 배경에 `conic-gradient`로 칸당 2×2 체크 무늬(`background-size: calc(100% / 16)`).
- 체커보드 색은 앱 전용 토큰 `--checker-a`, `--checker-b`(무채색 회색, 3절 예외가 아닌 UI 크롬):
  - 다크: `#2a2a2a` / `#383838`, 라이트: `#ffffff` / `#e2e2e2`.
  - 검정·흰색 픽셀이 체커와 비슷해 보일 수 있으므로 격자선을 기본으로 켜 둔다(경계 구분).
- **PNG 저장 시 투명 유지**(빈 칸 알파 0). 배경색 채우기 옵션은 두지 않는다(범위 밖).

## 5. PNG 저장

- **배율 선택** `<select>`: `1× (16px)`, `8× (128px)`, `16× (256px)` **기본**, `32× (512px)`. 선택값은 설정에 저장 → **사용자 확인 필요 3**.
- **생성**: 화면 DOM과 무관하게 `grid` 데이터로 새 `<canvas>`(width = height = 16 × scale)를 만들고, 칠해진 칸마다 `ctx.fillRect(x*scale, y*scale, scale, scale)`. 빈 칸은 그리지 않음(투명). `ctx.imageSmoothingEnabled = false`. 정수 좌표만 사용하므로 경계가 뭉개지지 않는다.
- **다운로드**: `canvas.toBlob(cb, 'image/png')` → `URL.createObjectURL(blob)` → 임시 `<a download="파일명">` 클릭 → `URL.revokeObjectURL`(다음 틱). `toBlob`이 `null`을 주면 `PNG를 만들지 못했습니다` 안내.
- **파일 이름**: `pixel-art-YYYYMMDD-HHmmss.png`(로컬 시각, 예: `pixel-art-20261021-153045.png`).
- 빈 그림도 저장 허용(완전 투명 PNG). 저장 후 상태 줄에 `256×256 PNG로 저장했습니다`.
- **화면 표시 뭉개짐 방지**: 보드는 DOM 칸(CSS grid)이므로 흐려질 일이 없다. 미리보기 등 이미지로 확대 표시하는 곳이 있다면 `image-rendering: pixelated`를 준다.
- 픽셀 값 계산은 DOM 없이 테스트할 수 있도록 순수 함수 `toRgbaPixels()`로 분리하고, canvas는 그 결과를 `putImageData`로 그리는 방식도 허용한다(둘 중 하나로 통일, 테스트는 `toRgbaPixels` + 실제 canvas 왕복 둘 다).

## 6. 작업 보존

- **자동 저장**: 히스토리 커밋(획 끝, 채우기, 전체 지우기, 되돌리기/다시하기) 직후 `localStorage`에 저장. 드래그 중에는 저장하지 않는다.
- **키**(블로그 키와 충돌 방지 접두사):
  - `apps.pixel-editor.drawing` → `{"v":1,"size":16,"pixels":[256개, "#rrggbb" 또는 null]}` (행 우선, index = y*16 + x)
  - `apps.pixel-editor.settings` → `{"v":1,"color":"#ff004d","customColor":"#00e5ff","gridLines":true,"scale":16}`
- 읽기·쓰기 모두 `try/catch`. 실패하거나 데이터가 형식에 맞지 않으면(`v`/`size` 불일치, 길이 다름, 잘못된 색) **무시하고 빈 그림/기본 설정**으로 시작(오류 없이 동작). 쓰기 실패는 조용히 무시(첫 실패 시 한 번만 상태 줄에 `이 브라우저에서는 자동 저장이 되지 않습니다`).
- 히스토리와 현재 도구는 저장하지 않는다(새로고침하면 연필, 되돌리기 없음).
- 그림은 한 장만 보관(여러 장 관리는 범위 밖).

## 7. 입력

### 마우스·터치·펜 (Pointer Events)
- 보드 요소 하나에 `pointerdown`/`pointermove`/`pointerup`/`pointercancel`을 건다(칸마다 리스너 달지 않음).
- 좌표 → 칸: `getBoundingClientRect()` 기준 `x = floor((clientX - left) / width * 16)`, 0~15로 제한. 보드 밖이면 무시.
- `pointerdown`: 마우스는 왼쪽 버튼(`button === 0`)만. `setPointerCapture`. **첫 포인터만 추적**(`activePointerId`), 두 번째 손가락은 무시.
- `pointermove`(누른 상태, 연필/지우개): 직전 칸과 현재 칸이 다르면 `linePoints()`로 사이 칸까지 칠함.
- `pointerup`/`pointercancel`: 획 커밋.
- **스크롤 방지**: 보드에 `touch-action: none`, `user-select: none`, `-webkit-touch-callout: none`, `contextmenu` 이벤트 `preventDefault`(길게 누르기 메뉴 방지). `body`에 `overscroll-behavior: none`.
- **호버 표시**(마우스만): 누르지 않은 상태에서 포인터 아래 칸에 커서 테두리.

### 키보드 (접근성: 키보드만으로 그리기 가능)
- 보드는 `tabindex="0"` 포커스 가능한 요소 하나. 내부에 **칸 커서**(시작 위치 7,7)를 둔다.
- 보드에 포커스가 있을 때:
  - 방향키: 커서 1칸 이동(가장자리에서 멈춤), `Shift+방향키`: 4칸 이동. `preventDefault`로 스크롤 방지.
  - `Space`/`Enter`: 현재 도구를 커서 칸에 적용(연필/지우개는 1칸, 채우기, 스포이트). 1회 = 히스토리 1단계.
  - `Home`/`End`: 행의 처음/끝, `Ctrl+Home`/`Ctrl+End`: 보드 처음/끝(선택).
- 전역 단축키(2절 표): `B` `E` `F` `I` `G`, `Ctrl/⌘+Z`, `Ctrl/⌘+Shift+Z`, `Ctrl+Y`.
- 커서는 키보드로 조작했을 때만 표시(`:focus-visible` 상태에서 표시, 포인터로 그리면 숨김).

## 8. 화면 구성

### 375px (기본, 1열)
```
┌──────────────────────────────┐  좌우 여백 16px
│ ← 블로그         [PNG 저장]  │  상단 바 (nav)
│ > pixel_editor_              │  제목 (모노, 깜빡이는 커서)
│ ┌──────────────────────────┐ │
│ │ 보드 343×343 (정사각)     │ │  16×16, 칸 약 21px
│ │ 체커보드 + 격자선         │ │
│ └──────────────────────────┘ │
│ [✎][⌫][▣][◉] │ [↶][↷]      │  도구 4 + 되돌리기/다시하기 (각 44×44 이상)
│ ■ #ff004d  [격자선✓] [지우기]│  현재 색 + 토글 + 전체 지우기
│ ┌─────── 팔레트 6열 ───────┐ │  16색 + 직접 선택(2칸 폭) = 6열×3행
│ │ ■ ■ ■ ■ ■ ■              │ │  견본 약 50px
│ │ ■ ■ ■ ■ ■ ■              │ │
│ │ ■ ■ ■ ■ [ 직접 선택 ]    │ │
│ └──────────────────────────┘ │
│ 배율 [16× (256px) ▾]         │  내보내기 설정
│ 상태 줄 (aria-live)           │  muted
└──────────────────────────────┘
```
- 도구 버튼은 아이콘(인라인 SVG, `currentColor`) + 시각적으로 숨긴 텍스트, `title`/`aria-label`에 이름과 단축키(`연필 (B)`). 아이콘 대신 짧은 한글 라벨(`연필` 등)만 써도 됨 — 375px에서 6개가 한 줄에 들어가야 한다(44px × 6 + 간격 ≈ 300px).
- **보드 크기**: `width: min(100%, 512px)`, `aspect-ratio: 1`. 컨테이너 최대 폭 `560px`, 가운데 정렬. 375px에서 칸 ≈ 21.4px.
- 보드 구조: `.board`(체커 배경, CSS grid `repeat(16, 1fr)`) 안에 칸 256개(`.px`, `aria-hidden="true"`) + 그 위 격자선 오버레이(`.grid-lines`, `pointer-events: none`, `linear-gradient` 2개, 색 `--line`) + 커서 요소(`.cursor-cell`, `--x`/`--y` 변수로 위치). `gridLines`가 꺼지면 오버레이에 `hidden`.
- 시맨틱: `<header>`(뒤로가기, 제목, PNG 저장 버튼), `<main>`(보드, 도구, 팔레트, 내보내기, 상태 줄). `← 블로그`는 `../../index.html`, `target="_top"`.
- 375×667에서 팔레트까지는 스크롤 조금 허용(보드+도구가 첫 화면에 보이면 됨). 가로 스크롤은 절대 없음.

### 640px ~ 1023px
- 1열 유지, 보드 최대 512px. 팔레트를 **8열×2행 + 직접 선택은 도구 줄 옆**으로 바꿔 견본 44px 이상 유지. 도구·현재 색·토글을 한 줄에 배치.

### 1024px 이상 (2열)
```
[ 보드 512×512 ]   [ 사이드 패널 320px ]
                     도구 (2행 그리드)
                     현재 색 + hex
                     팔레트 4열×4행 + 직접 선택
                     격자선 / 전체 지우기
                     배율 + PNG 저장(큰 버튼)
                     단축키 안내 (muted, 모노)
```
- `display: grid; grid-template-columns: 512px 320px; gap: 40px;` 가운데 정렬. PNG 저장 버튼은 상단 바 대신 사이드 패널로 이동(상단 바 버튼은 1024px 이상에서 숨김, DOM은 하나만 두고 CSS 배치로 처리해도 됨).

## 9. 디자인

### 토큰
- `apps/pixel-editor/style.css`의 `:root`와 `:root[data-theme="light"]`에 블로그 `css/style.css`와 **같은 이름·값**의 토큰을 복사(2048과 동일 목록: `--bg`, `--surface`, `--surface-2`, `--line`, `--grid`, `--text`, `--muted`, `--neon`, `--neon-2`, `--neon-3`, `--on-neon`, `--scrim`, `--glow`, `--glow-2`, `--glow-box`, `--font-sans`, `--font-mono`, `--radius`, `--gutter`). 블로그 CSS를 import하지 않는다.
- 앱 전용 추가 토큰: `--glow-box-2`, `--glow-box-3`(2048과 같은 값, 라이트는 `0 0 0 1px var(--neon-2/3)`), `--checker-a`, `--checker-b`(4절), `--board-max: 512px`, `--swatch: 44px`.
- 배경은 블로그와 같은 옅은 격자.

### 상태 표시
- **선택된 도구**: 테두리·아이콘 `--neon` + `box-shadow: var(--glow-box)`, `aria-pressed="true"`. 비선택: 테두리 `--line`, 아이콘 `--text`.
- **선택된 팔레트 칸**: 견본 색과 무관하게 보이도록 이중 링 — `box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--neon-2)`, `aria-pressed="true"`. 모든 견본에 1px `--line` 테두리(검정 견본이 배경에 묻히지 않게).
- **칸 커서**: 2px `--neon-3` 외곽선 + 안쪽 1px `--bg` 선(어떤 픽셀 색 위에서도 보이게).
- 보드 테두리: 1px `--line` + `var(--glow-box)`.
- 버튼 `:focus-visible`: 2px `--neon-2` 외곽선. 보드 포커스 시 보드 외곽선 `--neon-2`.

### 대비 (WCAG AA)
- 텍스트(라벨, hex, 상태 줄)는 2048과 같은 토큰 조합만 사용 → 다크/라이트 모두 4.5:1 이상. `--muted`는 보조 문구에만.
- 도구 아이콘·선택 링·커서 등 비텍스트 UI는 3:1 이상(다크: 네온 on 검정, 라이트: 진한 네온 on 밝은 배경).
- 그림 픽셀·팔레트 견본 색은 사용자 데이터라 대비 검사 대상에서 제외. 대신 견본마다 `aria-label`(`빨강 #ff004d`)과 hex 텍스트로 색을 글자로도 알린다.
- Review 단계에서 실제 계산값으로 재확인.

### 터치 대상
- 버튼·링크·견본·select: 최소 44×44px.
- **격자 칸은 예외**(375px에서 약 21px). 이유: 16칸을 화면 폭에 넣으면 물리적으로 44px 불가. 보완책: ① 보드를 가능한 한 크게(화면 폭 꽉 채움) ② 드래그 칠하기 ③ 되돌리기 버튼을 보드 바로 아래 배치 ④ 키보드 커서 모드. 이 예외를 spec과 Review 체크리스트에 명시.

### 애니메이션
- 제목 커서 깜빡임, 버튼 hover/선택 전환(120ms, `color`/`box-shadow`/`border-color`)만. 칠하기에는 애니메이션 없음(즉시 반영).
- `@media (prefers-reduced-motion: reduce)`: 모든 `transition`/`animation` 끔.

### 테마
- 2048과 동일: `<head>` 인라인 스크립트에서 `localStorage.theme`이 `light`면 `<html data-theme="light">`(try/catch). 앱 자체 토글 없음 → **사용자 확인 필요 5**.

## 10. 파일 구조

```
apps/pixel-editor/
├── index.html      # 페이지 (viewport meta, 테마 인라인 스크립트, <script type="module" src="ui.js">)
├── style.css       # 앱 전용 스타일 (토큰 복사본 + 체커/격자선 + 레이아웃 + 상태 표시)
├── editor.js       # 순수 로직: 격자 데이터, setPixel, floodFill, linePoints, 직렬화, 히스토리, DEFAULT_PALETTE
├── export.js       # PNG: toRgbaPixels(순수), renderToCanvas, downloadPng, makeFilename
├── storage.js      # localStorage 읽기/쓰기 (try/catch, 형식 검증은 editor.js의 deserialize 사용)
├── ui.js           # DOM 렌더링, 포인터/키보드 입력, 도구·팔레트 상태, 자동 저장 호출, aria-live, 데모 모드
├── tests.html      # editor.js·export.js 단위 테스트 (브라우저에서 열기, 외부 라이브러리 없음)
├── preview.png     # 블로그 카드용 미리보기 1200×630 (데모 모드 화면 캡처)
├── spec.md         # 이 문서
└── plan-instructions.md
```

- 외부 라이브러리·CDN 사용 없음.
- 확인 URL: `http://localhost:8000/apps/pixel-editor/`, 테스트: `http://localhost:8000/apps/pixel-editor/tests.html` (`node serve.mjs`).
- **데모 모드**(`?demo=1`): 미리 정한 그림(네온 색 우주 침략자·하트 등 16×16 도트)을 띄우고, **localStorage를 읽지도 쓰지도 않으며**, `<html class="is-demo">`로 1200×630 캡처용 2열 레이아웃. `preview.png`는 Build 단계에서 Edge 헤드리스 스크린샷으로 만든다(2048과 같은 방식: `msedge.exe --headless --disable-gpu --hide-scrollbars --window-size=1200,630 --screenshot=<절대경로>\preview.png <URL>`). 데모 그림 데이터는 `ui.js` 안 상수(또는 `editor.js`의 테스트 겸용 상수).

## 11. 로직 설계 (`editor.js`, `export.js`)

모든 함수는 **입력을 변경하지 않고** 새 값을 반환한다. 바뀐 것이 없으면 **입력 객체를 그대로 반환**(참조 비교로 "변경 없음" 판정 → 히스토리 커밋 여부 결정).

### 자료형
```js
// Color = string               // 소문자 '#rrggbb'
// Grid  = (Color | null)[][]   // grid[y][x], 16×16, null = 투명
// History = { past: Grid[], present: Grid, future: Grid[], limit: number }
```
- 팔레트 인덱스가 아닌 **색 문자열**로 저장하는 이유: 사용자 지정 색·스포이트 색을 그대로 담을 수 있고, 팔레트가 바뀌어도 그림이 변하지 않으며, PNG 변환이 단순하다.

### `editor.js` 공개 함수
```js
export const SIZE = 16;
export const DEFAULT_PALETTE = [{ name: '검정', value: '#000000' }, /* … 16개 */];

export function createGrid(size = SIZE) → Grid                    // 전부 null
export function inBounds(grid, x, y) → boolean
export function getPixel(grid, x, y) → Color | null               // 범위 밖이면 null
export function setPixel(grid, x, y, color /* Color|null */) → Grid
  // 범위 밖이거나 같은 값이면 grid 그대로. 아니면 해당 행만 복사한 새 Grid
export function setPixels(grid, points /* [{x,y}] */, color) → Grid  // 드래그 한 구간을 한 번에
export function floodFill(grid, x, y, color) → Grid
  // 4방향 연결, 대상 색(null 포함)과 같은 칸만. 반복문 + 스택(재귀 금지). 대상 색 === color면 grid 그대로
export function linePoints(x0, y0, x1, y1) → [{ x, y }]           // 브레젠험, 양 끝 포함
export function isEmpty(grid) → boolean
export function gridEquals(a, b) → boolean
export function normalizeColor(value) → Color | null              // '#ABC'·'#AABBCC' → '#aabbcc', 그 외 null
export function serialize(grid) → { v: 1, size: 16, pixels: (Color|null)[] }
export function deserialize(data) → Grid | null                   // 형식·길이·색 검증 실패 시 null

export function createHistory(grid, limit = 100) → History
export function commit(history, grid) → History                   // grid === present면 그대로. future 비움, past 길이 limit 유지
export function undo(history) → History                           // past 없으면 그대로
export function redo(history) → History
export function canUndo(history) → boolean
export function canRedo(history) → boolean
```

### `export.js`
```js
export function toRgbaPixels(grid, scale) → { width, height, data: Uint8ClampedArray }  // 순수, 빈 칸 [0,0,0,0]
export function hexToRgb(color) → [r, g, b]
export function renderToCanvas(grid, scale, canvas?) → HTMLCanvasElement               // DOM 사용
export function downloadPng(grid, scale, filename) → Promise<void>                     // toBlob + <a download>
export function makeFilename(date = new Date()) → string                               // 'pixel-art-YYYYMMDD-HHmmss.png'
```

### `storage.js`
```js
export function loadDrawing() → Grid | null
export function saveDrawing(grid) → boolean        // 실패 시 false
export function loadSettings() → Settings          // 기본값과 병합, 잘못된 값은 기본값
export function saveSettings(settings) → boolean
```

### `ui.js` 흐름
1. 데모 여부 확인 → (데모 아니면) `loadSettings()`, `loadDrawing()` → `createHistory(grid)` → 칸 256개 생성 후 렌더.
2. 획 시작: `working = history.present`. 칠할 때마다 `working = setPixels(working, points, color)` → 바뀐 칸만 DOM 갱신.
3. 획 끝: `history = commit(history, working)` → 바뀌었으면 `saveDrawing`, 되돌리기 버튼 `disabled` 갱신.
4. 되돌리기/다시하기: 이전·다음 grid와 현재 DOM 비교해 바뀐 칸만 갱신, 저장.
5. 렌더는 `style.backgroundColor`(검증된 색) / `''`, `textContent`, `className`, `dataset`, `setAttribute`만 사용. `innerHTML` 미사용.
6. 상태 줄(`aria-live="polite"`)에 도구 변경(`채우기 도구`), 색 변경(`빨강 #ff004d 선택`), 되돌리기(`되돌림`), 저장(`256×256 PNG로 저장했습니다`), 전체 지우기, 키보드 커서 이동 시 `x 3, y 5: 빨강 #ff004d` / `x 3, y 5: 빈 칸` 알림.

### `tests.html` 테스트 케이스 (최소)
- `createGrid`: 16×16, 모두 null.
- `setPixel`: 값 설정, 원본 불변, 같은 값이면 같은 참조, 범위 밖(-1, 16)이면 같은 참조.
- `linePoints`: (0,0)→(3,0) 4점, (0,0)→(3,3) 대각 4점, (2,5)→(2,5) 1점, 역방향(5,1)→(1,3)에 양 끝 포함·빈틈 없음(연속 점 간 거리 ≤1).
- `floodFill`: 빈 보드 전체 채움(256칸), 닫힌 사각형 테두리 안쪽만 채움, 대각선으로만 닿은 칸은 안 채움, 같은 색이면 같은 참조, 칠해진 영역의 색 바꾸기.
- `normalizeColor`: `'#FF004D'`→`'#ff004d'`, `'#abc'`→`'#aabbcc'`, `'red'`/`'#12345'`/`'url(x)'`/`null` → null.
- `serialize`/`deserialize` 왕복 일치, 잘못된 데이터(`v` 다름, 길이 255, 잘못된 색, 문자열 JSON 아님) → null.
- 히스토리: commit 3회 → undo 2회 → redo 1회 상태 확인, undo 후 commit 시 future 비움, limit 초과 시 가장 오래된 것 제거, 같은 grid commit은 무시.
- `toRgbaPixels`: scale 1에서 (3,2)=`#ff004d` → 해당 픽셀 `[255,0,77,255]`, 빈 칸 알파 0. scale 16에서 크기 256×256, 칸 (3,2)의 네 모서리 픽셀(48,32)·(63,47) 색 일치, (64,32)는 다른 칸 값.
- **canvas 왕복**: `renderToCanvas(grid, 16)` 후 `getImageData`로 각 칸 중앙 픽셀이 grid 색과 같은지(빈 칸 알파 0), 칸 경계 양쪽 픽셀이 중간색으로 섞이지 않았는지.
- `makeFilename(new Date(2026, 9, 21, 15, 30, 45))` → `'pixel-art-20261021-153045.png'`.
- 결과를 통과/실패 개수와 함께 페이지에 표시하고 실패 시 `console.error`.

## 12. 접근성

- 보드: `role="application"`(방향키를 앱이 직접 처리하므로), `aria-label="16×16 그림판. 방향키로 칸 이동, 스페이스로 현재 도구 적용"`, `aria-describedby`로 단축키 안내 연결. 칸 256개는 `aria-hidden="true"`(전체 낭독은 범위 밖, 커서 위치 알림으로 대체).
- 도구 버튼: `aria-pressed`, `aria-label="연필 (B)"`. 되돌리기/다시하기는 불가능할 때 `disabled`.
- 팔레트: `role="group"` + `aria-label="팔레트"`, 견본 버튼 `aria-label="빨강 #ff004d"`, `aria-pressed`. 직접 선택은 `<label>`로 연결된 `<input type="color">`.
- 격자선 토글: `<button aria-pressed>` (또는 체크박스).
- 배율: `<label for>` 연결된 `<select>`.
- 모든 버튼·링크 `:focus-visible` 표시, Tab 순서: 상단 바 → 보드 → 도구 → 현재 색/토글 → 팔레트 → 배율 → 저장.
- `<html lang="ko">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, `.sr-only` 유틸리티.

## 13. 검증 기준 (Review 체크리스트)

동작
- [ ] `tests.html` 전부 통과.
- [ ] 연필: 클릭 1칸, 빠른 드래그에도 칸 빠짐 없이 연속 칠해짐. 지우개 동일.
- [ ] 채우기: 닫힌 영역만 채워지고 대각선으로 새지 않음. 빈 칸 영역 채우기 동작.
- [ ] 스포이트: 색을 가져오고 연필로 복귀. 팔레트 밖 색은 직접 선택 칸으로 들어감. 빈 칸은 안내만.
- [ ] 되돌리기/다시하기: 드래그 한 번이 1단계. 전체 지우기도 되돌릴 수 있음. 버튼 `disabled` 상태가 맞음.
- [ ] 전체 지우기: 비어 있지 않을 때 확인창, 취소하면 그대로.
- [ ] 격자선 토글이 화면에만 적용되고 PNG에는 들어가지 않음.
- [ ] 단축키 `B E F I G`, `Ctrl/⌘+Z`, `Ctrl/⌘+Shift+Z`, `Ctrl+Y` 동작. color input·select에 포커스일 때 단축키 비활성.
- [ ] 새로고침 후 그림·현재 색·직접 선택 색·격자선·배율이 유지됨. localStorage 차단 상태에서도 오류 없이 동작.
- [ ] localStorage에 잘못된 값을 넣고(`localStorage.setItem('apps.pixel-editor.drawing', '{"v":1}')`) 새로고침 → 빈 그림으로 정상 시작.
- [ ] 데모 모드(`?demo=1`)가 localStorage를 바꾸지 않음.

PNG 저장
- [ ] 각 배율(1/8/16/32)로 저장한 파일 크기가 16/128/256/512px 정사각형.
- [ ] 파일 이름이 `pixel-art-YYYYMMDD-HHmmss.png` 형식.
- [ ] **픽셀 값 확인**: 알려진 패턴(예: 네 모서리에 서로 다른 색, 가운데 한 칸 비움)을 그려 16×로 저장 → 브라우저 콘솔에서 저장 파일(또는 같은 grid로 만든 blob)을 `Image`로 불러 canvas에 그린 뒤 `getImageData`로 각 칸 중앙 픽셀의 RGBA가 그린 색과 같고 빈 칸 알파가 0인지 확인.
- [ ] 확대해 봐도 칸 경계가 흐리지 않음(경계 양옆 픽셀이 정확히 두 색 중 하나).
- [ ] 투명 영역이 저장 파일에서 투명(체커보드나 배경색이 들어가지 않음).

모바일·레이아웃
- [ ] 375px에서 가로 스크롤 없음, 좌우 여백 16px 이상, 보드가 정사각형이고 화면 폭에 맞음.
- [ ] 모바일 에뮬레이션에서 터치 드래그로 연속 칠하기, 그리는 중 페이지 스크롤·당겨서 새로고침·길게 누르기 메뉴 없음. 두 손가락 터치 시 이상 동작 없음.
- [ ] 640px, 1024px에서 8절 배치대로 보이고 1024px 이상에서 보드+사이드 패널 2열.
- [ ] 버튼·견본·select 44×44px 이상(격자 칸은 예외로 문서화됨).

디자인·접근성
- [ ] 다크/라이트(`localStorage.theme = 'light'`) 모두에서 UI 텍스트 AA 4.5:1, 선택 링·커서가 잘 보임.
- [ ] 픽셀 색이 테마와 관계없이 동일하게 표시됨.
- [ ] `style.css`에 토큰 정의 외 색상값 직접 사용 없음. 그림 색은 JS 데이터에서만 옴(예외 주석 존재).
- [ ] 키보드만으로 도구 선택 → 보드 이동 → 칠하기 → 되돌리기 → PNG 저장까지 가능, 포커스 표시가 보임, 커서 위치가 `aria-live`로 알려짐.
- [ ] `prefers-reduced-motion: reduce`에서 애니메이션 꺼짐.

코드
- [ ] 브라우저 콘솔 오류·경고 없음.
- [ ] `editor.js`에 DOM·`localStorage` 참조 없음. `export.js`의 `toRgbaPixels`·`makeFilename`은 DOM 없이 동작.
- [ ] `innerHTML` 미사용, `const`/`let`, 2칸 들여쓰기, 세미콜론, 작은따옴표, 한국어 주석.
- [ ] `apps/pixel-editor/` 밖의 파일 변경 없음.

## 14. 범위 밖

- 격자 크기 변경(8×8, 32×32 등), 확대/축소·이동(줌/팬).
- 레이어, 애니메이션 프레임, 어니언 스킨.
- PNG/이미지 불러오기, SVG·GIF 내보내기, 배경색 채워 저장.
- 직선·사각형·원 도구, 선택·복사·이동, 좌우/상하 대칭 그리기, 브러시 크기.
- 반투명(알파) 색, 팔레트 편집·저장·교체(직접 선택 1칸만), 최근 사용 색 목록.
- 여러 그림 관리, 히스토리 영구 저장, 공유 링크.
- 앱 내부 테마 토글(블로그 설정만 따름).
- 스크린리더용 그림 전체 낭독.
- 블로그 `index.html` 카드 추가(Embed 단계에서 별도 진행).

## 사용자 확인 필요

> **2026-10-21 승인**: 사용자가 계획서를 승인했고, 아래 6가지는 모두 추천안대로 확정했습니다.

1. **기본 팔레트**: 픽셀 아트에 널리 쓰이는 **PICO-8 16색**을 추천합니다(어두운 색~밝은 색, 피부색까지 고르게 있음). 블로그 네온 느낌을 살린 자체 16색 팔레트를 원하시면 알려주세요.
2. **전체 지우기 확인**: 그림이 있을 때만 `confirm()` 확인창을 띄우고, 지운 뒤에도 되돌리기로 복구할 수 있게 하는 것을 추천합니다. 확인창 없이(되돌리기만) 가도 됩니다.
3. **PNG 배율**: 1×/8×/16×/32× 중 선택(기본 16× = 256×256)을 추천합니다. 단순하게 256×256 고정으로 해도 됩니다.
4. **자동 저장**: 그림 한 장을 `localStorage`에 자동 저장해 새로고침 후에도 이어 그리게 하는 것을 추천합니다(히스토리는 저장 안 함).
5. **테마·블로그 카드**: 2048과 같이 앱 내부 토글 없이 블로그 테마를 따르고, 블로그 카드는 `preview.png` + 링크 방식을 추천합니다(iframe에서는 드래그 칠하기가 페이지 스크롤과 충돌할 수 있음).
6. **키보드 그리기 / 스포이트·채우기**: 접근성을 위해 키보드 커서 그리기를 포함하고, 구현 비용이 작은 채우기·스포이트도 포함으로 정했습니다. 범위를 줄이고 싶으면 알려주세요.
