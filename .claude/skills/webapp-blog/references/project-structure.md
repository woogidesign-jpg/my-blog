# 프로젝트 구조와 관례

## 저장소와 배포
- 로컬: `C:\Users\HP\Desktop\my-blog`
- GitHub: `woogidesign-jpg/my-blog`, 기본 브랜치 `main`
- GitHub Pages: `main` 브랜치 루트(`/`)에서 배포 → https://woogidesign-jpg.github.io/my-blog/
- 빌드 단계 없음. 파일이 그대로 사이트가 된다(`.nojekyll` 있음).

## 폴더 구조
```
my-blog/
├── CLAUDE.md              # 프로젝트 규칙 (최신 기준)
├── index.html             # 목록 페이지: hero → <section class="apps"> (ls apps/) → <section class="posts"> (ls posts/)
├── post.html              # 글 보기 페이지
├── css/style.css          # 블로그 디자인 토큰과 스타일 (앱 색상의 원본)
├── js/                    # main.js(글 목록), post.js, markdown.js, frontmatter.js, format.js, theme.js
├── posts/                 # index.json + *.md 글
├── tests/markdown.test.html
├── apps/
│   ├── 2048/
│   └── pixel-editor/
├── serve.mjs              # 로컬 개발 서버 (node serve.mjs 8000)
├── .claude/launch.json    # 미리보기 서버 설정 (이름 "blog", 포트 8000)
├── .gitattributes         # * text=auto eol=lf
└── .gitignore             # .claude/settings.local.json 제외
```

## 앱 폴더 표준 구성
```
apps/{앱이름}/
├── index.html               # viewport meta, 테마 인라인 스크립트, ../../css/style.css → style.css, <script type="module" src="ui.js">
├── style.css                # 앱 스타일 (블로그 CSS 변수를 var()로 사용, 값 복사 없음)
├── {로직}.js                 # 순수 로직: DOM·localStorage를 쓰지 않음 → tests.html로 테스트
├── storage.js               # localStorage 읽기/쓰기 (try/catch, 키 접두사 apps.{앱이름}.)
├── ui.js                    # DOM 렌더링, 입력 처리, aria-live, 데모 모드
├── tests.html               # 브라우저에서 여는 단위 테스트 (외부 라이브러리 없음), 제목에 PASS n/n
├── preview.png              # 블로그 카드용 1200×630
├── spec.md                  # 승인된 계획서
├── plan-instructions.md
├── build-instructions.md
├── review-instructions.md
└── review.md
```

## 테마와 색
- 블로그는 검은 배경 + 네온(초록 `--neon`, 청록 `--neon-2`, 마젠타 `--neon-3`) 테마, 라이트 테마는 `:root[data-theme="light"]`.
- 토큰 이름: `--bg --surface --surface-2 --line --grid --text --muted --neon --neon-2 --neon-3 --on-neon --scrim --glow --glow-2 --glow-box --font-sans --font-mono --radius --gutter`. 실제 값은 `css/style.css`를 읽어서 확인한다(바뀔 수 있다).
- **기본 방식: 블로그 `css/style.css`를 직접 불러온다.** CLAUDE.md의 "style.css의 CSS 변수를 참조할 것"을 따르는 방식이다. 블로그 색을 바꾸면 앱에도 자동으로 반영된다.
  ```html
  <link rel="stylesheet" href="../../css/style.css">  <!-- 블로그 토큰 (먼저) -->
  <link rel="stylesheet" href="style.css">             <!-- 앱 스타일 (나중, 필요한 것만 덮어씀) -->
  ```
  - 앱 `style.css`에는 토큰 **값을 다시 적지 않는다.** `var(--neon)`처럼 블로그 변수를 쓴다.
  - 블로그 `style.css`에는 토큰 말고도 `body`, 제목, 링크, 배경 격자 같은 전역 스타일이 들어 있어서 앱에도 적용된다. Plan 단계에서 블로그 `style.css`를 읽고, 앱에 영향을 주는 전역 규칙과 앱 `style.css`에서 덮어쓸 것을 spec에 적는다. 블로그 전용 클래스(`.site-header`, `.card` 등)는 앱에서 같은 이름을 쓰지 않는다.
