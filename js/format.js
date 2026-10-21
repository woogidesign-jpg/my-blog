// 날짜·태그·상태 메시지 표시 도우미, 그리고 글 파일을 불러오는 공통 함수

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isValidSlug = (slug) => typeof slug === 'string' && SLUG.test(slug);

/**
 * 'YYYY-MM-DD' 를 화면용 글자와 <time datetime> 값으로 바꿉니다.
 * 시간대에 따라 날짜가 하루 밀리지 않도록 Date 를 거치지 않습니다.
 * @returns {{ iso: string, label: string } | null}
 */
export function formatDate(value) {
  const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return { iso: `${year}-${month}-${day}`, label: `${year}년 ${Number(month)}월 ${Number(day)}일` };
}

export function createTimeElement(value) {
  const date = formatDate(value);
  if (!date) return null;
  const time = document.createElement('time');
  time.dateTime = date.iso;
  time.textContent = date.label;
  return time;
}

// 공백을 뺀 글자 수 기준, 1분에 500자를 읽는다고 봅니다.
export function readingMinutes(text) {
  const length = String(text).replace(/```[\s\S]*?```/g, ' ').replace(/\s+/g, '').length;
  return Math.max(1, Math.round(length / 500));
}

export function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.filter(Boolean);
  return tags ? [String(tags)] : [];
}

export function createTagList(tags) {
  const list = document.createElement('ul');
  list.className = 'tag-list';
  list.setAttribute('aria-label', '태그');
  for (const tag of normalizeTags(tags)) {
    const item = document.createElement('li');
    item.className = 'tag';
    item.textContent = `#${tag}`;
    list.append(item);
  }
  return list;
}

/* ---------- 불러오기 ---------- */

export class LoadError extends Error {
  /** @param {'not-found' | 'network' | 'server'} kind */
  constructor(kind, status = 0) {
    super(kind);
    this.kind = kind;
    this.status = status;
  }
}

/**
 * @param {string} url
 * @param {'text' | 'json'} [type]
 */
export async function fetchResource(url, type = 'text') {
  let response;
  try {
    response = await fetch(url, { cache: 'no-cache' });
  } catch {
    throw new LoadError('network');
  }
  if (response.status === 404) throw new LoadError('not-found', 404);
  if (!response.ok) throw new LoadError('server', response.status);
  try {
    return type === 'json' ? await response.json() : await response.text();
  } catch {
    throw new LoadError('server', response.status);
  }
}

/* ---------- 상태 메시지 ---------- */

const MESSAGES = {
  loading: { title: '불러오는 중', text: '잠시만 기다려 주세요.' },
  'not-found': { title: '404 글을 찾을 수 없습니다', text: '주소가 바뀌었거나 삭제된 글일 수 있습니다.' },
  network: { title: '네트워크 오류', text: '인터넷 연결을 확인한 뒤 새로고침해 주세요. 로컬에서는 node serve.mjs 로 서버를 켜야 합니다.' },
  server: { title: '불러오지 못했습니다', text: '잠시 뒤 다시 시도해 주세요.' },
  empty: { title: '아직 글이 없습니다', text: 'posts/ 폴더에 첫 글을 써 보세요.' }
};

/**
 * container 안을 상태 메시지 하나로 바꿉니다.
 * @param {HTMLElement} container
 * @param {keyof MESSAGES} kind
 * @param {{ title?: string, text?: string, link?: { href: string, label: string } }} [override]
 */
export function showStatus(container, kind, override = {}) {
  const preset = MESSAGES[kind] ?? MESSAGES.server;
  const box = document.createElement('div');
  box.className = `status status--${kind}`;
  box.setAttribute('role', kind === 'loading' ? 'status' : 'alert');

  const title = document.createElement('p');
  title.className = 'status-title';
  title.textContent = override.title ?? preset.title;

  const text = document.createElement('p');
  text.className = 'status-text';
  text.textContent = override.text ?? preset.text;

  box.append(title, text);

  if (override.link) {
    const link = document.createElement('a');
    link.className = 'button';
    link.href = override.link.href;
    link.textContent = override.link.label;
    box.append(link);
  }

  container.replaceChildren(box);
}

export const errorKind = (error) => (error instanceof LoadError ? error.kind : 'server');
