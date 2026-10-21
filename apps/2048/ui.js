// 2048 화면 렌더링과 입력 처리
// innerHTML을 쓰지 않고 textContent, className, style.setProperty로만 그립니다.
import { newGame, step, continueGame, fromValues, WIN_VALUE } from './game.js';
import { loadBest, saveBest } from './storage.js';

const boardEl = document.getElementById('board');
const layerEl = document.getElementById('tile-layer');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const floatEl = document.getElementById('score-float');
const liveEl = document.getElementById('live');
const winOverlay = document.getElementById('overlay-win');
const overOverlay = document.getElementById('overlay-over');
const overScoreEl = document.getElementById('overlay-over-score');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const MOVE_MS = 110;
const SWIPE_MIN = 30;

// 데모 모드: ?demo=1 이면 미리 정한 보드를 띄웁니다 (preview.png 캡처용, 최고 점수 저장 안 함).
const isDemo = new URLSearchParams(window.location.search).get('demo') === '1';

const tileEls = new Map(); // 타일 id → DOM 요소
let pendingRemoval = []; // 이동 후 제거할 요소
let removalTimer = 0;

let state = null;
let best = 0;

function formatNumber(n) {
  return n.toLocaleString('ko-KR');
}

function moveDelay() {
  return reducedMotion.matches ? 0 : MOVE_MS;
}

// ---------- 타일 요소 ----------

function tileClass(value) {
  const digits = String(value).length;
  const valueClass = value > WIN_VALUE ? 'tile-super' : `tile-${value}`;
  const digitClass = digits >= 5 ? 'digits-5' : digits >= 3 ? `digits-${digits}` : '';
  return ['tile', valueClass, digitClass].filter(Boolean).join(' ');
}

function setPosition(el, row, col) {
  el.style.setProperty('--r', String(row));
  el.style.setProperty('--c', String(col));
}

function createTileEl(tile, row, col, extraClass) {
  const el = document.createElement('div');
  el.className = extraClass ? `${tileClass(tile.value)} ${extraClass}` : tileClass(tile.value);
  setPosition(el, row, col);
  const inner = document.createElement('div');
  inner.className = 'tile-inner';
  inner.textContent = String(tile.value);
  el.appendChild(inner);
  layerEl.appendChild(el);
  tileEls.set(tile.id, el);
  return el;
}

// 진행 중인 애니메이션을 즉시 끝내고 최종 상태로 맞춥니다.
function finishAnimations() {
  window.clearTimeout(removalTimer);
  pendingRemoval.forEach((el) => el.remove());
  pendingRemoval = [];
  layerEl.classList.add('is-snapping');
  tileEls.forEach((el) => {
    el.classList.remove('tile-new', 'tile-merged');
  });
  // 강제로 스타일을 계산해 전환 없이 최종 위치에 고정한 뒤 전환을 되살립니다.
  void layerEl.offsetWidth;
  layerEl.classList.remove('is-snapping');
}

// 보드 전체를 새로 그립니다 (새 게임, 데모 시작 시).
function renderFull(newIds = []) {
  finishAnimations();
  tileEls.forEach((el) => el.remove());
  tileEls.clear();
  state.board.forEach((row, r) => row.forEach((tile, c) => {
    if (tile) createTileEl(tile, r, c, newIds.includes(tile.id) ? 'tile-new' : '');
  }));
}

// 한 번의 이동 결과를 애니메이션과 함께 반영합니다.
function renderStep(result) {
  const { merges, removed, spawned } = result;

  // 합쳐져 사라질 원본: 목적지로 옮긴 뒤 이동이 끝나면 제거
  removed.forEach(({ id, row, col }) => {
    const el = tileEls.get(id);
    if (!el) return;
    setPosition(el, row, col);
    tileEls.delete(id);
    pendingRemoval.push(el);
  });

  // 남아 있는 타일: 위치만 갱신
  state.board.forEach((row, r) => row.forEach((tile, c) => {
    if (!tile) return;
    const el = tileEls.get(tile.id);
    if (el) setPosition(el, r, c);
  }));

  merges.forEach((m) => createTileEl(m, m.row, m.col, 'tile-merged'));
  spawned.forEach((t) => createTileEl(t, t.row, t.col, 'tile-new'));

  if (pendingRemoval.length > 0) {
    const delay = moveDelay();
    if (delay === 0) {
      pendingRemoval.forEach((el) => el.remove());
      pendingRemoval = [];
    } else {
      removalTimer = window.setTimeout(() => {
        pendingRemoval.forEach((el) => el.remove());
        pendingRemoval = [];
      }, delay);
    }
  }
}

// ---------- 점수 ----------

function renderScore() {
  scoreEl.textContent = formatNumber(state.score);
  bestEl.textContent = formatNumber(best);
}

