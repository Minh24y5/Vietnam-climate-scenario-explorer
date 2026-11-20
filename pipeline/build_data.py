"""Build the site's data files from NOAA's public CMIP6 archive on Google Cloud.

Outputs (all under data/):
  vietnam_cmip6.json    national annual means, the shape the site and its upload check expect
  vietnam_regions.json  the same series for Vietnam's 7 climate zones, plus each model's grid cells
  vietnam_zones.json    TopoJSON: the 7 zones, Hoang Sa / Truong Sa, and neighbouring land

Method
  * One run per model: r1i1p1f1, except CESM2, which uses r4i1p1f1 (the lowest-numbered run the
    archive holds for all of historical, ssp245 and ssp585 and both variables).
  * Zones are Natural Earth admin-1 provinces (63, pre-2025 boundaries) merged into the 7 zones used
    in Vietnam's national climate scenarios. Land = the union of the provinces.
  * Each model grid cell counts in proportion to the land area it shares with a zone
    (overlap computed in lon/lat, scaled by cos(latitude)). National = all 7 zones together.
  * Monthly -> annual: tas is the day-weighted mean in degrees C; pr is the annual total / 12 in mm.
  * No land data exists for the offshore archipelagos at CMIP6 resolution; they are drawn, not averaged.

Usage
  python pipeline/build_data.py --ne D:/ne_cache
  (--ne holds the unzipped ne_10m_admin_1_states_provinces and ne_10m_admin_0_countries_vnm folders,
   as a1/ and vnm/; downloads from naturalearthdata.com.)
Annual series are cached in pipeline/.cache, so a rerun only redoes the geography.
"""
import argparse
import json
import os
import sys
import time

import numpy as np
import pandas as pd
import geopandas as gpd
import shapely
import xarray as xr

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'pipeline', '.cache')
CATALOG = 'https://storage.googleapis.com/cmip6/cmip6-zarr-consolidated-stores.csv'

MODELS = {'CESM2': 'r4i1p1f1', 'GFDL-ESM4': 'r1i1p1f1', 'MPI-ESM1-2-LR': 'r1i1p1f1',
          'MIROC6': 'r1i1p1f1', 'IPSL-CM6A-LR': 'r1i1p1f1'}
EXPS = {'historical': (1950, 2014), 'ssp245': (2015, 2100), 'ssp585': (2015, 2100)}
VARS = ('tas', 'pr')

# The 7 climate zones of Vietnam's national climate-change scenarios, by ISO 3166-2 province code.
# (Natural Earth mislabels a few provinces' names, so codes, not names, decide membership.)
ZONES = [
    ('tb',  'Tây Bắc',           'Northwest',           ['01', '71', '05', '14']),
    ('db',  'Đông Bắc',          'Northeast',           ['03', '04', '02', '53', '09', '07', '06', '69', '68', '54', '13']),
    ('dbbb', 'Đồng bằng Bắc Bộ', 'Red River Delta',     ['HN', '70', '56', '61', 'HP', '66', '20', '63', '67', '18']),
    ('btb', 'Bắc Trung Bộ',      'North Central',       ['21', '22', '23', '24', '25', '26']),
    ('ntb', 'Nam Trung Bộ',      'South Central Coast', ['DN', '27', '29', '31', '32', '34', '36', '40']),
    ('tn',  'Tây Nguyên',        'Central Highlands',   ['28', '30', '33', '72', '35']),
    ('nb',  'Nam Bộ',            'South',               ['58', '37', '57', '39', '43', 'SG', '41', '46', '50', '51',
                                                         '49', '45', '44', '47', 'CT', '73', '52', '55', '59']),
]
ISLANDS = [('hs', 'Quần đảo Hoàng Sa', 'Hoang Sa (Paracel) Islands', (110.5, 15.5, 113.0, 17.5)),
           ('ts', 'Quần đảo Trường Sa', 'Truong Sa (Spratly) Islands', (111.0, 6.0, 117.0, 12.5))]
KM_PER_DEG = 111.32


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


