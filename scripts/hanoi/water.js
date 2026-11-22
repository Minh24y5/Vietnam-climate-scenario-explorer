'use strict';
/* Hà Nội page: rain by season, drought (SPEI), El Niño and humid heat, from data/hanoi/water.json
   (pipeline/build_hanoi_water.py), merged into HN so the level chart and explorer can use them. */

const HN_WATER_URL = 'data/hanoi/water.json';
Object.assign(IND, {
  rx5:     {kind: 'r', d: 0, unit: 'mm', change: 'pct', vi: 'Năm ngày mưa nhiều nhất', en: 'Wettest five days of the year'},
  drought: {kind: 'w', d: 1, unit: 'monthsYr', change: 'diff', vi: 'Tháng khô hạn (SPEI-6 từ −1)', en: 'Drought months (SPEI-6 of −1 or lower)'},
  tw:      {kind: 'w', d: 0, unit: 'daysYr', change: 'diff', vi: 'Ngày oi bức (bầu ướt từ 27 °C)', en: 'Humid-heat days (wet-bulb of 27 °C or more)'}
});
Object.assign(S.vi, {monthsYr: 'tháng/năm', grpWater: 'Khô hạn và oi bức'});
Object.assign(S.en, {monthsYr: 'months a year', grpWater: 'Drought and humid heat'});
const WATER_KEYS = ['rx5', 'drought', 'tw'];
/* most models: at least 4 of 5, as on the national page */
const agreeAt = n => Math.max(1, Math.ceil(n * 0.8));

/* fold water.json into HN: model values beside the existing indicators, observed 1995–2014 into obs.base */
function mergeWater(W) {
  for (const [m, r] of Object.entries(W.models)) {
    const R = HN.models[m];
    if (!R) continue;
    for (const k of WATER_KEYS) if (r.base[k] != null) R.base[k] = r.base[k];
    for (const [lv, L] of Object.entries(r.levels)) {
      if (!R.levels[lv]) continue;
      for (const k of WATER_KEYS) if (L[k] != null) R.levels[lv][k] = L[k];
    }
  }
  const O = W.obs, at = (k, a, b) => mean(O.years.map((y, i) => (y >= a && y <= b ? O[k][i] : null)).filter(v => v != null));
  for (const k of WATER_KEYS) HN.obs.base[k] = at(k, 1995, 2014);
  HN.water = W;
  /* without humidity data no model has tw: drop it rather than show an empty column */
  if (!Object.values(W.models).some(r => r.base.tw != null)) delete IND.tw;
}

/* per calendar month: median % change in rain at a level, each model against its own 1995–2014 */
function monthChange(lv) {
  const W = HN.water, rows = Object.values(W.models).filter(r => r.levels[lv] && r.levels[lv].months && r.base.months);
  return d3.range(12).map(i => {
    const v = rows.map(r => (r.levels[lv].months[i] / r.base.months[i] - 1) * 100);
    return {i, med: median(v), up: v.filter(x => x > 0).length, n: v.length};
  });
}
function obsMonthChange() {
  const M = HN.water.obs.months, a = M['1995-2014'], b = M['2015-2025'];
  return d3.range(12).map(i => ({i, v: (b[i] / a[i] - 1) * 100}));
}
const MONTHS_SHORT = {vi: i => `T${i + 1}`, en: i => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]};
const monthLong = i => LANG === 'vi' ? `tháng ${i + 1}` : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i];

