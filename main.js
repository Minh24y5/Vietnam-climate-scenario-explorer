'use strict';
/* Vietnam Climate Scenario Explorer: story + explorer, in Vietnamese and English.
   Every number on the page is computed from the loaded data. */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const N_YEARS = 151;
const REAL_URL = 'data/vietnam_cmip6.json';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const DASHES = ['', '6 3', '2 3', '8 3 2 3', '4 4 1 4', '1 3', '10 4'];

/* ---------- language ---------- */
let LANG = (() => {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'vi' || q === 'en') return q;
    const s = localStorage.getItem('lang');
    if (s === 'vi' || s === 'en') return s;
  } catch (_) { /* storage blocked: fall back to Vietnamese */ }
  return 'vi';
})();
const LOCALES = {
  vi: d3.formatLocale({decimal: ',', thousands: '.', grouping: [3], currency: ['', ' ₫'], minus: '−'}),
  en: d3.formatLocale({decimal: '.', thousands: ',', grouping: [3], currency: ['$', ''], minus: '−'})
};
const fmt = spec => LOCALES[LANG].format(spec);
const nf = (x, d = 1) => fmt('.' + d + 'f')(x);
const sg = (x, d = 1) => {
  if (Math.round(Math.abs(x) * 10 ** d) === 0) x = 0;
  return x === 0 ? nf(0, d) : fmt('+.' + d + 'f')(x);
};
const yTick = mode => v => mode === 'anom' ? (v === 0 ? '0' : fmt('+')(v)) : fmt('')(v);

