# SLATE 쇼핑몰 (모바일) — 구현 계획 (spec)

## 1. 개요

- **앱 이름**: SLATE 쇼핑몰 (폴더: `apps/slate-shop/`, 페이지 제목: 홈 `SLATE · woogi.log`, 상세 `{상품명} · SLATE · woogi.log`)
- **한 줄 설명**: 디자인 캔버스 "SLATE 메인 홈페이지"의 모바일 홈과 상품 상세를 순수 HTML·CSS·JS로 옮긴 패션 쇼핑몰 데모. 홈 ↔ 상세를 오가며 필터·찜·옵션 선택·장바구니 담기를 체험한다.
- **디자인 원본**: `Mobile.dc.html`(홈 390×2120), `ProductDetail.dc.html`(상세 390×2000), `ds/wl/tokens.*`(테두리 `#888`, 그림자, 간격 8px, 반경 4px, Helvetica). `.dc.html` 형식(`<sc-for>`, `{{ }}`, `DCLogic`)은 쓰지 않고 구조·치수·문구만 옮긴다.
- **모바일 전용**: 390px 기준 폰 화면 하나. 640/1024px 확장 레이아웃은 만들지 않는다. 넓은 화면에서는 가운데 폰 폭 컬럼으로 보인다(8절).
- **블로그 카드 문구**
  - 제목: `SLATE 쇼핑몰`
  - 분류(card-meta): `쇼핑몰`
  - 설명: `모노톤 패션 쇼핑몰의 모바일 홈과 상품 상세. 필터·찜·색상/사이즈 선택·장바구니 담기까지 두 화면을 오가며 체험하세요.`
  - 태그: `#shop`, `#ui`

## 2. 화면 연결 방식

### 추천: 한 페이지 안 해시 라우팅
| 해시 | 화면 |
|---|---|
| `''`, `#`, `#/` | 메인 홈 |
| `#/product/{id}` (id = 1~8 정수) | 상품 상세 |
| 그 밖(`#/product/99`, `#/abc`, `#/product/1x`) | 홈 화면 위에 "상품을 찾을 수 없어요" 안내 + `홈으로` 링크(상세 뷰 자리, 4절의 not-found 상태) |

- **추천 이유**: ① 찜·장바구니 상태를 메모리에서 바로 공유(페이지 새로 읽기 없음) ② 홈의 필터·더보기 상태와 스크롤 위치를 뒤로가기 때 그대로 되살리기 쉬움 ③ GitHub Pages 정적 배포에서 그대로 동작 ④ 상품마다 HTML을 만들 필요 없음.
- 대안(HTML 두 장 `index.html` + `product.html?id=3`)은 단순하지만 오갈 때마다 다시 읽고, 상태를 localStorage로만 넘겨야 하며 스크롤 복원이 브라우저 몫이 된다 → **사용자 확인 필요 5**.
- 두 화면은 `index.html` 안의 `<section id="view-home">`, `<section id="view-product">`로 두고 `hidden` 속성으로 하나만 보인다. 공통 요소(블로그 띠, 사용법, 토스트)는 뷰 밖.
- `hashchange` 하나로 라우팅. 첫 로드도 같은 함수로 처리.

### 링크·뒤로가기
- 홈의 상품 이미지·상품명은 진짜 링크 `<a href="#/product/3">`(새 탭 열기 가능).
- **디자인의 `href="#"`는 전부 없앤다.** 해시 라우팅에서 `#`는 홈으로 이동해 버리기 때문. 기능 없는 요소는 `<button type="button">`(3절 "죽은 링크").
- 디자인의 앵커 `#m-new`(히어로 버튼), `#size-guide`(사이즈 가이드)도 해시를 바꾸면 안 되므로 **버튼 + JS 스크롤**로 바꾼다: `target.scrollIntoView({ behavior: 줄이기 설정이면 'auto' 아니면 'smooth', block: 'start' })` 후 대상 제목에 `focus({ preventScroll: true })`(제목에 `tabindex="-1"`). 고정 헤더에 가리지 않도록 대상에 `scroll-margin-top: var(--sl-header-h)`.
- **상세의 뒤로(←)**: 홈에서 앱 안 이동으로 들어왔으면(`cameFromHome` 플래그) `history.back()`, 아니면(상세 주소로 바로 열었으면) `location.hash = '#/'`. 그래서 앱 밖으로 나가지 않는다.
- **로고 SLATE**: 홈 `<a href="#/">`. 홈에서 누르면 맨 위로 스크롤.
- **브라우저 뒤로/앞으로**: `hashchange`로 그대로 동작.

### 스크롤 위치
- `history.scrollRestoration = 'manual'`(지원 시).
- 홈을 떠날 때 `window.scrollY`를 메모리에 저장 → 상세에서 홈으로 돌아오면(뒤로·로고·탭 홈 모두) 렌더 후 그 위치로 복원. 홈에서 로고/탭 `홈`을 누르면 맨 위.
- 상세에 들어갈 때는 항상 맨 위(`scrollTo(0, 0)`).
- 홈의 필터 칩·더보기 상태는 메모리에 유지(돌아와도 같은 목록). 저장은 하지 않는다.

### 상세가 보여 줄 상품
- 디자인 상세는 코트 하나뿐이므로 **상품 8개 각각에 가격·색상·사이즈·설명·스펙·사이즈표를 데이터로 넣어 상세를 상품별로 채운다**(`data.js`, 7절 표).
- 디자인 상세 내용(차콜·카멜·오트밀, S/M/L/XL 중 XL 품절, 189,000원)은 **1번 상품**에 넣는다. 상품명은 홈 디자인 이름(`울 블렌드 싱글 코트`)을 쓴다(상세 디자인 이름 `울블렌드 오버핏 코트`는 홈 목록에 없음) → **사용자 확인 필요 2**.
- 상세에 들어올 때마다 선택 상태 초기화: 색 0번, 사이즈 없음(사이즈가 하나뿐인 상품은 자동 선택), 수량 1, 이미지 1, 경고·담김 문구 없음.

## 3. 핵심 기능

