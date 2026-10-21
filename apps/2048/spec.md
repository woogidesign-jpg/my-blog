# 2048 — 구현 계획 (spec)

## 1. 개요

- **앱 이름**: 2048 (폴더: `apps/2048/`, 페이지 제목: `2048 · woogi.log`)
- **한 줄 설명**: 방향키나 스와이프로 숫자 타일을 밀어 같은 숫자를 합치고, 2048 타일을 만드는 퍼즐 게임.
- **블로그 카드 문구**
  - 제목: `2048`
  - 설명: `같은 숫자를 밀어 합쳐 2048을 만드세요. 방향키·WASD·스와이프 지원, 최고 점수 저장.`
  - 라벨(태그): `game`, `puzzle`

## 2. 기능 목록

### 보드
- 4×4 고정 보드. 시작 시 빈 보드에 타일 2개 생성.

### 이동·합치기 규칙
- 한 방향 입력에 모든 타일이 그 방향 끝까지 미끄러진다.
- 같은 값의 타일이 이동 방향으로 맞닿으면 하나로 합쳐지고 값은 2배가 된다.
- **한 번의 이동에서 한 타일은 한 번만 합쳐진다.** 예) `[2,2,4,0]` 왼쪽 → `[4,4,0,0]` (8 아님).
- 합치기는 **이동 방향 쪽 타일부터** 짝을 짓는다. 예) `[2,2,2,0]` 왼쪽 → `[4,2,0,0]`, 오른쪽 → `[0,0,2,4]`.
- `[2,2,2,2]` 왼쪽 → `[4,4,0,0]`.
- 아무 타일도 움직이지 않은 입력(`moved: false`)은 무시: 새 타일 생성 없음, 점수 변화 없음, 애니메이션 없음.

### 새 타일 생성
- 유효한 이동 후 빈 칸 중 무작위 1곳에 생성. 값은 **2(90%) / 4(10%)**.
- 난수는 함수 인자(`rng`)로 주입해 테스트에서 고정할 수 있게 한다.

### 점수
- 합쳐서 생긴 타일 값의 합만큼 점수 증가 (2+2 → +4).
- **최고 점수**: 현재 점수가 최고 점수를 넘으면 즉시 갱신하고 `localStorage`의 `apps.2048.best` 키에 저장. 읽기·쓰기 모두 `try/catch`로 감싸고, 실패하면 메모리 값만 사용(오류 없이 동작).
  - 키에 접두사를 붙이는 이유: 블로그와 같은 origin이라 `theme` 등 블로그 키와 충돌하지 않게 하기 위함.

### 승리 / 게임 오버
- **승리**: 이동 결과 보드에 2048 타일이 처음 생기면 승리 오버레이 표시. 버튼: `계속하기`, `새 게임`.
  - `계속하기`를 누르면 `keepPlaying = true`가 되고 이후 2048 이상이 생겨도 다시 띄우지 않는다.
- **게임 오버**: 새 타일 생성 후 빈 칸이 없고, 상하좌우로 인접한 같은 값도 없으면 게임 오버 오버레이. 버튼: `다시 하기`.
- 오버레이가 떠 있는 동안 이동 입력은 무시한다.

### 새 게임
- 헤더의 `새 게임` 버튼: 확인 없이 즉시 초기화(점수 0, 타일 2개). 최고 점수는 유지.

## 3. 입력

| 입력 | 동작 | 비고 |
|---|---|---|
| `ArrowUp/Down/Left/Right` | 이동 | `event.preventDefault()`로 페이지 스크롤 방지 |
| `W/A/S/D` (대소문자 무관) | 이동 | `event.key.toLowerCase()`로 판정. 한글 입력 상태는 `event.code`(`KeyW` 등)로 보완 |
| 터치 스와이프 | 이동 | 보드 영역에서만. 아래 참고 |

