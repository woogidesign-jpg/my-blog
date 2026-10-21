// 픽셀 에디터 순수 로직: 격자 데이터, 칠하기, 채우기, 직선 보간, 직렬화, 히스토리.
// DOM·localStorage를 참조하지 않으므로 테스트에서 그대로 불러 쓸 수 있습니다.
// 색 예외: 그림·팔레트 색은 사용자 데이터라 CSS 토큰이 아닌 이 파일의 JS 데이터로 둡니다(검증된 '#rrggbb'만 사용).

export const SIZE = 16;

// 기본 팔레트 (PICO-8 16색)
export const DEFAULT_PALETTE = [
  { name: '검정', value: '#000000' },
  { name: '남색', value: '#1d2b53' },
  { name: '자주', value: '#7e2553' },
  { name: '진초록', value: '#008751' },
  { name: '갈색', value: '#ab5236' },
  { name: '진회색', value: '#5f574f' },
  { name: '회색', value: '#c2c3c7' },
  { name: '흰색', value: '#fff1e8' },
  { name: '빨강', value: '#ff004d' },
  { name: '주황', value: '#ffa300' },
  { name: '노랑', value: '#ffec27' },
  { name: '연두', value: '#00e436' },
  { name: '하늘', value: '#29adff' },
  { name: '보라', value: '#83769c' },
  { name: '분홍', value: '#ff77a8' },
  { name: '살구', value: '#ffccaa' }
];

// ---------- 격자 ----------

export function createGrid(size = SIZE) {
  const grid = [];
  for (let y = 0; y < size; y += 1) {
    grid.push(new Array(size).fill(null));
  }
  return grid;
}

export function inBounds(grid, x, y) {
  return Number.isInteger(x) && Number.isInteger(y) &&
    y >= 0 && y < grid.length && x >= 0 && x < grid[y].length;
}

export function getPixel(grid, x, y) {
  return inBounds(grid, x, y) ? grid[y][x] : null;
}

// 범위 밖이거나 같은 값이면 grid 그대로, 아니면 해당 행만 복사한 새 Grid
export function setPixel(grid, x, y, color) {
  if (!inBounds(grid, x, y) || grid[y][x] === color) return grid;
  const next = grid.slice();
  const row = grid[y].slice();
  row[x] = color;
  next[y] = row;
  return next;
}

// 여러 칸을 한 번에 칠합니다 (바뀐 행만 한 번씩 복사)
export function setPixels(grid, points, color) {
  let next = grid;
  const copied = new Set();
  for (const { x, y } of points) {
    if (!inBounds(grid, x, y) || next[y][x] === color) continue;
    if (next === grid) next = grid.slice();
    if (!copied.has(y)) {
      next[y] = next[y].slice();
      copied.add(y);
    }
    next[y][x] = color;
  }
  return next;
}

// 4방향 연결 영역 채우기 (스택 사용, 재귀 없음)
export function floodFill(grid, x, y, color) {
  if (!inBounds(grid, x, y)) return grid;
  const target = grid[y][x];
  if (target === color) return grid;
  const height = grid.length;
  const width = grid[0].length;
  const visited = new Uint8Array(width * height);
  const points = [];
  const stack = [[x, y]];
  while (stack.length > 0) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
    const index = cy * width + cx;
    if (visited[index]) continue;
    visited[index] = 1;
    if (grid[cy][cx] !== target) continue;
    points.push({ x: cx, y: cy });
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return setPixels(grid, points, color);
}

// 브레젠험 직선: 양 끝 포함
export function linePoints(x0, y0, x1, y1) {
  const points = [];
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    points.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
}

export function isEmpty(grid) {
  return grid.every((row) => row.every((cell) => cell === null));
}

export function gridEquals(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let y = 0; y < a.length; y += 1) {
    if (a[y] === b[y]) continue;
    if (a[y].length !== b[y].length) return false;
    for (let x = 0; x < a[y].length; x += 1) {
      if (a[y][x] !== b[y][x]) return false;
    }
  }
  return true;
}

// '#abc'·'#AABBCC' → '#aabbcc', 그 외는 null
export function normalizeColor(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(text)) return text;
  if (/^#[0-9a-f]{3}$/.test(text)) {
    return '#' + text[1] + text[1] + text[2] + text[2] + text[3] + text[3];
  }
  return null;
}

// ---------- 직렬화 ----------

export function serialize(grid) {
  const pixels = [];
  for (const row of grid) {
    for (const cell of row) pixels.push(cell);
  }
  return { v: 1, size: SIZE, pixels };
}

// 형식·길이·색 검증에 실패하면 null
export function deserialize(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  if (data.v !== 1 || data.size !== SIZE) return null;
  if (!Array.isArray(data.pixels) || data.pixels.length !== SIZE * SIZE) return null;
  const grid = createGrid(SIZE);
  for (let i = 0; i < data.pixels.length; i += 1) {
    const value = data.pixels[i];
    let color = null;
    if (value !== null) {
      color = normalizeColor(value);
      if (color === null) return null;
    }
    grid[Math.floor(i / SIZE)][i % SIZE] = color;
  }
  return grid;
}

// ---------- 히스토리 ----------

export function createHistory(grid, limit = 100) {
  return { past: [], present: grid, future: [], limit };
}

// grid === present면 그대로. future는 비우고 past는 limit 길이로 유지
export function commit(history, grid) {
  if (grid === history.present) return history;
  const past = history.past.concat([history.present]);
  while (past.length > history.limit) past.shift();
  return { past, present: grid, future: [], limit: history.limit };
}

export function undo(history) {
  if (history.past.length === 0) return history;
  const past = history.past.slice(0, -1);
  const present = history.past[history.past.length - 1];
  return { past, present, future: [history.present].concat(history.future), limit: history.limit };
}

export function redo(history) {
  if (history.future.length === 0) return history;
  const [present, ...future] = history.future;
  return { past: history.past.concat([history.present]), present, future, limit: history.limit };
}

export function canUndo(history) {
  return history.past.length > 0;
}

export function canRedo(history) {
  return history.future.length > 0;
}