### 포함 (필수)
| 기능 | 화면 | 동작 |
|---|---|---|
| **필터 칩** | 홈 신상품 | `전체·아우터·상의·하의·액세서리` 5개, 하나만 선택(`aria-pressed`). 고르면 목록 다시 그림, 더보기 상태 초기화 |
| **신상품 목록 + 더보기** | 홈 | 필터 결과 중 처음 4개(디자인과 같음). `신상품 더보기`를 누르면 나머지 모두 표시 후 버튼 숨김. 결과가 4개 이하면 버튼 숨김. 새로 보인 첫 상품 링크로 포커스 이동 |
| **찜(하트)** | 홈 카드, 상세 구매 바 | 상품 id 단위 토글. 홈·상세·탭 바 `찜 N`이 같은 데이터. `aria-pressed`, `aria-label="{상품명} 찜하기"/"{상품명} 찜 해제"`. 저장(6절) |
| **장바구니 개수** | 홈·상세 헤더 | 장바구니 아이콘에 담긴 총 수량 배지(0이면 숨김, 99 초과는 `99+`). `aria-label="장바구니, N개"`. 아이콘을 누르면 토스트 `장바구니에 N개 담겨 있어요 (장바구니 화면은 데모에서 제공하지 않아요)` |
| **카테고리 탐색** | 홈 | 8개 중 칩과 같은 이름(아우터·상의·하의·액세서리)은 그 필터를 적용하고 신상품 섹션으로 스크롤. 나머지(원피스·가방·신발·라이프)는 토스트 |
| **히어로 버튼** | 홈 | `신상품 보러가기` → 신상품 섹션으로 스크롤(2절) |
| **이미지 이전/다음** | 상세 | 1~5 순환(1에서 이전 → 5). 카운터 `n / 5`, 이미지 자리 `aria-label="{상품명} {색상명} 이미지 n / 5"`. 터치 스와이프도 지원(7절) |
| **색상 선택** | 상세 | 스와이치 버튼(`aria-pressed`, `aria-label=색상명`), 범례 옆 `· 색상명`. 바꾸면 이미지 문구·요약 갱신, 담김 문구 숨김 |
| **사이즈 선택** | 상세 | 4열 버튼. 품절은 `disabled` + `aria-label="XL 품절"` + 취소선. 고르면 경고 숨김, 담김 문구 숨김 |
| **사이즈 미선택 경고** | 상세 | 사이즈 없이 `장바구니`/`구매하기` → `! 사이즈를 선택해 주세요`(`role="alert"`)를 모델 정보 자리에 표시, 사이즈 영역으로 스크롤하고 첫 선택 가능 사이즈 버튼에 포커스 |
| **선택 요약 + 수량 + 합계** | 상세 | 사이즈를 고르면 표시. `{색상} / {사이즈}`, `−`/`+`(1~10, 끝에서 해당 버튼 `disabled`), 수량 `aria-live="polite"`, 합계 `가격×수량` 천 단위 콤마 + `원` |
| **장바구니 담기** | 상세 구매 바 | 사이즈 있으면 장바구니에 추가(같은 상품·색·사이즈면 수량 합침, 한 줄 최대 99), 헤더 배지 갱신, 구매 바 위 `장바구니에 담았어요 · {색} / {사이즈} · {n}개`(`role="status"`). 옵션을 바꾸면 문구 숨김 |
| **구매하기** | 상세 구매 바 | 사이즈 없으면 경고. 있으면 토스트 `데모라 결제는 진행되지 않아요` |
| **사이즈 가이드 앵커** | 상세 | 버튼 → `#size-guide` 영역 스크롤 + 제목 포커스(2절) |
| **공유** | 상세 헤더 | `navigator.share({ title, url })` 있으면 사용(취소 `AbortError`는 무시), 없으면 `navigator.clipboard.writeText(location.href)` → 토스트 `링크를 복사했어요`, 둘 다 실패 → `링크를 복사하지 못했어요` |

### 죽은 링크 처리 (디자인에만 있고 기능이 없는 것)
- 대상: 메뉴(☰), 검색창 제출, 카테고리 `전체 →`, 카테고리 4개(원피스·가방·신발·라이프), 탭 바 `카테고리`·`검색`·`찜`·`마이`, 상세 `리뷰`·`상품 문의`·`배송·교환·반품 안내`.
- **추천**: 모양은 디자인 그대로 두고 `<button type="button">`으로 만들어, 누르면 토스트 `{이름}은(는) 데모에서 준비 중이에요` 표시 → **사용자 확인 필요 3**.
  - 검색창: `<form role="search">` 안 `<input type="search">`. 입력은 되고, 제출(Enter)하면 토스트 `검색은 데모에서 준비 중이에요`.
  - 탭 바 `찜 N`: 토스트 `찜한 상품 N개 · 찜 목록은 준비 중이에요`.
  - 신상품 `전체 →`: 필터를 `전체`로 바꾸고 모두 펼침(실제 동작).
  - 탭 바 `홈`: `<a href="#/">`, 홈에서는 맨 위로 스크롤. `aria-current="page"`.
- 토스트: 화면 하단 바 위에 뜨는 한 줄(`role="status"`, `aria-live="polite"`), 2.5초 후 사라짐, 새 메시지가 오면 교체.

### 범위 밖
13절 참고(결제, 실제 검색, 장바구니·찜 목록 화면, 메뉴 서랍 등).

## 4. 사용법 안내 (디자인에 없는 요소)

- **블로그 띠**(뷰 밖, 페이지 맨 위, 높이 44px, `--sl-fill` 배경): 왼쪽 `← 블로그`(`../../index.html`, `target="_top"`), 오른쪽 `사용법` 접이식(`<details class="sl-help">` + `<summary>`, 최소 44×44).
- 펼친 안내 문구(작은 글씨, 목록):
  - `상품 사진이나 이름을 누르면 상세 화면으로 가요. 왼쪽 위 ← 나 SLATE 로고로 돌아와요.`
  - `칩으로 카테고리를 고르고, 하트로 찜해 보세요. 찜은 홈과 상세에서 함께 바뀌어요.`
  - `상세에서 색상·사이즈·수량을 고른 뒤 장바구니에 담으면 위쪽 장바구니 숫자가 올라가요.`
  - `찜과 장바구니는 이 브라우저에만 저장돼요. 결제·검색·회원 기능은 없는 데모예요.`
- **상단 검은 띠 배너**(디자인 `신규 회원 첫 구매 [혜택 내용]`)는 `데모 쇼핑몰 · 실제 주문과 결제는 되지 않아요`로 바꿔 데모임을 늘 보이게 한다.
- 위치·문구 → **사용자 확인 필요 4**.

## 5. 색 — 디자인 흑백 고정 (B안, 사용자 확정)

**사용자 확정(2026-10-21): B안.** 디자인 그대로 흰 배경 + `#111` 흑백으로 고정하고 블로그 테마(다크/라이트)를 따르지 않는다. CLAUDE.md의 "블로그 색상 팔레트를 따른다" 규칙과 다른 결정이며, 사용자가 알고 고른 예외다.

### 불러오기
- 블로그 `../../css/style.css`를 **불러오지 않는다**(전역 규칙·다크 배경·네온 링크가 섞이지 않게). 앱 `style.css` 하나만 쓴다.
- 테마 인라인 스크립트(`localStorage.theme`)는 **넣지 않는다**. `:root { color-scheme: light; }`.
- 앱 `style.css` 맨 위 주석에 "사용자 확정 B안: 디자인 흑백 고정, 블로그 팔레트 예외"를 한 줄로 적는다.

