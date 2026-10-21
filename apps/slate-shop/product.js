// 상세 뷰: 이미지 캐러셀·스와이프, 색/사이즈/수량, 사이즈 경고, 장바구니 담기, 구매 바
import { IMAGE_COUNT, QTY_MIN, QTY_MAX, SHIPPING_TEXT } from './data.js';
import {
  initialSelection, pickColor, pickSize, stepImage, clampQty, validateForCart,
  lineTotal, formatPrice, pointsFor, isWished
} from './shop.js';

const HEX_RE = /^#[0-9a-f]{6}$/i;
const SWIPE_MIN = 40;

function cloneTemplate(id) {
  return document.getElementById(id).content.firstElementChild.cloneNode(true);
}

// 상품 스와치 색은 검증된 #rrggbb만 --sw로 넣습니다.
function setSwatch(el, hex) {
  if (HEX_RE.test(hex)) {
    el.style.setProperty('--sw', hex);
  } else {
    el.style.removeProperty('--sw');
  }
}

export function initProduct(ctx) {
  const { state } = ctx;
  const $ = (id) => document.getElementById(id);

  const els = {
    body: $('pd-body'),
    notFound: $('pd-notfound'),
    buybar: $('pd-buybar'),
    image: $('pd-image'),
    imageSw: $('pd-image-sw'),
    imageCap: $('pd-image-cap'),
    count: $('pd-count'),
    cat: $('pd-cat'),
    isNew: $('pd-new'),
    name: $('pd-name'),
    price: $('pd-price'),
    sub: $('pd-sub'),
    colorName: $('pd-color-name'),
    swatches: $('pd-swatches'),
    sizeSet: $('pd-size-set'),
    sizes: $('pd-sizes'),
    sizeError: $('pd-size-error'),
    model: $('pd-model'),
    summary: $('pd-summary'),
    summaryText: $('pd-summary-text'),
    qty: $('pd-qty'),
    dec: $('pd-dec'),
    inc: $('pd-inc'),
    total: $('pd-total'),
    desc: $('pd-desc'),
    specs: $('pd-specs'),
    guideHead: $('pd-guide-head'),
    guideBody: $('pd-guide-body'),
    guide: $('size-guide'),
    guideTitle: $('size-guide-title'),
    reviews: $('pd-reviews'),
    added: $('pd-added'),
    wish: $('pd-wish')
  };

  let product = null;
  let sel = null;
  let swatchButtons = [];
  let sizeButtons = [];
  let errorTimer = 0;
  let addedTimer = 0;

  // ---------- 부분 갱신 ----------
  function colorName() {
    return product.colors[sel.color].name;
  }

  function updateImage() {
    const cName = colorName();
    els.image.setAttribute('aria-label', `${product.name} ${cName} 이미지 ${sel.image} / ${IMAGE_COUNT}`);
    els.imageCap.textContent = `${cName} · 컷 ${sel.image}`;
    els.count.textContent = `${sel.image} / ${IMAGE_COUNT}`;
    setSwatch(els.imageSw, product.colors[sel.color].hex);
  }

  function updateColor() {
    swatchButtons.forEach((btn, i) => {
      btn.setAttribute('aria-pressed', i === sel.color ? 'true' : 'false');
    });
    els.colorName.textContent = `· ${colorName()}`;
    updateImage();
  }

  function updateSize() {
    sizeButtons.forEach((btn, i) => {
      if (!btn.disabled) btn.setAttribute('aria-pressed', i === sel.size ? 'true' : 'false');
    });
  }

  function updateSummary() {
    const has = sel.size !== null;
    els.summary.hidden = !has;
    if (!has) return;
    els.summaryText.textContent = `${colorName()} / ${product.sizes[sel.size].label}`;
    els.qty.textContent = String(sel.qty);
    els.dec.disabled = sel.qty <= QTY_MIN;
    els.inc.disabled = sel.qty >= QTY_MAX;
    els.total.textContent = `${formatPrice(lineTotal(product.price, sel.qty))}원`;
  }

  function setSizeError(on) {
    window.clearTimeout(errorTimer);
    if (state.product) state.product.sizeError = on;
    els.model.hidden = on;
    els.sizeError.textContent = '';
    if (on) {
      // 다시 눌러도 읽히도록 비운 뒤 한 틱 늦게 넣습니다(그사이 화면이 바뀌면 넣지 않음).
      errorTimer = window.setTimeout(() => {
        if (state.product && state.product.sizeError) els.sizeError.textContent = '! 사이즈를 선택해 주세요';
      }, 30);
    }
  }

  function setAdded(text) {
    window.clearTimeout(addedTimer);
    if (state.product) state.product.added = text;
    els.added.textContent = '';
    ctx.setStatusVisible(Boolean(text));
    if (text) {
      // 같은 문구라도 다시 읽히도록 한 틱 늦게 넣습니다.
      addedTimer = window.setTimeout(() => {
        if (state.product && state.product.added === text) els.added.textContent = text;
      }, 30);
    }
  }

  function updateWish() {
    if (!product) return;
    const on = isWished(state.wish, product.id);
    els.wish.setAttribute('aria-pressed', on ? 'true' : 'false');
    els.wish.setAttribute('aria-label', on ? `${product.name} 찜 해제` : `${product.name} 찜하기`);
  }

  // ---------- 상품 채우기 ----------
  function buildSwatches() {
    swatchButtons = product.colors.map((c, i) => {
      const btn = cloneTemplate('tpl-swatch');
      btn.setAttribute('aria-label', c.name);
      btn.querySelector('.sl-swatch-name').textContent = c.name;
      setSwatch(btn.querySelector('.sl-swatch-dot'), c.hex);
      btn.addEventListener('click', () => {
        const next = pickColor(product, sel, i);
        if (next === sel || next.color === sel.color) return;
        sel = next;
        state.product.sel = sel;
        updateColor();
        updateSummary();
        setAdded('');
      });
      return btn;
    });
    els.swatches.replaceChildren(...swatchButtons);
  }

  function buildSizes() {
    sizeButtons = product.sizes.map((s, i) => {
      const btn = cloneTemplate('tpl-size');
      btn.textContent = s.label;
      if (s.soldOut) {
        btn.disabled = true;
        btn.removeAttribute('aria-pressed');
        btn.setAttribute('aria-label', `${s.label} 품절`);
      }
      btn.addEventListener('click', () => {
        const next = pickSize(product, sel, i);
        if (next === sel) return;
        const changed = next.size !== sel.size;
        sel = next;
        state.product.sel = sel;
        updateSize();
        updateSummary();
        if (state.product.sizeError) setSizeError(false);
        if (changed) setAdded('');
      });
      return btn;
    });
    els.sizes.replaceChildren(...sizeButtons);
  }

  function buildSpecs() {
    const nodes = [];
    product.specs.forEach((spec) => {
      const frag = document.getElementById('tpl-spec').content.cloneNode(true);
      frag.querySelector('dt').textContent = spec.term;
      frag.querySelector('dd').textContent = spec.desc;
      nodes.push(...frag.children);
    });
    els.specs.replaceChildren(...nodes);
  }

  function buildGuide() {
    const { cols, rows } = product.sizeGuide;
    els.guideHead.replaceChildren(...cols.map((col) => {
      const th = cloneTemplate('tpl-th-col');
      th.textContent = col;
      return th;
    }));
    els.guideBody.replaceChildren(...rows.map((row) => {
      const tr = cloneTemplate('tpl-guide-row');
      tr.firstElementChild.textContent = row[0];
      row.slice(1).forEach((cell) => {
        const td = cloneTemplate('tpl-td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      return tr;
    }));
  }

  function show(p) {
    product = p;
    sel = initialSelection(p);
    state.product = { id: p.id, sel, sizeError: false, added: '' };

    els.notFound.hidden = true;
    els.body.hidden = false;
    els.buybar.hidden = false;

    els.cat.textContent = `SLATE · ${p.cat}`;
    els.isNew.hidden = !p.isNew;
    els.name.textContent = p.name;
    els.price.textContent = formatPrice(p.price);
    els.sub.textContent = `${formatPrice(pointsFor(p.price))}원 적립 · ${SHIPPING_TEXT}`;
    els.model.textContent = p.modelInfo;
    els.desc.textContent = p.desc;
    els.reviews.textContent = String(p.reviews);

    buildSwatches();
    buildSizes();
    buildSpecs();
    buildGuide();

    setSizeError(false);
    setAdded('');
    updateColor();
    updateSize();
    updateSummary();
    updateWish();
  }

  function showNotFound() {
    product = null;
    window.clearTimeout(errorTimer);
    window.clearTimeout(addedTimer);
    state.product = null;
    els.body.hidden = true;
    els.buybar.hidden = true;
    els.notFound.hidden = false;
    ctx.setStatusVisible(false);
  }

  // 데모 모드용: 사이즈를 미리 고릅니다.
  function selectSize(index) {
    if (!product) return;
    sel = pickSize(product, sel, index);
    state.product.sel = sel;
    updateSize();
    updateSummary();
  }

  // ---------- 이벤트 ----------
  function changeImage(dir) {
    if (!product) return;
    sel = { ...sel, image: stepImage(sel.image, dir, IMAGE_COUNT) };
    state.product.sel = sel;
    updateImage();
  }

  $('pd-prev').addEventListener('click', () => changeImage(-1));
  $('pd-next').addEventListener('click', () => changeImage(1));

  // 터치 스와이프: 가로 이동만 처리하고 세로 스크롤은 브라우저에 맡깁니다(touch-action: pan-y).
  let swipe = null;
  els.image.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  els.image.addEventListener('pointerup', (event) => {
    if (!swipe || swipe.id !== event.pointerId) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) {
      changeImage(dx < 0 ? 1 : -1);
    }
  });
  els.image.addEventListener('pointercancel', () => {
    swipe = null;
  });

  els.dec.addEventListener('click', () => {
    sel = { ...sel, qty: clampQty(sel.qty - 1) };
    state.product.sel = sel;
    updateSummary();
    setAdded('');
  });

  els.inc.addEventListener('click', () => {
    sel = { ...sel, qty: clampQty(sel.qty + 1) };
    state.product.sel = sel;
    updateSummary();
    setAdded('');
  });

  function requireSize() {
    if (validateForCart(product, sel).ok) return true;
    setSizeError(true);
    const first = sizeButtons.find((btn) => !btn.disabled);
    ctx.scrollToTarget(els.sizeSet, first);
    return false;
  }

  $('pd-add').addEventListener('click', () => {
    if (!product || !requireSize()) return;
    ctx.onAddToCart({ productId: product.id, color: sel.color, size: sel.size, qty: sel.qty });
    setAdded(`장바구니에 담았어요 · ${colorName()} / ${product.sizes[sel.size].label} · ${sel.qty}개`);
  });

  $('pd-buy').addEventListener('click', () => {
    if (!product || !requireSize()) return;
    ctx.toast('데모라 결제는 진행되지 않아요');
  });

  els.wish.addEventListener('click', () => {
    if (product) ctx.onWishToggle(product.id);
  });

  $('pd-guide-btn').addEventListener('click', () => {
    ctx.scrollToTarget(els.guide, els.guideTitle);
  });

  return { show, showNotFound, updateWish, selectSize };
}
