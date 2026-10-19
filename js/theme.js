// 테마 토글. 기본은 검은 배경 네온 테마(dark)이고, 라이트를 고르면 localStorage에 저장합니다.
// 첫 화면의 테마는 각 HTML <head>의 인라인 스크립트가 미리 적용합니다.

const STORAGE_KEY = 'theme';
const THEME_COLORS = { dark: '#000000', light: '#f4f4ee' };

function readStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // 저장할 수 없는 환경(사생활 보호 모드 등)에서는 이번 방문에만 적용됩니다.
  }
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.dataset.theme = 'light';
  } else {
    delete document.documentElement.dataset.theme;
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
}

function updateButton(button, theme) {
  const isDark = theme === 'dark';
  button.textContent = isDark ? '☀' : '☾';
  button.setAttribute('aria-pressed', String(isDark));
  button.setAttribute('aria-label', isDark ? '라이트 모드로 전환' : '다크 모드로 전환');
  button.title = button.getAttribute('aria-label');
}

export function initThemeToggle() {
  const button = document.querySelector('.theme-toggle');
  const initial = readStoredTheme();
  applyTheme(initial);
  if (!button) return;

  updateButton(button, initial);

  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    storeTheme(next);
    updateButton(button, next);
  });
}