const S = {
  vi: {
    skip: 'Bỏ qua, đến phần tự khám phá', section: 'Khí hậu', nameplate: 'Kịch bản khí hậu Việt Nam', navLabel: 'Các chương',
    navModels: 'Mô hình', navChange: 'Thay đổi', navFutures: 'Hai tương lai', navRain: 'Lượng mưa', navExplore: 'Tự khám phá',
    langLabel: 'Ngôn ngữ', storyLabel: 'Bài viết theo chương',
    medShort: 'trung bình', highShort: 'cao', medLong: 'phát thải trung bình', highLong: 'phát thải cao',
    sapo: 'Năm mô hình khí hậu CMIP6 cùng cho thấy Việt Nam tiếp tục nóng lên trong thế kỷ này. Mức tăng phụ thuộc vào con đường phát thải mà thế giới lựa chọn.',
    leadP2: 'CMIP6 là dự án so sánh mô hình khí hậu đứng sau báo cáo mới nhất của IPCC. Mỗi sọc trong hình là một năm: xanh là lạnh hơn, đỏ là nóng hơn trung bình 1985–2014. Từ năm 2015, dải sọc tách đôi theo hai con đường phát thải.',
    jumpStory: 'Xem tiếp: Năm mô hình, năm Việt Nam', jumpStoryPg: '(chương 1)', jumpExplore: 'Tự khám phá số liệu', jumpExplorePg: '(cuối trang)',
    exploreBlock: 'Tự khám phá', exploreTitle: 'Tự khám phá các dự tính',
    exploreIntro: 'Chọn biến, kịch bản và mô hình. Biểu đồ và phần tóm tắt 2071–2100 cập nhật ngay khi bạn thay đổi.',
    chartHelp: 'Rê chuột hoặc chạm vào biểu đồ để đọc từng năm. Khi biểu đồ đang được chọn, <kbd>←</kbd> <kbd>→</kbd> chuyển một năm, <kbd>Shift</kbd> + mũi tên chuyển mười năm, <kbd>Home</kbd> và <kbd>End</kbd> về hai đầu.',
    tableSummary: 'Các năm mốc dạng bảng', railLabel: 'Điều khiển biểu đồ',
    ctlVariable: 'Biến', varTas: 'Nhiệt độ', varPr: 'Lượng mưa', ctlValues: 'Cách hiển thị', modeAnom: 'Thay đổi', modeAbs: 'Tuyệt đối',
    ctlBaseline: 'Thời kỳ cơ sở', baselineNote: '30 năm dùng làm mốc cho mức thay đổi và phần tóm tắt.',
    ctlScenarios: 'Kịch bản', ctlModels: 'Mô hình', allModels: 'Chọn tất cả mô hình', ctlDisplay: 'Hiển thị', showEach: 'Hiện từng mô hình', smooth10: 'Trung bình 10 năm',
    ctlData: 'Dữ liệu', srcReal: 'Dữ liệu CMIP6', srcSample: 'Mẫu tổng hợp', loadJson: 'Tải tệp JSON của bạn', dlExample: 'Tải tệp JSON mẫu',
    aboutBlock: 'Dữ liệu', aboutTitle: 'Về dữ liệu',
    aboutData: 'Kết quả CMIP6 lấy từ <code>data/vietnam_cmip6.json</code>: mỗi năm, mỗi mô hình một giá trị trung bình năm có trọng số diện tích cho Việt Nam, xây dựng từ kho dữ liệu CMIP6 mà NOAA công bố trên Google Cloud.',
    aboutRuns: 'Mỗi mô hình đóng góp một chuỗi số liệu. Các lần chạy lịch sử phủ giai đoạn 1950–2014 với khí nhà kính, sol khí, núi lửa và biến động Mặt Trời theo quan trắc; hai kịch bản tiếp nối từ 2015 đến 2100. Một giá trị trung bình cả nước che đi khác biệt lớn giữa miền Bắc, duyên hải miền Trung và đồng bằng sông Cửu Long.',
    ownTitle: 'Dùng kết quả CMIP6 của bạn',
    ownText: 'Xuất mỗi năm một giá trị cho từng mô hình rồi tải tệp lên ở phần tự khám phá. Nhiệt độ tính bằng °C, lượng mưa bằng mm mỗi tháng. <code>historical</code> cần 65 giá trị (1950–2014), mỗi kịch bản cần 86 giá trị (2015–2100). Mỗi mô hình phải có mặt ở cả <code>tas</code> và <code>pr</code>.',
    gCmip: 'Dự án So sánh Mô hình Khí hậu Kết hợp lần thứ sáu: bộ các lần chạy mô hình khí hậu đứng sau Báo cáo Đánh giá lần thứ Sáu của IPCC.',
    gSsp: 'Các Lộ trình Kinh tế – Xã hội Chung. Số đầu là kịch bản phát triển (2: trung dung, 5: tăng trưởng dựa vào nhiên liệu hóa thạch), số sau là mức tăng bức xạ vào năm 2100, tính bằng oát trên mét vuông.',
    gBaseT: 'Thời kỳ cơ sở', gBase: 'Giai đoạn 30 năm dùng làm mốc. Mức thay đổi là giá trị của mỗi mô hình trừ trung bình thời kỳ cơ sở của chính mô hình đó.',
    gEnsT: 'Trung bình và biên độ tổ hợp', gEns: 'Trung bình của các mô hình được chọn, và khoảng từ thấp nhất đến cao nhất của chúng trong một năm.',
    gSmoothT: 'Trung bình 10 năm', gSmooth: 'Mỗi điểm là trung bình của mười năm quanh nó, loại bỏ dao động từng năm. Năm năm đầu và cuối không đủ cửa sổ, nên đường bắt đầu từ 1955 và kết thúc năm 2096.',
    imprint: 'Kịch bản khí hậu Việt Nam (Vietnam Climate Scenario Explorer). Dữ liệu mô hình CMIP6; màu kịch bản theo hướng dẫn trình bày của IPCC AR6. Kết quả mô tả mô hình khí hậu, không phải số liệu quan trắc.',
    historical: 'Lịch sử', baseline: 'Cơ sở', projections: 'Dự tính', rangeAcross: 'Biên độ giữa các mô hình',
    eocAvgRange: 'Trung bình và biên độ 2071–2100', eocAvg: 'Trung bình 2071–2100', baseLegend: 'Thời kỳ cơ sở 1985–2014',
    disagree: 'Các mô hình bất đồng về xu hướng', perModel: 'Mỗi đường là một mô hình, trung bình 10 năm',
    synthetic: 'Dữ liệu mẫu tổng hợp, không phải dự tính thật', badgeSynthetic: 'Dữ liệu mẫu tổng hợp',
    tasUnit: '°C', prUnit: 'mm/tháng', tasLong: 'Nhiệt độ trung bình năm', prLong: 'Lượng mưa trung bình tháng',
    over: 'của Việt Nam', changeFrom: 'thay đổi so với', to: 'đến', year: 'Năm', model: 'Mô hình',
    oneModelLeft: 'Phải giữ ít nhất một mô hình.', backReal: 'Quay lại dữ liệu CMIP6', backSample: 'Quay lại dữ liệu mẫu',
    badJson: 'Tệp này không phải JSON hợp lệ.', unchanged: 'Dữ liệu hiện tại không thay đổi.',
    loadFail: 'Không tải được tệp. Hãy mở trang qua máy chủ web (http/https), không mở trực tiếp từ ổ đĩa.',
    aboutFail: 'Không tải được tệp CMIP6 <code>data/vietnam_cmip6.json</code>, thường vì trang được mở trực tiếp từ ổ đĩa thay vì qua máy chủ web. Cho đến khi tải được, mọi biểu đồ ở đây dùng dữ liệu mẫu tổng hợp.'
  },
  en: {
    skip: 'Skip to the explorer', section: 'Climate', nameplate: 'Vietnam Climate Scenario Explorer', navLabel: 'Chapters',
    navModels: 'Models', navChange: 'Change', navFutures: 'Two futures', navRain: 'Rain', navExplore: 'Explorer',
    langLabel: 'Language', storyLabel: 'Story in chapters',
    medShort: 'medium', highShort: 'high', medLong: 'medium emissions', highLong: 'high emissions',
    sapo: 'Five CMIP6 climate models agree that Vietnam will keep warming this century. How much depends on the emissions path the world takes.',
    leadP2: 'CMIP6 is the model comparison project behind the IPCC\'s latest assessment. Each stripe in the figure is one year: blue is cooler and red warmer than the 1985–2014 average. From 2015 the band splits along the two emissions paths.',
    jumpStory: 'Continued: five models, five Vietnams', jumpStoryPg: '(chapter 1)', jumpExplore: 'Explore the numbers yourself', jumpExplorePg: '(end of page)',
    exploreBlock: 'Explorer', exploreTitle: 'Your turn: explore the projections',
    exploreIntro: 'Choose a variable, scenarios and models. The chart and the 2071–2100 summary update as you go.',
    chartHelp: 'Hover or tap the chart to read a year. With the chart focused, <kbd>←</kbd> <kbd>→</kbd> move one year, <kbd>Shift</kbd> + arrow moves ten, <kbd>Home</kbd> and <kbd>End</kbd> jump to the ends.',
    tableSummary: 'Milestone years as a table', railLabel: 'Chart controls',
    ctlVariable: 'Variable', varTas: 'Temperature', varPr: 'Rainfall', ctlValues: 'Values', modeAnom: 'Change', modeAbs: 'Absolute',
    ctlBaseline: 'Baseline', baselineNote: 'The 30 years that change and the summary are measured against.',
    ctlScenarios: 'Scenarios', ctlModels: 'Models', allModels: 'Select all models', ctlDisplay: 'Display', showEach: 'Show each model', smooth10: '10-year average',
    ctlData: 'Data', srcReal: 'CMIP6 data', srcSample: 'Synthetic sample', loadJson: 'Load your JSON', dlExample: 'Download example JSON',
    aboutBlock: 'Data', aboutTitle: 'About the data',
    aboutData: 'The CMIP6 results come from <code>data/vietnam_cmip6.json</code>: one area-weighted annual mean for Vietnam per year, per model, built from the CMIP6 archive that NOAA publishes on Google Cloud.',
    aboutRuns: 'Each model contributes one series. Historical runs cover 1950–2014 and are driven by observed greenhouse gases, aerosols, volcanic eruptions and solar changes; the two scenarios continue from 2015 to 2100. A national average hides large differences between the north, the central coast and the Mekong delta.',
    ownTitle: 'Use your own CMIP6 results',
    ownText: 'Export one value per year for each model and load the file in the explorer. Temperature is in °C and rainfall in mm per month. <code>historical</code> needs 65 values (1950–2014) and each scenario 86 values (2015–2100). Every model must appear under both <code>tas</code> and <code>pr</code>.',
    gCmip: 'The sixth Coupled Model Intercomparison Project, the coordinated set of climate model runs behind the IPCC\'s Sixth Assessment Report.',
    gSsp: 'Shared Socioeconomic Pathways. The first number is the storyline (2: middle of the road, 5: fossil-fuelled growth), the second the extra heating in watts per square metre by 2100.',
    gBaseT: 'Baseline', gBase: 'A 30-year reference period. Change is each model\'s value minus its own baseline average.',
    gEnsT: 'Ensemble mean and range', gEns: 'The average of the selected models, and the lowest to highest of them in a given year.',
    gSmoothT: '10-year average', gSmooth: 'Each point is the mean of the ten years around it, which removes year-to-year noise. The first and last five years have no full window, so the lines start in 1955 and end in 2096.',
    imprint: 'Vietnam Climate Scenario Explorer. Model output from CMIP6; scenario colours follow the IPCC AR6 visual style guide. Results describe climate models, not observations.',
    historical: 'Historical', baseline: 'Baseline', projections: 'Projections', rangeAcross: 'Range across models',
    eocAvgRange: '2071–2100 average and range', eocAvg: '2071–2100 average', baseLegend: '1985–2014 baseline',
    disagree: 'Models disagree on direction', perModel: 'One line per model, 10-year average',
    synthetic: 'Synthetic sample data, not real projections', badgeSynthetic: 'Synthetic sample data',
    tasUnit: '°C', prUnit: 'mm/month', tasLong: 'Annual mean temperature', prLong: 'Mean monthly rainfall',
    over: 'over Vietnam', changeFrom: 'change from', to: 'to', year: 'Year', model: 'Model',
    oneModelLeft: 'At least one model has to stay selected.', backReal: 'Back to CMIP6 data', backSample: 'Back to sample data',
    badJson: 'That file isn\'t valid JSON.', unchanged: 'Your current data is unchanged.',
    loadFail: 'Couldn\'t load the file. Serve the site over http(s), not file://.',
    aboutFail: 'The CMIP6 file <code>data/vietnam_cmip6.json</code> couldn\'t be loaded, usually because the page was opened straight from disk instead of through a web server. Until it loads, every chart here uses synthetic sample data.'
  }
};
const t = k => (S[LANG] && S[LANG][k]) ?? S.en[k] ?? k;

