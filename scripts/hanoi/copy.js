'use strict';
/* Hà Nội page: the narration, built from hnFacts() in the reader's language. */

function hnCopy(F) {
  const L = F.L, vi = LANG === 'vi';
  const v = (k, x) => nf(x, IND[k].d);
  const med = (k, lv, mode = 'abs') => L[lv][k][mode].med;
  const st = (k, lv, mode = 'abs') => L[lv][k][mode];
  const ob = k => F.O.base[k];
  const deg = x => `${nf(x)}&nbsp;°C`, sdeg = x => `${sg(x)}&nbsp;°C`, sdeg2 = x => `${sg(x, 2)}&nbsp;°C`;
  const lv = l => lvName(l).replace(' ', '&nbsp;');
  const day = i => doyDate(i).toLocaleDateString(vi ? 'vi-VN' : 'en-GB', {day: 'numeric', month: 'long', timeZone: 'UTC'});
  const of = (a, b) => vi ? `${a}/${b}` : `${a} of ${b}`;
  const W = F.when, w2 = s => W[s] && W[s]['2.0'];
  const ssp = s => `<span class="nw">${SSP_ROWS.find(r => r.s === s).name}</span>`;
  const cs = F.cal.obs, c3 = F.cal['3.0'];
  const hot = k => st(k, '2.0', 'anom');
  const rare = x => x >= 1 ? `<b>${v('tx39', x)}</b>` : x > 0 ? (vi ? `khoảng một ngày mỗi <b>${Math.round(1 / x)}</b> năm` : `about one day every <b>${Math.round(1 / x)}</b> years`) : (vi ? 'không ngày nào' : 'none');
  const trendT = F.trend.tas, trendH = F.trend.tx35;
  const slower = trendH.filter(x => x < F.obsTrend.tx35).length;
  const allUp = (s, n) => s.up === s.n ? (vi ? `cả ${s.n} mô hình` : `all ${s.n} models`) : (vi ? `${of(s.up, s.n)} mô hình` : `${of(s.up, s.n)} models`);
  const neverTxt = (s, x) => x.reached < x.n ? (vi ? `, và ${of(x.n - x.reached, x.n)} mô hình không tới mức đó trước 2090` : `, and ${of(x.n - x.reached, x.n)} models don't get there before 2090`) : '';
  const sspName = e => `SSP${e[3]}-${e[4]}.${e[5]}`;
  const qcList = F.qc.map(q => {
    const all = q.bad.every(b => b.vars.includes('tasmax') && b.vars.includes('tasmin'));
    const exps = q.bad.map(b => sspName(b.e)).join(', ');
    return vi ? `${q.m} (${exps}: ${all ? 'toàn bộ số liệu' : 'nhiệt độ trung bình ngày'})` : `${q.m} (${exps}: ${all ? 'all variables' : 'daily mean temperature'})`;
  });
  const srcLevels = vi
    ? `Nguồn: CMIP6-VN, trung bình toàn Hà Nội trong 20 năm quanh lúc mỗi mô hình đạt mức ấm lên; một mô hình đạt mức đó theo nhiều kịch bản thì lấy trung bình các kịch bản. Quan trắc: số liệu dạng lưới 1995–2014.`
    : `Source: CMIP6-VN, Hanoi city-wide average over the 20 years around when each model reaches the level; a model that reaches it under several scenarios is averaged across them. Observed: gridded data, 1995–2014.`;

  if (vi) return {
    h1: `Hà Nội sẽ có bao nhiêu ngày nắng nóng? <em>Khoảng ${v('tx35', med('tx35', '2.0'))} ngày mỗi năm khi Trái Đất nóng thêm ${lv('2.0').slice(1)}</em>`,
    sapo: `Trong 1995–2014, nhiệt độ cao nhất trung bình toàn Hà Nội chạm 35&nbsp;°C khoảng ${v('tx35', ob('tx35'))} ngày mỗi năm. ${cap(numWord(F.nT))} mô hình khí hậu đã hiệu chỉnh theo trạm đo Việt Nam cho thấy con số đó lên ${v('tx35', med('tx35', '1.5'))} ngày nếu Trái Đất ấm thêm ${lv('1.5').slice(1)} so với thời tiền công nghiệp, ${v('tx35', med('tx35', '2.0'))} ngày ở ${lv('2.0').slice(1)} và ${v('tx35', med('tx35', '3.0'))} ngày ở ${lv('3.0').slice(1)}.`,
    byline: `Đồ họa dữ liệu<span class="bydate">${today()}</span><span>Nguồn: CMIP6-VN, ${F.nT} mô hình; quan trắc dạng lưới 1980–2014</span>`,
    leadP1: `Bài này không hỏi Hà Nội năm 2050 hay 2100 sẽ ra sao. Nó hỏi Hà Nội ra sao khi Trái Đất nóng thêm <b>${nf(1.5)}</b>, <b>2</b> hay <b>3&nbsp;°C</b>. Năm nào đến mức nào tùy vào lượng phát thải và vào từng mô hình; còn Hà Nội ở mỗi mức trông thế nào thì các mô hình kể giống nhau hơn nhiều. Theo IPCC, Trái Đất đã ấm khoảng <b>${deg(1.1)}</b> trong 2011–2020.`,
    leadP2: `Mỗi hàng trong hình là một năm điển hình của Hà Nội, mỗi cột là một ngày từ tháng Một đến tháng Mười Hai; màu càng đậm, ngày đó càng hay nóng tới 35&nbsp;°C.${cs && c3 ? ` Trong 1995–2014, mùa nắng nóng (những ngày cứ mười năm có ít nhất một năm nóng tới 35&nbsp;°C) kéo dài từ ${day(cs.a)} đến ${day(cs.b)}. Ở ${lv('3.0')}, nó kéo dài từ ${day(c3.a)} đến ${day(c3.b)}.` : ''}`,
    pull: `${v('tx35', med('tx35', '2.0'))} ngày<small>nắng nóng mỗi năm ở ${lv('2.0')}, so với ${v('tx35', ob('tx35'))} ngày trong 1995–2014</small>`,
    cap: `Lịch nắng nóng của Hà Nội: tỉ lệ năm có nhiệt độ cao nhất trung bình toàn thành phố từ 35&nbsp;°C vào mỗi ngày. Hàng trên là quan trắc 1995–2014, các hàng dưới là ${F.nT} mô hình CMIP6-VN ở từng mức ấm lên toàn cầu.`,
    calAria: `Lịch nắng nóng của Hà Nội: mỗi cột là một ngày trong năm, tô đậm dần theo tỉ lệ năm có ngày nóng từ 35 °C. Mùa nắng nóng dài ra và đậm lên từ quan trắc 1995–2014 tới mức ấm lên +3 °C.`,
    keyLabel: 'Tỉ lệ năm có ngày nóng từ 35 °C',
    badge: `CMIP6-VN · ${F.nT} mô hình`,
    steps: {
      past: `<h2>Những gì Hà Nội đã trải qua</h2><p>Nhiệt độ cao nhất trung bình toàn thành phố đạt 35&nbsp;°C trung bình <b>${v('tx35', F.early.tx35)} ngày</b> mỗi năm trong 1980–1994 và <b>${v('tx35', F.late.tx35)} ngày</b> trong 1995–2014. Xu hướng 1980–2014 là thêm <b>${nf(F.obsTrend.tx35)} ngày</b> mỗi thập kỷ, trong khi nhiệt độ trung bình năm tăng <b>${sdeg2(F.obsTrend.tas)}</b> mỗi thập kỷ.</p><p>Năm nóng nhất trong chuỗi là <b>${F.hotYear}</b>, với <b>${F.hotMax} ngày</b>. Đây là trung bình của cả thành phố, mượt hơn số đo ở một trạm, nên con số thấp hơn số ngày nắng nóng mà trạm Láng ghi được. Bộ số liệu dạng lưới dừng ở năm 2014.</p>`,
      when: `<h2>Tính bằng độ, không bằng năm</h2><p>Bao giờ Trái Đất nóng thêm ${lv('2.0').slice(1)}? Theo ${ssp('ssp245')}, trung vị các mô hình là năm <b>${w2('ssp245').med}</b>, nhưng tùy mô hình, từ <b>${w2('ssp245').min}</b> đến <b>${w2('ssp245').max}</b>${neverTxt('ssp245', w2('ssp245'))}. Theo ${ssp('ssp585')}, trung vị là <b>${w2('ssp585').med}</b>. Theo ${ssp('ssp126')}, chỉ <b>${of(w2('ssp126').reached, w2('ssp126').n)}</b> mô hình tới mức đó.</p><p>Vì vậy các chương sau so Hà Nội ở cùng một mức ấm lên toàn cầu, dù mỗi mô hình đến đó vào năm nào. Đo theo cách này, việc vài mô hình nóng nhanh hơn số còn lại gần như không còn quan trọng: chúng chỉ đến mỗi mức sớm hơn. Báo cáo Khoảng cách Phát thải 2024 của UNEP ước tính chính sách hiện nay đưa thế giới tới khoảng <b>${deg(3.1)}</b> trong thế kỷ này.</p>`,
      hot: `<h2>Ngày nắng nóng</h2><p>Ở ${lv('1.5')}, các mô hình cho Hà Nội trung vị <b>${v('tx35', med('tx35', '1.5'))} ngày</b> nắng nóng mỗi năm; ở ${lv('2.0')} là <b>${v('tx35', med('tx35', '2.0'))} ngày</b>, ở ${lv('3.0')} là <b>${v('tx35', med('tx35', '3.0'))} ngày</b>. Quan trắc 1995–2014 là <b>${v('tx35', ob('tx35'))} ngày</b>.</p><p>Mỗi chấm trên biểu đồ là một mô hình. Ở ${lv('2.0')}, các mô hình trải từ <b>${v('tx35', st('tx35', '2.0').min)}</b> đến <b>${v('tx35', st('tx35', '2.0').max)} ngày</b>, và ${allUp(hot('tx35'))} cho nhiều ngày nắng nóng hơn 1995–2014 của chính nó.</p><p>Một lưu ý: với chính 1995–2014, các mô hình cho trung vị <b>${v('tx35', F.baseMed('tx35'))} ngày</b>, nhiều hơn quan trắc. Cách hiệu chỉnh của CMIP6-VN hơi phóng đại đuôi nóng, như các tác giả đã cảnh báo, nên các con số tương lai có thể hơi cao.</p>`,
      bands: `<h2>Nóng gay gắt</h2><p>Ngày từ 37&nbsp;°C, mức cơ quan dự báo gọi là nắng nóng gay gắt, hiện còn hiếm: <b>${v('tx37', ob('tx37'))} ngày</b> mỗi năm trong 1995–2014. Ở ${lv('2.0')} trung vị là <b>${v('tx37', med('tx37', '2.0'))}</b>, ở ${lv('3.0')} là <b>${v('tx37', med('tx37', '3.0'))} ngày</b>.</p><p>Ngày từ 39&nbsp;°C, nắng nóng đặc biệt gay gắt, gần như chưa xảy ra với trung bình cả thành phố: ${rare(ob('tx39'))} trong 1995–2014. Ở ${lv('3.0')}, các mô hình cho trung vị <b>${v('tx39', med('tx39', '3.0'))} ngày</b> mỗi năm.</p>`,
      nights: `<h2>Những đêm không hạ nhiệt</h2><p>Đêm có nhiệt độ thấp nhất từ 28&nbsp;°C trở lên: <b>${v('tn28', ob('tn28'))} đêm</b> mỗi năm trong 1995–2014. Ở ${lv('2.0')} trung vị là <b>${v('tn28', med('tn28', '2.0'))}</b>, ở ${lv('3.0')} là <b>${v('tn28', med('tn28', '3.0'))} đêm</b>.</p><p>Đêm nóng quan trọng vì cơ thể cần ban đêm để hồi lại sau một ngày nóng. Trang này chưa nối các con số với sức khỏe hay nhu cầu điện; đó là phần việc tiếp theo.</p>`,
      rain: `<h2>Mưa nhiều hơn, dồn hơn?</h2><p>Lượng mưa năm của Hà Nội ở ${lv('2.0')}: trung vị <b>${sg(med('pr', '2.0', 'anom'), 0)}%</b> so với 1995–2014, với ${of(st('pr', '2.0', 'anom').up, st('pr', '2.0', 'anom').n)} mô hình cho mưa nhiều hơn. Ở ${lv('3.0')} là <b>${sg(med('pr', '3.0', 'anom'), 0)}%</b>.</p><p>Ngày mưa to, từ 50&nbsp;mm, là <b>${v('r50', ob('r50'))}</b> ngày mỗi năm theo quan trắc 1995–2014, và trung vị <b>${v('r50', med('r50', '2.0'))}</b> ở ${lv('2.0')}, <b>${v('r50', med('r50', '3.0'))}</b> ở ${lv('3.0')}. Các mô hình bất đồng về mưa nhiều hơn về nhiệt độ. Mưa trung bình cả thành phố cũng mượt hơn mưa tại một điểm, nên những trận mưa cục bộ gây ngập không hiện hết ở đây.</p>`,
      check: `<h2>Có tin được các mô hình ở đây?</h2><p>CMIP6-VN được hiệu chỉnh cho khớp với quan trắc 1980–2014, nên việc các mô hình cho đúng trung bình 1995–2014 không chứng minh được gì. Phép thử thật là xu hướng, vì việc hiệu chỉnh không ép mô hình nóng lên đúng tốc độ đã quan sát.</p><p>Trong 1980–2014, nhiệt độ trung bình năm của Hà Nội tăng <b>${sdeg2(F.obsTrend.tas)}</b> mỗi thập kỷ theo quan trắc; trung vị các mô hình là <b>${sdeg2(median(trendT))}</b>, từ ${sg(d3.min(trendT), 2)} đến ${sg(d3.max(trendT), 2)}. Với ngày nắng nóng, quan trắc là <b>${sg(F.obsTrend.tx35)} ngày</b> mỗi thập kỷ, các mô hình <b>${sg(median(trendH))}</b>; ${of(slower, trendH.length)} mô hình tăng chậm hơn quan trắc.</p><p>35 năm là ngắn và dao động tự nhiên lớn, nên một mô hình lệch xu hướng chưa chắc đã sai. Phép thử tiếp theo là so các mô hình với 2015–2025, những năm chúng chưa từng thấy.</p>`
    },
    titles: {
      past: 'Ngày nắng nóng (từ 35 °C) mỗi năm, trung bình toàn Hà Nội, quan trắc 1980–2014',
      when: `Năm Trái Đất nóng thêm 2 °C theo từng mô hình CMIP6`,
      hot: 'Ngày nắng nóng (từ 35 °C) mỗi năm ở từng mức ấm lên',
      bands: 'Ngày nắng nóng gay gắt (từ 37 °C) mỗi năm ở từng mức ấm lên',
      nights: 'Đêm nóng (thấp nhất từ 28 °C) mỗi năm ở từng mức ấm lên',
      rain: 'Ngày mưa to (từ 50 mm) mỗi năm ở từng mức ấm lên',
      check: 'Xu hướng 1980–2014: quan trắc và từng mô hình'
    },
    sources: {
      past: 'Nguồn: số liệu quan trắc dạng lưới 0,1° đi kèm CMIP6-VN, trung bình toàn Hà Nội. Đường thẳng là xu hướng tuyến tính 1980–2014; vùng tô là thời kỳ cơ sở 1995–2014.',
      when: `Nguồn: nhiệt độ trung bình toàn cầu của ${F.total} mô hình CMIP6-VN trong kho CMIP6, trung bình trượt 20 năm so với 1850–1900. Mỗi chấm là năm giữa của cửa sổ 20 năm đầu tiên vượt +2 °C; vạch đậm là trung vị.`,
      hot: srcLevels, bands: srcLevels, nights: srcLevels, rain: srcLevels,
      check: 'Nguồn: lần chạy lịch sử của CMIP6-VN và quan trắc dạng lưới, trung bình toàn Hà Nội, xu hướng tuyến tính 1980–2014.'
    },
    unknown: [
      'Quan trắc dạng lưới dừng ở 2014, nên những năm nóng gần đây chưa có trên trang. Bước tiếp theo là nối chuỗi bằng ERA5 và so các mô hình với 2015–2025.',
      'Trung bình toàn thành phố mượt hơn số đo ở trạm Láng; số ngày vượt ngưỡng tại trạm sẽ cao hơn.',
      'Chưa tính độ ẩm. CMIP6-VN chỉ có nhiệt độ và mưa, nên nắng nóng ẩm, thứ cơ thể cảm nhận, chưa có ở đây.',
      'Chưa có hậu quả: sức khỏe, lao động ngoài trời, điện và ngập úng là các chương sau.',
      'Theo các tác giả, phương pháp BCSD có thể khuếch đại phần đuôi của phân bố và hạn chế thay đổi trong phân bố theo ngày. Điều đó ảnh hưởng đến số ngày cực đoan.',
      ...(qcList.length ? [`Một số tệp của CMIP6-VN bị lỗi ngay từ nguồn: nhiệt độ dao động từng ngày mạnh hơn hẳn lần chạy lịch sử, hoặc nhiệt độ trung bình ngày trôi về phía nhiệt độ cao nhất. Trang đã để chúng ra ngoài: ${qcList.join('; ')}. Kiểm tra nằm trong <code>pipeline/build_hanoi.py</code>.`] : []),
      ...(F.relabel.length ? [`Bảng của bài báo CMIP6-VN ghi cho ${F.relabel.join(' và ')} ${F.relabel.length > 1 ? 'những nhãn' : 'một nhãn'} lần chạy không có trong CMIP6. Mức ấm lên của ${F.relabel.length > 1 ? 'chúng' : 'mô hình này'} dùng lần chạy đầu tiên có thật.`] : []),
      `${cap(numWord(F.nR))} mô hình là một tổ hợp nhỏ. Biên độ giữa các mô hình trên trang có thể hẹp hơn biên độ của cả ${F.dataset} mô hình.`,
      'Chưa so với Kịch bản biến đổi khí hậu cập nhật 2025 của Bộ Nông nghiệp và Môi trường.'
    ],
    runs: `Trang này dùng <b>${F.nR}</b> trong ${F.dataset} mô hình của CMIP6-VN: ${F.names.join(', ')}. Số mô hình bằng với trang cả nước, nhưng chúng được chọn trong CMIP6-VN để trải từ mô hình nóng lên chậm (MIROC6) đến mô hình nóng lên nhanh (UKESM1-0-LL), và mô hình nào cũng có cả nhiệt độ lẫn mưa. Trong 1995–2014, chính các mô hình đã ấm thêm trung vị <b>${deg(F.gw0.median)}</b> so với 1850–1900, nên ${lv('1.5')} chỉ cao hơn thời kỳ cơ sở chừng ${deg(1.5 - F.gw0.median)}.`
  };

  return {
    h1: `How many hot days will Hanoi get? <em>About ${v('tx35', med('tx35', '2.0'))} a year in a world ${lv('2.0').slice(1)} warmer</em>`,
    sapo: `In 1995–2014 Hanoi's city-wide daily high reached 35&nbsp;°C on about ${v('tx35', ob('tx35'))} days a year. ${cap(numWord(F.nT))} climate models corrected to Vietnamese weather stations put that at ${v('tx35', med('tx35', '1.5'))} days if the world warms ${lv('1.5').slice(1)} above pre-industrial levels, ${v('tx35', med('tx35', '2.0'))} days at ${lv('2.0').slice(1)} and ${v('tx35', med('tx35', '3.0'))} at ${lv('3.0').slice(1)}.`,
    byline: `Data graphics<span class="bydate">${today()}</span><span>Source: CMIP6-VN, ${F.nT} models; gridded observations 1980–2014</span>`,
    leadP1: `This report doesn't ask what Hanoi will be like in 2050 or 2100. It asks what Hanoi is like once the world is <b>${nf(1.5)}</b>, <b>2</b> or <b>3&nbsp;°C</b> warmer. Which year brings which level depends on emissions and on the model, but the models agree far more on what Hanoi looks like at each level. The IPCC puts global warming in 2011–2020 at about <b>${deg(1.1)}</b>.`,
    leadP2: `Each row in the figure is a typical Hanoi year and each column a day from January to December; the darker the colour, the more often that day reaches 35&nbsp;°C.${cs && c3 ? ` In 1995–2014 the hot season (days that reach 35&nbsp;°C in at least one year in ten) ran from ${day(cs.a)} to ${day(cs.b)}. At ${lv('3.0')} it runs from ${day(c3.a)} to ${day(c3.b)}.` : ''}`,
    pull: `${v('tx35', med('tx35', '2.0'))} days<small>of heat a year at ${lv('2.0')}, against ${v('tx35', ob('tx35'))} in 1995–2014</small>`,
    cap: `Hanoi's heat calendar: the share of years in which the city-wide daily high reaches 35&nbsp;°C on each day. Top row: observed 1995–2014; the rows below: ${F.nT} CMIP6-VN models at each global warming level.`,
    calAria: 'Hanoi\'s heat calendar: one column per day of the year, darker as more years reach 35 °C that day. The hot season grows longer and darker from the observed 1995–2014 to +3 °C of global warming.',
    keyLabel: 'Share of years with a 35 °C day',
    badge: `CMIP6-VN · ${F.nT} models`,
    steps: {
      past: `<h2>What Hanoi has already lived through</h2><p>The city-wide daily high reached 35&nbsp;°C on <b>${v('tx35', F.early.tx35)} days</b> a year on average in 1980–1994 and <b>${v('tx35', F.late.tx35)} days</b> in 1995–2014. The 1980–2014 trend is <b>${nf(F.obsTrend.tx35)} more days</b> per decade, while the annual mean temperature rose <b>${sdeg2(F.obsTrend.tas)}</b> per decade.</p><p>The hottest year in the record is <b>${F.hotYear}</b>, with <b>${F.hotMax} days</b>. This is a city-wide average, smoother than a single station, so it counts fewer hot days than the Láng station would. The gridded record ends in 2014.</p>`,
      when: `<h2>Counting in degrees, not years</h2><p>When will the world be ${lv('2.0').slice(1)} warmer? Under ${ssp('ssp245')} the model median is <b>${w2('ssp245').med}</b>, but individual models range from <b>${w2('ssp245').min}</b> to <b>${w2('ssp245').max}</b>${neverTxt('ssp245', w2('ssp245'))}. Under ${ssp('ssp585')} the median is <b>${w2('ssp585').med}</b>. Under ${ssp('ssp126')} only <b>${of(w2('ssp126').reached, w2('ssp126').n)}</b> models get there at all.</p><p>So the chapters that follow compare Hanoi at the same level of global warming, whatever year each model reaches it. Measured this way, it hardly matters that a few models warm faster than the rest: they just reach each level sooner. UNEP's Emissions Gap Report 2024 estimates that current policies lead to about <b>${deg(3.1)}</b> this century.</p>`,
      hot: `<h2>Hot days</h2><p>At ${lv('1.5')} the models give Hanoi a median of <b>${v('tx35', med('tx35', '1.5'))} hot days</b> a year; at ${lv('2.0')}, <b>${v('tx35', med('tx35', '2.0'))}</b>; at ${lv('3.0')}, <b>${v('tx35', med('tx35', '3.0'))}</b>. The observed 1995–2014 figure is <b>${v('tx35', ob('tx35'))} days</b>.</p><p>Each dot on the chart is one model. At ${lv('2.0')} they range from <b>${v('tx35', st('tx35', '2.0').min)}</b> to <b>${v('tx35', st('tx35', '2.0').max)} days</b>, and ${allUp(hot('tx35'))} give more hot days than their own 1995–2014.</p><p>One caveat: for 1995–2014 itself the models give a median of <b>${v('tx35', F.baseMed('tx35'))} days</b>, more than observed. CMIP6-VN's correction slightly stretches the hot tail, as its authors warn, so the future counts may run a little high.</p>`,
      bands: `<h2>Severe heat</h2><p>Days of 37&nbsp;°C or more, what the forecast service calls severe heat, are still rare: <b>${v('tx37', ob('tx37'))} days</b> a year in 1995–2014. The median is <b>${v('tx37', med('tx37', '2.0'))}</b> at ${lv('2.0')} and <b>${v('tx37', med('tx37', '3.0'))} days</b> at ${lv('3.0')}.</p><p>Days of 39&nbsp;°C or more, extreme heat, have barely happened for the city as a whole: ${rare(ob('tx39'))} in 1995–2014. At ${lv('3.0')} the models give a median of <b>${v('tx39', med('tx39', '3.0'))} days</b> a year.</p>`,
      nights: `<h2>Nights that don't cool down</h2><p>Nights whose low stays at 28&nbsp;°C or more: <b>${v('tn28', ob('tn28'))}</b> a year in 1995–2014. The median is <b>${v('tn28', med('tn28', '2.0'))}</b> at ${lv('2.0')} and <b>${v('tn28', med('tn28', '3.0'))} nights</b> at ${lv('3.0')}.</p><p>Hot nights matter because the body needs the night to recover from a hot day. This page doesn't yet link these numbers to health or electricity demand; that comes next.</p>`,
      rain: `<h2>More rain, in bigger bursts?</h2><p>Hanoi's annual rainfall at ${lv('2.0')}: a median of <b>${sg(med('pr', '2.0', 'anom'), 0)}%</b> from 1995–2014, with ${of(st('pr', '2.0', 'anom').up, st('pr', '2.0', 'anom').n)} models wetter. At ${lv('3.0')}, <b>${sg(med('pr', '3.0', 'anom'), 0)}%</b>.</p><p>Heavy-rain days of 50&nbsp;mm or more: <b>${v('r50', ob('r50'))}</b> a year observed in 1995–2014, and a median of <b>${v('r50', med('r50', '2.0'))}</b> at ${lv('2.0')} and <b>${v('r50', med('r50', '3.0'))}</b> at ${lv('3.0')}. The models disagree more about rain than about heat. City-wide rain is also smoother than rain at a single point, so the local downpours that flood streets don't fully show here.</p>`,
      check: `<h2>Can we trust the models here?</h2><p>CMIP6-VN is corrected to match the 1980–2014 observations, so the models getting the 1995–2014 averages right proves nothing. The real test is the trend, because the correction doesn't force a model to warm at the observed rate.</p><p>Over 1980–2014 Hanoi's annual mean temperature rose <b>${sdeg2(F.obsTrend.tas)}</b> per decade in the observations; the model median is <b>${sdeg2(median(trendT))}</b>, ranging from ${sg(d3.min(trendT), 2)} to ${sg(d3.max(trendT), 2)}. For hot days the observed trend is <b>${sg(F.obsTrend.tx35)} days</b> per decade and the model median <b>${sg(median(trendH))}</b>; ${of(slower, trendH.length)} models rise more slowly than observed.</p><p>35 years is short and natural swings are large, so a model that misses the trend isn't necessarily wrong. The next test is to compare the models with 2015–2025, years they have never seen.</p>`
    },
    titles: {
      past: 'Hot days (35 °C or more) per year, Hanoi city-wide, observed 1980–2014',
      when: 'The year each CMIP6 model reaches 2 °C of global warming',
      hot: 'Hot days (35 °C or more) a year at each warming level',
      bands: 'Severe heat days (37 °C or more) a year at each warming level',
      nights: 'Hot nights (low of 28 °C or more) a year at each warming level',
      rain: 'Heavy-rain days (50 mm or more) a year at each warming level',
      check: '1980–2014 trends: observed and each model'
    },
    sources: {
      past: 'Source: the 0.1° gridded observations that come with CMIP6-VN, Hanoi city-wide average. The straight line is the 1980–2014 linear trend; the shaded years are the 1995–2014 baseline.',
      when: `Source: global mean temperature of the ${F.total} CMIP6-VN models in the CMIP6 archive, 20-year running mean against 1850–1900. Each dot is the middle year of the first 20-year window above +2 °C; the heavy tick is the median.`,
      hot: srcLevels, bands: srcLevels, nights: srcLevels, rain: srcLevels,
      check: 'Source: CMIP6-VN historical runs and gridded observations, Hanoi city-wide average, linear trends 1980–2014.'
    },
    unknown: [
      'The gridded observations end in 2014, so recent hot years aren\'t on the page yet. The next step is to extend the record with ERA5 and test the models against 2015–2025.',
      'A city-wide average is smoother than the Láng station; the station would count more days above each threshold.',
      'Humidity isn\'t included. CMIP6-VN has temperature and rain only, so humid heat, the heat the body feels, isn\'t here yet.',
      'No consequences yet: health, outdoor work, electricity and flooding are later chapters.',
      'The authors note that the BCSD method can stretch the tails of the distribution and hold back changes in the daily distribution. That affects counts of extreme days.',
      ...(qcList.length ? [`Some CMIP6-VN files are broken at the source: their temperatures swing from day to day far more than the historical run, or the daily mean drifts towards the daily maximum. The page sets them aside: ${qcList.join('; ')}. The check is in <code>pipeline/build_hanoi.py</code>.`] : []),
      ...(F.relabel.length ? [`The CMIP6-VN paper's table gives ${F.relabel.join(' and ')} ${F.relabel.length > 1 ? "run labels that don't" : "a run label that doesn't"} exist in CMIP6. ${F.relabel.length > 1 ? "Their warming levels use each model's" : "Its warming levels use the model's"} first real run.`] : []),
      `${cap(numWord(F.nR))} models is a small ensemble. The range across models on this page may be narrower than across all ${F.dataset}.`,
      'No comparison yet with the Ministry of Agriculture and Environment\'s updated 2025 climate scenarios.'
    ],
    runs: `This page uses <b>${F.nR}</b> of CMIP6-VN's ${F.dataset} models: ${F.names.join(', ')}. That is as many as the national page, but they are chosen from CMIP6-VN to run from a slow-warming model (MIROC6) to a fast-warming one (UKESM1-0-LL), and every one has both temperature and rain. In 1995–2014 the models themselves had already warmed a median of <b>${deg(F.gw0.median)}</b> above 1850–1900, so ${lv('1.5')} is only about ${deg(1.5 - F.gw0.median)} above the baseline.`
  };
}
