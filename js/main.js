// 글 목록 페이지: posts/index.json에 적힌 글들을 불러와 최신순으로 보여줍니다.

import { parseFrontmatter } from './frontmatter.js';
import { initThemeToggle } from './theme.js';
import { parseDate, createTimeElement, createTagList, createStatus } from './format.js';

const SLUG_RE = /^[a-z0-9-]+$/;

async function loadManifest() {
  const response = await fetch('posts/index.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const files = await response.json();
  if (!Array.isArray(files)) throw new Error('index.json은 파일 이름 배열이어야 합니다.');
  return files;
}

async function loadPost(file) {
  const slug = String(file).replace(/\.md$/, '');
  if (!SLUG_RE.test(slug)) throw new Error(`잘못된 파일 이름: ${file}`);

  const response = await fetch(`posts/${slug}.md`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const { meta } = parseFrontmatter(await response.text());
  return { slug, ...meta, title: meta.title || slug };
}

function renderPost(post, index) {
  const li = document.createElement('li');
  // 가장 최근 글은 넓은 카드로 강조합니다.
  li.className = index === 0 ? 'post-card is-featured' : 'post-card';

  const link = document.createElement('a');
  link.className = 'post-link';
  link.href = `post.html?slug=${encodeURIComponent(post.slug)}`;

  const number = document.createElement('span');
  number.className = 'post-index';
  number.setAttribute('aria-hidden', 'true');
  number.textContent = `[${String(index + 1).padStart(2, '0')}]`;
  link.append(number);

  const title = document.createElement('h3');
  title.className = 'post-title';
  title.textContent = post.title;
  link.append(title);

  if (post.description) {
    const description = document.createElement('p');
    description.className = 'post-description';
    description.textContent = post.description;
    link.append(description);
  }

  const meta = document.createElement('div');
  meta.className = 'post-meta';
  const time = createTimeElement(post.date);
  const tags = createTagList(post.tags);
  if (time) meta.append(time);
  if (tags) meta.append(tags);
  if (meta.childElementCount) link.append(meta);

  li.append(link);
  return li;
}

async function init() {
  initThemeToggle();
  const container = document.getElementById('post-list');

  let files;
  try {
    files = await loadManifest();
  } catch (error) {
    console.error(error);
    container.replaceChildren(createStatus(
      '글 목록을 불러오지 못했습니다.',
      'posts/index.json 파일을 확인하거나, 로컬 서버로 실행했는지 확인해 주세요.',
    ));
    return;
  }

  const results = await Promise.allSettled(files.map(loadPost));
  const posts = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      posts.push(result.value);
    } else {
      console.warn(`글을 건너뜁니다: ${files[index]}`, result.reason);
    }
  });

  if (!posts.length) {
    container.replaceChildren(createStatus('아직 글이 없습니다.', '첫 번째 글을 작성해 보세요.'));
    return;
  }

  posts.sort((a, b) => (parseDate(b.date)?.getTime() ?? 0) - (parseDate(a.date)?.getTime() ?? 0));

  const list = document.createElement('ul');
  list.className = 'post-grid';
  list.append(...posts.map(renderPost));
  container.replaceChildren(list);
}

init();
