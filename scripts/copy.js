'use strict';
/* Narration: facts computed from the national data and the story copy built from them. */

/* ---------- facts for the narration ---------- */
function facts(D) {
  const ms = modelsOf(D), n = ms.length, bs = 1985;
  const anomTas = s => ens(ms.map(m => smoothC(full(D, 'tas', m, s).map(q => q - baseOf(D, 'tas', m, bs)))));
  const a245 = anomTas('ssp245'), a585 = anomTas('ssp585');
  let fork = null;
  for (let i = 65; i < N_YEARS; i++) if (a245[i].mid != null && a585[i].mid - a245[i].mid >= 0.5) { fork = 1950 + i; break; }
  const last = d3.max(d3.range(N_YEARS).filter(i => a245[i].mid != null));
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
    hot: ms.map((m, i) => ({m, d: eoc(D, 'tas', m, 'ssp245', bs).d})).sort((a, b) => b.d - a.d).slice(0, 2),
    fork, endGap: a585[last].mid - a245[last].mid, endYear: 1950 + last,
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
  const m245 = mid(F.t.ssp245), m585 = mid(F.t.ssp585), need = agreeNeed(F.n);
  const decade = Math.floor(F.endYear / 10) * 10;
  /* the two fastest-warming models, named only when there are enough models for the median to matter */
  const H = F.n >= 4 ? F.hot : null;
  if (LANG === 'vi') return {
    h1: `Việt Nam sẽ nóng thêm bao nhiêu? <em>Từ ${nf(m245)} đến ${nf(m585)}&nbsp;°C</em>`,
    byline: `Đồ họa dữ liệu<span class="bydate">${today()}</span><span>Nguồn: CMIP6, ${F.n} mô hình</span>`,
    leadP1: `Đến giai đoạn 2071–2100, trung vị của ${F.n} mô hình cho thấy nhiệt độ trung bình của Việt Nam tăng <b>${sdeg(m245)}</b> nếu phát thải giảm dần sau giữa thế kỷ (kịch bản SSP2-4.5), và <b>${sdeg(m585)}</b> nếu phát thải tiếp tục tăng (SSP5-8.5), so với thời kỳ cơ sở 1985–2014. Đây là mức ấm lên của riêng Việt Nam, không phải mức ấm lên toàn cầu như +${nf(1.5)} hay +2&nbsp;°C trong bài về Hà&nbsp;Nội: theo IPCC, đến 2081–2100 kịch bản SSP2-4.5 đưa cả Trái Đất lên khoảng <b>${deg(2.7)}</b> so với thời tiền công nghiệp.`,
    pull: `${sdeg(m585)}<small>mức tăng 2071–2100 nếu phát thải tiếp tục tăng</small>`,
    cap: `Sọc ấm lên 1950–2100: mỗi sọc là một năm, tô theo trung vị mức thay đổi của ${F.n} mô hình so với 1985–2014. Dải trên: SSP2-4.5; dải dưới: SSP5-8.5.`,
    steps: {
      'tas-abs': `<h2>${cap(numWord(F.n))} mô hình, ${numWord(F.n)} Việt Nam</h2><p>Mô hình khí hậu chia Trái Đất thành lưới ô và mô phỏng không khí, đại dương, đất liền trong từng ô qua nhiều thập kỷ. Đây là ${numWord(F.n)} mô hình được dùng trong báo cáo mới nhất của IPCC, mỗi mô hình cho một đường nhiệt độ trung bình của Việt Nam từ 1950 đến 2014.</p><p>Chúng không thống nhất về khí hậu hiện tại. Với giai đoạn 1985–2014, nhiệt độ trung bình cả nước dao động từ <b>${deg(tMin)}</b> đến <b>${deg(tMax)}</b>, chênh nhau <b>${deg(tMax - tMin)}</b>. Mỗi mô hình vẽ núi non, bờ biển và gió mùa của Việt Nam hơi khác nhau, nên mỗi mô hình bắt đầu từ một khí hậu hơi khác.</p>`,
      'tas-anom': `<h2>Vì sao đo mức thay đổi</h2><p>Đem mỗi mô hình so với chính trung bình 1985–2014 của nó, các đường gần như chập lại. Các mô hình bất đồng về việc Việt Nam nóng đến đâu, nhưng kể một câu chuyện giống nhau hơn nhiều về việc Việt Nam đang thay đổi ra sao.</p><p>Từ 1950–1979 đến 1985–2014, trung vị các mô hình đã ấm lên <b>${sdeg(mid(F.histW))}</b>. Từ đây trở đi, mọi con số đều là mức thay đổi so với 1985–2014.</p>`,
      'tas-245': `<h2>Hai tương lai</h2><p>Điều xảy ra tiếp theo phụ thuộc vào phát thải. <b>SSP2-4.5</b> là con đường trung gian: phát thải giữ gần mức hiện nay đến khoảng giữa thế kỷ, rồi giảm dần.</p><p>Theo con đường đó, các mô hình dự tính <b>${sdeg(m245)}</b> cho giai đoạn 2071–2100 (từng mô hình: ${rngT(F.t.ssp245)}). Vùng tô màu là biên độ giữa các mô hình.${H ? ` Hai mô hình nóng lên nhanh nhất là ${H[0].m} (${sdeg(H[0].d)}) và ${H[1].m} (${sdeg(H[1].d)}); con số chính là trung vị nên chúng không kéo nó lên.` : ''}</p>`,
      'tas-585': `<p><b>SSP5-8.5</b> là con đường phát thải cao, khi việc dùng nhiên liệu hóa thạch tiếp tục tăng suốt thế kỷ. Các mô hình dự tính <b>${sdeg(m585)}</b> (từng mô hình: ${rngT(F.t.ssp585)}).</p><p>${F.fork ? `Hai con đường đi sát nhau trong nhiều thập kỷ. Chúng cách nhau nửa độ vào khoảng năm <b>${F.fork}</b>, và khoảng cách lên tới <b>${deg(F.endGap)}</b> vào thập niên ${decade}.` : 'Hai con đường cách nhau không quá nửa độ suốt thế kỷ.'}</p><p>Khung tô xám đánh dấu giai đoạn 2071–2100, thời kỳ dùng cho mọi con số cuối thế kỷ trên trang này.</p>`,
      'pr-abs': `<h2>Lượng mưa</h2><p>Lượng mưa khó mô phỏng hơn nhiệt độ. Nó phụ thuộc vào gió mùa, bão và địa hình mà lưới thô của mô hình chỉ thể hiện được một cách gần đúng.</p><p>Với giai đoạn 1985–2014, các mô hình cho Việt Nam lượng mưa từ <b>${nf(pMin, 0)}&nbsp;mm</b> đến <b>${nf(pMax, 0)}&nbsp;mm</b> mỗi tháng, chênh nhau <b>${nf((pMax - pMin) / pMin * 100, 0)}%</b>.</p>`,
      'pr-agree': `<p>Khi đo mức thay đổi, phần lớn mô hình cho thấy Việt Nam ẩm ướt hơn vào 2071–2100: <b>${wet('ssp245')}/${F.n}</b> mô hình theo SSP2-4.5 và <b>${wet('ssp585')}/${F.n}</b> theo SSP5-8.5. Nhưng chúng bất đồng về mức độ, từ <b>${sg(d3.min(allP))}%</b> đến <b>${sg(d3.max(allP))}%</b>.</p><div class="agree-wrap">${agreeTable(F)}</div>`,
      'pr-hatch': `<p>Phần gạch chéo trên biểu đồ đánh dấu những năm có ít hơn ${need}/${F.n} mô hình đồng ý về xu hướng ẩm hơn hay khô hơn.</p><p>Theo SSP5-8.5, ${F.early}% số năm từ 2015 đến 2049 bị gạch chéo, so với ${F.late}% từ 2050 trở đi.${F.early > F.late + 20 ? ' Trong những thập kỷ đầu, dao động tự nhiên của lượng mưa lớn ngang mức thay đổi; về sau, tín hiệu mới nổi rõ.' : ''}</p>`
    },
    source: `Nguồn: CMIP6, ${F.n} mô hình, trung bình năm có trọng số diện tích cho Việt Nam. Các đường là trung bình trượt 10 năm; mức thay đổi tính so với trung bình 1985–2014 của từng mô hình.`,
    stripesAria: `Sọc ấm lên của Việt Nam: mỗi sọc là một năm từ 1950 đến 2100, tô từ xanh (lạnh hơn) đến đỏ (nóng hơn) theo trung vị mức thay đổi của ${F.n} mô hình so với 1985–2014. Sau năm 2014, dải tách thành SSP2-4.5 ở trên và SSP5-8.5 ở dưới.`,
    keyLabel: 'Thay đổi so với trung bình 1985–2014',
    badge: `CMIP6 · ${F.n} mô hình`
  };
  return {
    h1: `How much warmer will Vietnam get? <em>${nf(m245)} to ${nf(m585)}&nbsp;°C</em>`,
    byline: `Data graphics<span class="bydate">${today()}</span><span>Source: CMIP6, ${F.n} models</span>`,
    leadP1: `By 2071–2100 the median of the ${F.n} models has Vietnam's average temperature rising <b>${sdeg(m245)}</b> if emissions fall slowly after mid-century (SSP2-4.5), and <b>${sdeg(m585)}</b> if they keep rising (SSP5-8.5), compared with the 1985–2014 baseline. This is warming in Vietnam itself, not a global warming level like the +${nf(1.5)} or +2&nbsp;°C in the Hanoi report: by 2081–2100, the IPCC puts the whole world about <b>${deg(2.7)}</b> above pre-industrial under SSP2-4.5.`,
    pull: `${sdeg(m585)}<small>warming by 2071–2100 if emissions keep rising</small>`,
    cap: `Warming stripes 1950–2100: one stripe per year, coloured by the median change of the ${F.n} models from 1985–2014. Upper band: SSP2-4.5; lower band: SSP5-8.5.`,
    steps: {
      'tas-abs': `<h2>${cap(numWord(F.n))} models, ${numWord(F.n)} Vietnams</h2><p>Climate models split the planet into a grid of boxes and simulate the air, ocean and land inside them over decades. These are ${numWord(F.n)} of the models used in the IPCC's latest assessment, each giving Vietnam's average temperature from 1950 to 2014.</p><p>They don't agree on today's climate. For 1985–2014 they put the national average anywhere from <b>${deg(tMin)}</b> to <b>${deg(tMax)}</b>, a gap of <b>${deg(tMax - tMin)}</b>. Each model draws Vietnam's mountains, coastline and monsoon a little differently, so each starts from a slightly different climate.</p>`,
      'tas-anom': `<h2>Why we measure change</h2><p>Compare each model with its own 1985–2014 average and the lines fall together. The models disagree about how warm Vietnam is, but they tell a much more similar story about how it is changing.</p><p>Between 1950–1979 and 1985–2014 their median warmed by <b>${sdeg(mid(F.histW))}</b>. From here on, every number is a change from 1985–2014.</p>`,
      'tas-245': `<h2>Two futures</h2><p>What happens next depends on emissions. <b>SSP2-4.5</b> is a middle path: emissions stay near today's level until about mid-century, then fall slowly.</p><p>On that path the models project <b>${sdeg(m245)}</b> for 2071–2100 (individual models: ${rngT(F.t.ssp245)}). The shading shows the range across models.${H ? ` The two fastest-warming models are ${H[0].m} (${sdeg(H[0].d)}) and ${H[1].m} (${sdeg(H[1].d)}); the headline is the median, so they don't pull it up.` : ''}</p>`,
      'tas-585': `<p><b>SSP5-8.5</b> is the high-emissions path, where fossil-fuel use keeps growing through the century. The models project <b>${sdeg(m585)}</b> (individual models: ${rngT(F.t.ssp585)}).</p><p>${F.fork ? `The two paths stay close for decades. They are half a degree apart by about <b>${F.fork}</b>, and the gap reaches <b>${deg(F.endGap)}</b> by the ${decade}s.` : 'The two paths stay within half a degree of each other through the century.'}</p><p>The shaded window marks 2071–2100, the period behind every end-of-century number on this page.</p>`,
      'pr-abs': `<h2>Rain</h2><p>Rainfall is harder to simulate than temperature. It depends on monsoon winds, storms and mountains that a coarse model grid only roughly captures.</p><p>For 1985–2014 the models give Vietnam anywhere from <b>${nf(pMin, 0)}&nbsp;mm</b> to <b>${nf(pMax, 0)}&nbsp;mm</b> of rain a month, a difference of <b>${nf((pMax - pMin) / pMin * 100, 0)}%</b>.</p>`,
      'pr-agree': `<p>Measured as change, most models point to a wetter Vietnam by 2071–2100: <b>${wet('ssp245')} of ${F.n}</b> under SSP2-4.5 and <b>${wet('ssp585')} of ${F.n}</b> under SSP5-8.5. They disagree on how much, from <b>${sg(d3.min(allP))}%</b> to <b>${sg(d3.max(allP))}%</b>.</p><div class="agree-wrap">${agreeTable(F)}</div>`,
      'pr-hatch': `<p>Hatching on the chart marks years when fewer than ${need} of ${F.n} models agree on wetter or drier.</p><p>Under SSP5-8.5, ${F.early}% of the years from 2015 to 2049 are hatched, against ${F.late}% from 2050 on.${F.early > F.late + 20 ? ' In the early decades, natural ups and downs in rainfall are as large as the change; later, the signal stands out.' : ''}</p>`
    },
    source: `Source: CMIP6, ${F.n} models, area-weighted annual means for Vietnam. Lines are centred 10-year averages; change is from each model's own 1985–2014 average.`,
    stripesAria: `Warming stripes for Vietnam: one stripe per year from 1950 to 2100, coloured from blue (cooler) to red (warmer) by the median temperature change of the ${F.n} models from 1985–2014. After 2014 the band splits into SSP2-4.5 above and SSP5-8.5 below.`,
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
