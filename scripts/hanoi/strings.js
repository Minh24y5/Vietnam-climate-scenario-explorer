'use strict';
/* Hà Nội page: static strings in both languages, merged over the shared table in scripts/i18n.js,
   plus the indicator and warming-level definitions. */

const HN_URL = 'data/hanoi/hanoi.json';

Object.assign(S.vi, {
  skip: 'Bỏ qua, đến phần tự khám phá', section: 'Hà\u00a0Nội', nameplate: 'Kịch bản khí hậu Việt Nam', navLabel: 'Các chương',
  navPast: 'Đã trải qua', navLevels: 'Mức ấm lên', navHeat: 'Nắng nóng', navRain: 'Mưa', navEarly: 'Đến sớm', navClose: 'Chuẩn bị cho +2\u00a0°C', navExplore: 'Tự khám phá',
  actAnd: 'Điều ta biết', actBut: 'Nhưng', actThen: 'Vì vậy',
  navNationalKicker: 'Trang chính', navNational: 'Cả nước',
  storyLabel: 'Bài viết theo chương',
  jumpStory: 'Xem tiếp: Những gì Hà\u00a0Nội đã trải qua', jumpStoryPg: '(chương 1)',
  jumpNational: 'Cả nước: Việt Nam sẽ nóng thêm bao nhiêu?', jumpNationalPg: '(trang chính)',
  exploreTitle: 'Tự khám phá Hà\u00a0Nội ở từng mức ấm lên',
  exploreIntro: 'Chọn một chỉ số. Mỗi chấm là một mô hình; bạn có thể làm nổi một mô hình để theo nó qua các mức ấm lên.',
  chartHelp: 'Rê chuột hoặc chạm vào một chấm để đọc tên mô hình và giá trị. Khi biểu đồ đang được chọn, <kbd>←</kbd> <kbd>→</kbd> chuyển giữa các cột, <kbd>↑</kbd> <kbd>↓</kbd> chuyển giữa các mô hình, <kbd>Home</kbd> và <kbd>End</kbd> về hai đầu, <kbd>Esc</kbd> để bỏ chọn.',
  tableSummary: 'Giá trị từng mô hình dạng bảng', railLabel: 'Điều khiển biểu đồ',
  ctlIndicator: 'Chỉ số', ctlValues: 'Cách hiển thị', modeAbs: 'Giá trị', modeAnom: 'Thay đổi',
  modeNote: 'Thay đổi tính so với 1995–2014 của chính mỗi mô hình.', ctlHighlight: 'Làm nổi một mô hình', hlNone: 'Không chọn',
  aboutTitle: 'Về dữ liệu và phương pháp',
  aboutData: 'Mọi con số trên trang này là trung bình toàn thành phố Hà Nội, lấy từ <a href="https://doi.org/10.1038/s41597-023-02159-2">CMIP6-VN</a> (Tran-Anh et al., 2023): 35 mô hình CMIP6 được hiệu chỉnh sai số theo 147 trạm đo nhiệt độ và 481 trạm đo mưa của Việt Nam, chi tiết tới ô lưới 0,1° (khoảng 11&nbsp;km). Phần quan trắc 1980–2014 là bộ số liệu dạng lưới mà CMIP6-VN dùng để hiệu chỉnh; từ 2015 là tái phân tích <a href="https://doi.org/10.5194/essd-13-4349-2021">ERA5-Land</a> (nhiệt độ) và ERA5 (mưa) của Copernicus, lấy qua <a href="https://open-meteo.com/">Open-Meteo</a> và hiệu chỉnh theo số liệu lưới bằng ánh xạ phân vị từng tháng. Mỗi ô lưới được tính theo phần diện tích nằm trong ranh giới Hà Nội (Natural Earth; ranh giới thành phố không đổi sau sắp xếp năm 2025).',
  aboutLevels: 'Mức ấm lên toàn cầu của mỗi mô hình được tính từ nhiệt độ trung bình toàn cầu của chính nó trong kho CMIP6 trên Google Cloud, theo cách của IPCC AR6: trung bình trượt 20 năm so với 1850–1900, lấy năm đầu tiên vượt ngưỡng. Kết quả khớp với bảng của <a href="https://doi.org/10.5281/zenodo.3591806">Hauser và cộng sự</a> và bảng của Atlas IPCC AR6. Một cửa sổ 20 năm chỉ được dùng nếu nằm trọn trong 1980–2099, những năm CMIP6-VN có số liệu.',
  unknownTitle: 'Những gì trang này chưa biết',
  gGwlT: 'Mức ấm lên toàn cầu', gGwl: 'Nhiệt độ trung bình toàn cầu cao hơn thời kỳ 1850–1900 bao nhiêu độ. "Hà\u00a0Nội ở +2 °C" là 20 năm quanh lúc một mô hình đạt mức đó, dù là năm nào và theo kịch bản nào.',
  gVn: 'Bộ dự tính khí hậu chi tiết cho Việt Nam: 35 mô hình CMIP6, hiệu chỉnh theo trạm đo trong nước bằng phương pháp BCSD, số liệu ngày cho 1980–2099. Dữ liệu công khai (CC0).',
  gCityT: 'Trung bình toàn thành phố', gCity: 'Trung bình của các ô lưới nằm trong Hà\u00a0Nội, có trọng số theo diện tích. Nó mượt hơn số đo ở một trạm, nên số ngày vượt ngưỡng thấp hơn con số của trạm Láng.',
  gHeatT: 'Nắng nóng 35, 37, 39 °C', gHeat: 'Nhiệt độ cao nhất trong ngày từ 35 °C là nắng nóng theo Quyết định 18/2021/QĐ-TTg. Mốc 37 °C (gay gắt) và 39 °C (đặc biệt gay gắt) là cách cơ quan dự báo gọi các mức nắng nóng.',
  gNightT: 'Đêm nóng', gNight: 'Đêm có nhiệt độ thấp nhất từ 28 °C trở lên. Đây là mốc trang này chọn cho Hà\u00a0Nội: hiếm trong 1995–2014, và là những đêm người ta khó ngủ nếu không có quạt hay điều hòa.',
  gRainT: 'Mưa to, mưa rất to', gRain: 'Ngày có lượng mưa từ 50 mm (mưa to) và từ 100 mm (mưa rất to) trong 24 giờ, theo Quyết định 18/2021/QĐ-TTg.',
  gSspT: 'Kịch bản SSP', gSsp: 'Các con đường phát thải của CMIP6: SSP1-2.6 (giảm mạnh), SSP2-4.5 (trung gian), SSP3-7.0 (cao, thế giới chia rẽ) và SSP5-8.5 (rất cao). Ở trang này, kịch bản chỉ quyết định khi nào một mức ấm lên đến.',
  imprint: 'Kịch bản khí hậu Việt Nam · Hà Nội. Dự tính CMIP6-VN và quan trắc dạng lưới (CC0); mức ấm lên toàn cầu từ CMIP6 và HadCRUT5. Có sử dụng thông tin của Dịch vụ Biến đổi khí hậu Copernicus (ERA5, ERA5-Land), qua Open-Meteo (CC BY 4.0); Ủy ban châu Âu và ECMWF không chịu trách nhiệm về cách dùng số liệu này. Kết quả mô tả mô hình khí hậu và số liệu dạng lưới, không phải số đo tại một trạm.',
  obsShort: 'Quan trắc', obsLong: 'Quan trắc 1995–2014', modelDot: 'Một mô hình', median: 'Trung vị các mô hình', ownBase: 'Mô hình, 1995–2014',
  perYear: 'Mỗi cột là một năm', trendLine: 'Xu hướng 1980–2014', trendLineRec: 'Xu hướng 1980–2025',
  gridYears: 'Quan trắc dạng lưới', reanYears: 'ERA5-Land đã hiệu chỉnh', medShort: 'Trung vị', obsTest: 'Quan trắc 2006–2025',
  obsTestBand: 'Tùy cách hiệu chỉnh ERA5-Land', modelDotTest: 'Một mô hình, ở mức ấm lên của 2006–2025', baseWin: '1995–2014', never: 'không tới trước 2090',
  daysYr: 'ngày/năm', nightsYr: 'đêm/năm', perDecade: 'mỗi thập kỷ',
  loading: 'Đang tải số liệu Hà\u00a0Nội…', loadFail: 'Chưa tải được số liệu Hà\u00a0Nội',
  loadFailFile: 'Trang đang được mở trực tiếp từ ổ đĩa, nên trình duyệt không cho đọc tệp số liệu. Hãy mở trang qua một máy chủ web (http hoặc https).',
  loadFailNet: 'Có thể mạng vừa bị gián đoạn, hoặc tệp số liệu chưa có trên máy chủ. Hãy thử lại sau giây lát.', retry: 'Thử lại',
  partial: 'Đang có {n}/{total} mô hình; phần còn lại đang tải.', model: 'Mô hình', level: 'Mức ấm lên'
});

