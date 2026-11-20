'use strict';
/* Scroll-story wiring: chart/map swap, step observers, resize. */

/* ---------- story wiring ---------- */
const story = StoryChart($('#storyChart'));
const STEP_CHAPTER = {'tas-abs': 'ch-models', 'tas-anom': 'ch-change', 'tas-245': 'ch-futures', 'tas-585': 'ch-futures',
  'map-zones': 'ch-regions', 'map-grid': 'ch-regions', 'pr-abs': 'ch-rain', 'pr-agree': 'ch-rain', 'pr-hatch': 'ch-rain'};
let activeStep = null, stepObserver = null;
function markChapter(id) { $$('.chapters a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'true' : 'false')); revealChapter(); }

/* the pinned figure holds either the line chart or the zone map */
const storyMap = ZoneMap($('#storyMap'), {story: true});
let figMode = 'chart', mapScen = 'ssp585', ZF = null;
/* show step k, fading the frame when it switches between chart and map; a swap under way
   always finishes on the latest step, however fast the reader scrolls */
let swapT = null, pendingKey = null;
const modeOf = k => k.startsWith('map-') ? 'map' : 'chart';
function drawStep(k) { if (modeOf(k) === 'map') renderStoryMap(k); else { storySourceText(); story.render(k, true); } }
function showStep(k) {
  pendingKey = k;
  if (swapT) return;
  if (modeOf(k) === figMode) { drawStep(k); return; }
  const fr = $('.story-frame');
  const finish = () => {
    swapT = null;
    figMode = modeOf(pendingKey);
    $('#storyChart').hidden = figMode !== 'chart';
    $('#storyMapWrap').hidden = figMode !== 'map';
    drawStep(pendingKey);
  };
  if (reduceMotion.matches) { finish(); fr.classList.add('fading'); setTimeout(() => fr.classList.remove('fading'), 160); return; }
  fr.classList.add('swapping');
  swapT = setTimeout(() => { finish(); fr.classList.remove('swapping'); }, 170);
}
function renderStoryMap(k) {
  if (!REG || !TOPO) return;
  const T = ZF.T[mapScen], grid = k === 'map-grid' ? REG.grid[ZF.coarse].cells : null;
  $('#storyMapTitle').innerHTML = `<span class="t-long">${t('mapTitle')}</span><span class="t-short">${t('mapTitleShort')}</span>`;
  $$('#mapScen button').forEach(b => b.setAttribute('aria-pressed', b.dataset.s === mapScen ? 'true' : 'false'));
  const wrap = $('#storyMapWrap'), maxH = Math.max(220, wrap.clientHeight - $('.map-head').offsetHeight - 4);
  storyMap.render({fill: id => stripeColor(T[id]), label: id => `${sg(T[id])} °C`, grid, maxH});
  $('#storyMap').classList.toggle('show-grid', !!grid);
  const [dl, dn] = ZF.dims(ZF.coarse);
  let lg = `<span class="ramp-key" id="storyMapKey"></span><span><i class="isw"></i>${t('noModelData')}</span>`;
  if (grid) lg += `<span><i class="cellsw"></i>${t('gridKey')} ${ZF.coarse}, ~${nf(dl)}° × ${nf(dn)}°</span>`;
  $('#storyLegend').innerHTML = lg;
  rampKey($('#storyMapKey'), stripeColor, [0, 1, 2, 3, 4], v => v === 0 ? '0' : v === 4 ? `${fmt('+')(v)}&nbsp;°C` : fmt('+')(v), '');
  $('#storyMap').setAttribute('aria-label', `${t('mapTitle')}, ${SCEN[mapScen].name}: ` + ZF.order[mapScen].map(z => `${zoneName(z)} ${sg(T[z])} °C`).join('; ') + '.');
  $('#storySource').textContent = LANG === 'vi'
    ? `Nguồn: CMIP6, ${ZF.n} mô hình, trung bình theo diện tích đất liền từng vùng; ranh giới tỉnh Natural Earth (trước sáp nhập 2025). Hai quần đảo nhỏ hơn một ô lưới nên không có số liệu.`
    : `Source: CMIP6, ${ZF.n} models, land-area-weighted zone means; province boundaries from Natural Earth (before the 2025 mergers). Both archipelagos are smaller than a model cell, so they have no values.`;
}
$('#mapScen').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || b.dataset.s === mapScen) return;
  mapScen = b.dataset.s;
  if (activeStep && activeStep.startsWith('map-')) renderStoryMap(activeStep);
});
function storySourceText() { const C = copy(facts(SITE)); $('#storySource').textContent = REAL ? C.source : `${t('synthetic')}.`; }
function activate(step) {
  const k = step.dataset.step;
  /* mark the rail first: returning from the explorer re-enters the same step, which must win back the rail */
  markChapter(STEP_CHAPTER[k]);
  if (k === activeStep) return;
  activeStep = k;
  $$('.step').forEach(s => s.classList.toggle('is-active', s === step));
  showStep(k);
}
function observeSteps() {
  if (stepObserver) stepObserver.disconnect();
  const mobile = window.matchMedia('(max-width: 820px)').matches;
  stepObserver = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) activate(en.target.closest('.step')); });
  }, {rootMargin: mobile ? '-62% 0px -30% 0px' : '-45% 0px -45% 0px'});
  /* watch the text, not the tall step block, so the chart changes when its words arrive */
  $$('.step-body').forEach(s => stepObserver.observe(s));
}
new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) markChapter('explore'); }), {rootMargin: '-40% 0px -50% 0px'}).observe($('#explore'));

let resizeT = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => {
    render(); sizeStripeAxis(); observeSteps();
    if (figMode === 'map') renderStoryMap(activeStep); else story.redraw();
  }, 150);
});
