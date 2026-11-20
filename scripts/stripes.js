'use strict';
/* The forked warming stripes in the lead. */

/* ---------- warming stripes ---------- */
const stripeColor = d3.scaleDiverging([-1, 0, 4], v => d3.interpolateRdBu(1 - v)).clamp(true);
function drawStripes(D) {
  const ms = modelsOf(D);
  const an = s => ens(ms.map(m => full(D, 'tas', m, s).map(q => q - baseOf(D, 'tas', m, 1985))));
  const a245 = an('ssp245'), a585 = an('ssp585');
  const rects = [];
  for (let i = 0; i < N_YEARS; i++) {
    if (i < 65) rects.push({x: i, y: 0, h: 2, v: a245[i].mean});
    else { rects.push({x: i, y: 0, h: .993, v: a245[i].mean}); rects.push({x: i, y: 1.007, h: .993, v: a585[i].mean}); }
  }
  d3.select('#stripes').selectAll('rect').data(rects).join('rect')
    .attr('x', d => d.x).attr('y', d => d.y).attr('width', 1.04).attr('height', d => d.h).attr('fill', d => stripeColor(d.v));
  sizeStripeAxis();
}
function stripesKey(C) {
  const sw = d3.range(26).map(i => `<i style="background:${stripeColor(-1 + i * 0.2)}"></i>`).join('');
  $('#stripesKey').innerHTML = `<span>${C.keyLabel}</span><div class="key-row">${sw}</div>` +
    `<div class="key-ticks"><span>−1</span><span>0</span><span>+1</span><span>+2</span><span>+3</span><span>+4&nbsp;°C</span></div>`;
}
function sizeStripeAxis() {
  const band = $('.stripes-band'), svg = $('#stripes');
  if (band && svg) $('.stripes-axis').style.setProperty('--labels-w', (band.clientWidth - svg.clientWidth) + 'px');
}
