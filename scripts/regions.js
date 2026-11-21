'use strict';
/* Regions: the 7 climate zones, their facts and the map chapter copy. */

/* ---------- regions: 7 climate zones ---------- */
const REG_URL = 'data/vietnam_regions.json', TOPO_URL = 'data/vietnam_zones.json';
let REG = null, TOPO = null;
const ZONE_EN = {tb: 'the Northwest', db: 'the Northeast', dbbb: 'the Red River Delta', btb: 'the North Central region',
  ntb: 'the South Central Coast', tn: 'the Central Highlands', nb: 'the South'};
const zoneIds = () => REG.meta.zones.map(z => z.id);
const zoneName = id => { const z = REG.meta.zones.find(q => q.id === id); return LANG === 'vi' ? z.vi : z.en; };
/* the zone as it sits mid-sentence: "Tây Bắc" / "the Northwest" */
const zoneIn = id => LANG === 'vi' ? zoneName(id) : ZONE_EN[id];
const placeOver = id => (!id || id === 'vn') ? t('over') : LANG === 'vi' ? `của vùng ${zoneName(id)}` : `over ${ZONE_EN[id]}`;
const prColor = d3.scaleDiverging([-20, 0, 20], d3.interpolateBrBG).clamp(true);
/* geography, not data: the three zones of the north and the three of the south (Bắc Trung Bộ lies between) */
const NORTH = ['tb', 'db', 'dbbb'], SOUTH = ['ntb', 'tn', 'nb'];

function checkRegions(r) {
  if (!r || !r.meta || !Array.isArray(r.meta.zones) || !r.regions || !r.grid) throw new Error('regions file is missing meta, regions or grid');
  for (const z of r.meta.zones) { if (!r.regions[z.id]) throw new Error(`zone ${z.id} has no series`); checkData(r.regions[z.id]); }
}

/* zone facts for the map chapter, all computed from the regional file */
function zoneFacts(R, F) {
  const zs = R.meta.zones.map(z => z.id), ms = modelsOf(R.regions[zs[0]]);
  const ch = (z, s, m) => eoc(R.regions[z], 'tas', m, s, 1985).d;
  const T = {}, order = {}, agree = {};
  for (const s of Object.keys(SCEN)) {
    T[s] = Object.fromEntries(zs.map(z => [z, mid(ms.map(m => ch(z, s, m)))]));
    order[s] = zs.slice().sort((a, b) => T[s][b] - T[s][a]);
    agree[s] = ms.filter(m => d3.greatest(zs, z => ch(z, s, m)) === order[s][0]).length;
  }
  const cellDeg = m => R.grid[m].cells.map(c => [c[3] - c[1], c[2] - c[0]]);
  const cellArea = m => mean(cellDeg(m).map(([a, b]) => a * b));
  const coarse = d3.greatest(ms, cellArea), fine = d3.least(ms, cellArea);
  const small = d3.least(R.meta.zones, z => z.area_km2).id;
  const dims = m => [d3.median(cellDeg(m), d => d[0]), d3.median(cellDeg(m), d => d[1])];
  /* the north–south contrast: range of each group, and how many models put every northern zone above every southern one */
  const grp = {}, ns = {};
  for (const s of Object.keys(SCEN)) {
    grp[s] = {north: d3.extent(NORTH, z => T[s][z]), south: d3.extent(SOUTH, z => T[s][z])};
    ns[s] = ms.filter(m => d3.min(NORTH, z => ch(z, s, m)) > d3.max(SOUTH, z => ch(z, s, m))).length;
  }
  return {zs, ms, n: ms.length, T, order, agree, coarse, fine, small, dims, grp, ns,
    cells: m => R.grid[m].cells.length, eq: (m, z) => R.grid[m].equivalent[z],
    spread: s => T[s][order[s][0]] - T[s][order[s].at(-1)], gap: mid(F.t.ssp585) - mid(F.t.ssp245)};
}

