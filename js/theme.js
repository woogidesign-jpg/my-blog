// 테마 전환
// 기본은 검은 배경 네온 테마이고, 라이트를 골랐을 때만 <html data-theme="light">를 붙입니다.
// 첫 화면 깜빡임을 막는 적용 코드는 각 HTML의 <head>에 인라인으로 들어 있습니다.

const STORAGE_KEY = 'theme';
const root = document.documentElement;

function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // 시크릿 모드 등에서 저장할 수 없어도 이번 화면에는 적용됩니다.
  }
}

const isLight = () => root.dataset.theme === 'light';

function applyTheme(light) {
  if (light) root.dataset.theme = 'light';
  else delete root.dataset.theme;
}

function syncButton(button) {
  const light = isLight();
  button.setAttribute('aria-pressed', String(light));
  button.querySelector('.theme-toggle-label').textContent = light ? 'LIGHT' : 'DARK';
}

export function initThemeToggle(button = document.querySelector('.theme-toggle')) {
  if (!button) return;
  syncButton(button);
  button.addEventListener('click', () => {
    const light = !isLight();
    applyTheme(light);
    saveTheme(light ? 'light' : 'dark');
    syncButton(button);
  });
}

initThemeToggle();
