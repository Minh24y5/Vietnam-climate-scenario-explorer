const $ = s => document.querySelector(s);
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const SCEN = {ssp245: {name: 'SSP2-4.5', c: 'var(--s245)'}, ssp585: {name: 'SSP5-8.5', c: 'var(--s585)'}};
const VARS = {tas: {name: 'Annual mean temperature', unit: '°C', d: 2}, pr: {name: 'Mean monthly rainfall', unit: 'mm/month', d: 1}};

/* ---------- synthetic placeholder data (replace by loading your JSON) ---------- */
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

/* ---------- state ---------- */
let DATA = synth();
const st = {v: 'tas', mode: 'abs', scen: new Set(['ssp245', 'ssp585']), models: new Set(Object.keys(DATA.tas)), bs: 1985, ind: false, smooth: true};
const sel = () => Object.keys(DATA.tas).filter(m => st.models.has(m));
const fmt = (x, d, sign) => d3.format((sign ? '+' : '') + '.' + d + 'f')(x);

function series(m, s) {
  const d = DATA[st.v][m], a = d.historical.concat(d[s]);
  const b = st.mode === 'anom' ? mean(d.historical.slice(st.bs - 1950, st.bs - 1950 + 30)) : 0;
  const x = a.map(q => q - b);
  return st.smooth ? x.map((_, i) => mean(x.slice(Math.max(0, i - 9), i + 1))) : x;
}
function band(s) {
  const S = {}; sel().forEach(m => S[m] = series(m, s));
  const out = d3.range(151).map(i => { const v = Object.values(S).map(a => a[i]); return {y: 1950 + i, mean: mean(v), min: d3.min(v), max: d3.max(v)}; });
  return {S, out};
}