# ---------------------------------------------------------------- geography
def load_geography(ne):
    a1 = gpd.read_file(os.path.join(ne, 'a1', 'ne_10m_admin_1_states_provinces.shp'))
    vn = a1[a1.adm0_a3 == 'VNM'].copy()
    vn['code'] = vn.iso_3166_2.str.replace('VN-', '', regex=False)
    codes = [c for z in ZONES for c in z[3]]
    assert len(codes) == len(set(codes)) == 63, 'zone table must hold each of the 63 provinces once'
    missing = set(vn.code) ^ set(codes)
    assert not missing, f'province codes do not match Natural Earth: {missing}'
    zones = []
    for zid, vi, en, cs in ZONES:
        g = shapely.make_valid(vn[vn.code.isin(cs)].union_all())
        zones.append({'id': zid, 'vi': vi, 'en': en, 'geometry': g})
    zones = gpd.GeoDataFrame(zones, crs='EPSG:4326')

    pov = gpd.read_file(os.path.join(ne, 'vnm', 'ne_10m_admin_0_countries_vnm.shp'))
    vnm = pov[pov.ADM0_A3 == 'VNM'].iloc[0].geometry
    islands = []
    for iid, vi, en, box in ISLANDS:
        g = vnm.intersection(shapely.box(*box))
        assert not g.is_empty, f'{en} not found in the Vietnam point-of-view boundaries'
        islands.append({'id': iid, 'vi': vi, 'en': en, 'geometry': g})
    islands = gpd.GeoDataFrame(islands, crs='EPSG:4326')

    frame = shapely.box(97.0, 4.0, 119.0, 26.5)
    near = pov[pov.ADM0_A3 != 'VNM'].copy()
    near['geometry'] = near.geometry.intersection(frame)
    near = near[~near.geometry.is_empty]
    land = gpd.GeoDataFrame([{'id': 'land', 'geometry': near.union_all()}], crs='EPSG:4326')
    return zones, islands, land


def write_topology(zones, islands, land, path):
    import topojson as tp
    z = zones[['id', 'vi', 'en', 'geometry']]
    topo = tp.Topology([z, islands[['id', 'vi', 'en', 'geometry']], land],
                       object_name=['zones', 'islands', 'land'],
                       prequantize=200000, toposimplify=0.004, simplify_with='shapely',
                       presimplify=False)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(topo.to_json())


# ---------------------------------------------------------------- climate
def bounds(ds, dim):
    v = ds[dim].values.astype(float)
    for name in (f'{dim}_bnds', f'{dim}_bounds'):
        if name in ds:
            b = ds[name].values
            if b.ndim == 3:
                b = b[0]
            return b[:, 0].astype(float), b[:, 1].astype(float)
    mid = (v[1:] + v[:-1]) / 2
    lo = np.concatenate([[v[0] - (mid[0] - v[0])], mid])
    hi = np.concatenate([mid, [v[-1] + (v[-1] - mid[-1])]])
    return lo, hi


def region_grid(ds):
    lat, lon = ds.lat.values, ds.lon.values
    li = np.where((lat > 4) & (lat < 26))[0]
    lj = np.where((lon > 99) & (lon < 112))[0]
    blat, blon = bounds(ds, 'lat'), bounds(ds, 'lon')
    return li, lj, (np.minimum(*blat)[li], np.maximum(*blat)[li]), (np.minimum(*blon)[lj], np.maximum(*blon)[lj])


def overlap_weights(zones, li, lj, latb, lonb):
    """km^2 of each zone inside each cell: array (zone, lat, lon)."""
    W = np.zeros((len(zones), len(li), len(lj)))
    geoms = list(zones.geometry)
    for i in range(len(li)):
        c = np.cos(np.deg2rad((latb[0][i] + latb[1][i]) / 2)) * KM_PER_DEG ** 2
        for j in range(len(lj)):
            cell = shapely.box(lonb[0][j], latb[0][i], lonb[1][j], latb[1][i])
            for k, g in enumerate(geoms):
                a = g.intersection(cell).area
                if a > 0:
                    W[k, i, j] = a * c
    return W


def open_store(cat, model, member, var, exp):
    import gcsfs
    r = cat.query('table_id == "Amon" and source_id == @model and member_id == @member '
                  'and variable_id == @var and experiment_id == @exp')
    assert len(r) >= 1, f'not in catalogue: {model} {member} {var} {exp}'
    r = r.sort_values('version').iloc[-1]
    fs = gcsfs.GCSFileSystem(token='anon')
    return xr.open_zarr(fs.get_mapper(r.zstore), consolidated=True), r.zstore


