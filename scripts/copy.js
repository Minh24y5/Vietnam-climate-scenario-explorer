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
    /* rain against warmth: each model and scenario's 2071–2100 change, and the rain change per degree */
    scale: ms.flatMap(m => ['ssp245', 'ssp585'].map(s => {
      const dT = eoc(D, 'tas', m, s, bs).d, dP = eoc(D, 'pr', m, s, bs).p;
      return {m, s, dT, dP, r: dT > 0.3 ? dP / dT : null};
    })),
    hot: ms.map((m, i) => ({m, d: eoc(D, 'tas', m, 'ssp245', bs).d})).sort((a, b) => b.d - a.d).slice(0, 2),
    gap40: mid(d3.range(90, 100).map(i => a585[i].mid - a245[i].mid).filter(x => !isNaN(x))),
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
  /* the gap between the two 2071–2100 medians; F.endGap (the last smoothed year) is quoted only where it is dated */
  const gap = m585 - m245;
  /* the two fastest-warming models, named only when there are enough models for the median to matter */
  const H = F.n >= 4 ? F.hot : null;
  /* the turn: the fork year, the zone holding Hà Nội (regional data only), the years until the fork */
  const forkDec = F.fork ? Math.floor(F.fork / 10) * 10 : null, yearsSet = F.fork ? F.fork - 2026 : null;
  const Z = typeof ZF !== 'undefined' && ZF && F.D === REAL ? ZF : null;
  /* rain per degree of warming, across models and scenarios; CC is the 7%/°C the air can hold */
  const R = F.scale.map(q => q.r).filter(x => x != null), rm = R.length ? mid(R) : null, CC = 7;
  const low = rm != null && rm < CC - 2;
  /* the water steps are on the page (real data with the water file) */
  const Wt = typeof WF !== 'undefined' && WF && F.D === REAL;
  const rr = s => Z ? Z.T[s].dbbb : null;
  if (LANG === 'vi') return {
    h1: forkDec ? `Việt Nam sẽ nóng thêm ${nf(m245)} đến ${nf(m585)}&nbsp;°C. <em>Từ nay đến thập niên ${forkDec}, đường đi gần như đã định</em>` : `Việt Nam sẽ nóng thêm bao nhiêu? <em>Từ ${nf(m245)} đến ${nf(m585)}&nbsp;°C</em>`,
    byline: `Đồ họa dữ liệu<span class="bydate">${today()}</span><span>Nguồn: CMIP6, ${F.n} mô hình</span>`,
    leadP1: `Đến giai đoạn 2071–2100, trung vị của ${F.n} mô hình cho thấy nhiệt độ trung bình của Việt Nam tăng <b>${sdeg(m245)}</b> nếu phát thải giảm dần sau giữa thế kỷ (kịch bản SSP2-4.5), và <b>${sdeg(m585)}</b> nếu phát thải tiếp tục tăng (SSP5-8.5), so với thời kỳ cơ sở 1985–2014.${F.fork ? ` Cho đến khoảng năm ${F.fork}, hai con đường này gần như trùng nhau.` : ''}`,
    pullNote: `Đây là mức ấm lên của riêng Việt Nam, không phải mức ấm lên toàn cầu như +${nf(1.5)} hay +2&nbsp;°C trong bài về Hà\u00a0Nội. Theo IPCC, đến 2081–2100 kịch bản SSP2-4.5 đưa cả Trái Đất lên khoảng ${deg(2.7)} so với thời tiền công nghiệp.`,
    pull: `${sdeg(m585)}<small>mức tăng 2071–2100 nếu phát thải tiếp tục tăng</small>`,
    cap: `Sọc ấm lên 1950–2100: mỗi sọc là một năm, tô theo trung vị mức thay đổi của ${F.n} mô hình so với 1985–2014. Dải trên: SSP2-4.5; dải dưới: SSP5-8.5.`,
    steps: {
      'tas-abs': `<h2>${cap(numWord(F.n))} mô hình, ${numWord(F.n)} Việt Nam</h2><p>Mô hình khí hậu chia Trái Đất thành lưới ô và mô phỏng không khí, đại dương, đất liền trong từng ô qua nhiều thập kỷ. Đây là ${numWord(F.n)} mô hình được dùng trong báo cáo mới nhất của IPCC, mỗi mô hình cho một đường nhiệt độ trung bình của Việt Nam từ 1950 đến 2014.</p><p>Chúng không thống nhất về khí hậu hiện tại. Với giai đoạn 1985–2014, nhiệt độ trung bình cả nước dao động từ <b>${deg(tMin)}</b> đến <b>${deg(tMax)}</b>, chênh nhau <b>${deg(tMax - tMin)}</b>. Mỗi mô hình vẽ núi non, bờ biển và gió mùa của Việt Nam hơi khác nhau, nên mỗi mô hình bắt đầu từ một khí hậu hơi khác.</p>`,
      'tas-anom': `<h2>Vì sao đo mức thay đổi</h2><p>Đem mỗi mô hình so với chính trung bình 1985–2014 của nó, các đường gần như chập lại. Các mô hình bất đồng về việc Việt Nam nóng đến đâu, nhưng kể một câu chuyện giống nhau hơn nhiều về việc Việt Nam đang thay đổi ra sao.</p><p>Từ 1950–1979 đến 1985–2014, trung vị các mô hình đã ấm lên <b>${sdeg(mid(F.histW))}</b>. Từ đây trở đi, mọi con số đều là mức thay đổi so với 1985–2014.</p>`,
      'tas-245': `<h2>Hai tương lai</h2><p>Điều xảy ra tiếp theo phụ thuộc vào phát thải. <b>SSP2-4.5</b> là con đường trung gian: phát thải giữ gần mức hiện nay đến khoảng giữa thế kỷ, rồi giảm dần.</p><p>Theo con đường đó, trung vị các mô hình là <b>${sdeg(m245)}</b> cho giai đoạn 2071–2100 (từng mô hình: ${rngT(F.t.ssp245)}). Vùng tô màu là biên độ giữa các mô hình.${H ? ` Hai mô hình nóng lên nhanh nhất là ${H[0].m} (${sdeg(H[0].d)}) và ${H[1].m} (${sdeg(H[1].d)}); con số chính là trung vị nên chúng không kéo nó lên.` : ''}</p>`,
      'tas-585': `<p><b>SSP5-8.5</b> là con đường phát thải cao, khi việc dùng nhiên liệu hóa thạch tiếp tục tăng suốt thế kỷ. Các mô hình dự tính <b>${sdeg(m585)}</b> (từng mô hình: ${rngT(F.t.ssp585)}).</p><p>Khung tô xám đánh dấu giai đoạn 2071–2100, thời kỳ dùng cho mọi con số cuối thế kỷ trên trang này.</p><p>Thoạt nhìn, đó là những con số nhỏ: Việt Nam vốn là xứ nóng, vài độ có vẻ chịu được. Chúng cũng nghe xa, như chuyện của cuối thế kỷ, và tùy cả vào việc thế giới cắt giảm phát thải đến đâu.</p>`,
      'tas-fork': F.fork ? `<h2>Nhưng những thập kỷ tới đã gần như định sẵn</h2><p>Theo cả hai con đường, Việt Nam nóng lên gần như bằng nhau đến thập niên ${forkDec}: trong thập niên 2040 chúng chỉ cách nhau <b>${deg(F.gap40)}</b>, và đến khoảng năm <b>${F.fork}</b> mới cách nhau nửa độ.</p><p>Mức ấm lên của khoảng ${yearsSet} năm tới phần lớn đến từ khí nhà kính đã có trong khí quyển và từ việc hệ thống năng lượng của thế giới chuyển đổi chậm. Điều thế giới quyết định hôm nay hiện ra muộn hơn: đến thập niên ${decade}, hai con đường cách nhau <b>${deg(F.endGap)}</b>.</p>` : '',
      close: F.fork ? `<h2>Vì vậy, hai việc cùng lúc</h2><p>Mức ấm lên của Việt Nam trong những thập kỷ tới phần lớn đã trên đường đến, miền Bắc nóng hơn con số cả nước, và cái nóng đã bắt đầu gây thiệt hại${Wt ? ', cùng với mưa dồn hơn và hạn hán thường hơn ở miền Bắc' : ''}.</p><p>Thích ứng là việc của hôm nay: khoảng ${yearsSet} năm tới sẽ nóng lên gần như nhau dù thế giới quyết định gì${Z ? `, và miền Bắc cần chuẩn bị cho nhiều hơn mức trung bình cả nước` : ''}.</p><p>Cắt giảm phát thải là việc cho nửa sau thế kỷ: nó quyết định Việt Nam kết thúc thế kỷ ấm hơn <b>${sdeg(m245)}</b> hay <b>${sdeg(m585)}</b>, chênh nhau <b>${deg(gap)}</b>.${Wt ? ' Nhưng nó cũng có lợi ngay hôm nay. Năm 2020, bụi mịn từ hoạt động của con người gây khoảng <b>34.000</b> ca tử vong ở Việt Nam, nhiều hơn 72% so với 2005, trong khi than đá chiếm kỷ lục 51,6% nguồn năng lượng (Lancet Countdown 2023). Bớt đốt than là bớt khí nhà kính, và cũng là không khí sạch hơn ngay trong năm.' : ''}</p><p>Bài riêng về <a href="hanoi.html">Hà\u00a0Nội</a> cho thấy điều này nghĩa là gì ở một thành phố, đến từng ngày nắng nóng.</p>` : '',
      'pr-abs': `<h2>Nhưng hơi nóng còn đổi cả cơn mưa</h2><p>Không khí ấm thêm 1&nbsp;°C giữ được thêm khoảng ${CC}% hơi nước. Vì vậy nóng lên còn đổi lượng nước mỗi trận mưa có thể trút xuống, và tốc độ đất, ruộng và hồ chứa khô đi giữa hai trận mưa${Z ? ', như tháng Năm và tháng Sáu 2023' : ''}.</p><p>Lượng mưa khó mô phỏng hơn nhiệt độ. Nó phụ thuộc vào gió mùa, bão và địa hình mà lưới thô của mô hình chỉ thể hiện được một cách gần đúng.</p><p>Với giai đoạn 1985–2014, các mô hình cho Việt Nam lượng mưa từ <b>${nf(pMin, 0)}&nbsp;mm</b> đến <b>${nf(pMax, 0)}&nbsp;mm</b> mỗi tháng, chênh nhau <b>${nf((pMax - pMin) / pMin * 100, 0)}%</b>.</p>`,
      'pr-agree': `<p>Khi đo mức thay đổi, phần lớn mô hình cho thấy Việt Nam ẩm ướt hơn vào 2071–2100: <b>${wet('ssp245')}/${F.n}</b> mô hình theo SSP2-4.5 và <b>${wet('ssp585')}/${F.n}</b> theo SSP5-8.5. Nhưng chúng bất đồng về mức độ, từ <b>${sg(d3.min(allP))}%</b> đến <b>${sg(d3.max(allP))}%</b>.</p><div class="agree-wrap">${agreeTable(F)}</div>`,
      'pr-hatch': `<p>Phần gạch chéo trên biểu đồ đánh dấu những năm có ít hơn ${need}/${F.n} mô hình đồng ý về xu hướng ẩm hơn hay khô hơn.</p><p>Theo SSP5-8.5, ${F.early}% số năm từ 2015 đến 2049 bị gạch chéo, so với ${F.late}% từ 2050 trở đi.${F.early > F.late + 20 ? ' Trong những thập kỷ đầu, dao động tự nhiên của lượng mưa lớn ngang mức thay đổi; về sau, tín hiệu mới nổi rõ.' : ''}</p>`,
      'pr-scale': rm == null ? '' : `<p>Đặt mức ấm lên cạnh mức thay đổi lượng mưa của từng mô hình, ở mỗi kịch bản, thì tổng lượng mưa năm tăng trung vị <b>${sg(rm)}%</b> cho mỗi độ ấm lên (từ ${sg(d3.min(R))}% đến ${sg(d3.max(R))}%). ${low ? `Con số ấy thấp hơn nhiều so với mức ${CC}% hơi nước mà không khí giữ thêm được.` : `Con số ấy gần với mức ${CC}% hơi nước mà không khí giữ thêm được.`}</p>` +
        (low ? `<p>Theo IPCC, phần hơi nước dôi ra dồn vào những trận mưa lớn nhất, vốn mạnh thêm khoảng ${CC}% cho mỗi độ ấm lên toàn cầu. Lượng mưa trung bình năm che mất điều đó; bài về <a href="hanoi.html">Hà Nội</a> đếm những ngày mưa to ở từng mức ấm lên.</p>` : '')
    },
    source: `Nguồn: CMIP6, ${F.n} mô hình, trung bình năm có trọng số diện tích cho Việt Nam. Các đường là trung bình trượt 10 năm; mức thay đổi tính so với trung bình 1985–2014 của từng mô hình.`,
    stripesAria: `Sọc ấm lên của Việt Nam: mỗi sọc là một năm từ 1950 đến 2100, tô từ xanh (lạnh hơn) đến đỏ (nóng hơn) theo trung vị mức thay đổi của ${F.n} mô hình so với 1985–2014. Sau năm 2014, dải tách thành SSP2-4.5 ở trên và SSP5-8.5 ở dưới.`,
    keyLabel: 'Thay đổi so với trung bình 1985–2014',
    badge: `CMIP6 · ${F.n} mô hình`
  };
  return {
    h1: forkDec ? `Vietnam will warm ${nf(m245)} to ${nf(m585)}&nbsp;°C. <em>Until the ${forkDec}s, the path is mostly set</em>` : `How much warmer will Vietnam get? <em>${nf(m245)} to ${nf(m585)}&nbsp;°C</em>`,
    byline: `Data graphics<span class="bydate">${today()}</span><span>Source: CMIP6, ${F.n} models</span>`,
    leadP1: `By 2071–2100 the median of the ${F.n} models has Vietnam's average temperature rising <b>${sdeg(m245)}</b> if emissions fall slowly after mid-century (SSP2-4.5), and <b>${sdeg(m585)}</b> if they keep rising (SSP5-8.5), compared with the 1985–2014 baseline.${F.fork ? ` Until about ${F.fork}, the two paths stay almost the same.` : ''}`,
    pullNote: `This is warming in Vietnam itself, not a global warming level like the +${nf(1.5)} or +2&nbsp;°C in the Hanoi report. The IPCC puts the whole world about ${deg(2.7)} above pre-industrial by 2081–2100 under SSP2-4.5.`,
    pull: `${sdeg(m585)}<small>warming by 2071–2100 if emissions keep rising</small>`,
    cap: `Warming stripes 1950–2100: one stripe per year, coloured by the median change of the ${F.n} models from 1985–2014. Upper band: SSP2-4.5; lower band: SSP5-8.5.`,
    steps: {
      'tas-abs': `<h2>${cap(numWord(F.n))} models, ${numWord(F.n)} Vietnams</h2><p>Climate models split the planet into a grid of boxes and simulate the air, ocean and land inside them over decades. These are ${numWord(F.n)} of the models used in the IPCC's latest assessment, each giving Vietnam's average temperature from 1950 to 2014.</p><p>They don't agree on today's climate. For 1985–2014 they put the national average anywhere from <b>${deg(tMin)}</b> to <b>${deg(tMax)}</b>, a gap of <b>${deg(tMax - tMin)}</b>. Each model draws Vietnam's mountains, coastline and monsoon a little differently, so each starts from a slightly different climate.</p>`,
      'tas-anom': `<h2>Why we measure change</h2><p>Compare each model with its own 1985–2014 average and the lines fall together. The models disagree about how warm Vietnam is, but they tell a much more similar story about how it is changing.</p><p>Between 1950–1979 and 1985–2014 their median warmed by <b>${sdeg(mid(F.histW))}</b>. From here on, every number is a change from 1985–2014.</p>`,
      'tas-245': `<h2>Two futures</h2><p>What happens next depends on emissions. <b>SSP2-4.5</b> is a middle path: emissions stay near today's level until about mid-century, then fall slowly.</p><p>On that path the model median is <b>${sdeg(m245)}</b> for 2071–2100 (individual models: ${rngT(F.t.ssp245)}). The shading shows the range across models.${H ? ` The two fastest-warming models are ${H[0].m} (${sdeg(H[0].d)}) and ${H[1].m} (${sdeg(H[1].d)}); the headline is the median, so they don't pull it up.` : ''}</p>`,
      'tas-585': `<p><b>SSP5-8.5</b> is the high-emissions path, where fossil-fuel use keeps growing through the century. The models project <b>${sdeg(m585)}</b> (individual models: ${rngT(F.t.ssp585)}).</p><p>The shaded window marks 2071–2100, the period behind every end-of-century number on this page.</p><p>At first sight these are small numbers: Vietnam is a hot country, and a few degrees sound bearable. They also sound far off, a matter for the end of the century, and up to how much the world cuts emissions.</p>`,
      'tas-fork': F.fork ? `<h2>But the next decades are mostly set</h2><p>Under both paths, Vietnam warms by nearly the same amount until the ${forkDec}s: in the 2040s they are only <b>${deg(F.gap40)}</b> apart, and they first move half a degree apart around <b>${F.fork}</b>.</p><p>The warming of the next ${yearsSet} years or so comes mostly from greenhouse gases already in the air and from how slowly the world's energy systems change. What the world decides today shows up later: by the ${decade}s the two paths are <b>${deg(F.endGap)}</b> apart.</p>` : '',
      close: F.fork ? `<h2>So, two jobs at once</h2><p>Vietnam's warming over the coming decades is mostly on its way, the north warms more than the national figure, and the heat is already costing the country money${Wt ? ', alongside harder rain and more frequent drought in the north' : ''}.</p><p>Adapting is for now: the next ${yearsSet} years or so warm by about the same amount whatever the world decides${Z ? `, and the north should plan for more than the national average` : ''}.</p><p>Cutting emissions is for the second half of the century: it decides whether Vietnam ends the century <b>${sdeg(m245)}</b> or <b>${sdeg(m585)}</b> warmer, a difference of <b>${deg(gap)}</b>.${Wt ? ' But it pays off today too. In 2020, fine-particle pollution from human activity caused about <b>34,000</b> deaths in Vietnam, 72% more than in 2005, while coal reached a record 51.6% of energy supply (Lancet Countdown 2023). Burning less coal means fewer greenhouse gases, and cleaner air within the year.' : ''}</p><p>The <a href="hanoi.html">Hanoi report</a> shows what this means in one city, down to the number of hot days.</p>` : '',
      'pr-abs': `<h2>But heat changes the rain, too</h2><p>Air that is 1&nbsp;°C warmer can hold about ${CC}% more water vapour. So warming also changes how much water a single storm can drop, and how fast soil, fields and reservoirs dry out between storms${Z ? ', as they did in May and June 2023' : ''}.</p><p>Rainfall is harder to simulate than temperature. It depends on monsoon winds, storms and mountains that a coarse model grid only roughly captures.</p><p>For 1985–2014 the models give Vietnam anywhere from <b>${nf(pMin, 0)}&nbsp;mm</b> to <b>${nf(pMax, 0)}&nbsp;mm</b> of rain a month, a difference of <b>${nf((pMax - pMin) / pMin * 100, 0)}%</b>.</p>`,
      'pr-agree': `<p>Measured as change, most models point to a wetter Vietnam by 2071–2100: <b>${wet('ssp245')} of ${F.n}</b> under SSP2-4.5 and <b>${wet('ssp585')} of ${F.n}</b> under SSP5-8.5. They disagree on how much, from <b>${sg(d3.min(allP))}%</b> to <b>${sg(d3.max(allP))}%</b>.</p><div class="agree-wrap">${agreeTable(F)}</div>`,
      'pr-hatch': `<p>Hatching on the chart marks years when fewer than ${need} of ${F.n} models agree on wetter or drier.</p><p>Under SSP5-8.5, ${F.early}% of the years from 2015 to 2049 are hatched, against ${F.late}% from 2050 on.${F.early > F.late + 20 ? ' In the early decades, natural ups and downs in rainfall are as large as the change; later, the signal stands out.' : ''}</p>`,
      'pr-scale': rm == null ? '' : `<p>Set each model's warming beside its rainfall change, scenario by scenario, and the yearly rain total grows a median <b>${sg(rm)}%</b> per degree of warming (from ${sg(d3.min(R))}% to ${sg(d3.max(R))}%). ${low ? `That is far less than the ${CC}% more water vapour the air can hold.` : `That is close to the ${CC}% more water vapour the air can hold.`}</p>` +
        (low ? `<p>The IPCC finds the extra vapour goes into the heaviest downpours, which grow about ${CC}% stronger for each degree of global warming. A yearly average hides that; the <a href="hanoi.html">Hanoi report</a> counts the heavy-rain days at each warming level.</p>` : '')
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