function chartSeasonHn(el) {
  const W = clear(el).clientWidth || 600, H = Math.max(160, el.clientHeight || 400), narrow = W < 520;
  const m = {t: 24, r: 10, b: 30, l: 44};
  const svg = svgIn(el, W, H);
  const lvs = ['2.0', '3.0'], C = Object.fromEntries(lvs.map(lv => [lv, monthChange(lv)])), O = obsMonthChange();
  /* months under 50 mm in 1995–2014 drawn faint: a big percentage of little rain */
  const rainyM = i => HN.water.obs.months['1995-2014'][i] >= 50;
  const all = lvs.flatMap(lv => C[lv].map(d => d.med)).concat(O.map(d => d.v), [0]);
  const x = d3.scaleBand(d3.range(12), [m.l, W - m.r]).paddingInner(0.25);
  const xs = d3.scaleBand(lvs, [0, x.bandwidth()]).padding(0.1);
  const y = d3.scaleLinear(d3.extent(all), [H - m.b, m.t]).nice();
  svg.append('g').attr('class', 'grid').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickSize(-(W - m.l - m.r)).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(v => v === 0 ? '0' : fmt('+')(v)));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickFormat(i => narrow ? String(i + 1) : MONTHS_SHORT[LANG](i)).tickSize(0).tickPadding(8));
  svg.append('line').attr('class', 'zero').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0)).attr('y2', y(0));
  svg.append('text').attr('class', 'unit').attr('x', 0).attr('y', 14).text('%');
  const op = {'2.0': 0.55, '3.0': 1};
  for (const lv of lvs) svg.append('g').selectAll('rect').data(C[lv]).join('rect')
    .attr('x', d => x(d.i) + xs(lv)).attr('width', xs.bandwidth()).attr('y', d => y(Math.max(0, d.med)))
    .attr('height', d => Math.max(1, Math.abs(y(d.med) - y(0)))).style('fill', 'var(--wet)').style('fill-opacity', d => op[lv] * (rainyM(d.i) ? 1 : 0.35));
  svg.append('g').selectAll('path').data(O).join('path').attr('d', d3.symbol(d3.symbolDiamond, 46))
    .attr('transform', d => `translate(${x(d.i) + x.bandwidth() / 2},${y(d.v)})`).style('fill', 'var(--ink)').style('fill-opacity', d => rainyM(d.i) ? 1 : 0.4).style('stroke', 'var(--bg)');
  return lvs.map(lv => `<span><i class="hn-dotsw" style="background:var(--wet);opacity:${op[lv]};border-radius:1px"></i>${lvName(lv)}, ${LANG === 'vi' ? 'trung vị mô hình' : 'model median'}</span>`).join('') +
    `<span><i class="hn-dotsw" style="background:var(--ink);transform:rotate(45deg);border-radius:0"></i>${LANG === 'vi' ? 'Quan trắc 2015–2025' : 'Observed 2015–2025'}</span>` +
    `<span>${LANG === 'vi' ? 'Tô nhạt: tháng mưa dưới 50 mm' : 'Faint: months under 50 mm'}</span>`;
}

/* observed drought months a year, coloured by the El Niño state of the winter the year opens with */
const ENSO_INK = {nino: 'var(--s585)', nina: 'var(--wet)', neutral: 'var(--hist)'};
const ensoOf = v => v == null ? 'neutral' : v >= 0.5 ? 'nino' : v <= -0.5 ? 'nina' : 'neutral';
function chartEnso(el) {
  const O = HN.water.obs, pts = O.years.map((y, i) => ({y, v: O.drought[i], e: ensoOf(O.oni_djf[i])})).filter(d => d.v != null);
  const W = clear(el).clientWidth || 600, H = Math.max(160, el.clientHeight || 400);
  const m = {t: 24, r: 10, b: 30, l: 40};
  const svg = svgIn(el, W, H);
  const x = d3.scaleBand(pts.map(d => d.y), [m.l, W - m.r]).paddingInner(0.2);
  const y = d3.scaleLinear([0, Math.max(6, d3.max(pts, d => d.v))], [H - m.b, m.t]).nice();
  svg.append('g').attr('class', 'grid').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(W - m.l - m.r)).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(pts.map(d => d.y).filter(y => y % 5 === 0)).tickSize(0).tickPadding(8));
  svg.append('text').attr('class', 'unit').attr('x', 0).attr('y', 14).text(t('monthsYr'));
  const cut = HN.record ? HN.record.gridded_to + 0.5 : null;
  if (cut) {
    const cx = x(Math.ceil(cut)) - x.step() * x.paddingInner() / 2;
    svg.append('line').attr('class', 'split').attr('x1', cx).attr('x2', cx).attr('y1', m.t).attr('y2', H - m.b);
    svg.append('text').attr('class', 'note').attr('x', cx + 4).attr('y', m.t + 10).text(LANG === 'vi' ? 'tái phân tích' : 'reanalysis');
  }
  svg.append('g').selectAll('rect').data(pts).join('rect').attr('x', d => x(d.y)).attr('width', x.bandwidth())
    .attr('y', d => y(d.v)).attr('height', d => Math.max(0, y(0) - y(d.v))).style('fill', d => ENSO_INK[d.e]);
  const vi = LANG === 'vi';
  return `<span><i class="hn-dotsw" style="background:${ENSO_INK.nino};border-radius:1px"></i>${vi ? 'Năm mở đầu bằng El Niño' : 'Year opening in El Niño'}</span>` +
    `<span><i class="hn-dotsw" style="background:${ENSO_INK.nina};border-radius:1px"></i>La Niña</span><span><i class="hn-dotsw" style="background:${ENSO_INK.neutral};border-radius:1px"></i>${vi ? 'Trung tính' : 'Neutral'}</span>`;
}
Object.assign(HN_STEPS, {
  humid:  el => chartLevels(el, 'tw'),
  season: el => chartSeasonHn(el),
  dry:    el => chartLevels(el, 'drought'),
  enso:   el => chartEnso(el)
});
Object.assign(HN_CHAPTER, {humid: 'ch-heat', season: 'ch-rain', dry: 'ch-rain', enso: 'ch-rain'});

