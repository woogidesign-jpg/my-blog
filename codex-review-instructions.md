# Codex 리뷰 지침 — woogi.log 전체 코드

## 역할
이 프로젝트(마크다운 블로그 + 미니 웹앱, 순수 HTML·CSS·JS, 빌드 없음, GitHub Pages 배포)의 코드를 리뷰하고, 결과를 프로젝트 루트의 `codex-review.md`에 쓴다. 기존 리뷰(`apps/*/review.md`)를 참고하되, **기존 리뷰가 놓친 문제**를 찾는 것이 목적이다.

## 수정 가능 범위 (중요)
- **`codex-review.md` 파일 하나만 만든다.** 다른 파일은 읽기만 한다.
- 코드, `review.md`, `spec.md`, `CLAUDE.md`, `.claude/` 등은 수정하지 않는다. 문제를 찾으면 고치지 말고 codex-review.md에 적는다. 수정은 Claude가 따로 한다.
- git 명령 중 상태를 바꾸는 것(add, commit, checkout, stash 등)은 실행하지 않는다. `git log`, `git diff` 같은 읽기는 괜찮다.
- 임시 파일이 필요하면 프로젝트 밖(OS 임시 폴더)에 만들고 끝나면 지운다.
- 네트워크 접근, 패키지 설치는 하지 않는다.

## 리뷰 대상
- 블로그: `index.html`, `post.html`, `css/style.css`, `js/*.js`(main, post, markdown, frontmatter, format, theme), `posts/index.json`, `tests/markdown.test.html`, `serve.mjs`
- 웹앱: `apps/2048/`, `apps/pixel-editor/`의 HTML·CSS·JS와 `tests.html`
- 참고 문서: `CLAUDE.md`(프로젝트 규칙), `apps/*/spec.md`(승인된 계획), `apps/*/review.md`(기존 리뷰와 수정 내역)
- 리뷰 대상 아님: `.claude/skills/`, `*-instructions.md`, `posts/*.md` 글 내용

## 볼 것
- 정확성: 로직 버그, 엣지 케이스, 상태가 화면과 어긋나는 경우, 예외 처리 누락
- 보안: 마크다운 렌더링의 XSS(링크 `javascript:` URL, HTML 이스케이프, 속성 주입), `innerHTML` 사용, `serve.mjs`의 경로 탐색(`..`)
- 견고성: `localStorage` 차단·손상 값, 없는 글/잘못된 frontmatter, 네트워크 실패
- 접근성·모바일: 포커스 관리, 키보드 조작, aria, 터치
- CLAUDE.md 규칙 위반(외부 라이브러리, 색은 CSS 변수로, 사용법 안내 문구 등). 단, 2048·픽셀 에디터가 블로그 토큰 값을 복사해 쓰는 것은 이미 알고 있는 예전 방식이므로 문제로 적지 않는다.
- 성능·메모리: 리스너·타이머·object URL 정리

순수 로직 모듈은 `node`로 import해서 직접 실행해 확인해도 된다. 브라우저가 필요한 항목은 코드로 확실히 확인한 것만 적고, 추측이면 "확인 필요"로 표시한다.

## codex-review.md 형식
```markdown
# Codex 리뷰

## 요약
전체 인상 2~3줄, 문제 개수(심각도별)

## 발견한 문제
| 번호 | 심각도(높음/중간/낮음) | 위치(파일:줄) | 내용 | 근거·재현 방법 | 수정 제안 |

## 기존 review.md와 겹쳐서 뺀 것
(있으면 한 줄씩)

## 참고 (문제는 아니지만 개선 여지)
```
- 한국어로 쓴다.
- 기존 review.md에서 이미 지적되고 고쳐진 문제는 다시 적지 않는다. 고쳐졌다고 적혀 있는데 실제로 안 고쳐졌으면 적는다.
- 직접 확인했거나 코드에서 확실히 보이는 것만 "문제"로 적는다. 취향 차이는 "참고"로 보낸다.
