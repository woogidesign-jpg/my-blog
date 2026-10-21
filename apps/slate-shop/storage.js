// 찜·장바구니 저장소 (localStorage 접근은 모두 try/catch)
// 블로그와 같은 origin이므로 키에 apps.slate-shop. 접두사를 붙입니다. 값 검증은 shop.js가 합니다.

import { sanitizeWish, sanitizeCart, serializeWish, serializeCart } from './shop.js';

const WISH_KEY = 'apps.slate-shop.wish';
const CART_KEY = 'apps.slate-shop.cart';

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (typeof raw !== 'string') return null;
    return JSON.parse(raw);
  } catch (e) {
    // 접근 불가·깨진 JSON: 빈 값으로 시작합니다.
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export function loadWish(products) {
  return sanitizeWish(readJson(WISH_KEY), products);
}

export function saveWish(ids) {
  return writeJson(WISH_KEY, serializeWish(ids));
}

export function loadCart(products) {
  return sanitizeCart(readJson(CART_KEY), products);
}

export function saveCart(cart) {
  return writeJson(CART_KEY, serializeCart(cart));
}
