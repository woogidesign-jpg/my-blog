// 다크 모드 토글. 저장된 선택이 없으면 시스템 설정을 따릅니다.
// 첫 화면의 테마는 각 HTML <head>의 인라인 스크립트가 미리 적용합니다.

const STORAGE_KEY = 'theme';
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function readStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // 저장할 수 없는 환경(사생활 보호 모드 등)에서는 이번 방문에만 적용됩니다.
  }
}

function currentTheme() {
  return readStoredTheme() ?? (darkQuery.matches ? 'dark' : 'light');
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
  if (!button) return;

  updateButton(button, currentTheme());

  button.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    storeTheme(next);
    updateButton(button, next);
  });

  // 직접 고른 적이 없으면 시스템 설정이 바뀔 때 버튼 상태도 따라갑니다.
  darkQuery.addEventListener('change', () => {
    if (!readStoredTheme()) updateButton(button, currentTheme());
  });
}
