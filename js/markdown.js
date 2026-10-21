// 마크다운 → HTML 변환기
// 1단계: 줄 단위로 블록(제목, 목록, 표 등)을 나눕니다.
// 2단계: 블록 안의 글자에 인라인 규칙(굵게, 링크 등)을 적용합니다.
// DOM을 쓰지 않는 순수 함수라서 브라우저 밖에서도 테스트할 수 있습니다.

/* ---------- 공통 도우미 ---------- */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

function unescapeHtml(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

// 줄 앞의 들여쓰기 칸 수 (탭은 4칸)
function indentOf(line) {
  let width = 0;
  for (const ch of line) {
    if (ch === ' ') width += 1;
    else if (ch === '\t') width += 4 - (width % 4);
    else break;
  }
  return width;
}

// 줄 앞에서 공백을 최대 count칸 걷어냅니다.
function stripIndent(line, count) {
  let width = 0;
  let index = 0;
  while (index < line.length && width < count) {
    const ch = line[index];
    if (ch === ' ') width += 1;
    else if (ch === '\t') width += 4 - (width % 4);
    else break;
    index += 1;
  }
  return line.slice(index);
}

const isBlank = (line) => /^\s*$/.test(line);

/* ---------- URL 검사 ---------- */

// http:, https:, mailto:, 상대 경로만 허용합니다. 나머지(javascript: 등)는 null.
function safeUrl(escapedUrl, { allowMailto = true } = {}) {
  // 브라우저는 URL 속 탭·줄바꿈·제어 문자를 무시하므로 지운 뒤 검사합니다.
  const plain = unescapeHtml(escapedUrl).replace(/[\u0000- \u007f]/g, '');
  const scheme = plain.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!scheme) return escapedUrl;
  const name = scheme[1].toLowerCase();
  if (name === 'http' || name === 'https') return escapedUrl;
  if (name === 'mailto' && allowMailto) return escapedUrl;
  return null;
}

const isExternal = (escapedUrl) => /^https?:/i.test(unescapeHtml(escapedUrl).trim());

/* ---------- 인라인 파싱 ---------- */

// 이미 완성된 HTML 조각을 자리표시자로 숨겨, 뒤 규칙이 건드리지 못하게 합니다.
function createStash() {
  const items = [];
  return {
    put(html) {
      items.push(html);
      return `\u0000${items.length - 1}\u0000`;
    },
    restore(text) {
      let result = text;
      while (/\u0000\d+\u0000/.test(result)) {
        result = result.replace(/\u0000(\d+)\u0000/g, (_, n) => items[Number(n)]);
      }
      return result;
    }
  };
}

function replaceCodeSpans(text, stash) {
  return text.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_, ticks, content) => {
    let code = content.replace(/\n/g, ' ');
    if (/^ .*[^ ].* $/.test(code)) code = code.slice(1, -1);
    return stash.put(`<code>${escapeHtml(code)}</code>`);
  });
}

