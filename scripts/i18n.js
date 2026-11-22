'use strict';
/* Language: the Vietnamese and English strings, locale number formats, static text. */

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
    navModels: 'Mô hình', navChange: 'Thay đổi', navFutures: 'Hai tương lai', navRegions: 'Các vùng', navRain: 'Lượng mưa', navDrought: 'Khô hạn', navLives: 'Đời sống', navExplore: 'Tự khám phá',
    navFork: 'Đã gần định sẵn', navClose: 'Hai việc',
    actAnd: 'Điều ta biết', actBut: 'Nhưng', actThen: 'Vì vậy',
    navHanoiKicker: 'Bài riêng', navHanoi: 'Hà\u00a0Nội nóng lên',
    ctlRegion: 'Vùng', allVn: 'Cả nước', noModelData: 'không có dữ liệu mô hình', regionOnlyReal: 'Số liệu từng vùng chỉ có với dữ liệu CMIP6.',
    mapTitle: 'Thay đổi nhiệt độ 2071–2100 so với 1985–2014, trung vị các mô hình', mapTitleShort: 'Thay đổi nhiệt độ 2071–2100', gridKey: 'Ô lưới của', seaName: 'Biển Đông',
    nbChina: 'TRUNG QUỐC', nbLaos: 'LÀO', nbCambodia: 'CAMPUCHIA',
    langLabel: 'Ngôn ngữ', themeLabel: 'Giao diện', themeLight: 'Giao diện sáng', themeDark: 'Giao diện tối', storyLabel: 'Bài viết theo chương',
    medShort: 'trung bình', highShort: 'cao', medLong: 'phát thải trung bình', highLong: 'phát thải cao',
    sapo: 'Năm mô hình khí hậu CMIP6 cùng cho thấy Việt Nam tiếp tục nóng lên trong thế kỷ này. Mức tăng vào cuối thế kỷ phụ thuộc vào con đường phát thải mà thế giới lựa chọn.',
    leadP2: 'CMIP6 là dự án so sánh các mô hình khí hậu, nền tảng của báo cáo mới nhất của IPCC. Mỗi sọc trong hình là một năm: xanh là lạnh hơn, đỏ là nóng hơn trung bình 1985–2014. Từ năm 2015, dải sọc tách đôi theo hai con đường phát thải.',
    jumpStory: 'Xem tiếp: Năm mô hình, năm Việt Nam', jumpStoryPg: '(chương 1)', jumpExplore: 'Tự khám phá số liệu', jumpExplorePg: '(cuối trang)',
    jumpHanoi: 'Hà\u00a0Nội: bao nhiêu ngày nắng nóng khi Trái Đất nóng thêm 2 °C?', jumpHanoiPg: '(bài riêng)',
    exploreBlock: 'Tự khám phá', exploreTitle: 'Tự khám phá các dự tính',
    exploreIntro: 'Chọn vùng, biến, kịch bản và mô hình. Biểu đồ và phần tóm tắt 2071–2100 cập nhật ngay khi bạn thay đổi.',
    chartHelp: 'Rê chuột hoặc chạm vào biểu đồ để đọc từng năm. Khi biểu đồ đang được chọn, <kbd>←</kbd> <kbd>→</kbd> chuyển một năm, <kbd>Shift</kbd> + mũi tên chuyển mười năm, <kbd>Home</kbd> và <kbd>End</kbd> về hai đầu.',
    tableSummary: 'Các năm mốc dạng bảng', railLabel: 'Điều khiển biểu đồ',
    ctlVariable: 'Biến', varTas: 'Nhiệt độ', varPr: 'Lượng mưa', ctlValues: 'Cách hiển thị', modeAnom: 'Thay đổi', modeAbs: 'Tuyệt đối',
    ctlBaseline: 'Thời kỳ cơ sở', baselineNote: '30 năm dùng làm mốc cho mức thay đổi và phần tóm tắt.',
    ctlScenarios: 'Kịch bản', ctlModels: 'Mô hình', allModels: 'Chọn tất cả mô hình', ctlDisplay: 'Hiển thị', showEach: 'Hiện từng mô hình', smooth10: 'Trung bình 10 năm',
    ctlData: 'Dữ liệu', ctlAdvanced: 'Dữ liệu nâng cao: nguồn và tệp của bạn', srcReal: 'Dữ liệu CMIP6', srcSample: 'Mẫu tổng hợp', loadJson: 'Tải tệp JSON của bạn', dlExample: 'Tải tệp JSON mẫu',
    aboutBlock: 'Dữ liệu', aboutTitle: 'Về dữ liệu',
    aboutData: 'Kết quả CMIP6 lấy từ <code>data/vietnam_cmip6.json</code> (cả nước) và <code>data/vietnam_regions.json</code> (bảy vùng khí hậu): mỗi năm, mỗi mô hình một giá trị trung bình năm, trong đó mỗi ô lưới được tính theo phần diện tích đất liền nó chung với Việt Nam hoặc với vùng. Cả hai tệp được dựng từ kho dữ liệu CMIP6 mà NOAA công bố trên Google Cloud bằng <code>pipeline/build_data.py</code>.',
    aboutRuns: 'Mỗi mô hình đóng góp một lần chạy: r1i1p1f1, riêng CESM2 là r4i1p1f1, lần chạy đầu tiên có đủ cả ba thí nghiệm trong kho. Các lần chạy lịch sử phủ giai đoạn 1950–2014 với khí nhà kính, sol khí, núi lửa và biến động Mặt Trời theo quan trắc; hai kịch bản tiếp nối từ 2015 đến 2100. Ranh giới vùng ghép từ 63 tỉnh cũ (trước sáp nhập 2025) theo bản đồ Natural Earth.',
    ownTitle: 'Dùng kết quả CMIP6 của bạn',
    ownText: 'Xuất mỗi năm một giá trị cho từng mô hình rồi tải tệp lên ở phần tự khám phá. Nhiệt độ tính bằng °C, lượng mưa bằng mm mỗi tháng. <code>historical</code> cần 65 giá trị (1950–2014), mỗi kịch bản cần 86 giá trị (2015–2100). Mỗi mô hình phải có mặt ở cả <code>tas</code> và <code>pr</code>.',
    gCmip: 'Dự án So sánh Mô hình Khí hậu Kết hợp lần thứ sáu: bộ các lần chạy mô hình khí hậu đứng sau Báo cáo Đánh giá lần thứ Sáu của IPCC.',
    gSsp: 'Các Lộ trình Kinh tế – Xã hội Chung. Số đầu là kịch bản phát triển (2: trung dung, 5: tăng trưởng dựa vào nhiên liệu hóa thạch), số sau là mức tăng bức xạ vào năm 2100, tính bằng oát trên mét vuông.',
    gBaseT: 'Thời kỳ cơ sở', gBase: 'Giai đoạn 30 năm dùng làm mốc. Mức thay đổi là giá trị của mỗi mô hình trừ trung bình thời kỳ cơ sở của chính mô hình đó.',
    gEnsT: 'Trung vị và biên độ tổ hợp', gEns: 'Trung vị của các mô hình được chọn (một nửa cao hơn, một nửa thấp hơn), và khoảng từ thấp nhất đến cao nhất của chúng trong một năm.',
    gSmoothT: 'Trung bình 10 năm', gSmooth: 'Mỗi điểm là trung bình của mười năm quanh nó, loại bỏ dao động từng năm. Năm năm đầu và cuối không đủ cửa sổ, nên đường bắt đầu từ 1955 và kết thúc năm 2096.',
    imprint: 'Kịch bản khí hậu Việt Nam (Vietnam Climate Scenario Explorer). Dữ liệu mô hình CMIP6; màu kịch bản theo hướng dẫn trình bày của IPCC AR6. Kết quả mô tả mô hình khí hậu, không phải số liệu quan trắc.',
    historical: 'Lịch sử', baseline: 'Cơ sở', projections: 'Dự tính', rangeAcross: 'Biên độ giữa các mô hình',
    eocAvgRange: 'Trung vị và biên độ 2071–2100', eocAvg: 'Trung bình 2071–2100', baseLegend: 'Thời kỳ cơ sở 1985–2014',
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
    navModels: 'Models', navChange: 'Change', navFutures: 'Two futures', navRegions: 'Regions', navRain: 'Rain', navDrought: 'Drought', navLives: 'Lives', navExplore: 'Explorer',
    navFork: 'Mostly set', navClose: 'Two jobs',
    actAnd: 'What we know', actBut: 'But', actThen: 'Therefore',
    navHanoiKicker: 'Special report', navHanoi: 'Hanoi heats up',
    ctlRegion: 'Region', allVn: 'All of Vietnam', noModelData: 'no model data', regionOnlyReal: 'Regional series exist only for the CMIP6 data.',
    mapTitle: 'Temperature change by 2071–2100 from 1985–2014, model median', mapTitleShort: 'Warming by 2071–2100', gridKey: 'Grid cells of', seaName: 'East Sea',
    nbChina: 'CHINA', nbLaos: 'LAOS', nbCambodia: 'CAMBODIA',
    langLabel: 'Language', themeLabel: 'Theme', themeLight: 'Light theme', themeDark: 'Dark theme', storyLabel: 'Story in chapters',
    medShort: 'medium', highShort: 'high', medLong: 'medium emissions', highLong: 'high emissions',
    sapo: 'Five CMIP6 climate models agree that Vietnam will keep warming this century. How much by the end of the century depends on the emissions path the world takes.',
    leadP2: 'CMIP6 is the model comparison project behind the IPCC\'s latest assessment. Each stripe in the figure is one year: blue is cooler and red warmer than the 1985–2014 average. From 2015 the band splits along the two emissions paths.',
    jumpStory: 'Continued: five models, five Vietnams', jumpStoryPg: '(chapter 1)', jumpExplore: 'Explore the numbers yourself', jumpExplorePg: '(end of page)',
    jumpHanoi: 'Hanoi: how many hot days in a world 2 °C warmer?', jumpHanoiPg: '(special report)',
    exploreBlock: 'Explorer', exploreTitle: 'Your turn: explore the projections',
    exploreIntro: 'Choose a region, a variable, scenarios and models. The chart and the 2071–2100 summary update as you go.',
    chartHelp: 'Hover or tap the chart to read a year. With the chart focused, <kbd>←</kbd> <kbd>→</kbd> move one year, <kbd>Shift</kbd> + arrow moves ten, <kbd>Home</kbd> and <kbd>End</kbd> jump to the ends.',
    tableSummary: 'Milestone years as a table', railLabel: 'Chart controls',
    ctlVariable: 'Variable', varTas: 'Temperature', varPr: 'Rainfall', ctlValues: 'Values', modeAnom: 'Change', modeAbs: 'Absolute',
    ctlBaseline: 'Baseline', baselineNote: 'The 30 years that change and the summary are measured against.',
    ctlScenarios: 'Scenarios', ctlModels: 'Models', allModels: 'Select all models', ctlDisplay: 'Display', showEach: 'Show each model', smooth10: '10-year average',
    ctlData: 'Data', ctlAdvanced: 'Advanced: data source and your own file', srcReal: 'CMIP6 data', srcSample: 'Synthetic sample', loadJson: 'Load your JSON', dlExample: 'Download example JSON',
    aboutBlock: 'Data', aboutTitle: 'About the data',
    aboutData: 'The CMIP6 results come from <code>data/vietnam_cmip6.json</code> (national) and <code>data/vietnam_regions.json</code> (seven climate zones): one annual mean per year and model, with each grid cell weighted by the land area it shares with Vietnam or the zone. <code>pipeline/build_data.py</code> builds both from the CMIP6 archive that NOAA publishes on Google Cloud.',
    aboutRuns: 'Each model contributes one run: r1i1p1f1, except CESM2, which uses r4i1p1f1, the first run the archive holds for all three experiments. Historical runs cover 1950–2014 and are driven by observed greenhouse gases, aerosols, volcanic eruptions and solar changes; the two scenarios continue from 2015 to 2100. Zone boundaries merge the 63 provinces as they stood before the 2025 mergers, from Natural Earth.',
    ownTitle: 'Use your own CMIP6 results',
    ownText: 'Export one value per year for each model and load the file in the explorer. Temperature is in °C and rainfall in mm per month. <code>historical</code> needs 65 values (1950–2014) and each scenario 86 values (2015–2100). Every model must appear under both <code>tas</code> and <code>pr</code>.',
    gCmip: 'The sixth Coupled Model Intercomparison Project, the coordinated set of climate model runs behind the IPCC\'s Sixth Assessment Report.',
    gSsp: 'Shared Socioeconomic Pathways. The first number is the storyline (2: middle of the road, 5: fossil-fuelled growth), the second the extra heating in watts per square metre by 2100.',
    gBaseT: 'Baseline', gBase: 'A 30-year reference period. Change is each model\'s value minus its own baseline average.',
    gEnsT: 'Ensemble median and range', gEns: 'The median of the selected models (half are higher, half lower), and the lowest to highest of them in a given year.',
    gSmoothT: '10-year average', gSmooth: 'Each point is the mean of the ten years around it, which removes year-to-year noise. The first and last five years have no full window, so the lines start in 1955 and end in 2096.',
    imprint: 'Vietnam Climate Scenario Explorer. Model output from CMIP6; scenario colours follow the IPCC AR6 visual style guide. Results describe climate models, not observations.',
    historical: 'Historical', baseline: 'Baseline', projections: 'Projections', rangeAcross: 'Range across models',
    eocAvgRange: '2071–2100 median and range', eocAvg: '2071–2100 average', baseLegend: '1985–2014 baseline',
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