function mapCopy(Z) {
  const sdeg = x => `${sg(x)}&nbsp;°C`, deg = x => `${nf(x)}&nbsp;°C`;
  const hi = s => Z.order[s][0];
  const [dl, dn] = Z.dims(Z.coarse), eq = Z.eq(Z.coarse, Z.small), spread = Z.spread('ssp585');
  /* "+4,0 đến +4,1 °C", or one figure when both ends round alike */
  const span = ([a, b]) => sg(a) === sg(b) ? sdeg(a) : `${sg(a)} ${t('to')} ${sg(b)}&nbsp;°C`;
  const G = Z.grp, both = Z.ns.ssp245 === Z.n && Z.ns.ssp585 === Z.n, need = agreeNeed(Z.n);
  const names = ids => ids.map(zoneIn).join(', ').replace(/, ([^,]*)$/, LANG === 'vi' ? ' và $1' : ' and $1');
  if (LANG === 'vi') return {
    'map-zones': `<h2>Nơi nóng lên nhiều nhất</h2><p>Con số cả nước là trung bình của những vùng nóng lên với mức khác nhau. Chia Việt Nam thành bảy vùng khí hậu, theo SSP5-8.5 ba vùng phía Bắc (${names(NORTH)}) nóng lên <b>${span(G.ssp585.north)}</b> vào 2071–2100, còn ba vùng phía Nam (${names(SOUTH)}) nóng lên <b>${span(G.ssp585.south)}</b>. Theo SSP2-4.5 là <b>${span(G.ssp245.north)}</b> so với <b>${span(G.ssp245.south)}</b>.</p>` +
      `<p>${both ? `Cả ${numWord(Z.n)} mô hình, theo cả hai kịch bản, đều cho mọi vùng phía Bắc nóng lên nhiều hơn mọi vùng phía Nam.` : `${cap(numWord(Z.ns.ssp585))} trong ${numWord(Z.n)} mô hình cho mọi vùng phía Bắc nóng lên nhiều hơn mọi vùng phía Nam theo SSP5-8.5.`} ` +
      `${Z.agree.ssp585 < need ? 'Nhưng vùng nào nóng nhất thì các mô hình không thống nhất.' : `${zoneIn(hi('ssp585'))} đứng đầu trong ${Z.agree.ssp585}/${Z.n} mô hình.`}</p>` +
      `<p>${spread < Z.gap ? `Theo SSP5-8.5, mức nóng lên của vùng nhiều nhất và vùng ít nhất chênh nhau <b>${deg(spread)}</b>. Con đường phát thải tạo khác biệt lớn hơn: tính cả nước, hai kịch bản cách nhau <b>${deg(Z.gap)}</b> vào 2071–2100.` : `Theo SSP5-8.5, mức nóng lên của vùng nhiều nhất và vùng ít nhất chênh nhau <b>${deg(spread)}</b>, gần bằng khoảng cách <b>${deg(Z.gap)}</b> giữa hai kịch bản tính cả nước.`}</p>`,
    'map-grid': `<p>Các ô vuông là lưới của <b>${Z.coarse}</b>, mô hình thô nhất trong ${numWord(Z.n)} mô hình. Mỗi ô khoảng ${nf(dl)}° × ${nf(dn)}°, chỉ <b>${Z.cells(Z.coarse)}</b> ô chạm đất liền Việt Nam, và cả ${zoneIn(Z.small)} chỉ có diện tích bằng khoảng <b>${nf(eq)}</b> ô.</p>` +
      `<p>Vì vậy, giá trị của một vùng nhỏ phần lớn đến từ những ô nó chung với vùng bên cạnh. Mô hình chi tiết nhất, ${Z.fine}, cũng chỉ có ${Z.cells(Z.fine)} ô. Bản đồ dùng được để so sánh các vùng; muốn biết từng tỉnh cần mô hình chi tiết hơn (hạ quy mô).</p>`
  };
  return {
    'map-zones': `<h2>Where it warms most</h2><p>The national figure is an average over zones that warm at different rates. Split Vietnam into its seven climate zones and, under SSP5-8.5, the three northern zones (${names(NORTH)}) are <b>${span(G.ssp585.north)}</b> warmer by 2071–2100, and the three southern zones (${names(SOUTH)}) <b>${span(G.ssp585.south)}</b> warmer. Under SSP2-4.5 the figures are <b>${span(G.ssp245.north)}</b> and <b>${span(G.ssp245.south)}</b>.</p>` +
      `<p>${both ? `In all ${numWord(Z.n)} models, under both scenarios, every northern zone warms more than every southern one.` : `${cap(numWord(Z.ns.ssp585))} of ${numWord(Z.n)} models have every northern zone warming more than every southern one under SSP5-8.5.`} ` +
      `${Z.agree.ssp585 < need ? 'The models do not agree on which single zone warms most.' : `${cap(zoneIn(hi('ssp585')))} comes first in ${Z.agree.ssp585} of ${Z.n} models.`}</p>` +
      `<p>${spread < Z.gap ? `Under SSP5-8.5 the warmest zone warms <b>${deg(spread)}</b> more than the least-warming one. The emissions path makes a bigger difference: nationally, the two scenarios are <b>${deg(Z.gap)}</b> apart by 2071–2100.` : `Under SSP5-8.5 the warmest zone warms <b>${deg(spread)}</b> more than the least-warming one, about as much as the <b>${deg(Z.gap)}</b> that separates the two scenarios nationally.`}</p>`,
    'map-grid': `<p>The squares are the grid of <b>${Z.coarse}</b>, the coarsest of the ${numWord(Z.n)} models. Each cell is about ${nf(dl)}° × ${nf(dn)}°, only <b>${Z.cells(Z.coarse)}</b> of them touch Vietnam's land, and all of ${zoneIn(Z.small)} has the area of about <b>${nf(eq)}</b> of a cell.</p>` +
      `<p>So a small zone's value comes mostly from cells it shares with its neighbours. The most detailed model, ${Z.fine}, still has only ${Z.cells(Z.fine)} cells. The map is good for comparing zones; for single provinces you need finer, downscaled models.</p>`
  };
}
