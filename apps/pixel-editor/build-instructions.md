# Build 서브에이전트 지침 — 픽셀 아트 에디터

## 역할
승인된 계획서 `apps/pixel-editor/spec.md`대로 픽셀 아트 에디터를 구현한다. 검증(Review)은 별도 서브에이전트가 하므로, 여기서는 구현과 기본 동작 확인까지만 한다.

## 기준 문서
- `apps/pixel-editor/spec.md` — **유일한 기준**. 계획서와 다르게 만들어야 할 이유가 생기면 임의로 바꾸지 말고 완료 보고에 적는다.
- 사용자 확정 사항 (spec.md "사용자 확인 필요" 6가지, 모두 추천안):
  1. 기본 팔레트는 PICO-8 16색 + 직접 선택 1칸.
  2. 전체 지우기는 그림이 있을 때만 `confirm()`, 지운 뒤 되돌리기 가능.
  3. PNG 배율 1×/8×/16×/32× 선택, 기본 16×(256×256).
  4. 그림 한 장 `localStorage` 자동 저장 (히스토리는 저장 안 함).
  5. 앱 자체 테마 토글 없음(블로그 `localStorage.theme` 따름), 블로그 카드는 `preview.png` + 링크.
  6. 키보드 커서 그리기, 채우기, 스포이트 모두 포함.
- `CLAUDE.md` — 프로젝트 공통 규칙.
- `css/style.css` — 토큰 값을 복사해 올 원본 (읽기만).
- `apps/2048/` — 이미 검증을 통과한 앱. 구조(토큰 복사, 테마 인라인 스크립트, 데모 모드, `tests.html` 형식)를 참고해도 된다 (읽기만).

## 2048 Review에서 나온 교훈 (같은 실수 반복 금지)
- 키 이벤트에서 `event.key`가 없을 수 있다: `(event.key || '')`로 방어한다.
- 버튼 클릭 뒤 포커스가 버튼에 남아 단축키·방향키가 막히지 않는지 고려한다. 프로그램으로 포커스를 옮길 때는 `focus({ preventScroll: true })`를 쓴다(세로가 짧은 화면에서 페이지가 튀는 문제 방지).
- 스와이프·드래그 영역은 `touch-action: none`, 이동 키는 `preventDefault`로 페이지 스크롤을 막는다.

## 수정 가능 범위
- `apps/pixel-editor/` 안에 다음 파일을 **생성**한다: `index.html`, `style.css`, `editor.js`, `export.js`, `storage.js`, `ui.js`, `tests.html`, `preview.png`.
- `apps/pixel-editor/spec.md`, `plan-instructions.md`, `build-instructions.md`는 수정하지 않는다.
- `apps/pixel-editor/` 밖의 파일은 **읽기만** 한다. 블로그 `index.html`, `css/`, `js/`, `posts/`, `apps/2048/`, `CLAUDE.md`, `.claude/` 등은 절대 수정하지 않는다.
- git 명령(add, commit 등)은 실행하지 않는다. 커밋은 Embed 단계에서 한다.
- `review.md`는 만들지 않는다 (Review 서브에이전트 몫).

## 코딩 규칙
- ES 모듈, `const`/`let`, 들여쓰기 2칸, 세미콜론, 작은따옴표, 한국어 주석·UI 문구.
- `innerHTML` 사용 금지 (`textContent`, `className`, `style.setProperty`, `style.backgroundColor`로 렌더링).
- 외부 라이브러리·CDN 사용 없음.
- UI 색상값은 `:root` 토큰에만 쓴다. 그림·팔레트 색은 spec 3절의 예외 규칙대로 JS 데이터에서 검증 후 넣는다.
- `editor.js`와 `export.js`의 순수 함수(`toRgbaPixels` 등)는 DOM, `localStorage`를 직접 참조하지 않는다.
- 모든 HTML에 `<html lang="ko">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`.

## 동작 확인 (구현 후 최소한)
- 로컬 서버: `http://localhost:8000/`이 이미 떠 있을 가능성이 높다. 응답이 없으면 프로젝트 루트(`C:\Users\HP\Desktop\my-blog`)에서 `node serve.mjs 8000`을 띄우고, 직접 띄운 서버만 끝나면 종료한다.
- `http://localhost:8000/apps/pixel-editor/tests.html`의 테스트가 전부 통과하는지 확인한다. 실패하면 고친다.
- `http://localhost:8000/apps/pixel-editor/`이 콘솔 오류 없이 열리고, 연필로 칠하기와 PNG 저장 버튼이 동작하는지 확인한다.
- 꼼꼼한 검증(모바일, 대비, 접근성, PNG 픽셀 값 등)은 Review 단계에서 하므로 여기서는 생략해도 된다.
- 확인하면서 바꾼 `localStorage` 값(`apps.pixel-editor.*`)은 끝나면 지운다.

## preview.png 만들기
- 1200×630 크기로, 픽셀 아트가 그려진 에디터 화면(팔레트·도구가 보이는 상태)을 담는다.
- 이 PC의 Edge 헤드리스 스크린샷을 쓸 수 있다:
  `"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --hide-scrollbars --window-size=1200,630 --screenshot=<절대경로>\preview.png <URL>`
- 2048처럼 `?demo=1` 데모 모드(미리 정한 그림, 자동 저장 안 함, 1200×630에 맞는 레이아웃)를 `ui.js`에 넣어도 된다. 데모 그림은 블로그 분위기에 맞는 간단한 도트 그림(예: 하트, 버섯, 우주선 등)으로 한다. 일반 사용에는 영향이 없게 하고, 완료 보고에 적는다.
- PNG를 만들 수 없으면 억지로 만들지 말고 완료 보고에 그 이유를 적는다.

## 완료 보고
다음을 10줄 안팎으로 보고한다.
- 만든 파일 목록
- 테스트 결과 (통과/전체 개수)
- preview.png 생성 여부와 방법
- 계획서와 달라진 점이나 추가한 것 (없으면 "없음")
- 알려진 문제나 Review에서 특히 봐야 할 부분