/* ---------- chart ---------- */
function draw() {
  const el = $('#chart'), tip = $('#tip'), W = el.clientWidth || 600, H = Math.round(Math.max(300, Math.min(480, W * .56)));
  const mg = {t: 14, r: W < 500 ? 10 : 18, b: 32, l: W < 500 ? 42 : 52}, V = VARS[st.v], ms = sel();
  const svg = d3.select(el).selectAll('svg').data([0]).join('svg').attr('width', W).attr('height', H);
  svg.selectAll('*').remove(); tip.style.display = 'none';
  if (!ms.length) { svg.append('text').attr('x', W / 2).attr('y', H / 2).attr('text-anchor', 'middle').attr('class', 'note').text('Select at least one model.'); return; }

  const B = {ssp245: band('ssp245'), ssp585: band('ssp585')}, vis = Object.keys(SCEN).filter(s => st.scen.has(s));
  const rows = B.ssp245.out.slice(0, 65).concat(...vis.map(s => B[s].out.slice(65)));
  let lo = d3.min(rows, d => d.min), hi = d3.max(rows, d => d.max);
  if (st.mode === 'anom') { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  const x = d3.scaleLinear([1950, 2100], [mg.l, W - mg.r]), y = d3.scaleLinear([lo, hi], [H - mg.b, mg.t]).nice();
  const iw = W - mg.l - mg.r, ih = H - mg.b - mg.t;

  svg.append('rect').attr('class', 'basebox').attr('x', x(st.bs)).attr('y', mg.t).attr('width', x(st.bs + 29) - x(st.bs)).attr('height', ih);
  svg.append('text').attr('class', 'note').attr('x', x(st.bs) + 4).attr('y', mg.t + 12).text('baseline');
  svg.append('g').attr('class', 'grid').attr('transform', `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(6).tickSize(-iw).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - mg.b})`).call(d3.axisBottom(x).ticks(W < 500 ? 5 : 8).tickFormat(d3.format('d')));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(6));
  svg.append('line').attr('class', 'split').attr('x1', x(2014.5)).attr('x2', x(2014.5)).attr('y1', mg.t).attr('y2', H - mg.b);
  svg.append('text').attr('class', 'note').attr('x', x(2014.5) + 5).attr('y', H - mg.b - 6).text('projections');
  if (st.mode === 'anom') svg.append('line').attr('class', 'zero').attr('x1', mg.l).attr('x2', W - mg.r).attr('y1', y(0)).attr('y2', y(0));

  const area = d3.area().x(d => x(d.y)).y0(d => y(d.min)).y1(d => y(d.max)), line = d3.line().x(d => x(d.y)).y(d => y(d.mean));
  const parts = [{key: 'historical', c: 'var(--hist)', out: B.ssp245.out.slice(0, 65), S: B.ssp245.S, a: 0, b: 65}]
    .concat(vis.map(s => ({key: s, c: SCEN[s].c, out: B[s].out.slice(64), S: B[s].S, a: 64, b: 151})));
  parts.forEach(p => {
    svg.append('path').datum(p.out).attr('d', area).style('fill', p.c).style('fill-opacity', .2);
    if (st.ind) ms.forEach(m => svg.append('path').datum(p.S[m].slice(p.a, p.b).map((v, i) => ({y: 1950 + p.a + i, mean: v})))
      .attr('d', line).style('fill', 'none').style('stroke', p.c).style('stroke-width', 1).style('opacity', .55));
  });
  parts.forEach(p => svg.append('path').datum(p.out).attr('d', line).style('fill', 'none').style('stroke', p.c).style('stroke-width', 3).style('stroke-linejoin', 'round'));

  const fg = svg.append('g').style('display', 'none'), vl = fg.append('line').attr('class', 'vline').attr('y1', mg.t).attr('y2', H - mg.b);
  const sg = d => (st.mode === 'anom' && d > 0 ? '+' : '') + fmt(d, V.d);
  function show(yr) {
    const i = yr - 1950, list = yr <= 2014 ? [{n: 'Historical', c: 'var(--hist)', d: B.ssp245.out[i]}] : vis.map(s => ({n: SCEN[s].name, c: SCEN[s].c, d: B[s].out[i]}));
    if (!list.length) return;
    fg.style('display', null); vl.attr('x1', x(yr)).attr('x2', x(yr));
    fg.selectAll('circle').data(list).join('circle').attr('cx', x(yr)).attr('cy', d => y(d.d.mean)).attr('r', 4.5).style('fill', d => d.c).style('stroke', 'var(--card)').style('stroke-width', 1.5);
    tip.innerHTML = `<b>${yr}</b>` + list.map(l => `<div><span class="sw" style="background:${l.c}"></span>${l.n}: <b>${sg(l.d.mean)}</b> ${V.unit} <span style="color:var(--muted)">(${sg(l.d.min)} to ${sg(l.d.max)})</span></div>`).join('');
    tip.style.display = 'block';
    const w = tip.offsetWidth, px = x(yr);
    tip.style.left = (px + 14 + w > W ? Math.max(0, px - w - 14) : px + 14) + 'px'; tip.style.top = (mg.t + 6) + 'px';
  }
  svg.append('rect').attr('x', mg.l).attr('y', mg.t).attr('width', iw).attr('height', ih).attr('fill', 'transparent').style('touch-action', 'pan-y')
    .on('pointermove', e => show(Math.max(1950, Math.min(2100, Math.round(x.invert(d3.pointer(e)[0]))))))
    .on('pointerleave', () => { fg.style('display', 'none'); tip.style.display = 'none'; });
}

