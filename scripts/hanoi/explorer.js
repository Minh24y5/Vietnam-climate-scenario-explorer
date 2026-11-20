'use strict';
/* Hà Nội page: the explorer. One indicator at a time, every model at 1995–2014 and each warming
   level, with a highlight to follow one model, the median and range, and a table. */

/* cur: the dot the keyboard is on, {col, m}, or null. The explorer opens on hot nights, the
   indicator the story gives least room and the one that changes most (≈7 nights to ≈90 at +3 °C);
   chapter 3's hot days are one pick away */
const EX = {k: 'tn28', mode: 'abs', hl: '', cur: null};
const EX_DEFAULT = {k: 'tn28', mode: 'abs', hl: ''};

/* the view lives in the address bar (?ind=tn28&mode=anom&hl=MIROC6), so a lecturer can link one
   exact chart; unknown or stale values fall back to the defaults */
function readExUrl() {
  try {
    const q = new URLSearchParams(location.search);
    const k = q.get('ind'), mode = q.get('mode'), hl = q.get('hl');
    if (k && IND[k]) EX.k = k;
    if (mode === 'abs' || mode === 'anom') EX.mode = mode;
    if (hl && modelsFor(EX.k).includes(hl)) EX.hl = hl;
  } catch (_) { /* no URL state: defaults stand */ }
}
function writeExUrl() {
  try {
    const q = new URLSearchParams(location.search);
    const put = (key, v, def) => (v && v !== def) ? q.set(key, v) : q.delete(key);
    put('ind', EX.k, EX_DEFAULT.k); put('mode', EX.mode, EX_DEFAULT.mode); put('hl', EX.hl, EX_DEFAULT.hl);
    if (q.has('lang')) q.set('lang', LANG);
    const s = q.toString();
    history.replaceState(history.state, '', location.pathname + (s ? '?' + s : '') + location.hash);
  } catch (_) { /* history blocked (e.g. a sandboxed frame): the page still works */ }
}