Object.assign(S.en, {
  skip: 'Skip to the explorer', section: 'Hanoi', nameplate: 'Vietnam Climate Scenario Explorer', navLabel: 'Chapters',
  navPast: 'So far', navLevels: 'Warming levels', navHeat: 'Heat', navRain: 'Rain', navEarly: 'Arriving early', navClose: 'Plan for +2\u00a0°C', navExplore: 'Explorer',
  actAnd: 'What we know', actBut: 'But', actThen: 'Therefore',
  navNationalKicker: 'Main page', navNational: 'All of Vietnam',
  storyLabel: 'Story in chapters',
  jumpStory: 'Continued: what Hanoi has lived through', jumpStoryPg: '(chapter 1)',
  jumpNational: 'Nationwide: how much warmer will Vietnam get?', jumpNationalPg: '(main page)',
  exploreTitle: 'Your turn: Hanoi at each warming level',
  exploreIntro: 'Pick an indicator. Each dot is one model; highlight a model to follow it across the warming levels.',
  chartHelp: 'Hover or tap a dot to read the model and its value. With the chart focused, <kbd>←</kbd> <kbd>→</kbd> move between columns, <kbd>↑</kbd> <kbd>↓</kbd> between models, <kbd>Home</kbd> and <kbd>End</kbd> jump to the ends, and <kbd>Esc</kbd> clears.',
  tableSummary: 'Each model\'s values as a table', railLabel: 'Chart controls',
  ctlIndicator: 'Indicator', ctlValues: 'Values', modeAbs: 'Value', modeAnom: 'Change',
  modeNote: 'Change is from each model\'s own 1995–2014.', ctlHighlight: 'Highlight a model', hlNone: 'None',
  aboutTitle: 'About the data and method',
  aboutData: 'Every number on this page is a Hanoi city-wide average from <a href="https://doi.org/10.1038/s41597-023-02159-2">CMIP6-VN</a> (Tran-Anh et al., 2023): 35 CMIP6 models bias-corrected against 147 temperature stations and 481 rain gauges in Vietnam, on a 0.1° grid (about 11&nbsp;km). The observations for 1980–2014 are the gridded dataset CMIP6-VN was corrected to; from 2015 they are Copernicus\'s <a href="https://doi.org/10.5194/essd-13-4349-2021">ERA5-Land</a> (temperature) and ERA5 (rain) reanalyses, taken from <a href="https://open-meteo.com/">Open-Meteo</a> and calibrated to the gridded data by quantile mapping, month by month. Each grid cell counts by the share of its area inside Hanoi (Natural Earth; the city boundary is unchanged by the 2025 reorganisation).',
  aboutLevels: 'Each model\'s global warming level comes from its own global mean temperature in the CMIP6 archive on Google Cloud, the IPCC AR6 way: a 20-year running mean against 1850–1900, taking the first year above the level. The results match the tables of <a href="https://doi.org/10.5281/zenodo.3591806">Hauser et al.</a> and the IPCC AR6 Atlas. A 20-year window is used only if it lies inside 1980–2099, the years CMIP6-VN covers.',
  unknownTitle: 'What this page doesn\'t know yet',
  gGwlT: 'Global warming level', gGwl: 'How much warmer the global average is than in 1850–1900. "Hanoi at +2 °C" means the 20 years around when a model reaches that level, whatever the year and scenario.',
  gVn: 'Detailed climate projections for Vietnam: 35 CMIP6 models corrected to Vietnamese stations with the BCSD method, daily data for 1980–2099. The data is open (CC0).',
  gCityT: 'City-wide average', gCity: 'The area-weighted average of the grid cells inside Hanoi. It is smoother than a single station, so it counts fewer days above a threshold than the Láng station would.',
  gHeatT: 'Heat at 35, 37, 39 °C', gHeat: 'A daily high of 35 °C or more is a heatwave day under Decision 18/2021/QĐ-TTg. 37 °C (severe) and 39 °C (extreme) are the bands the forecast service uses.',
  gNightT: 'Hot nights', gNight: 'Nights whose low stays at 28 °C or more. This page picked the threshold for Hanoi: rare in 1995–2014, and the nights people struggle to sleep without a fan or air conditioning.',
  gRainT: 'Heavy and very heavy rain', gRain: 'Days with 50 mm or more (heavy) and 100 mm or more (very heavy) in 24 hours, as defined in Decision 18/2021/QĐ-TTg.',
  gSspT: 'SSP scenarios', gSsp: 'CMIP6 emissions paths: SSP1-2.6 (deep cuts), SSP2-4.5 (middle), SSP3-7.0 (high, a divided world) and SSP5-8.5 (very high). On this page a scenario only decides when a warming level arrives.',
  imprint: 'Vietnam Climate Scenario Explorer · Hanoi. CMIP6-VN projections and gridded observations (CC0); global warming levels from CMIP6 and HadCRUT5. Contains modified Copernicus Climate Change Service information (ERA5, ERA5-Land), via Open-Meteo (CC BY 4.0); neither the European Commission nor ECMWF is responsible for any use of it. Results describe climate models and gridded data, not readings at a single station.',
  obsShort: 'Observed', obsLong: 'Observed 1995–2014', modelDot: 'One model', median: 'Model median', ownBase: 'Models, 1995–2014',
  perYear: 'One bar per year', trendLine: '1980–2014 trend', trendLineRec: '1980–2025 trend',
  gridYears: 'Gridded observations', reanYears: 'ERA5-Land, calibrated', medShort: 'Median', obsTest: 'Observed 2006–2025',
  obsTestBand: 'Range across ERA5-Land calibrations', modelDotTest: 'One model, at the warming of 2006–2025', baseWin: '1995–2014', never: 'not reached before 2090',
  daysYr: 'days a year', nightsYr: 'nights a year', perDecade: 'per decade',
  loading: 'Loading the Hanoi data…', loadFail: 'The Hanoi data didn\'t load',
  loadFailFile: 'The page was opened straight from disk, so the browser won\'t let it read the data file. Open it through a web server (http or https).',
  loadFailNet: 'The connection may have dropped, or the data file isn\'t on the server yet. Try again in a moment.', retry: 'Try again',
  partial: '{n} of {total} models in so far; the rest are still downloading.', model: 'Model', level: 'Warming level'
});

