// 마크다운 → HTML 변환기. 외부 라이브러리 없이 동작하는 순수 함수입니다.
// 원문의 HTML 태그는 모두 이스케이프되며, 링크/이미지 URL은 허용된 스킴만 통과합니다.

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

// http(s), mailto, 상대 경로, #앵커만 허용합니다. (이미 이스케이프된 문자열을 받습니다)
const ALLOWED_SCHEMES = ['http', 'https', 'mailto'];

export function safeUrl(url) {
  const scheme = url.match(/^([a-z][a-z0-9+.-]*):/i);
  if (scheme && !ALLOWED_SCHEMES.includes(scheme[1].toLowerCase())) {
    return '#';
  }
  return url;
}

// ---------- 인라인 ----------

const PLACEHOLDER_RE = /\u0000(\d+)\u0000/g;

function renderInline(text) {
  const stash = [];
  const keep = (html) => `\u0000${stash.push(html) - 1}\u0000`;

  let out = escapeHtml(text);

  // 인라인 코드: 안쪽은 다른 규칙을 적용하지 않도록 먼저 빼둡니다.
  out = out.replace(/(`+)([\s\S]+?)\1/g, (_, __, code) => keep(`<code>${code.trim()}</code>`));

  // 이미지
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;(.*?)&quot;)?\)/g, (_, alt, src, title) => {
    const titleAttr = title ? ` title="${title}"` : '';
    return keep(`<img src="${safeUrl(src)}" alt="${alt}"${titleAttr} loading="lazy">`);
  });

  // 링크 (링크 텍스트에는 강조 등 인라인 규칙이 계속 적용됩니다)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;(.*?)&quot;)?\)/g, (_, label, href, title) => {
    const url = safeUrl(href);
    const titleAttr = title ? ` title="${title}"` : '';
    const external = /^https?:/i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `${keep(`<a href="${url}"${titleAttr}${external}>`)}${label}${keep('</a>')}`;
  });

  // 자동 링크 <https://...> (이스케이프된 형태)
  out = out.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, (_, url) =>
    keep(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`));

  out = out
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, '$1<strong>$2</strong>')
    .replace(/\*(?=\S)([\s\S]*?\S)\*/g, '<em>$1</em>')
    .replace(/(^|[^\w])_(?=\S)([\s\S]*?\S)_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');

  // 줄 끝 공백 2개 또는 역슬래시는 강제 줄바꿈
  out = out.replace(/(?: {2,}|\\)\n/g, '<br>\n');

  // 자리표시자 복원 (중첩된 자리표시자가 없어질 때까지)
  while (out.includes('\u0000')) {
    out = out.replace(PLACEHOLDER_RE, (_, index) => stash[Number(index)]);
  }
  return out;
}

// ---------- 블록 ----------

