'use strict';
/* The explorer: chart, labels, results, table and region map. */

/* ---------- explorer ---------- */
const ex = {region: 'vn', v: 'tas', mode: 'anom', scen: new Set(['ssp245', 'ssp585']), models: new Set(), off: new Set(), bs: 1985, ind: false, smooth: true, yr: 2050};
const SAMPLE = synth();
let REAL = null, DATA = SAMPLE, source = 'sample', SITE = SAMPLE;
let activeShow = null;
let dataMsg = {key: null, n: 0, text: '', error: false};
const sel = () => modelsOf(DATA).filter(m => ex.models.has(m));

function exSeries(m, s) {
  const b = baseOf(DATA, ex.v, m, ex.bs);
  const x = full(DATA, ex.v, m, s).map(q => change(q, b, ex.v, ex.mode));
  return ex.smooth ? smoothC(x) : x;
}
/* the unit the chart shows: °C, mm/month, or % for rainfall change */
const exUnit = () => ex.mode === 'anom' && ex.v === 'pr' ? '%' : VARS[ex.v].unit();
const fmtV = v => ex.mode === 'anom' ? sg(v, VARS[ex.v].d) : nf(v, VARS[ex.v].d);
const withUnit = v => fmtV(v) + (exUnit() === '%' ? '%' : ' ' + exUnit());
/* 2071–2100 average per model, in the chart's units */
const exEoc = (m, s) => {
  const b = baseOf(DATA, ex.v, m, ex.bs), f = mean(DATA[ex.v][m][s].slice(56, 86));
  return change(f, b, ex.v, ex.mode);
};
function exBand(s) {
  const ms = sel(), L = ms.map(m => exSeries(m, s));
  const Sx = {}; ms.forEach((m, i) => { Sx[m] = L[i]; });
  return {S: Sx, e: ens(L), dis: disagreement(L, agreeNeed(ms.length))};
}

function announce(text) {
  clearTimeout(announce.t);
  announce.t = setTimeout(() => { $('#chartLiveAnnounce').textContent = text; }, 120);
}

