// 최고 점수 저장소 (localStorage 접근은 모두 try/catch로 감쌉니다)
// 블로그와 같은 origin이므로 키에 접두사를 붙여 충돌을 막습니다.

const KEY = 'apps.2048.best';
let memoryBest = 0;

// 저장된 최고 점수를 읽습니다. 실패하면 메모리 값을 돌려줍니다.
export function loadBest() {
  try {
    const raw = localStorage.getItem(KEY);
    const value = Number.parseInt(raw, 10);
    if (Number.isFinite(value) && value > memoryBest) memoryBest = value;
  } catch (e) {
    // 저장소 접근 불가: 메모리 값만 사용합니다.
  }
  return memoryBest;
}

// 최고 점수를 저장합니다. 실패해도 메모리 값은 갱신됩니다.
export function saveBest(value) {
  memoryBest = value;
  try {
    localStorage.setItem(KEY, String(value));
  } catch (e) {
    // 저장소 접근 불가: 무시합니다.
  }
}