- 키 입력은 `document`에서 받되, **포커스가 `input`/`textarea`/`button`이 아닐 때만**(버튼에서 Enter/Space는 버튼 동작) 처리. `ctrl`/`meta`/`alt` 조합은 무시.
- 키 반복(`event.repeat`)은 허용하되, 애니메이션 중 입력이 오면 직전 애니메이션을 즉시 끝내고(최종 상태로 스냅) 새 이동을 처리한다. 입력을 버리지 않는다.
- **스와이프**: Pointer Events(`pointerdown`/`pointerup`, `pointerType === 'touch'` 또는 `'pen'`) 사용.
  - 이동 거리 `max(|dx|, |dy|) >= 30px`일 때만 인정, 큰 축 방향으로 판정.
  - 보드에 `touch-action: none`, `body`에 `overscroll-behavior: none`을 줘서 스와이프 중 스크롤·당겨서 새로고침 방지.
  - 마우스 드래그는 지원하지 않는다(범위 밖).

## 4. 화면 구성 (375px 기준)

```
┌──────────────────────────────┐  좌우 여백 16px
│ ← 블로그          [새 게임]  │  상단 바 (nav)
│ > 2048_                      │  제목 (모노, 깜빡이는 커서)
│ ┌─ SCORE ─┐ ┌─ BEST ──┐      │  점수판 2칸 (가로 배치)
│ │   1,204 │ │   3,880 │      │
│ └─────────┘ └─────────┘      │
│ ┌──────────────────────────┐ │
│ │  보드 343×343 (정사각)    │ │  보드
│ │  간격 8px, 타일 약 77px   │ │
│ └──────────────────────────┘ │
│ 방향키·WASD 또는 스와이프로   │  안내 문구 (muted)
│ 타일을 밀어 2048을 만드세요.  │
└──────────────────────────────┘
```

- 시맨틱: `<header>`(뒤로가기 링크, 제목, 점수판, 새 게임 버튼), `<main>`(보드, 안내 문구), `<footer>`는 생략 가능.
- `← 블로그` 링크는 `../../index.html`. iframe 안에서 열릴 경우에도 동작하도록 `target="_top"`.
- **보드 크기**: `width: min(100%, 440px)`, `aspect-ratio: 1`. 컨테이너 최대 폭 `480px`, 가운데 정렬. 640px 이상에서는 그대로 가운데 정렬만(레이아웃 확장 없음).
- 보드 구조: 배경 칸 16개(`.cell`, CSS grid) + 그 위에 절대 위치 타일 레이어(`.tile-layer`). 타일 위치는 CSS 변수 `--r`, `--c`로 `transform: translate(calc(var(--c) * (100% + var(--gap))), calc(var(--r) * (100% + var(--gap))))` 계산(타일 크기 = `(100% - 3*gap) / 4`).
- **점수 증가 표시**: 점수 숫자 옆에 `+8` 이 위로 떠오르며 사라지는 작은 라벨(장식용, `aria-hidden`).
- **오버레이**: 보드 위를 덮는 반투명 막(`--scrim`) + 가운데 메시지와 버튼.
  - 승리: `> 2048 달성!` / `계속하기` `새 게임`
  - 게임 오버: `> GAME OVER` / `점수 1,204` / `다시 하기`
- 점수 표시는 `toLocaleString('ko-KR')`로 천 단위 구분.
- 페이지 높이가 화면보다 작으면 스크롤 없이 한 화면에 들어가는 것을 목표로 한다(375×667 기준).

## 5. 디자인

### 토큰
- `apps/2048/style.css`의 `:root`에 블로그 `css/style.css`와 **같은 이름·값**의 토큰을 복사해 둔다(`--bg`, `--surface`, `--surface-2`, `--line`, `--grid`, `--text`, `--muted`, `--neon`, `--neon-2`, `--neon-3`, `--on-neon`, `--scrim`, `--glow`, `--glow-2`, `--glow-box`, `--font-sans`, `--font-mono`, `--radius`, `--gutter`). 블로그 CSS를 import하지 않는다.
- 앱 전용 추가 토큰(색은 늘리지 않고 기존 네온에서 파생):
  - `--glow-3: 0 0 4px rgba(255, 79, 216, 0.6), 0 0 12px rgba(255, 79, 216, 0.3);` (라이트: `none`)
  - `--glow-box-2`, `--glow-box-3`: `--glow-box`와 같은 형식으로 청록/마젠타 버전 (라이트: `0 0 0 1px var(--neon-2)` / `var(--neon-3)`)
  - `--gap: 8px`, `--tile-radius: var(--radius)`, `--move-ms: 110ms`
