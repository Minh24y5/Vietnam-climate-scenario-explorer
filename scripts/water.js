'use strict';
/* Water: rain by month, the drought index (SPEI) by zone, and what heat and water have already cost.
   Data: data/vietnam_water.json (pipeline/build_water.py). Without it these steps leave the page. */

const WATER_URL = 'data/vietnam_water.json';
let WAT = null, WF = null;
const MID = [2036, 2065], EOCY = [2071, 2100], BASEY = [1985, 2014];
const MONTHS = {vi: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']};
const MONTH_LONG = {vi: i => `tháng ${i + 1}`, en: i => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i]};
/* brown where drought months grow, blue-green where they fall */
const droughtColor = d3.scaleDiverging([-1.5, 0, 1.5], v => d3.interpolateBrBG(1 - v)).clamp(true);

function checkWater(w) {
  if (!w || !w.regions || !w.regions.vn || !w.meta) throw new Error('water file is missing regions or meta');
}

/* facts from the water file: monthly rain change and drought change, per region and scenario */
function waterFacts(W) {
  const yrs = d3.range(1950, 2101), ix = ([a, b]) => yrs.map((y, i) => (y >= a && y <= b ? i : -1)).filter(i => i >= 0);
  const avg = (a, I) => mean(I.map(i => a[i]).filter(v => v != null));
  const months = (id, s) => {
    const M = W.regions[id].months, ms = Object.keys(M);
    const ch = ms.map(m => M[m][s].map((v, i) => (v / M[m].base[i] - 1) * 100));
    return d3.range(12).map(i => { const v = ch.map(c => c[i]); return {i, med: mid(v), min: d3.min(v), max: d3.max(v), up: v.filter(x => x > 0).length, n: v.length}; });
  };
  const drought = (id, s, per) => {
    const D = W.regions[id].drought, ms = Object.keys(D);
    const v = ms.map(m => avg(D[m][s], ix(per)) - avg(D[m][s], ix(BASEY)));
    return {med: mid(v), up: v.filter(x => x > 0).length, n: v.length, base: mid(ms.map(m => avg(D[m][s], ix(BASEY))))};
  };
  const ids = W.meta.regions.map(r => r.id);
  const F = {n: Object.keys(W.regions.vn.months).length, nd: W.meta.drought_models.length, dModels: W.meta.drought_models, months: {}, drought: {}};
  for (const s of Object.keys(SCEN)) {
    F.months[s] = months('vn', s);
    F.drought[s] = Object.fromEntries(ids.map(id => [id, {mid: drought(id, s, MID), end: drought(id, s, EOCY)}]));
  }
  return F;
}