/* indicators: d = decimals, unit key, change as a difference (diff) or percent (pct) */
const IND = {
  tas:  {kind: 't', d: 1, unit: 'tasUnit', change: 'diff', vi: 'Nhiệt độ trung bình năm', en: 'Annual mean temperature'},
  tx35: {kind: 't', d: 0, unit: 'daysYr', change: 'diff', vi: 'Ngày nắng nóng (cao nhất từ 35 °C)', en: 'Hot days (high of 35 °C or more)'},
  tx37: {kind: 't', d: 1, unit: 'daysYr', change: 'diff', vi: 'Ngày nắng nóng gay gắt (từ 37 °C)', en: 'Severe heat days (37 °C or more)'},
  tx39: {kind: 't', d: 1, unit: 'daysYr', change: 'diff', vi: 'Ngày nắng nóng đặc biệt gay gắt (từ 39 °C)', en: 'Extreme heat days (39 °C or more)'},
  tn28: {kind: 't', d: 0, unit: 'nightsYr', change: 'diff', vi: 'Đêm nóng (thấp nhất từ 28 °C)', en: 'Hot nights (low of 28 °C or more)'},
  pr:   {kind: 'r', d: 0, unit: 'mm', change: 'pct', vi: 'Lượng mưa năm', en: 'Annual rainfall'},
  r50:  {kind: 'r', d: 1, unit: 'daysYr', change: 'diff', vi: 'Ngày mưa to (từ 50 mm)', en: 'Heavy-rain days (50 mm or more)'},
  r100: {kind: 'r', d: 2, unit: 'daysYr', change: 'diff', vi: 'Ngày mưa rất to (từ 100 mm)', en: 'Very heavy rain days (100 mm or more)'},
  rx1:  {kind: 'r', d: 0, unit: 'mm', change: 'pct', vi: 'Ngày mưa lớn nhất năm', en: 'Wettest day of the year'}
};
const indName = k => IND[k][LANG] || IND[k].en;
const indUnit = k => IND[k].unit === 'mm' ? 'mm' : t(IND[k].unit);
const LEVELS = ['1.5', '2.0', '3.0'];
/* where the real world is: human-induced warming in 2025 and its rate (Forster et al. 2026,
   Indicators of Global Climate Change 2025, ESSD 18:3889). The "today's rate" year is a plain
   extrapolation of that rate, not a projection */
const GW_NOW = {year: 2025, gw: 1.37, rate: 0.27, decade: 1.24};  /* decade: human-induced, 2016–2025 mean */
const atTodaysRate = lv => Math.round(GW_NOW.year + (+lv - GW_NOW.gw) / GW_NOW.rate * 10);
/* "+1,5 °C" / "+2 °C" in the reader's locale */
const lvName = lv => `${fmt('+')(+lv)} °C`;
const SSP_ROWS = [
  {s: 'ssp126', name: 'SSP1-2.6', vi: 'giảm mạnh', en: 'deep cuts'},
  {s: 'ssp245', name: 'SSP2-4.5', vi: 'trung gian', en: 'middle'},
  {s: 'ssp370', name: 'SSP3-7.0', vi: 'cao', en: 'high'},
  {s: 'ssp585', name: 'SSP5-8.5', vi: 'rất cao', en: 'very high'}
];
