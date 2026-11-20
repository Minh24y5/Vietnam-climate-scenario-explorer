'use strict';
/* Shared helpers: DOM lookups, averages, constants used across the page. */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const N_YEARS = 151;
const REAL_URL = 'data/vietnam_cmip6.json';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const DASHES = ['', '6 3', '2 3', '8 3 2 3', '4 4 1 4', '1 3', '10 4'];

/* the chapter strip (under 1120px) scrolls sideways: keep the current chapter's link in view.
   Scrolls the strip only, never the page; a no-op on the vertical rail, which doesn't overflow */
function revealChapter() {
  const nav = $('.chapters'), a = nav && nav.querySelector('a[aria-current="true"]');
  if (!a || nav.scrollWidth <= nav.clientWidth) return;
  const l = a.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft, r = l + a.offsetWidth, pad = 24;
  if (l < nav.scrollLeft + pad || r > nav.scrollLeft + nav.clientWidth - pad)
    nav.scrollTo({left: Math.max(0, l - pad), behavior: reduceMotion.matches ? 'auto' : 'smooth'});
}

/* under 820px a story step is a tall scroll block with its card at the foot, so a jump to the
   step's top would show the previous chart over blank paper. Chapter links there land with the
   card in the band that makes it the active step, and move focus to the card. */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#ch-"]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
  if (!window.matchMedia('(max-width: 820px)').matches) return;
  const step = document.querySelector(a.getAttribute('href')), card = step && step.querySelector('.step-body');
  if (!card) return;
  e.preventDefault();
  scrollTo({top: card.getBoundingClientRect().top + scrollY - innerHeight * 0.6, behavior: reduceMotion.matches ? 'auto' : 'smooth'});
  if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '-1');
  card.focus({preventScroll: true});
  history.pushState(null, '', a.getAttribute('href'));
});
