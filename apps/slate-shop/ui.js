// SLATE 쇼핑몰 진입점: 앱 상태, 해시 라우터, 헤더 배지, 토스트, 스크롤 복원, 공유, 데모 모드
import { PRODUCTS } from './data.js';
import {
  parseRoute, findProduct, toggleWish, addToCart, cartCount, badgeText
} from './shop.js';
import { loadWish, saveWish, loadCart, saveCart } from './storage.js';
import { initHome } from './home.js';
import { initProduct } from './product.js';

// 데모 모드: ?demo=1 이면 저장소를 읽지도 쓰지도 않고 미리 정한 상태로 두 화면을 함께 보여 줍니다.
const isDemo = new URLSearchParams(window.location.search).get('demo') === '1';

const app = document.getElementById('app');
const viewHome = document.getElementById('view-home');
const viewProduct = document.getElementById('view-product');
const toastEl = document.getElementById('toast');
const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

const state = {
  wish: isDemo ? [1, 4] : loadWish(PRODUCTS),
  cart: isDemo ? [{ productId: 1, color: 0, size: 1, qty: 2 }] : loadCart(PRODUCTS),
  home: { chip: '전체', expanded: false, scrollY: 0, lastLink: null },
  route: null
};

let cameFromHome = false;
let storageWarned = false;
let toastTimer = 0;
let toastShowTimer = 0;

// ---------- 공통 도우미 ----------

function prefersReducedMotion() {
  return Boolean(motionQuery && motionQuery.matches);
}

// 받침에 따라 은/는을 붙입니다.
function withTopic(word) {
  const last = word.charCodeAt(word.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) {
    return `${word}${(last - 0xac00) % 28 ? '은' : '는'}`;
  }
  return `${word}은(는)`;
}

function toast(message) {
  if (isDemo) return;
  // 앞서 예약한 표시·숨김을 모두 취소해 최신 문구 하나만 남깁니다.
  window.clearTimeout(toastShowTimer);
  window.clearTimeout(toastTimer);
  toastEl.classList.remove('is-show');
  toastEl.textContent = '';
  // 같은 문구를 다시 띄워도 스크린리더가 읽도록 한 틱 뒤에 넣습니다.
  toastShowTimer = window.setTimeout(() => {
    toastEl.textContent = message;
    toastEl.classList.add('is-show');
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove('is-show');
    }, 2500);
  }, 30);
}

function deadToast(name) {
  toast(`${withTopic(name)} 데모에서 준비 중이에요`);
}

// 대상 영역으로 부드럽게 스크롤하고, 포커스는 스크롤 없이 옮깁니다.
function scrollToTarget(target, focusEl) {
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  if (focusEl) focusEl.focus({ preventScroll: true });
}

function warnStorage(ok) {
  if (ok || storageWarned || isDemo) return;
  storageWarned = true;
  toast('이 브라우저에서는 찜·장바구니가 저장되지 않아요');
}

// ---------- 찜·장바구니 ----------

function updateBadges() {
  const count = cartCount(state.cart);
  const text = badgeText(count);
  document.querySelectorAll('[data-cart-badge]').forEach((el) => {
    el.textContent = text;
    el.hidden = text === '';
  });
  document.querySelectorAll('[data-cart-btn]').forEach((el) => {
    el.setAttribute('aria-label', `장바구니, ${count}개`);
  });
}

function onWishToggle(id) {
  state.wish = toggleWish(state.wish, id);
  if (!isDemo) warnStorage(saveWish(state.wish));
  home.updateWish();
  product.updateWish();
}

function onAddToCart(item) {
  state.cart = addToCart(state.cart, item);
  if (!isDemo) warnStorage(saveCart(state.cart));
  updateBadges();
}

function onCartClick() {
  const count = cartCount(state.cart);
  toast(`장바구니에 ${count}개 담겨 있어요 (장바구니 화면은 데모에서 제공하지 않아요)`);
}

function goBack() {
  if (cameFromHome) {
    window.history.back();
  } else {
    window.location.hash = '#/';
  }
}

async function share() {
  const url = window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title: document.title, url });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      // 그 밖의 오류는 링크 복사로 넘어갑니다.
    }
  }
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('clipboard');
    await navigator.clipboard.writeText(url);
    toast('링크를 복사했어요');
  } catch (err) {
    toast('링크를 복사하지 못했어요');
  }
}

// ---------- 뷰 초기화 ----------

