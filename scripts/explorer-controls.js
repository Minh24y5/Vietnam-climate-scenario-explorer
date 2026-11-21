'use strict';
/* Explorer controls and data sources (CMIP6, sample, uploaded file). */

/* ---------- explorer controls ---------- */
function buildModels() {
  $('#models').innerHTML = modelsOf(DATA).map(m => `<label class="check"><input type="checkbox" value="${m}"${ex.models.has(m) ? ' checked' : ''}><span>${m}</span></label>`).join('');
  updateModelCount();
}
function updateModelCount() {
  const all = modelsOf(DATA).length;
  $('#modelCount').textContent = `${sel().length}/${all}`;
  $('#allModels').hidden = sel().length === all;
}
function setPressed(group, btn) { $$(group + ' button').forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false')); }
function segment(id, attr, key) {
  $(id).addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    setPressed(id, b);
    ex[key] = b.dataset[attr];
    render();
  });
}
segment('#varSeg', 'v', 'v');
segment('#modeSeg', 'm', 'mode');
$('#scens').addEventListener('change', e => { e.target.checked ? ex.scen.add(e.target.value) : ex.scen.delete(e.target.value); render(); });
$('#models').addEventListener('change', e => {
  const hint = $('#modelHint');
  if (!e.target.checked && sel().length === 1) {
    e.target.checked = true;
    hint.textContent = t('oneModelLeft');
    clearTimeout(hint.t); hint.t = setTimeout(() => { hint.textContent = ''; }, 4000);
    return;
  }
  hint.textContent = '';
  const m = e.target.value;
  if (e.target.checked) { ex.models.add(m); ex.off.delete(m); } else { ex.models.delete(m); ex.off.add(m); }
  updateModelCount();
  render();
});
$('#allModels').addEventListener('click', () => { ex.off.clear(); ex.models = new Set(modelsOf(DATA)); buildModels(); render(); });
function baseAria() { $('#base').setAttribute('aria-valuetext', LANG === 'vi' ? `${ex.bs} đến ${ex.bs + 29}` : `${ex.bs} to ${ex.bs + 29}`); }
$('#base').addEventListener('input', e => { ex.bs = +e.target.value; baseAria(); render(); });
$('#ind').addEventListener('change', e => { ex.ind = e.target.checked; render(); });
$('#smooth').addEventListener('change', e => { ex.smooth = e.target.checked; render(); });

/* ---------- data sources ---------- */
function showDataMsg() {
  const m = $('#dataMsg'), vi = LANG === 'vi', n = dataMsg.n;
  const txt = {
    real: vi ? `Kết quả CMIP6 của ${n} mô hình.` : `CMIP6 results for ${n} models.`,
    sample: vi ? 'Dữ liệu mẫu tổng hợp để thử nghiệm, không phải dự tính thật.' : 'Synthetic sample data for testing. These are not real projections.',
    custom: vi ? `Tệp của bạn: ${n} mô hình.` : `Your file: ${n} model${n === 1 ? '' : 's'}.`
  }[dataMsg.key];
  m.textContent = dataMsg.error ? dataMsg.text : (txt || '');
  m.classList.toggle('error', dataMsg.error);
}
function useData(src, d) {
  if (src === 'real' && REG && ex.region !== 'vn') d = REG.regions[ex.region];
  source = src; DATA = d;
  /* sample or uploaded data is never hidden: the advanced section opens whenever it is in use */
  if (src !== 'real') $('#moreData').open = true;
  /* keep the models the user switched off; anything new to this dataset starts selected */
  const keep = modelsOf(d).filter(m => !ex.off.has(m));
  ex.models = new Set(keep.length ? keep : modelsOf(d));
  $$('#srcSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.s === src ? 'true' : 'false'));
  dataMsg = {key: src, n: modelsOf(d).length, text: '', error: false};
  showDataMsg();
  const reset = $('#resetBtn');
  reset.hidden = src !== 'custom';
  reset.textContent = REAL ? t('backReal') : t('backSample');
  buildModels();
  if (REG) $('#region').value = curRegion();
  render();
}
$('#srcSeg').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  if (b.dataset.s === 'real' && REAL) useData('real', REAL);
  if (b.dataset.s === 'sample') useData('sample', SAMPLE);
});
$('#resetBtn').addEventListener('click', () => REAL ? useData('real', REAL) : useData('sample', SAMPLE));
$('#dlSample').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(SAMPLE, null, 2)], {type: 'application/json'}));
  const a = document.createElement('a');
  a.href = url; a.download = 'vietnam_cmip6_example_synthetic.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('#file').addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  f.text().then(txt => {
    let d;
    try { d = JSON.parse(txt); } catch (_) { throw new Error(t('badJson')); }
    checkData(d);
    useData('custom', d);
  }).catch(err => { dataMsg = {key: dataMsg.key, n: dataMsg.n, text: `${err.message} ${t('unchanged')}`, error: true}; showDataMsg(); });
  e.target.value = '';
});