/* the monthly bars: median change in each calendar month's rain by 2071–2100, both scenarios, model range as whiskers */
function StorySeasons(el) {
  function render() {
    const F = WF, vi = LANG === 'vi', ss = Object.keys(SCEN);
    d3.select(el).selectAll('*').remove();
    /* legend and source first: their height sets the chart's */
    $('#storyLegend').innerHTML = ss.map(s => `<span><i class="dot" style="--c:${SCEN[s].c};border-radius:1px"></i>${SCEN[s].name}, ${vi ? 'trung vị' : 'median'}</span>`).join('') +
      `<span><i class="ln" style="--c:var(--muted);width:2px;height:12px"></i>${vi ? `Khoảng giữa ${F.n} mô hình` : `Range of the ${F.n} models`}</span>`;
    el.setAttribute('aria-label', (vi ? 'Thay đổi lượng mưa từng tháng của Việt Nam vào 2071–2100, trung vị các mô hình: ' : 'Change in Vietnam\'s rain by month, 2071–2100, model median: ') +
      ss.map(s => `${SCEN[s].name} ` + F.months[s].map(q => `${MONTHS[LANG][q.i]} ${sg(q.med, 0)}%`).join(', ')).join('; ') + '.');
    $('#storySource').textContent = vi
      ? `Nguồn: CMIP6, ${F.n} mô hình, lượng mưa trung bình từng tháng có trọng số diện tích cho Việt Nam (pipeline/build_water.py).`
      : `Source: CMIP6, ${F.n} models, area-weighted mean rain for each calendar month over Vietnam (pipeline/build_water.py).`;
    const W = el.clientWidth || 600, H = Math.max(240, el.clientHeight || 400), narrow = W < 560;
    const svg = d3.select(el).append('svg').attr('aria-hidden', 'true').attr('width', W).attr('height', H);
    const mg = {t: 32, r: 12, b: 30, l: narrow ? 40 : 50};
    const all = ss.flatMap(s => F.months[s].flatMap(d => [d.min, d.max])).concat([0]);
    const x = d3.scaleBand(d3.range(12), [mg.l, W - mg.r]).paddingInner(0.25).paddingOuter(0.1);
    const xs = d3.scaleBand(ss, [0, x.bandwidth()]).padding(0.12);
    const y = d3.scaleLinear(d3.extent(all), [H - mg.b, mg.t]).nice();
    svg.append('g').attr('class', 'grid').attr('transform', `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(6).tickSize(-(W - mg.l - mg.r)).tickFormat(''));
    svg.append('g').attr('class', 'axis').attr('transform', `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(v => v === 0 ? '0' : fmt('+')(v)).tickSizeOuter(0));
    svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - mg.b})`)
      .call(d3.axisBottom(x).tickFormat(i => narrow ? String(i + 1) : MONTHS[LANG][i]).tickSize(0).tickPadding(8));
    svg.append('line').attr('class', 'zero').attr('x1', mg.l).attr('x2', W - mg.r).attr('y1', y(0)).attr('y2', y(0));
    svg.append('text').attr('class', 'unit').attr('x', 0).attr('y', 14).text(vi ? '% thay đổi lượng mưa tháng, 2071–2100 so với 1985–2014' : '% change in monthly rain, 2071–2100 against 1985–2014');
    for (const s of ss) {
      const g = svg.append('g');
      const d = F.months[s];
      g.selectAll('line').data(d).join('line').attr('x1', q => x(q.i) + xs(s) + xs.bandwidth() / 2).attr('x2', q => x(q.i) + xs(s) + xs.bandwidth() / 2)
        .attr('y1', q => y(q.min)).attr('y2', q => y(q.max)).style('stroke', SCEN[s].c).style('stroke-opacity', .55).style('stroke-width', 1.25);
      g.selectAll('rect').data(d).join('rect').attr('x', q => x(q.i) + xs(s)).attr('width', xs.bandwidth())
        .attr('y', q => y(Math.max(0, q.med))).attr('height', q => Math.max(1, Math.abs(y(q.med) - y(0)))).style('fill', SCEN[s].c);
    }
  }
  return {render};
}

/* heat and water in Vietnam, 2016–2025: events with their cost, drawn on a line of years */
const LIVES = [
  {y: 2016, k: 'water', vi: 'Hạn mặn Đồng bằng sông Cửu Long, năm El Niño 2015–16', en: 'Drought and salt water in the Mekong Delta, El Niño 2015–16'},
  {y: 2020, k: 'water', vi: 'Hạn mặn nặng hơn 2016: 13 tỉnh, hơn 80.000 hộ thiếu nước', en: 'Drought worse than 2016: 13 provinces, over 80,000 households short of water'},
  {y: 2022, k: 'both', vi: 'Sốt xuất huyết: 303.637 ca, 112 ca tử vong đến giữa tháng 11', en: 'Dengue: 303,637 cases and 112 deaths by mid-November'},
  {y: 2023, k: 'both', vi: '44,2 °C ở Tương Dương; hồ thủy điện cạn, mất điện, khoảng 1,4 tỷ USD', en: '44.2 °C at Tương Dương; reservoirs drained, blackouts, about US$1.4 billion'},
  {y: 2024, k: 'water', vi: 'Bão Yagi: 318 người chết, 26 mất tích, khoảng 81.500 tỷ đồng', en: 'Typhoon Yagi: 318 dead, 26 missing, about US$3.3 billion'},
  {y: 2025, k: 'water', vi: 'Hà Nội: nhiều điểm mưa trên 366 mm, vượt mức thiết kế thoát nước 310 mm/2 ngày', en: 'Hanoi: several spots over 366 mm, past the drains\' 310 mm in 2 days'}
];
const LIFE_INK = {heat: 'var(--s585)', water: 'var(--wet)', both: 'var(--ink)'};
function StoryLives(el) {
  function render() {
    const vi = LANG === 'vi';
    d3.select(el).selectAll('*').remove();
    $('#storyLegend').innerHTML = `<span><i class="dot" style="--c:${LIFE_INK.water}"></i>${vi ? 'Nước: mưa, bão, hạn' : 'Water: rain, storms, drought'}</span>` +
      `<span><i class="dot" style="--c:${LIFE_INK.both}"></i>${vi ? 'Nóng và nước cùng lúc' : 'Heat and water together'}</span>`;
    el.setAttribute('aria-label', (vi ? 'Nóng và nước ở Việt Nam, 2016–2025: ' : 'Heat and water in Vietnam, 2016–2025: ') + LIVES.map(d => `${d.y}: ${d[LANG] || d.en}`).join('; ') + '.');
    $('#storySource').textContent = vi
      ? 'Nguồn: Liên Hợp Quốc tại Việt Nam, cập nhật hạn mặn 2016 và 2020; Bộ Y tế, qua Tuổi Trẻ, 11/2022; Tổng cục Khí tượng Thủy văn và Ngân hàng Thế giới, 2023; Chính phủ, qua Vietnam News, 9/2024; Sở Xây dựng Hà Nội, qua Vietnam News, 10/2025. Nhập viện: Phung và cộng sự 2017, Environmental Pollution. Lúa: Peng và cộng sự 2004, PNAS. Cảnh báo sốt xuất huyết: UNDP và HR Wallingford (D-MOSS). Khả năng lây sốt xuất huyết và giờ lao động: Lancet Countdown về sức khỏe và biến đổi khí hậu, bản tin Việt Nam 2023 (số liệu đến 2022; Romanello và cộng sự 2023, The Lancet). GDP: Ngân hàng Thế giới, Việt Nam 2045, 2025.'
      : 'Sources: UN Viet Nam drought and salinity updates, 2016 and 2020; Ministry of Health via Tuoi Tre, Nov 2022; meteorological administration and World Bank, 2023; government via Vietnam News, Sep 2024; Hanoi Department of Construction via Vietnam News, Oct 2025. Admissions: Phung et al. 2017, Environmental Pollution. Rice: Peng et al. 2004, PNAS. Dengue warning: UNDP and HR Wallingford (D-MOSS). Dengue spread and labour hours: Lancet Countdown on health and climate change, Vietnam data sheet 2023 (data to 2022; Romanello et al. 2023, The Lancet). GDP: World Bank, Viet Nam 2045, 2025.';
    const W = el.clientWidth || 600, H = Math.max(240, el.clientHeight || 400), narrow = W < 560;
    const svg = d3.select(el).append('svg').attr('aria-hidden', 'true').attr('width', W).attr('height', H);
    /* one even slot per event, its year beside it: the events bunch in 2020–2025, so a year scale would stack them */
    const x0 = narrow ? 44 : 56, top = 14, slot = (H - top - 8) / LIVES.length;
    const yOf = i => top + slot * i + 10;
    svg.append('line').attr('x1', x0).attr('x2', x0).attr('y1', yOf(0)).attr('y2', yOf(LIVES.length - 1)).style('stroke', 'var(--rule)').style('stroke-width', 2);
    const ev = svg.append('g').selectAll('g').data(LIVES).join('g').attr('transform', (d, i) => `translate(${x0},${yOf(i)})`);
    ev.append('text').attr('x', -12).attr('y', 4).attr('text-anchor', 'end').style('fill', 'var(--muted)')
      .style('font', '400 12px var(--font)').style('font-variant-numeric', 'tabular-nums').text(d => d.y);
    ev.append('circle').attr('r', 6).style('fill', d => LIFE_INK[d.k]).style('stroke', 'var(--bg)').style('stroke-width', 2);
    const fo = ev.append('foreignObject').attr('x', 14).attr('y', -10).attr('width', W - x0 - 18).attr('height', slot);
    fo.append('xhtml:div').attr('class', 'life-ev' + (narrow ? ' is-narrow' : '')).html(d => d[LANG] || d.en);
  }
  return {render};
}

/* copy for the water steps */
function waterCopy(F, Z) {
  const vi = LANG === 'vi', s = 'ssp585', M = F.months[s];
  const ml = i => MONTH_LONG[LANG](i);
  const wet = M.slice().sort((a, b) => b.med - a.med).slice(0, 2).sort((a, b) => a.i - b.i);
  /* drier months are told only when the drop is at least 5% and most models share it */
  const dry = M.filter(q => q.med <= -5 && q.n - q.up >= agreeNeed(q.n)).sort((a, b) => a.med - b.med);
  const agreeWet = wet.every(q => q.up >= agreeNeed(q.n));
  const north = ['tb', 'db', 'dbbb', 'btb'], south = ['ntb', 'tn', 'nb'];
  const D = F.drought[s], Dm = F.drought.ssp245;
  const nAll = north.every(id => D[id].mid.up === D[id].mid.n);
  const span = ids => [d3.min(ids, id => D[id].mid.med), d3.max(ids, id => D[id].mid.med)];
  const [nlo, nhi] = span(north), base = mid(north.map(id => D[id].mid.base));
  /* each southern zone: fewer drought months (most models, at least 0.3 fewer), more, or no clear direction */
  const dir = id => { const q = D[id].mid; return q.n - q.up >= agreeNeed(q.n) && q.med <= -0.3 ? 'down' : q.up >= agreeNeed(q.n) && q.med >= 0.3 ? 'up' : 'mixed'; };
  const sDown = south.filter(id => dir(id) === 'down'), sMix = south.filter(id => dir(id) === 'mixed');
  const zl = ids => ids.map(zoneIn).join(vi ? ' và ' : ' and ');
  const southTxt = vi
    ? (sDown.length ? `Ngược lại, ${zl(sDown)} có ít tháng khô hạn hơn (${sDown.map(id => sg(D[id].mid.med, 1)).join(', ')}), vì mưa ở đó tăng nhanh hơn phần bốc hơi.` : '') + (sMix.length ? ` ${cap(zl(sMix))} chưa có xu hướng rõ.` : '')
    : (sDown.length ? `${cap(zl(sDown))}, by contrast, ${sDown.length === 1 ? 'gets' : 'get'} fewer (${sDown.map(id => sg(D[id].mid.med, 1)).join(', ')}), as rain there grows faster than evaporation.` : '') + (sMix.length ? ` ${cap(zl(sMix))} ${sMix.length === 1 ? 'shows' : 'show'} no clear direction.` : '');
  const m45 = mid(north.map(id => Dm[id].mid.med));
  const f1 = v => nf(v, 1);
  const dryTxt = dry.length ? (vi ? ` Ngược lại, ${dry.slice(0, 2).map(q => ml(q.i)).join(' và ')} ít mưa hơn (${dry.slice(0, 2).map(q => `${sg(q.med, 0)}%`).join(', ')}).` : ` ${cap(dry.slice(0, 2).map(q => ml(q.i)).join(' and '))} get less (${dry.slice(0, 2).map(q => `${sg(q.med, 0)}%`).join(', ')}).`)
    : (vi ? ' Không tháng nào khô đi rõ rệt trên cả nước.' : ' No month gets clearly drier nationwide.');
  /* October–November: the end of the rains in the north and south, their peak on the central coast */
  const late = wet.every(q => q.i >= 8 && q.i <= 11);
  if (vi) return {
    'pr-season': `<p>Mưa cũng dịch chuyển giữa các mùa. Theo SSP5-8.5, đến 2071–2100 ${ml(wet[0].i)} và ${ml(wet[1].i)} mưa nhiều hơn trung vị <b>${sg(wet[0].med, 0)}%</b> và <b>${sg(wet[1].med, 0)}%</b>${agreeWet ? `, với phần lớn mô hình đồng ý` : ', nhưng các mô hình chưa đồng ý'}.${dryTxt}</p>${late ? '<p>Đó là cuối mùa mưa ở miền Bắc và miền Nam, và đỉnh mùa mưa ở miền Trung: lúc đất đã no nước và hồ đã đầy, mưa thêm dễ thành lũ. Trong khi đó, nhiệt độ cao hơn quanh năm làm nước bốc hơi nhanh hơn ở mọi tháng, kể cả những tháng không có thêm mưa.</p>' : ''}`,
    'map-drought': `<h2>${nAll ? 'Và miền Bắc khô hạn thường hơn' : 'Hạn hán đến từ cả nóng lẫn mưa'}</h2><p>Chỉ số SPEI đo hạn hán bằng cả hai phía của nguồn nước: mưa rơi xuống trừ đi lượng nước mà hơi nóng làm bốc hơi. Mỗi mô hình được so với chính nó: vào 1985–2014, khoảng <b>${f1(base)}</b> tháng mỗi năm là tháng khô hạn (SPEI-6 từ −1 trở xuống).</p>` +
      `<p>Theo SSP5-8.5, quanh giai đoạn 2036–2065 bốn vùng phía Bắc có thêm <b>${f1(nlo)}</b> đến <b>${f1(nhi)}</b> tháng khô hạn mỗi năm${nAll ? `, theo cả ${numWord(F.nd)} mô hình có đủ số liệu` : ''}. ${southTxt} Theo SSP2-4.5 mức tăng ở phía Bắc nhỏ hơn, trung vị ${sg(m45, 1)} tháng. Đó là điều miền Bắc đã nếm trải năm 2023, khi hạn hán làm cạn hồ thủy điện giữa đợt nắng nóng.</p>`,
    lives: `<h2>Và cái giá rơi vào con người</h2><p>Một nghiên cứu ở nhiều tỉnh của Việt Nam cho thấy trong những ngày nắng nóng kéo dài, số ca nhập viện tăng khoảng 2,5%, và tác động ở miền Bắc lớn hơn miền Nam. Với cây lúa, thí nghiệm nhiều năm của Viện Nghiên cứu Lúa Quốc tế cho thấy mỗi độ tăng thêm của nhiệt độ ban đêm trong vụ làm năng suất giảm khoảng 10%. Muỗi truyền sốt xuất huyết sinh sôi theo cả nhiệt độ lẫn mưa, đến mức hệ thống cảnh báo sớm của Việt Nam dự báo dịch bằng chính hai số liệu ấy. Theo Lancet Countdown, khả năng lây của sốt xuất huyết ở Việt Nam đã tăng <b>11%</b> so với thập niên 1950: giờ mỗi người mắc có thể lây cho hơn ba người khác.</p>` +
      `<p>Nắng nóng còn lấy đi giờ làm việc. Năm 2022, Việt Nam mất khoảng <b>16 tỷ</b> giờ lao động tiềm năng vì nóng, nhiều hơn 16% so với thập niên 1990, tương đương khoảng <b>23 tỷ USD</b> thu nhập, hay <b>5,6%</b> GDP. Hai phần ba số giờ ấy là của người làm nông. “Tiềm năng” ở đây nghĩa là ước tính cho người làm việc nặng ngoài trời, không phải số giờ thực sự bị cắt.</p>` +
      `<p>Ngân hàng Thế giới ước tính nếu không thích ứng, biến đổi khí hậu có thể kéo GDP Việt Nam thấp hơn <b>12,5%</b> vào năm 2050; đầu tư khoảng 0,75% GDP mỗi năm cho thích ứng có thể giảm mức thiệt hại đó xuống còn <b>6,7%</b>.</p>`
  };
  const dryTxtEn = dryTxt;
  return {
    'pr-season': `<p>The rain also shifts between seasons. Under SSP5-8.5, by 2071–2100 ${ml(wet[0].i)} and ${ml(wet[1].i)} get a median <b>${sg(wet[0].med, 0)}%</b> and <b>${sg(wet[1].med, 0)}%</b> more rain${agreeWet ? ', with most models agreeing' : ', though the models don\'t yet agree'}.${dryTxtEn}</p>${late ? '<p>That is the end of the rains in the north and south, and their peak on the central coast: when the ground is soaked and reservoirs are full, extra rain turns into floods easily. Meanwhile higher temperatures draw water off faster in every month, including the months that get no extra rain.</p>' : ''}`,
    'map-drought': `<h2>${nAll ? 'And the north dries out more often' : 'Drought comes from heat and rain together'}</h2><p>The SPEI index measures drought from both sides of the water budget: the rain that falls minus the water the heat evaporates. Each model is set against itself: in 1985–2014, about <b>${f1(base)}</b> months a year were drought months (SPEI-6 of −1 or lower).</p>` +
      `<p>Under SSP5-8.5, around 2036–2065 the four northern zones gain <b>${f1(nlo)}</b> to <b>${f1(nhi)}</b> drought months a year${nAll ? `, in all ${numWord(F.nd)} models with the data` : ''}. ${southTxt} Under SSP2-4.5 the northern rise is smaller, a median ${sg(m45, 1)} months. It is what the north lived through in 2023, when drought drained the hydropower reservoirs in the middle of a heatwave.</p>`,
    lives: `<h2>And people pay the cost</h2><p>A study across Vietnam's provinces found hospital admissions about 2.5% higher during heatwaves, with a larger effect in the north than in the south. For rice, years of field trials at the International Rice Research Institute found that every degree of warmer growing-season nights cut yields by about 10%. The mosquitoes that carry dengue breed with both heat and rain, so closely that Vietnam's early-warning system forecasts outbreaks from those two numbers. By the Lancet Countdown's count, dengue's ability to spread in Vietnam has risen <b>11%</b> since the 1950s: each case can now pass it to more than three other people.</p>` +
      `<p>Heat also takes working hours. In 2022 Vietnam lost about <b>16 billion</b> potential labour hours to heat, 16% more than in the 1990s, worth about <b>US$23 billion</b> in income, or <b>5.6%</b> of GDP. Two-thirds of those hours were farm workers'. "Potential" means an estimate for people doing heavy work outdoors, not hours actually cut from anyone's pay.</p>` +
      `<p>Without adaptation, the World Bank estimates climate change could leave Vietnam's GDP <b>12.5%</b> lower by 2050; spending about 0.75% of GDP a year on adaptation could cut that loss to <b>6.7%</b>.</p>`
  };
}
