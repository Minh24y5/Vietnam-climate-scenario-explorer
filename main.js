const $ = s => document.querySelector(s);
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const SCEN = {ssp245: {name: 'SSP2-4.5', c: 'var(--s245)'}, ssp585: {name: 'SSP5-8.5', c: 'var(--s585)'}};
const VARS = {tas: {name: 'Annual mean temperature', unit: '°C', d: 2}, pr: {name: 'Mean monthly rainfall', unit: 'mm/month', d: 1}};
const DASHES = ['', '6 3', '2 3', '8 3 2 3', '4 4 1 4'];

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
const st = {
  v: 'tas',
  mode: 'abs',
  scen: new Set(['ssp245', 'ssp585']),
  models: new Set(Object.keys(DATA.tas)),
  bs: 1985,
  ind: false,
  smooth: true,
  yr: 2050
};
const sel = () => Object.keys(DATA.tas).filter(m => st.models.has(m));
const fmt = (x, d, sign) => {
  if (Math.abs(x) < 0.00001) x = 0;
  const s = d3.format('.' + d + 'f')(x);
  return (sign && x > 0 ? '+' : '') + s;
};

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

/* ---------- screen reader live announce throttle ---------- */
let announceTimer = null;
function announce(text) {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    const el = $('#chartLiveAnnounce');
    if (el) el.textContent = text;
  }, 120);
}

/* ---------- chart ---------- */
let activeShowFn = null;
function draw() {
  const el = $('#chart'), tip = $('#tip'), W = el.clientWidth || 600, H = Math.round(Math.max(300, Math.min(480, W * .56)));
  const mg = {t: 14, r: W < 500 ? 10 : 18, b: 32, l: W < 500 ? 42 : 52}, V = VARS[st.v], ms = sel();
  const svg = d3.select(el).selectAll('svg').data([0]).join('svg').attr('width', W).attr('height', H);
  svg.selectAll('*').remove(); tip.style.display = 'none';

  if (!ms.length) {
    svg.append('text').attr('x', W / 2).attr('y', H / 2).attr('text-anchor', 'middle').attr('class', 'note').text('Select at least one model to display chart.');
    activeShowFn = null;
    return;
  }

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
    if (st.ind) {
      ms.forEach((m, mi) => {
        svg.append('path').datum(p.S[m].slice(p.a, p.b).map((v, i) => ({y: 1950 + p.a + i, mean: v})))
          .attr('d', line)
          .style('fill', 'none')
          .style('stroke', p.c)
          .style('stroke-width', 1.25)
          .style('stroke-dasharray', DASHES[mi % DASHES.length])
          .style('opacity', .65)
          .append('title').text(`${m} (${p.key})`);
      });
    }
  });
  parts.forEach(p => svg.append('path').datum(p.out).attr('d', line).style('fill', 'none').style('stroke', p.c).style('stroke-width', 3).style('stroke-linejoin', 'round'));

  const fg = svg.append('g').style('display', 'none'), vl = fg.append('line').attr('class', 'vline').attr('y1', mg.t).attr('y2', H - mg.b);
  const sg = d => (st.mode === 'anom' && d > 0 ? '+' : '') + fmt(d, V.d);

  function show(yr, updateAria = false) {
    const i = yr - 1950, list = yr <= 2014 ? [{n: 'Historical', c: 'var(--hist)', d: B.ssp245.out[i]}] : vis.map(s => ({n: SCEN[s].name, c: SCEN[s].c, d: B[s].out[i]}));
    if (!list.length) return;
    st.yr = yr;
    fg.style('display', null);
    vl.attr('x1', x(yr)).attr('x2', x(yr));
    fg.selectAll('circle').data(list).join('circle').attr('cx', x(yr)).attr('cy', d => y(d.d.mean)).attr('r', 4.5).style('fill', d => d.c).style('stroke', 'var(--card)').style('stroke-width', 1.5);
    tip.innerHTML = `<b>${yr}</b>` + list.map(l => `<div><span class="sw" style="background:${l.c}"></span>${l.n}: <b>${sg(l.d.mean)}</b> ${V.unit} <span style="color:var(--muted)">(${sg(l.d.min)} to ${sg(l.d.max)})</span></div>`).join('');
    tip.style.display = 'block';
    const w = tip.offsetWidth, px = x(yr);
    tip.style.left = (px + 14 + w > W ? Math.max(0, px - w - 14) : px + 14) + 'px';
    tip.style.top = (mg.t + 6) + 'px';

    if (updateAria) {
      announce(`Year ${yr}: ` + list.map(l => `${l.n} mean ${sg(l.d.mean)} ${V.unit} (range ${sg(l.d.min)} to ${sg(l.d.max)})`).join('; '));
    }
  }

  activeShowFn = show;

  svg.append('rect').attr('x', mg.l).attr('y', mg.t).attr('width', iw).attr('height', ih).attr('fill', 'transparent').style('touch-action', 'pan-y')
    .on('pointermove', e => {
      const yr = Math.max(1950, Math.min(2100, Math.round(x.invert(d3.pointer(e)[0]))));
      show(yr, false);
    })
    .on('pointerleave', () => {
      fg.style('display', 'none');
      tip.style.display = 'none';
    });
}