const SCEN = {ssp245: {name: 'SSP2-4.5', c: 'var(--s245)', long: () => t('medLong')}, ssp585: {name: 'SSP5-8.5', c: 'var(--s585)', long: () => t('highLong')}};
const VARS = {
  tas: {d: 1, unit: () => t('tasUnit'), long: () => t('tasLong')},
  pr: {d: 1, unit: () => t('prUnit'), long: () => t('prLong')}
};
const EN_NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const VI_NUM = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'mười một', 'mười hai'];
const numWord = n => (LANG === 'vi' ? VI_NUM : EN_NUM)[n] || String(n);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const period = (a, b) => `${a}–${b}`;

function applyStatic() {
  document.documentElement.lang = LANG;
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  $$('[data-i18n-attr]').forEach(el => {
    const [attr, key] = el.dataset.i18nAttr.split(':');
    el.setAttribute(attr, t(key));
  });
  $$('#langSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === LANG ? 'true' : 'false'));
}
/* folio date, short as a paper prints it: "Thứ Năm 19.11.2026" / "Thu 19 Nov 2026" */
const today = () => {
  const d = new Date();
  if (LANG === 'vi') return `${new Intl.DateTimeFormat('vi-VN', {weekday: 'long'}).format(d)} ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  return new Intl.DateTimeFormat('en-GB', {weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'}).format(d).replace(',', '');
};

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
function ens(list) {
  return d3.range(N_YEARS).map(i => {
    const v = list.map(a => a[i]);
    if (!v.length || v.some(q => q == null)) return {y: 1950 + i, mean: null, min: null, max: null};
    return {y: 1950 + i, mean: mean(v), min: d3.min(v), max: d3.max(v)};
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

/* ---------- facts for the narration ---------- */
function facts(D) {
  const ms = modelsOf(D), n = ms.length, bs = 1985;
  const anomTas = s => ens(ms.map(m => smoothC(full(D, 'tas', m, s).map(q => q - baseOf(D, 'tas', m, bs)))));
  const a245 = anomTas('ssp245'), a585 = anomTas('ssp585');
  let fork = null;
  for (let i = 65; i < N_YEARS; i++) if (a245[i].mean != null && a585[i].mean - a245[i].mean >= 0.5) { fork = 1950 + i; break; }
  const last = d3.max(d3.range(N_YEARS).filter(i => a245[i].mean != null));
  const L = ms.map(m => smoothC(full(D, 'pr', m, 'ssp585').map(q => q - baseOf(D, 'pr', m, bs))));
  const dis = disagreement(L, agreeNeed(n)), valid = d3.range(N_YEARS).map(i => L.every(a => a[i] != null));
  const share = (a, b) => { const xs = d3.range(a - 1950, b - 1950 + 1).filter(i => valid[i]); return xs.length ? Math.round(xs.filter(i => dis[i]).length / xs.length * 100) : 0; };
  return {
    D, n, ms,
    tb: ms.map(m => baseOf(D, 'tas', m, bs)),
    pb: ms.map(m => baseOf(D, 'pr', m, bs)),
    histW: ms.map(m => baseOf(D, 'tas', m, 1985) - baseOf(D, 'tas', m, 1950)),
    t: {ssp245: ms.map(m => eoc(D, 'tas', m, 'ssp245', bs).d), ssp585: ms.map(m => eoc(D, 'tas', m, 'ssp585', bs).d)},
    p: {ssp245: ms.map(m => eoc(D, 'pr', m, 'ssp245', bs).p), ssp585: ms.map(m => eoc(D, 'pr', m, 'ssp585', bs).p)},
    fork, endGap: a585[last].mean - a245[last].mean, endYear: 1950 + last,
    early: share(2015, 2049), late: share(2050, 1950 + last)
  };
}

/* ---------- copy built from the facts, per language ---------- */
function copy(F) {
  const deg = x => `${nf(x)}&nbsp;°C`, sdeg = x => `${sg(x)}&nbsp;°C`;
  const rngT = a => `${sg(d3.min(a))} ${t('to')} ${sg(d3.max(a))}&nbsp;°C`;
  const wet = s => F.p[s].filter(x => x > 0).length;
  const allP = F.p.ssp245.concat(F.p.ssp585);
  const tMin = d3.min(F.tb), tMax = d3.max(F.tb), pMin = d3.min(F.pb), pMax = d3.max(F.pb);
  const m245 = mean(F.t.ssp245), m585 = mean(F.t.ssp585), need = agreeNeed(F.n);
  const decade = Math.floor(F.endYear / 10) * 10;
  if (LANG === 'vi') return {
    h1: `Việt Nam sẽ nóng thêm bao nhiêu? <em>Từ ${nf(m245)} đến ${nf(m585)}&nbsp;°C</em>`,
    byline: `Đồ họa dữ liệu<span class="bydate">${today()}</span><span>Nguồn: CMIP6, ${F.n} mô hình</span>`,
    leadP1: `Đến giai đoạn 2071–2100, các mô hình dự tính nhiệt độ trung bình của Việt Nam tăng <b>${sdeg(m245)}</b> nếu phát thải giảm dần sau giữa thế kỷ (kịch bản SSP2-4.5), và <b>${sdeg(m585)}</b> nếu phát thải tiếp tục tăng (SSP5-8.5), so với thời kỳ cơ sở 1985–2014.`,
    pull: `${sdeg(m585)}<small>mức tăng 2071–2100 nếu phát thải tiếp tục tăng</small>`,
    cap: `Sọc ấm lên 1950–2100: mỗi sọc là một năm, tô theo mức thay đổi trung bình của ${F.n} mô hình so với 1985–2014. Dải trên: SSP2-4.5; dải dưới: SSP5-8.5.`,
    steps: {
      'tas-abs': `<h2>${cap(numWord(F.n))} mô hình, ${numWord(F.n)} Việt Nam</h2><p>Mô hình khí hậu chia Trái Đất thành lưới ô và mô phỏng không khí, đại dương, đất liền trong từng ô qua nhiều thập kỷ. Đây là ${numWord(F.n)} mô hình được dùng trong báo cáo mới nhất của IPCC, mỗi mô hình cho một đường nhiệt độ trung bình của Việt Nam từ 1950 đến 2014.</p><p>Chúng không thống nhất về khí hậu hiện tại. Với giai đoạn 1985–2014, nhiệt độ trung bình cả nước dao động từ <b>${deg(tMin)}</b> đến <b>${deg(tMax)}</b>, chênh nhau <b>${deg(tMax - tMin)}</b>. Mỗi mô hình vẽ núi non, bờ biển và gió mùa của Việt Nam hơi khác nhau, nên mỗi mô hình bắt đầu từ một khí hậu hơi khác.</p>`,
      'tas-anom': `<h2>Vì sao đo mức thay đổi</h2><p>Đem mỗi mô hình so với chính trung bình 1985–2014 của nó, các đường gần như chập lại. Các mô hình bất đồng về việc Việt Nam nóng đến đâu, nhưng kể một câu chuyện giống nhau hơn nhiều về việc Việt Nam đang thay đổi ra sao.</p><p>Từ 1950–1979 đến 1985–2014, trung bình các mô hình đã ấm lên <b>${sdeg(mean(F.histW))}</b>. Từ đây trở đi, mọi con số đều là mức thay đổi so với 1985–2014.</p>`,
      'tas-245': `<h2>Hai tương lai</h2><p>Điều xảy ra tiếp theo phụ thuộc vào phát thải. <b>SSP2-4.5</b> là con đường trung gian: phát thải giữ gần mức hiện nay đến khoảng giữa thế kỷ, rồi giảm dần.</p><p>Theo con đường đó, các mô hình dự tính <b>${sdeg(m245)}</b> cho giai đoạn 2071–2100 (từng mô hình: ${rngT(F.t.ssp245)}). Vùng tô màu là biên độ giữa các mô hình.</p>`,
      'tas-585': `<p><b>SSP5-8.5</b> là con đường phát thải cao, khi việc dùng nhiên liệu hóa thạch tiếp tục tăng suốt thế kỷ. Các mô hình dự tính <b>${sdeg(m585)}</b> (từng mô hình: ${rngT(F.t.ssp585)}).</p><p>${F.fork ? `Hai con đường đi sát nhau trong nhiều thập kỷ. Chúng cách nhau nửa độ vào khoảng năm <b>${F.fork}</b>, và khoảng cách lên tới <b>${deg(F.endGap)}</b> vào thập niên ${decade}.` : 'Hai con đường cách nhau không quá nửa độ suốt thế kỷ.'}</p><p>Khung tô xám đánh dấu giai đoạn 2071–2100, thời kỳ dùng cho mọi con số cuối thế kỷ trên trang này.</p>`,
      'pr-abs': `<h2>Lượng mưa mới là phần khó</h2><p>Lượng mưa khó mô phỏng hơn nhiệt độ. Nó phụ thuộc vào gió mùa, bão và địa hình mà lưới thô của mô hình chỉ thể hiện được một cách gần đúng.</p><p>Với giai đoạn 1985–2014, các mô hình cho Việt Nam lượng mưa từ <b>${nf(pMin, 0)}&nbsp;mm</b> đến <b>${nf(pMax, 0)}&nbsp;mm</b> mỗi tháng, chênh nhau <b>${nf((pMax - pMin) / pMin * 100, 0)}%</b>.</p>`,
      'pr-agree': `<p>Khi đo mức thay đổi, phần lớn mô hình cho thấy Việt Nam ẩm ướt hơn vào 2071–2100: <b>${wet('ssp245')}/${F.n}</b> mô hình theo SSP2-4.5 và <b>${wet('ssp585')}/${F.n}</b> theo SSP5-8.5. Nhưng chúng bất đồng về mức độ, từ <b>${sg(d3.min(allP))}%</b> đến <b>${sg(d3.max(allP))}%</b>.</p><div class="agree-wrap">${agreeTable(F)}</div>`,
      'pr-hatch': `<p>Phần gạch chéo trên biểu đồ đánh dấu những năm có ít hơn ${need}/${F.n} mô hình đồng ý về xu hướng ẩm hơn hay khô hơn.</p><p>Theo SSP5-8.5, ${F.early}% số năm từ 2015 đến 2049 bị gạch chéo, so với ${F.late}% từ 2050 trở đi.${F.early > F.late + 20 ? ' Trong những thập kỷ đầu, dao động tự nhiên của lượng mưa lớn ngang mức thay đổi; về sau, tín hiệu mới nổi rõ.' : ''}</p>`
    },
    source: `Nguồn: CMIP6, ${F.n} mô hình, trung bình năm có trọng số diện tích cho Việt Nam. Các đường là trung bình trượt 10 năm; mức thay đổi tính so với trung bình 1985–2014 của từng mô hình.`,
    stripesAria: `Sọc ấm lên của Việt Nam: mỗi sọc là một năm từ 1950 đến 2100, tô từ xanh (lạnh hơn) đến đỏ (nóng hơn) theo mức thay đổi trung bình của ${F.n} mô hình so với 1985–2014. Sau năm 2014, dải tách thành SSP2-4.5 ở trên và SSP5-8.5 ở dưới.`,
    keyLabel: 'Thay đổi so với trung bình 1985–2014',
    badge: `CMIP6 · ${F.n} mô hình`
  };
  return {
    h1: `How much warmer will Vietnam get? <em>${nf(m245)} to ${nf(m585)}&nbsp;°C</em>`,
    byline: `Data graphics<span class="bydate">${today()}</span><span>Source: CMIP6, ${F.n} models</span>`,
    leadP1: `By 2071–2100 the models project Vietnam's average temperature to rise <b>${sdeg(m245)}</b> if emissions fall slowly after mid-century (SSP2-4.5), and <b>${sdeg(m585)}</b> if they keep rising (SSP5-8.5), compared with the 1985–2014 baseline.`,
    pull: `${sdeg(m585)}<small>warming by 2071–2100 if emissions keep rising</small>`,
    cap: `Warming stripes 1950–2100: one stripe per year, coloured by the ${F.n}-model average change from 1985–2014. Upper band: SSP2-4.5; lower band: SSP5-8.5.`,
    steps: {
      'tas-abs': `<h2>${cap(numWord(F.n))} models, ${numWord(F.n)} Vietnams</h2><p>Climate models split the planet into a grid of boxes and simulate the air, ocean and land inside them over decades. These are ${numWord(F.n)} of the models used in the IPCC's latest assessment, each giving Vietnam's average temperature from 1950 to 2014.</p><p>They don't agree on today's climate. For 1985–2014 they put the national average anywhere from <b>${deg(tMin)}</b> to <b>${deg(tMax)}</b>, a gap of <b>${deg(tMax - tMin)}</b>. Each model draws Vietnam's mountains, coastline and monsoon a little differently, so each starts from a slightly different climate.</p>`,
      'tas-anom': `<h2>Why we measure change</h2><p>Compare each model with its own 1985–2014 average and the lines fall together. The models disagree about how warm Vietnam is, but they tell a much more similar story about how it is changing.</p><p>Between 1950–1979 and 1985–2014 their average warmed by <b>${sdeg(mean(F.histW))}</b>. From here on, every number is a change from 1985–2014.</p>`,
      'tas-245': `<h2>Two futures</h2><p>What happens next depends on emissions. <b>SSP2-4.5</b> is a middle path: emissions stay near today's level until about mid-century, then fall slowly.</p><p>On that path the models project <b>${sdeg(m245)}</b> for 2071–2100 (individual models: ${rngT(F.t.ssp245)}). The shading shows the range across models.</p>`,
      'tas-585': `<p><b>SSP5-8.5</b> is the high-emissions path, where fossil-fuel use keeps growing through the century. The models project <b>${sdeg(m585)}</b> (individual models: ${rngT(F.t.ssp585)}).</p><p>${F.fork ? `The two paths stay close for decades. They are half a degree apart by about <b>${F.fork}</b>, and the gap reaches <b>${deg(F.endGap)}</b> by the ${decade}s.` : 'The two paths stay within half a degree of each other through the century.'}</p><p>The shaded window marks 2071–2100, the period behind every end-of-century number on this page.</p>`,
      'pr-abs': `<h2>Rain is the hard part</h2><p>Rainfall is harder to simulate than temperature. It depends on monsoon winds, storms and mountains that a coarse model grid only roughly captures.</p><p>For 1985–2014 the models give Vietnam anywhere from <b>${nf(pMin, 0)}&nbsp;mm</b> to <b>${nf(pMax, 0)}&nbsp;mm</b> of rain a month, a difference of <b>${nf((pMax - pMin) / pMin * 100, 0)}%</b>.</p>`,
      'pr-agree': `<p>Measured as change, most models point to a wetter Vietnam by 2071–2100: <b>${wet('ssp245')} of ${F.n}</b> under SSP2-4.5 and <b>${wet('ssp585')} of ${F.n}</b> under SSP5-8.5. They disagree on how much, from <b>${sg(d3.min(allP))}%</b> to <b>${sg(d3.max(allP))}%</b>.</p><div class="agree-wrap">${agreeTable(F)}</div>`,
      'pr-hatch': `<p>Hatching on the chart marks years when fewer than ${need} of ${F.n} models agree on wetter or drier.</p><p>Under SSP5-8.5, ${F.early}% of the years from 2015 to 2049 are hatched, against ${F.late}% from 2050 on.${F.early > F.late + 20 ? ' In the early decades, natural ups and downs in rainfall are as large as the change; later, the signal stands out.' : ''}</p>`
    },
    source: `Source: CMIP6, ${F.n} models, area-weighted annual means for Vietnam. Lines are centred 10-year averages; change is from each model's own 1985–2014 average.`,
    stripesAria: `Warming stripes for Vietnam: one stripe per year from 1950 to 2100, coloured from blue (cooler) to red (warmer) by the ${F.n}-model average temperature change from 1985–2014. After 2014 the band splits into SSP2-4.5 above and SSP5-8.5 below.`,
    keyLabel: 'Change from the 1985–2014 average',
    badge: `CMIP6 · ${F.n} models`
  };
}
function agreeTable(F) {
  const rows = F.ms.map((m, i) => {
    const cell = x => `<td class="${x > 0 ? 'wet' : 'dry'}"><span>${sg(x)}%</span></td>`;
    return `<tr><th scope="row">${m}</th>${cell(F.p.ssp245[i])}${cell(F.p.ssp585[i])}</tr>`;
  }).join('');
  const capt = LANG === 'vi' ? 'Thay đổi lượng mưa 2071–2100 so với 1985–2014, theo mô hình' : 'Rainfall change by 2071–2100 compared with 1985–2014, by model';
  return `<table class="agree"><caption class="sr-only">${capt}</caption><thead><tr><th scope="col">${t('model')}</th><th scope="col">SSP2-4.5</th><th scope="col">SSP5-8.5</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/* ---------- warming stripes ---------- */
const stripeColor = d3.scaleDiverging([-1, 0, 4], v => d3.interpolateRdBu(1 - v)).clamp(true);
function drawStripes(D) {
  const ms = modelsOf(D);
  const an = s => ens(ms.map(m => full(D, 'tas', m, s).map(q => q - baseOf(D, 'tas', m, 1985))));
  const a245 = an('ssp245'), a585 = an('ssp585');
  const rects = [];
  for (let i = 0; i < N_YEARS; i++) {
    if (i < 65) rects.push({x: i, y: 0, h: 2, v: a245[i].mean});
    else { rects.push({x: i, y: 0, h: .993, v: a245[i].mean}); rects.push({x: i, y: 1.007, h: .993, v: a585[i].mean}); }
  }
  d3.select('#stripes').selectAll('rect').data(rects).join('rect')
    .attr('x', d => d.x).attr('y', d => d.y).attr('width', 1.04).attr('height', d => d.h).attr('fill', d => stripeColor(d.v));
  sizeStripeAxis();
}
function stripesKey(C) {
  const sw = d3.range(26).map(i => `<i style="background:${stripeColor(-1 + i * 0.2)}"></i>`).join('');
  $('#stripesKey').innerHTML = `<span>${C.keyLabel}</span><div class="key-row">${sw}</div>` +
    `<div class="key-ticks"><span>−1</span><span>0</span><span>+1</span><span>+2</span><span>+3</span><span>+4&nbsp;°C</span></div>`;
}
function sizeStripeAxis() {
  const band = $('.stripes-band'), svg = $('#stripes');
  if (band && svg) $('.stripes-axis').style.setProperty('--labels-w', (band.clientWidth - svg.clientWidth) + 'px');
}

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

/* ---------- explorer ---------- */
const ex = {v: 'tas', mode: 'anom', scen: new Set(['ssp245', 'ssp585']), models: new Set(), off: new Set(), bs: 1985, ind: false, smooth: true, yr: 2050};
const SAMPLE = synth();
let REAL = null, DATA = SAMPLE, source = 'sample', SITE = SAMPLE;
let activeShow = null;
let dataMsg = {key: null, n: 0, text: '', error: false};
const sel = () => modelsOf(DATA).filter(m => ex.models.has(m));

function exSeries(m, s) {
  const b = baseOf(DATA, ex.v, m, ex.bs);
  const x = full(DATA, ex.v, m, s).map(q => change(q, b, ex.v, ex.mode));
  return ex.smooth ? smoothC(x) : x;
}
/* the unit the chart shows: °C, mm/month, or % for rainfall change */
const exUnit = () => ex.mode === 'anom' && ex.v === 'pr' ? '%' : VARS[ex.v].unit();
const fmtV = v => ex.mode === 'anom' ? sg(v, VARS[ex.v].d) : nf(v, VARS[ex.v].d);
const withUnit = v => fmtV(v) + (exUnit() === '%' ? '%' : ' ' + exUnit());
/* 2071–2100 average per model, in the chart's units */
const exEoc = (m, s) => {
  const b = baseOf(DATA, ex.v, m, ex.bs), f = mean(DATA[ex.v][m][s].slice(56, 86));
  return change(f, b, ex.v, ex.mode);
};
function exBand(s) {
  const ms = sel(), L = ms.map(m => exSeries(m, s));
  const Sx = {}; ms.forEach((m, i) => { Sx[m] = L[i]; });
  return {S: Sx, e: ens(L), dis: disagreement(L, agreeNeed(ms.length))};
}

function announce(text) {
  clearTimeout(announce.t);
  announce.t = setTimeout(() => { $('#chartLiveAnnounce').textContent = text; }, 120);
}

function draw() {
  const el = $('#chart'), tip = $('#tip');
  const W = el.clientWidth || 640, narrow = W < 560;
  const H = Math.round(Math.max(300, Math.min(500, W * .52)));
  const mg = {t: 30, r: narrow ? 98 : 172, b: 32, l: narrow ? 44 : 54};
  const V = VARS[ex.v], ms = sel();
  const svg = d3.select(el).selectAll('svg').data([0]).join('svg').attr('width', W).attr('height', H).attr('aria-hidden', 'true');
  svg.selectAll('*').remove();
  tip.style.display = 'none';
  activeShow = null;
  if (!ms.length) return;

  const B = {ssp245: exBand('ssp245'), ssp585: exBand('ssp585')};
  const vis = Object.keys(SCEN).filter(s => ex.scen.has(s));
  const hist = B.ssp245.e.slice(0, 65).map((d, i) => ({...d, h: B.ssp245.dis[i]}));
  const fut = s => B[s].e.slice(64).map((d, i) => ({...d, h: B[s].dis[i + 64]}));
  const rows = hist.concat(...vis.map(fut)).filter(d => d.min != null);
  let lo = d3.min(rows, d => d.min), hi = d3.max(rows, d => d.max);
  if (ex.ind) ms.forEach(m => ['ssp245', ...vis].forEach(s => B[s].S[m].forEach((v, i) => { if (v == null || (i > 64 && !vis.includes(s))) return; lo = Math.min(lo, v); hi = Math.max(hi, v); })));
  const bars = vis.map(s => { const a = ms.map(m => exEoc(m, s)); return {s, lo: d3.min(a), hi: d3.max(a), m: mean(a)}; });
  bars.forEach(b => { lo = Math.min(lo, b.lo); hi = Math.max(hi, b.hi); });
  if (ex.mode === 'anom') { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  const x = d3.scaleLinear([1950, 2100], [mg.l, W - mg.r]), y = d3.scaleLinear([lo, hi], [H - mg.b, mg.t]).nice();
  const iw = W - mg.l - mg.r, ih = H - mg.b - mg.t;

  svg.append('defs').append('pattern').attr('id', 'hatch-ex').attr('patternUnits', 'userSpaceOnUse').attr('width', 7).attr('height', 7).attr('patternTransform', 'rotate(45)')
    .append('line').attr('class', 'hatch-line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 7);
  svg.append('text').attr('class', 'unit').attr('x', 0).attr('y', 14).text(ex.mode === 'anom' ? `${exUnit()} ${t('changeFrom')} ${period(ex.bs, ex.bs + 29)}` : V.unit());
  svg.append('rect').attr('class', 'basebox').attr('x', x(ex.bs)).attr('y', mg.t).attr('width', x(ex.bs + 29) - x(ex.bs)).attr('height', ih);
  if (!narrow) svg.append('text').attr('class', 'note').attr('x', x(ex.bs) + 5).attr('y', H - mg.b - 8).text(t('baseline'));
  if (vis.length) {
    svg.append('rect').attr('class', 'winbox').attr('x', x(2071)).attr('y', mg.t).attr('width', x(2100) - x(2071)).attr('height', ih);
    svg.append('text').attr('class', 'note').attr('x', x(2071) + 5).attr('y', mg.t + 14).text('2071–2100');
  }
  svg.append('g').attr('class', 'grid').attr('transform', `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(6).tickSize(-iw).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - mg.b})`).call(d3.axisBottom(x).ticks(narrow ? 5 : 8).tickFormat(d3.format('d')).tickSizeOuter(0));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(yTick(ex.mode)).tickSizeOuter(0));
  svg.append('line').attr('class', 'split').attr('x1', x(2014.5)).attr('x2', x(2014.5)).attr('y1', mg.t).attr('y2', H - mg.b);
  svg.append('text').attr('class', 'note').attr('x', x(2014.5) + 6).attr('y', mg.t + 14).text(t('projections'));
  if (ex.mode === 'anom') svg.append('line').attr('class', 'zero').attr('x1', mg.l).attr('x2', W - mg.r).attr('y1', y(0)).attr('y2', y(0));

  const area = d3.area().defined(d => d.min != null).x(d => x(d.y)).y0(d => y(d.min)).y1(d => y(d.max));
  const harea = d3.area().defined(d => d.min != null && d.h).x(d => x(d.y)).y0(d => y(d.min)).y1(d => y(d.max));
  const line = d3.line().defined(d => d.mean != null).x(d => x(d.y)).y(d => y(d.mean));
  const tline = d3.line().defined(d => d.v != null).x(d => x(d.y)).y(d => y(d.v));
  const parts = [{key: 'hist', c: 'var(--hist)', pts: hist, s: 'ssp245', a: 0, b: 65}].concat(vis.map(s => ({key: s, c: SCEN[s].c, pts: fut(s), s, a: 64, b: 151})));
  const showHatch = ex.v === 'pr' && ex.mode === 'anom' && ms.length > 1;

  parts.forEach(p => {
    svg.append('path').datum(p.pts).attr('d', area).style('fill', p.c).style('fill-opacity', p.key === 'hist' ? .16 : .18).style('stroke', p.c).style('stroke-opacity', .4);
    if (showHatch) svg.append('path').datum(p.pts).attr('d', harea).style('fill', 'url(#hatch-ex)');
  });
  if (ex.ind) parts.forEach(p => ms.forEach((m, mi) => {
    svg.append('path').datum(B[p.s].S[m].slice(p.a, p.b).map((v, i) => ({y: 1950 + p.a + i, v})))
      .attr('d', tline).style('fill', 'none').style('stroke', p.c).style('stroke-width', 1.25).style('stroke-dasharray', DASHES[mi % DASHES.length]).style('opacity', .75);
  }));
  parts.forEach(p => svg.append('path').datum(p.pts).attr('d', line).style('fill', 'none').style('stroke', p.c).style('stroke-width', 2.75).style('stroke-linejoin', 'round'));

  /* 2071–2100 bars in the right margin: model range plus the mean, labelled at the mean */
  const bx = s => W - mg.r + 12 + Object.keys(SCEN).indexOf(s) * 13;
  bars.forEach(b => {
    const c = SCEN[b.s].c;
    if (ms.length > 1) svg.append('rect').attr('x', bx(b.s)).attr('y', y(b.hi)).attr('width', 6).attr('height', Math.max(2, y(b.lo) - y(b.hi)))
      .style('fill', c).style('fill-opacity', .35).style('stroke', c).style('stroke-opacity', .6);
    svg.append('line').attr('x1', bx(b.s) - 3).attr('x2', bx(b.s) + 9).attr('y1', y(b.m)).attr('y2', y(b.m)).style('stroke', c).style('stroke-width', 2.5);
  });
  const ends = bars.map(b => ({s: b.s, txt: narrow ? withUnit(b.m) : `${SCEN[b.s].name} ${withUnit(b.m)}`, x: W - mg.r + 12 + 2 * 13 + 4, y: y(b.m) + 4}));
  spread(ends, 17, mg.t + 12, H - mg.b);
  ends.forEach(d => svg.append('text').attr('class', 'endlabel').attr('x', d.x).attr('y', d.y).style('fill', SCEN[d.s].c).text(d.txt));

  if (source === 'sample') svg.append('text').attr('class', 'watermark').attr('x', mg.l + 8).attr('y', mg.t + 34).text(t('synthetic'));

  const fg = svg.append('g').style('display', 'none');
  const vl = fg.append('line').attr('class', 'vline').attr('y1', mg.t).attr('y2', H - mg.b);
  const [minY, maxY] = ex.smooth ? [1955, 2096] : [1950, 2100];

  function show(yr, aria = false) {
    yr = Math.max(minY, Math.min(vis.length ? maxY : 2014, yr));
    const i = yr - 1950;
    const list = yr <= 2014 ? [{n: t('historical'), c: 'var(--hist)', d: B.ssp245.e[i]}] : vis.map(s => ({n: SCEN[s].name, c: SCEN[s].c, d: B[s].e[i]}));
    if (!list.length || list.some(l => l.d.mean == null)) return;
    ex.yr = yr;
    fg.style('display', null);
    vl.attr('x1', x(yr)).attr('x2', x(yr));
    fg.selectAll('circle').data(list).join('circle').attr('cx', x(yr)).attr('cy', d => y(d.d.mean)).attr('r', 4.5).style('fill', d => d.c).style('stroke', 'var(--surface)').style('stroke-width', 1.5);
    const range = l => ms.length > 1 ? ` <span class="muted">(${fmtV(l.d.min)} ${t('to')} ${fmtV(l.d.max)})</span>` : '';
    const note = ms.length > 1 ? (LANG === 'vi' ? `Trung bình ${ms.length} mô hình, biên độ trong ngoặc` : `Average of ${ms.length} models, range in brackets`) : ms[0];
    tip.innerHTML = `<div class="tip-y">${yr}</div>` + list.map(l => `<div class="tip-r"><span class="sw" style="--c:${l.c}"></span>${l.n}: <b>${withUnit(l.d.mean)}</b>${range(l)}</div>`).join('') +
      `<div class="tip-n">${note}${ex.smooth ? ' · ' + t('smooth10').toLowerCase() : ''}</div>`;
    tip.style.display = 'block';
    tip.setAttribute('aria-hidden', 'false');
    const w = tip.offsetWidth, h = tip.offsetHeight, px = x(yr), top = d3.min(list, l => y(l.d.max));
    tip.style.left = (px + 14 + w > W ? Math.max(0, px - w - 14) : px + 14) + 'px';
    tip.style.top = Math.max(mg.t, Math.min(H - mg.b - h, top - h - 10)) + 'px';
    if (aria) announce(`${yr}: ` + list.map(l => `${l.n} ${withUnit(l.d.mean)}` + (ms.length > 1 ? `, ${fmtV(l.d.min)} ${t('to')} ${fmtV(l.d.max)}` : '')).join('; '));
  }
  const hide = () => { fg.style('display', 'none'); tip.style.display = 'none'; tip.setAttribute('aria-hidden', 'true'); };
  activeShow = show;
  activeShow.hide = hide;
  svg.append('rect').attr('x', mg.l).attr('y', mg.t).attr('width', iw).attr('height', ih).attr('fill', 'transparent').style('touch-action', 'pan-y')
    .on('pointermove pointerdown', e => show(Math.round(x.invert(d3.pointer(e)[0]))))
    .on('pointerleave', e => { if (e.pointerType === 'mouse') hide(); });
}

$('#chart').addEventListener('keydown', e => {
  if (!activeShow) return;
  let yr = ex.yr || 2050, handled = true;
  const step = e.shiftKey ? 10 : 1;
  if (e.key === 'ArrowLeft') yr -= step;
  else if (e.key === 'ArrowRight') yr += step;
  else if (e.key === 'Home') yr = 1950;
  else if (e.key === 'End') yr = 2100;
  else if (e.key === 'Escape') { activeShow.hide(); e.preventDefault(); return; }
  else handled = false;
  if (handled) { e.preventDefault(); activeShow(yr, true); }
});
$('#chart').addEventListener('blur', () => { if (activeShow) activeShow.hide(); });

function labels() {
  const V = VARS[ex.v], anom = ex.mode === 'anom', n = sel().length, bp = period(ex.bs, ex.bs + 29);
  const vi = LANG === 'vi';
  $('#blabel').textContent = bp;
  $('#statsHeading').textContent = vi ? `2071–2100 so với ${bp}` : `2071–2100 compared with ${bp}`;
  $('#ctitle').textContent = `${V.long()} ${t('over')}${anom ? `, ${t('changeFrom')} ${bp}` : ''}`;
  $('#chart').setAttribute('aria-label', `${V.long()} ${t('over')}, 1950–2100${anom ? `, ${t('changeFrom')} ${bp}` : ''}`);
  const warn = source === 'sample' ? `<span class="warn">${t('synthetic')}.</span> ` : '';
  const lines = n > 1
    ? (vi ? `Đường là trung bình của ${n} mô hình; vùng tô là biên độ giữa chúng.` : `Lines show the average of ${n} models; shading shows their range.`)
    : (vi ? `Chỉ hiển thị một mô hình, ${sel()[0]}.` : `Showing one model, ${sel()[0]}.`);
  const sm = ex.smooth ? (vi ? ' Làm trơn bằng trung bình 10 năm.' : ' Smoothed with a 10-year average.') : (vi ? ' Giá trị từng năm, không làm trơn.' : ' Annual values, not smoothed.');
  $('#csub').innerHTML = warn + lines + sm;

  const vis = Object.keys(SCEN).filter(s => ex.scen.has(s));
  let lg = `<span><i class="ln" style="--c:var(--hist)"></i><b>${t('historical')}</b> 1950–2014</span>` +
    vis.map(s => `<span><i class="ln" style="--c:${SCEN[s].c}"></i><b>${SCEN[s].name}</b> ${SCEN[s].long()}</span>`).join('');
  if (n > 1) lg += `<span><i class="bandsw"></i>${t('rangeAcross')}</span>`;
  if (vis.length) lg += `<span><i class="eocsw"></i>${n > 1 ? t('eocAvgRange') : t('eocAvg')}</span>`;
  if (ex.v === 'pr' && anom && n > 1) lg += `<span><i class="hatchsw"></i>${vi ? `Ít hơn ${agreeNeed(n)}/${n} mô hình đồng ý về ẩm hơn hay khô hơn` : `Fewer than ${agreeNeed(n)} of ${n} models agree on wetter or drier`}</span>`;
  if (ex.ind) lg += `<span class="models">` + sel().map((m, mi) => `<span><svg aria-hidden="true"><line x1="0" y1="4" x2="24" y2="4" stroke="currentColor" stroke-width="2" stroke-dasharray="${DASHES[mi % DASHES.length]}"/></svg>${m}</span>`).join('') + `</span>`;
  $('#legend').innerHTML = lg;
}

function stats() {
  const box = $('#stats'), ms = sel(), n = ms.length, vi = LANG === 'vi';
  const vis = Object.keys(SCEN).filter(s => ex.scen.has(s));
  if (!vis.length) {
    box.innerHTML = vi ? '<p class="stat-empty"><b>Chưa chọn kịch bản.</b> Hãy chọn SSP2-4.5 hoặc SSP5-8.5 để xem kết quả cuối thế kỷ.</p>'
      : '<p class="stat-empty"><b>No scenario selected.</b> Tick SSP2-4.5 or SSP5-8.5 to see end-of-century results.</p>';
    return;
  }
  box.innerHTML = vis.map(s => {
    const ch = ms.map(m => eoc(DATA, ex.v, m, s, ex.bs));
    const md = mean(ch.map(c => c.d)), mp = mean(ch.map(c => c.p));
    const key = ex.v === 'tas' ? 'd' : 'p', u = ex.v === 'tas' ? ' °C' : '%';
    const lo = d3.min(ch, c => c[key]), hi = d3.max(ch, c => c[key]);
    const up = ch.filter(c => c.d > 0).length;
    let agree;
    if (vi) {
      const w = ex.v === 'tas' ? ['ấm lên', 'lạnh đi'] : ['ẩm hơn', 'khô hơn'];
      agree = up === n ? `Cả ${n} mô hình đều dự tính ${w[0]}.` : up === 0 ? `Cả ${n} mô hình đều dự tính ${w[1]}.` : `${up}/${n} mô hình dự tính ${w[0]}; ${n - up} dự tính ${w[1]}.`;
    } else {
      const w = ex.v === 'tas' ? ['warming', 'cooling'] : ['wetter conditions', 'drier conditions'];
      agree = up === n ? `All ${n} models project ${w[0]}.` : up === 0 ? `All ${n} models project ${w[1]}.` : `${up} of ${n} models project ${w[0]}; ${n - up} ${n - up === 1 ? 'projects' : 'project'} ${w[1]}.`;
    }
    const big = ex.v === 'tas' ? `${sg(md)}<small> °C</small>` : `${sg(mp)}%<small> ${sg(md)} ${t('prUnit')}</small>`;
    const detail = n > 1
      ? (vi ? `Các mô hình dao động từ <b>${sg(lo)}${u}</b> đến <b>${sg(hi)}${u}</b>. ${agree}` : `Models range from <b>${sg(lo)}${u}</b> to <b>${sg(hi)}${u}</b>. ${agree}`)
      : (vi ? 'Chỉ chọn một mô hình nên không có biên độ hay mức đồng thuận.' : 'Only one model is selected, so there is no range or agreement to show.');
    return `<div class="stat"><div class="stat-head"><i class="sw" style="--c:${SCEN[s].c}"></i>${SCEN[s].name} <span class="muted">${SCEN[s].long()}</span></div><div class="big">${big}</div><p>${detail}</p></div>`;
  }).join('');
}

function buildTable() {
  const ms = sel(), V = VARS[ex.v];
  const B = {ssp245: exBand('ssp245'), ssp585: exBand('ssp585')};
  const cell = d => d.mean == null ? '<td>—</td>' : `<td>${fmtV(d.mean)}${ms.length > 1 ? ` <span class="range">(${fmtV(d.min)} ${t('to')} ${fmtV(d.max)})</span>` : ''}</td>`;
  const rows = [1960, 1980, 2000, 2014, 2030, 2050, 2070, 2090].map(yr => {
    const i = yr - 1950, h = yr <= 2014;
    return `<tr><th scope="row">${yr}</th>${h ? cell(B.ssp245.e[i]) : '<td>—</td>'}` +
      Object.keys(SCEN).map(s => !h && ex.scen.has(s) ? cell(B[s].e[i]) : '<td>—</td>').join('') + '</tr>';
  }).join('');
  const what = `${V.long()}${ex.mode === 'anom' ? ' (' + t('changeFrom') + ' ' + period(ex.bs, ex.bs + 29) + ')' : ''}, ${exUnit()}`;
  $('#accessibleTable').innerHTML = `<table class="data-table"><caption class="sr-only">${what}</caption>` +
    `<thead><tr><th scope="col">${t('year')}</th><th scope="col">${t('historical')}</th><th scope="col">SSP2-4.5</th><th scope="col">SSP5-8.5</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function render() { labels(); draw(); stats(); buildTable(); }

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
  source = src; DATA = d;
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