- 컴포넌트에서 색상값을 직접 쓰지 않는다. 배경은 블로그와 같은 옅은 격자.

### 타일 값별 스타일 (네온 3색 × 단계)
숫자가 항상 보이므로 색만으로 구분하지 않는다. 단계는 **외곽선 → 글로우 → 채움** 순으로 강해진다.

| 값 | 배경 | 테두리 | 글자색 | 효과 |
|---|---|---|---|---|
| 2 | `--surface-2` | `--line` | `--text` | 없음 |
| 4 | `--surface-2` | `--muted` | `--text` | 없음 |
| 8 | `--surface` | `--neon-2` | `--neon-2` | 없음 |
| 16 | `--surface` | `--neon-2` | `--neon-2` | `box-shadow: var(--glow-box-2)` |
| 32 | `--surface` | `--neon-3` | `--neon-3` | 없음 |
| 64 | `--surface` | `--neon-3` | `--neon-3` | `var(--glow-box-3)` |
| 128 | `--surface` | `--neon` | `--neon` | 없음 |
| 256 | `--surface` | `--neon` | `--neon` | `var(--glow-box)` |
| 512 | `--neon-2` (채움) | `--neon-2` | `--on-neon` | `var(--glow-box-2)` |
| 1024 | `--neon-3` (채움) | `--neon-3` | `--on-neon` | `var(--glow-box-3)` |
| 2048 | `--neon` (채움) | `--neon` | `--on-neon` | `var(--glow-box)` + 느린 맥동 |
| 4096+ | 2048과 동일 | | | 맥동 없음 |

- 클래스: `.tile.tile-2` … `.tile.tile-2048`, 그 이상은 `.tile-super`.
- **글자 크기**(자릿수 기준, 모노 폰트, 굵게): 1~2자리 `2rem`, 3자리 `1.6rem`, 4자리 `1.25rem`, 5자리 이상 `1rem`. 클래스 `.digits-3` 등으로 지정. 375px에서 4자리 숫자가 타일 안에 들어가야 한다.
- 타일 숫자에는 `text-shadow`를 넣지 않는다(가독성). 글로우는 `box-shadow`로만.