/* ---------- keyboard navigation on chart ---------- */
$('#chart').addEventListener('keydown', e => {
  if (!activeShowFn) return;
  let yr = st.yr || 2050;
  let handled = false;
  const step = e.shiftKey ? 10 : 1;

  if (e.key === 'ArrowLeft') {
    yr = Math.max(1950, yr - step);
    handled = true;
  } else if (e.key === 'ArrowRight') {
    yr = Math.min(2100, yr + step);
    handled = true;
  } else if (e.key === 'Home') {
    yr = 1950;
    handled = true;
  } else if (e.key === 'End') {
    yr = 2100;
    handled = true;
  } else if (e.key === 'Escape') {
    $('#tip').style.display = 'none';
    handled = true;
  }

  if (handled) {
    e.preventDefault();
    activeShowFn(yr, true);
  }
});

/* ---------- text, legend, stats, accessible table ---------- */
function labels() {
  const V = VARS[st.v], anom = st.mode === 'anom';
  $('#blabel').textContent = `${st.bs}–${st.bs + 29}`;
  $('#ctitle').textContent = `${V.name} over Vietnam${anom ? ', change vs ' + st.bs + '–' + (st.bs + 29) : ''}`;
  $('#csub').textContent = `${V.unit}. Thick line is the ensemble mean; shaded band spans the lowest to highest of ${sel().length} selected model${sel().length === 1 ? '' : 's'}.`;
  
  let legendHtml = `<span><i class="ln" style="background:var(--hist)"></i>Historical</span>` +
    Object.keys(SCEN).filter(s => st.scen.has(s)).map(s => `<span><i class="ln" style="background:${SCEN[s].c}"></i>${SCEN[s].name}</span>`).join('');
  if (st.ind) {
    legendHtml += ` <span style="color:var(--muted);margin-left:8px">(Individual models shown with dashed strokes)</span>`;
  }
  $('#legend').innerHTML = legendHtml;
}

