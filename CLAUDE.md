# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude Code에게 프로젝트 맥락과 규칙을 알려줍니다.

## 프로젝트 개요

마크다운(`.md`) 파일로 작성한 글을 읽어서 블로그 웹사이트로 보여주는 정적 사이트입니다.

- **프레임워크·라이브러리 없이** 순수 HTML, CSS, JavaScript(ES 모듈)로만 구현합니다.
- 빌드 단계나 번들러가 없습니다. 브라우저가 마크다운 파일을 `fetch`로 불러와 직접 HTML로 변환합니다.
- npm 패키지, CDN 스크립트, CSS 프레임워크(Tailwind, Bootstrap 등)를 추가하지 않습니다. 마크다운 파서도 직접 작성합니다.

## 디렉터리 구조

```
my-blog/
├── index.html          # 글 목록 페이지
├── post.html           # 글 상세 페이지 (post.html?slug=파일이름)
├── css/
│   └── style.css       # 전체 스타일 (CSS 변수 기반 테마)
├── js/
│   ├── main.js         # 목록 페이지 로직
│   ├── post.js         # 상세 페이지 로직
│   ├── markdown.js     # 마크다운 → HTML 변환기
│   ├── frontmatter.js  # front matter 파서
│   ├── format.js       # 날짜·태그·상태 메시지 표시 도우미
│   └── theme.js        # 다크 모드 전환
├── posts/
│   ├── index.json      # 글 목록 매니페스트 (파일 이름 배열)
│   └── *.md            # 블로그 글
├── tests/
│   └── markdown.test.html  # 변환기 테스트 (브라우저에서 열기)
└── serve.mjs           # 로컬 개발용 정적 서버 (의존성 없음)
```

## 글 작성 규칙

각 마크다운 파일은 상단에 YAML 형식의 front matter를 둡니다.

```markdown
---
title: 첫 번째 글
date: 2026-10-11
tags: [일상, 개발]
description: 목록에 표시될 짧은 요약
---

본문은 여기부터 시작합니다.
```

- 파일 이름(확장자 제외)이 URL의 `slug`가 됩니다. 영문 소문자와 하이픈만 사용합니다 (예: `my-first-post.md`).
- 새 글을 추가하면 `posts/index.json`에도 파일 이름을 추가해야 합니다. 브라우저는 디렉터리 목록을 읽을 수 없기 때문입니다.
- 목록은 `date` 기준 최신순으로 정렬합니다.

## 마크다운 변환기 (`js/markdown.js`)

직접 구현하며, 최소한 다음 문법을 지원합니다.

- 제목 `#` ~ `######`, 문단, 줄바꿈
- 굵게 `**`, 기울임 `*`, 취소선 `~~`, 인라인 코드 `` ` ``
- 링크 `[텍스트](url)`, 이미지 `![alt](src)`
- 순서 있는/없는 목록 (중첩 포함), 인용문 `>`
- 코드 블록 ` ``` ` (언어 표시를 `class="language-xxx"`로 유지)
- 수평선 `---`, 표(GFM 테이블)

구현 원칙:

- **보안**: 변환 전에 원문의 `<`, `>`, `&`, `"`를 이스케이프합니다. 링크 URL은 `http:`, `https:`, `mailto:`, 상대 경로만 허용하고 `javascript:` 등은 제거합니다.
- 코드 블록 안의 내용은 다른 마크다운 규칙을 적용하지 않습니다.
- 블록 단위 파싱 → 인라인 파싱의 두 단계로 나눠, 각 규칙을 작은 함수로 분리합니다.
- 순수 함수로 작성해 DOM 없이도 테스트할 수 있게 합니다 (`export function parseMarkdown(text) → string`).

## 디자인 원칙

**검은 배경 + 네온 색** 컨셉입니다. 터미널 느낌(모노스페이스 라벨, `>` 프롬프트, 깜빡이는 커서, 옅은 격자 배경)을 쓰되, 본문은 읽기 좋게 유지합니다.

