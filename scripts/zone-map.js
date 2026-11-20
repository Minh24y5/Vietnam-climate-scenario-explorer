'use strict';
/* The zone map component (story and explorer) and the colour ramp key. */

/* a zone map: story (labels, neighbours, grid) or explorer (click to pick) */
const ZONE_LABEL = {tb: {at: [102.95, 21.0]}, db: {at: [105.9, 22.35]}, dbbb: {at: [107.35, 19.75], to: [106.2, 20.5]},
  btb: {at: [105.05, 19.15]}, ntb: {at: [109.75, 14.75], to: [108.95, 14.6]}, tn: {at: [107.55, 12.85]}, nb: {at: [105.75, 10.05]}};
const ISLAND_LABEL = {hs: {at: [112.0, 17.35], a: 'middle'}, ts: {at: [115.85, 11.9], a: 'end'}};
/* phones: short names under the dots, no neighbour names */
const ISLAND_LABEL_NARROW = {hs: {at: [112.0, 17.45], a: 'middle'}, ts: {at: [115.9, 8.95], a: 'end'}};
const shortIsle = n => n.replace(/^Quần đảo /, '').replace(/ \(.*\)| Islands$/g, '');
const NEAR_LABEL = [['nbChina', [109.3, 22.75]], ['nbLaos', [103.0, 17.7]], ['nbCambodia', [104.75, 12.9]], ['seaName', [114.3, 19.4], true]];

