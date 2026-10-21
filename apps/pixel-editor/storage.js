// localStorage 읽기·쓰기. 모든 접근은 try/catch로 감싸고, 형식이 맞지 않으면 무시합니다.
import { serialize, deserialize, normalizeColor } from './editor.js';

const DRAWING_KEY = 'apps.pixel-editor.drawing';
const SETTINGS_KEY = 'apps.pixel-editor.settings';
const SCALES = [1, 8, 16, 32];

export const DEFAULT_SETTINGS = {
  v: 1,
  color: '#ff004d',
  customColor: '#00e5ff',
  gridLines: true,
  scale: 16
};

function readJson(key) {
  try {
    const text = localStorage.getItem(key);
    if (text === null) return null;
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export function loadDrawing() {
  return deserialize(readJson(DRAWING_KEY));
}

export function saveDrawing(grid) {
  return writeJson(DRAWING_KEY, serialize(grid));
}

// 기본값과 병합, 잘못된 값은 기본값으로
export function loadSettings() {
  const data = readJson(SETTINGS_KEY);
  const settings = { ...DEFAULT_SETTINGS };
  if (!data || typeof data !== 'object' || data.v !== 1) return settings;
  const color = normalizeColor(data.color);
  if (color) settings.color = color;
  const customColor = normalizeColor(data.customColor);
  if (customColor) settings.customColor = customColor;
  if (typeof data.gridLines === 'boolean') settings.gridLines = data.gridLines;
  if (SCALES.includes(data.scale)) settings.scale = data.scale;
  return settings;
}

export function saveSettings(settings) {
  return writeJson(SETTINGS_KEY, {
    v: 1,
    color: settings.color,
    customColor: settings.customColor,
    gridLines: settings.gridLines,
    scale: settings.scale
  });
}
