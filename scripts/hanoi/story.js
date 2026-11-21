'use strict';
/* Hà Nội page: scroll-story wiring. The pinned frame draws one chart per step and fades between
   steps the way the national page swaps its chart and map. */

const HN_STEPS = {
  past:   el => chartPast(el),
  when:   el => chartWhen(el, '2.0'),
  hot:    el => chartLevels(el, 'tx35'),
  bands:  el => chartLevels(el, 'tx37', 'abs', {also: 'tx39'}),
  nights: el => chartLevels(el, 'tn28'),
  rain:   el => chartLevels(el, 'r50'),
  check:  el => chartTrend(el),
  test:   el => chartTest(el)
};
const HN_CHAPTER = {past: 'ch-past', when: 'ch-levels', hot: 'ch-heat', bands: 'ch-heat', nights: 'ch-heat', rain: 'ch-rain', check: 'ch-check', test: 'ch-check'};
let hnStep = null, hnObserver = null, hnSwapT = null, hnPending = null;
function markChapter(id) { $$('.chapters a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'true' : 'false')); revealChapter(); }

function drawHnStep(k) {
  const C = HN_C, el = $('#storyChart');
  $('#storyTitle').textContent = C.titles[k];
  el.setAttribute('aria-label', C.titles[k]);
  $('#storyLegend').innerHTML = HN_STEPS[k](el);
  $('#storySource').textContent = C.sources[k];
  /* the legend and source set how much room the chart has: draw again at that size */
  HN_STEPS[k](el);
}
function showHnStep(k) {
  hnPending = k;
  if (hnSwapT) return;
  const fr = $('.story-frame');
  const finish = () => { hnSwapT = null; drawHnStep(hnPending); };
  if (reduceMotion.matches) { finish(); fr.classList.add('fading'); setTimeout(() => fr.classList.remove('fading'), 160); return; }
  fr.classList.add('swapping');
  hnSwapT = setTimeout(() => { finish(); fr.classList.remove('swapping'); }, 170);
}
function activateHn(step) {
  const k = step.dataset.step;
  /* mark the rail first: returning from the explorer re-enters the same step, which must win back the rail */
  markChapter(HN_CHAPTER[k]);
  if (k === hnStep) return;
  hnStep = k;
  $$('.step').forEach(s => s.classList.toggle('is-active', s === step));
  showHnStep(k);
}
function observeHnSteps() {
  if (hnObserver) hnObserver.disconnect();
  const mobile = window.matchMedia('(max-width: 820px)').matches;
  hnObserver = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) activateHn(en.target.closest('.step')); });
  }, {rootMargin: mobile ? '-62% 0px -30% 0px' : '-45% 0px -45% 0px'});
  /* watch the text, not the tall step block, so the chart changes when its words arrive */
  $$('.step-body').forEach(s => hnObserver.observe(s));
}
new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) markChapter('explore'); }), {rootMargin: '-40% 0px -50% 0px'}).observe($('#explore'));