def annual_series(cat, model, member, var, exp, W, li, lj, grid_ds=None):
    """(zone+1, years) array: the 7 zones, then national. Cached as .npz."""
    os.makedirs(CACHE, exist_ok=True)
    key = os.path.join(CACHE, f'{model}_{member}_{var}_{exp}.npz')
    if os.path.exists(key):
        z = np.load(key)
        return z['vals'], str(z['store'])
    ds, store = open_store(cat, model, member, var, exp)
    y0, y1 = EXPS[exp]
    da = ds[var].isel(lat=li, lon=lj)
    da = da.sel(time=(da.time.dt.year >= y0) & (da.time.dt.year <= y1))
    log(f'  loading {model} {var} {exp} {da.shape}')
    x = da.load().values  # (time, lat, lon)
    days = da.time.dt.days_in_month.values.astype(float)
    years = da.time.dt.year.values
    Wn = np.concatenate([W, W.sum(0, keepdims=True)])  # zones + national
    sp = (x[None] * Wn[:, None]).sum((2, 3)) / Wn.sum((1, 2))[:, None]  # (zone+1, time)
    out = []
    for y in range(y0, y1 + 1):
        m = years == y
        assert m.sum() == 12, f'{model} {var} {exp} {y}: {m.sum()} months'
        d = days[m]
        if var == 'tas':
            out.append((sp[:, m] * d).sum(1) / d.sum() - 273.15)
        else:
            out.append((sp[:, m] * d * 86400).sum(1) / 12)
    vals = np.array(out).T
    np.savez(key, vals=vals, store=store)
    return vals, store


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ne', required=True, help='folder holding a1/ and vnm/ Natural Earth shapefiles')
    args = ap.parse_args()

    zones, islands, land = load_geography(args.ne)
    eq = zones.to_crs('EPSG:6933')
    zones['area_km2'] = (eq.area / 1e6).round(0)
    log('zones', ', '.join(f"{r.id}={r.area_km2:.0f}" for r in zones.itertuples()))
    write_topology(zones, islands, land, os.path.join(ROOT, 'data', 'vietnam_zones.json'))
    log('wrote data/vietnam_zones.json')

    cat = pd.read_csv(CATALOG)
    nat = {v: {} for v in VARS}
    reg = {z: {v: {} for v in VARS} for z in zones.id}
    grid, stores = {}, {}
    for model, member in MODELS.items():
        ds, _ = open_store(cat, model, member, 'tas', 'historical')
        li, lj, latb, lonb = region_grid(ds)
        W = overlap_weights(zones, li, lj, latb, lonb)
        cell_km2 = np.array([[np.cos(np.deg2rad((latb[0][i] + latb[1][i]) / 2)) * KM_PER_DEG ** 2 *
                              (latb[1][i] - latb[0][i]) * (lonb[1][j] - lonb[0][j]) for j in range(len(lj))]
                             for i in range(len(li))])
        used = W.sum(0) > 0
        cells = [[round(float(lonb[0][j]), 3), round(float(latb[0][i]), 3), round(float(lonb[1][j]), 3), round(float(latb[1][i]), 3),
                  round(float(W[:, i, j].sum() / cell_km2[i, j]), 3)]
                 for i in range(len(li)) for j in range(len(lj)) if used[i, j]]
        grid[model] = {
            'member': member,
            'cells': cells,  # [lon0, lat0, lon1, lat1, land share of the cell]
            'touching': {z: int((W[k] > 0).sum()) for k, z in enumerate(zones.id)},
            'equivalent': {z: round(float((W[k] / cell_km2).sum()), 2) for k, z in enumerate(zones.id)},
        }
        log(model, member, 'cells touching land:', len(cells), grid[model]['equivalent'])
        for var in VARS:
            for exp in EXPS:
                vals, store = annual_series(cat, model, member, var, exp, W, li, lj)
                stores[f'{model}/{var}/{exp}'] = store
                nat[var].setdefault(model, {})[exp] = [round(float(v), 3) for v in vals[-1]]
                for k, z in enumerate(zones.id):
                    reg[z][var].setdefault(model, {})[exp] = [round(float(v), 3) for v in vals[k]]

    meta = {
        'source': 'CMIP6 via NOAA / Google Cloud public datasets (' + CATALOG + ')',
        'members': MODELS,
        'units': {'tas': 'degC, annual mean', 'pr': 'mm per month, annual total / 12'},
        'weighting': 'land-area overlap of each model grid cell with Natural Earth 10m admin-1 provinces',
        'built': time.strftime('%Y-%m-%d'),
    }
    with open(os.path.join(ROOT, 'data', 'vietnam_cmip6.json'), 'w', encoding='utf-8') as f:
        json.dump({'tas': nat['tas'], 'pr': nat['pr'], 'meta': meta}, f, separators=(',', ':'))
    zmeta = [{'id': r.id, 'vi': r.vi, 'en': r.en, 'area_km2': int(r.area_km2)} for r in zones.itertuples()]
    with open(os.path.join(ROOT, 'data', 'vietnam_regions.json'), 'w', encoding='utf-8') as f:
        json.dump({'meta': {**meta, 'zones': zmeta, 'stores': stores}, 'regions': reg, 'grid': grid},
                  f, ensure_ascii=False, separators=(',', ':'))
    log('wrote data/vietnam_cmip6.json and data/vietnam_regions.json')


if __name__ == '__main__':
    sys.exit(main())
