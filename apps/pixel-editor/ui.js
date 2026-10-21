// 픽셀 에디터 화면: DOM 렌더링, 포인터·키보드 입력, 도구·팔레트 상태, 자동 저장, 상태 줄 알림.
// innerHTML은 쓰지 않고 textContent·className·style·setAttribute로만 렌더링합니다.
import {
  SIZE, DEFAULT_PALETTE, createGrid, getPixel, setPixels, floodFill, linePoints,
  isEmpty, normalizeColor, createHistory, commit, undo, redo, canUndo, canRedo
} from './editor.js';
import { downloadPng, makeFilename } from './export.js';
import { loadDrawing, saveDrawing, loadSettings, saveSettings, DEFAULT_SETTINGS } from './storage.js';

// 데모 모드: ?demo=1 이면 미리 정한 그림을 띄우고 localStorage를 읽지도 쓰지도 않습니다 (preview.png 캡처용).
const isDemo = new URLSearchParams(window.location.search).get('demo') === '1';

// 데모 그림: 네온 우주 침략자 + 하트 (문자 → 색)
const DEMO_COLORS = {
  g: '#00e436', // 연두
  w: '#fff1e8', // 흰색
  r: '#ff004d', // 빨강
  p: '#ff77a8', // 분홍
  b: '#29adff', // 하늘
  y: '#ffec27'  // 노랑
};
const DEMO_ART = [
  '................',
  '..g.....g....y..',
  '...g...g........',
  '..ggggggg.......',
  '.gg.ggg.gg...b..',
  'ggggggggggg.....',
  'g.ggggggg.g.....',
  'g.g.....g.g.....',
  '...gg.gg........',
  '................',
  '.....rr.rr...b..',
  '....rrwrrrr.....',
  '.y..rwrrrrr.....',
  '.....rrrrp......',
  '......rrp.......',
  '.......r........'
];

const TOOL_NAMES = { pencil: '연필', eraser: '지우개', fill: '채우기', picker: '스포이트' };

const board = document.getElementById('board');
const gridLinesEl = document.getElementById('grid-lines');
const hoverCell = document.getElementById('hover-cell');
const cursorCell = document.getElementById('cursor-cell');
const paletteEl = document.getElementById('palette');
const customLabel = document.getElementById('custom-label');
const customInput = document.getElementById('custom-color');
const customSwatch = document.getElementById('custom-swatch');
const currentSwatch = document.getElementById('current-swatch');
const currentHex = document.getElementById('current-hex');
const undoButton = document.getElementById('undo');
const redoButton = document.getElementById('redo');
const gridToggle = document.getElementById('grid-toggle');
const clearButton = document.getElementById('clear');
const scaleSelect = document.getElementById('scale');
const statusEl = document.getElementById('status');
const toolButtons = Array.from(document.querySelectorAll('[data-tool]'));

const cells = [];          // 칸 DOM 256개 (index = y*16 + x)
const swatchButtons = [];  // 팔레트 견본 버튼 16개

let settings = { ...DEFAULT_SETTINGS };
let history = createHistory(createGrid());
let tool = 'pencil';
let cursor = { x: 7, y: 7 };

// 획 상태
let activePointerId = null;
let working = null;
let lastCell = null;

let keyboardMode = false;     // 마지막 입력이 키보드였는지 (커서 표시용)
let saveFailedNotice = false; // 자동 저장 실패 안내는 한 번만

// ---------- 공통 ----------

function announce(message) {
  // 같은 문구가 반복돼도 다시 읽히도록 비웠다가 넣습니다.
  statusEl.textContent = '';
  window.requestAnimationFrame(() => {
    statusEl.textContent = message;
  });
}

function colorLabel(color) {
  const entry = DEFAULT_PALETTE.find((item) => item.value === color);
  return `${entry ? entry.name : '직접 선택'} ${color}`;
}

function persistDrawing() {
  if (isDemo) return;
  if (!saveDrawing(history.present) && !saveFailedNotice) {
    saveFailedNotice = true;
    announce('이 브라우저에서는 자동 저장이 되지 않습니다');
  }
}

function persistSettings() {
  if (isDemo) return;
  saveSettings(settings);
}

// ---------- 렌더링 ----------

function buildBoard() {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < SIZE * SIZE; i += 1) {
    const cell = document.createElement('div');
    cell.className = 'px';
    cell.setAttribute('aria-hidden', 'true');
    cells.push(cell);
    fragment.appendChild(cell);
  }
  // 칸은 오버레이(격자선·커서)보다 앞에 둡니다.
  board.insertBefore(fragment, board.firstChild);
}

function paintCell(x, y, color) {
  cells[y * SIZE + x].style.backgroundColor = color || '';
}

