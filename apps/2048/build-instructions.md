# Build 서브에이전트 지침 — 2048

## 역할
승인된 계획서 `apps/2048/spec.md`대로 2048 웹앱을 구현한다. 검증(Review)은 별도 서브에이전트가 하므로, 여기서는 구현과 기본 동작 확인까지만 한다.

## 기준 문서
- `apps/2048/spec.md` — **유일한 기준**. 계획서와 다르게 만들어야 할 이유가 생기면 임의로 바꾸지 말고 완료 보고에 적는다.
- 사용자 확정 사항 (spec.md "사용자 확인 필요" 5가지, 모두 추천안):
  1. 앱 자체 테마 토글 없음. 블로그의 `localStorage.theme`를 따른다.
  2. 블로그 카드는 `preview.png` + 링크 방식 (iframe 아님).
  3. `새 게임` 버튼은 확인창 없이 즉시 초기화.
  4. 진행 중 게임 저장은 범위 밖 (최고 점수만 저장).
  5. WASD 포함.
- `CLAUDE.md` — 프로젝트 공통 규칙.
- `css/style.css` — 토큰 값을 복사해 올 원본 (읽기만).

## 수정 가능 범위
- `apps/2048/` 안에 다음 파일을 **생성**한다: `index.html`, `style.css`, `game.js`, `ui.js`, `storage.js`, `tests.html`, `preview.png`.
- `apps/2048/spec.md`, `plan-instructions.md`, `build-instructions.md`는 수정하지 않는다.
- `apps/2048/` 밖의 파일은 **읽기만** 한다. 블로그 `index.html`, `css/`, `js/`, `posts/`, `CLAUDE.md`, `.claude/` 등은 절대 수정하지 않는다.
- git 명령(add, commit 등)은 실행하지 않는다. 커밋은 Embed 단계에서 한다.
- `review.md`는 만들지 않는다 (Review 서브에이전트 몫).

## 코딩 규칙
- ES 모듈, `const`/`let`, 들여쓰기 2칸, 세미콜론, 작은따옴표, 한국어 주석·UI 문구.
- `innerHTML` 사용 금지 (`textContent`, `className`, `style.setProperty`로 렌더링).
- 외부 라이브러리·CDN 사용 없음.
- 색상값은 `:root` 토큰에만 쓰고, 컴포넌트에서는 토큰만 참조한다.
- `game.js`는 DOM, `localStorage`, `Math.random`을 직접 참조하지 않는다.
- 모든 HTML에 `<html lang="ko">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`.

## 동작 확인 (구현 후 최소한)
- 로컬 서버: 프로젝트 루트에서 `node serve.mjs 8000` (이미 실행 중일 수 있으니 먼저 `http://localhost:8000/`이 응답하는지 확인). 확인 후 직접 띄운 서버는 종료한다.
- `http://localhost:8000/apps/2048/tests.html`의 테스트가 전부 통과하는지 확인한다. 실패하면 고친다.
- `http://localhost:8000/apps/2048/`이 콘솔 오류 없이 열리는지 확인한다.
- 꼼꼼한 검증(모바일, 대비, 접근성 등)은 Review 단계에서 하므로 여기서는 생략해도 된다.

## preview.png 만들기
- 1200×630 크기로, 게임이 진행 중인 화면(여러 값의 타일이 보이는 상태)을 담는다.
- 방법 예시: 이 PC에 Edge(`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`)와 Chrome이 있다. 헤드리스 스크린샷을 쓸 수 있다.
  `msedge.exe --headless --disable-gpu --hide-scrollbars --window-size=1200,630 --screenshot=<절대경로>\preview.png <URL>`
- 진행 중 화면을 보여주려면 URL 쿼리(예: `?demo=1`)로 미리 정한 보드를 띄우는 **데모 모드**를 `ui.js`에 넣어도 된다. 넣는다면 일반 플레이에는 영향이 없게 하고, 완료 보고에 적는다.
- PNG를 만들 수 없으면 억지로 만들지 말고 완료 보고에 그 이유를 적는다.

## 완료 보고
다음을 10줄 안팎으로 보고한다.
- 만든 파일 목록
- 테스트 결과 (통과/전체 개수)
- preview.png 생성 여부와 방법
- 계획서와 달라진 점이나 추가한 것 (없으면 "없음")
- 알려진 문제나 Review에서 특히 봐야 할 부분