const ctx = {
  state,
  products: PRODUCTS,
  toast,
  deadToast,
  scrollToTarget,
  prefersReducedMotion,
  onWishToggle,
  onAddToCart,
  setStatusVisible(visible) {
    app.classList.toggle('has-status', visible);
  }
};

const home = initHome(ctx);
const product = initProduct(ctx);

document.querySelectorAll('[data-cart-btn]').forEach((el) => {
  el.addEventListener('click', onCartClick);
});
document.getElementById('pd-back').addEventListener('click', goBack);
document.getElementById('pd-share').addEventListener('click', share);

// 기능 없는 요소: 모양은 디자인대로, 누르면 안내 토스트
document.addEventListener('click', (event) => {
  const el = event.target instanceof Element ? event.target.closest('[data-dead]') : null;
  if (el) deadToast(el.getAttribute('data-dead') || '');
});

// 홈 링크(로고·탭 홈): 이미 홈이면 맨 위로
document.querySelectorAll('[data-home-link]').forEach((el) => {
  el.addEventListener('click', (event) => {
    if (state.route && state.route.name === 'home') {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      document.getElementById('home-title').focus({ preventScroll: true });
    }
  });
});

// ---------- 라우터 ----------

const HOME_TITLE = 'SLATE · woogi.log';

function route() {
  const next = parseRoute(window.location.hash);
  const prev = state.route;
  const firstLoad = prev === null;

  app.setAttribute('data-route', next.name);

  if (next.name === 'home') {
    viewProduct.hidden = true;
    viewHome.hidden = false;
    document.title = HOME_TITLE;
    state.route = next;
    home.render();
    const fromOther = !firstLoad && prev.name !== 'home';
    window.scrollTo(0, fromOther ? state.home.scrollY : 0);
    if (fromOther) {
      // 방금 눌렀던 상품 링크가 아직 있으면 그 링크로, 아니면 화면 제목으로
      const link = home.findLink();
      (link || document.getElementById('home-title')).focus({ preventScroll: true });
    }
    cameFromHome = false;
    return;
  }

  // 홈에서 앱 안 이동으로 들어왔을 때만 ← 가 history.back()을 씁니다(앱 밖으로 나가지 않게).
  if (firstLoad) {
    cameFromHome = false;
  } else {
    // 상세에서 주소를 직접 바꿔 다른 상세로 가면 false가 되어 ← 는 홈으로 갑니다.
    cameFromHome = prev.name === 'home';
  }
  viewHome.hidden = true;
  viewProduct.hidden = false;
  state.route = next;

  const p = next.name === 'product' ? findProduct(PRODUCTS, next.id) : null;
  if (p) {
    product.show(p);
    document.title = `${p.name} · SLATE · woogi.log`;
  } else {
    state.route = { name: 'notFound' };
    app.setAttribute('data-route', 'notFound');
    product.showNotFound();
    document.title = `상품을 찾을 수 없어요 · ${HOME_TITLE}`;
  }
  window.scrollTo(0, 0);
  if (!firstLoad) {
    const title = document.getElementById(p ? 'pd-name' : 'nf-title');
    title.focus({ preventScroll: true });
  }
}

// 홈에 있는 동안 스크롤 위치를 기억합니다(돌아올 때 복원).
window.addEventListener('scroll', () => {
  if (state.route && state.route.name === 'home' && !viewHome.hidden) {
    state.home.scrollY = window.scrollY;
  }
}, { passive: true });

// ---------- 시작 ----------

updateBadges();

if (isDemo) {
  document.documentElement.classList.add('is-demo');
  app.setAttribute('data-route', 'demo');
  home.render();
  const p = findProduct(PRODUCTS, 1);
  product.show(p);
  product.selectSize(1);
  viewHome.hidden = false;
  viewProduct.hidden = false;
  // 프레임 안쪽 스크롤: 홈은 신상품(칩·찜 카드), 상세는 사이즈 선택·요약이 보이게 합니다.
  const headerH = viewHome.querySelector('.sl-header').offsetHeight;
  // 신상품 섹션 위 여백(48px) 안에서 멈춰 카테고리 라벨이 헤더 밑에 잘려 보이지 않게 합니다.
  viewHome.scrollTop = document.getElementById('new-section').offsetTop - headerH + 16;
  const summary = document.getElementById('pd-summary');
  const barH = document.getElementById('pd-buybar').offsetHeight;
  viewProduct.scrollTop = summary.offsetTop + summary.offsetHeight + 16 - (viewProduct.clientHeight - barH);
} else {
  if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  window.addEventListener('hashchange', route);
  route();
}
