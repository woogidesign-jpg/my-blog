// 마크다운 상단의 front matter(--- 로 감싼 key: value 블록)를 파싱합니다.

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/;

function stripQuotes(value) {
  const match = value.match(/^(['"])(.*)\1$/);
  return match ? match[2] : value;
}

function parseValue(raw) {
  const value = raw.trim();
  // [a, b, c] 형태는 배열로 변환
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => stripQuotes(item.trim()))
      .filter((item) => item !== '');
  }
  return stripQuotes(value);
}

export function parseFrontmatter(text) {
  const normalized = text.replace(/\r\n?/g, '\n');
  const match = normalized.match(FRONTMATTER_RE);
  if (!match) {
    return { meta: {}, body: normalized };
  }

  const meta = {};
  for (const line of match[1].split('\n')) {
    const index = line.indexOf(':');
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    if (!key) continue;
    meta[key] = parseValue(line.slice(index + 1));
  }

  return { meta, body: normalized.slice(match[0].length) };
}
