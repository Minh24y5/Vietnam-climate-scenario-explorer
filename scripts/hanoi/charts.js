'use strict';
/* Hà Nội page: the charts. All draw into a container with plain D3 and use the shared chart
   primitives (axis, grid, unit, note, basebox) from styles/charts.css. */

const DOT_R = 4;
/* drop the previous chart before measuring, so the old drawing never sets the new size */
function clear(el) { d3.select(el).selectAll('svg').remove(); return el; }
function svgIn(el, W, H) {
  d3.select(el).selectAll('svg').remove();
  return d3.select(el).insert('svg', ':first-child').attr('width', W).attr('height', H).attr('aria-hidden', 'true');
}
/* place dots in a strip without overlap: along `along` (pixels), push sideways by whole steps */
function dodge(items, along, r = DOT_R, maxOff = Infinity) {
  const placed = [], step = r * 2 + 0.6;
  items.slice().sort((a, b) => along(a) - along(b)).forEach(it => {
    const p = along(it);
    for (let k = 0; k < 60; k++) {
      const off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * step;
      if (Math.abs(off) > maxOff) { it.off = 0; break; }
      if (placed.every(q => Math.hypot(q.p - p, q.off - off) >= step)) { it.off = off; break; }
    }
    if (it.off == null) it.off = 0;
    it.p = p;
    placed.push(it);
  });
  return items;
}
const yFmt = d => v => fmt(`,.${d}f`)(v);