function draw() {
  const el = $('#chart'), tip = $('#tip');
  const W = el.clientWidth || 640, narrow = W < 560;
  const H = Math.round(Math.max(300, Math.min(500, W * .52)));
  const mg = {t: 30, r: narrow ? 98 : 172, b: 32, l: narrow ? 44 : 54};
  const V = VARS[ex.v], ms = sel();
  const svg = d3.select(el).selectAll('svg').data([0]).join('svg').attr('width', W).attr('height', H).attr('aria-hidden', 'true');
  svg.selectAll('*').remove();
  tip.style.display = 'none';
  activeShow = null;
  if (!ms.length) return;

  const B = {ssp245: exBand('ssp245'), ssp585: exBand('ssp585')};
  const vis = Object.keys(SCEN).filter(s => ex.scen.has(s));
  const hist = B.ssp245.e.slice(0, 65).map((d, i) => ({...d, h: B.ssp245.dis[i]}));
  const fut = s => B[s].e.slice(64).map((d, i) => ({...d, h: B[s].dis[i + 64]}));
  const rows = hist.concat(...vis.map(fut)).filter(d => d.min != null);
  let lo = d3.min(rows, d => d.min), hi = d3.max(rows, d => d.max);
  if (ex.ind) ms.forEach(m => ['ssp245', ...vis].forEach(s => B[s].S[m].forEach((v, i) => { if (v == null || (i > 64 && !vis.includes(s))) return; lo = Math.min(lo, v); hi = Math.max(hi, v); })));
  const bars = vis.map(s => { const a = ms.map(m => exEoc(m, s)); return {s, lo: d3.min(a), hi: d3.max(a), m: mid(a)}; });
  bars.forEach(b => { lo = Math.min(lo, b.lo); hi = Math.max(hi, b.hi); });
  if (ex.mode === 'anom') { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  const x = d3.scaleLinear([1950, 2100], [mg.l, W - mg.r]), y = d3.scaleLinear([lo, hi], [H - mg.b, mg.t]).nice();
  const iw = W - mg.l - mg.r, ih = H - mg.b - mg.t;

  svg.append('defs').append('pattern').attr('id', 'hatch-ex').attr('patternUnits', 'userSpaceOnUse').attr('width', 7).attr('height', 7).attr('patternTransform', 'rotate(45)')
    .append('line').attr('class', 'hatch-line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 7);
  svg.append('text').attr('class', 'unit').attr('x', 0).attr('y', 14).text(ex.mode === 'anom' ? `${exUnit()} ${t('changeFrom')} ${period(ex.bs, ex.bs + 29)}` : V.unit());
  svg.append('rect').attr('class', 'basebox').attr('x', x(ex.bs)).attr('y', mg.t).attr('width', x(ex.bs + 29) - x(ex.bs)).attr('height', ih);
  if (!narrow) svg.append('text').attr('class', 'note').attr('x', x(ex.bs) + 5).attr('y', H - mg.b - 8).text(t('baseline'));
  if (vis.length) {
    svg.append('rect').attr('class', 'winbox').attr('x', x(2071)).attr('y', mg.t).attr('width', x(2100) - x(2071)).attr('height', ih);
    svg.append('text').attr('class', 'note').attr('x', x(2071) + 5).attr('y', mg.t + 14).text('2071–2100');
  }
  svg.append('g').attr('class', 'grid').attr('transform', `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(6).tickSize(-iw).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - mg.b})`).call(d3.axisBottom(x).ticks(narrow ? 5 : 8).tickFormat(d3.format('d')).tickSizeOuter(0));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(yTick(ex.mode)).tickSizeOuter(0));
  svg.append('line').attr('class', 'split').attr('x1', x(2014.5)).attr('x2', x(2014.5)).attr('y1', mg.t).attr('y2', H - mg.b);
  svg.append('text').attr('class', 'note').attr('x', x(2014.5) + 6).attr('y', mg.t + 14).text(t('projections'));
  if (ex.mode === 'anom') svg.append('line').attr('class', 'zero').attr('x1', mg.l).attr('x2', W - mg.r).attr('y1', y(0)).attr('y2', y(0));

  const area = d3.area().defined(d => d.min != null).x(d => x(d.y)).y0(d => y(d.min)).y1(d => y(d.max));
  const harea = d3.area().defined(d => d.min != null && d.h).x(d => x(d.y)).y0(d => y(d.min)).y1(d => y(d.max));
  const line = d3.line().defined(d => d.mid != null).x(d => x(d.y)).y(d => y(d.mid));
  const tline = d3.line().defined(d => d.v != null).x(d => x(d.y)).y(d => y(d.v));
  const parts = [{key: 'hist', c: 'var(--hist)', pts: hist, s: 'ssp245', a: 0, b: 65}].concat(vis.map(s => ({key: s, c: SCEN[s].c, pts: fut(s), s, a: 64, b: 151})));
  const showHatch = ex.v === 'pr' && ex.mode === 'anom' && ms.length > 1;

  parts.forEach(p => {
    svg.append('path').datum(p.pts).attr('d', area).style('fill', p.c).style('fill-opacity', p.key === 'hist' ? .16 : .18).style('stroke', p.c).style('stroke-opacity', .4);
    if (showHatch) svg.append('path').datum(p.pts).attr('d', harea).style('fill', 'url(#hatch-ex)');
  });
  if (ex.ind) parts.forEach(p => ms.forEach((m, mi) => {
    svg.append('path').datum(B[p.s].S[m].slice(p.a, p.b).map((v, i) => ({y: 1950 + p.a + i, v})))
      .attr('d', tline).style('fill', 'none').style('stroke', p.c).style('stroke-width', 1.25).style('stroke-dasharray', DASHES[mi % DASHES.length]).style('opacity', .75);
  }));
  parts.forEach(p => svg.append('path').datum(p.pts).attr('d', line).style('fill', 'none').style('stroke', p.c).style('stroke-width', 2.75).style('stroke-linejoin', 'round'));

  /* 2071–2100 bars in the right margin: model range plus the mean, labelled at the mean */
  const bx = s => W - mg.r + 12 + Object.keys(SCEN).indexOf(s) * 13;
  bars.forEach(b => {
    const c = SCEN[b.s].c;
    if (ms.length > 1) svg.append('rect').attr('x', bx(b.s)).attr('y', y(b.hi)).attr('width', 6).attr('height', Math.max(2, y(b.lo) - y(b.hi)))
      .style('fill', c).style('fill-opacity', .35).style('stroke', c).style('stroke-opacity', .6);
    svg.append('line').attr('x1', bx(b.s) - 3).attr('x2', bx(b.s) + 9).attr('y1', y(b.m)).attr('y2', y(b.m)).style('stroke', c).style('stroke-width', 2.5);
  });
  const ends = bars.map(b => ({s: b.s, txt: narrow ? withUnit(b.m) : `${SCEN[b.s].name} ${withUnit(b.m)}`, x: W - mg.r + 12 + 2 * 13 + 4, y: y(b.m) + 4}));
  spread(ends, 17, mg.t + 12, H - mg.b);
  ends.forEach(d => svg.append('text').attr('class', 'endlabel').attr('x', d.x).attr('y', d.y).style('fill', SCEN[d.s].c).text(d.txt));

  if (source === 'sample') svg.append('text').attr('class', 'watermark').attr('x', mg.l + 8).attr('y', mg.t + 34).text(t('synthetic'));

  const fg = svg.append('g').style('display', 'none');
  const vl = fg.append('line').attr('class', 'vline').attr('y1', mg.t).attr('y2', H - mg.b);
  const [minY, maxY] = ex.smooth ? [1955, 2096] : [1950, 2100];

  function show(yr, aria = false) {
    yr = Math.max(minY, Math.min(vis.length ? maxY : 2014, yr));
    const i = yr - 1950;
    const list = yr <= 2014 ? [{n: t('historical'), c: 'var(--hist)', d: B.ssp245.e[i]}] : vis.map(s => ({n: SCEN[s].name, c: SCEN[s].c, d: B[s].e[i]}));
    if (!list.length || list.some(l => l.d.mid == null)) return;
    ex.yr = yr;
    fg.style('display', null);
    vl.attr('x1', x(yr)).attr('x2', x(yr));
    fg.selectAll('circle').data(list).join('circle').attr('cx', x(yr)).attr('cy', d => y(d.d.mid)).attr('r', 4.5).style('fill', d => d.c).style('stroke', 'var(--surface)').style('stroke-width', 1.5);
    const range = l => ms.length > 1 ? ` <span class="muted">(${fmtV(l.d.min)} ${t('to')} ${fmtV(l.d.max)})</span>` : '';
    const note = ms.length > 1 ? (LANG === 'vi' ? `Trung bình ${ms.length} mô hình, biên độ trong ngoặc` : `Average of ${ms.length} models, range in brackets`) : ms[0];
    tip.innerHTML = `<div class="tip-y">${yr}</div>` + list.map(l => `<div class="tip-r"><span class="sw" style="--c:${l.c}"></span>${l.n}: <b>${withUnit(l.d.mid)}</b>${range(l)}</div>`).join('') +
      `<div class="tip-n">${note}${ex.smooth ? ' · ' + t('smooth10').toLowerCase() : ''}</div>`;
    tip.style.display = 'block';
    tip.setAttribute('aria-hidden', 'false');
    const w = tip.offsetWidth, h = tip.offsetHeight, px = x(yr), top = d3.min(list, l => y(l.d.max));
    tip.style.left = (px + 14 + w > W ? Math.max(0, px - w - 14) : px + 14) + 'px';
    tip.style.top = Math.max(mg.t, Math.min(H - mg.b - h, top - h - 10)) + 'px';
    if (aria) announce(`${yr}: ` + list.map(l => `${l.n} ${withUnit(l.d.mid)}` + (ms.length > 1 ? `, ${fmtV(l.d.min)} ${t('to')} ${fmtV(l.d.max)}` : '')).join('; '));
  }
  const hide = () => { fg.style('display', 'none'); tip.style.display = 'none'; tip.setAttribute('aria-hidden', 'true'); };
  activeShow = show;
  activeShow.hide = hide;
  svg.append('rect').attr('x', mg.l).attr('y', mg.t).attr('width', iw).attr('height', ih).attr('fill', 'transparent').style('touch-action', 'pan-y')
    .on('pointermove pointerdown', e => show(Math.round(x.invert(d3.pointer(e)[0]))))
    .on('pointerleave', e => { if (e.pointerType === 'mouse') hide(); });
}

$('#chart').addEventListener('keydown', e => {
  if (!activeShow) return;
  let yr = ex.yr || 2050, handled = true;
  const step = e.shiftKey ? 10 : 1;
  if (e.key === 'ArrowLeft') yr -= step;
  else if (e.key === 'ArrowRight') yr += step;
  else if (e.key === 'Home') yr = 1950;
  else if (e.key === 'End') yr = 2100;
  else if (e.key === 'Escape') { activeShow.hide(); e.preventDefault(); return; }
  else handled = false;
  if (handled) { e.preventDefault(); activeShow(yr, true); }
});
$('#chart').addEventListener('blur', () => { if (activeShow) activeShow.hide(); });

function labels() {
  const V = VARS[ex.v], anom = ex.mode === 'anom', n = sel().length, bp = period(ex.bs, ex.bs + 29);
  const vi = LANG === 'vi', over = placeOver(curRegion());
  $('#blabel').textContent = bp;
  $('#statsHeading').textContent = vi ? `2071–2100 so với ${bp}` : `2071–2100 compared with ${bp}`;
  $('#ctitle').textContent = `${V.long()} ${over}${anom ? `, ${t('changeFrom')} ${bp}` : ''}`;
  $('#chart').setAttribute('aria-label', `${V.long()} ${over}, 1950–2100${anom ? `, ${t('changeFrom')} ${bp}` : ''}`);
  const warn = source === 'sample' ? `<span class="warn">${t('synthetic')}.</span> ` : '';
  const lines = n > 1
    ? (vi ? `Đường là trung vị của ${n} mô hình; vùng tô là biên độ giữa chúng.` : `Lines show the median of ${n} models; shading shows their range.`)
    : (vi ? `Chỉ hiển thị một mô hình, ${sel()[0]}.` : `Showing one model, ${sel()[0]}.`);
  const sm = ex.smooth ? (vi ? ' Làm trơn bằng trung bình 10 năm.' : ' Smoothed with a 10-year average.') : (vi ? ' Giá trị từng năm, không làm trơn.' : ' Annual values, not smoothed.');
  $('#csub').innerHTML = warn + lines + sm;

  const vis = Object.keys(SCEN).filter(s => ex.scen.has(s));
  let lg = `<span><i class="ln" style="--c:var(--hist)"></i><b>${t('historical')}</b> 1950–2014</span>` +
    vis.map(s => `<span><i class="ln" style="--c:${SCEN[s].c}"></i><b>${SCEN[s].name}</b> ${SCEN[s].long()}</span>`).join('');
  if (n > 1) lg += `<span><i class="bandsw"></i>${t('rangeAcross')}</span>`;
  if (vis.length) lg += `<span><i class="eocsw"></i>${n > 1 ? t('eocAvgRange') : t('eocAvg')}</span>`;
  if (ex.v === 'pr' && anom && n > 1) lg += `<span><i class="hatchsw"></i>${vi ? `Ít hơn ${agreeNeed(n)}/${n} mô hình đồng ý về ẩm hơn hay khô hơn` : `Fewer than ${agreeNeed(n)} of ${n} models agree on wetter or drier`}</span>`;
  if (ex.ind) lg += `<span class="models">` + sel().map((m, mi) => `<span><svg aria-hidden="true"><line x1="0" y1="4" x2="24" y2="4" stroke="currentColor" stroke-width="2" stroke-dasharray="${DASHES[mi % DASHES.length]}"/></svg>${m}</span>`).join('') + `</span>`;
  $('#legend').innerHTML = lg;
}

function stats() {
  const box = $('#stats'), ms = sel(), n = ms.length, vi = LANG === 'vi';
  const vis = Object.keys(SCEN).filter(s => ex.scen.has(s));
  if (!vis.length) {
    box.innerHTML = vi ? '<p class="stat-empty"><b>Chưa chọn kịch bản.</b> Hãy chọn SSP2-4.5 hoặc SSP5-8.5 để xem kết quả cuối thế kỷ.</p>'
      : '<p class="stat-empty"><b>No scenario selected.</b> Tick SSP2-4.5 or SSP5-8.5 to see end-of-century results.</p>';
    return;
  }
  box.innerHTML = vis.map(s => {
    const ch = ms.map(m => eoc(DATA, ex.v, m, s, ex.bs));
    const md = mid(ch.map(c => c.d)), mp = mid(ch.map(c => c.p));
    const key = ex.v === 'tas' ? 'd' : 'p', u = ex.v === 'tas' ? ' °C' : '%';
    const lo = d3.min(ch, c => c[key]), hi = d3.max(ch, c => c[key]);
    const up = ch.filter(c => c.d > 0).length;
    let agree;
    if (vi) {
      const w = ex.v === 'tas' ? ['ấm lên', 'lạnh đi'] : ['ẩm hơn', 'khô hơn'];
      agree = up === n ? `Cả ${n} mô hình đều dự tính ${w[0]}.` : up === 0 ? `Cả ${n} mô hình đều dự tính ${w[1]}.` : `${up}/${n} mô hình dự tính ${w[0]}; ${n - up} dự tính ${w[1]}.`;
    } else {
      const w = ex.v === 'tas' ? ['warming', 'cooling'] : ['wetter conditions', 'drier conditions'];
      agree = up === n ? `All ${n} models project ${w[0]}.` : up === 0 ? `All ${n} models project ${w[1]}.` : `${up} of ${n} models project ${w[0]}; ${n - up} ${n - up === 1 ? 'projects' : 'project'} ${w[1]}.`;
    }
    const big = ex.v === 'tas' ? `${sg(md)}<small> °C</small>` : `${sg(mp)}%<small> ${sg(md)} ${t('prUnit')}</small>`;
    const detail = n > 1
      ? (vi ? `Các mô hình dao động từ <b>${sg(lo)}${u}</b> đến <b>${sg(hi)}${u}</b>. ${agree}` : `Models range from <b>${sg(lo)}${u}</b> to <b>${sg(hi)}${u}</b>. ${agree}`)
      : (vi ? 'Chỉ chọn một mô hình nên không có biên độ hay mức đồng thuận.' : 'Only one model is selected, so there is no range or agreement to show.');
    return `<div class="stat"><div class="stat-head"><i class="sw" style="--c:${SCEN[s].c}"></i>${SCEN[s].name} <span class="muted">${SCEN[s].long()}</span></div><div class="big">${big}</div><p>${detail}</p></div>`;
  }).join('');
}

function buildTable() {
  const ms = sel(), V = VARS[ex.v];
  const B = {ssp245: exBand('ssp245'), ssp585: exBand('ssp585')};
  const cell = d => d.mid == null ? '<td>—</td>' : `<td>${fmtV(d.mid)}${ms.length > 1 ? ` <span class="range">(${fmtV(d.min)} ${t('to')} ${fmtV(d.max)})</span>` : ''}</td>`;
  const rows = [1960, 1980, 2000, 2014, 2030, 2050, 2070, 2090].map(yr => {
    const i = yr - 1950, h = yr <= 2014;
    return `<tr><th scope="row">${yr}</th>${h ? cell(B.ssp245.e[i]) : '<td>—</td>'}` +
      Object.keys(SCEN).map(s => !h && ex.scen.has(s) ? cell(B[s].e[i]) : '<td>—</td>').join('') + '</tr>';
  }).join('');
  const what = `${V.long()}${ex.mode === 'anom' ? ' (' + t('changeFrom') + ' ' + period(ex.bs, ex.bs + 29) + ')' : ''}, ${exUnit()}`;
  $('#accessibleTable').innerHTML = `<table class="data-table"><caption class="sr-only">${what}</caption>` +
    `<thead><tr><th scope="col">${t('year')}</th><th scope="col">${t('historical')}</th><th scope="col">SSP2-4.5</th><th scope="col">SSP5-8.5</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function render() { labels(); draw(); stats(); buildTable(); drawExMap(); }

/* ---------- explorer region map ---------- */
const exMap = ZoneMap($('#exMap'));
const curRegion = () => source === 'real' && REG ? ex.region : 'vn';
function buildRegionSelect() {
  if (!REG) return;
  $('#region').innerHTML = `<option value="vn">${t('allVn')}</option>` + zoneIds().map(z => `<option value="${z}">${zoneName(z)}</option>`).join('');
  $('#region').value = curRegion();
}
function setRegion(id) {
  if (source !== 'real' || !REG || id === ex.region) return;
  ex.region = id;
  $('#region').value = id;
  DATA = id === 'vn' ? REAL : REG.regions[id];
  render();
}
$('#region').addEventListener('change', e => setRegion(e.target.value));
function drawExMap() {
  if (!REG || !TOPO) { $('#regionCtl').hidden = true; return; }
  const real = source === 'real', vi = LANG === 'vi', ms = sel();
  const s = ex.scen.has('ssp585') ? 'ssp585' : ex.scen.has('ssp245') ? 'ssp245' : null;
  $('#region').disabled = !real;
  const val = id => mid(ms.map(m => { const c = eoc(id === 'vn' ? REAL : REG.regions[id], ex.v, m, s, ex.bs); return ex.v === 'tas' ? c.d : c.p; }));
  const scale = ex.v === 'tas' ? stripeColor : prColor;
  const fv = v => ex.v === 'tas' ? `${sg(v)} °C` : `${sg(v)}%`;
  const colour = real && s && ms.length;
  exMap.render({
    fill: id => colour ? scale(val(id)) : 'var(--nodata)',
    selected: real ? ex.region : null,
    onPick: real ? setRegion : null,
    title: id => colour ? `${zoneName(id)}: ${fv(val(id))}` : zoneName(id)
  });
  const key = $('#exMapKey');
  key.hidden = !colour;
  if (colour) {
    if (ex.v === 'tas') rampKey(key, stripeColor, [0, 1, 2, 3, 4], v => v === 0 ? '0' : v === 4 ? `${fmt('+')(v)}&nbsp;°C` : fmt('+')(v));
    else rampKey(key, prColor, [-20, -10, 0, 10, 20], v => v === 0 ? '0' : `${fmt('+')(v)}%`);
  }
  const bp = period(ex.bs, ex.bs + 29), what = ex.v === 'tas' ? (vi ? 'nhiệt độ' : 'temperature') : (vi ? 'lượng mưa' : 'rainfall');
  $('#regionNote').textContent = !real ? t('regionOnlyReal')
    : !s ? (vi ? 'Chọn một kịch bản để tô màu bản đồ.' : 'Tick a scenario to colour the map.')
    : vi ? `Màu: thay đổi ${what} 2071–2100 so với ${bp}, ${SCEN[s].name}, trung vị ${ms.length} mô hình. Bấm vào một vùng để xem biểu đồ của vùng đó.`
    : `Colour: ${what} change by 2071–2100 from ${bp}, ${SCEN[s].name}, median of ${ms.length} models. Click a zone to chart it.`;
}
