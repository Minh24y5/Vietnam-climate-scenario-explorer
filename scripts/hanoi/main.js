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
  $('#aboutRuns').innerHTML = pr(C.runs);
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
  writeHn();
  syncTheme();
  if (hnStep) drawHnStep(hnStep);
  renderEx();
}
$('#langSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setLang(b.dataset.lang); });

let hnResizeT = null;
window.addEventListener('resize', () => {
  clearTimeout(hnResizeT);
  hnResizeT = setTimeout(() => { sizeCalAxis(); if (hnStep) drawHnStep(hnStep); renderEx(); observeHnSteps(); }, 150);
});

async function initHn() {
  applyStatic();
  try {
    const r = await fetch(HN_URL);
    if (!r.ok) throw new Error(`${HN_URL}: HTTP ${r.status}`);
    HN = await r.json();
    if (!Object.values(HN.models).some(m => m.temperature)) throw new Error('no model with temperature in hanoi.json yet');
  } catch (err) {
    console.warn('Hà Nội data not loaded:', err);
    $('#heroTitle').innerHTML = t('loadFail');
    $('#story').hidden = true; $('#explore').hidden = true; $('.lead-grid').hidden = true; $('#sapo').hidden = true;
    return;
  }
  writeHn();
  drawCalendar();
  const first = $('.step');
  first.classList.add('is-active');
  hnStep = first.dataset.step;
  drawHnStep(hnStep);
  observeHnSteps();
  renderEx();
}
initHn();
