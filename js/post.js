// 글 상세 페이지: post.html?slug=파일이름 형태로 마크다운 글 하나를 보여줍니다.

import { parseFrontmatter } from './frontmatter.js';
import { parseMarkdown } from './markdown.js';
import { initThemeToggle } from './theme.js';
import { createTimeElement, createTagList, createStatus } from './format.js';

const SLUG_RE = /^[a-z0-9-]+$/;
const SITE_NAME = document.title;

class NotFoundError extends Error {}

async function loadPost(slug) {
  let response;
  try {
    response = await fetch(`posts/${slug}.md`, { cache: 'no-cache' });
  } catch (error) {
    throw new Error('network', { cause: error });
  }
  if (response.status === 404) throw new NotFoundError();
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseFrontmatter(await response.text());
}

// 한글 기준 분당 약 500자로 읽는 시간을 어림합니다.
function readingMinutes(text) {
  const chars = text.replace(/\s+/g, '').length;
  return Math.max(1, Math.round(chars / 500));
}

function renderAside(meta, body) {
  const aside = document.createElement('aside');
  aside.className = 'post-aside';
  aside.setAttribute('aria-label', '글 정보');
  const dl = document.createElement('dl');

  const addRow = (label, value) => {
    if (!value) return;
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.append(value);
    dl.append(dt, dd);
  };

  addRow('날짜', createTimeElement(meta.date));
  addRow('읽는 시간', `약 ${readingMinutes(body)}분`);
  addRow('태그', createTagList(meta.tags));

  aside.append(dl);
  return aside;
}

function renderArticle({ meta, body }, slug) {
  const article = document.createElement('article');
  article.className = 'post-layout';

  const main = document.createElement('div');
  main.className = 'post-main';

  const header = document.createElement('header');
  header.className = 'post-header';
  const title = document.createElement('h1');
  title.textContent = meta.title || slug;
  header.append(title);

  if (meta.description) {
    const lead = document.createElement('p');
    lead.className = 'post-lead';
    lead.textContent = meta.description;
    header.append(lead);
  }

  const content = document.createElement('div');
  content.className = 'prose';
  // parseMarkdown은 원문 HTML을 모두 이스케이프하므로 innerHTML에 안전하게 넣을 수 있습니다.
  content.innerHTML = parseMarkdown(body);

  main.append(header, content);
  article.append(renderAside(meta, body), main);
  document.title = `${title.textContent} · ${SITE_NAME}`;
  if (meta.description) {
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
  }
  return article;
}

async function init() {
  initThemeToggle();
  const container = document.getElementById('post');
  const slug = new URLSearchParams(location.search).get('slug') ?? '';

  if (!SLUG_RE.test(slug)) {
    container.replaceChildren(createStatus('잘못된 주소입니다.', '목록에서 글을 선택해 주세요.'));
    return;
  }

  try {
    container.replaceChildren(renderArticle(await loadPost(slug), slug));
  } catch (error) {
    console.error(error);
    if (error instanceof NotFoundError) {
      container.replaceChildren(createStatus('글을 찾을 수 없습니다.', '삭제되었거나 주소가 잘못되었을 수 있습니다.'));
    } else if (error.message === 'network') {
      container.replaceChildren(createStatus('네트워크 오류가 발생했습니다.', '연결 상태를 확인한 뒤 새로고침해 주세요.'));
    } else {
      container.replaceChildren(createStatus('글을 불러오지 못했습니다.', '잠시 후 다시 시도해 주세요.'));
    }
  }
}

init();