// 이전 grid와 비교해 바뀐 칸만 갱신 (prev가 null이면 전체)
function renderGrid(prev, next) {
  for (let y = 0; y < SIZE; y += 1) {
    if (prev && prev[y] === next[y]) continue;
    for (let x = 0; x < SIZE; x += 1) {
      if (prev && prev[y][x] === next[y][x]) continue;
      paintCell(x, y, next[y][x]);
    }
  }
}

function renderHistoryButtons() {
  undoButton.disabled = !canUndo(history);
  redoButton.disabled = !canRedo(history);
}

function buildPalette() {
  DEFAULT_PALETTE.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'swatch';
    button.dataset.color = item.value;
    button.style.backgroundColor = item.value;
    button.setAttribute('aria-label', `${item.name} ${item.value}`);
    button.setAttribute('aria-pressed', 'false');
    button.title = `${item.name} ${item.value}`;
    button.addEventListener('click', () => selectColor(item.value, true));
    swatchButtons.push(button);
    paletteEl.insertBefore(button, customLabel);
  });
}

function renderColor() {
  const color = settings.color;
  currentSwatch.style.backgroundColor = color;
  currentHex.textContent = color;
  customSwatch.style.backgroundColor = settings.customColor;
  customInput.value = settings.customColor;
  let inPalette = false;
  swatchButtons.forEach((button) => {
    const selected = button.dataset.color === color;
    if (selected) inPalette = true;
    button.setAttribute('aria-pressed', String(selected));
  });
  customLabel.classList.toggle('is-selected', !inPalette && color === settings.customColor);
}

function renderTool() {
  toolButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.tool === tool));
  });
}

function renderGridLines() {
  gridLinesEl.hidden = !settings.gridLines;
  gridToggle.setAttribute('aria-pressed', String(settings.gridLines));
}

function renderCursor() {
  cursorCell.style.setProperty('--x', String(cursor.x));
  cursorCell.style.setProperty('--y', String(cursor.y));
}

// ---------- 상태 변경 ----------

function selectColor(color, speak) {
  settings.color = color;
  renderColor();
  persistSettings();
  if (speak) announce(`${colorLabel(color)} 선택`);
}

function setTool(next, speak = true) {
  tool = next;
  renderTool();
  if (speak) announce(`${TOOL_NAMES[next]} 도구`);
}

// 히스토리를 새 값으로 바꾸고 화면·저장을 갱신
function applyHistory(next) {
  if (next === history) return false;
  const prev = history.present;
  history = next;
  renderGrid(prev, history.present);
  renderHistoryButtons();
  persistDrawing();
  return true;
}

function handleUndo() {
  if (activePointerId !== null) return; // 획을 그리는 중에는 무시 (history와 working 어긋남 방지)
  if (applyHistory(undo(history))) announce('되돌림');
}

function handleRedo() {
  if (activePointerId !== null) return; // 획을 그리는 중에는 무시 (history와 working 어긋남 방지)
  if (applyHistory(redo(history))) announce('다시 실행함');
}

function toggleGridLines() {
  settings.gridLines = !settings.gridLines;
  renderGridLines();
  persistSettings();
  announce(settings.gridLines ? '격자선 켬' : '격자선 끔');
}

function clearAll() {
  if (activePointerId !== null) return; // 획을 그리는 중에는 무시 (history와 working 어긋남 방지)
  if (isEmpty(history.present)) {
    announce('이미 비어 있습니다');
    return;
  }
  if (!window.confirm('그림을 모두 지울까요?')) return;
  applyHistory(commit(history, createGrid()));
  announce('그림을 모두 지웠습니다. 되돌리기로 복구할 수 있습니다');
}

function pickColor(x, y) {
  const color = getPixel(history.present, x, y);
  if (color === null) {
    announce('빈 칸에는 색이 없습니다');
    return;
  }
  if (!DEFAULT_PALETTE.some((item) => item.value === color)) {
    settings.customColor = color;
  }
  selectColor(color, false);
  setTool('pencil', false);
  announce(`${colorLabel(color)} 가져옴, 연필 도구`);
}

function savePng() {
  const scale = settings.scale;
  const px = SIZE * scale;
  downloadPng(history.present, scale, makeFilename())
    .then(() => announce(`${px}×${px} PNG로 저장했습니다`))
    .catch(() => announce('PNG를 만들지 못했습니다'));
}

// 한 칸에 현재 도구를 적용 (키보드용, 1회 = 히스토리 1단계)
function applyToolAt(x, y) {
  if (activePointerId !== null) return; // 획을 그리는 중에는 무시 (history와 working 어긋남 방지)
  if (tool === 'picker') {
    pickColor(x, y);
    return;
  }
  let next;
  if (tool === 'fill') {
    next = floodFill(history.present, x, y, settings.color);
  } else {
    const color = tool === 'eraser' ? null : settings.color;
    next = setPixels(history.present, [{ x, y }], color);
  }
  applyHistory(commit(history, next));
}

