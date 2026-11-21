'use strict';
/* Hà Nội page entry point: loads data/hanoi/hanoi.json, writes the text, draws the figures.
   Loaded last; the other scripts define what it uses. */

let HN_F = null, HN_C = null;

function writeHn() {
  applyStatic();
  HN_F = hnFacts();
  HN_C = hnCopy(HN_F);
  const C = HN_C;
  /* print setting for justified columns, as on the national page */
  const pr = s => s.replace(/&nbsp;(°C|mm)/g, ' $1').replace(/SSP(\d)-(\d\.\d)/g, '<span class="nw">SSP$1-$2</span>');
  $('#heroTitle').innerHTML = C.h1;
  $('#sapo').innerHTML = pr(C.sapo);
  $('#byline').innerHTML = C.byline;
  $('#leadP1').innerHTML = pr(C.leadP1);
  $('#leadP2').innerHTML = pr(C.leadP2);
  $('#pull').innerHTML = pr(C.pull);
  $('#calCap').innerHTML = pr(C.cap);
  $('#calFig').setAttribute('aria-label', C.calAria);
  calText(); calKey(C);
  $$('.step-body').forEach(b => { b.innerHTML = pr(C.steps[b.dataset.text] || ''); });
  $$('.step').forEach(s => { s.hidden = !C.steps[s.dataset.step]; });   /* no reanalysis record: no test step */
  $('#aboutRuns').innerHTML = pr(C.runs);
  $('#aboutMethods').innerHTML = C.methods;
  const partial = HN_F.nR < HN_F.total ? t('partial').replace('{n}', HN_F.nR).replace('{total}', HN_F.total) : '';
  $('#unknownList').innerHTML = (partial ? [partial] : []).concat(C.unknown).map(s => `<li>${s}</li>`).join('');
  const badge = $('#dataBadge');
  badge.className = 'data-badge real';
  badge.innerHTML = `<span class="d">${today()}</span><span class="sep"> · </span>${C.badge}`;
  buildExControls();
}
function setLang(l) {
  if (l === LANG) return;
  LANG = l;
  try { localStorage.setItem('lang', l); } catch (_) { /* per-viewer convenience only */ }
  if (!HN) { initHn(); return; }    /* still loading or failed: re-say that in the new language */
  writeHn();
  syncTheme();
  if (hnStep) drawHnStep(hnStep);
  renderEx();
}
$('#langSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setLang(b.dataset.lang); });

let hnResizeT = null;
window.addEventListener('resize', () => {
  clearTimeout(hnResizeT);
  hnResizeT = setTimeout(() => { if (!HN) return; sizeCalAxis(); if (hnStep) drawHnStep(hnStep); renderEx(); observeHnSteps(); }, 150);
});

/* while the data loads, and if it fails: the headline says so in the reader's language; the
   sections that need data stay hidden; a failure offers a retry. The developer's fix (serve over
   http, run pipeline/build_hanoi.py) goes to the console, not to the reader. */
const DATA_PARTS = ['#story', '#explore', '.lead-grid'];
function showLoadState(state) {
  const main = $('#top'), h1 = $('#heroTitle'), sapo = $('#sapo');
  main.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
  DATA_PARTS.forEach(s => { $(s).hidden = state !== 'ready'; });
  h1.classList.toggle('is-pending', state !== 'ready');
  if (state === 'loading') { h1.textContent = t('loading'); sapo.textContent = ''; }
  if (state === 'failed') {
    h1.textContent = t('loadFail');
    sapo.innerHTML = `${location.protocol === 'file:' ? t('loadFailFile') : t('loadFailNet')} <button type="button" class="link-btn" id="retryLoad">${t('retry')}</button>`;
    $('#retryLoad').addEventListener('click', initHn);
  }
}
async function initHn() {
  applyStatic();
  showLoadState('loading');
  try {
    const r = await fetch(HN_URL, {cache: 'no-cache'});
    if (!r.ok) throw new Error(`${HN_URL}: HTTP ${r.status}`);
    HN = await r.json();
    if (!Object.values(HN.models).some(m => m.temperature)) throw new Error('no model with temperature in hanoi.json yet');
  } catch (err) {
    console.warn('Hà Nội data not loaded. Serve the site over http(s), and run pipeline/build_hanoi.py if data/hanoi/hanoi.json is missing.', err);
    HN = null;
    showLoadState('failed');
    return;
  }
  readExUrl();
  showLoadState('ready');
  writeHn();
  drawCalendar();
  const first = $('.step');
  first.classList.add('is-active');
  hnStep = first.dataset.step;
  markChapter(HN_CHAPTER[hnStep]);
  drawHnStep(hnStep);
  observeHnSteps();
  renderEx();
}
/* the heat calendar, and the warming-level dots that share its ramp, have a ramp per theme: redraw
   them when the theme changes, by pick or by system */
function redrawCalendar() { if (HN && HN_C) { drawCalendar(); calKey(HN_C); if (hnStep) drawHnStep(hnStep); renderEx(); } }
new MutationObserver(redrawCalendar).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
darkMQ.addEventListener('change', redrawCalendar);

initHn();
