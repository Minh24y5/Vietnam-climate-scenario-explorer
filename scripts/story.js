'use strict';
/* Scroll-story wiring: chart/map swap, step observers, resize. */

/* ---------- story wiring ---------- */
const story = StoryChart($('#storyChart'));
const STEP_CHAPTER = {'tas-abs': 'ch-models', 'tas-anom': 'ch-change', 'tas-245': 'ch-futures', 'tas-585': 'ch-futures',
  'map-zones': 'ch-regions', 'map-grid': 'ch-regions', 'map-2023': 'ch-regions', 'pr-abs': 'ch-rain', 'pr-agree': 'ch-rain', 'pr-hatch': 'ch-rain', 'pr-scale': 'ch-rain', 'pr-season': 'ch-rain', 'map-drought': 'ch-drought', lives: 'ch-lives',
  'tas-fork': 'ch-fork', close: 'ch-close'};
let activeStep = null, stepObserver = null;
function markChapter(id) { $$('.chapters a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'true' : 'false')); revealChapter(); }

/* the pinned figure holds either the line chart or the zone map */
const storyMap = ZoneMap($('#storyMap'), {story: true});
const storyScatter = StoryScatter($('#storyScatter')), storySeasons = StorySeasons($('#storySeasons')), storyLives = StoryLives($('#storyLives'));
/* the figures other than the line chart and the map, by step */
const ALT = {'pr-scale': 'scatter', 'pr-season': 'seasons', lives: 'lives'};
const ALT_EL = {scatter: '#storyScatter', seasons: '#storySeasons', lives: '#storyLives'};
const ALT_DRAW = {scatter: () => storyScatter.render(facts(SITE)), seasons: () => storySeasons.render(), lives: () => storyLives.render()};
let figMode = 'chart', mapScen = 'ssp585', ZF = null;
/* show step k, fading the frame when it switches between chart and map; a swap under way
   always finishes on the latest step, however fast the reader scrolls */
let swapT = null, pendingKey = null;
const modeOf = k => k.startsWith('map-') ? 'map' : ALT[k] || 'chart';
function drawStep(k) { const m = modeOf(k); if (m === 'map') renderStoryMap(k); else if (ALT_DRAW[m]) ALT_DRAW[m](); else { storySourceText(); story.render(k, true); } }
/* redraw whatever the pinned figure shows, after a resize or a language switch */
function redrawFig() { if (figMode === 'map') renderStoryMap(activeStep); else if (ALT_DRAW[figMode]) ALT_DRAW[figMode](); else story.redraw(); }
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
    for (const [m, s] of Object.entries(ALT_EL)) $(s).hidden = figMode !== m;
    drawStep(pendingKey);
  };
  if (reduceMotion.matches) { finish(); fr.classList.add('fading'); setTimeout(() => fr.classList.remove('fading'), 160); return; }
  fr.classList.add('swapping');
  swapT = setTimeout(() => { finish(); fr.classList.remove('swapping'); }, 170);
}
function renderStoryMap(k) {
  if (!REG || !TOPO) return;
  if (k === 'map-drought') { renderDroughtMap(); return; }
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
  $('#storySource').textContent = (LANG === 'vi'
    ? `Nguồn: CMIP6, ${ZF.n} mô hình, trung bình theo diện tích đất liền từng vùng; ranh giới tỉnh Natural Earth (trước sáp nhập 2025). Hai quần đảo nhỏ hơn một ô lưới nên không có số liệu.`
    : `Source: CMIP6, ${ZF.n} models, land-area-weighted zone means; province boundaries from Natural Earth (before the 2025 mergers). Both archipelagos are smaller than a model cell, so they have no values.`) +
    (k === 'map-2023' ? (LANG === 'vi'
      ? ' Kỷ lục nhiệt độ: Tổng cục Khí tượng Thủy văn, theo VnExpress và Tuổi Trẻ, 5/2023. Hồ thủy điện: EVN và VnExpress, 6/2023. Thiệt hại mất điện: Ngân hàng Thế giới, Taking Stock, 8/2023. Bão Yagi: Heinrich Böll Stiftung, 9/2024. Mùa hè nóng hơn 0,8 °C: Lancet Countdown về sức khỏe và biến đổi khí hậu, bản tin Việt Nam 2023 (số liệu đến 2022; Romanello và cộng sự 2023, The Lancet), nhiệt độ theo nơi dân cư.'
      : ' Temperature records: Vietnam\'s meteorological administration, via VnExpress and Tuoi Tre, May 2023. Reservoirs: EVN and VnExpress, June 2023. Blackout cost: World Bank, Taking Stock, August 2023. Typhoon Yagi: Heinrich Böll Stiftung, September 2024. Summers 0.8 °C hotter: Lancet Countdown on health and climate change, Vietnam data sheet 2023 (data to 2022; Romanello et al. 2023, The Lancet), population-weighted.') : '');
}
/* the drought map: change in drought months a year, 2036–2065 against 1985–2014, by zone */
function renderDroughtMap() {
  const vi = LANG === 'vi', D = WF.drought[mapScen], val = id => D[id].mid.med;
  $('#storyMapTitle').innerHTML = vi ? '<span class="t-long">Thêm bao nhiêu tháng khô hạn mỗi năm, 2036–2065</span><span class="t-short">Thêm tháng khô hạn, 2036–2065</span>'
    : '<span class="t-long">Extra drought months a year, 2036–2065</span><span class="t-short">Extra drought months, 2036–2065</span>';
  $$('#mapScen button').forEach(b => b.setAttribute('aria-pressed', b.dataset.s === mapScen ? 'true' : 'false'));
  const wrap = $('#storyMapWrap'), maxH = Math.max(220, wrap.clientHeight - $('.map-head').offsetHeight - 4);
  storyMap.render({fill: id => droughtColor(val(id)), label: id => `${sg(val(id))}`, grid: null, maxH});
  $('#storyMap').classList.toggle('show-grid', false);
  $('#storyLegend').innerHTML = `<span class="ramp-key" id="storyMapKey"></span><span><i class="isw"></i>${t('noModelData')}</span>`;
  rampKey($('#storyMapKey'), droughtColor, [-1.5, -0.75, 0, 0.75, 1.5], v => v === 0 ? '0' : fmt('+')(v), '');
  $('#storyMap').setAttribute('aria-label', `${$('#storyMapTitle .t-long').textContent}, ${SCEN[mapScen].name}: ` + ZF.order[mapScen].map(z => `${zoneName(z)} ${sg(val(z))}`).join('; ') + '.');
  $('#storySource').textContent = vi
    ? `Nguồn: CMIP6, ${WF.nd} mô hình (${WF.dModels.join(', ')}; CESM2 thiếu nhiệt độ cao nhất và thấp nhất thời kỳ lịch sử). SPEI-6 (Vicente-Serrano và cộng sự 2010), bốc thoát hơi tiềm năng theo Hargreaves, so với 1985–2014 của từng mô hình; trung vị các mô hình.`
    : `Source: CMIP6, ${WF.nd} models (${WF.dModels.join(', ')}; CESM2 lacks historical daily highs and lows). SPEI-6 (Vicente-Serrano et al. 2010), Hargreaves potential evaporation, against each model's 1985–2014; model median.`;
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
    redrawFig();
  }, 150);
});