/* ---------- text, legend, stats ---------- */
function labels() {
  const V = VARS[st.v], anom = st.mode === 'anom';
  $('#blabel').textContent = `${st.bs}–${st.bs + 29}`;
  $('#ctitle').textContent = `${V.name} over Vietnam${anom ? ', change vs ' + st.bs + '–' + (st.bs + 29) : ''}`;
  $('#csub').textContent = `${V.unit}. Thick line is the model mean; the shaded band spans the lowest to highest of ${sel().length} selected model${sel().length === 1 ? '' : 's'}.`;
  $('#legend').innerHTML = `<span><i class="ln" style="background:var(--hist)"></i>Historical</span>` +
    Object.keys(SCEN).filter(s => st.scen.has(s)).map(s => `<span><i class="ln" style="background:${SCEN[s].c}"></i>${SCEN[s].name}</span>`).join('');
}
function stats() {
  const box = $('#stats'), ms = sel(), V = VARS[st.v]; box.innerHTML = '';
  if (!ms.length) return;
  Object.keys(SCEN).filter(s => st.scen.has(s)).forEach(s => {
    const ch = ms.map(m => { const d = DATA[st.v][m], b = mean(d.historical.slice(st.bs - 1950, st.bs - 1950 + 30)), f = mean(d[s].slice(56, 86)); return {d: f - b, p: (f - b) / b * 100}; });
    const m = mean(ch.map(c => c.d)), p = mean(ch.map(c => c.p)), lo = d3.min(ch, c => c.d), hi = d3.max(ch, c => c.d);
    const agree = ch.every(c => c.d > 0) || ch.every(c => c.d < 0);
    const big = st.v === 'tas' ? `${fmt(m, 1, 1)} ${V.unit}` : `${fmt(m, 1, 1)} mm/mo (${fmt(p, 1, 1)}%)`;
    const el = document.createElement('div'); el.className = 'stat'; el.style.borderTopColor = SCEN[s].c;
    el.innerHTML = `<h3>${SCEN[s].name}, 2071–2100 vs ${st.bs}–${st.bs + 29}</h3><div class="big">${big}</div>` +
      `<p>Model range ${fmt(lo, 1, 1)} to ${fmt(hi, 1, 1)} ${V.unit} (spread ${fmt(hi - lo, 1)}). ` +
      (ms.length < 2 ? 'Select more models to see agreement.' : agree ? 'All selected models agree on the direction.' : 'Models disagree on the direction.') + '</p>';
    box.appendChild(el);
  });
}
function render() { labels(); draw(); stats(); }

/* ---------- controls ---------- */
function buildModels() {
  $('#models').innerHTML = '';
  Object.keys(DATA.tas).forEach(m => {
    const l = document.createElement('label');
    l.innerHTML = `<input type="checkbox" value="${m}"${st.models.has(m) ? ' checked' : ''}>${m}`;
    $('#models').appendChild(l);
  });
}
function seg(id, attr, key) {
  $(id).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
    $(id).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); st[key] = b.dataset[attr]; render(); });
}
seg('#varSeg', 'v', 'v'); seg('#modeSeg', 'm', 'mode');
$('#scens').addEventListener('change', e => { e.target.checked ? st.scen.add(e.target.value) : st.scen.delete(e.target.value); render(); });
$('#models').addEventListener('change', e => {
  if (!e.target.checked && st.models.size === 1) { e.target.checked = true; return; }
  e.target.checked ? st.models.add(e.target.value) : st.models.delete(e.target.value); render(); });
$('#base').addEventListener('input', e => { st.bs = +e.target.value; render(); });
$('#ind').addEventListener('change', e => { st.ind = e.target.checked; render(); });
$('#smooth').addEventListener('change', e => { st.smooth = e.target.checked; render(); });
window.addEventListener('resize', draw);

let placeholder = true;
function banner() {
  $('#banner').classList.toggle('ok', !placeholder);
  $('#bmsg').textContent = placeholder ? 'You are viewing synthetic placeholder data, not real CMIP6 output. Load your own JSON export to replace it.' : 'Showing your loaded data.';
}
$('#file').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(t => {
    const d = JSON.parse(t);
    for (const v of ['tas', 'pr']) {
      if (!d[v] || !Object.keys(d[v]).length) throw new Error('missing "' + v + '"');
      for (const [m, o] of Object.entries(d[v])) {
        if (!o.historical || o.historical.length !== 65) throw new Error(v + '/' + m + ' needs 65 historical values');
        for (const s of ['ssp245', 'ssp585']) if (!o[s] || o[s].length !== 86) throw new Error(v + '/' + m + '/' + s + ' needs 86 values');
      }
    }
    DATA = d; placeholder = false; st.models = new Set(Object.keys(d.tas)); buildModels(); banner(); render();
  }).catch(err => { $('#bmsg').textContent = 'Could not load file: ' + err.message; });
  e.target.value = '';
});

buildModels(); banner(); render();