# Codex 리뷰 지침 — SLATE 쇼핑몰 (apps/slate-shop)

## 역할
`apps/slate-shop/`의 코드를 리뷰하고 결과를 `apps/slate-shop/codex-review.md`에 쓴다. 기존 리뷰(`apps/slate-shop/review.md`, 재검증 절 포함)를 참고하되, **기존 리뷰가 놓친 문제**를 찾는 것이 목적이다.

## 수정 가능 범위 (중요)
- **`apps/slate-shop/codex-review.md` 파일 하나만 만든다.** 다른 파일은 읽기만 한다.
- 코드, `review.md`, `spec.md`, `CLAUDE.md`, `.claude/` 등은 수정하지 않는다. 문제를 찾으면 고치지 말고 결과 파일에 적는다. 수정은 Claude가 따로 한다.
- 상태를 바꾸는 git 명령(add, commit, checkout, stash 등)은 실행하지 않는다. `git log`, `git diff` 같은 읽기는 괜찮다.
- 임시 파일은 프로젝트 밖(OS 임시 폴더)에 만들고 끝나면 지운다.
- 네트워크 접근, 패키지 설치는 하지 않는다.

## 리뷰 대상
- `apps/slate-shop/index.html`, `style.css`, `data.js`, `shop.js`, `storage.js`, `ui.js`, `home.js`, `product.js`, `tests.html`
- 참고 문서: `CLAUDE.md`, `apps/slate-shop/spec.md`(끝의 `## 사용자 확정` 절이 우선), `apps/slate-shop/review.md`
- 리뷰 대상 아님: `.claude/skills/`, `*-instructions.md`, `preview.png`

## 알아 둘 결정 (문제로 적지 않는다)
- **색은 사용자가 승인한 B안**: 디자인 그대로 흰 배경 + `#111` 흑백 고정, 블로그 `../../css/style.css`와 테마 스크립트를 불러오지 않는다. CLAUDE.md 색 규칙의 승인된 예외다. 단, 색이 `:root`의 `--sl-*` 토큰 밖에서 직접 쓰이면 지적한다(상품 스와치 hex는 데이터 예외).
- 모바일 전용(최대 430px 컬럼). 넓은 화면 확장 레이아웃이 없는 것은 의도.
- 메뉴·검색·탭 바 일부는 의도적으로 "준비 중" 토스트만 띄운다.

## 볼 것
- 정확성: 해시 라우팅(`#/`, `#/product/{id}`, 잘못된 해시), 뒤로가기·`cameFromHome`, 스크롤·필터 복원, 찜·장바구니 상태와 화면 불일치, 수량 경계, 가격 계산·포맷, 품절 사이즈 처리, 예외 처리 누락
- 보안: `innerHTML` 사용, 해시·저장 값에서 온 데이터가 DOM·스타일(`--sw`)로 들어가는 경로 검증
- 견고성: `localStorage` 차단·손상 값(깨진 JSON, `'123junk'`, 없는 id, 음수·소수 수량, 큰 수), 저장 실패
- 접근성·모바일: 포커스 이동·복원, 키보드, aria(`aria-pressed`, `aria-live`, `role="alert"`), 숨긴 뷰, 터치·스와이프(`touch-action`)
- 성능·메모리: 라우팅 반복 시 리스너 누적, 타이머 정리
- 테스트 페이지 자체가 실제로 실행되는지(인라인 스크립트 속 `</script>` 등)

순수 로직 모듈(`data.js`, `shop.js`)은 `node`로 import해 실행해도 된다. 브라우저가 필요한 항목은 코드로 확실한 것만 적고, 추측이면 "확인 필요"로 표시한다.

## 결과 파일 형식
```markdown
# Codex 리뷰
## 요약
## 발견한 문제
| 번호 | 심각도(높음/중간/낮음) | 위치(파일:줄) | 내용 | 근거·재현 방법 | 수정 제안 |
## 기존 review.md와 겹쳐서 뺀 것
## 참고 (문제는 아니지만 개선 여지)
```
- 한국어로 쓴다. 이미 고쳐진 기존 지적은 다시 적지 않는다(고쳤다는데 안 고쳐졌으면 적는다).
- 직접 확인했거나 코드에서 확실한 것만 "문제"로, 취향 차이는 "참고"로.
