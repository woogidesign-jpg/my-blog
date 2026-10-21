// 글 상세 페이지 (post.html?slug=파일이름)
import { parseFrontMatter } from './frontmatter.js';
import { parseMarkdown } from './markdown.js';
import {
  createTagList,
  createTimeElement,
  errorKind,
  fetchResource,
  isValidSlug,
  readingMinutes,
  showStatus
} from './format.js';

const article = document.getElementById('post');
const SITE_NAME = document.title;
const BACK_LINK = { href: './', label: '← 글 목록으로' };

function metaRow(label, value) {
  const row = document.createElement('div');
  row.className = 'meta-row';
  const term = document.createElement('dt');
  term.textContent = label;
  const detail = document.createElement('dd');
  detail.append(value);
  row.append(term, detail);
  return row;
}

function renderPost(data, body) {
  const title = data.title || '제목 없음';
  document.title = `${title} | ${SITE_NAME}`;
  if (data.description) {
    document.querySelector('meta[name="description"]')?.setAttribute('content', data.description);
  }

  // 정보 패널 (넓은 화면에서는 왼쪽)
  const aside = document.createElement('aside');
  aside.className = 'post-meta';
  aside.setAttribute('aria-label', '글 정보');
  const meta = document.createElement('dl');
  const time = createTimeElement(data.date);
  if (time) meta.append(metaRow('date', time));
  meta.append(metaRow('read', `${readingMinutes(body)}분`));
  meta.append(metaRow('tags', createTagList(data.tags)));
  aside.append(meta);

  // 오른쪽 본문 (머리말 → 본문 → 꼬리말)
  const header = document.createElement('header');
  header.className = 'post-header';
  const prompt = document.createElement('p');
  prompt.className = 'prompt';
  prompt.textContent = `cat ${new URLSearchParams(location.search).get('slug')}.md`;
  const heading = document.createElement('h1');
  heading.className = 'post-title';
  heading.textContent = title;
  header.append(prompt, heading);
  if (data.description) {
    const lead = document.createElement('p');
    lead.className = 'post-lead';
    lead.textContent = data.description;
    header.append(lead);
  }

  const content = document.createElement('div');
  content.className = 'post-content';
  // parseMarkdown 은 원문을 이스케이프한 뒤 변환하므로 innerHTML 에 넣어도 안전합니다.
  content.innerHTML = parseMarkdown(body);

  const footer = document.createElement('footer');
  footer.className = 'post-footer';
  const back = document.createElement('a');
  back.className = 'button';
  back.href = BACK_LINK.href;
  back.textContent = BACK_LINK.label;
  footer.append(back);

  // 모바일에서는 이 순서대로 쌓이고, 넓은 화면에서는 CSS 그리드가 정보 패널을 왼쪽으로 옮깁니다.
  article.replaceChildren(header, aside, content, footer);
  article.classList.add('post--ready');
}

async function render() {
  const slug = new URLSearchParams(location.search).get('slug');
  if (!isValidSlug(slug)) {
    showStatus(article, 'not-found', {
      title: '404 잘못된 주소입니다',
      text: '글 주소는 post.html?slug=글-이름 형식이어야 합니다.',
      link: BACK_LINK
    });
    return;
  }

  showStatus(article, 'loading');
  try {
    const { data, body } = parseFrontMatter(await fetchResource(`posts/${slug}.md`));
    renderPost(data, body);
  } catch (error) {
    console.error(error);
    showStatus(article, errorKind(error), { link: BACK_LINK });
  }
}

render();