/* the water narration: new steps, lines added to existing steps, and the notes that change */
function hnWaterCopy(F) {
  const vi = LANG === 'vi', L = F.L, Wt = HN.water;
  const st = (k, lv, mode = 'abs') => L[lv][k] && L[lv][k][mode];
  const v = (k, x) => nf(x, IND[k].d), lv = l => lvName(l).replace(' ', '&nbsp;');
  const all = s => s && s.n && s.up === s.n;
  const O = Wt.obs, yrsOf = (a, b) => O.years.map((y, i) => (y >= a && y <= b ? i : -1)).filter(i => i >= 0);
  const oAvg = (k, a, b) => mean(yrsOf(a, b).map(i => O[k][i]).filter(x => x != null));
  /* El Niño: mean drought months by the state of the winter each year opens with */
  const ens = ['nino', 'neutral', 'nina'].map(e => { const v2 = O.years.map((y, i) => ensoOf(O.oni_djf[i]) === e ? O.drought[i] : null).filter(x => x != null); return {e, n: v2.length, m: mean(v2)}; });
  const nino = ens[0], nina = ens[2];
  /* the three driest years, named only when every one of them opened in El Niño */
  const driest = O.years.map((y, i) => ({y, d: O.drought[i], e: ensoOf(O.oni_djf[i])})).filter(q => q.d != null).sort((a, b) => b.d - a.d || a.y - b.y).slice(0, 3);
  const ninoYears = driest.every(q => q.e === 'nino') ? driest.map(q => q.y).sort() : [];
  /* months: the wettest-growing and the drying months at +3 °C, told when most models share them */
  /* only months with real rain (50 mm or more observed in 1995–2014): a percentage of a dry month's 20 mm misleads */
  const rainy = i => Wt.obs.months['1995-2014'][i] >= 50;
  const c3 = monthChange('3.0').filter(d => rainy(d.i)), om = obsMonthChange().filter(d => rainy(d.i));
  const wetM = c3.filter(d => d.med >= 10 && d.up >= agreeAt(d.n)).sort((a, b) => b.med - a.med).slice(0, 2).sort((a, b) => a.i - b.i);
  const dryM = c3.filter(d => d.med <= -10 && d.n - d.up >= agreeAt(d.n)).sort((a, b) => a.med - b.med).slice(0, 2).sort((a, b) => a.i - b.i);
  const oWet = om.slice().sort((a, b) => b.v - a.v).slice(0, 2).sort((a, b) => a.i - b.i);
  const pc = x => `${sg(x, 0)}%`;
  const list = (ds, f) => ds.map(f).join(vi ? ' và ' : ' and ');
  const D = {b: F.O.base.drought, l15: st('drought', '1.5', 'anom'), l2: st('drought', '2.0', 'anom'), l3: st('drought', '3.0', 'anom')};
  /* June–August mean wet-bulb per level (median of the models), from the water file */
  const jja = l => { const v = Object.values(Wt.models).map(r => (l === 'base' ? r.base : r.levels[l] || {}).tw_jja).filter(x => x != null); return v.length ? median(v) : null; };
  const T = IND.tw ? {b: oAvg('tw', 1995, 2014), r: oAvg('tw', 2015, 2025), a2: st('tw', '2.0', 'anom'), a3: st('tw', '3.0', 'anom'), m2: st('tw', '2.0'), m3: st('tw', '3.0'),
    j0: jja('base'), j2: jja('2.0'), j3: jja('3.0')} : null;
  const rx = st('rx5', '3.0', 'anom'), chosen = Wt.obs.rain_after_2014;
  const rainSrc = chosen === 'chirps' ? 'CHIRPS' : 'ERA5';
  const n1 = x => nf(x, 1);
  const steps = {}, titles = {}, sources = {}, extra = {};
  if (vi) {
    if (T) {
      steps.humid = `<h2>Cái nóng ẩm</h2><p>Khi không khí ẩm, mồ hôi khó bốc hơi và cơ thể khó tự làm mát. Nhiệt độ bầu ướt gộp cả nóng lẫn ẩm vào một con số. Theo ERA5-Land, Hà Nội có khoảng <b>${v('tw', T.b)}</b> ngày mỗi năm có nhiệt độ bầu ướt trung bình ngày từ 27&nbsp;°C trong 1995–2014, và <b>${v('tw', T.r)}</b> ngày trong 2015–2025.</p>` +
        `<p>CMIP6-VN không có độ ẩm, nên phần này dùng bộ NEX-GDDP-CMIP6 của NASA cho cùng các mô hình. Độ ẩm mùa hè của bộ này cao quá mức thật ở Hà Nội, nên trang chỉ lấy phần thay đổi của từng mô hình rồi cộng vào chuỗi quan trắc 1995–2014. Nhiệt độ bầu ướt trung bình mùa hè tăng từ <b>${n1(T.j0)}&nbsp;°C</b> lên trung vị <b>${n1(T.j2)}&nbsp;°C</b> ở ${lv('2.0')} và <b>${n1(T.j3)}&nbsp;°C</b> ở ${lv('3.0')}.</p>` +
        `<p>Ngưỡng 27&nbsp;°C nằm ngay giữa mùa hè Hà Nội, nên chỉ cần ấm thêm hơn một độ là rất nhiều ngày vượt qua: trung vị <b>${v('tw', T.m2.med)}</b> ngày oi bức mỗi năm ở ${lv('2.0')} và <b>${v('tw', T.m3.med)}</b> ngày ở ${lv('3.0')}${all(T.a3) ? `, và mô hình nào cũng tăng` : ''}. Số ngày cụ thể thay đổi nhiều nếu chọn ngưỡng khác.</p>` +
        `<p>Người chịu trước là người làm việc ngoài trời. Theo Lancet Countdown, năm 2022 nắng nóng lấy đi của Việt Nam khoảng <b>16 tỷ</b> giờ lao động tiềm năng, tương đương <b>5,6%</b> GDP, và hai phần ba là giờ của người làm nông. Đó là ước tính cho người làm việc nặng ngoài trời, và là con số cả nước, không riêng Hà\u00a0Nội.</p>`;
      titles.humid = 'Ngày oi bức (nhiệt độ bầu ướt trung bình ngày từ 27 °C) mỗi năm ở từng mức ấm lên';
      sources.humid = 'Nguồn: NASA NEX-GDDP-CMIP6 (Thrasher và cộng sự 2022), nhiệt độ và độ ẩm trung bình ngày, trung bình toàn Hà Nội; nhiệt độ bầu ướt theo Stull (2011). Mỗi mô hình: phần thay đổi theo tháng cộng vào ERA5-Land 1995–2014 (chưa hiệu chỉnh), nên cột 1995–2014 trùng với quan trắc. Giờ lao động: Lancet Countdown về sức khỏe và biến đổi khí hậu, bản tin Việt Nam 2023 (số liệu đến 2022; Romanello và cộng sự 2023, The Lancet).';
    }
    steps.season = `<p>Mưa cũng đổi theo mùa.${wetM.length ? ` Ở ${lv('3.0')}, ${list(wetM, d => monthLong(d.i))} mưa nhiều hơn trung vị ${list(wetM, d => `<b>${pc(d.med)}</b>`)}, theo phần lớn mô hình.` : ''}${dryM.length ? ` Ngược lại, ${list(dryM, d => monthLong(d.i))} khô hơn (${list(dryM, d => pc(d.med))}), đúng lúc nắng nóng bắt đầu.` : ''}</p>` +
      `<p>Những năm gần đây đã nghiêng về phía đó: so với 1995–2014, ${list(oWet, d => monthLong(d.i))} của 2015–2025 mưa nhiều hơn ${list(oWet, d => `<b>${pc(d.v)}</b>`)} (${rainSrc} đã hiệu chỉnh). Mười một năm còn quá ngắn để gọi là xu hướng, nhưng nó cùng chiều với các mô hình.</p>`;
    titles.season = 'Thay đổi lượng mưa từng tháng so với 1995–2014: mô hình ở +2 và +3 °C, và quan trắc 2015–2025';
    sources.season = `Nguồn: CMIP6-VN, trung vị thay đổi của từng mô hình so với 1995–2014 của chính nó; quan trắc: số liệu lưới 1995–2014 và ${rainSrc} đã hiệu chỉnh theo số liệu đó cho 2015–2025.`;
    steps.dry = `<h2>Mưa nhiều hơn, nhưng khô hạn cũng thường hơn</h2><p>Nóng hơn thì nước bốc hơi nhanh hơn, và mùa khô không có thêm mưa để bù. Chỉ số SPEI tính cả hai phía: mưa trừ đi lượng nước hơi nóng có thể làm bốc hơi. Trong 1995–2014, Hà Nội có khoảng <b>${n1(D.b)}</b> tháng khô hạn mỗi năm.</p>` +
      `<p>Các mô hình thêm trung vị <b>${sg(D.l15.med, 1)}</b> tháng ở ${lv('1.5')}, <b>${sg(D.l2.med, 1)}</b> ở ${lv('2.0')} và <b>${sg(D.l3.med, 1)}</b> ở ${lv('3.0')}${all(D.l15) && all(D.l2) && all(D.l3) ? `, và mô hình nào cũng tăng ở mọi mức` : ''}. Hạn hán ở thượng nguồn là điều đã làm cạn hồ thủy điện Sơn La và Lai Châu năm 2023, khi miền Bắc cần điện nhất.</p>`;
    titles.dry = 'Tháng khô hạn (SPEI-6 từ −1) mỗi năm ở từng mức ấm lên';
    sources.dry = 'Nguồn: CMIP6-VN; SPEI-6 (Vicente-Serrano và cộng sự 2010) từ mưa và bốc thoát hơi tiềm năng theo Hargreaves, mỗi mô hình so với 1985–2014 của chính nó. Vạch ngang: quan trắc 1995–2014.';
    steps.enso = `<p>Những năm khô hạn ở Hà Nội thường là năm El Niño. Những năm mở đầu bằng một mùa đông El Niño có trung bình <b>${n1(nino.m)}</b> tháng khô hạn ở Hà Nội, so với <b>${n1(nina.m)}</b> sau La Niña (${nino.n} và ${nina.n} năm từ 1981).${ninoYears.length ? ` Ba năm khô nhất, ${ninoYears.join(', ')}, đều mở đầu bằng El Niño.` : ''}</p><p>Những năm El Niño sau này sẽ đến với một Hà\u00a0Nội nóng hơn, nơi các mô hình đã cho thấy khô hạn thường hơn ngay cả khi không tính El Niño.</p>`;
    titles.enso = 'Tháng khô hạn mỗi năm ở Hà Nội, quan trắc 1981–2025, tô theo El Niño';
    sources.enso = `Nguồn: SPEI-6 từ số liệu lưới tới 2014, sau đó ERA5-Land (nhiệt độ) và ${rainSrc} (mưa) đã hiệu chỉnh; khớp với quan trắc 1985–2014. El Niño: chỉ số ONI của NOAA cho tháng 12–2 mở đầu mỗi năm (từ +0,5 °C), La Niña từ −0,5 °C.`;
    extra.hot = '<p>Nắng nóng còn đưa người ta vào viện. Một nghiên cứu ở nhiều tỉnh của Việt Nam cho thấy trong những đợt nắng nóng, số ca nhập viện tăng khoảng 2,5%, và tác động ở miền Bắc lớn hơn miền Nam. Người già và trẻ nhỏ chịu nhiều nhất: trong 2013–2022, mỗi trẻ sơ sinh ở Việt Nam trải qua trung bình 12 ngày nắng nóng đe dọa tính mạng mỗi năm, mỗi người trên 65 tuổi là 13 ngày.</p>';
    extra.nights = '<p>Đêm nóng còn chạm tới cánh đồng: thí nghiệm nhiều năm ở Viện Nghiên cứu Lúa Quốc tế cho thấy mỗi độ tăng thêm của nhiệt độ ban đêm trong vụ làm năng suất lúa giảm khoảng 10%.</p>';
    extra.rain = `<p>${rx ? `Năm ngày mưa nhiều nhất trong năm nặng thêm trung vị <b>${pc(rx.med)}</b> ở ${lv('3.0')}${all(rx) ? `, theo cả ${rx.n} mô hình` : ''}. ` : ''}Hệ thống thoát nước trung tâm Hà Nội được thiết kế cho 310&nbsp;mm trong hai ngày. Ngày 30/9 và 1/10/2025, mưa sau bão Bualoi vượt 366&nbsp;mm ở nhiều điểm, và thành phố ghi nhận hơn 100 điểm ngập.</p>`;
  } else {
    if (T) {
      steps.humid = `<h2>Humid heat</h2><p>In humid air sweat evaporates slowly and the body struggles to cool itself. Wet-bulb temperature folds heat and humidity into one number. By ERA5-Land, Hanoi had about <b>${v('tw', T.b)}</b> days a year with a daily-mean wet-bulb of 27&nbsp;°C or more in 1995–2014, and <b>${v('tw', T.r)}</b> in 2015–2025.</p>` +
        `<p>CMIP6-VN has no humidity, so this part uses NASA's NEX-GDDP-CMIP6 for the same models. Its summer humidity over Hanoi is far higher than the real thing, so the page takes only each model's change and adds it to the observed 1995–2014. The summer mean wet-bulb rises from <b>${n1(T.j0)}&nbsp;°C</b> to a median <b>${n1(T.j2)}&nbsp;°C</b> at ${lv('2.0')} and <b>${n1(T.j3)}&nbsp;°C</b> at ${lv('3.0')}.</p>` +
        `<p>The 27&nbsp;°C mark sits in the middle of Hanoi's summer, so a little over a degree of warming pushes many days across it: a median <b>${v('tw', T.m2.med)}</b> humid-heat days a year at ${lv('2.0')} and <b>${v('tw', T.m3.med)}</b> at ${lv('3.0')}${all(T.a3) ? `, rising in every model` : ''}. The count would shift a good deal with a different threshold.</p>` +
        `<p>Outdoor workers feel it first. By the Lancet Countdown's count, heat cost Vietnam about <b>16 billion</b> potential labour hours in 2022, worth <b>5.6%</b> of GDP, two-thirds of them farm workers'. That is an estimate for heavy outdoor work, and a national figure, not Hanoi's alone.</p>`;
      titles.humid = 'Humid-heat days (daily-mean wet-bulb of 27 °C or more) a year at each warming level';
      sources.humid = 'Source: NASA NEX-GDDP-CMIP6 (Thrasher et al. 2022), daily mean temperature and humidity, Hanoi city-wide; wet-bulb by Stull (2011). Each model: its monthly change added to ERA5-Land 1995–2014 (not calibrated), so the 1995–2014 column equals the observed. Labour hours: Lancet Countdown on health and climate change, Vietnam data sheet 2023 (data to 2022; Romanello et al. 2023, The Lancet).';
    }
    steps.season = `<p>The rain shifts between seasons too.${wetM.length ? ` At ${lv('3.0')}, ${list(wetM, d => monthLong(d.i))} get a median ${list(wetM, d => `<b>${pc(d.med)}</b>`)} more rain, in most models.` : ''}${dryM.length ? ` ${cap(list(dryM, d => monthLong(d.i)))} ${dryM.length === 1 ? 'gets' : 'get'} drier (${list(dryM, d => pc(d.med))}), just as the heat begins.` : ''}</p>` +
      `<p>Recent years already lean that way: against 1995–2014, ${list(oWet, d => monthLong(d.i))} of 2015–2025 were ${list(oWet, d => `<b>${pc(d.v)}</b>`)} wetter (calibrated ${rainSrc}). Eleven years is too short to call a trend, but it runs the same way as the models.</p>`;
    titles.season = 'Change in each month\'s rain from 1995–2014: models at +2 and +3 °C, and observed 2015–2025';
    sources.season = `Source: CMIP6-VN, median of each model's change from its own 1995–2014; observed: gridded data 1995–2014 and ${rainSrc} calibrated to it for 2015–2025.`;
    steps.dry = `<h2>More rain, and more drought too</h2><p>Warmer air draws water off faster, and the dry season gets no extra rain to make up for it. The SPEI index counts both sides: rain minus the water the heat can evaporate. In 1995–2014 Hanoi had about <b>${n1(D.b)}</b> drought months a year.</p>` +
      `<p>The models add a median <b>${sg(D.l15.med, 1)}</b> months at ${lv('1.5')}, <b>${sg(D.l2.med, 1)}</b> at ${lv('2.0')} and <b>${sg(D.l3.med, 1)}</b> at ${lv('3.0')}${all(D.l15) && all(D.l2) && all(D.l3) ? `, and every model rises at every level` : ''}. Drought upstream is what drained the Sơn La and Lai Châu reservoirs in 2023, just when the north needed power most.</p>`;
    titles.dry = 'Drought months (SPEI-6 of −1 or lower) a year at each warming level';
    sources.dry = 'Source: CMIP6-VN; SPEI-6 (Vicente-Serrano et al. 2010) from rain and Hargreaves potential evaporation, each model against its own 1985–2014. The rule: observed 1995–2014.';
    steps.enso = `<p>Hanoi's drought years tend to be El Niño years. Years that open with an El Niño winter average <b>${n1(nino.m)}</b> drought months in Hanoi, against <b>${n1(nina.m)}</b> after La Niña (${nino.n} and ${nina.n} years since 1981).${ninoYears.length ? ` The three driest years, ${ninoYears.join(', ')}, all opened in El Niño.` : ''}</p><p>Future El Niño years will arrive in a warmer Hanoi, where the models already show more frequent drought without counting El Niño at all.</p>`;
    titles.enso = 'Drought months a year in Hanoi, observed 1981–2025, coloured by El Niño';
    sources.enso = `Source: SPEI-6 from gridded data to 2014, then calibrated ERA5-Land (temperature) and ${rainSrc} (rain); fitted to observed 1985–2014. El Niño: NOAA's ONI for the December–February each year opens with (+0.5 °C or more), La Niña −0.5 °C or less.`;
    extra.hot = '<p>Heat also puts people in hospital. A study across Vietnam\'s provinces found hospital admissions about 2.5% higher during heatwaves, with a larger effect in the north than in the south. The old and the very young bear the most: in 2013–2022 each infant in Vietnam lived through an average of 12 life-threatening heatwave days a year, and each person over 65 through 13.</p>';
    extra.nights = '<p>Hot nights reach the fields too: years of trials at the International Rice Research Institute found that every degree of warmer growing-season nights cut rice yields by about 10%.</p>';
    extra.rain = `<p>${rx ? `The wettest five days of the year get a median <b>${pc(rx.med)}</b> heavier at ${lv('3.0')}${all(rx) ? `, in all ${rx.n} models` : ''}. ` : ''}Hanoi's central drains are built for 310&nbsp;mm in two days. On 30 September and 1 October 2025, rain after Typhoon Bualoi passed 366&nbsp;mm at several spots, and the city logged more than 100 flooded places.</p>`;
  }
  sources.hot = vi ? ' Nhập viện: Phung và cộng sự 2017, Environmental Pollution. Ngày nắng nóng của trẻ sơ sinh và người già: Lancet Countdown về sức khỏe và biến đổi khí hậu, bản tin Việt Nam 2023 (số liệu đến 2022; Romanello và cộng sự 2023, The Lancet).' : ' Admissions: Phung et al. 2017, Environmental Pollution. Heatwave days for infants and older people: Lancet Countdown on health and climate change, Vietnam data sheet 2023 (data to 2022; Romanello et al. 2023, The Lancet).';
  sources.nights = vi ? ' Lúa: Peng và cộng sự 2004, PNAS.' : ' Rice: Peng et al. 2004, PNAS.';
  sources.rain = vi ? ' Thoát nước và mưa 2025: Sở Xây dựng và Công ty Thoát nước Hà Nội, qua Vietnam News, 10/2025.' : ' Drains and the 2025 rain: Hanoi Department of Construction and drainage company, via Vietnam News, Oct 2025.';
  extra.close = vi
    ? '<p>Ngay cả một thế giới dưới 2&nbsp;°C vẫn nguy hiểm cho người già: Lancet Countdown dự tính số ngày nắng nóng mà người trên 65 tuổi ở Việt Nam phải chịu sẽ gấp <b>7 lần</b> vào 2041–2060.</p>'
    : '<p>Even a world held under 2&nbsp;°C is dangerous for older people: the Lancet Countdown projects that heatwave exposure for people over 65 in Vietnam will be <b>7 times</b> greater by 2041–2060.</p>';
  sources.close = vi ? ' Người trên 65 tuổi: Lancet Countdown về sức khỏe và biến đổi khí hậu, bản tin Việt Nam 2023 (số liệu đến 2022; Romanello và cộng sự 2023, The Lancet).' : ' People over 65: Lancet Countdown on health and climate change, Vietnam data sheet 2023 (data to 2022; Romanello et al. 2023, The Lancet).';
  return {steps, titles, sources, extra, hasTw: !!T};
}

