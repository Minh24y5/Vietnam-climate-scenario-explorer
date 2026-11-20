'use strict';
/* The pinned scroll-story line chart and its steps. */

/* ---------- story chart ---------- */
const STEPS = {
  'tas-abs':  {v: 'tas', mode: 'abs',  end: 2014, models: true, mlabels: true, scen: []},
  'tas-anom': {v: 'tas', mode: 'anom', end: 2014, models: true, mlabels: false, scen: [], base: true, span: true},
  'tas-245':  {v: 'tas', mode: 'anom', end: 2100, hist: true, scen: ['ssp245'], base: true},
  'tas-585':  {v: 'tas', mode: 'anom', end: 2100, hist: true, scen: ['ssp245', 'ssp585'], base: true, win: true},
  'pr-abs':   {v: 'pr',  mode: 'abs',  end: 2014, models: true, mlabels: true, scen: []},
  'pr-agree': {v: 'pr',  mode: 'anom', end: 2100, hist: true, scen: ['ssp245', 'ssp585'], base: true, win: true, hatch: true},
  'pr-hatch': {v: 'pr',  mode: 'anom', end: 2100, hist: true, scen: ['ssp245', 'ssp585'], base: true, win: true, hatch: true}
};
const STEP_TITLES = {
  vi: {
    'tas-abs': 'Nhiệt độ trung bình 10 năm của từng mô hình cho Việt Nam, 1950 đến 2014, tính bằng độ C.',
    'tas-anom': 'Các đường mô hình ấy, thể hiện dưới dạng thay đổi so với trung bình 1985–2014 của chính mỗi mô hình.',
    'tas-245': 'Thay đổi nhiệt độ so với 1985–2014: lịch sử và dự tính SSP2-4.5 đến 2100.',
    'tas-585': 'Thay đổi nhiệt độ so với 1985–2014 theo SSP2-4.5 và SSP5-8.5 đến 2100, tô giai đoạn 2071–2100.',
    'pr-abs': 'Lượng mưa trung bình tháng, trung bình 10 năm của từng mô hình cho Việt Nam, 1950 đến 2014, tính bằng milimét.',
    'pr-agree': 'Thay đổi lượng mưa so với 1985–2014 theo cả hai kịch bản, gạch chéo nơi các mô hình bất đồng về ẩm hơn hay khô hơn.',
    'pr-hatch': 'Thay đổi lượng mưa so với 1985–2014 theo cả hai kịch bản, gạch chéo nơi các mô hình bất đồng về ẩm hơn hay khô hơn.'
  },
  en: {
    'tas-abs': 'Each model\'s 10-year average temperature for Vietnam, 1950 to 2014, in degrees Celsius.',
    'tas-anom': 'The same model lines shown as change from each model\'s 1985–2014 average.',
    'tas-245': 'Temperature change from 1985–2014, history and the SSP2-4.5 projection to 2100.',
    'tas-585': 'Temperature change from 1985–2014 under SSP2-4.5 and SSP5-8.5 to 2100, with 2071–2100 shaded.',
    'pr-abs': 'Each model\'s 10-year average monthly rainfall for Vietnam, 1950 to 2014, in millimetres.',
    'pr-agree': 'Rainfall change from 1985–2014 under both scenarios, hatched where models disagree on wetter or drier.',
    'pr-hatch': 'Rainfall change from 1985–2014 under both scenarios, hatched where models disagree on wetter or drier.'
  }
};