- **네온 색 역할**: `--neon`(초록: 제목·강조), `--neon-2`(청록: 링크·인라인 코드), `--neon-3`(마젠타: 태그·라벨·목록 기호). 색을 새로 늘리지 말고 이 셋 안에서 씁니다.
- **글로우**: `text-shadow`/`box-shadow`는 `--glow`, `--glow-2`, `--glow-box` 토큰으로만 줍니다. 본문 문단에는 글로우를 넣지 않습니다(가독성).
- **본문 글자색**은 순수 네온이 아니라 옅은 민트(`--text`)입니다.
- **레이아웃**: 목록 페이지는 히어로 + 카드 그리드(모바일 1열, 640px 2열, 1024px 3열, 최신 글은 넓은 카드). 상세 페이지는 1024px 이상에서 왼쪽 정보 패널(날짜·읽는 시간·태그, sticky) + 오른쪽 본문입니다.
- **본문 폭**: `max-width: 68ch` 정도로 제한합니다.
- **글꼴**: 시스템 폰트 스택을 사용합니다 (`-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", "Segoe UI", sans-serif`). 코드는 `ui-monospace, "SF Mono", Consolas, monospace`.
- **본문 크기·행간**: `font-size: 1.0625rem`(17px), `line-height: 1.75`. 한글 가독성을 위해 `word-break: keep-all`을 적용합니다.
- **색상**: 모든 색은 `:root`의 CSS 변수로 정의하고, 컴포넌트에서 색상값을 직접 쓰지 않습니다.
- **대비**: 텍스트·네온 색과 배경의 명암비는 두 테마 모두 WCAG AA(4.5:1) 이상을 유지합니다.
- 깜빡임 등 애니메이션은 `prefers-reduced-motion: reduce`에서 끕니다.
- 코드 블록은 가로 스크롤(`overflow-x: auto`)을 허용하고, 페이지 전체가 가로로 스크롤되면 안 됩니다.
- 이미지는 `max-width: 100%; height: auto;`.

## 다크 모드

- 기본값은 **항상 검은 배경 네온 테마**입니다. 시스템 설정(`prefers-color-scheme`)은 따르지 않습니다.
- 헤더의 토글 버튼으로 라이트 테마를 고를 수 있고, 선택값은 `localStorage`의 `theme` 키(`light`/`dark`)에 저장합니다. `localStorage` 접근은 `try/catch`로 감쌉니다.
- 라이트 테마일 때만 `<html data-theme="light">`를 붙입니다. CSS는 아래 구조로 작성합니다. 라이트 테마에서는 네온 색을 대비가 충분한 진한 색으로 바꾸고 글로우를 끕니다(`--glow: none`).

```css
:root { --bg: #000000; --text: #d9ffec; --neon: #39ff14; /* ... */ }
:root[data-theme="light"] { --bg: #f4f4ee; --text: #15201b; --neon: #0b7a22; --glow: none; /* ... */ }
```

- 페이지 로드 시 깜빡임(FOUC)을 막기 위해, 저장된 테마를 적용하는 짧은 인라인 스크립트를 `<head>`에 둡니다.
- 토글 버튼에는 `aria-label`을 붙이고, 현재 상태를 `aria-pressed`로 알립니다.

## 반응형 / 모바일

- **모바일 우선**으로 작성합니다. 기본 스타일은 좁은 화면 기준이고, 넓은 화면은 `min-width` 미디어 쿼리로 확장합니다.
- 주요 브레이크포인트: `640px`, `1024px`.
- 모바일 좌우 여백은 최소 `16px`.
- 터치 대상(버튼, 링크)은 최소 `44×44px`.
- 모든 HTML에 `<meta name="viewport" content="width=device-width, initial-scale=1">`를 넣습니다.
- 넓은 표는 래퍼에 `overflow-x: auto`를 줘서 화면 밖으로 넘치지 않게 합니다.

## 코딩 컨벤션

- JavaScript는 ES 모듈(`<script type="module">`)로 작성하고, `var` 대신 `const`/`let`을 씁니다.
- 들여쓰기 2칸, 세미콜론 사용, 문자열은 작은따옴표.
- 사용자 입력이나 마크다운에서 나온 문자열을 `innerHTML`에 넣을 때는 반드시 이스케이프를 거칩니다. 단순 텍스트는 `textContent`를 사용합니다.
- 시맨틱 태그(`header`, `main`, `article`, `nav`, `time`, `footer`)를 사용합니다.
- 글을 불러오지 못하면 빈 화면 대신 안내 메시지를 보여줍니다 (404, 네트워크 오류 구분).
- 주석과 UI 문구는 한국어로 작성합니다.

## 로컬 실행

`fetch`는 `file://` 프로토콜에서 동작하지 않으므로 로컬 정적 서버로 실행해야 합니다. 이 PC에는 Python이 없으므로 Node로 실행합니다.

```bash
node serve.mjs
```

이후 `http://localhost:8000`에서 확인합니다. 변환기 테스트는 `http://localhost:8000/tests/markdown.test.html`입니다.

## 작업 후 확인 사항

변경 후에는 다음을 확인합니다.

1. `tests/markdown.test.html`이 모두 통과하는지 (변환기를 고쳤다면 테스트 케이스도 추가)
2. 글 목록과 상세 페이지가 정상적으로 렌더링되는지
3. 라이트/다크 모드 모두에서 텍스트가 잘 읽히는지
4. 모바일 너비(375px)에서 가로 스크롤이 생기지 않는지
5. 브라우저 콘솔에 오류가 없는지
