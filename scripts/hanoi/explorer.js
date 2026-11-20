'use strict';
/* Hà Nội page: the explorer. One indicator at a time, every model at 1995–2014 and each warming
   level, with a highlight to follow one model, the median and range, and a table. */

const EX = {k: 'tx35', mode: 'abs', hl: ''};

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
    ? `Trung bình toàn Hà Nội, ${mode === 'anom' ? (IND[k].change === 'pct' ? '% thay đổi' : 'thay đổi, ' + unit) : unit}. Mỗi chấm là một trong ${ms.length} mô hình CMIP6-VN; vạch đậm là trung vị.`
    : `Hanoi city-wide average, ${mode === 'anom' ? (IND[k].change === 'pct' ? '% change' : 'change, ' + unit) : unit}. Each dot is one of ${ms.length} CMIP6-VN models; the heavy bar is the median.`;
  $('#indNote').textContent = IND[k].kind === 'r'
    ? (LANG === 'vi' ? 'Chỉ số mưa dùng cả các mô hình chỉ có mưa.' : 'Rain indicators also use the rain-only models.')
    : (LANG === 'vi' ? 'Chỉ số nhiệt độ dùng các mô hình có nhiệt độ.' : 'Temperature indicators use the models with temperature.');
  const R = hl && HN.models[hl];
  $('#hlNote').textContent = R && R.run_paper && R.run_paper !== R.run
    ? (LANG === 'vi' ? `Bảng của bài báo CMIP6-VN ghi ${hl} là ${R.run_paper}, nhãn này không có trong CMIP6; mức ấm lên dùng ${R.run}.`
      : `The CMIP6-VN paper lists ${hl} as ${R.run_paper}, a label CMIP6 doesn't have; its warming levels use ${R.run}.`)
    : R ? (LANG === 'vi' ? `Lần chạy: ${R.run}.` : `Run: ${R.run}.`) : '';
  el.setAttribute('aria-label', `${$('#ctitle').textContent}. ` + LEVEL_COLS.map(c => {
    const s = stat(valuesAt(k, c, mode));
    return s.n ? `${colName(c)}: ${LANG === 'vi' ? 'trung vị' : 'median'} ${exValue(k, s.med, mode)}` : '';
  }).filter(Boolean).join('; ') + '.');
  /* results: median and range at each level */
  $('#statsHeading').textContent = LANG === 'vi' ? 'Trung vị và biên độ các mô hình' : 'Model median and range';
  $('#stats').innerHTML = LEVELS.map(lv => {
    const s = stat(valuesAt(k, lv, mode)), a = stat(valuesAt(k, lv, 'anom'));
    if (!s.n) return `<div class="stat"><div class="stat-head">${lvName(lv)}</div><p>${LANG === 'vi' ? 'Chưa có mô hình nào đạt mức này trong những năm CMIP6-VN có số liệu.' : 'No model reaches this level within the years CMIP6-VN covers.'}</p></div>`;
    const more = LANG === 'vi' ? `${a.up}/${a.n} mô hình cao hơn 1995–2014 của chính nó` : `${a.up} of ${a.n} models above their own 1995–2014`;
    return `<div class="stat"><div class="stat-head">${lvName(lv)}</div><div class="big">${exValue(k, s.med, mode)}${mode === 'abs' && IND[k].unit !== 'mm' && k !== 'tas' ? ` <small>${unit}</small>` : ''}</div>` +
      `<p>${LANG === 'vi' ? 'Từ' : 'From'} <b>${exValue(k, s.min, mode)}</b> ${t('to')} <b>${exValue(k, s.max, mode)}</b>; ${more}.</p></div>`;
  }).join('');
  /* table */
  const rows = ms.slice().sort().map(m => `<tr><th scope="row">${m}</th>` + LEVEL_COLS.map(c => {
    const p = valuesAt(k, c, mode).find(d => d.m === m);
    return `<td>${p ? exValue(k, p.v, mode) : '–'}</td>`;
  }).join('') + '</tr>').join('');
  const obsRow = mode === 'abs' ? `<tr><th scope="row">${t('obsShort')}</th><td>${exValue(k, HN.obs.base[k], 'abs')}</td>${LEVELS.map(() => '<td class="range">–</td>').join('')}</tr>` : '';
  $('#accessibleTable').innerHTML = `<table class="data-table"><caption class="sr-only">${$('#ctitle').textContent}</caption><thead><tr><th scope="col">${t('model')}</th>${LEVEL_COLS.map(c => `<th scope="col">${colName(c)}</th>`).join('')}</tr></thead><tbody>${obsRow}${rows}</tbody></table>`;
}

/* tooltip: nearest dot within reach */
function exTip(e) {
  const el = $('#chart'), tip = $('#tip'), dots = el._dots || [];
  const r = el.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
  let best = null, bd = 16;
  for (const p of dots) { const d = Math.hypot(p.x - px, p.y - py); if (d < bd) { bd = d; best = p; } }
  if (!best) { tip.style.display = 'none'; return; }
  tip.innerHTML = `<div class="tip-y">${best.m}</div><div class="tip-r">${colName(best.col)}: <b>${exValue(EX.k, best.v, EX.mode)}</b></div>`;
  tip.style.display = 'block';
  const tw = tip.offsetWidth, left = Math.min(Math.max(0, best.x + 12), el.clientWidth - tw);
  tip.style.left = left + 'px'; tip.style.top = Math.max(0, best.y - tip.offsetHeight - 10) + 'px';
}
$('#chart').addEventListener('pointermove', exTip);
$('#chart').addEventListener('pointerdown', exTip);
$('#chart').addEventListener('pointerleave', () => { $('#tip').style.display = 'none'; });
$('#ind').addEventListener('change', e => { EX.k = e.target.value; buildExControls(); renderEx(); });
$('#hl').addEventListener('change', e => { EX.hl = e.target.value; renderEx(); });
$('#modeSeg').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || b.dataset.m === EX.mode) return;
  EX.mode = b.dataset.m; buildExControls(); renderEx();
});
