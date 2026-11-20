'use strict';
/* Hà Nội page: the loaded data and the statistics the copy and charts are built from. */

let HN = null;

const median = a => d3.median(a);
/* models that have indicator k (temperature indicators need a model with temperature) */
const modelsFor = k => Object.entries(HN.models).filter(([, r]) => IND[k].kind === 'r' || r.temperature).map(([m]) => m);
/* each model's value of k at level lv ('base' = its own 1995–2014), as change if mode is 'anom' */
function valuesAt(k, lv, mode = 'abs') {
  const out = [];
  for (const m of modelsFor(k)) {
    const r = HN.models[m], b = r.base[k];
    const v = lv === 'base' ? b : r.levels[lv] && r.levels[lv][k];
    if (v == null || b == null) continue;
    out.push({m, v: mode === 'abs' ? v : IND[k].change === 'pct' ? (v - b) / b * 100 : v - b});
  }
  return out;
}
function stat(list) {
  const v = list.map(d => d.v);
  return v.length ? {n: v.length, med: median(v), min: d3.min(v), max: d3.max(v),
    up: v.filter(x => x > 0).length, down: v.filter(x => x < 0).length} : {n: 0};
}
/* first and last day of the year whose share of 35 °C highs reaches p */
function season(cal, p = 0.1) {
  if (!cal) return null;
  const i0 = cal.findIndex(x => x >= p), i1 = cal.length - 1 - [...cal].reverse().findIndex(x => x >= p);
  return i0 < 0 ? null : {a: i0, b: i1, days: i1 - i0 + 1};
}
const doyDate = i => new Date(Date.UTC(2001, 0, 1 + i));

function hnFacts() {
  const O = HN.obs, yrs = O.years;
  const ix = (a, b) => yrs.map((y, i) => (y >= a && y <= b) ? i : -1).filter(i => i >= 0);
  const avg = (k, a, b) => mean(ix(a, b).map(i => O[k][i]));
  const hotMax = d3.max(O.tx35), hotYear = yrs[O.tx35.indexOf(hotMax)];
  const L = {};
  for (const lv of ['base', ...LEVELS]) {
    L[lv] = {};
    for (const k of Object.keys(IND)) {
      L[lv][k] = {abs: stat(valuesAt(k, lv, 'abs')), anom: stat(valuesAt(k, lv, 'anom'))};
    }
  }
  /* +2 °C central years by scenario, and how many models never get there in time */
  const when = {};
  for (const r of SSP_ROWS) {
    const w = HN.when[r.s];
    if (!w) continue;
    when[r.s] = {};
    for (const lv of LEVELS) {
      const ys = (w[lv] || []).map(d => d.y);
      when[r.s][lv] = {n: w.n, reached: ys.length, med: ys.length ? Math.round(median(ys)) : null, min: d3.min(ys), max: d3.max(ys)};
    }
  }
  const tModels = Object.values(HN.models).filter(r => r.temperature);
  const trends = k => tModels.map(r => r.trend[k]).filter(x => x != null);
  return {
    O, L, when,
    nT: tModels.length, nR: Object.keys(HN.models).length, total: HN.meta.models_total,
    dataset: HN.meta.cmip6vn_models, names: Object.keys(HN.models).sort(),
    qc: Object.entries(HN.models).map(([m, r]) => ({m, bad: Object.entries(r.qc || {}).filter(([, q]) => q.bad.length).map(([e, q]) => ({e, vars: q.bad}))})).filter(d => d.bad.length),
    baseMed: k => median(valuesAt(k, 'base').map(d => d.v)),
    relabel: Object.entries(HN.models).filter(([, r]) => r.run_paper && r.run_paper !== r.run).map(([m]) => m).sort(),
    early: {tx35: avg('tx35', 1980, 1994), tas: avg('tas', 1980, 1994)},
    late: {tx35: avg('tx35', 1995, 2014), tas: avg('tas', 1995, 2014)},
    hotMax, hotYear,
    obsTrend: O.trend,
    trend: {tas: trends('tas'), tx35: trends('tx35')},
    cal: {obs: season(HN.calendar.obs), ...Object.fromEntries(LEVELS.map(lv => [lv, season(HN.calendar[lv])]))},
    gw0: HN.meta.baseline_global_warming
  };
}