function stats() {
  const box = $('#stats'), ms = sel(), V = VARS[st.v];
  box.innerHTML = '';
  const vis = Object.keys(SCEN).filter(s => st.scen.has(s));

  if (!ms.length) {
    box.innerHTML = '<div class="stat-empty"><strong>No climate models selected</strong><p>Select at least one CMIP6 model in the controls above to compute ensemble statistics.</p></div>';
    return;
  }
  if (!vis.length) {
    box.innerHTML = '<div class="stat-empty"><strong>No scenario selected</strong><p>Check SSP2-4.5 or SSP5-8.5 in the controls above to view late-century projections and agreement.</p></div>';
    return;
  }

  vis.forEach(s => {
    const ch = ms.map(m => {
      const d = DATA[st.v][m];
      const b = mean(d.historical.slice(st.bs - 1950, st.bs - 1950 + 30));
      const f = mean(d[s].slice(56, 86));
      return {d: f - b, p: (f - b) / b * 100};
    });
    const m = mean(ch.map(c => c.d)), p = mean(ch.map(c => c.p)), lo = d3.min(ch, c => c.d), hi = d3.max(ch, c => c.d);
    const agree = ch.every(c => c.d > 0) || ch.every(c => c.d < 0);
    const big = st.v === 'tas' ? `${fmt(m, 1, 1)} ${V.unit}` : `${fmt(m, 1, 1)} mm/mo (${fmt(p, 1, 1)}%)`;
    const el = document.createElement('div');
    el.className = 'stat';
    el.innerHTML = `<div class="stat-header"><span class="sw" style="background:${SCEN[s].c}"></span><h3>${SCEN[s].name}, 2071–2100 vs ${st.bs}–${st.bs + 29}</h3></div>` +
      `<div class="big">${big}</div>` +
      `<p>Model range ${fmt(lo, 1, 1)} to ${fmt(hi, 1, 1)} ${V.unit} (spread ${fmt(hi - lo, 1)}). ` +
      (ms.length < 2 ? 'Select more models to assess consensus.' : agree ? 'All selected models agree on the direction.' : 'Models disagree on the direction.') + '</p>';
    box.appendChild(el);
  });
}

