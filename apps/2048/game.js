// 2048 순수 게임 로직
// DOM, localStorage, Math.random을 직접 참조하지 않습니다.
// 모든 함수는 입력을 바꾸지 않고 새 값을 반환합니다.

export const SIZE = 4;
export const WIN_VALUE = 2048;

const DIRECTIONS = ['up', 'down', 'left', 'right'];

// 빈 보드를 만듭니다.
export function createEmptyBoard(size = SIZE) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

// 숫자 배열(빈 칸 0)을 Board로 바꿉니다. 테스트·데모용.
export function fromValues(values, startId = 1) {
  let nextId = startId;
  const board = values.map((row) => row.map((value) => {
    if (!value) return null;
    const tile = { id: nextId, value };
    nextId += 1;
    return tile;
  }));
  return { board, nextId };
}

// Board를 숫자 배열(빈 칸 0)로 바꿉니다.
export function toValues(board) {
  return board.map((row) => row.map((tile) => (tile ? tile.value : 0)));
}

// 한 줄을 왼쪽으로 민다고 가정하고 처리합니다.
export function slideLine(line, nextId) {
  const tiles = line.filter((tile) => tile !== null);
  const result = [];
  const merges = [];
  let scoreGained = 0;
  let id = nextId;

  for (let i = 0; i < tiles.length; i += 1) {
    const a = tiles[i];
    const b = tiles[i + 1];
    if (b && a.value === b.value) {
      // 이동 방향 쪽 타일부터 짝을 짓고, 둘 다 소비합니다 (재합치기 없음).
      const merged = { id, value: a.value * 2 };
      id += 1;
      merges.push({ id: merged.id, value: merged.value, index: result.length, from: [a.id, b.id] });
      scoreGained += merged.value;
      result.push(merged);
      i += 1;
    } else {
      result.push({ id: a.id, value: a.value });
    }
  }

  while (result.length < line.length) result.push(null);

  const moved = line.some((tile, index) => {
    const after = result[index];
    if (tile === null && after === null) return false;
    if (tile === null || after === null) return true;
    return tile.id !== after.id;
  });

  return { line: result, scoreGained, moved, merges, nextId: id };
}

// 방향별로 줄의 i번째 칸이 보드의 어느 좌표인지 계산합니다.
function toCoord(direction, lineIndex, i, size) {
  switch (direction) {
    case 'left':
      return { row: lineIndex, col: i };
    case 'right':
      return { row: lineIndex, col: size - 1 - i };
    case 'up':
      return { row: i, col: lineIndex };
    case 'down':
      return { row: size - 1 - i, col: lineIndex };
    default:
      throw new Error(`알 수 없는 방향: ${direction}`);
  }
}

// 보드 전체를 한 방향으로 이동합니다.
export function move(board, direction, nextId) {
  if (!DIRECTIONS.includes(direction)) throw new Error(`알 수 없는 방향: ${direction}`);
  const size = board.length;
  const out = createEmptyBoard(size);
  const merges = [];
  const removed = [];
  let scoreGained = 0;
  let moved = false;
  let id = nextId;

  for (let lineIndex = 0; lineIndex < size; lineIndex += 1) {
    const line = [];
    for (let i = 0; i < size; i += 1) {
      const { row, col } = toCoord(direction, lineIndex, i, size);
      const tile = board[row][col];
      line.push(tile ? { id: tile.id, value: tile.value } : null);
    }

    const res = slideLine(line, id);
    id = res.nextId;
    scoreGained += res.scoreGained;
    if (res.moved) moved = true;

    res.line.forEach((tile, i) => {
      const { row, col } = toCoord(direction, lineIndex, i, size);
      out[row][col] = tile;
    });

    res.merges.forEach((merge) => {
      const { row, col } = toCoord(direction, lineIndex, merge.index, size);
      merges.push({ id: merge.id, value: merge.value, row, col, from: merge.from });
      merge.from.forEach((fromId) => removed.push({ id: fromId, row, col }));
    });
  }

  return { board: out, scoreGained, moved, merges, removed, nextId: id };
}

// 빈 칸 좌표 목록 (행 우선 순서).
export function getEmptyCells(board) {
  const cells = [];
  board.forEach((row, r) => row.forEach((tile, c) => {
    if (tile === null) cells.push({ row: r, col: c });
  }));
  return cells;
}

// 빈 칸 하나에 새 타일을 만듭니다. rng() < 0.9 → 2, 아니면 4.
export function spawnTile(board, rng, nextId) {
  const cells = getEmptyCells(board);
  if (cells.length === 0) return { board, tile: null, nextId };
  const cell = cells[Math.floor(rng() * cells.length)];
  const value = rng() < 0.9 ? 2 : 4;
  const tile = { id: nextId, value, row: cell.row, col: cell.col };
  const out = board.map((row) => row.slice());
  out[cell.row][cell.col] = { id: tile.id, value };
  return { board: out, tile, nextId: nextId + 1 };
}

// 보드에 정확히 그 값의 타일이 있는지 확인합니다.
export function hasValue(board, value) {
  return board.some((row) => row.some((tile) => tile !== null && tile.value === value));
}

// 빈 칸이 있거나 상하좌우로 인접한 같은 값이 있으면 이동 가능합니다.
export function canMove(board) {
  const size = board.length;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const tile = board[r][c];
      if (tile === null) return true;
      const right = c + 1 < size ? board[r][c + 1] : null;
      const down = r + 1 < size ? board[r + 1][c] : null;
      if (right && right.value === tile.value) return true;
      if (down && down.value === tile.value) return true;
    }
  }
  return false;
}

// 새 게임: 빈 보드에 타일 2개.
export function newGame(rng) {
  let board = createEmptyBoard();
  let nextId = 1;
  const spawned = [];
  for (let i = 0; i < 2; i += 1) {
    const res = spawnTile(board, rng, nextId);
    board = res.board;
    nextId = res.nextId;
    if (res.tile) spawned.push(res.tile);
  }
  const state = { board, score: 0, nextId, won: false, keepPlaying: false, over: false };
  return { state, spawned };
}

// 한 번의 입력 처리: 이동 → 점수 → 새 타일 → 승리/게임 오버 판정.
export function step(state, direction, rng) {
  const res = move(state.board, direction, state.nextId);
  if (!res.moved) {
    return { state, moved: false, scoreGained: 0, merges: [], removed: [], spawned: [] };
  }
  const spawn = spawnTile(res.board, rng, res.nextId);
  const board = spawn.board;
  const next = {
    board,
    score: state.score + res.scoreGained,
    nextId: spawn.nextId,
    won: state.won || hasValue(board, WIN_VALUE),
    keepPlaying: state.keepPlaying,
    over: !canMove(board)
  };
  return {
    state: next,
    moved: true,
    scoreGained: res.scoreGained,
    merges: res.merges,
    removed: res.removed,
    spawned: spawn.tile ? [spawn.tile] : []
  };
}

// '계속하기' 선택.
export function continueGame(state) {
  return { ...state, keepPlaying: true };
}