function StoryChart(el) {
  const svg = d3.select(el).append('svg').attr('aria-hidden', 'true');
  const defs = svg.append('defs');
  defs.append('pattern').attr('id', 'hatch-story').attr('patternUnits', 'userSpaceOnUse').attr('width', 7).attr('height', 7).attr('patternTransform', 'rotate(45)')
    .append('line').attr('class', 'hatch-line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 7);
  const clip = {};
  for (const s of Object.keys(SCEN)) clip[s] = defs.append('clipPath').attr('id', `clip-story-${s}`).append('rect').attr('y', 0);
  const G = {};
  for (const k of ['base', 'win', 'grid', 'x', 'y', 'zero', 'split', 'band', 'hatch', 'models', 'lines', 'labels', 'notes']) G[k] = svg.append('g');
  G.grid.attr('class', 'grid'); G.x.attr('class', 'axis'); G.y.attr('class', 'axis');
  const unit = svg.append('text').attr('class', 'unit').attr('x', 0).attr('y', 14);
  const baseRect = G.base.append('rect').attr('class', 'basebox').style('opacity', 0);
  const baseTxt = G.notes.append('text').attr('class', 'note').style('opacity', 0);
  const winRect = G.win.append('rect').attr('class', 'winbox').style('opacity', 0);
  const winTxt = G.notes.append('text').attr('class', 'note').text('2071–2100').style('opacity', 0);
  const zero = G.zero.append('line').attr('class', 'zero').style('opacity', 0);
  const split = G.split.append('line').attr('class', 'split').style('opacity', 0);
  const projTxt = G.notes.append('text').attr('class', 'note').style('opacity', 0);
  const parts = ['hist', ...Object.keys(SCEN)];
  const band = {}, line = {}, hatch = {};
  for (const p of parts) {
    const c = p === 'hist' ? 'var(--hist)' : SCEN[p].c;
    band[p] = G.band.append('path').style('fill', c).style('fill-opacity', p === 'hist' ? .16 : .18).style('stroke', c).style('stroke-opacity', .4).style('opacity', 0);
    hatch[p] = G.hatch.append('path').style('fill', 'url(#hatch-story)').style('opacity', 0);
    line[p] = G.lines.append('path').style('fill', 'none').style('stroke', c).style('stroke-width', 2.75).style('stroke-linejoin', 'round').style('opacity', 0);
    if (p !== 'hist') { band[p].attr('clip-path', `url(#clip-story-${p})`); hatch[p].attr('clip-path', `url(#clip-story-${p})`); line[p].attr('clip-path', `url(#clip-story-${p})`); }
  }
  let D = null, F = null, cur = null, key = null;

  function compute(st) {
    const ms = modelsOf(D);
    const ser = (m, s) => { const b = baseOf(D, st.v, m, 1985); return smoothC(full(D, st.v, m, s).map(q => change(q, b, st.v, st.mode))); };
    const models = ms.map((m, mi) => ({m, mi, pts: ser(m, 'ssp245').slice(0, 65).map((v, i) => ({y: 1950 + i, v}))}));
    const E = {};
    for (const s of Object.keys(SCEN)) { const L = ms.map(m => ser(m, s)); E[s] = {e: ens(L), dis: disagreement(L, agreeNeed(ms.length))}; }
    return {models, E};
  }

  function render(k, animate = true) {
    const st = STEPS[k];
    if (!st || !D) return;
    const prev = cur; cur = st; key = k;
    el.setAttribute('aria-label', STEP_TITLES[LANG][k]);
    baseTxt.text(t('baseline')); projTxt.text(t('projections'));
    const W = el.clientWidth || 600, narrow = W < 560;
    /* legend first: its height decides the chart's height */
    let lg = '';
    if (st.models) lg += `<span><i class="ln" style="--c:var(--hist)"></i>${t('perModel')}</span>`;
    if (st.hist) lg += `<span><i class="ln" style="--c:var(--hist)"></i>${t('historical')}</span>`;
    st.scen.forEach(s => { lg += `<span><i class="ln" style="--c:${SCEN[s].c}"></i>${SCEN[s].name}${narrow ? '' : ', ' + SCEN[s].long()}</span>`; });
    if (st.scen.length) lg += `<span><i class="bandsw"></i>${t('rangeAcross')}</span><span><i class="eocsw"></i>${t('eocAvgRange')}</span>`;
    if (st.base && narrow) lg += `<span><i class="basesw"></i>${t('baseLegend')}</span>`;
    if (st.hatch) lg += `<span><i class="hatchsw"></i>${t('disagree')}</span>`;
    $('#storyLegend').innerHTML = lg;
    const H = Math.max(240, el.clientHeight || 400);
    const mg = {t: 32, r: narrow ? 96 : 166, b: 30, l: narrow ? 40 : 50};
    /* 2071–2100 per-model change in chart units, for the margin bars */
    const eocOf = s => st.v === 'tas' ? F.t[s] : F.p[s];
    svg.attr('width', W).attr('height', H);
    const data = compute(st);
    const motion = animate && prev && !reduceMotion.matches;
    const dur = motion ? 750 : 0;
    if (animate && prev && reduceMotion.matches) {
      const fr = el.closest('.story-frame'); fr.classList.add('fading'); setTimeout(() => fr.classList.remove('fading'), 160);
    }
    const vchange = !prev || prev.v !== st.v;
    const tr = svg.transition('story').duration(dur).ease(d3.easeCubicInOut);

    /* scales */
    const vals = [];
    if (st.models) data.models.forEach(d => d.pts.forEach(p => { if (p.v != null) vals.push(p.v); }));
    if (st.hist) data.E.ssp245.e.slice(0, 65).forEach(p => { if (p.min != null) vals.push(p.min, p.max); });
    st.scen.forEach(s => data.E[s].e.slice(64).forEach(p => { if (p.min != null) vals.push(p.min, p.max); }));
    st.scen.forEach(s => vals.push(...eocOf(s)));
    if (st.mode === 'anom') vals.push(0);
    let [lo, hi] = d3.extent(vals); const pad = (hi - lo) * .06 || 1; lo -= pad; hi += pad;
    if (st.span) {
      /* keep the absolute view's vertical span so the lines visibly collapse */
      const av = [];
      compute({...st, mode: 'abs'}).models.forEach(d => d.pts.forEach(p => { if (p.v != null) av.push(p.v); }));
      const half = (d3.max(av) - d3.min(av)) / 2 * 1.06;
      lo = Math.min(lo, -half); hi = Math.max(hi, half);
    }
    const x = d3.scaleLinear([1950, st.end], [mg.l, W - mg.r]);
    const y = d3.scaleLinear([lo, hi], [H - mg.b, mg.t]).nice();
    const V = VARS[st.v];
    unit.text(st.mode === 'anom' ? `${st.v === 'pr' ? '%' : V.unit()} ${t('changeFrom')} 1985–2014` : V.unit());

    G.grid.attr('transform', `translate(${mg.l},0)`).transition(tr).call(d3.axisLeft(y).ticks(6).tickSize(-(W - mg.l - mg.r)).tickFormat(''));
    G.x.attr('transform', `translate(0,${H - mg.b})`).transition(tr).call(d3.axisBottom(x).ticks(narrow ? 4 : 7).tickFormat(d3.format('d')).tickSizeOuter(0));
    G.y.attr('transform', `translate(${mg.l},0)`).transition(tr).call(d3.axisLeft(y).ticks(6).tickFormat(yTick(st.mode)).tickSizeOuter(0));

    /* reference marks */
    const ih = H - mg.b - mg.t;
    baseRect.transition(tr).attr('x', x(1985)).attr('y', mg.t).attr('width', Math.max(0, x(2014) - x(1985))).attr('height', ih).style('opacity', st.base ? 1 : 0);
    baseTxt.transition(tr).attr('x', x(1985) + 5).attr('y', H - mg.b - 8).style('opacity', st.base && st.end === 2100 && !narrow ? 1 : 0);
    winRect.transition(tr).attr('x', x(2071)).attr('y', mg.t).attr('width', Math.max(0, x(2100) - x(2071))).attr('height', ih).style('opacity', st.win ? 1 : 0);
    winTxt.transition(tr).attr('x', x(2071) + 5).attr('y', mg.t + 14).style('opacity', st.win ? 1 : 0);
    zero.transition(tr).attr('x1', mg.l).attr('x2', W - mg.r).attr('y1', y(0)).attr('y2', y(0)).style('opacity', st.mode === 'anom' ? 1 : 0);
    split.transition(tr).attr('x1', x(2014.5)).attr('x2', x(2014.5)).attr('y1', mg.t).attr('y2', H - mg.b).style('opacity', st.end === 2100 ? 1 : 0);
    projTxt.transition(tr).attr('x', x(2014.5) + 6).attr('y', mg.t + 14).style('opacity', st.end === 2100 ? 1 : 0);

    /* model lines */
    const mline = d3.line().defined(d => d.v != null).x(d => x(d.y)).y(d => y(d.v));
    const ml = G.models.selectAll('path').data(data.models, d => d.m).join(
      enter => enter.append('path').style('fill', 'none').style('stroke', 'var(--hist)').style('stroke-width', 1.75)
        .style('stroke-dasharray', d => DASHES[d.mi % DASHES.length]).style('opacity', 0).attr('d', d => mline(d.pts))
    );
    if (vchange && !st.models) ml.transition(tr).style('opacity', 0).on('end', function (d) { d3.select(this).attr('d', mline(d.pts)); });
    else {
      if (vchange) ml.interrupt().attr('d', d => mline(d.pts)).style('opacity', 0);
      ml.transition(tr).attr('d', d => mline(d.pts)).style('opacity', st.models ? .9 : 0);
    }

    /* model labels */
    const showML = st.models && st.mlabels && !narrow;
    let labs = [];
    if (showML) {
      labs = data.models.map(d => { const lp = d.pts.filter(p => p.v != null).pop(); return {k: d.m, txt: d.m, x: x(lp.y) + 8, y: y(lp.v) + 4}; });
      spread(labs, 15, mg.t, H - mg.b);
    }
    G.labels.selectAll('text.model').data(labs, d => d.k).join(
      enter => enter.append('text').attr('class', 'endlabel model').attr('x', d => d.x).attr('y', d => d.y).style('opacity', 0).text(d => d.txt),
      update => update,
      exit => exit.transition(tr).style('opacity', 0).remove()
    ).transition(tr).attr('x', d => d.x).attr('y', d => d.y).style('opacity', 1);

    /* ensemble: history and scenarios */
    const area = d3.area().defined(d => d.min != null).x(d => x(d.y)).y0(d => y(d.min)).y1(d => y(d.max));
    const eline = d3.line().defined(d => d.mean != null).x(d => x(d.y)).y(d => y(d.mean));
    const harea = d3.area().defined(d => d.min != null && d.h).x(d => x(d.y)).y0(d => y(d.min)).y1(d => y(d.max));
    const seg = p => p === 'hist'
      ? data.E.ssp245.e.slice(0, 65).map((d, i) => ({...d, h: data.E.ssp245.dis[i]}))
      : data.E[p].e.slice(64).map((d, i) => ({...d, h: data.E[p].dis[i + 64]}));
    for (const p of parts) {
      const on = p === 'hist' ? !!st.hist : st.scen.includes(p);
      const was = prev && (p === 'hist' ? !!prev.hist : prev.scen.includes(p));
      const pts = seg(p);
      const els = [[band[p], area(pts)], [line[p], eline(pts)], [hatch[p], harea(pts)]];
      const hOn = on && st.hatch;
      if (vchange && !on) {
        /* fade out in place, then swap to the new variable while hidden */
        els.forEach(([e, d]) => e.transition(tr).style('opacity', 0).on('end', () => e.attr('d', d)));
      } else {
        if ((on && !was) || vchange) els.forEach(([e, d]) => e.interrupt().attr('d', d).style('opacity', 0));
        els.forEach(([e, d]) => e.transition(tr).attr('d', d));
        band[p].transition(tr).style('opacity', on ? 1 : 0);
        line[p].transition(tr).style('opacity', on ? 1 : 0);
        hatch[p].transition(tr).style('opacity', hOn ? 1 : 0);
      }
      if (p !== 'hist') {
        const r = clip[p].attr('height', H).attr('x', 0);
        const fullW = W, startW = x(2014.5);
        if (on && !was && motion) r.interrupt().attr('width', startW).transition('reveal').delay(dur * .6).duration(900).ease(d3.easeCubicInOut).attr('width', fullW);
        else if (on) r.interrupt('reveal').attr('width', fullW);
      }
    }

    /* 2071–2100 bars in the right margin: model range plus the mean, labelled at the mean */
    const bx = s => W - mg.r + 12 + Object.keys(SCEN).indexOf(s) * 13;
    const bars = st.scen.map(s => { const a = eocOf(s); return {k: s, c: SCEN[s].c, x: bx(s), lo: d3.min(a), hi: d3.max(a), m: mean(a)}; });
    const bsel = G.labels.selectAll('g.eoc').data(bars, d => d.k).join(
      enter => { const g = enter.append('g').attr('class', 'eoc').style('opacity', 0);
        g.append('rect').attr('width', 6); g.append('line').style('stroke-width', 2.5); return g; },
      update => update,
      exit => exit.transition(tr).style('opacity', 0).remove()
    );
    bsel.select('rect').style('fill', d => d.c).style('fill-opacity', .35).style('stroke', d => d.c).style('stroke-opacity', .6);
    bsel.select('line').style('stroke', d => d.c);
    bsel.transition(tr).delay(motion ? 500 : 0).style('opacity', 1);
    bsel.select('rect').transition(tr).attr('x', d => d.x).attr('y', d => y(d.hi)).attr('height', d => Math.max(2, y(d.lo) - y(d.hi)));
    bsel.select('line').transition(tr).attr('x1', d => d.x - 3).attr('x2', d => d.x + 9).attr('y1', d => y(d.m)).attr('y2', d => y(d.m));
    const sl = bars.map(b => {
      const val = st.v === 'tas' ? `${sg(b.m)} °C` : `${sg(b.m)}%`;
      return {k: b.k, txt: narrow ? val : `${SCEN[b.k].name} ${val}`, c: b.c, x: W - mg.r + 12 + 2 * 13 + 4, y: y(b.m) + 4};
    });
    spread(sl, 17, mg.t + 12, H - mg.b);
    G.labels.selectAll('text.scen').data(sl, d => d.k).join(
      enter => enter.append('text').attr('class', 'endlabel scen').style('opacity', 0).attr('x', d => d.x).attr('y', d => d.y),
      update => update,
      exit => exit.transition(tr).style('opacity', 0).remove()
    ).text(d => d.txt).style('fill', d => d.c)
      .transition(tr).delay(motion ? 500 : 0).attr('x', d => d.x).attr('y', d => d.y).style('opacity', 1);
  }

  return {
    setData(d) { D = d; F = facts(d); },
    render,
    redraw() { if (key) { const k = key; cur = null; render(k, false); } }
  };
}