/* ---------- story wiring ---------- */
const story = StoryChart($('#storyChart'));
const STEP_CHAPTER = {'tas-abs': 'ch-models', 'tas-anom': 'ch-change', 'tas-245': 'ch-futures', 'tas-585': 'ch-futures', 'pr-abs': 'ch-rain', 'pr-agree': 'ch-rain', 'pr-hatch': 'ch-rain'};
let activeStep = null, stepObserver = null;
function markChapter(id) { $$('.chapters a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'true' : 'false')); }
function activate(step) {
  const k = step.dataset.step;
  if (k === activeStep) return;
  activeStep = k;
  $$('.step').forEach(s => s.classList.toggle('is-active', s === step));
  story.render(k, true);
  markChapter(STEP_CHAPTER[k]);
}
function observeSteps() {
  if (stepObserver) stepObserver.disconnect();
  const mobile = window.matchMedia('(max-width: 820px)').matches;
  stepObserver = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) activate(en.target.closest('.step')); });
  }, {rootMargin: mobile ? '-62% 0px -30% 0px' : '-45% 0px -45% 0px'});
  /* watch the text, not the tall step block, so the chart changes when its words arrive */
  $$('.step-body').forEach(s => stepObserver.observe(s));
}
new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) markChapter('explore'); }), {rootMargin: '-40% 0px -50% 0px'}).observe($('#explore'));