### 대비 (WCAG AA 4.5:1 이상)
- 다크: `--text`(#d9ffec), `--neon-*`가 `--surface`(#050d09)/`--surface-2` 위에서 모두 4.5:1 이상. 채움 타일은 `--on-neon`(#000) on 네온 → 모두 7:1 이상.
- 라이트: 블로그 라이트 토큰을 그대로 사용(`--neon` #0b7a22, `--neon-2` #006b7d, `--neon-3` #a8127f, `--on-neon` #fff). 흰 글자 on 진한 네온 채움, 진한 네온 글자 on 흰 `--surface` 모두 4.5:1 이상.
- `--muted`는 안내 문구와 4 타일 **테두리**에만 사용(테두리는 텍스트 대비 대상 아님).
- Review 단계에서 실제 계산값으로 재확인한다.

### 애니메이션
- **이동**: 타일 `transform` 전환 `var(--move-ms)` `ease-out`.
- **등장**(새 타일): `scale(0) → scale(1)`, 120ms, 이동이 끝난 뒤 시작(`animation-delay: var(--move-ms)`).
- **합치기**: 합쳐진 새 타일이 `scale(1) → 1.12 → 1`, 140ms, 이동 후 시작. 합쳐져 사라지는 원본 타일 2개는 목적지까지 이동한 뒤 제거.
- **점수 +N**: 위로 20px 떠오르며 투명해짐, 500ms.
- **제목 커서** 깜빡임, **2048 타일 맥동**(glow 밝기 1.6s 반복).
- `@media (prefers-reduced-motion: reduce)`: 위 모든 `transition`/`animation`을 끈다(`--move-ms: 0ms`, `animation: none`). JS도 `matchMedia`로 확인해 애니메이션 대기 시간을 0으로 처리.
- 애니메이션 속성은 `transform`/`opacity`만 사용(레이아웃 재계산 없음).

### 테마
- 기본은 검은 배경 네온. `<head>` 인라인 스크립트에서 블로그와 같은 `localStorage`의 `theme` 키를 읽어 `light`면 `<html data-theme="light">`를 붙인다(try/catch). 앱 자체 토글은 두지 않는다 → **사용자 확인 필요 1** 참고.

## 6. 파일 구조

```
apps/2048/
├── index.html      # 게임 페이지 (viewport meta, 테마 인라인 스크립트, <script type="module" src="ui.js">)
├── style.css       # 앱 전용 스타일 (토큰 복사본 + 레이아웃 + 타일 단계 + 애니메이션)
├── game.js         # 순수 게임 로직 (DOM·localStorage·Math.random 직접 접근 없음)
├── ui.js           # DOM 렌더링, 입력(키보드·스와이프), 오버레이, 최고 점수 저장, aria-live
├── storage.js      # 최고 점수 읽기/쓰기 (try/catch 래퍼) — ui.js에서만 사용
├── tests.html      # game.js 단위 테스트 페이지 (브라우저에서 열기, 외부 라이브러리 없음)
├── preview.png     # 블로그 카드용 미리보기 (1200×630 권장, 게임 진행 중 화면 캡처)
├── spec.md         # 이 문서
└── plan-instructions.md
```

- 외부 라이브러리·CDN 사용 없음.
- 확인 URL: `http://localhost:8000/apps/2048/`, 테스트: `http://localhost:8000/apps/2048/tests.html` (`node serve.mjs`).
- `preview.png`는 Build 단계에서 브라우저 스크린샷으로 만든다(만들 수 없으면 Embed 단계에서 iframe으로 대체).

## 7. 로직 설계 (`game.js`)

모든 함수는 **입력을 변경하지 않고 새 값을 반환**하는 순수 함수. 방향은 문자열 `'up' | 'down' | 'left' | 'right'`.

### 자료형
```js
// Tile  = { id: number, value: number }
// Board = (Tile | null)[][]   // board[row][col], 4×4
// State = {
//   board, score: number, nextId: number,
//   won: boolean,        // 2048 달성 여부
//   keepPlaying: boolean,// '계속하기' 선택 여부
//   over: boolean        // 게임 오버 여부
// }
```
타일 `id`는 애니메이션에서 DOM 요소를 추적하기 위해 쓴다. 값만 비교하는 테스트를 위해 `toValues(board) → number[][]`(빈 칸 0)를 제공한다.

### 공개 함수
```js
export const SIZE = 4;
export const WIN_VALUE = 2048;

export function createEmptyBoard(size = SIZE) → Board
export function fromValues(values, startId = 1) → { board, nextId }   // 테스트용: 숫자 배열 → Board
export function toValues(board) → number[][]

// 한 줄(왼쪽으로 민다고 가정)을 처리하는 핵심 규칙
export function slideLine(line /* (Tile|null)[] */, nextId)
  → { line, scoreGained, moved, merges: [{ id, value, index, from: [idA, idB] }], nextId }

// 보드 전체 이동: 방향에 맞게 행/열을 뽑아 slideLine 적용 후 되돌림
export function move(board, direction, nextId)
  → { board, scoreGained, moved,
      merges:  [{ id, value, row, col, from: [idA, idB] }], // 새로 생긴 합친 타일
      removed: [{ id, row, col }],                           // 합쳐져 사라진 원본과 그 목적지
      nextId }

export function getEmptyCells(board) → [{ row, col }]
export function spawnTile(board, rng, nextId)
  → { board, tile: { id, value, row, col } | null, nextId }  // rng() < 0.9 → 2, 아니면 4. 빈 칸 = cells[floor(rng() * n)]
export function hasValue(board, value) → boolean
export function canMove(board) → boolean                     // 빈 칸 있음 || 인접 같은 값 있음

export function newGame(rng) → { state, spawned: Tile[] }    // 빈 보드 + spawnTile 2회
export function step(state, direction, rng)
  → { state, moved, scoreGained, merges, removed, spawned }  // move → (moved면) spawnTile → won/over 판정
export function continueGame(state) → state                  // keepPlaying = true
```

### 규칙 메모
- `slideLine`: null 제거 → 앞에서부터 순회하며 `a.value === b.value`면 새 Tile(`id = nextId++`, `value*2`)로 합치고 둘 다 소비(같은 이동에서 재합치기 없음) → 뒤를 null로 채움. `moved`는 원래 줄과 결과의 타일 `id` 위치가 하나라도 다르면 true.
- `move`의 방향 변환: `left` 그대로, `right` 줄 뒤집기, `up` 열 기준, `down` 열 뒤집기. 결과 좌표 변환을 한 곳(헬퍼 함수)에서 처리.
- `step`의 판정 순서: 이동 → 점수 가산 → 새 타일 → `won = state.won || hasValue(board, WIN_VALUE)` → `over = !canMove(board)`.
- UI는 `won`이 이번 step에서 false→true로 바뀌고 `keepPlaying`이 false일 때만 승리 오버레이를 띄운다.
- `rng`는 `() => number(0 이상 1 미만)`. 테스트에서는 고정 수열을 반환하는 함수를 넘긴다.

### `ui.js` 흐름
1. `newGame(Math.random)` → 렌더.
2. 입력 → 방향 → `step()` → `moved`가 false면 종료.
3. 렌더: 기존 `id`의 요소는 `--r/--c`만 갱신(이동 전환), `removed`는 목적지로 옮긴 뒤 `--move-ms` 후 제거, `merges`/`spawned`는 새 요소 생성(클래스 `tile-merged`/`tile-new`).
4. 점수·최고 점수 갱신, `+N` 라벨, `aria-live` 메시지.
5. 승리/게임 오버면 오버레이 표시 후 첫 버튼에 포커스.
- 렌더는 `textContent`와 `className`/`style.setProperty`만 사용, `innerHTML` 미사용.

### `tests.html` 테스트 케이스 (최소)
- `slideLine`: `[2,2,0,0]→[4,0,0,0]`(+4), `[2,2,2,0]→[4,2,0,0]`, `[2,2,2,2]→[4,4,0,0]`(+8), `[2,2,4,0]→[4,4,0,0]`(+4, 8 아님), `[4,0,0,4]→[8,0,0,0]`, `[2,4,8,16]` 그대로 `moved:false`, `[0,0,0,2]→[2,0,0,0]` `moved:true`.
- `move` 네 방향 각각 한 보드로 결과 확인, `removed`의 목적지 좌표 확인.
- 이동 불가 방향: `moved:false`, 보드 동일, 새 타일 없음.
- `spawnTile`: rng 고정 시 위치·값(0.95 → 4, 0.5 → 2) 확인, 빈 칸 없으면 `tile: null`.
- `canMove`: 꽉 찼지만 인접 같은 값 있음 → true, 없음 → false.
- `step`: 2048 생성 시 `won:true`, 마지막 이동 후 막히면 `over:true`.
- 입력 불변성: `move` 후 원래 `board`가 바뀌지 않았는지.
- 결과를 통과/실패 개수와 함께 페이지에 표시하고 실패 시 `console.error`.

## 8. 접근성

- **키보드**: 방향키·WASD로 전체 플레이 가능. `새 게임`·오버레이 버튼은 Tab으로 접근, `:focus-visible` 외곽선(`--neon-2`) 표시.
- 보드는 `role="group"` + `aria-label="2048 게임 보드"`, 타일 요소는 `aria-hidden="true"`(보드 전체 낭독은 범위 밖).
- **점수 알림**: 시각적으로 숨긴(`.sr-only`) `<p aria-live="polite">`에 점수가 오른 이동에서만 `8점 획득, 현재 120점` 형식으로 갱신. 승리/게임 오버는 `오버레이 제목`을 같은 영역에 `2048 달성!` / `게임 오버, 최종 점수 1,204점`으로 알린다.
- 점수판 숫자에는 `aria-live`를 직접 걸지 않는다(매 이동마다 중복 낭독 방지).
- **오버레이**: `role="dialog"`, `aria-labelledby`(오버레이 제목), 표시 시 첫 버튼으로 포커스 이동, 닫히면 보드(`tabindex="-1"`)로 포커스 복귀.
- **터치 대상**: 버튼·링크 모두 최소 `44×44px`.
- `<html lang="ko">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`.

## 9. 검증 기준 (Review 체크리스트)

동작
- [ ] `tests.html` 전부 통과.
- [ ] 방향키 4방향·WASD 동작, 이동 시 페이지가 스크롤되지 않음.
- [ ] 한 번 이동에 한 타일은 한 번만 합쳐짐(`2 2 2 2` → `4 4`).
- [ ] 움직이지 않는 방향 입력 시 새 타일이 생기지 않음.
- [ ] 점수 증가량이 합친 값의 합과 같음. 최고 점수가 새로고침 후에도 유지됨.
- [ ] localStorage 차단(시크릿 모드 등) 상태에서도 오류 없이 플레이 가능.
- [ ] 2048 달성 오버레이 → `계속하기` 후 계속 플레이, 다시 뜨지 않음. (콘솔에서 테스트용 보드 주입 또는 `fromValues`로 확인)
- [ ] 게임 오버 오버레이 → `다시 하기`로 초기화.
- [ ] `새 게임` 버튼이 언제든 초기화하고 최고 점수는 유지.
- [ ] 빠르게 연속 입력해도 타일이 겹치거나 사라지는 표시 오류 없음.

모바일·레이아웃
- [ ] 375px 너비에서 가로 스크롤 없음, 좌우 여백 16px 이상, 보드가 정사각형.
- [ ] 모바일 에뮬레이션에서 스와이프 4방향 동작, 스와이프 중 페이지 스크롤·새로고침 없음.
- [ ] 4자리 숫자(1024, 2048)가 375px에서 타일 안에 들어감.
- [ ] 버튼·링크 44×44px 이상.

디자인·접근성
- [ ] 다크/라이트(`localStorage.theme = 'light'`) 모두에서 모든 타일 숫자가 읽힘(AA 4.5:1).
- [ ] 컴포넌트 CSS에 색상값 직접 사용 없음(토큰만).
- [ ] `prefers-reduced-motion: reduce`에서 애니메이션이 꺼지고 게임은 정상 동작.
- [ ] 키보드만으로 오버레이 버튼까지 조작 가능, 포커스 표시가 보임.
- [ ] 점수 획득 시 `aria-live` 영역 텍스트가 갱신됨.

코드
- [ ] 브라우저 콘솔 오류·경고 없음.
- [ ] `game.js`에 DOM·`localStorage`·`Math.random` 직접 참조 없음.
- [ ] `innerHTML` 미사용, `const`/`let`, 2칸 들여쓰기, 세미콜론, 작은따옴표, 한국어 주석.
- [ ] `apps/2048/` 밖의 파일 변경 없음.

## 10. 범위 밖

- 되돌리기(undo), 보드 크기 변경(3×3, 5×5 등), 난이도 설정.
- 진행 중인 게임 저장/복원(새로고침하면 새 게임으로 시작).
- 마우스 드래그 조작, 게임패드.
- 앱 내부 테마 토글(블로그 설정만 따름).
- 온라인 랭킹, 공유 기능, 효과음.
- 스크린리더용 보드 전체 낭독.
- 블로그 `index.html` 카드 추가(Embed 단계에서 별도 진행).

## 사용자 확인 필요

> **2026-10-21 승인**: 사용자가 계획서를 승인했고, 아래 5가지는 모두 추천안대로 확정했습니다.

1. **테마**: 앱에 토글 버튼을 따로 두지 않고, 블로그에서 고른 테마(`localStorage.theme`)를 그대로 따르는 것을 추천합니다. 앱 안에도 토글이 필요하면 알려주세요.
2. **블로그 카드 형태**: `preview.png` 이미지 + 클릭 시 `apps/2048/`로 이동하는 방식을 추천합니다. iframe으로 직접 플레이하게 하면 방향키·스와이프가 블로그 페이지 스크롤과 충돌할 수 있습니다.
3. **새 게임 확인창**: 진행 중에도 확인 없이 바로 초기화하는 것을 추천합니다(조작 단순화). 실수 방지용 확인을 원하면 알려주세요.
4. **진행 중 게임 저장**: 이번에는 범위 밖으로 두었습니다(최고 점수만 저장). 새로고침 후 이어하기가 필요하면 범위에 넣겠습니다.
5. **WASD**: 지침상 선택 사항이지만 구현 비용이 작아 포함으로 정했습니다.