// ---------- 포인터 입력 ----------

function cellFromEvent(event) {
  const rect = board.getBoundingClientRect();
  const left = rect.left + board.clientLeft;
  const top = rect.top + board.clientTop;
  const width = board.clientWidth;
  const height = board.clientHeight;
  const relX = event.clientX - left;
  const relY = event.clientY - top;
  if (relX < 0 || relY < 0 || relX >= width || relY >= height) return null;
  return {
    x: Math.min(SIZE - 1, Math.max(0, Math.floor((relX / width) * SIZE))),
    y: Math.min(SIZE - 1, Math.max(0, Math.floor((relY / height) * SIZE)))
  };
}

function strokeTo(cell) {
  const points = lastCell ? linePoints(lastCell.x, lastCell.y, cell.x, cell.y) : [cell];
  const color = tool === 'eraser' ? null : settings.color;
  const prev = working;
  working = setPixels(working, points, color);
  if (working !== prev) renderGrid(prev, working);
  lastCell = cell;
}

function finishStroke() {
  if (activePointerId === null) return;
  activePointerId = null;
  lastCell = null;
  const next = working;
  working = null;
  if (next === history.present) return;
  // 화면은 이미 그려졌으므로 히스토리만 커밋
  history = commit(history, next);
  renderHistoryButtons();
  persistDrawing();
}

function updateHover(event) {
  if (event.pointerType !== 'mouse' || activePointerId !== null) {
    hoverCell.hidden = true;
    return;
  }
  const cell = cellFromEvent(event);
  if (!cell) {
    hoverCell.hidden = true;
    return;
  }
  hoverCell.style.setProperty('--x', String(cell.x));
  hoverCell.style.setProperty('--y', String(cell.y));
  hoverCell.hidden = false;
}

function onPointerDown(event) {
  if (activePointerId !== null) return; // 두 번째 손가락 무시
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const cell = cellFromEvent(event);
  if (!cell) return;
  event.preventDefault();
  keyboardMode = false;
  board.classList.remove('is-keyboard');
  board.focus({ preventScroll: true });
  cursor = cell;
  renderCursor();

  if (tool === 'fill' || tool === 'picker') {
    applyToolAt(cell.x, cell.y);
    return;
  }
  activePointerId = event.pointerId;
  try {
    board.setPointerCapture(event.pointerId);
  } catch (e) {
    // 캡처 실패는 무시 (보드 안에서는 그대로 동작)
  }
  hoverCell.hidden = true;
  working = history.present;
  lastCell = null;
  strokeTo(cell);
}

function onPointerMove(event) {
  if (activePointerId === null) {
    updateHover(event);
    return;
  }
  if (event.pointerId !== activePointerId) return;
  const cell = cellFromEvent(event);
  if (!cell) return;
  if (lastCell && lastCell.x === cell.x && lastCell.y === cell.y) return;
  strokeTo(cell);
}

function onPointerEnd(event) {
  if (event.pointerId !== activePointerId) return;
  finishStroke();
  if (event.type === 'pointerup') updateHover(event);
}

// ---------- 키보드 입력 ----------

function isTypingTarget(target) {
  if (!target || !target.tagName) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'select' || tag === 'textarea' || target.isContentEditable;
}

function moveCursor(dx, dy, absolute) {
  if (absolute) {
    cursor = { x: absolute.x, y: absolute.y };
  } else {
    cursor = {
      x: Math.min(SIZE - 1, Math.max(0, cursor.x + dx)),
      y: Math.min(SIZE - 1, Math.max(0, cursor.y + dy))
    };
  }
  renderCursor();
  announceCursor();
}

function announceCursor() {
  const color = getPixel(history.present, cursor.x, cursor.y);
  announce(`x ${cursor.x + 1}, y ${cursor.y + 1}: ${color ? colorLabel(color) : '빈 칸'}`);
}

function onBoardKeyDown(event) {
  const key = event.key || '';
  const ctrl = event.ctrlKey || event.metaKey;
  const step = event.shiftKey ? 4 : 1;
  let handled = true;
  switch (key) {
    case 'ArrowLeft': moveCursor(-step, 0); break;
    case 'ArrowRight': moveCursor(step, 0); break;
    case 'ArrowUp': moveCursor(0, -step); break;
    case 'ArrowDown': moveCursor(0, step); break;
    case 'Home': moveCursor(0, 0, ctrl ? { x: 0, y: 0 } : { x: 0, y: cursor.y }); break;
    case 'End': moveCursor(0, 0, ctrl ? { x: SIZE - 1, y: SIZE - 1 } : { x: SIZE - 1, y: cursor.y }); break;
    case ' ':
    case 'Spacebar':
    case 'Enter':
      if (ctrl || event.altKey) {
        handled = false;
        break;
      }
      applyToolAt(cursor.x, cursor.y);
      break;
    default:
      handled = false;
  }
  if (handled) {
    event.preventDefault();
    keyboardMode = true;
    board.classList.add('is-keyboard');
  }
}

