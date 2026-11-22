'use strict';
/* The rain-against-warmth scatter in the pinned story figure: each model's 2071–2100 warming
   against its rainfall change, one dot per scenario, with the 7%/°C the air can hold drawn as a guide. */

function StoryScatter(el) {
  const svg = d3.select(el).append('svg').attr('aria-hidden', 'true');
  const G = {};
  for (const k of ['grid', 'x', 'y', 'zero', 'refs', 'pairs', 'dots', 'labels']) G[k] = svg.append('g');
  G.grid.attr('class', 'grid'); G.x.attr('class', 'axis'); G.y.attr('class', 'axis');
  const unitY = svg.append('text').attr('class', 'unit').attr('x', 0).attr('y', 14);
  const unitX = svg.append('text').attr('class', 'unit').attr('text-anchor', 'end');
  const CC = 7;

  function render(F) {
    const vi = LANG === 'vi';
    const pts = F.scale.filter(q => isFinite(q.dT) && isFinite(q.dP));
    const R = pts.map(q => q.r).filter(x => x != null), rm = R.length ? mid(R) : 0;
    const W = el.clientWidth || 600, narrow = W < 560;
    $('#storyLegend').innerHTML =
      `<span><i class="dot" style="--c:${SCEN.ssp245.c}"></i>SSP2-4.5</span><span><i class="dot" style="--c:${SCEN.ssp585.c}"></i>SSP5-8.5</span>` +
      `<span><i class="ln dash" style="--c:var(--muted)"></i>${vi ? `${nf(CC, 0)}%/°C: hơi nước không khí giữ thêm` : `${nf(CC, 0)}%/°C: extra vapour the air can hold`}</span>` +
      `<span><i class="ln" style="--c:var(--ink)"></i>${vi ? 'Trung vị các mô hình' : 'Model median'}</span>`;
    const H = Math.max(240, el.clientHeight || 400);
    const mg = {t: 32, r: narrow ? 20 : 120, b: 46, l: narrow ? 40 : 50};
    svg.attr('width', W).attr('height', H);

    const xMax = (d3.max(pts, q => q.dT) || 1) * 1.08;
    const yLo = Math.min(0, d3.min(pts, q => q.dP)), yHi = Math.max(d3.max(pts, q => q.dP), CC * xMax);
    const pad = (yHi - yLo) * .05;
    const x = d3.scaleLinear([0, xMax], [mg.l, W - mg.r]).nice();
    const y = d3.scaleLinear([yLo - pad, yHi + pad], [H - mg.b, mg.t]).nice();
    const [x0, x1] = x.domain();

    unitY.text(vi ? '% thay đổi lượng mưa năm' : '% change in yearly rain');
    unitX.attr('x', W - mg.r).attr('y', H - 6).text(vi ? 'Mức ấm lên của Việt Nam, 2071–2100 (°C)' : 'Warming in Vietnam, 2071–2100 (°C)');
    G.grid.attr('transform', `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(6).tickSize(-(W - mg.l - mg.r)).tickFormat(''));
    G.x.attr('transform', `translate(0,${H - mg.b})`).call(d3.axisBottom(x).ticks(narrow ? 4 : 6).tickFormat(v => nf(v, 0)).tickSizeOuter(0));
    G.y.attr('transform', `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(v => v === 0 ? '0' : fmt('+')(v)).tickSizeOuter(0));
    G.zero.selectAll('line').data([0]).join('line').attr('class', 'zero')
      .attr('x1', mg.l).attr('x2', W - mg.r).attr('y1', y(0)).attr('y2', y(0));

    /* guide lines through the origin, clipped to the plot */
    const ref = (k, slope) => { const xe = Math.min(x1, slope > 0 ? (y.domain()[1]) / slope : x1); return {k, slope, xe}; };
    const refs = [ref('cc', CC), ref('med', rm)];
    G.refs.selectAll('line').data(refs, d => d.k).join('line')
      .attr('x1', x(0)).attr('y1', y(0)).attr('x2', d => x(d.xe)).attr('y2', d => y(d.slope * d.xe))
      .style('stroke', d => d.k === 'cc' ? 'var(--muted)' : 'var(--ink)').style('stroke-width', d => d.k === 'cc' ? 1.5 : 2)
      .style('stroke-dasharray', d => d.k === 'cc' ? '5 4' : null);
    const refLab = narrow ? [] : refs.map(d => ({k: d.k, x: x(d.xe) + 6, y: y(d.slope * d.xe) + 4,
      txt: d.k === 'cc' ? `${nf(CC, 0)}%/°C` : `${sg(rm)}%/°C`}));
    G.refs.selectAll('text').data(refLab, d => d.k).join('text').attr('class', 'endlabel')
      .attr('x', d => d.x).attr('y', d => d.y).style('fill', d => d.k === 'cc' ? 'var(--muted)' : 'var(--ink)').text(d => d.txt);

    /* one thin line per model joining its two scenarios, then the dots */
    const byM = d3.groups(pts, q => q.m).filter(([, a]) => a.length === 2);
    G.pairs.selectAll('line').data(byM, d => d[0]).join('line')
      .attr('x1', d => x(d[1][0].dT)).attr('y1', d => y(d[1][0].dP)).attr('x2', d => x(d[1][1].dT)).attr('y2', d => y(d[1][1].dP))
      .style('stroke', 'var(--hist)').style('stroke-width', 1).style('opacity', .6);
    G.dots.selectAll('circle').data(pts, d => d.m + d.s).join('circle')
      .attr('cx', d => x(d.dT)).attr('cy', d => y(d.dP)).attr('r', narrow ? 4.5 : 5.5)
      .style('fill', d => SCEN[d.s].c).style('stroke', 'var(--bg)').style('stroke-width', 1.5);
    /* model names beside their SSP5-8.5 dot, on wide screens */
    const labs = narrow ? [] : pts.filter(q => q.s === 'ssp585').map(q => ({k: q.m, txt: q.m, x: x(q.dT) + 9, y: y(q.dP) + 4}));
    spread(labs, 15, mg.t, H - mg.b);
    G.labels.selectAll('text').data(labs, d => d.k).join('text').attr('class', 'endlabel model')
      .attr('x', d => d.x).attr('y', d => d.y).text(d => d.txt);

    el.setAttribute('aria-label', (vi
      ? `Mức ấm lên và mức thay đổi lượng mưa năm 2071–2100 của từng mô hình: `
      : `Warming and yearly rain change by 2071–2100, per model: `) +
      pts.map(q => `${q.m} ${SCEN[q.s].name} ${sg(q.dT)} °C, ${sg(q.dP)}%`).join('; ') + '.');
    $('#storySource').textContent = REAL
      ? (vi ? `Nguồn: CMIP6, ${F.n} mô hình, trung bình 2071–2100 so với 1985–2014. Mức ${nf(CC, 0)}%/°C và mưa cực đoan: IPCC AR6, Nhóm công tác I, Tóm tắt cho nhà hoạch định chính sách (B.2.2).`
            : `Source: CMIP6, ${F.n} models, 2071–2100 average against 1985–2014. The ${nf(CC, 0)}%/°C figure and extreme rain: IPCC AR6, Working Group I, Summary for Policymakers (B.2.2).`)
      : `${t('synthetic')}.`;
  }
  return {render};
}
