'use strict';
/* The "About the project" page: README.md (or README.vi.md in Vietnamese, once HAS_VI_README is set), rendered with marked. */

Object.assign(S.vi, {
  rmSkip: 'Bỏ qua, đến nội dung', rmSection: 'Dự án', rmBackVn: '← Bài cả nước', rmBackHn: 'Bài Hà Nội',
  rmLoading: 'Đang tải phần giới thiệu dự án…',
  rmFail: 'Không tải được phần giới thiệu. Trang cần được mở qua máy chủ web (http hoặc https), không mở thẳng từ ổ đĩa.',
  rmEnglish: 'Phần giới thiệu này hiện chỉ có bằng tiếng Anh.',
  rmSource: 'Trang này hiển thị tệp README.md của dự án.', rmGithub: 'Xem mã nguồn trên GitHub'
});
Object.assign(S.en, {
  rmSkip: 'Skip to the content', rmSection: 'Project', rmBackVn: '← Vietnam page', rmBackHn: 'Hanoi report',
  rmLoading: 'Loading the project overview…',
  rmFail: 'The project overview didn\'t load. Open the page through a web server (http or https), not straight from disk.',
  rmEnglish: '', rmSource: 'This page shows the project\'s README.md.', rmGithub: 'See the source on GitHub'
});

const REPO = 'https://github.com/Minh24y5/Vietnam-climate-scenario-explorer';
/* set to true once README.vi.md exists; until then Vietnamese readers get the English README with a note */
const HAS_VI_README = true;
const README_CACHE = {};

async function getText(url) {
  if (url in README_CACHE) return README_CACHE[url];
  const r = await fetch(url, {cache: 'no-cache'});
  README_CACHE[url] = r.ok ? await r.text() : null;
  return README_CACHE[url];
}

/* links in the README are written for GitHub: pages on this site stay here, other files open on GitHub */
function fixLinks(root) {
  root.querySelectorAll('a[href]').forEach(a => {
    const h = a.getAttribute('href');
    if (/^(https?:|mailto:|#)/.test(h)) {
      if (/^https?:/.test(h)) { a.target = '_blank'; a.rel = 'noopener'; }
      return;
    }
    if (/^(index|hanoi|about)\.html/.test(h)) return;
    a.href = `${REPO}/blob/main/${h.replace(/^\.\//, '')}`;
    a.target = '_blank'; a.rel = 'noopener';
  });
  /* headings get ids so sections can be linked */
  root.querySelectorAll('h2, h3').forEach(h => {
    h.id = h.textContent.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  });
  /* wide tables scroll inside their own box on phones */
  root.querySelectorAll('table').forEach(t => {
    const w = document.createElement('div');
    w.className = 'readme-table';
    t.parentNode.insertBefore(w, t);
    w.appendChild(t);
  });
}

async function renderReadme() {
  applyStatic();
  syncTheme();
  const box = $('#readme'), note = $('#readmeNote');
  box.setAttribute('aria-busy', 'true');
  box.innerHTML = `<p class="readme-status">${t('rmLoading')}</p>`;
  let md = LANG === 'vi' && HAS_VI_README ? await getText('README.vi.md').catch(() => null) : null;
  const english = !md;
  if (!md) md = await getText('README.md').catch(() => null);
  if (!md || typeof marked === 'undefined') {
    box.innerHTML = `<p class="readme-status">${t('rmFail')}</p>`;
    box.setAttribute('aria-busy', 'false');
    console.warn('README not loaded: serve the site over http(s); marked loaded:', typeof marked !== 'undefined');
    return;
  }
  /* the README is this repository's own file, written by its authors */
  box.innerHTML = marked.parse(md);
  box.lang = english ? 'en' : 'vi';
  fixLinks(box);
  box.setAttribute('aria-busy', 'false');
  note.hidden = !(LANG === 'vi' && english);
  note.textContent = t('rmEnglish');
  const h1 = box.querySelector('h1');
  document.title = `${h1 ? h1.textContent : 'README'} · ${t('rmSection')}`;
  $('#readmeSrc').innerHTML = `${t('rmSource')} <a href="${REPO}" target="_blank" rel="noopener">${t('rmGithub')}</a>`;
  if (location.hash) { const tgt = document.getElementById(location.hash.slice(1)); if (tgt) tgt.scrollIntoView(); }
}

function setLang(l) {
  if (l === LANG) return;
  LANG = l;
  try { localStorage.setItem('lang', l); } catch (_) { /* per-viewer convenience only */ }
  renderReadme();
}
$('#langSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setLang(b.dataset.lang); });
renderReadme();