function ZoneMap(el, {story = false} = {}) {
  const svg = d3.select(el).append('svg').attr('aria-hidden', 'true').attr('focusable', 'false');
  const G = {};
  for (const k of ['land', 'zones', 'borders', 'grid', 'pick', 'islands', 'labels']) G[k] = svg.append('g').attr('class', 'm-' + k);
  let feats = null, prevGrid = false;
  function setTopo(T) {
    feats = {
      zones: topojson.feature(T, T.objects.zones).features,
      islands: topojson.feature(T, T.objects.islands).features,
      land: topojson.feature(T, T.objects.land),
      inner: topojson.mesh(T, T.objects.zones, (a, b) => a !== b),
      outer: topojson.mesh(T, T.objects.zones, (a, b) => a === b)
    };
  }
  /* o: {fill(id), label(id) -> value text, grid: cells|null, selected, onPick, maxH} */
  function render(o) {
    if (!feats) return;
    const W = el.clientWidth || 300, H = Math.round(Math.min(o.maxH || Infinity, W * 1.08));
    const narrow = W < 420;
    svg.attr('width', W).attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).classed('narrow', narrow);
    const fit = {type: 'FeatureCollection', features: feats.zones.concat(feats.islands)};
    const proj = d3.geoMercator().fitExtent([[4, story ? 8 : 4], [W - 4, H - (story ? 8 : 4)]], fit);
    const path = d3.geoPath(proj);
    G.land.selectAll('path').data([feats.land]).join('path').attr('class', 'nb-land').attr('d', path);
    G.zones.selectAll('path').data(feats.zones, d => d.properties.id).join('path').attr('class', 'zone')
      .attr('d', path).style('fill', d => o.fill(d.properties.id));
    G.borders.selectAll('path').data([['inner', feats.inner], ['outer', feats.outer]]).join('path')
      .attr('class', d => 'z-' + d[0]).attr('d', d => path(d[1]));
    /* grid cells of one model, drawn as their real lon/lat boxes */
    const cells = o.grid || [];
    const gsel = G.grid.selectAll('rect').data(cells).join('rect').attr('class', 'cell')
      .attr('x', c => proj([c[0], c[3]])[0]).attr('y', c => proj([c[0], c[3]])[1])
      .attr('width', c => proj([c[2], c[1]])[0] - proj([c[0], c[1]])[0]).attr('height', c => proj([c[0], c[1]])[1] - proj([c[0], c[3]])[1]);
    if (cells.length && !prevGrid && !reduceMotion.matches) gsel.style('opacity', 0).transition().duration(500).style('opacity', 1);
    else gsel.style('opacity', 1);
    prevGrid = !!cells.length;
    /* selection outline and pointer targets (explorer only) */
    const selF = o.selected && o.selected !== 'vn' ? feats.zones.filter(f => f.properties.id === o.selected) : [];
    G.pick.selectAll('path.sel').data(o.selected === 'vn' ? [feats.outer] : selF).join('path').attr('class', 'sel').attr('d', path);
    G.zones.selectAll('path').classed('pickable', !!o.onPick).on('click', o.onPick ? (e, d) => o.onPick(d.properties.id) : null)
      .selectAll('title').data(d => o.title ? [d] : []).join('title').text(d => o.title(d.properties.id));
    /* the archipelagos: dots at each island, named, flagged as having no model data */
    const dots = feats.islands.flatMap(f => (f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates])
      .map(c => ({id: f.properties.id, p: proj(d3.geoCentroid({type: 'Polygon', coordinates: c}))})));
    G.islands.selectAll('circle').data(dots).join('circle').attr('class', 'isle').attr('r', story ? 1.6 : 1.2).attr('cx', d => d.p[0]).attr('cy', d => d.p[1]);
    const full = story && !narrow, IL = full || !story ? ISLAND_LABEL : ISLAND_LABEL_NARROW;
    const il = feats.islands.map(f => ({id: f.properties.id, ...IL[f.properties.id], name: LANG === 'vi' ? f.properties.vi : f.properties.en}));
    const isl = G.islands.selectAll('text').data(il, d => d.id).join('text').attr('class', 'isle-name')
      .attr('text-anchor', d => d.a).attr('x', d => proj(d.at)[0]).attr('y', d => proj(d.at)[1]);
    isl.selectAll('tspan').data(d => full ? [d.name, t('noModelData')] : [shortIsle(d.name)])
      .join('tspan').attr('x', function () { return d3.select(this.parentNode).attr('x'); }).attr('dy', (_, i) => i ? '1.2em' : 0)
      .attr('class', (_, i) => i ? 'nodata' : null).text(d => d);
    /* value labels and neighbour names (story only) */
    let lab = [];
    if (story && o.label) lab = feats.zones.map(f => {
      const id = f.properties.id, L = ZONE_LABEL[id];
      return {id, at: proj(L.at), to: L.to ? proj(L.to) : null, name: zoneName(id), v: o.label(id)};
    });
    G.labels.selectAll('line.leader').data(lab.filter(d => d.to), d => d.id).join('line').attr('class', 'leader')
      .attr('x1', d => d.at[0] - 3).attr('y1', d => d.at[1] - 4).attr('x2', d => d.to[0]).attr('y2', d => d.to[1]);
    const zl = G.labels.selectAll('text.zl').data(lab, d => d.id).join('text').attr('class', 'zl')
      .attr('text-anchor', d => d.to ? 'start' : 'middle').attr('x', d => d.at[0]).attr('y', d => d.at[1]);
    zl.selectAll('tspan').data(d => [{k: 'zn', s: d.name}, {k: 'zv', s: d.v}]).join('tspan')
      .attr('class', d => d.k).attr('x', function () { return d3.select(this.parentNode).attr('x'); })
      .attr('dy', (_, i) => i ? (narrow ? '1.1em' : '1.15em') : 0).text(d => d.s);
    const near = full ? NEAR_LABEL.map(([k, at, sea]) => ({k, p: proj(at), sea})) : [];
    G.labels.selectAll('text.near').data(near, d => d.k).join('text').attr('class', d => 'near' + (d.sea ? ' sea' : ''))
      .attr('text-anchor', 'middle').attr('x', d => d.p[0]).attr('y', d => d.p[1]).text(d => t(d.k));
  }
  return {setTopo, render};
}

/* a compact colour key, like the stripes key */
function rampKey(el, scale, ticks, fmtTick, label) {
  const [a, b] = [ticks[0], ticks[ticks.length - 1]];
  const sw = d3.range(24).map(i => `<i style="background:${scale(a + (b - a) * (i + .5) / 24)}"></i>`).join('');
  el.innerHTML = (label ? `<span>${label}</span>` : '') + `<div class="key-row">${sw}</div><div class="key-ticks">${ticks.map(v => `<span>${fmtTick(v)}</span>`).join('')}</div>`;
}
