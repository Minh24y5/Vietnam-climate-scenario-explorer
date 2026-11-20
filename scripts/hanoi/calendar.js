'use strict';
/* Hà Nội page: the heat calendar in the lead. One row per period (observed 1995–2014, then each
   warming level), one column per day of the year, coloured by the share of years reaching 35 °C.
   The colours are the warm half of the warming stripes' RdBu scale. */

/* rare days fade into the paper (opacity) instead of showing the scale's white, so the calendar
   reads the same on light and dark pages */
const calColor = p => {
  const q = Math.min(1, Math.max(0, p)), c = d3.color(d3.interpolateRdBu(0.5 - 0.5 * Math.max(q, 0.2)));
  c.opacity = Math.min(1, q / 0.2);
  return c.formatRgb();
};
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
  rampKeyHn($('#calKey'), calColor, [0, 0.25, 0.5, 0.75, 1], v => v === 1 ? `${fmt('.0%')(v)}` : fmt('.0%')(v), C.keyLabel);
}
function rampKeyHn(el, scale, ticks, fmtTick, label) {
  const [a, b] = [ticks[0], ticks[ticks.length - 1]];
  const sw = d3.range(26).map(i => `<i style="background:${scale(a + (b - a) * (i + .5) / 26)}"></i>`).join('');
  el.innerHTML = (label ? `<span>${label}</span>` : '') + `<div class="key-row">${sw}</div><div class="key-ticks">${ticks.map(v => `<span>${fmtTick(v)}</span>`).join('')}</div>`;
}
/* the month axis spans the calendar only, not its labels column */
function sizeCalAxis() {
  const band = $('.cal-band'), svg = $('#cal');
  if (band && svg) $('#calAxis').style.setProperty('--labels-w', (band.clientWidth - svg.clientWidth) + 'px');
}