/* ---------- observed hot days per year, 1980–2014 ---------- */
function chartPast(el) {
  const O = HN.obs, W = clear(el).clientWidth || 600, H = Math.max(160, el.clientHeight || 400);
  const m = {t: 24, r: 8, b: 26, l: 34};
  const svg = svgIn(el, W, H);
  const x = d3.scaleBand(O.years, [m.l, W - m.r]).padding(0.18);
  const y = d3.scaleLinear([0, d3.max(O.tx35) * 1.12], [H - m.b, m.t]).nice();
  const b0 = x(1995), b1 = x(2014) + x.bandwidth();
  svg.append('rect').attr('class', 'basebox').attr('x', b0 - 2).attr('width', b1 - b0 + 4).attr('y', m.t).attr('height', H - m.b - m.t);
  svg.append('text').attr('class', 'note').attr('x', b0 + 2).attr('y', m.t + 13).text('1995–2014');
  svg.append('g').attr('class', 'grid').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(W - m.l - m.r)).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(yFmt(0)));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`)
    .call(d3.axisBottom(x).tickValues(O.years.filter(v => v % 5 === 0)).tickFormat(d3.format('d')));
  svg.append('text').attr('class', 'unit').attr('x', 0).attr('y', 14).text(t('daysYr'));
  svg.append('g').selectAll('rect').data(O.years.map((yr, i) => ({yr, v: O.tx35[i]}))).join('rect')
    .attr('class', 'hn-bar').attr('x', d => x(d.yr)).attr('width', x.bandwidth()).attr('y', d => y(d.v)).attr('height', d => y(0) - y(d.v));
  /* linear trend */
  const xs = O.years, ys = O.tx35, xm = mean(xs), ym = mean(ys);
  const s = d3.sum(xs.map((v, i) => (v - xm) * (ys[i] - ym))) / d3.sum(xs.map(v => (v - xm) ** 2));
  const ty = v => ym + s * (v - xm);
  svg.append('line').attr('class', 'hn-trend')
    .attr('x1', x(xs[0]) + x.bandwidth() / 2).attr('x2', x(xs[xs.length - 1]) + x.bandwidth() / 2).attr('y1', y(ty(xs[0]))).attr('y2', y(ty(xs[xs.length - 1])));
  const top = d3.max(ys), yr = xs[ys.indexOf(top)];
  svg.append('text').attr('class', 'endlabel').attr('x', x(yr) + x.bandwidth() / 2).attr('y', y(top) - 6).attr('text-anchor', 'middle').text(`${yr}: ${top}`);
  return `<span><i class="hn-barsw"></i>${t('perYear')}</span><span><i class="hn-trendsw"></i>${t('trendLine')}</span><span><i class="basesw"></i>${t('baseWin')}</span>`;
}

/* ---------- the year each model reaches +2 °C, by scenario ---------- */
function chartWhen(el, lv = '2.0') {
  const W = clear(el).clientWidth || 600, H = Math.max(160, el.clientHeight || 400), narrow = W < 520;
  const m = {t: 22, r: 16, b: 28, l: narrow ? 78 : 112};  /* r: half of the centred "2090" tick */
  const svg = svgIn(el, W, H);
  const rows = SSP_ROWS.filter(r => HN.when[r.s]);
  const yb = d3.scaleBand(rows.map(r => r.s), [m.t, H - m.b]).paddingInner(0.18);
  /* the axis starts just before the first model gets there (2025 unless one is earlier), not at an
     empty 2000; four-digit years need no unit label */
  const first = d3.min(rows.flatMap(r => (HN.when[r.s][lv] || []).map(d => d.y)));
  const x0 = Math.min(2025, Math.floor(((first || 2030) - 3) / 5) * 5);
  const x = d3.scaleLinear([x0, 2090], [m.l, W - m.r]);
  const ticks = d3.range(Math.ceil(x0 / 10) * 10, 2091, narrow ? 20 : 10);
  svg.append('g').attr('class', 'grid').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(ticks).tickSize(-(H - m.b - m.t)).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(ticks).tickFormat(d3.format('d')));
  for (const r of rows) {
    const w = HN.when[r.s], pts = (w[lv] || []).map(d => ({...d})), y0 = yb(r.s), bh = yb.bandwidth(), yc = y0 + bh / 2;
    svg.append('line').attr('class', 'hn-row').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y0 + bh).attr('y2', y0 + bh);
    const g = svg.append('g');
    g.append('text').attr('class', 'hn-rowlab').attr('x', 0).attr('y', yc - (narrow ? 2 : 4)).text(r.name);
    g.append('text').attr('class', 'note').attr('x', 0).attr('y', yc + 12).text(r[LANG] || r.en);
    dodge(pts, d => x(d.y), DOT_R, bh / 2 - DOT_R);
    svg.append('g').selectAll('circle').data(pts).join('circle').attr('class', 'hn-dot')
      .attr('cx', d => x(d.y)).attr('cy', d => yc + d.off).attr('r', DOT_R);
    if (pts.length) {
      const md = d3.median(pts, d => d.y);
      svg.append('line').attr('class', 'hn-med').attr('x1', x(md)).attr('x2', x(md)).attr('y1', y0 + 3).attr('y2', y0 + bh - 3);
    }
    const miss = w.n - pts.length;
    if (miss > 0) {
      /* "3/5 don't get there before 2090" sits at the row's right end; if the median tick or a dot
         would run under it, it moves to the row's foot, still right-aligned, on a paper halo */
      const note = svg.append('text').attr('class', 'note hn-halo').attr('x', W - m.r).attr('y', y0 + 12).attr('text-anchor', 'end')
        .text(LANG === 'vi' ? `${miss}/${w.n} ${t('never')}` : `${miss} of ${w.n} ${t('never')}`);
      const nw = note.node().getComputedTextLength(), xs = pts.map(d => x(d.y));
      if (xs.some(px => px > W - m.r - nw - 10)) note.attr('y', y0 + bh - 6);
    }
  }
  return `<span><i class="hn-dotsw"></i>${t('modelDot')}</span><span><i class="hn-medsw v"></i>${t('median')}</span>`;
}

/* ---------- each model at 1995–2014 and each warming level ---------- */
const LEVEL_COLS = ['base', ...LEVELS];
const colName = c => c === 'base' ? '1995–2014' : lvName(c);
/* the warming-level columns of a temperature chart take the heat calendar's ramp (calColor), as a
   data ink, never nameplate red: deeper (light theme) or brighter (dark) at each level, the same
   reading as the calendar's rows. 1995–2014 stays graphite; rain stays graphite, red would read as heat */
const LEVEL_SHARE = {'1.5': 0.62, '2.0': 0.8, '3.0': 1};  /* +1.5 °C kept ≥3:1 on newsprint */
const levelInk = (k, c) => IND[k].kind === 't' && LEVEL_SHARE[c] ? calColor(LEVEL_SHARE[c]) : null;
/* in Change mode every model's 1995–2014 is zero by definition: that column says nothing, so it goes */
const levelCols = mode => mode === 'anom' ? LEVELS : LEVEL_COLS;
function chartLevels(el, k, mode = 'abs', opt = {}) {
  const W = clear(el).clientWidth || 600, H = opt.height || Math.max(160, el.clientHeight || 400), narrow = W < 520;
  /* the right margin holds the last column's median label ("39,9"), which sits right of its bar */
  const m = {t: 24, r: narrow ? 30 : 38, b: 30, l: 44};
  const svg = svgIn(el, W, H);
  const cols = levelCols(mode).map(c => ({c, pts: valuesAt(k, c, mode).map(d => ({...d}))}));
  const obs = mode === 'abs' ? HN.obs.base[k] : 0;
  const all = cols.flatMap(c => c.pts.map(d => d.v)).concat([obs]);
  const lo = IND[k].change === 'pct' && mode === 'anom' ? d3.min(all) : (mode === 'abs' && k !== 'tas' ? 0 : d3.min(all));
  const y = d3.scaleLinear([Math.min(lo, mode === 'anom' ? 0 : lo), d3.max(all)], [H - m.b, m.t]).nice();
  const x = d3.scaleBand(levelCols(mode), [m.l, W - m.r]).paddingInner(0.12);
  const d = mode === 'anom' && k === 'tas' ? 1 : IND[k].d;
  svg.append('g').attr('class', 'grid').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickSize(-(W - m.l - m.r)).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6)
    .tickFormat(v => mode === 'anom' ? (v === 0 ? '0' : fmt('+')(v)) : fmt(',')(v)));
  svg.append('g').attr('class', 'axis hn-cols').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickSize(0).tickPadding(10).tickFormat(colName));
  const unitTxt = mode === 'anom' && IND[k].change === 'pct' ? '%' : (k === 'tas' ? '°C' : indUnit(k));
  svg.append('text').attr('class', 'unit').attr('x', 0).attr('y', 14).text(unitTxt);
  /* observed 1995–2014 (or zero change) across the chart */
  svg.append('line').attr('class', mode === 'abs' ? 'hn-obs' : 'zero').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(obs)).attr('y2', y(obs));
  if (mode === 'abs') svg.append('text').attr('class', 'note hn-obslab').attr('x', W - m.r).attr('y', y(obs) - 6).attr('text-anchor', 'end').text(`${t('obsLong')}: ${nf(obs, IND[k].d)}`);
  const half = x.bandwidth() / 2;
  const dots = [];
  for (const col of cols) {
    const cx = x(col.c) + half;
    dodge(col.pts, p => y(p.v), DOT_R, half - DOT_R - 2);
    col.pts.forEach(p => { p.x = cx + p.off; p.y = y(p.v); p.col = col.c; dots.push(p); });
    if (col.pts.length) {
      const md = d3.median(col.pts, p => p.v), w = Math.min(half * 0.9, 46);
      svg.append('line').attr('class', 'hn-med').attr('x1', cx - w).attr('x2', cx + w).attr('y1', y(md)).attr('y2', y(md));
      if (col.c !== 'base' || mode === 'anom') svg.append('text').attr('class', 'endlabel').attr('x', cx + w + 4).attr('y', y(md) + 4)
        .text(mode === 'anom' ? (IND[k].change === 'pct' ? `${sg(md, 0)}%` : sg(md, d)) : nf(md, IND[k].d));
    }
  }
  /* a second, rarer threshold drawn as medians only (bands: 39 °C under the 37 °C dots) */
  if (opt.also && mode === 'abs') {
    for (const c of levelCols(mode)) {
      const v2 = valuesAt(opt.also, c, 'abs');
      if (!v2.length) continue;
      const md = d3.median(v2, p => p.v), cx = x(c) + half, w = Math.min(half * 0.9, 46);
      svg.append('line').attr('class', 'hn-med2').attr('x1', cx - w).attr('x2', cx + w).attr('y1', y(md)).attr('y2', y(md));
      if (c !== 'base') svg.append('text').attr('class', 'endlabel hn-med2lab').attr('x', cx + w + 4).attr('y', y(md) + 4).text(nf(md, IND[opt.also].d));
    }
  }
  const hl = opt.highlight;
  if (hl) {
    const path = levelCols(mode).map(c => dots.find(p => p.col === c && p.m === hl)).filter(Boolean);
    svg.append('path').attr('class', 'hn-hl-line').attr('d', d3.line(p => p.x, p => p.y)(path));
  }
  svg.append('g').selectAll('circle').data(dots).join('circle')
    .attr('class', p => 'hn-dot' + (levelInk(k, p.col) ? ' is-warm' : '') + (hl && p.m === hl ? ' is-hl' : '') + (hl && p.m !== hl ? ' is-dim' : ''))
    .style('fill', p => hl && p.m === hl ? null : levelInk(k, p.col))
    .attr('cx', p => p.x).attr('cy', p => p.y).attr('r', p => hl && p.m === hl ? DOT_R + 1.5 : DOT_R);
  if (hl) {
    const last = dots.filter(p => p.m === hl).pop();
    if (last) svg.append('text').attr('class', 'endlabel').attr('x', last.x).attr('y', last.y - 10).attr('text-anchor', 'middle').text(hl);
  }
  el._dots = dots;
  const sw = IND[k].kind === 't' ? levelCols(mode).map(c => `<i class="hn-dotsw${levelInk(k, c) ? ' is-warm' : ''}"${levelInk(k, c) ? ` style="background:${levelInk(k, c)}"` : ''}></i>`).join('') : '<i class="hn-dotsw"></i>';
  /* with a second threshold, each median names its own: "(từ 37 °C)", "(từ 39 °C)" from the indicator names */
  const thr = key => opt.also && mode === 'abs' ? ` ${(indName(key).match(/\([^)]*\)/) || [''])[0]}` : '';
  return `<span>${sw}${t('modelDot')}</span><span><i class="hn-medsw"></i>${t('median')}${thr(k)}</span>` +
    (opt.also && mode === 'abs' ? `<span><i class="hn-med2sw"></i>${t('median')}${thr(opt.also)}</span>` : '') +
    (mode === 'abs' ? `<span><i class="hn-obssw"></i>${t('obsLong')}</span>` : '');
}

/* ---------- observed and modelled trends, 1980–2014 ---------- */
function chartTrend(el) {
  const W = clear(el).clientWidth || 600, H = Math.max(160, el.clientHeight || 400);
  const m = {t: 20, r: 14, b: 12, l: 14};
  const svg = svgIn(el, W, H);
  const rows = [
    {k: 'tas', lab: LANG === 'vi' ? 'Nhiệt độ trung bình năm, °C mỗi thập kỷ' : 'Annual mean temperature, °C per decade', d: 2},
    {k: 'tx35', lab: LANG === 'vi' ? 'Ngày nắng nóng, ngày mỗi thập kỷ' : 'Hot days, days per decade', d: 1}
  ];
  const rh = (H - m.t - m.b) / rows.length;
  rows.forEach((r, i) => {
    const pts = Object.entries(HN.models).filter(([, v]) => v.temperature && v.trend[r.k] != null).map(([mm, v]) => ({m: mm, v: v.trend[r.k]}));
    const obs = HN.obs.trend[r.k];
    const ext = d3.extent(pts.map(p => p.v).concat([obs, 0]));
    const pad = (ext[1] - ext[0]) * 0.08 || 0.1;
    const x = d3.scaleLinear([ext[0] - pad, ext[1] + pad], [m.l, W - m.r]).nice();
    const y0 = m.t + i * rh, axisY = y0 + rh - 34, yc = y0 + 30 + (axisY - y0 - 30) / 2;
    svg.append('text').attr('class', 'hn-rowlab').attr('x', 0).attr('y', y0 + 12).text(r.lab);
    svg.append('g').attr('class', 'grid').attr('transform', `translate(0,${axisY})`).call(d3.axisBottom(x).ticks(6).tickSize(-(axisY - y0 - 22)).tickFormat(''));
    svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${axisY})`).call(d3.axisBottom(x).ticks(6).tickFormat(v => v === 0 ? '0' : fmt('+')(v)));
    svg.append('line').attr('class', 'zero').attr('x1', x(0)).attr('x2', x(0)).attr('y1', y0 + 22).attr('y2', axisY);
    /* observed first, so a model median that lands on it (temperature does, at +0.21) draws on top;
       the median then carries its own value under the tick, the observed value sits at the top */
    svg.append('line').attr('class', 'hn-obs v').attr('x1', x(obs)).attr('x2', x(obs)).attr('y1', y0 + 22).attr('y2', axisY);
    svg.append('text').attr('class', 'note hn-obslab').attr('x', x(obs) + 5).attr('y', y0 + 32).text(`${t('obsShort')}: ${sg(obs, r.d)}`);
    dodge(pts, p => x(p.v), DOT_R, (axisY - y0 - 30) / 2 - DOT_R);
    svg.append('g').selectAll('circle').data(pts).join('circle').attr('class', 'hn-dot').attr('cx', p => x(p.v)).attr('cy', p => yc + p.off).attr('r', DOT_R);
    if (pts.length) {
      const md = d3.median(pts, p => p.v);
      svg.append('line').attr('class', 'hn-med').attr('x1', x(md)).attr('x2', x(md)).attr('y1', yc - 18).attr('y2', yc + 18);
      /* the label starts past both lines, on the side away from the observed one, so the dashed
         line never runs through it */
      const right = obs <= md;
      svg.append('text').attr('class', 'endlabel').attr('y', yc + 34)
        .attr('x', right ? Math.max(x(md), x(obs)) + 5 : Math.min(x(md), x(obs)) - 5).attr('text-anchor', right ? 'start' : 'end')
        .text(`${LANG === 'vi' ? 'Trung vị' : 'Median'}: ${sg(md, r.d)}`);
    }
  });
  return `<span><i class="hn-dotsw"></i>${t('modelDot')}</span><span><i class="hn-medsw v"></i>${t('median')}</span><span><i class="hn-obssw v"></i>${t('obsShort')}</span>`;
}