function onGlobalKeyDown(event) {
  if (isTypingTarget(event.target)) return;
  const code = event.code || '';
  const key = (event.key || '').toLowerCase();
  const ctrl = event.ctrlKey || event.metaKey;

  if (ctrl && !event.altKey) {
    if (code === 'KeyZ' || key === 'z') {
      event.preventDefault();
      if (event.shiftKey) handleRedo();
      else handleUndo();
    } else if ((code === 'KeyY' || key === 'y') && event.ctrlKey && !event.shiftKey) {
      event.preventDefault();
      handleRedo();
    }
    return;
  }
  if (event.altKey || event.shiftKey || event.repeat) return;

  switch (code) {
    case 'KeyB': setTool('pencil'); break;
    case 'KeyE': setTool('eraser'); break;
    case 'KeyF': setTool('fill'); break;
    case 'KeyI': setTool('picker'); break;
    case 'KeyG': toggleGridLines(); break;
    default: return;
  }
  event.preventDefault();
}

// 마지막 입력 방식 추적: Tab으로 보드에 들어오면 커서를 보여 줍니다.
function onAnyKeyDown() {
  keyboardMode = true;
}

function onAnyPointerDown() {
  keyboardMode = false;
}

function onBoardFocus() {
  board.classList.toggle('is-keyboard', keyboardMode);
}

// ---------- 초기화 ----------

function demoGrid() {
  const grid = createGrid();
  DEMO_ART.forEach((row, y) => {
    for (let x = 0; x < SIZE; x += 1) {
      const color = DEMO_COLORS[row[x]];
      if (color) grid[y][x] = color;
    }
  });
  return grid;
}

function bindEvents() {
  board.addEventListener('pointerdown', onPointerDown);
  board.addEventListener('pointermove', onPointerMove);
  board.addEventListener('pointerup', onPointerEnd);
  board.addEventListener('pointercancel', onPointerEnd);
  board.addEventListener('lostpointercapture', onPointerEnd);
  board.addEventListener('pointerleave', () => {
    hoverCell.hidden = true;
  });
  board.addEventListener('contextmenu', (event) => event.preventDefault());
  board.addEventListener('keydown', onBoardKeyDown);
  board.addEventListener('focus', onBoardFocus);
  board.addEventListener('blur', () => board.classList.remove('is-keyboard'));

  document.addEventListener('keydown', onAnyKeyDown, true);
  document.addEventListener('pointerdown', onAnyPointerDown, true);
  document.addEventListener('keydown', onGlobalKeyDown);

  toolButtons.forEach((button) => {
    button.addEventListener('click', () => setTool(button.dataset.tool));
  });
  undoButton.addEventListener('click', handleUndo);
  redoButton.addEventListener('click', handleRedo);
  gridToggle.addEventListener('click', toggleGridLines);
  clearButton.addEventListener('click', clearAll);

  customInput.addEventListener('input', () => {
    const color = normalizeColor(customInput.value);
    if (!color) return;
    settings.customColor = color;
    selectColor(color, false);
  });
  customInput.addEventListener('change', () => {
    const color = normalizeColor(customInput.value);
    if (color) announce(`${colorLabel(color)} 선택`);
  });
  // 값이 그대로여도 누르면 직접 선택 색을 현재 색으로
  customInput.addEventListener('click', () => {
    if (settings.color !== settings.customColor) selectColor(settings.customColor, true);
  });

  scaleSelect.addEventListener('change', () => {
    const scale = Number(scaleSelect.value);
    if ([1, 8, 16, 32].includes(scale)) {
      settings.scale = scale;
      persistSettings();
    }
  });

  document.getElementById('save-top').addEventListener('click', savePng);
  document.getElementById('save-side').addEventListener('click', savePng);
}

function init() {
  let grid = createGrid();
  if (isDemo) {
    document.documentElement.classList.add('is-demo');
    grid = demoGrid();
  } else {
    settings = loadSettings();
    grid = loadDrawing() || grid;
  }
  history = createHistory(grid);

  buildBoard();
  buildPalette();
  renderGrid(null, history.present);
  renderColor();
  renderTool();
  renderGridLines();
  renderCursor();
  renderHistoryButtons();
  scaleSelect.value = String(settings.scale);
  bindEvents();
}

init();
