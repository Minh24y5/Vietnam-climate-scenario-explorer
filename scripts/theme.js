'use strict';
/* Light/dark theme toggle, remembered per reader. */

/* ---------- light / dark ---------- */
/* until the reader picks one, the page follows the system setting; a pick is remembered */
const darkMQ = window.matchMedia('(prefers-color-scheme: dark)');
const curTheme = () => document.documentElement.dataset.theme || (darkMQ.matches ? 'dark' : 'light');
function syncTheme() {
  const th = curTheme();
  $$('#themeSeg button').forEach(b => {
    b.setAttribute('aria-pressed', b.dataset.theme === th ? 'true' : 'false');
    b.title = t(b.dataset.theme === 'dark' ? 'themeDark' : 'themeLight');
  });
  /* browser chrome follows the chosen page colour */
  const bg = th === 'dark' ? '#141619' : '#f1efe9';
  $$('meta[name="theme-color"]').forEach(m => m.setAttribute('content', bg));
}
function setTheme(th) {
  document.documentElement.dataset.theme = th;
  try { localStorage.setItem('theme', th); } catch (_) { /* per-viewer convenience only */ }
  syncTheme();
}
$('#themeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.theme !== curTheme()) setTheme(b.dataset.theme); });
darkMQ.addEventListener('change', syncTheme);
syncTheme();