function buildTable() {
  const container = $('#accessibleTable');
  if (!container) return;
  const ms = sel(), V = VARS[st.v];
  if (!ms.length) {
    container.innerHTML = '<p style="padding:12px;color:var(--muted)">Select at least one model to generate the data table.</p>';
    return;
  }

  const milestones = [1950, 1970, 1990, 2014, 2030, 2050, 2070, 2100];
  const B = {ssp245: band('ssp245'), ssp585: band('ssp585')};
  const sg = d => (st.mode === 'anom' && d > 0 ? '+' : '') + fmt(d, V.d);

  let html = `<table class="data-table" aria-label="Milestone projections summary table">
    <thead>
      <tr>
        <th scope="col">Year</th>
        <th scope="col">Type</th>
        <th scope="col">SSP2-4.5 Mean (Range)</th>
        <th scope="col">SSP5-8.5 Mean (Range)</th>
      </tr>
    </thead>
    <tbody>`;

  milestones.forEach(yr => {
    const i = yr - 1950;
    const isHist = yr <= 2014;
    const s245 = B.ssp245.out[i];
    const s585 = B.ssp585.out[i];
    const type = isHist ? 'Historical' : 'Projection';
    const s245Str = isHist ? `${sg(s245.mean)} (${sg(s245.min)} to ${sg(s245.max)})` : (st.scen.has('ssp245') ? `${sg(s245.mean)} (${sg(s245.min)} to ${sg(s245.max)})` : '—');
    const s585Str = isHist ? 'Same as Historical' : (st.scen.has('ssp585') ? `${sg(s585.mean)} (${sg(s585.min)} to ${sg(s585.max)})` : '—');

    html += `<tr>
      <th scope="row"><strong>${yr}</strong></th>
      <td>${type}</td>
      <td>${s245Str} ${V.unit}</td>
      <td>${s585Str} ${isHist ? '' : V.unit}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

function render() {
  labels();
  draw();
  stats();
  buildTable();
}

/* ---------- controls ---------- */
function buildModels() {
  const container = $('#models');
  container.innerHTML = '';
  Object.keys(DATA.tas).forEach(m => {
    const l = document.createElement('label');
    l.className = 'check-chip';
    l.innerHTML = `<input type="checkbox" value="${m}"${st.models.has(m) ? ' checked' : ''}>${m}`;
    container.appendChild(l);
  });
  const mc = $('#modelCount');
  if (mc) mc.textContent = st.models.size;
}

function seg(id, attr, key) {
  $(id).addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    $(id).querySelectorAll('button').forEach(x => {
      const active = x === b;
      x.classList.toggle('on', active);
      x.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    st[key] = b.dataset[attr];
    render();
  });
}
seg('#varSeg', 'v', 'v');
seg('#modeSeg', 'm', 'mode');

$('#scens').addEventListener('change', e => {
  e.target.checked ? st.scen.add(e.target.value) : st.scen.delete(e.target.value);
  render();
});

$('#models').addEventListener('change', e => {
  if (!e.target.checked && st.models.size === 1) {
    e.target.checked = true;
    announce('At least one model must remain selected.');
    return;
  }
  e.target.checked ? st.models.add(e.target.value) : st.models.delete(e.target.value);
  const mc = $('#modelCount');
  if (mc) mc.textContent = st.models.size;
  render();
});

const advToggle = $('#advToggle');
if (advToggle) {
  advToggle.addEventListener('click', () => {
    const p = $('#advControls');
    const isHidden = p.style.display === 'none';
    p.style.display = isHidden ? 'block' : 'none';
    advToggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    advToggle.classList.toggle('active', isHidden);
  });
}

$('#base').addEventListener('input', e => {
  st.bs = +e.target.value;
  render();
});

$('#ind').addEventListener('change', e => {
  st.ind = e.target.checked;
  render();
});

$('#smooth').addEventListener('change', e => {
  st.smooth = e.target.checked;
  render();
});

window.addEventListener('resize', draw);

/* ---------- template download & data management ---------- */
let placeholder = true;
function updateBanner(status, badgeText, message) {
  const b = $('#banner');
  b.classList.remove('ok', 'error');
  if (status === 'ok') b.classList.add('ok');
  if (status === 'error') b.classList.add('error');
  $('#bbadge').textContent = badgeText;
  $('#bmsg').textContent = message;
  $('#resetBtn').style.display = placeholder ? 'none' : 'inline-block';
}

function banner() {
  if (placeholder) {
    updateBanner('normal', 'Sample Data', 'You are viewing synthetic placeholder data. Load your own JSON export to replace it.');
  } else {
    updateBanner('ok', 'Custom Data', `Showing verified data with ${Object.keys(DATA.tas).length} models.`);
  }
}

$('#resetBtn').addEventListener('click', () => {
  DATA = synth();
  placeholder = true;
  st.models = new Set(Object.keys(DATA.tas));
  buildModels();
  banner();
  render();
});

$('#dlSample').addEventListener('click', e => {
  e.preventDefault();
  const sample = synth();
  const blob = new Blob([JSON.stringify(sample, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vietnam_cmip6_template.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

$('#file').addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  f.text().then(t => {
    const d = JSON.parse(t);
    for (const v of ['tas', 'pr']) {
      if (!d[v] || !Object.keys(d[v]).length) throw new Error('Missing variable "' + v + '". Expected "tas" and "pr".');
      for (const [m, o] of Object.entries(d[v])) {
        if (!o.historical || o.historical.length !== 65) throw new Error(`${v}/${m} needs 65 historical values (1950–2014). Found ${o.historical ? o.historical.length : 0}.`);
        for (const s of ['ssp245', 'ssp585']) {
          if (!o[s] || o[s].length !== 86) throw new Error(`${v}/${m}/${s} needs 86 projection values (2015–2100). Found ${o[s] ? o[s].length : 0}.`);
        }
      }
    }
    DATA = d;
    placeholder = false;
    st.models = new Set(Object.keys(d.tas));
    buildModels();
    banner();
    render();
  }).catch(err => {
    updateBanner('error', 'Upload Error', `Could not load file: ${err.message}`);
    $('#resetBtn').style.display = 'inline-block';
  });
  e.target.value = '';
});

/* ---------- init ---------- */
buildModels();
banner();
render();