const FENCE_RE = /^ {0,3}(`{3,}|~{3,})\s*([\w+#.-]*)/;
const HEADING_RE = /^ {0,3}(#{1,6})(?:\s+(.*?))?(?:\s+#+)?\s*$/;
const HR_RE = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const QUOTE_RE = /^ {0,3}>\s?/;
const LIST_RE = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const TABLE_SEP_RE = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

function isBlank(line) {
  return line.trim() === '';
}

function startsBlock(line) {
  return FENCE_RE.test(line) || HEADING_RE.test(line) || HR_RE.test(line)
    || QUOTE_RE.test(line) || LIST_RE.test(line);
}

function splitRow(line) {
  let row = line.trim();
  if (row.startsWith('|')) row = row.slice(1);
  if (row.endsWith('|') && !row.endsWith('\\|')) row = row.slice(0, -1);
  return row.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'));
}

function parseFence(lines, start) {
  const [, fence, lang] = lines[start].match(FENCE_RE);
  const indent = lines[start].match(/^ */)[0].length;
  const code = [];
  let i = start + 1;
  while (i < lines.length && !lines[i].trim().startsWith(fence)) {
    // 여는 펜스만큼 들여쓰기된 내용은 그만큼 걷어냅니다.
    code.push(lines[i].replace(new RegExp(`^ {0,${indent}}`), ''));
    i++;
  }
  const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : '';
  const html = `<pre><code${langAttr}>${escapeHtml(code.join('\n'))}</code></pre>`;
  return { html, next: i + 1 };
}

function parseQuote(lines, start) {
  const inner = [];
  let i = start;
  while (i < lines.length && QUOTE_RE.test(lines[i])) {
    inner.push(lines[i].replace(QUOTE_RE, ''));
    i++;
  }
  return { html: `<blockquote>\n${parseBlocks(inner)}\n</blockquote>`, next: i };
}

function parseTable(lines, start) {
  const header = splitRow(lines[start]);
  const aligns = splitRow(lines[start + 1]).map((cell) => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return '';
  });
  const cell = (tag, text, index) => {
    const align = aligns[index] ? ` style="text-align:${aligns[index]}"` : '';
    return `<${tag}${align}>${renderInline(text)}</${tag}>`;
  };

  let i = start + 2;
  const rows = [];
  while (i < lines.length && !isBlank(lines[i]) && lines[i].includes('|')) {
    const cells = splitRow(lines[i]);
    rows.push(`<tr>${header.map((_, c) => cell('td', cells[c] ?? '', c)).join('')}</tr>`);
    i++;
  }

  const thead = `<thead><tr>${header.map((text, c) => cell('th', text, c)).join('')}</tr></thead>`;
  const tbody = rows.length ? `<tbody>${rows.join('')}</tbody>` : '';
  return { html: `<div class="table-wrap"><table>${thead}${tbody}</table></div>`, next: i };
}

function renderListItem(text) {
  const task = text.match(/^\[([ xX])\]\s+(.*)$/);
  if (task) {
    const checked = task[1] === ' ' ? '' : ' checked';
    return `<li class="task"><input type="checkbox" disabled${checked}> ${renderInline(task[2])}`;
  }
  return `<li>${renderInline(text)}`;
}

function renderList(items, start) {
  const first = items[start];
  const tag = first.ordered ? 'ol' : 'ul';
  const startAttr = first.ordered && first.number !== 1 ? ` start="${first.number}"` : '';
  let html = `<${tag}${startAttr}>`;
  let open = false;
  let pos = start;

  while (pos < items.length && items[pos].indent >= first.indent) {
    const item = items[pos];
    // 같은 깊이에서 목록 종류(순서 있음/없음)가 바뀌면 새 목록으로 시작합니다.
    if (item.indent === first.indent && item.ordered !== first.ordered) break;
    if (item.indent > first.indent && open) {
      const nested = renderList(items, pos);
      html += nested.html;
      pos = nested.pos;
      continue;
    }
    if (open) html += '</li>';
    html += renderListItem(item.text);
    open = true;
    pos++;
  }

  if (open) html += '</li>';
  return { html: `${html}</${tag}>`, pos };
}

function parseList(lines, start) {
  const items = [];
  let i = start;

  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(LIST_RE);
    if (match) {
      const marker = match[2];
      items.push({
        indent: match[1].length,
        ordered: /\d/.test(marker),
        number: parseInt(marker, 10),
        text: match[3],
      });
      i++;
    } else if (!isBlank(line) && /^\s+/.test(line) && items.length) {
      // 들여쓴 연속 줄은 앞 항목의 내용으로 이어 붙입니다.
      items[items.length - 1].text += ` ${line.trim()}`;
      i++;
    } else if (isBlank(line) && i + 1 < lines.length && LIST_RE.test(lines[i + 1])) {
      i++; // 항목 사이 빈 줄은 무시
    } else {
      break;
    }
  }

  let html = '';
  let pos = 0;
  while (pos < items.length) {
    const result = renderList(items, pos);
    html += result.html;
    pos = result.pos;
  }
  return { html, next: i };
}

function parseParagraph(lines, start) {
  const text = [];
  let i = start;
  while (i < lines.length && !isBlank(lines[i]) && (i === start || !startsBlock(lines[i]))) {
    text.push(lines[i].replace(/^\s+/, ''));
    i++;
  }
  return { html: `<p>${renderInline(text.join('\n'))}</p>`, next: i };
}

function parseBlocks(lines) {
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    let result;

    if (isBlank(line)) {
      i++;
      continue;
    } else if (FENCE_RE.test(line)) {
      result = parseFence(lines, i);
    } else if (HEADING_RE.test(line)) {
      const [, hashes, content = ''] = line.match(HEADING_RE);
      const level = hashes.length;
      result = { html: `<h${level}>${renderInline(content)}</h${level}>`, next: i + 1 };
    } else if (HR_RE.test(line)) {
      result = { html: '<hr>', next: i + 1 };
    } else if (QUOTE_RE.test(line)) {
      result = parseQuote(lines, i);
    } else if (line.includes('|') && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1])
      && lines[i + 1].includes('-')) {
      result = parseTable(lines, i);
    } else if (LIST_RE.test(line)) {
      result = parseList(lines, i);
    } else {
      result = parseParagraph(lines, i);
    }

    blocks.push(result.html);
    i = result.next;
  }

  return blocks.join('\n');
}

export function parseMarkdown(text) {
  const lines = String(text)
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/\t/g, '    ')
    .split('\n');
  return parseBlocks(lines);
}