let resizeT = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => { draw(); story.redraw(); sizeStripeAxis(); observeSteps(); }, 150);
});

/* ---------- page text from data, in the current language ---------- */
function writePage() {
  applyStatic();
  const F = facts(SITE), C = copy(F);
  /* print setting for justified columns: number and unit joined by a narrow no-break space
     (justification never stretches it), scenario names never split at their hyphen */
  const pr = s => s.replace(/&nbsp;(°C|mm)/g, ' $1').replace(/SSP(\d)-(\d\.\d)/g, '<span class="nw">SSP$1-$2</span>');
  $('#heroTitle').innerHTML = REAL ? C.h1 : `${C.h1.split('<em>')[0]}<em>${t('synthetic')}</em>`;
  $('#byline').innerHTML = C.byline;
  $('#leadP1').innerHTML = pr(C.leadP1);
  $('#pull').innerHTML = pr(C.pull);
  $('#stripesCap').innerHTML = pr(REAL ? C.cap : `${t('synthetic')}. ${C.cap}`);
  $('#stripesFig').setAttribute('aria-label', C.stripesAria);
  stripesKey(C);
  $$('.step-body').forEach(b => { b.innerHTML = pr(C.steps[b.dataset.text]); });
  $('#storySource').textContent = REAL ? C.source : `${t('synthetic')}.`;
  const badge = $('#dataBadge');
  badge.className = 'data-badge ' + (REAL ? 'real' : 'synthetic');
  /* the folio line: date, then the data edition */
  badge.innerHTML = `<span class="d">${today()}</span><span class="sep"> · </span>${REAL ? C.badge : t('badgeSynthetic')}`;
  if (!REAL) $('#aboutData').innerHTML = t('aboutFail');
  if (!REAL) $('#realBtn').title = t('loadFail');
  $('#resetBtn').textContent = REAL ? t('backReal') : t('backSample');
  baseAria();
  showDataMsg();
}
function setLang(l) {
  if (l === LANG) return;
  LANG = l;
  try { localStorage.setItem('lang', l); } catch (_) { /* per-viewer convenience only */ }
  writePage();
  $('#modelHint').textContent = '';
  story.redraw();
  render();
  sizeStripeAxis();
}
$('#langSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setLang(b.dataset.lang); });

/* ---------- init ---------- */
async function init() {
  applyStatic();
  try {
    const r = await fetch(REAL_URL);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    checkData(d);
    REAL = d;
  } catch (err) {
    console.warn('CMIP6 data not loaded:', err);
    $('#realBtn').disabled = true;
  }
  SITE = REAL || SAMPLE;
  drawStripes(SITE);
  writePage();
  story.setData(SITE);
  const first = $('.step');
  activeStep = first.dataset.step;
  first.classList.add('is-active');
  story.render(activeStep, false);
  observeSteps();
  useData(REAL ? 'real' : 'sample', SITE);
}
init();