function buildExControls() {
  const grp = (kind, label) => `<optgroup label="${label}">` + Object.keys(IND).filter(k => IND[k].kind === kind)
    .map(k => `<option value="${k}"${k === EX.k ? ' selected' : ''}>${indName(k)}</option>`).join('') + '</optgroup>';
  $('#ind').innerHTML = grp('t', LANG === 'vi' ? 'Nhiệt độ' : 'Temperature') + grp('r', LANG === 'vi' ? 'Mưa' : 'Rain');
  const ms = modelsFor(EX.k).sort();
  if (EX.hl && !ms.includes(EX.hl)) EX.hl = '';
  $('#hl').innerHTML = `<option value="">${t('hlNone')}</option>` + ms.map(m => `<option value="${m}"${m === EX.hl ? ' selected' : ''}>${m}</option>`).join('');
  $$('#modeSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === EX.mode ? 'true' : 'false'));
}
function exValue(k, v, mode) {
  if (mode === 'anom') return IND[k].change === 'pct' ? `${sg(v, 0)}%` : `${sg(v, k === 'tas' ? 1 : IND[k].d)}${k === 'tas' ? ' °C' : ''}`;
  return k === 'tas' ? `${nf(v, 1)} °C` : `${nf(v, IND[k].d)}${IND[k].unit === 'mm' ? ' mm' : ''}`;
}
function renderEx() {
  const {k, mode, hl} = EX, el = $('#chart');
  const W = el.clientWidth || 700;
  $('#legend').innerHTML = chartLevels(el, k, mode, {height: W < 520 ? 340 : 420, highlight: hl});
  const ms = modelsFor(k), unit = k === 'tas' ? '°C' : indUnit(k);
  $('#ctitle').textContent = `${indName(k)}${LANG === 'vi' ? ' ở từng mức ấm lên' : ' at each warming level'}`;
  $('#csub').textContent = LANG === 'vi'
    ? `Trung bình toàn Hà\u00a0Nội, ${mode === 'anom' ? (IND[k].change === 'pct' ? '% thay đổi so với 1995–2014 của chính mỗi mô hình' : 'thay đổi so với 1995–2014 của chính mỗi mô hình, ' + unit) : unit}. Mỗi chấm là một trong ${ms.length} mô hình CMIP6-VN; vạch đậm là trung vị: một nửa số mô hình cao hơn, một nửa thấp hơn.`
    : `Hanoi city-wide average, ${mode === 'anom' ? (IND[k].change === 'pct' ? "% change from each model's own 1995–2014" : "change from each model's own 1995–2014, " + unit) : unit}. Each dot is one of ${ms.length} CMIP6-VN models; the heavy bar is the median: half the models above it, half below.`;
  /* the highlighted model's own numbers, so following one model doesn't mean hovering every dot */
  const count = IND[k].unit === 'daysYr' || IND[k].unit === 'nightsYr' ? ` ${indUnit(k)}` : '';
  $('#hlNote').innerHTML = hl ? `${hl}: ` + levelCols(mode).map(c => {
    const p = valuesAt(k, c, mode).find(d => d.m === hl);
    return `${colName(c)} <b>${p ? exValue(k, p.v, mode) : '–'}</b>`;
  }).join(' · ') + `${count}.` : '';
  el.setAttribute('aria-label', `${$('#ctitle').textContent}. ` + levelCols(mode).map(c => {
    const s = stat(valuesAt(k, c, mode));
    return s.n ? `${colName(c)}: ${LANG === 'vi' ? 'trung vị' : 'median'} ${exValue(k, s.med, mode)}` : '';
  }).filter(Boolean).join('; ') + '.');
  /* results: median and range at each level */
  $('#statsHeading').textContent = LANG === 'vi' ? 'Trung vị và biên độ các mô hình' : 'Model median and range';
  /* how many models sit above their own 1995–2014: said once under the cards when it is the same
     at every level (all five, usually), per card only when it differs */
  const ups = LEVELS.map(lv => stat(valuesAt(k, lv, 'anom'))).filter(a => a.n);
  const same = ups.length > 1 && ups.every(a => a.up === ups[0].up && a.n === ups[0].n);
  const upTxt = a => a.up === a.n ? (LANG === 'vi' ? `cả ${a.n} mô hình đều cao hơn 1995–2014 của chính nó` : `all ${a.n} models are above their own 1995–2014`)
    : a.up === 0 ? (LANG === 'vi' ? `không mô hình nào cao hơn 1995–2014 của chính nó` : `no model is above its own 1995–2014`)
    : (LANG === 'vi' ? `${a.up}/${a.n} mô hình cao hơn 1995–2014 của chính nó` : `${a.up} of ${a.n} models are above their own 1995–2014`);
  $('#stats').innerHTML = LEVELS.map(lv => {
    const s = stat(valuesAt(k, lv, mode)), a = stat(valuesAt(k, lv, 'anom'));
    if (!s.n) return `<div class="stat"><div class="stat-head">${lvName(lv)}</div><p>${LANG === 'vi' ? 'Chưa có mô hình nào đạt mức này trong những năm CMIP6-VN có số liệu.' : 'No model reaches this level within the years CMIP6-VN covers.'}</p></div>`;
    return `<div class="stat"><div class="stat-head">${lvName(lv)}</div><div class="big">${exValue(k, s.med, mode)}${mode === 'abs' && IND[k].unit !== 'mm' && k !== 'tas' ? ` <small>${unit}</small>` : ''}</div>` +
      `<p>${LANG === 'vi' ? 'Các mô hình từ' : 'Models range from'} <b>${exValue(k, s.min, mode)}</b> ${t('to')} <b>${exValue(k, s.max, mode)}</b>${same ? '' : `; ${upTxt(a)}`}.</p></div>`;
  }).join('');
  $('#statsNote').textContent = same ? cap((LANG === 'vi' ? 'ở cả ba mức, ' : 'at all three levels, ') + upTxt(ups[0])) + '.' : '';
  /* table */
  const rows = ms.slice().sort().map(m => `<tr><th scope="row">${m}</th>` + levelCols(mode).map(c => {
    const p = valuesAt(k, c, mode).find(d => d.m === m);
    return `<td>${p ? exValue(k, p.v, mode) : '–'}</td>`;
  }).join('') + '</tr>').join('');
  const obsRow = mode === 'abs' ? `<tr><th scope="row">${t('obsShort')}</th><td>${exValue(k, HN.obs.base[k], 'abs')}</td>${LEVELS.map(() => '<td class="range">–</td>').join('')}</tr>` : '';
  $('#accessibleTable').innerHTML = `<table class="data-table"><caption class="sr-only">${$('#ctitle').textContent}</caption><thead><tr><th scope="col">${t('model')}</th>${levelCols(mode).map(c => `<th scope="col">${colName(c)}</th>`).join('')}</tr></thead><tbody>${obsRow}${rows}</tbody></table>`;
  /* the chart was redrawn: put the keyboard ring back on the same model and column */
  showDot(curDot(), false);
  writeExUrl();
}

/* tooltip, shared by pointer and keyboard */
function placeTip(p) {
  const el = $('#chart'), tip = $('#tip');
  if (!p) { tip.style.display = 'none'; return; }
  tip.innerHTML = `<div class="tip-y">${p.m}</div><div class="tip-r">${colName(p.col)}: <b>${exValue(EX.k, p.v, EX.mode)}</b></div>`;
  tip.style.display = 'block';
  const tw = tip.offsetWidth, left = Math.min(Math.max(0, p.x + 12), el.clientWidth - tw);
  tip.style.left = left + 'px'; tip.style.top = Math.max(0, p.y - tip.offsetHeight - 10) + 'px';
}
function exTip(e) {
  const el = $('#chart'), dots = el._dots || [];
  const r = el.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
  let best = null, bd = 16;
  for (const p of dots) { const d = Math.hypot(p.x - px, p.y - py); if (d < bd) { bd = d; best = p; } }
  placeTip(best || curDot());
}

/* ---------- keyboard: ← → between columns, ↑ ↓ between models, Home/End, Esc ---------- */
/* each column's dots, highest value first, as the eye reads them */
const exCols = () => levelCols(EX.mode).map(c => ($('#chart')._dots || []).filter(p => p.col === c).sort((a, b) => a.y - b.y)).filter(c => c.length);
const curDot = () => EX.cur && ($('#chart')._dots || []).find(p => p.col === EX.cur.col && p.m === EX.cur.m) || null;
function showDot(p, announce) {
  d3.select('#chart svg').selectAll('.hn-focus').data(p ? [p] : []).join('circle')
    .attr('class', 'hn-focus').attr('cx', d => d.x).attr('cy', d => d.y).attr('r', DOT_R + 4);
  placeTip(p);
  /* counts carry their unit when read aloud ("+12 đêm/năm"); °C, mm and % already do */
  const unit = IND[EX.k].unit === 'daysYr' || IND[EX.k].unit === 'nightsYr' ? ` ${indUnit(EX.k)}` : '';
  if (p && announce) $('#chartLiveAnnounce').textContent = `${p.m}, ${colName(p.col)}: ${exValue(EX.k, p.v, EX.mode)}${unit}`;
}
$('#chart').addEventListener('keydown', e => {
  const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Escape'];
  const cols = exCols();
  if (!KEYS.includes(e.key) || !cols.length) return;
  e.preventDefault();
  if (e.key === 'Escape') { EX.cur = null; showDot(null); return; }
  let ci = EX.cur ? cols.findIndex(c => c[0].col === EX.cur.col) : -1;
  const fresh = ci < 0;
  if (fresh) ci = e.key === 'End' ? cols.length - 1 : 0;
  else if (e.key === 'ArrowLeft') ci = Math.max(0, ci - 1);
  else if (e.key === 'ArrowRight') ci = Math.min(cols.length - 1, ci + 1);
  else if (e.key === 'Home') ci = 0;
  else if (e.key === 'End') ci = cols.length - 1;
  const col = cols[ci];
  /* stay on the same model across columns; start on the highlighted model if there is one */
  let mi = col.findIndex(q => q.m === (EX.cur ? EX.cur.m : EX.hl));
  if (mi < 0) mi = 0;
  if (!fresh && e.key === 'ArrowUp') mi = Math.max(0, mi - 1);
  if (!fresh && e.key === 'ArrowDown') mi = Math.min(col.length - 1, mi + 1);
  const p = col[mi];
  EX.cur = {col: p.col, m: p.m};
  showDot(p, true);
});
$('#chart').addEventListener('blur', () => { EX.cur = null; showDot(null); });

$('#chart').addEventListener('pointermove', exTip);
$('#chart').addEventListener('pointerdown', exTip);
$('#chart').addEventListener('pointerleave', () => placeTip(curDot()));
$('#ind').addEventListener('change', e => { EX.k = e.target.value; buildExControls(); renderEx(); });
$('#hl').addEventListener('change', e => { EX.hl = e.target.value; renderEx(); });
$('#modeSeg').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || b.dataset.m === EX.mode) return;
  EX.mode = b.dataset.m; buildExControls(); renderEx();
});
