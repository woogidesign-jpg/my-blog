// front matter 파서
// 마크다운 맨 위의 --- 사이에 있는 간단한 YAML(키: 값, [배열])을 읽습니다.

const FRONT_MATTER = /^﻿?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

// 따옴표로 감싼 값이면 따옴표를 벗깁니다.
function unquote(value) {
  const match = value.match(/^(["'])(.*)\1$/);
  return match ? match[2] : value;
}

function parseValue(raw) {
  const value = raw.trim();
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => unquote(item.trim()))
      .filter((item) => item !== '');
  }
  return unquote(value);
}

/**
 * @param {string} text 마크다운 원문
 * @returns {{ data: Record<string, string | string[]>, body: string }}
 */
export function parseFrontMatter(text) {
  const match = text.match(FRONT_MATTER);
  if (!match) return { data: {}, body: text.replace(/^﻿/, '') };

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (pair) data[pair[1]] = parseValue(pair[2]);
  }
  return { data, body: text.slice(match[0].length) };
}