function replaceBackslashEscapes(text, stash) {
  return text
    .replace(/\\\n/g, () => `${stash.put('<br>')}\n`)
    .replace(/\\([!-/:-@[-`{-~])/g, (_, ch) => stash.put(escapeHtml(ch)));
}

// 이스케이프된 글자 위에서 동작합니다. 제목의 " 는 &quot; 로 바뀌어 있습니다.
const LINK_TARGET = String.raw`\(\s*([^\s()]*(?:\([^\s()]*\)[^\s()]*)*)(?:\s+&quot;(.*?)&quot;)?\s*\)`;
const IMAGE = new RegExp(String.raw`!\[([^\]]*)\]` + LINK_TARGET, 'g');
const LINK = new RegExp(String.raw`\[([^\]]+)\]` + LINK_TARGET, 'g');

function replaceImages(text, stash) {
  return text.replace(IMAGE, (whole, alt, src, title) => {
    const url = safeUrl(src, { allowMailto: false });
    if (url === null || url === '') return alt;
    const titleAttr = title ? ` title="${title}"` : '';
    return stash.put(`<img src="${url}" alt="${alt}"${titleAttr} loading="lazy">`);
  });
}

function replaceLinks(text, stash) {
  return text.replace(LINK, (whole, label, href, title) => {
    const url = safeUrl(href);
    if (url === null) return label;
    let attrs = ` href="${url}"`;
    if (title) attrs += ` title="${title}"`;
    if (isExternal(url)) attrs += ' target="_blank" rel="noopener noreferrer"';
    // 속성은 숨기고 링크 글자는 남겨 두어, 링크 안에서도 강조가 적용되게 합니다.
    return `${stash.put(`<a${attrs}>`)}${label}${stash.put('</a>')}`;
  });
}

// 글자·숫자에 붙은 _ 는 강조로 보지 않습니다 (snake_case_이름).
const WORD = String.raw`[\p{L}\p{N}_]`;

function replaceEmphasis(text) {
  return text
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(new RegExp(`(^|[^\\p{L}\\p{N}_])__(?=\\S)([\\s\\S]*?\\S)__(?!${WORD})`, 'gu'), '$1<strong>$2</strong>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>')
    .replace(/\*(?=[^\s*])([\s\S]*?[^\s*])\*/g, '<em>$1</em>')
    .replace(new RegExp(`(^|[^\\p{L}\\p{N}_])_(?=[^\\s_])([\\s\\S]*?[^\\s_])_(?!${WORD})`, 'gu'), '$1<em>$2</em>');
}

/**
 * 블록 하나 안의 글자에 인라인 규칙을 적용합니다.
 * @param {string} text
 * @returns {string}
 */
export function parseInline(text) {
  const stash = createStash();
  let result = String(text).replace(/\u0000/g, '');
  result = replaceCodeSpans(result, stash);
  result = replaceBackslashEscapes(result, stash);
  result = escapeHtml(result);
  result = replaceImages(result, stash);
  result = replaceLinks(result, stash);
  result = replaceEmphasis(result);
  result = result.replace(/ {2,}\n/g, '<br>\n');
  return stash.restore(result);
}

/* ---------- 블록 파싱 ---------- */

const FENCE = /^ {0,3}(`{3,}|~{3,})[ \t]*([^\s`]*)[^`]*$/;
const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}> ?/;
const LIST_ITEM = /^( *)([-*+]|\d{1,9}[.)])([ \t]+|$)/;
const TABLE_DELIMITER = /^ {0,3}\|?[ \t]*:?-+:?[ \t]*(\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;

function listMarker(line) {
  const match = line.match(LIST_ITEM);
  if (!match) return null;
  const marker = match[2];
  const ordered = /\d/.test(marker[0]);
  const spaces = match[3].length;
  const indent = match[1].length;
  // 표시 뒤 공백이 너무 많거나 내용이 없으면 표시 + 1칸을 내용 시작으로 봅니다.
  const gap = spaces === 0 || spaces > 4 ? 1 : spaces;
  return {
    ordered,
    start: ordered ? Number.parseInt(marker, 10) : 1,
    indent,
    contentOffset: indent + marker.length + gap,
    content: line.slice(match[0].length)
  };
}

// 이 줄에서 새 블록이 시작되어 문단이 끝나는지
function interruptsParagraph(line) {
  if (FENCE.test(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line)) return true;
  const item = listMarker(line);
  if (!item || isBlank(item.content)) return false;
  return !item.ordered || item.start === 1;
}

/* 각 블록 규칙: (lines, i) → { html, next } 또는 null */

function parseFence(lines, i) {
  const open = lines[i].match(FENCE);
  if (!open) return null;
  const fence = open[1];
  const lang = open[2].replace(/[^\w+-]/g, '');
  const closing = new RegExp(`^ {0,3}${fence[0] === '`' ? '`' : '~'}{${fence.length},}[ \\t]*$`);
  const openIndent = indentOf(lines[i]);
  const body = [];
  let j = i + 1;
  while (j < lines.length && !closing.test(lines[j])) {
    body.push(stripIndent(lines[j], openIndent));
    j += 1;
  }
  const classAttr = lang ? ` class="language-${lang}"` : '';
  const code = body.length ? `${escapeHtml(body.join('\n'))}\n` : '';
  return { html: `<pre><code${classAttr}>${code}</code></pre>`, next: j + 1 };
}

function parseHeading(lines, i) {
  const match = lines[i].match(HEADING);
  if (!match) return null;
  const level = match[1].length;
  return { html: `<h${level}>${parseInline(match[2] || '')}</h${level}>`, next: i + 1 };
}

function parseRule(lines, i) {
  return RULE.test(lines[i]) ? { html: '<hr>', next: i + 1 } : null;
}

function parseQuote(lines, i) {
  if (!QUOTE.test(lines[i])) return null;
  const inner = [];
  let j = i;
  while (j < lines.length) {
    if (QUOTE.test(lines[j])) {
      inner.push(lines[j].replace(QUOTE, ''));
    } else if (!isBlank(lines[j]) && !isBlank(inner[inner.length - 1] ?? '') && !interruptsParagraph(lines[j])) {
      // 앞 줄 문단에 이어지는 줄은 > 가 없어도 인용문에 포함합니다.
      inner.push(lines[j]);
    } else {
      break;
    }
    j += 1;
  }
  return { html: `<blockquote>\n${parseBlocks(inner)}\n</blockquote>`, next: j };
}

// 표의 한 줄을 칸으로 나눕니다. \| 는 칸 구분이 아니라 글자 | 입니다.
function splitRow(line) {
  let row = line.trim();
  if (row.startsWith('|')) row = row.slice(1);
  if (row.endsWith('|') && !row.endsWith('\\|')) row = row.slice(0, -1);
  const cells = [];
  let current = '';
  for (let k = 0; k < row.length; k += 1) {
    if (row[k] === '\\' && row[k + 1] === '|') {
      current += '|';
      k += 1;
    } else if (row[k] === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += row[k];
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseTable(lines, i) {
  if (i + 1 >= lines.length || !lines[i].includes('|') || !TABLE_DELIMITER.test(lines[i + 1])) return null;
  const header = splitRow(lines[i]);
  const aligns = splitRow(lines[i + 1]).map((cell) => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return '';
  });
  if (header.length !== aligns.length) return null;

  const cell = (tag, text, k) => {
    const align = aligns[k] ? ` class="align-${aligns[k]}"` : '';
    return `<${tag}${align}>${parseInline(text ?? '')}</${tag}>`;
  };

  const rows = [];
  let j = i + 2;
  while (j < lines.length && !isBlank(lines[j]) && lines[j].includes('|') && !interruptsParagraph(lines[j])) {
    const cells = splitRow(lines[j]);
    rows.push(`<tr>${aligns.map((_, k) => cell('td', cells[k], k)).join('')}</tr>`);
    j += 1;
  }

  const head = `<thead>\n<tr>${header.map((text, k) => cell('th', text, k)).join('')}</tr>\n</thead>`;
  const body = rows.length ? `\n<tbody>\n${rows.join('\n')}\n</tbody>` : '';
  return { html: `<div class="table-wrap">\n<table>\n${head}${body}\n</table>\n</div>`, next: j };
}

// 목록 항목 하나의 줄들을 모읍니다.
function collectListItem(lines, i, item) {
  const body = [item.content];
  let j = i + 1;
  let sawBlank = false;
  while (j < lines.length) {
    const line = lines[j];
    if (isBlank(line)) {
      body.push('');
      sawBlank = true;
      j += 1;
      continue;
    }
    const indent = indentOf(line);
    const nested = listMarker(line);
    if (indent >= item.contentOffset || (nested && indent > item.indent)) {
      body.push(stripIndent(line, Math.min(indent, item.contentOffset)));
    } else if (!sawBlank && !nested && !interruptsParagraph(line)) {
      body.push(line.trim()); // 앞 문단에 이어지는 줄
    } else {
      break;
    }
    sawBlank = false;
    j += 1;
  }
  // 뒤쪽 빈 줄은 항목에 넣지 않고 되돌려 둡니다.
  while (body.length > 1 && isBlank(body[body.length - 1])) {
    body.pop();
    j -= 1;
  }
  return { body, next: j };
}

function parseList(lines, i) {
  const first = listMarker(lines[i]);
  if (!first) return null;

  const items = [];
  let loose = false;
  let j = i;
  while (j < lines.length) {
    const item = listMarker(lines[j]);
    if (!item || item.ordered !== first.ordered || item.indent >= first.contentOffset) break;
    const { body, next } = collectListItem(lines, j, item);
    if (body.some(isBlank)) loose = true;
    items.push(body);
    j = next;
    // 항목 사이에 빈 줄이 있고 다음 항목이 이어지면 느슨한 목록입니다.
    let k = j;
    while (k < lines.length && isBlank(lines[k])) k += 1;
    const following = k < lines.length ? listMarker(lines[k]) : null;
    if (!following || following.ordered !== first.ordered || following.indent >= first.contentOffset) break;
    if (k > j) loose = true;
    j = k;
  }

  const html = items.map((body) => {
    const task = body[0].match(/^\[([ xX])\][ \t]+/);
    if (!task) return `<li>${parseBlocks(body, { tight: !loose })}</li>`;
    const checked = task[1] === ' ' ? '' : ' checked';
    const rest = [body[0].slice(task[0].length), ...body.slice(1)];
    const box = `<input type="checkbox" disabled${checked}> `;
    return `<li class="task-item">${box}${parseBlocks(rest, { tight: !loose })}</li>`;
  });

  const tag = first.ordered ? 'ol' : 'ul';
  const start = first.ordered && first.start !== 1 ? ` start="${first.start}"` : '';
  const hasTasks = html.some((li) => li.startsWith('<li class="task-item">'));
  const classAttr = hasTasks ? ' class="task-list"' : '';
  return { html: `<${tag}${start}${classAttr}>\n${html.join('\n')}\n</${tag}>`, next: j };
}

function parseParagraph(lines, i, tight) {
  const body = [lines[i].replace(/^[ \t]+/, '')];
  let j = i + 1;
  while (j < lines.length && !isBlank(lines[j]) && !interruptsParagraph(lines[j])) {
    body.push(lines[j].replace(/^[ \t]+/, ''));
    j += 1;
  }
  const text = parseInline(body.join('\n').replace(/[ \t]+$/, ''));
  return { html: tight ? text : `<p>${text}</p>`, next: j };
}

const BLOCK_RULES = [parseFence, parseHeading, parseRule, parseQuote, parseTable, parseList];

/**
 * @param {string[]} lines
 * @param {{ tight?: boolean }} [options] tight: 문단을 <p>로 감싸지 않음 (촘촘한 목록용)
 * @returns {string}
 */
function parseBlocks(lines, { tight = false } = {}) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    if (isBlank(lines[i])) {
      i += 1;
      continue;
    }
    let block = null;
    for (const rule of BLOCK_RULES) {
      block = rule(lines, i);
      if (block) break;
    }
    block ??= parseParagraph(lines, i, tight);
    out.push(block.html);
    i = block.next;
  }
  return out.join('\n');
}

/**
 * 마크다운 글 전체를 HTML 문자열로 바꿉니다.
 * @param {string} text
 * @returns {string}
 */
export function parseMarkdown(text) {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  return parseBlocks(lines);
}
