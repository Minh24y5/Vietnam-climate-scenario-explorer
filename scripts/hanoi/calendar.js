'use strict';
/* Hà Nội page: the heat calendar in the lead. One row per period (observed 1995–2014, then each
   warming level), one column per day of the year, coloured by the share of years reaching 35 °C.

   Each theme has its own ramp, built so that more heat always reads as more colour against that
   page's ground:
   - light: the warm half of the warming stripes' RdBu scale, pale peach to dark red (darker = more);
   - dark: YlOrRd run the other way, dim burgundy to bright orange (brighter = more). RdBu on the
     dark ground would make rare days glow near-white and the hottest sink into the background.
   Below a 20% share the colour fades out by opacity, so rare days recede into the page in both. */
const calDark = () => typeof curTheme === 'function' ? curTheme() === 'dark' : document.documentElement.dataset.theme === 'dark';
const calColor = p => {
  const q = Math.min(1, Math.max(0, p)), s = Math.max(q, 0.2);
  const c = d3.color(calDark() ? d3.interpolateYlOrRd(1 - 0.8 * s) : d3.interpolateRdBu(0.5 - 0.5 * s));
  c.opacity = Math.min(1, q / 0.2);
  return c.formatRgb();
};
/* the key stops at the highest share any row reaches (rounded up to 10%), not at an unused 100% */
const calTop = () => Math.min(1, Math.ceil(d3.max(calRows(), r => d3.max(r.d)) * 10) / 10);
const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

function calRows() {
  return [{key: 'obs', d: HN.calendar.obs}, ...LEVELS.filter(lv => HN.calendar[lv]).map(lv => ({key: lv, d: HN.calendar[lv]}))];
}
function drawCalendar() {
  const rows = calRows(), n = rows.length;
  const rects = [];
  rows.forEach((r, j) => r.d.forEach((p, i) => { if (p >= 0.005) rects.push({x: i, y: j, p}); }));
  d3.select('#cal').attr('viewBox', `0 0 365 ${n}`)
    .selectAll('rect').data(rects).join('rect')
    .attr('x', d => d.x).attr('y', d => d.y + 0.04).attr('width', 1.04).attr('height', 0.92).attr('fill', d => calColor(d.p));
  $('.cal-band').style.setProperty('--rows', n);
  calText();
}
function calText() {
  const rows = calRows();
  $('#calLabels').innerHTML = rows.map(r => r.key === 'obs'
    ? `<span><b>1995–2014</b> <span class="long">${t('obsShort').toLowerCase()}</span></span>`
    : `<span><b>${lvName(r.key)}</b></span>`).join('');
  const mon = LANG === 'vi' ? ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  $('#calAxis').innerHTML = MONTH_START.map((d, i) => `<span style="left:${d / 365 * 100}%">${mon[i]}</span>`).join('');
  sizeCalAxis();
}
function calKey(C) {
  const top = calTop(), step = top > 0.5 ? 0.2 : 0.1;
  const ticks = d3.range(0, top + 1e-9, step).map(v => Math.round(v * 100) / 100);
  if (ticks[ticks.length - 1] < top - 1e-9) ticks.push(top);
  rampKeyHn($('#calKey'), calColor, ticks, v => fmt('.0%')(v), C.keyLabel);
}
function rampKeyHn(el, scale, ticks, fmtTick, label) {
  const [a, b] = [ticks[0], ticks[ticks.length - 1]];
  const sw = d3.range(26).map(i => `<i style="background:${scale(a + (b - a) * (i + .5) / 26)}"></i>`).join('');
  el.innerHTML = (label ? `<span>${label}</span>` : '') + `<div class="key-row">${sw}</div><div class="key-ticks">${ticks.map(v => `<span>${fmtTick(v)}</span>`).join('')}</div>`;
}
/* the month axis spans the calendar only, not its labels column. A month is 1/12 of the calendar;
   if the widest label (T10, "Sep") plus a gap won't fit in the shortest month (February), every
   other label goes, measured rather than guessed from the viewport */
function sizeCalAxis() {
  const band = $('.cal-band'), svg = $('#cal'), axis = $('#calAxis');
  if (!band || !svg || !axis) return;
  axis.style.setProperty('--labels-w', (band.clientWidth - svg.clientWidth) + 'px');
  const widest = d3.max([...axis.children], s => s.offsetWidth) || 0;
  axis.classList.toggle('is-tight', svg.clientWidth * 28 / 365 < widest + 4);
}
/* follow the calendar's own width (the lead re-flows at 1300px and when the rail comes and goes),
   not only window resizes */
if ('ResizeObserver' in window) new ResizeObserver(() => { if (HN) sizeCalAxis(); }).observe($('.cal-band'));