- UI 색은 토큰으로만 쓴다. 앱 전용 색이 필요하면 앱 `style.css`의 `:root`에 앱 토큰으로 추가하고, 가능하면 블로그 변수로 정의한다(예: `--phase: var(--neon-2)`). 블로그 변수로 만들 수 없는 값만 직접 쓰고, 다크·라이트 둘 다 정한다(예: 픽셀 에디터의 `--grid-line`).
- 그림·팔레트처럼 **사용자 데이터인 색**은 예외로, JS 데이터에서 검증한 뒤 넣는다.
- 기존 두 앱(2048, 픽셀 에디터)은 이 규칙이 생기기 전에 만들어져서 토큰 값을 앱 `style.css`에 복사해 쓴다. 새 앱은 이것을 따라 하지 않는다. 복사 방식이 꼭 필요하다고 판단되면 CLAUDE.md와 다른 결정이므로 spec의 `## 사용자 확인 필요`에 이유와 함께 올려 사용자가 고르게 한다.
- 테마는 블로그가 저장한 `localStorage.theme`을 따른다. 앱 안에 테마 토글은 두지 않는다. `<head>`에 깜빡임 방지 인라인 스크립트를 넣는다:
  ```html
  <script>
    // 첫 화면이 그려지기 전에 블로그에서 고른 테마를 적용합니다 (깜빡임 방지).
    try {
      if (localStorage.getItem('theme') === 'light') document.documentElement.dataset.theme = 'light';
    } catch (e) {}
  </script>
  ```
- 앱 상단에 `← 블로그` 링크(`../../index.html`, `target="_top"`)를 둔다.

## 코딩 규칙
- ES 모듈, `const`/`let`, 들여쓰기 2칸, 세미콜론, 작은따옴표, 한국어 주석·UI 문구.
- `innerHTML` 사용 금지(`textContent`, `className`, `style.setProperty` 등으로 렌더링).
- 모든 HTML에 `<html lang="ko">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- 모바일 우선: 375px 기본, 640px / 1024px에서 확장. 터치 대상 44px 이상, WCAG AA 대비, `prefers-reduced-motion` 존중.

## 데모 모드와 preview.png
- `?demo=1`이면 미리 정한 화면을 띄우고 localStorage를 읽지도 쓰지도 않으며, `<html class="is-demo">`로 1200×630 캡처용 레이아웃을 쓴다.
- 캡처는 Edge 헤드리스로 한다:
  ```
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --hide-scrollbars --window-size=1200,630 --screenshot=<절대경로>\preview.png http://localhost:8000/apps/{앱이름}/?demo=1
  ```

## 앱 카드 (index.html)
`<section class="apps">` 안 `<div class="post-grid">` 맨 앞에 넣고, `<p class="section-count">N apps</p>` 숫자를 올린다.
```html
<article class="card card--app">
  <img class="card-thumb" src="apps/{앱이름}/preview.png" width="1200" height="630" alt="{화면에 보이는 것을 구체적으로}" loading="lazy">
  <p class="card-meta"><span class="badge">APP</span>{게임|도구|…}</p>
  <h3 class="card-title"><a class="card-link" href="apps/{앱이름}/">{제목}</a></h3>
  <p class="card-description">{한두 문장: 무엇을 하는지 + 주요 기능}</p>
  <ul class="tag-list" aria-label="태그">
    <li class="tag">#{태그1}</li>
    <li class="tag">#{태그2}</li>
  </ul>
</article>
```
카드 스타일(`.card-thumb`, `.apps`)은 이미 `css/style.css`에 있으므로 보통 CSS를 더할 필요가 없다.

## 기존 웹앱
| 앱 | 폴더 | 카드 문구 | 태그 | 메모 |
|---|---|---|---|---|
| 2048 | `apps/2048/` | 같은 숫자를 밀어 합쳐 2048을 만드세요. 방향키·WASD·스와이프 지원, 최고 점수 저장. | #game #puzzle | `game.js` 순수 로직, 키 `apps.2048.best`, 테스트 35개, 토큰 값 복사(이전 방식) |
| 픽셀 에디터 | `apps/pixel-editor/` | 16×16 격자에 도트를 찍어 그림을 그리고 PNG로 저장하세요. 16색 팔레트, 채우기·스포이트, 되돌리기 지원. | #tool #art | `editor.js`·`export.js` 순수 로직, 키 `apps.pixel-editor.drawing/settings`, 테스트 33개, PICO-8 팔레트, 토큰 값 복사(이전 방식) |

## 개발 서버
- `node serve.mjs 8000` (launch.json 이름 `blog`). 보통 이미 떠 있다. `preview_start`가 포트 사용 중으로 실패하면 `http://localhost:8000`으로 바로 이동한다.
- 서브에이전트가 서버를 직접 띄웠다면 끝날 때 그 서버만 끈다.

## git 관례
- `core.autocrlf=true`, `.gitattributes`로 LF 고정.
- 앱마다 `main`에서 새 브랜치 → 커밋 → (요청 시) 푸시 → PR → (요청 시) 머지.
- 커밋 메시지 끝: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- PR 본문 끝: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
- 머지 후 Pages가 1~2분 동안 다시 빌드된다. 반영 여부는 확인한 경우에만 "반영됐다"고 말한다.
- Bash에서 `cd`를 쓰면 작업 폴더가 바뀌므로 절대 경로를 쓴다.
