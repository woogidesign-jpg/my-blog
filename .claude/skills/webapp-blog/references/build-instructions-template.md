# Build 지침 파일 틀

`apps/{앱이름}/build-instructions.md`로 저장한다. 사용자 확정 사항은 사용자가 답한 그대로 적는다("모두 추천안"이면 각 추천안을 풀어서 적는다 — 서브에이전트가 spec을 다시 해석하지 않게).

---

```markdown
# Build 서브에이전트 지침 — {앱 표시 이름}

## 역할
승인된 계획서 `apps/{앱이름}/spec.md`대로 {앱 표시 이름}을 구현한다. 검증(Review)은 별도 서브에이전트가 하므로, 여기서는 구현과 기본 동작 확인까지만 한다.

## 기준 문서
- `apps/{앱이름}/spec.md` — **유일한 기준**. 계획서와 다르게 만들어야 할 이유가 생기면 임의로 바꾸지 말고 완료 보고에 적는다.
- 사용자 확정 사항 (spec.md "사용자 확인 필요"):
  1. {확정 내용}
  2. {확정 내용}
- `CLAUDE.md` — 프로젝트 공통 규칙 (블로그 색상 팔레트 사용, 사용법 안내 문구 필수 포함).
- `css/style.css` — 블로그 토큰 원본 (읽기만).
- `apps/2048/`, `apps/pixel-editor/` — 검증을 통과한 앱. 구조를 참고해도 된다 (읽기만).

## 이전 Review에서 나온 교훈 (같은 실수 반복 금지)
{references/lessons-learned.md에서 이 앱에 해당하는 항목}

## 수정 가능 범위
- `apps/{앱이름}/` 안에 다음 파일을 **생성**한다: {파일 목록 — spec 파일 구조와 같게}.
- `spec.md`, `plan-instructions.md`, `build-instructions.md`는 수정하지 않는다.
- `apps/{앱이름}/` 밖의 파일은 **읽기만** 한다. 블로그 `index.html`, `css/`, `js/`, `posts/`, 다른 앱, `CLAUDE.md`, `.claude/` 등은 절대 수정하지 않는다.
- git 명령(add, commit 등)은 실행하지 않는다. 커밋은 Embed 단계에서 한다.
- `review.md`는 만들지 않는다 (Review 서브에이전트 몫).

## 코딩 규칙
- ES 모듈, `const`/`let`, 들여쓰기 2칸, 세미콜론, 작은따옴표, 한국어 주석·UI 문구.
- `innerHTML` 사용 금지.
- 외부 라이브러리는 spec에서 정한 것만 (기본: 없음).
- 앱 `index.html`에서 `../../css/style.css`를 먼저, 앱 `style.css`를 나중에 불러온다. 앱 `style.css`에 블로그 토큰 값을 복사하지 않는다(기존 두 앱의 복사 방식은 예전 방식).
- UI 색상값은 블로그 CSS 변수(또는 `:root`의 앱 토큰)로만 쓴다.
- 순수 로직 모듈은 DOM, `localStorage`를 직접 참조하지 않는다.
- 모든 HTML에 `<html lang="ko">`, viewport meta.
- 사용법 안내 문구를 spec에서 정한 위치에 넣는다.

## 동작 확인 (구현 후 최소한)
- 로컬 서버: `http://localhost:8000/`이 이미 떠 있을 가능성이 높다. 응답이 없으면 프로젝트 루트(`C:\Users\HP\Desktop\my-blog`)에서 `node serve.mjs 8000`을 띄우고, 직접 띄운 서버만 끝나면 종료한다.
- `http://localhost:8000/apps/{앱이름}/tests.html`의 테스트가 전부 통과하는지 확인한다. 실패하면 고친다.
- `http://localhost:8000/apps/{앱이름}/`이 콘솔 오류 없이 열리고 핵심 기능이 동작하는지 확인한다.
- 꼼꼼한 검증(모바일, 대비, 접근성 등)은 Review 단계에서 하므로 생략해도 된다.
- 확인하면서 바꾼 `localStorage` 값(`apps.{앱이름}.*`)은 끝나면 지운다.

## preview.png 만들기
- 1200×630, 앱이 실제로 쓰이는 모습이 잘 보이는 화면.
- Edge 헤드리스 스크린샷:
  `"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --hide-scrollbars --window-size=1200,630 --screenshot=<절대경로>\preview.png <URL>`
- `?demo=1` 데모 모드(미리 정한 상태, localStorage 읽기·쓰기 없음, 1200×630 레이아웃)를 `ui.js`에 넣는다. 일반 사용에는 영향이 없게 한다.
- 만들 수 없으면 억지로 만들지 말고 완료 보고에 이유를 적는다.

## 완료 보고
10줄 안팎으로 보고한다.
- 만든 파일 목록
- 테스트 결과 (통과/전체 개수)
- preview.png 생성 여부와 방법
- 계획서와 달라진 점이나 추가한 것 (없으면 "없음")
- 알려진 문제나 Review에서 특히 봐야 할 부분
```
