'use strict';
/* Data: the synthetic sample, series helpers, ensemble statistics and the upload check. */

/* ---------- synthetic sample data ---------- */
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function gauss(r){return Math.sqrt(-2*Math.log(r()||1e-9))*Math.cos(2*Math.PI*r())}
function synth(){
  const M = {'CESM2':{s:1.15,o:.3,po:8,pc:.10}, 'GFDL-ESM4':{s:.85,o:-.2,po:-10,pc:.03}, 'MPI-ESM1-2-LR':{s:.95,o:.1,po:14,pc:.13}, 'MIROC6':{s:.75,o:-.4,po:-4,pc:-.06}};
  const out = {tas: {}, pr: {}}; let k = 1;
  for (const [m, c] of Object.entries(M)) for (const v of ['tas', 'pr']) {
    const r = rng(k++ * 7919), sd = v === 'tas' ? .22 : 6.5, base = v === 'tas' ? 24.2 + c.o : 150 + c.po;
    const gen = fn => { let n = 0; return fn.map(f => base + f + (n = .4 * n + sd * gauss(r))).map(x => +x.toFixed(2)); };
    const yrs = (a, b) => Array.from({length: b - a + 1}, (_, i) => a + i);
    const hist = gen(yrs(1950, 2014).map(y => v === 'tas' ? .9 * c.s * ((y - 1950) / 64) ** 1.8 : 0));
    const fut = k2 => gen(yrs(2015, 2100).map(y => { const f = (y - 2014) / 86;
      return v === 'tas' ? .9 * c.s + (k2 ? 3.6 : 1.9) * c.s * f ** (k2 ? 1.5 : 1.1) : base * c.pc * (k2 ? 1 : .5) * f ** 1.2; }));
    out[v][m] = {historical: hist, ssp245: fut(0), ssp585: fut(1)};
  }
  return out;
}

/* ---------- data helpers ---------- */
const modelsOf = D => Object.keys(D.tas);
const full = (D, v, m, s) => D[v][m].historical.concat(D[v][m][s]);
const baseOf = (D, v, m, bs) => mean(D[v][m].historical.slice(bs - 1950, bs - 1950 + 30));
/* centred 10-year mean; null where the window would run off either end */
const smoothC = a => a.map((_, i) => (i < 5 || i + 5 > a.length) ? null : mean(a.slice(i - 5, i + 5)));
/* the ensemble's central value is the median: with five models, one or two fast-warming ones
   would pull a mean up */
const mid = a => d3.median(a);
function ens(list) {
  return d3.range(N_YEARS).map(i => {
    const v = list.map(a => a[i]);
    if (!v.length || v.some(q => q == null)) return {y: 1950 + i, mid: null, min: null, max: null};
    return {y: 1950 + i, mid: mid(v), min: d3.min(v), max: d3.max(v)};
  });
}
const agreeNeed = n => Math.max(1, Math.ceil(n * 0.8));
/* true where fewer than `need` models share a sign */
function disagreement(list, need) {
  return d3.range(N_YEARS).map(i => {
    const v = list.map(a => a[i]);
    if (!v.length || v.some(q => q == null)) return false;
    const pos = v.filter(q => q > 0).length, neg = v.filter(q => q < 0).length;
    return Math.max(pos, neg) < need;
  });
}
function eoc(D, v, m, s, bs) {
  const b = baseOf(D, v, m, bs), f = mean(D[v][m][s].slice(56, 86));
  return {d: f - b, p: (f - b) / b * 100};
}
/* spread labels so none sit closer than `gap` px */
function spread(items, gap, lo, hi) {
  items.sort((a, b) => a.y - b.y);
  for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < gap) items[i].y = items[i - 1].y + gap;
  const over = items.length ? items[items.length - 1].y - hi : 0;
  if (over > 0) items.forEach(it => { it.y -= over; });
  if (items.length && items[0].y < lo) { const d = lo - items[0].y; items.forEach(it => { it.y += d; }); }
  return items;
}
/* change from baseline: °C for temperature, % for rainfall */
const change = (q, b, v, mode) => mode !== 'anom' ? q : v === 'pr' ? (q - b) / b * 100 : q - b;

function checkData(d) {
  const vi = LANG === 'vi';
  if (!d || typeof d !== 'object' || !d.tas || !d.pr || !Object.keys(d.tas).length || !Object.keys(d.pr).length)
    throw new Error(vi ? 'Tệp cần có cả "tas" (nhiệt độ) và "pr" (lượng mưa).' : 'The file needs both "tas" (temperature) and "pr" (rainfall).');
  for (const [a, b] of [['tas', 'pr'], ['pr', 'tas']])
    for (const m of Object.keys(d[a])) if (!d[b][m]) throw new Error(vi ? `Mô hình "${m}" có trong "${a}" nhưng không có trong "${b}".` : `Model "${m}" appears under "${a}" but not "${b}".`);
  for (const v of ['tas', 'pr']) for (const [m, o] of Object.entries(d[v])) {
    const need = {historical: 65, ssp245: 86, ssp585: 86};
    for (const [s, n] of Object.entries(need)) {
      const arr = o && o[s], yrs = s === 'historical' ? '1950–2014' : '2015–2100', have = Array.isArray(arr) ? arr.length : 0;
      if (!Array.isArray(arr) || arr.length !== n)
        throw new Error(vi ? `${v} / ${m} / ${s} cần ${n} giá trị (${yrs}) nhưng có ${have}.` : `${v} / ${m} / ${s} needs ${n} values (${yrs}) but has ${have}.`);
      if (arr.some(x => typeof x !== 'number' || !isFinite(x))) throw new Error(vi ? `${v} / ${m} / ${s} có một giá trị không phải là số.` : `${v} / ${m} / ${s} contains a value that isn't a number.`);
    }
  }
}
