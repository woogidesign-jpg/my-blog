// 글 목록 페이지
import { parseFrontMatter } from './frontmatter.js';
import {
  createTagList,
  createTimeElement,
  errorKind,
  fetchResource,
  isValidSlug,
  showStatus
} from './format.js';

const list = document.getElementById('post-list');
const count = document.getElementById('post-count');

async function loadPost(fileName) {
  const slug = String(fileName).replace(/\.md$/, '');
  if (!isValidSlug(slug)) throw new Error(`잘못된 파일 이름: ${fileName}`);
  const { data } = parseFrontMatter(await fetchResource(`posts/${slug}.md`));
  return {
    slug,
    title: data.title || slug,
    date: data.date || '',
    description: data.description || '',
    tags: data.tags
  };
}

// 날짜 최신순, 같은 날이면 제목순
const byNewest = (a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'ko');

function createCard(post, featured) {
  const card = document.createElement('article');
  card.className = featured ? 'card card--featured' : 'card';

  const heading = document.createElement('h3');
  heading.className = 'card-title';
  const link = document.createElement('a');
  link.className = 'card-link';
  link.href = `post.html?slug=${encodeURIComponent(post.slug)}`;
  link.textContent = post.title;
  heading.append(link);

  const meta = document.createElement('p');
  meta.className = 'card-meta';
  if (featured) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = 'NEW';
    meta.append(badge);
  }
  const time = createTimeElement(post.date);
  if (time) meta.append(time);

  card.append(meta, heading);

  if (post.description) {
    const description = document.createElement('p');
    description.className = 'card-description';
    description.textContent = post.description;
    card.append(description);
  }

  card.append(createTagList(post.tags));
  return card;
}

async function render() {
  showStatus(list, 'loading');

  let files;
  try {
    files = await fetchResource('posts/index.json', 'json');
  } catch (error) {
    const kind = errorKind(error);
    showStatus(list, kind, kind === 'not-found' ? { title: '404 글 목록을 찾을 수 없습니다', text: 'posts/index.json 파일이 있는지 확인해 주세요.' } : {});
    return;
  }

  if (!Array.isArray(files) || files.length === 0) {
    showStatus(list, 'empty');
    count.textContent = '0 entries';
    return;
  }

  const results = await Promise.allSettled(files.map(loadPost));
  const posts = results.filter((r) => r.status === 'fulfilled').map((r) => r.value).sort(byNewest);
  const failed = results.filter((r) => r.status === 'rejected');
  failed.forEach((r) => console.warn('글을 불러오지 못했습니다:', r.reason));

  if (posts.length === 0) {
    showStatus(list, errorKind(failed[0]?.reason));
    return;
  }

  list.replaceChildren(...posts.map((post, index) => createCard(post, index === 0)));
  count.textContent = `${posts.length} entries`;

  if (failed.length) {
    const note = document.createElement('p');
    note.className = 'list-note';
    note.textContent = `글 ${failed.length}편을 불러오지 못했습니다.`;
    list.after(note);
  }
}

render();
