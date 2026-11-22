'use strict';
/* Entry point: writes the page text, switches language, loads the data and starts the page.
   Loaded last; the other scripts/ files define what it uses. */

/* ---------- page text from data, in the current language ---------- */
function writePage() {
  applyStatic();
  const F = facts(SITE), C = copy(F);
  /* print setting for justified columns: number and unit joined by a narrow no-break space
     (justification never stretches it), scenario names never split at their hyphen */
  const pr = s => s.replace(/&nbsp;(°C|mm)/g, ' $1').replace(/SSP(\d)-(\d\.\d)/g, '<span class="nw">SSP$1-$2</span>');
  $('#heroTitle').innerHTML = REAL ? C.h1 : `${C.h1.split('<em>')[0]}<em>${t('synthetic')}</em>`;
  $('#byline').innerHTML = C.byline;
  $('#leadP1').innerHTML = pr(C.leadP1);
  $('#pull').innerHTML = pr(C.pull);
  $('#pullNote').innerHTML = REAL && C.pullNote ? pr(C.pullNote) : '';
  $('#stripesCap').innerHTML = pr(REAL ? C.cap : `${t('synthetic')}. ${C.cap}`);
  $('#stripesFig').setAttribute('aria-label', C.stripesAria);
  stripesKey(C);
  const MC = {...(ZF ? mapCopy(ZF) : {}), ...(WF && REAL ? waterCopy(WF, ZF) : {})};
  $$('.step-body').forEach(b => { b.innerHTML = pr(C.steps[b.dataset.text] ?? MC[b.dataset.text] ?? ''); });
  buildRegionSelect();
  $('#storySource').textContent = REAL ? C.source : `${t('synthetic')}.`;
  const badge = $('#dataBadge');
  badge.className = 'data-badge ' + (REAL ? 'real' : 'synthetic');
  /* the folio line: date, then the data edition */
  badge.innerHTML = `<span class="d">${today()}</span><span class="sep"> · </span>${REAL ? C.badge : t('badgeSynthetic')}`;
  if (!REAL) $('#aboutData').innerHTML = t('aboutFail');
  if (!REAL) $('#realBtn').title = t('loadFail');
  $('#resetBtn').textContent = REAL ? t('backReal') : t('backSample');
  baseAria();
  showDataMsg();
}
function setLang(l) {
  if (l === LANG) return;
  LANG = l;
  try { localStorage.setItem('lang', l); } catch (_) { /* per-viewer convenience only */ }
  writePage();
  syncTheme();
  $('#modelHint').textContent = '';
  redrawFig();
  render();
  sizeStripeAxis();
}
$('#langSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setLang(b.dataset.lang); });

/* ---------- init ---------- */
async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json();
}
async function init() {
  applyStatic();
  const [nat, reg, topo, wat] = await Promise.allSettled([getJson(REAL_URL), getJson(REG_URL), getJson(TOPO_URL), getJson(WATER_URL)]);
  try {
    if (nat.status === 'rejected') throw nat.reason;
    checkData(nat.value);
    REAL = nat.value;
  } catch (err) {
    console.warn('CMIP6 data not loaded:', err);
    $('#realBtn').disabled = true;
  }
  try {
    if (!REAL) throw new Error('no national data');
    if (reg.status === 'rejected') throw reg.reason;
    if (topo.status === 'rejected') throw topo.reason;
    if (typeof topojson === 'undefined') throw new Error('topojson-client did not load');
    checkRegions(reg.value);
    REG = reg.value; TOPO = topo.value;
    storyMap.setTopo(TOPO); exMap.setTopo(TOPO);
    ZF = zoneFacts(REG, facts(REAL));
  } catch (err) {
    /* no regional data: the map chapter and the region control leave the page */
    console.warn('Regional data not loaded:', err);
    REG = null; TOPO = null;
    $$('.step[data-step^="map-"]').forEach(s => s.remove());
    const nav = $('.chapters a[href="#ch-regions"]'); if (nav) nav.parentElement.remove();
    $('#regionCtl').hidden = true;
  }
  try {
    if (!REG) throw new Error('no regional data');
    if (wat.status === 'rejected') throw wat.reason;
    checkWater(wat.value);
    WAT = wat.value; WF = waterFacts(WAT);
  } catch (err) {
    /* no water data: its steps and rail links leave the page */
    console.warn('Water data not loaded:', err);
    WAT = null; WF = null;
    for (const k of ['pr-season', 'map-drought', 'lives']) { const s = $(`.step[data-step="${k}"]`); if (s) s.parentNode.removeChild(s); }
    for (const h of ['#ch-drought', '#ch-lives']) { const a = $(`.chapters a[href="${h}"]`); if (a) a.parentElement.parentNode.removeChild(a.parentElement); }
  }
  SITE = REAL || SAMPLE;
  drawStripes(SITE);
  writePage();
  story.setData(SITE);
  const first = $('.step');
  activeStep = first.dataset.step;
  first.classList.add('is-active');
  markChapter(STEP_CHAPTER[activeStep]);
  story.render(activeStep, false);
  observeSteps();
  useData(REAL ? 'real' : 'sample', SITE);
}
init();
