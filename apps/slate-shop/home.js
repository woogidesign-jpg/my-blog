// 홈 뷰: 칩 필터, 카테고리, 상품 카드, 찜, 더보기, 탭 바
import { CATEGORIES, CHIPS, HOME_LIMIT } from './data.js';
import { filterProducts, visibleProducts, isWished, productHref, formatPrice } from './shop.js';

function cloneTemplate(id) {
  return document.getElementById(id).content.firstElementChild.cloneNode(true);
}

export function initHome(ctx) {
  const { state, products } = ctx;
  const chipList = document.getElementById('chip-list');
  const catList = document.getElementById('cat-list');
  const productList = document.getElementById('product-list');
  const moreWrap = document.getElementById('more-wrap');
  const moreBtn = document.getElementById('more-btn');
  const newSection = document.getElementById('new-section');
  const newTitle = document.getElementById('new-title');
  const tabWishText = document.getElementById('tab-wish-text');

  // ---------- 칩 (한 번만 만들고 상태만 바꿈) ----------
  const chipButtons = CHIPS.map((label) => {
    const btn = cloneTemplate('tpl-chip');
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (state.home.chip === label) return;
      state.home.chip = label;
      state.home.expanded = false;
      render();
    });
    chipList.appendChild(btn);
    return btn;
  });

  // ---------- 카테고리 ----------
  CATEGORIES.forEach((label) => {
    const li = cloneTemplate('tpl-cat');
    li.querySelector('.sl-cat-label').textContent = label;
    li.querySelector('.sl-cat').addEventListener('click', () => {
      if (CHIPS.includes(label)) {
        state.home.chip = label;
        state.home.expanded = false;
        render();
        ctx.scrollToTarget(newSection, newTitle);
      } else {
        ctx.deadToast(label);
      }
    });
    catList.appendChild(li);
  });

  // ---------- 상품 카드 ----------
  function wishLabel(p, on) {
    return on ? `${p.name} 찜 해제` : `${p.name} 찜하기`;
  }

  function buildCard(p) {
    const li = cloneTemplate('tpl-card');
    li.setAttribute('data-id', String(p.id));
    const href = productHref(p.id);

    const img = li.querySelector('.sl-card-img');
    img.href = href;
    img.setAttribute('aria-label', `${p.name} 상세 보기`);
    img.addEventListener('click', () => {
      state.home.lastLink = { id: p.id, kind: 'img' };
    });

    const name = li.querySelector('.sl-card-name');
    name.href = href;
    name.textContent = p.name;
    name.addEventListener('click', () => {
      state.home.lastLink = { id: p.id, kind: 'name' };
    });

    li.querySelector('.sl-card-new').hidden = !p.isNew;
    li.querySelector('.sl-card-cat').textContent = p.cat;
    li.querySelector('.sl-card-price').textContent = `${formatPrice(p.price)}원`;

    const heart = li.querySelector('.sl-card-heart');
    heart.setAttribute('data-id', String(p.id));
    heart.addEventListener('click', () => ctx.onWishToggle(p.id));
    return li;
  }

  function updateWish() {
    productList.querySelectorAll('.sl-card-heart').forEach((btn) => {
      const id = Number(btn.getAttribute('data-id'));
      const p = products.find((x) => x.id === id);
      if (!p) return;
      const on = isWished(state.wish, id);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', wishLabel(p, on));
    });
    tabWishText.textContent = `찜 ${state.wish.length}`;
  }

  function render() {
    chipButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.textContent === state.home.chip ? 'true' : 'false');
    });
    const { items, hasMore } = visibleProducts(filterProducts(products, state.home.chip), state.home.expanded, HOME_LIMIT);
    productList.replaceChildren(...items.map(buildCard));
    moreWrap.hidden = !hasMore;
    updateWish();
  }

  // 홈으로 돌아올 때 포커스를 돌려줄 링크
  function findLink(last) {
    const ref = last || state.home.lastLink;
    if (!ref) return null;
    const card = productList.querySelector(`.sl-card[data-id="${ref.id}"]`);
    if (!card) return null;
    return card.querySelector(ref.kind === 'name' ? '.sl-card-name' : '.sl-card-img');
  }

  // ---------- 그 밖의 버튼 ----------
  moreBtn.addEventListener('click', () => {
    state.home.expanded = true;
    render();
    const firstNew = productList.children[HOME_LIMIT];
    if (firstNew) firstNew.querySelector('.sl-card-img').focus({ preventScroll: true });
  });

  document.getElementById('new-all').addEventListener('click', () => {
    state.home.chip = '전체';
    state.home.expanded = true;
    render();
  });

  document.getElementById('hero-cta').addEventListener('click', () => {
    ctx.scrollToTarget(newSection, newTitle);
  });

  document.getElementById('tab-wish').addEventListener('click', () => {
    ctx.toast(`찜한 상품 ${state.wish.length}개 · 찜 목록은 준비 중이에요`);
  });

  document.getElementById('search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    ctx.toast('검색은 데모에서 준비 중이에요');
  });

  return { render, updateWish, findLink };
}