### 앱 토큰 (`apps/slate-shop/style.css` `:root`, 디자인 값 그대로)
| 앱 토큰 | 값 | 쓰임 |
|---|---|---|
| `--sl-bg` | `#FFFFFF` | 컬럼 배경, 하단 바, 수량 상자 |
| `--sl-page` | `#F4F4F4` | 431px 이상에서 컬럼 바깥 배경 |
| `--sl-text` | `#111111` | 본문, 아이콘 |
| `--sl-muted` | `#555555` | 보조 글자 |
| `--sl-body` | `#333333` | 상품 설명 문단 |
| `--sl-fill` | `#EDEDED` | 이미지 자리 |
| `--sl-fill-2` | `#F4F4F4` | 검색창, 8px 구분 띠, 요약 상자, 사이즈표 머리, 품절 버튼, 블로그 띠 |
| `--sl-divider` | `#888888` | 디자인 `--wl-1` 구분선·칩·사이즈 테두리 (비텍스트 3:1 이상: #888 on #fff ≈ 3.5:1) |
| `--sl-divider-soft` | `#DDDDDD` | 사이즈표 행·링크 목록 행 구분선(장식) |
| `--sl-ink` | `#111111` | 채운 버튼·선택 칩/사이즈·배너·NEW 배지·찜 하트 채움·경고 글자 |
| `--sl-on-ink` | `#FFFFFF` | 그 위 글자 |
| `--sl-scrim-light` | `rgba(255,255,255,0.85)` | 이미지 위 이전/다음 버튼 |
| `--sl-scrim-dark` | `rgba(17,17,17,0.8)` | 이미지 카운터 |
| `--sl-shadow` | `0 1px 2px rgba(0,0,0,0.2)` | 하단 바(디자인 `--WLS`) |
| `--sl-radius` | `4px` | 디자인 `--WLR` |
| `--sl-font` | `'Helvetica', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif` | 전체 |

- 하트·NEW·경고는 디자인대로 `--sl-ink`(검정). 강조색 없음.
- 컴포넌트 CSS에는 색상값을 직접 쓰지 않는다(위 토큰만). **예외**: 상품 색상 스와치 색은 상품 데이터 → `data.js`에 hex로 두고 JS에서 `el.style.setProperty('--sw', hex)`로 넣는다(검증된 `#rrggbb`만).
- 포커스 표시: `:focus-visible { outline: 2px solid var(--sl-ink); outline-offset: 2px; }`(디자인과 같음). 이미지 위 버튼·탭 바처럼 잘리는 곳만 `outline-offset: -2px`.

### 기본 스타일 (블로그 CSS를 안 불러오므로 앱에서 직접)
- `*, *::before, *::after { box-sizing: border-box; }`, `html { -webkit-text-size-adjust: 100%; }`
- `body { margin: 0; background: var(--sl-page); color: var(--sl-text); font-family: var(--sl-font); font-size: 15px; line-height: 1.5; }`
- `a { color: inherit; text-decoration: none; }`, `button { font: inherit; color: inherit; }`, `h1, h2, h3 { margin: 0; }`
- `@media (prefers-reduced-motion: reduce)`: 모든 transition·animation 끄기, `scroll-behavior: auto`(블로그 전역 규칙 대신 앱에서 직접).
- 클래스는 모두 `sl-` 접두사.

## 6. 작업 보존

- **키**:
  - `apps.slate-shop.wish` → `{"v":1,"ids":[1,4]}` (찜한 상품 id, 중복 없음)
  - `apps.slate-shop.cart` → `{"v":1,"items":[{"productId":1,"color":0,"size":1,"qty":2}]}` (`color`·`size`는 상품 데이터 안 인덱스)
- 찜 토글·장바구니 담기 직후 저장.
- 읽기·쓰기 모두 `try/catch`. JSON 아님, `v` 다름, 배열 아님이면 **빈 값으로 시작**. 항목 단위 검증(`sanitizeWish`/`sanitizeCart`, `shop.js`): 없는 상품 id, 범위 밖 색/사이즈 인덱스, 품절 사이즈, 정수 아닌·1 미만 수량은 그 항목만 버리고 수량은 99로 자른다.
- 쓰기 실패는 조용히 무시, 첫 실패 때 한 번만 토스트 `이 브라우저에서는 찜·장바구니가 저장되지 않아요`.
- 저장하지 않는 것: 필터·더보기·스크롤, 상세 선택 상태(색·사이즈·수량·이미지).
- 데모 모드(`?demo=1`)는 읽지도 쓰지도 않는다.

## 7. 입력

- **터치·마우스·키보드** 모두 일반 `<button>`/`<a>`로 처리(클릭 이벤트). 별도 단축키 없음.
- **이미지 스와이프 (추가)**: 이미지 영역에 Pointer Events(`pointerType`이 `touch`/`pen`). `|dx| >= 40px`이고 `|dx| > |dy|`일 때만 이전/다음. 영역에 `touch-action: pan-y`(세로 스크롤은 살림). 마우스 드래그는 지원하지 않음(버튼으로 충분).
- **포커스 표시**: 블로그 `:focus-visible` 그대로. 모든 버튼·링크·스와치·칩·사이즈·`summary`에 보임.
- **포커스 이동**: 라우트가 바뀌면 그 화면의 `h1`(`tabindex="-1"`)에 `focus({ preventScroll: true })`(스크린리더에 화면 전환 알림). 홈으로 돌아올 때는 방금 눌렀던 상품 링크가 아직 있으면 그 링크로 포커스.
- 스크롤 이동에 쓰는 `focus()`는 모두 `preventScroll: true`(교훈: 짧은 화면에서 튐 방지).

## 8. 화면 구성

### 공통 틀
- 컬럼 `.sl-app`: `width: 100%; max-width: var(--sl-max)` (`--sl-max: 430px`), `margin-inline: auto`, `min-height: 100vh`, `background: var(--sl-bg)`. 390px에서는 디자인과 같은 폭, 360·375px에서는 유연하게 줄어든다. 431px 이상에서는 가운데 컬럼 + 바깥 블로그 배경.
- **헤더**: `position: sticky; top: 0; z-index: 20; background: var(--sl-bg)`. 높이 52px(`--sl-header-h`). 블로그 띠는 헤더 위에 두고 함께 스크롤되어 사라진다.
- **하단 탭 바(홈)**·**구매 바(상세)**: `position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: var(--sl-max)`. `padding-bottom: calc(원래값 + env(safe-area-inset-bottom))`. 각 뷰 본문에 바 높이만큼 아래 여백(`--sl-tabbar-h: 64px`, `--sl-buybar-h: 76px`, 담김 문구가 보이면 +28px — JS가 아닌 CSS 클래스 `.has-status`로 처리).
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- 가로 스크롤 없음(필터 칩 줄만 자체 가로 스크롤, `scrollbar-width: none`은 쓰지 않음 — 스크롤 가능함이 보이게 둠).
- 667×375(가로) 화면: 헤더 52 + 구매 바 76 → 본문 247px 이상 남음. 허용.

### 홈 (390 기준, 위에서 아래)
```
┌──────────────────────────────┐
│ ← 블로그              사용법 ▾│  블로그 띠 44px (4절)
│ 데모 쇼핑몰 · 실제 주문과 …   │  배너 12px, --sl-ink 배경
│ [☰]      S L A T E      [🛍2]│  헤더 sticky, 버튼 44×44, 로고 22px 700 자간 .24em
│ ┌ 🔍 상품, 브랜드 검색 ──────┐│  검색 44px, --sl-fill, 여백 12/16
│ ┌──────────────────────────┐ │
│ │ 캠페인 이미지 자리 400px  │ │  히어로
│ └──────────────────────────┘ │
│ 2026 FALL / WINTER           │  12px 자간 .16em muted
│ 가을의 결을 / 입는 시간       │  h1 32px 700
│ 소개 문구                     │  15px muted
│ [     신상품 보러가기      ]  │  48px --sl-ink 채움
│ 카테고리 탐색          전체 → │  h2 20px, 위 여백 48
│ □ □ □ □ / □ □ □ □           │  4열 8개, 간격 16/12, 라벨 13px
│ 신상품                 전체 → │
│ (전체)(아우터)(상의)(하의)(액…)│  칩 36px → 터치 44 확보(9절)
│ [NEW ♡] [NEW ♡]               │  2열 3:4 카드, 간격 32/12
│ 카테고리·상품명·가격           │
│ [      신상품 더보기       ]  │  48px 테두리 버튼
│ 홈 | 카테고리 | 검색 | 찜 2 | 마이│  탭 바 fixed, 5열, 최소 52px
└──────────────────────────────┘
```

### 상세
```
┌──────────────────────────────┐
│ ← 블로그              사용법 ▾│
│ [←]     S L A T E   [⇪][🛍2] │  헤더 sticky, 로고 20px
│ ┌──────────────────────────┐ │
│ │[‹]   이미지 488px     [›]│ │  이전/다음 44×44, 세로 가운데(top 222)
│ │                  1 / 5   │ │
│ └──────────────────────────┘ │
│ SLATE · 아우터 [NEW]          │  13px muted
│ 울 블렌드 싱글 코트           │  h1 22px 700
│ 189,000원                     │  24px 700 + '원' 17px 400
│ 1,890원 적립 · 무료배송 …     │  13px muted, 아래 8px --sl-fill 띠
│ 색상 · 차콜                   │  legend 15px 700
│ (●)  ( )  ( )                 │  스와치 44(안쪽 34), 버튼 최소 56 폭
│ 사이즈                        │
│ [ S ][ M ][ L ][X̶L̶]           │  48px 4열 간격 8
│ 모델 정보 / ! 경고   사이즈 가이드│
│ ┌ 차콜 / M          선택됨 ┐  │  요약 상자 --sl-fill
│ │ [− 1 +]        189,000원 │  │
│ 상품 설명 / 디테일 컷 280px   │
│ 스펙 dl (88px | 1fr)          │
│ 사이즈 가이드 (cm) 표         │
│ 리뷰 128 › / 상품 문의 › / 배송… ›│  각 52px
│ 장바구니에 담았어요 · …       │  구매 바 fixed
│ [♡] [ 장바구니 ] [ 구매하기 ]  │  52px, 비율 1 : 1.3
└──────────────────────────────┘
```

### 대괄호 자리표시자 처리
- **이미지 자리**(`[시즌 캠페인 이미지]`, `[상품 이미지]`, `[디테일 컷 이미지]`, 상세 이미지): 실제 사진 없이 `--sl-fill` 상자 + 가운데 옷걸이 선 아이콘(SVG, `currentColor` = `--sl-muted`, 28px) + 작은 캡션(대괄호 없음). 캡션: 히어로 `SEASON CAMPAIGN`, 상품 카드 캡션 없음(아이콘만), 상세 `{색상명} · 컷 n`, 디테일 컷 `DETAIL`. 상세 이미지 상자에는 선택 색 스와치 원(48px, `--sw`)을 아이콘 위에 함께 그려 색 변경이 눈에 보이게 한다. `role="img"` + `aria-label`은 유지.
- **문구 자리**는 데이터로 채운다(대괄호 남기지 않음):
  - `[혜택 내용]` → 4절 배너 문구
  - `[시즌 컬렉션 소개 문구]` → `부드러운 울과 차분한 톤으로 완성한 가을 컬렉션을 만나 보세요.`
  - `[가격]` → 상품 `price` 포맷(`189,000원`)
  - `[적립 혜택] · [배송 안내]` → `{floor(price×0.01) 포맷}원 적립 · 5만 원 이상 무료배송 · 1~2일 내 출고`
  - `[모델 정보]` → 상품 `modelInfo`
  - 설명 문단·스펙 dl·사이즈표·`[리뷰 수]` → 상품 데이터 `desc`·`specs`·`sizeGuide`·`reviews`

## 9. 디자인 세부

### 그대로 옮길 값 (디자인 실측)
| 요소 | 값 |
|---|---|
| 기본 글자 | 15px / 1.5, 본문색 |
| 배너 | 12px, 위아래 8 · 좌우 16, 가운데 |
| 헤더 | 패딩 4/8, 아래 1px 구분선, 아이콘 버튼 44×44, SVG 22px 선 1.8 |
| 로고 | 홈 22px·상세 20px, 700, `letter-spacing: .24em`, `padding-left: .24em` |
| 검색 | 바깥 12/16, 상자 높이 44, 좌우 12, 간격 8, 반경 4, 아이콘 18 |
| 히어로 | 좌우 16, 간격 16, 이미지 400px 반경 4, 아이브로 12px `.16em`, h1 32px/1.2 700 `-.02em`, 버튼 48px 15px 700 |
| 섹션 | 위 48px, h2 20px 700, `전체 →` 13px 최소 높이 44 |
| 카테고리 | 4열, 간격 16(행)·12(열), 정사각 자리 반경 4, 라벨 13px, 간격 8 |
| 칩 | 높이 36, 좌우 14, 반경 4, 13px, 간격 8, 줄 패딩 0 16 16 |
| 상품 카드 | 2열, 간격 32·12, 3:4 비율 반경 4, NEW 10px 700 `.08em` 패딩 2/6 위치 8/8, 하트 버튼 44×44 우상단·SVG 20, 카테고리 12px muted, 이름 14px, 가격 15px 700, 줄 간격 2 |
| 더보기 | 위 32, 높이 48, 테두리 1px `--sl-ink`(디자인 `#111`), 글자 `--sl-text` 15px, 반경 4 |
| 탭 바 | 패딩 4/8, 5열, 최소 52px, 11px, SVG 22, 현재 탭 700 + `--sl-text`, 나머지 `--sl-muted` |
| 상세 이미지 | 높이 488, 이전/다음 44×44 반경 4 좌우 4, 카운터 12px 패딩 2/10 우하 12 |
| 기본 정보 | 패딩 20/16/24, 간격 6, 아래 8px `--sl-fill` 띠, h1 22px/1.35, 가격 24px 700(원 17px 400) |
| 옵션 | 패딩 24/16, 묶음 간격 28, legend 15px 700 아래 12, 스와치 간격 16 |
| 사이즈 | 4열 간격 8, 48px, 15px(품절 13px), 선택 700 채움 |
| 요약 | `--sl-fill`, 반경 4, 패딩 12/16, 간격 12, 수량 상자 테두리 `--sl-divider` + 배경 `--sl-bg`, −/+ 44×40(→ 44×44로 키움), 합계 18px 700 |
| 설명 | 패딩 28/16/8, 간격 24, h2 18px, 디테일 280px, dl 88px|1fr 간격 12/16 14px 위 구분선+20 |
| 사이즈표 | 13px 가운데, 머리 `--sl-fill`, 칸 패딩 10/4, 행 구분선 |
| 링크 목록 | 최소 52px, 15px, 행 구분선 |
| 구매 바 | 패딩 10/16/14, 간격 8, 찜 52×52, 장바구니 1 : 구매하기 1.3, 높이 52, 16px 700 |

- **아이콘**: 디자인 SVG 경로(메뉴, 장바구니, 검색, 하트, 홈, 카테고리, 마이, 뒤로, 공유, 이전/다음)를 그대로 쓰되 `stroke="currentColor"`/`fill="currentColor"`로 바꿔 토큰 색을 따르게 한다. 하트 채움/빈 상태는 SVG 하나에 CSS(`[aria-pressed="true"] svg { fill: var(--sl-ink); stroke: var(--sl-ink) }`)로 처리. 반복 요소용 SVG는 `index.html`의 `<template>` 안에 둔다(innerHTML 금지 때문).
- **대비**: 텍스트 4.5:1, 비텍스트(칩·사이즈 테두리, 선택 링, 하트) 3:1. 흰 배경 기준 `#111`·`#555`·`#333` 글자, `#888` 테두리(≈3.5:1)로 만족 예상. 이미지 위 버튼(`--sl-scrim-light` 배경 + `--sl-text` 아이콘), 카운터(`--sl-scrim-dark` 위 흰 글자)도 확인. Review에서 실측.
- **터치 대상 44px**: 칩은 디자인 높이 36 유지하되 위아래 투명 여백(`::before` 확장 또는 `padding-block` 4 + `margin-block` -4)으로 누름 영역 44. 수량 −/+는 44×44. 그 외 디자인 값이 이미 44 이상.
- **선택 표시가 색만이 아니게**: 선택 칩·사이즈는 채움 + 굵기, 스와치는 2px 링 + 이름 굵게, 품절은 점선 + 취소선 + 문구.
- **움직임**: 버튼 hover/pressed 120ms(`color`, `background-color`, `border-color`), 토스트 페이드 150ms, 앵커 스크롤 `smooth`. `prefers-reduced-motion: reduce`면 블로그 전역 규칙으로 transition 꺼짐 + JS `matchMedia`로 `behavior: 'auto'`.

## 10. 파일 구조

```
apps/slate-shop/
├── index.html       # 한 페이지: viewport(viewport-fit=cover), style.css (블로그 CSS·테마 스크립트 없음, 5절 B안),
│                    #   블로그 띠·사용법, view-home·view-product 정적 골격(디자인 구조), <template>(칩·카테고리·상품 카드·스와치·사이즈·스펙 행·사이즈표 행), 토스트,
│                    #   <script type="module" src="ui.js">
├── style.css        # 앱 토큰(sl-*, 디자인 흑백 값) + 기본 스타일 + 컴포넌트
├── data.js          # 순수 데이터: PRODUCTS(8개), CATEGORIES(8개), CHIPS(5개), 배너·소개 문구 상수
├── shop.js          # 순수 로직(DOM·localStorage 없음): 라우트, 필터, 찜, 장바구니, 수량, 가격, 검증
├── storage.js       # localStorage 읽기/쓰기(try/catch, 키 apps.slate-shop.*), 검증은 shop.js 사용
├── ui.js            # 진입점: 앱 상태, 라우터(hashchange), 헤더 배지, 토스트, 스크롤 복원, 공유, 데모 모드
├── home.js          # 홈 뷰 렌더·이벤트(칩, 카테고리, 카드, 찜, 더보기, 탭 바)
├── product.js       # 상세 뷰 렌더·이벤트(캐러셀·스와이프, 색/사이즈/수량, 경고, 담기, 구매 바)
├── tests.html       # data.js·shop.js 단위 테스트, 제목에 PASS n/n
├── preview.png      # 블로그 카드용 1200×630 (데모 모드 캡처)
├── spec.md          # 이 문서
└── plan-instructions.md
```

- 외부 라이브러리·CDN 없음.
- 확인 URL: `http://localhost:8000/apps/slate-shop/`, 상세 `…/apps/slate-shop/#/product/1`, 테스트 `…/tests.html` (`node serve.mjs 8000`).
- **데모 모드**(`?demo=1`): localStorage 읽기/쓰기 없음, 찜 `[1, 4]`, 장바구니 1번 상품 차콜/M 2개(배지 2), `<html class="is-demo">`. 1200×630 레이아웃: 왼쪽 소개 패널(SLATE 로고 + `모바일 쇼핑몰 데모` + `홈 ↔ 상세`) | 홈 폰 프레임 390 | 상세 폰 프레임 390(1번 상품, 사이즈 M 선택·요약 보임). 두 뷰를 동시에 보이게 하고 각 프레임은 높이 582px `overflow: hidden`, 고정 바는 프레임 안 `position: absolute; bottom: 0`. 블로그 띠·토스트 숨김. 캡처는 Edge 헤드리스(`--window-size=1200,630 --screenshot=<절대경로>\preview.png http://localhost:8000/apps/slate-shop/?demo=1`).

## 11. 로직 설계

### `data.js`
```js
// Product = {
//   id: number, cat: '아우터'|'상의'|'하의'|'액세서리', name: string, price: number, isNew: true,
//   colors: [{ name: string, hex: '#rrggbb' }],      // 1~3개
//   sizes: [{ label: string, soldOut: boolean }],    // 하나 이상 품절 아님
//   modelInfo: string, desc: string, reviews: number,
//   specs: [{ term: '소재'|'안감'|'두께감'|'세탁 방법'|'제조국', desc: string }],
//   sizeGuide: { cols: string[], rows: string[][] }  // 첫 열 = 사이즈 라벨, 단위 cm
// }
export const PRODUCTS = [/* 8개 */];
export const CATEGORIES = ['아우터', '상의', '하의', '원피스', '가방', '신발', '액세서리', '라이프'];
export const CHIPS = ['전체', '아우터', '상의', '하의', '액세서리'];
export const IMAGE_COUNT = 5;
export const QTY_MIN = 1, QTY_MAX = 10, CART_LINE_MAX = 99;
```

| id | 분류 | 이름 | 가격 | 색상(hex) | 사이즈(품절) |
|---|---|---|---|---|---|
| 1 | 아우터 | 울 블렌드 싱글 코트 | 189,000 | 차콜 `#3A3A3A`, 카멜 `#B08560`, 오트밀 `#D9D0C1` | S M L XL(품절) |
| 2 | 상의 | 캐시미어 터치 크루넥 니트 | 69,000 | 아이보리 `#EDE6D8`, 그레이 `#9A9A9A`, 네이비 `#2B3346` | S M L XL |
| 3 | 하의 | 와이드 울 슬랙스 | 79,000 | 차콜 `#3A3A3A`, 베이지 `#CBB9A0` | S M L XL |
| 4 | 액세서리 | 레더 미니 숄더백 | 129,000 | 블랙 `#1E1E1E`, 탠 `#9C6B43` | FREE (자동 선택) |
| 5 | 아우터 | 오버핏 트렌치 코트 | 219,000 | 베이지 `#C8B28E`, 카키 `#6B6A4F` | S M L(품절) XL |
| 6 | 상의 | 코튼 옥스퍼드 셔츠 | 49,000 | 화이트 `#F5F5F2`, 스카이블루 `#A9C4DE` | S M L XL |
| 7 | 하의 | 세미 부츠컷 데님 | 69,000 | 인디고 `#2F3E5C`, 라이트블루 `#8FA7C4` | S(품절) M L XL |
| 8 | 액세서리 | 울 캐시미어 머플러 | 59,000 | 차콜 `#3A3A3A`, 카멜 `#B08560`, 오트밀 `#D9D0C1` | FREE (자동 선택) |

- 설명·스펙·사이즈표·모델 정보·리뷰 수는 Build가 상품에 맞게 짧게 지어 넣는다(예: 1번 `울 블렌드 원단으로 만든 싱글 브레스트 코트입니다. 어깨선을 살짝 내려 니트 위에도 여유 있게 걸칠 수 있어요.`, 모델 `모델 178cm · M 착용`). 가방은 사이즈표 열 `가로·세로·폭·끈 길이`, 머플러 `가로·세로`.
- 홈 디자인처럼 목록 순서는 id 순(필터 `전체`의 처음 4개 = 1~4번).

### `shop.js` 공개 함수 (모두 입력 불변, 새 값 반환)
```js
// Route = { name: 'home' } | { name: 'product', id: number } | { name: 'notFound' }
export function parseRoute(hash) → Route          // '', '#', '#/' → home; '#/product/3' → product 3; 정수 1 이상만; 그 외 notFound
export function productHref(id) → string          // '#/product/3'
export function findProduct(products, id) → Product | null

export function formatPrice(n) → string           // 189000 → '189,000' (정규식 콤마, 로케일 비의존)
export function pointsFor(price) → number         // floor(price * 0.01)
export function filterProducts(products, chip) → Product[]          // '전체'면 전부, 아니면 cat 일치
export function visibleProducts(list, expanded, limit = 4) → { items, hasMore }

export function toggleWish(ids, id) → number[]    // 있으면 제거, 없으면 끝에 추가
export function isWished(ids, id) → boolean

export function clampQty(n, min = 1, max = 10) → number   // 정수 아님·NaN → min
export function initialSelection(product) → { color: 0, size: number|null, qty: 1, image: 1 }
                                                  // 품절 아닌 사이즈가 정확히 1개면 그 인덱스
export function pickSize(product, sel, index) → sel        // 품절·범위 밖이면 sel 그대로
export function pickColor(product, sel, index) → sel       // 범위 밖이면 그대로
export function stepImage(current, dir /* -1|1 */, total = 5) → number  // 1..total 순환
export function validateForCart(product, sel) → { ok: true } | { ok: false, reason: 'size' }
export function lineTotal(price, qty) → number

// CartItem = { productId, color, size, qty }
export function addToCart(cart, item, lineMax = 99) → CartItem[]   // 같은 productId·color·size면 qty 합침(최대 lineMax)
export function cartCount(cart) → number
export function badgeText(count) → string         // 0 → '', 1~99 → '3', 100+ → '99+'

export function sanitizeWish(data, products) → number[]     // {v:1, ids} 검증, 없는 id·중복 제거
export function sanitizeCart(data, products) → CartItem[]   // {v:1, items} 검증, 6절 규칙
export function serializeWish(ids) → { v: 1, ids }
export function serializeCart(cart) → { v: 1, items }
```

### `storage.js`
```js
export function loadWish(products) → number[]     // 실패·손상 시 []
export function saveWish(ids) → boolean
export function loadCart(products) → CartItem[]
export function saveCart(cart) → boolean
```

### `ui.js` 흐름
1. `?demo=1` 확인 → 아니면 `loadWish`/`loadCart`. 상태 `{ wish, cart, home: { chip: '전체', expanded: false, scrollY: 0 }, product: { id, sel, sizeError, added } }`.
2. 홈·상세 초기화(`initHome(ctx)`, `initProduct(ctx)`), `ctx`는 상태와 콜백(`onWishToggle`, `onAddToCart`, `toast`, `navigateHome`)을 담는다.
3. `route()` = `parseRoute(location.hash)` → 뷰 `hidden` 전환, 제목·`document.title`, 스크롤(2절), 포커스(7절), 탭 바·구매 바 표시 전환.
4. 찜·장바구니가 바뀌면 저장 → 헤더 배지·탭 바 찜 수·현재 뷰 하트 갱신(부분 갱신).
5. 렌더는 `<template>` 복제 + `textContent`, `setAttribute`, `classList`, `hidden`, `style.setProperty('--sw', hex)`만. **`innerHTML` 미사용.**

### `tests.html` 테스트 케이스 (최소)
- `parseRoute`: `''`·`'#'`·`'#/'` → home, `'#/product/3'` → product 3, `'#/product/0'`·`'#/product/-1'`·`'#/product/1.5'`·`'#/product/abc'`·`'#/product/3/x'`·`'#/foo'` → notFound. `productHref(3)` 왕복.
- `formatPrice`: 0 → `'0'`, 999 → `'999'`, 1000 → `'1,000'`, 189000 → `'189,000'`, 1890000 → `'1,890,000'`. `pointsFor(189000)` → 1890.
- `filterProducts`: `전체` 8개, `아우터` [1, 5], `액세서리` [4, 8], 원본 배열 불변. `visibleProducts`: 8개·접힘 → 4개 `hasMore: true`, 펼침 → 8개 `false`, 2개 → 2개 `false`.
- `toggleWish`: 추가·제거·원본 불변, `isWished`.
- `clampQty`: 0 → 1, 11 → 10, 5 → 5, `NaN` → 1, `2.5` → 1.
- `initialSelection`: 1번 → size null, 4번(FREE 하나) → size 0.
- `pickSize`: 1번 XL(품절) → 그대로, M → 1, 범위 밖 → 그대로. `pickColor` 범위 밖 → 그대로.
- `stepImage`: (1, -1) → 5, (5, 1) → 1, (3, 1) → 4.
- `validateForCart`: 사이즈 없음 → `{ ok: false, reason: 'size' }`, 있음 → ok.
- `addToCart`: 새 줄 추가, 같은 옵션 합침, 다른 색은 새 줄, 99 상한, 원본 불변. `cartCount` 합계. `badgeText`: 0 → `''`, 5 → `'5'`, 120 → `'99+'`.
- `sanitizeWish`: 정상 왕복, `v` 다름 → `[]`, 문자열·`null` → `[]`, 없는 id(99)·중복 제거.
- `sanitizeCart`: 정상 왕복, 없는 상품·색 인덱스 9·품절 사이즈(1번 XL)·qty 0·qty `'2'` 항목 제거, qty 150 → 99.
- **데이터 무결성**: 상품 8개, id 1~8 유일, 모든 `cat`이 `CHIPS`에 있음, 색 hex가 `/^#[0-9a-f]{6}$/i`, 각 상품에 품절 아닌 사이즈 1개 이상, `sizeGuide.rows` 각 행 길이 = `cols` 길이, 1번 상품 가격 189000·XL 품절.
- 결과를 통과/실패 개수와 함께 표시(제목 `PASS n/n`), 실패 시 `console.error`.

## 12. 검증 기준 (Review 체크리스트)

동작 — 홈 ↔ 상세 왕복
- [ ] `tests.html` 전부 통과.
- [ ] 홈 상품 이미지·이름 클릭 → `#/product/{id}` 상세, 맨 위에서 시작, 해당 상품의 이름·가격·색·사이즈가 보임(1번·4번·7번 각각 확인).
- [ ] 상세 ← → 홈으로 돌아오고, 떠날 때의 스크롤 위치·필터 칩·더보기 상태가 그대로. 브라우저 뒤로가기도 같음. 앞으로가기로 다시 상세.
- [ ] 상세 로고 → 홈. 상세 주소(`#/product/3`)로 바로 열고 ← 를 눌러도 앱 밖으로 나가지 않고 홈으로 감.
- [ ] `#/product/99`, `#/abc` → 안내 + `홈으로`. 콘솔 오류 없음.
- [ ] 히어로 `신상품 보러가기`·상세 `사이즈 가이드`가 해시를 바꾸지 않고(주소창 확인) 해당 영역으로 스크롤, 헤더에 가리지 않음.
- [ ] 화면 전환 후 `h1`에 포커스, `document.title` 갱신.

동작 — 기능
- [ ] 칩 5개 필터, `aria-pressed` 하나만 true. 더보기: `전체`에서 4 → 8개, 버튼 사라짐. `아우터`(2개)에서는 버튼 없음. 카테고리 `상의` → 칩 `상의` 적용 + 스크롤.
- [ ] 홈에서 찜 → 상세 하트도 채워짐, 상세에서 해제 → 홈 하트·탭 바 `찜 N` 갱신. 새로고침 후 유지.
- [ ] 사이즈 없이 장바구니/구매하기 → 경고 표시(`role="alert"`) + 사이즈 영역으로 이동 + 첫 선택 가능 사이즈 포커스. 사이즈 고르면 경고 사라짐.
- [ ] 품절 사이즈는 누를 수 없고 스크린리더 이름이 `XL 품절`.
- [ ] 수량 1~10, 끝에서 버튼 `disabled`, 합계 = 가격×수량 콤마.
- [ ] 장바구니 담기 → 헤더 배지 증가(홈 헤더에서도), 담김 문구, 같은 옵션 다시 담으면 합쳐짐(localStorage 값 확인). 옵션 바꾸면 담김 문구 숨김.
- [ ] 이미지 이전/다음 순환(1 ↔ 5), 카운터·`aria-label` 갱신, 색 바꾸면 캡션·스와치 바뀜. 모바일 에뮬레이션에서 가로 스와이프(합성 PointerEvent로 확인, 실제 손가락은 미확인으로 기록), 세로 스크롤은 막히지 않음.
- [ ] 죽은 요소(메뉴, 검색 제출, 카테고리 4개, 탭 바 4개, 리뷰·문의·배송) 누르면 토스트, 페이지 이동·해시 변경 없음. 화면에 `href="#"` 없음(`document.querySelectorAll('a[href="#"]').length === 0`).
- [ ] 공유: `navigator.share` 없는 데스크톱에서 링크 복사 토스트.
- [ ] 사용법 `<details>` 열고 닫기, 문구 4줄. `← 블로그` 링크가 `../../index.html`.
- [ ] localStorage 차단 상태에서도 오류 없이 동작, 손상 값(`localStorage.setItem('apps.slate-shop.cart', '{"v":1,"items":[{"productId":99}]}')`, `'oops'`) 넣고 새로고침 → 빈 장바구니로 정상 시작.
- [ ] 데모 모드(`?demo=1`)가 localStorage를 읽지도 바꾸지도 않음, 1200×630에서 세 칸이 잘리지 않음.

모바일·레이아웃
- [ ] 390px에서 디자인과 나란히 비교해 간격·글자 크기·순서가 같음(9절 표 기준, 스크린샷 비교).
- [ ] 360·375·390px에서 가로 스크롤 없음(칩 줄 제외), 1024px에서 가운데 430px 컬럼 + 바깥 블로그 배경.
- [ ] 탭 바·구매 바가 컬럼 폭에 맞게 하단 고정, 마지막 콘텐츠(더보기 버튼, 배송 안내 줄)가 바에 가리지 않음. 담김 문구가 보일 때도.
- [ ] 667×375(가로)에서 헤더·구매 바가 본문을 다 가리지 않음.
- [ ] 버튼·링크·칩·스와치·탭·`summary` 누름 영역 44×44 이상(칩은 확장 영역 포함 측정).

디자인·접근성
- [ ] 흰 배경 흑백 고정(B안): `localStorage.theme`을 light/dark로 바꿔도 화면이 같음. 블로그 `style.css`를 불러오지 않음. 텍스트 4.5:1, 테두리·선택 링·하트 3:1 실측.
- [ ] 앱 `style.css`에 `:root` 토큰 정의 외 색상값 직접 사용 없음(값은 5절 디자인 값). 스와치 색만 `data.js`에서 옴(예외 주석 존재).
- [ ] 블로그 전용 클래스명과 겹치는 앱 클래스 없음(`sl-` 접두사).
- [ ] 키보드만으로 홈 → 상품 → 색·사이즈·수량 → 장바구니 → 뒤로까지 가능, 포커스 표시가 보이고 고정 바에 가리지 않음.
- [ ] `prefers-reduced-motion: reduce`에서 transition 꺼짐, 스크롤이 즉시 이동(CSS 규칙·JS 분기 코드로 확인).

코드
- [ ] 브라우저 콘솔 오류·경고 없음.
- [ ] `shop.js`·`data.js`에 DOM·`localStorage` 참조 없음.
- [ ] `innerHTML` 미사용, ES 모듈, `const`/`let`, 2칸 들여쓰기, 세미콜론, 작은따옴표, 한국어 주석.
- [ ] `apps/slate-shop/` 밖의 파일 변경 없음.

## 13. 범위 밖

- 실제 결제·주문, 회원가입·로그인, 적립금 계산.
- 실제 검색(입력만 되고 제출 시 안내), 메뉴 서랍, 카테고리 페이지.
- 장바구니 화면(담긴 목록·삭제·수량 수정), 찜 목록 화면, 마이 페이지.
- 리뷰·상품 문의·배송 안내 내용 페이지.
- 실제 상품 사진(이미지 자리 처리만), 이미지 확대·핀치 줌, 썸네일 목록.
- 640/1024px 확장 레이아웃(가운데 폰 폭 컬럼만).
- 앱 내부 테마 토글(블로그 설정만 따름), 다른 탭과 찜·장바구니 실시간 동기화(`storage` 이벤트).
- 블로그 `index.html` 카드 추가(Embed 단계에서 별도 진행).

## 사용자 확인 필요

1. **색 (CLAUDE.md 규칙과 디자인의 충돌)**: **A안**을 추천합니다 — 블로그 `style.css`를 불러와 디자인 색을 블로그 토큰으로 매핑합니다. 기본(다크)은 검은 배경 + 네온 초록 버튼·마젠타 하트, 라이트는 블로그 라이트 값으로 디자인과 거의 같은 흑백(하트·NEW만 마젠타). 디자인 그대로 흑백 고정(B안, CLAUDE.md 색 규칙과 다름)이나, 라이트에서 마젠타도 빼는 완전 흑백(C안)을 원하시면 알려주세요.
2. **상품 데이터**: 디자인 상세는 코트 하나뿐이라, 홈 8개 상품마다 가격·색상·사이즈·설명을 지어 넣고 디자인 상세 내용(차콜/카멜/오트밀, XL 품절, 189,000원)은 1번 `울 블렌드 싱글 코트`에 쓰는 것을 추천합니다(상세 디자인 이름 `울블렌드 오버핏 코트`는 홈 목록에 없음). 가방·머플러처럼 사이즈가 하나(FREE)면 자동 선택합니다. 이름·가격을 바꾸고 싶으면 알려주세요.
3. **기능 없는 요소**: 메뉴·검색·카테고리 4개·탭 바(홈 제외)·리뷰/문의/배송 링크는 디자인 모양을 유지하고, 누르면 `준비 중이에요` 토스트를 띄우는 것을 추천합니다. 아예 숨기거나 눌러도 아무 반응 없게 하는 방법도 있습니다.
4. **사용법 안내 위치**: 페이지 맨 위에 `← 블로그` + 접이식 `사용법` 띠를 두고, 디자인의 검은 띠 배너 문구(`신규 회원 첫 구매 [혜택 내용]`)는 `데모 쇼핑몰 · 실제 주문과 결제는 되지 않아요`로 바꾸는 것을 추천합니다. 배너는 디자인 문구(예: `신규 회원 첫 구매 10% 할인`)로 두길 원하면 알려주세요.
5. **화면 연결 방식**: 한 페이지 안 해시 라우팅(`#/`, `#/product/{id}`)을 추천합니다(상태 공유·스크롤 복원·정적 배포에 유리). HTML 두 장(`index.html` + `product.html?id=3`)을 원하시면 알려주세요.
6. **레이아웃·글꼴**: 컬럼 최대 폭 430px(390px 폰에서는 디자인과 같은 폭), 헤더는 위에 붙는 sticky, 탭 바·구매 바는 화면 하단 고정을 추천합니다(디자인 캔버스에서는 문서 끝에 있음). 글꼴은 디자인대로 Helvetica 우선(블로그 글꼴은 대체용)으로 정했습니다. 블로그 카드는 기존 앱처럼 `preview.png` + 링크(iframe 아님)입니다.

## 사용자 확정 (2026-10-21)
1. 색: **B안** — 디자인 그대로 흑백 고정, 블로그 `style.css`·테마 스크립트 불러오지 않음(5절). 다른 절의 다크/라이트·블로그 변수(`--neon*`, `--surface*`, `--sl-accent`, `--sl-control`, `--sl-scrim`, `--sl-ph-border`) 언급은 5절 토큰으로 바꿔 읽는다: 하트·NEW·경고 = `--sl-ink`, 칩·사이즈 테두리 = `--sl-divider`, 이미지 위 버튼 = `--sl-scrim-light`, 카운터 = `--sl-scrim-dark`, 이미지 자리 = `--sl-fill`, 검색창·구분 띠·요약 = `--sl-fill-2`. 대비는 흰 배경 기준으로 실측한다.
2. 상품 데이터: 추천안(8개 상품 데이터 작성, 디자인 상세 내용은 1번 `울 블렌드 싱글 코트`).
3. 기능 없는 요소: 추천안(모양 유지 + `준비 중이에요` 토스트).
4. 사용법: 추천안(맨 위 `← 블로그` + 접이식 `사용법`, 배너 문구 `데모 쇼핑몰 · 실제 주문과 결제는 되지 않아요`).
5. 화면 연결: 추천안(한 페이지 해시 라우팅 `#/`, `#/product/{id}`).
6. 레이아웃·글꼴: 추천안(최대 430px 컬럼, sticky 헤더, 하단 고정 바, Helvetica 우선, 블로그 카드는 preview.png + 링크).