/* merge the water copy into the page copy */
function applyWaterCopy(C, F) {
  if (!HN.water) return C;
  const Wc = hnWaterCopy(F);
  Object.assign(C.steps, Wc.steps);
  Object.assign(C.titles, Wc.titles);
  /* added lines go after the step's own findings; in 'nights' before its last paragraph, which sets up the turn */
  for (const [k, x] of Object.entries(Wc.extra)) {
    if (!C.steps[k]) continue;
    /* close: right after the paragraph that names +2 °C as the level to plan for */
    const plan = k === 'close' ? C.steps[k].search(/lên kế hoạch|the one to plan for/) : -1;
    const at = k === 'nights' ? C.steps[k].lastIndexOf('<p>') : plan >= 0 ? C.steps[k].indexOf('</p>', plan) + 4 : -1;
    C.steps[k] = at > 0 ? C.steps[k].slice(0, at) + x + C.steps[k].slice(at) : C.steps[k] + x;
  }
  for (const k of ['hot', 'nights', 'rain', 'close']) if (C.sources[k]) C.sources[k] += Wc.sources[k];
  for (const k of ['humid', 'season', 'dry', 'enso']) if (Wc.sources[k]) C.sources[k] = Wc.sources[k];
  const vi = LANG === 'vi';
  C.unknown = C.unknown.map(u => {
    if (/^(Chưa có hậu quả|No consequences yet)/.test(u))
      return vi ? 'Hậu quả mới được nêu bằng nghiên cứu sẵn có (nhập viện, năng suất lúa, giờ làm việc, ngập úng), chưa được tính riêng cho Hà Nội ở từng mức ấm lên.'
        : 'Consequences are told from existing studies (hospital admissions, rice yields, working hours, flooding), not yet computed for Hanoi at each warming level.';
    if (Wc.hasTw && /(độ ẩm|humidity|Humidity)/.test(u))
      return vi ? 'Độ ẩm trong các dự tính đến từ NEX-GDDP-CMIP6, một cách hiệu chỉnh khác với CMIP6-VN, và chỉ phần thay đổi của nó được dùng. Cộng phần thay đổi theo tháng vào quan trắc nghĩa là ngày nào trong tháng cũng ấm lên như nhau, nên những đợt oi bức dài hơn hay ngắn hơn chưa được tính. Nhiệt độ bầu ướt tính từ trung bình ngày nên thấp hơn đỉnh trong ngày.'
        : 'Projected humidity comes from NEX-GDDP-CMIP6, a different bias correction from CMIP6-VN, and only its change is used. Adding a monthly change to the observed record warms every day in a month alike, so longer or shorter humid spells aren\'t captured. Wet-bulb is computed from daily means, so it sits below the day\'s peak.';
    return u;
  });
  /* heads-up on the Lancet Countdown figures used in the heat, humid-heat and closing steps */
  C.unknown.push(vi
    ? 'Các con số về giờ lao động, ngày nắng nóng của trẻ sơ sinh và người già, và mức gấp 7 lần là của cả nước, lấy từ bản tin Việt Nam 2023 của Lancet Countdown (số liệu đến 2022), không tính riêng cho Hà Nội. Lancet Countdown cập nhật hằng năm, nên các bản mới hơn có thể khác.'
    : 'The figures on labour hours, heatwave days for infants and older people, and the sevenfold rise are national, from the Lancet Countdown\'s 2023 Vietnam data sheet (data to 2022), not computed for Hanoi. The Lancet Countdown updates every year, so newer editions may differ.');
  /* the rain-source test: CHIRPS against ERA5 on the held-out years, whichever won */
  const Rn = HN.calibration && HN.calibration.rain;
  if (Rn && Rn.chirps_held_out) {
    const ch = Rn.chirps_held_out, er = Rn.era5_held_out, r2 = x => nf(x, 2), kept = Rn.source === 'era5';
    C.unknown.push(vi
      ? `Mưa sau 2014: đã thử CHIRPS (vệ tinh kết hợp trạm đo) thay cho ERA5. Trên 2005–2014, CHIRPS khớp tổng lượng mưa năm tốt hơn (tương quan ${r2(ch.check.pr.r_yearly)} so với ${r2(er.r_yearly)}) nhưng khớp mưa từng ngày kém hơn (${r2(ch.daily_r)} so với ${r2(er.daily_r)}), nên trang ${kept ? 'giữ ERA5' : 'dùng CHIRPS'} cho số ngày mưa to, mùa mưa và khô hạn.`
      : `Rain after 2014: CHIRPS (satellite blended with stations) was tested in place of ERA5. On 2005–2014 it matched yearly totals better (correlation ${r2(ch.check.pr.r_yearly)} against ${r2(er.r_yearly)}) but daily rain worse (${r2(ch.daily_r)} against ${r2(er.daily_r)}), so the page ${kept ? 'keeps ERA5' : 'uses CHIRPS'} for heavy-rain days, seasons and drought.`);
  }
  return C;
}
