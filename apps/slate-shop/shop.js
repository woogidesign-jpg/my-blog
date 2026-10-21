// SLATE 쇼핑몰 순수 로직 (DOM·localStorage 참조 없음)
// 모든 함수는 입력을 바꾸지 않고 새 값을 돌려줍니다.

import { QTY_MIN, QTY_MAX, CART_LINE_MAX, IMAGE_COUNT, HOME_LIMIT } from './data.js';

// ---------- 라우트 ----------

// 해시를 화면 정보로 바꿉니다. id는 1 이상 정수(앞자리 0 없음)만 받습니다.
export function parseRoute(hash) {
  const h = typeof hash === 'string' ? hash : '';
  if (h === '' || h === '#' || h === '#/') return { name: 'home' };
  const m = /^#\/product\/([1-9]\d{0,8})$/.exec(h);
  if (m) return { name: 'product', id: Number(m[1]) };
  return { name: 'notFound' };
}

export function productHref(id) {
  return `#/product/${id}`;
}

export function findProduct(products, id) {
  return products.find((p) => p.id === id) || null;
}

// ---------- 가격 ----------

// 189000 → '189,000' (로케일에 기대지 않음)
export function formatPrice(n) {
  const v = Number.isFinite(n) ? Math.trunc(n) : 0;
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function pointsFor(price) {
  return Math.floor(price * 0.01);
}

export function lineTotal(price, qty) {
  return price * qty;
}

// ---------- 목록 ----------

export function filterProducts(products, chip) {
  if (chip === '전체') return products.slice();
  return products.filter((p) => p.cat === chip);
}

export function visibleProducts(list, expanded, limit = HOME_LIMIT) {
  if (expanded || list.length <= limit) return { items: list.slice(), hasMore: false };
  return { items: list.slice(0, limit), hasMore: true };
}

// ---------- 찜 ----------

export function toggleWish(ids, id) {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

export function isWished(ids, id) {
  return ids.includes(id);
}

// ---------- 상세 선택 ----------

export function clampQty(n, min = QTY_MIN, max = QTY_MAX) {
  if (!Number.isInteger(n)) return min;
  return Math.min(max, Math.max(min, n));
}

// 품절 아닌 사이즈가 정확히 하나면 자동 선택합니다.
export function initialSelection(product) {
  const avail = [];
  product.sizes.forEach((s, i) => {
    if (!s.soldOut) avail.push(i);
  });
  return { color: 0, size: avail.length === 1 ? avail[0] : null, qty: 1, image: 1 };
}

export function pickSize(product, sel, index) {
  const s = product.sizes[index];
  if (!Number.isInteger(index) || !s || s.soldOut) return sel;
  return { ...sel, size: index };
}

export function pickColor(product, sel, index) {
  if (!Number.isInteger(index) || !product.colors[index]) return sel;
  return { ...sel, color: index };
}

export function stepImage(current, dir, total = IMAGE_COUNT) {
  return ((current - 1 + dir + total) % total) + 1;
}

export function validateForCart(product, sel) {
  const s = sel.size === null || sel.size === undefined ? null : product.sizes[sel.size];
  if (!s || s.soldOut) return { ok: false, reason: 'size' };
  return { ok: true };
}

// ---------- 장바구니 ----------

export function addToCart(cart, item, lineMax = CART_LINE_MAX) {
  const idx = cart.findIndex((c) => c.productId === item.productId && c.color === item.color && c.size === item.size);
  if (idx === -1) {
    return [...cart, { productId: item.productId, color: item.color, size: item.size, qty: Math.min(lineMax, item.qty) }];
  }
  return cart.map((c, i) => (i === idx ? { ...c, qty: Math.min(lineMax, c.qty + item.qty) } : { ...c }));
}

export function cartCount(cart) {
  return cart.reduce((sum, c) => sum + c.qty, 0);
}

export function badgeText(count) {
  if (!count || count < 1) return '';
  return count > 99 ? '99+' : String(count);
}

// ---------- 저장 값 검증 ----------

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isIndex(v) {
  return Number.isInteger(v) && v >= 0;
}

export function sanitizeWish(data, products) {
  if (!isPlainObject(data) || data.v !== 1 || !Array.isArray(data.ids)) return [];
  const out = [];
  data.ids.forEach((id) => {
    if (Number.isInteger(id) && findProduct(products, id) && !out.includes(id)) out.push(id);
  });
  return out;
}

export function sanitizeCart(data, products) {
  if (!isPlainObject(data) || data.v !== 1 || !Array.isArray(data.items)) return [];
  let cart = [];
  data.items.forEach((it) => {
    if (!isPlainObject(it)) return;
    const p = Number.isInteger(it.productId) ? findProduct(products, it.productId) : null;
    if (!p) return;
    if (!isIndex(it.color) || !p.colors[it.color]) return;
    if (!isIndex(it.size) || !p.sizes[it.size] || p.sizes[it.size].soldOut) return;
    if (!Number.isInteger(it.qty) || it.qty < 1) return;
    // 같은 옵션이 여러 줄이면 합칩니다(상한 99).
    cart = addToCart(cart, { productId: p.id, color: it.color, size: it.size, qty: Math.min(CART_LINE_MAX, it.qty) });
  });
  return cart;
}

export function serializeWish(ids) {
  return { v: 1, ids: ids.slice() };
}

export function serializeCart(cart) {
  return { v: 1, items: cart.map((c) => ({ productId: c.productId, color: c.color, size: c.size, qty: c.qty })) };
}
