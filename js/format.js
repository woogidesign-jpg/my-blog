// 목록과 상세 페이지가 함께 쓰는 표시용 도우미입니다.

// 'YYYY-MM-DD'를 로컬 날짜로 해석합니다. (new Date('YYYY-MM-DD')는 UTC로 해석되어 하루가 밀릴 수 있음)
export function parseDate(value) {
  const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function createTimeElement(value) {
  const date = parseDate(value);
  if (!date) return null;
  const time = document.createElement('time');
  time.dateTime = String(value).slice(0, 10);
  time.textContent = dateFormatter.format(date);
  return time;
}

export function createTagList(tags) {
  const list = Array.isArray(tags) ? tags : tags ? [tags] : [];
  if (!list.length) return null;
  const ul = document.createElement('ul');
  ul.className = 'tags';
  ul.setAttribute('aria-label', '태그');
  for (const tag of list) {
    const li = document.createElement('li');
    li.className = 'tag';
    li.textContent = tag;
    ul.append(li);
  }
  return ul;
}

export function createStatus(title, message) {
  const div = document.createElement('div');
  div.className = 'status';
  div.setAttribute('role', 'status');
  const strong = document.createElement('strong');
  strong.textContent = title;
  div.append(strong, message);
  return div;
}