function showScoreFloat(gained) {
  const label = document.createElement('span');
  label.className = 'score-float';
  label.textContent = `+${gained}`;
  floatEl.appendChild(label);
  window.setTimeout(() => label.remove(), 500);
}

function updateBest() {
  if (state.score > best) {
    best = state.score;
    if (!isDemo) saveBest(best);
  }
}

function announce(message) {
  liveEl.textContent = message;
}

// ---------- 오버레이 ----------

function isOverlayOpen() {
  return !winOverlay.hidden || !overOverlay.hidden;
}

function openOverlay(overlay) {
  overlay.hidden = false;
  const firstButton = overlay.querySelector('button');
  if (firstButton) firstButton.focus();
}

function closeOverlays() {
  const wasOpen = isOverlayOpen();
  winOverlay.hidden = true;
  overOverlay.hidden = true;
  if (wasOpen) boardEl.focus({ preventScroll: true });
}

// ---------- 게임 흐름 ----------

function startNewGame() {
  const result = newGame(Math.random);
  state = result.state;
  closeOverlays();
  renderFull(result.spawned.map((t) => t.id));
  renderScore();
  announce('새 게임을 시작했습니다.');
  // 버튼에 포커스가 남으면 키 입력이 무시되므로 항상 보드로 옮깁니다.
  boardEl.focus({ preventScroll: true });
}

function handleMove(direction) {
  if (!state || isOverlayOpen()) return;
  const prevWon = state.won;
  const result = step(state, direction, Math.random);
  if (!result.moved) return;

  finishAnimations();
  state = result.state;
  renderStep(result);

  if (result.scoreGained > 0) {
    updateBest();
    showScoreFloat(result.scoreGained);
    announce(`${formatNumber(result.scoreGained)}점 획득, 현재 ${formatNumber(state.score)}점`);
  }
  renderScore();

  if (!prevWon && state.won && !state.keepPlaying) {
    announce('2048 달성!');
    openOverlay(winOverlay);
  } else if (state.over) {
    overScoreEl.textContent = `점수 ${formatNumber(state.score)}`;
    announce(`게임 오버, 최종 점수 ${formatNumber(state.score)}점`);
    openOverlay(overOverlay);
  }
}

function handleContinue() {
  state = continueGame(state);
  closeOverlays();
  // 승리와 동시에 막힌 경우에는 바로 게임 오버를 띄웁니다.
  if (state.over) {
    overScoreEl.textContent = `점수 ${formatNumber(state.score)}`;
    announce(`게임 오버, 최종 점수 ${formatNumber(state.score)}점`);
    openOverlay(overOverlay);
  }
}

// ---------- 입력: 키보드 ----------

const KEY_MAP = {
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right'
};

// 한글 입력 상태에서도 WASD가 동작하도록 event.code로 보완합니다.
const CODE_MAP = {
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right'
};

function onKeyDown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target;
  if (target instanceof Element && target.closest('input, textarea, button')) return;
  const direction = KEY_MAP[(event.key || '').toLowerCase()] || CODE_MAP[event.code];
  if (!direction) return;
  event.preventDefault();
  handleMove(direction);
}

// ---------- 입력: 스와이프 ----------

let swipeStart = null;

function onPointerDown(event) {
  if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
  swipeStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
}

function onPointerUp(event) {
  if (!swipeStart || event.pointerId !== swipeStart.id) return;
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    handleMove(dx > 0 ? 'right' : 'left');
  } else {
    handleMove(dy > 0 ? 'down' : 'up');
  }
}

function onPointerCancel() {
  swipeStart = null;
}

// ---------- 초기화 ----------

function startDemo() {
  document.documentElement.classList.add('is-demo');
  const { board, nextId } = fromValues([
    [2, 4, 8, 16],
    [0, 32, 64, 128],
    [0, 4, 256, 512],
    [2, 0, 1024, 2048]
  ]);
  state = { board, score: 20480, nextId, won: true, keepPlaying: true, over: false };
  best = Math.max(loadBest(), 31240);
  renderFull();
  renderScore();
}

function init() {
  document.getElementById('new-game').addEventListener('click', startNewGame);
  document.getElementById('win-new-game').addEventListener('click', startNewGame);
  document.getElementById('retry').addEventListener('click', startNewGame);
  document.getElementById('continue').addEventListener('click', handleContinue);

  document.addEventListener('keydown', onKeyDown);
  boardEl.addEventListener('pointerdown', onPointerDown);
  boardEl.addEventListener('pointerup', onPointerUp);
  boardEl.addEventListener('pointercancel', onPointerCancel);

  if (isDemo) {
    startDemo();
    return;
  }

  best = loadBest();
  startNewGame();
  announce('');
}

init();
