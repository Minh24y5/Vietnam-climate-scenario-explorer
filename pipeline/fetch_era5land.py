"""Download ERA5-Land (and ERA5 rain) for Hà Nội and build daily city-mean series, 1980-2025.

Why: the gridded observations that come with CMIP6-VN (OBS.Vietnam.1980-2014.nc) end in 2014.
ERA5-Land carries the record on to 2025 on the same 0.1 deg grid. Its raw values are not the gridded
observations, so pipeline/build_hanoi.py calibrates them to OBS over 1980-2014 before using them.

Source: the Open-Meteo historical weather API (archive-api.open-meteo.com, no key, CC BY 4.0,
non-commercial use), which serves the Copernicus reanalyses as point time series:
  * temperature_2m and dew_point_2m from ERA5-Land, 0.1 deg (Muñoz-Sabater et al. 2021, ESSD 13:4349)
  * precipitation from ERA5, 0.25 deg (Hersbach et al. 2020, QJRMS 146:1999), because Open-Meteo has
    no ERA5-Land precipitation (it returns nulls)
Hourly, UTC, 1979-12-30 to 2026-01-01 (the spare days let the local day close at any hour).
elevation=nan and cell_selection=nearest ask for the grid cell's own value, not Open-Meteo's
height-adjusted one. The Copernicus CDS (reanalysis-era5-land-timeseries) has the same data but needs
an account; this route doesn't.

Cells: Open-Meteo's free tier counts a 46-year hourly series as about 1,200 calls (one per two weeks)
of its 10,000 a day, so the script does not fetch all 47 0.1 deg cells that overlap the city.
  * temperature: the city's 47 cells are grouped into 0.3 deg blocks (3x3 cells); the centre cell of
    each of the 5 largest blocks stands for its block, weighted by the block's share of the city
    (85% of the city's area; weights renormalised to sum to 1). Tested on the gridded observations: this
    5-cell mean tracks the 47-cell city mean at r = 0.9999 for daily Tmax and Tmin, offset +0.1 degC.
  * rain: the 3 ERA5 0.25 deg cells with the largest share of the city (56%), weighted by that share;
    on the gridded observations, the same 3-box mean tracks the city mean at r = 0.994.
The calibration in build_hanoi.py maps this mean onto OBS's own city mean, which absorbs offsets of
this size. Weights: share of the cell inside Hà Nội's Natural Earth outline times cos(lat), as in
pipeline/fetch_cmip6vn.py.

What it writes under --root (default D:/era5land, outside the repo):
  raw/<model>_<lat>_<lon>.json.gz   the API responses as downloaded
  hanoi/ERA5L.csv.gz                daily city means, long table like OBS.csv.gz: exp, var, date, city
                                    vars: tasmax, tasmin, tas, td (daily mean dewpoint), hi (daily max
                                    heat index), all degC, and pr (mm)
  hanoi/ERA5L.json                  cells, weights, day boundary chosen, correlations with OBS
Day boundary: Vietnamese stations do not all close the day at midnight. The script tries every local
closing hour and keeps the one whose daily rain best matches OBS (rank correlation, 1980-2014);
temperatures use the same day.

Heat index: NOAA's (Rothfusz regression with NOAA's adjustments, Steadman's simple formula below
80 degF), from hourly 2 m temperature and the relative humidity of 2 m dewpoint (Magnus formula),
per cell and hour; daily maximum per cell, then the city mean. It is raw ERA5-Land and cannot be
calibrated: OBS and CMIP6-VN have no humidity.

Usage
  python pipeline/fetch_era5land.py              # download what's missing (8 series), then build
  python pipeline/fetch_era5land.py --local      # build from raw/ only, no download
When the API's hourly or daily limit is reached the script waits and retries; a rerun skips series
already downloaded.
"""
import argparse
import gzip
import json
import os
import sys
import time

import numpy as np
import pandas as pd
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_cmip6vn import BOX, CELL, city_weights   # noqa: E402  same cells, same weights

API = 'https://archive-api.open-meteo.com/v1/archive'
START, END = '1979-12-30', '2026-01-01'
YEARS = (1980, 2025)
UTC_OFFSET = 7                    # Vietnam, ICT
OBS_YEARS = (1980, 2014)
BLOCK = 0.3                       # temperature: 3x3 cells per block
BLOCK_ORIGIN = (20.6, 105.3)      # block centres: 20.6, 20.9, 21.2 N; 105.3, 105.6, 105.9 E
N_TEMP = 5
ERA5 = 0.25
N_RAIN = 3


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


# ---------------------------------------------------------------- cells
def temp_cells(ne):
    lat = np.round(np.arange(BOX['lat'][0], BOX['lat'][1] + CELL / 2, CELL), 1)
    lon = np.round(np.arange(BOX['lon'][0], BOX['lon'][1] + CELL / 2, CELL), 1)
    w = city_weights(lat, lon, ne)
    blocks, total = {}, float(w.sum())
    for y in lat:
        for x in lon:
            v = float(w.sel(lat=y, lon=x))
            if v > 0:
                k = (round(BLOCK_ORIGIN[0] + BLOCK * round((y - BLOCK_ORIGIN[0]) / BLOCK), 1),
                     round(BLOCK_ORIGIN[1] + BLOCK * round((x - BLOCK_ORIGIN[1]) / BLOCK), 1))
                blocks[k] = blocks.get(k, 0) + v
    top = sorted(blocks.items(), key=lambda kv: -kv[1])[:N_TEMP]
    return [(y, x, v / total) for (y, x), v in top]


def rain_cells(ne):
    import geopandas as gpd
    import shapely
    a1 = gpd.read_file(os.path.join(ne, 'a1', 'ne_10m_admin_1_states_provinces.shp'))
    hn = shapely.make_valid(a1[a1.iso_3166_2 == 'VN-HN'].union_all())
    W = {}
    for y in np.arange(BOX['lat'][0], BOX['lat'][1] + ERA5 / 2, ERA5):
        for x in np.arange(105.25, BOX['lon'][1] + ERA5 / 2, ERA5):
            c = shapely.box(x - ERA5 / 2, y - ERA5 / 2, x + ERA5 / 2, y + ERA5 / 2)
            a = c.intersection(hn).area / c.area * np.cos(np.radians(y))
            if a > 0:
                W[(round(float(y), 2), round(float(x), 2))] = a
    total = sum(W.values())
    top = sorted(W.items(), key=lambda kv: -kv[1])[:N_RAIN]
    return [(y, x, v / total) for (y, x), v in top]


def raw_path(root, model, y, x):
    return os.path.join(root, 'raw', f'{model}_{y:.2f}_{x:.2f}.json.gz')


# ---------------------------------------------------------------- download
def fetch(root, model, y, x, hourly, label):
    dest = raw_path(root, model, y, x)
    if os.path.exists(dest):
        log(f'{label}: already here')
        return dest
    params = {'latitude': y, 'longitude': x, 'start_date': START, 'end_date': END, 'hourly': ','.join(hourly),
              'models': model, 'timezone': 'GMT', 'elevation': 'nan', 'cell_selection': 'nearest'}
    wait = 300
    while True:
        t0 = time.time()
        try:
            r = requests.get(API, params=params, timeout=900)
        except requests.RequestException as e:
            log(f'{label}: {e}; retrying in 60 s')
            time.sleep(60)
            continue
        if r.status_code == 200:
            break
        reason = r.text[:200]
        if r.status_code == 429 or 'limit' in reason.lower():
            log(f'{label}: API limit ({reason.strip()}); waiting {wait // 60} min')
            time.sleep(wait)
            wait = min(wait * 2, 3600)
            continue
        raise SystemExit(f'{label}: HTTP {r.status_code}: {reason}')
    tmp = dest + '.tmp'
    with gzip.open(tmp, 'wb') as f:
        f.write(r.content)
    os.replace(tmp, dest)
    log(f'{label}: {len(r.content) / 1e6:.1f} MB in {time.time() - t0:.0f} s')
    return dest


def read(path):
    with gzip.open(path, 'rb') as f:
        d = json.load(f)
    h = d['hourly']
    df = pd.DataFrame({k: pd.to_numeric(pd.Series(v), errors='coerce') for k, v in h.items() if k != 'time'})
    df.index = pd.to_datetime(h['time'])
    return df, {'lat': d['latitude'], 'lon': d['longitude'], 'elevation': d.get('elevation')}


# ---------------------------------------------------------------- humid heat
def rh_from_td(t, td):
    """Relative humidity (%) from temperature and dewpoint (degC), Magnus formula (Alduchov & Eskridge 1996)."""
    es = lambda x: np.exp(17.625 * x / (x + 243.04))
    return np.clip(100 * es(td) / es(t), 0, 100)


def heat_index(t, rh):
    """NOAA heat index (degC) from temperature (degC) and relative humidity (%)."""
    T = t * 9 / 5 + 32
    simple = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + rh * 0.094)
    full = (-42.379 + 2.04901523 * T + 10.14333127 * rh - 0.22475541 * T * rh - 6.83783e-3 * T ** 2
            - 5.481717e-2 * rh ** 2 + 1.22874e-3 * T ** 2 * rh + 8.5282e-4 * T * rh ** 2 - 1.99e-6 * T ** 2 * rh ** 2)
    adj1 = np.where((rh < 13) & (T >= 80) & (T <= 112), -((13 - rh) / 4) * np.sqrt(np.clip(17 - np.abs(T - 95), 0, None) / 17), 0)
    adj2 = np.where((rh > 85) & (T >= 80) & (T <= 87), ((rh - 85) / 10) * ((87 - T) / 5), 0)
    hi = np.where((simple + T) / 2 >= 80, full + adj1 + adj2, simple)
    return (hi - 32) * 5 / 9


# ---------------------------------------------------------------- daily series
def labels(index, shift, accumulated):
    """Local day of each hour. Instantaneous values belong to their time stamp, an hourly sum to the
    hour before it. shift moves the day: label = date(local time + shift); 0 is the local calendar
    day, +5 a day that closes at 19:00 local."""
    local = index + pd.Timedelta(hours=UTC_OFFSET + shift - (1 if accumulated else 0))
    return local.floor('D')


def city_daily(T, R, shift):
    """T: [(hourly frame with temperature_2m, dew_point_2m), weight]; R: [(frame with precipitation), weight]."""
    parts = {k: [] for k in ('tasmax', 'tasmin', 'tas', 'td', 'hi', 'pr')}
    for H, w in T:
        lab = labels(H.index, shift, False)
        t, td = H.temperature_2m, H.dew_point_2m
        g = t.groupby(lab)
        parts['tasmax'].append((g.max(), w))
        parts['tasmin'].append((g.min(), w))
        parts['tas'].append((g.mean(), w))
        parts['td'].append((td.groupby(lab).mean(), w))
        hi = pd.Series(heat_index(t.values, rh_from_td(t.values, td.values)), index=H.index)
        parts['hi'].append((hi.groupby(lab).max(), w))
    for H, w in R:
        parts['pr'].append((H.precipitation.groupby(labels(H.index, shift, True)).sum(min_count=24), w))
    out = {}
    for k, ps in parts.items():
        df = pd.concat([s for s, _ in ps], axis=1)
        ws = np.array([w for _, w in ps])
        out[k] = (df * ws).sum(axis=1, min_count=len(ws)) / ws.sum()
    D = pd.DataFrame(out)
    D.index = pd.to_datetime(D.index)
    return D[(D.index.year >= YEARS[0]) & (D.index.year <= YEARS[1])]


def rank_corr(a, b):
    a, b = a.dropna().align(b.dropna(), join='inner')
    return float(np.corrcoef(a.rank(), b.rank())[0, 1])


def build(root, tc, rc, obs_csv):
    T = [(read(raw_path(root, 'era5_land', y, x))[0], w) for y, x, w in tc]
    R = [(read(raw_path(root, 'era5', y, x))[0], w) for y, x, w in rc]
    got = [read(raw_path(root, m, y, x))[1] for m, cs in (('era5_land', tc), ('era5', rc)) for y, x, _ in cs]
    obs = pd.read_csv(obs_csv).pivot_table(index='date', columns='var', values='city')
    obs.index = pd.to_datetime(obs.index)
    tries = {}
    for shift in range(-12, 13):
        D = city_daily(T, R, shift)
        D = D[(D.index.year >= OBS_YEARS[0]) & (D.index.year <= OBS_YEARS[1])]
        tries[shift] = {v: round(rank_corr(D[v], obs[v]), 4) for v in ('pr', 'tasmax', 'tasmin')}
        log(f'  day shift {shift:+3d} h: rain r={tries[shift]["pr"]:.3f}  tasmax r={tries[shift]["tasmax"]:.3f}  '
            f'tasmin r={tries[shift]["tasmin"]:.3f}')
    best = max(tries, key=lambda s: tries[s]['pr'])
    D = city_daily(T, R, best)
    gaps = {k: int(v) for k, v in D.isna().sum().items() if v}
    out_dir = os.path.join(root, 'hanoi')
    os.makedirs(out_dir, exist_ok=True)
    long = D.reset_index(names='date').melt(id_vars='date', var_name='var', value_name='city').dropna()
    long.insert(0, 'exp', 'era5land')
    long['date'] = long.date.dt.strftime('%Y-%m-%d')
    long['city'] = long.city.round(3)
    long[['exp', 'var', 'date', 'city']].to_csv(os.path.join(out_dir, 'ERA5L.csv.gz'), index=False, compression='gzip')
    closes = (24 - best) % 24
    meta = {'source': API, 'temperature': 'ERA5-Land 0.1 deg (temperature_2m, dew_point_2m)',
            'rain': 'ERA5 0.25 deg (precipitation)', 'requested': [START, END], 'utc_offset': UTC_OFFSET,
            'temp_cells': [{'lat': y, 'lon': x, 'weight': round(w, 4)} for y, x, w in tc],
            'rain_cells': [{'lat': y, 'lon': x, 'weight': round(w, 4)} for y, x, w in rc],
            'temp_share_of_city': round(sum(w for *_, w in tc), 3), 'rain_share_of_city': round(sum(w for *_, w in rc), 3),
            'grid_points_returned': got,
            'day_shift_hours': best, 'day_closes_local': f'{closes:02d}:00',
            'rank_correlation_with_obs_1980_2014': {str(k): v for k, v in tries.items()},
            'missing_days': gaps, 'years': [int(D.index.year.min()), int(D.index.year.max())],
            'built': time.strftime('%Y-%m-%d')}
    with open(os.path.join(out_dir, 'ERA5L.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=1, ensure_ascii=False)
    log(f'day closes at {closes:02d}:00 local (shift {best:+d} h); missing days {gaps or "none"}; '
        f'wrote {out_dir}/ERA5L.csv.gz ({D.index.min():%Y-%m-%d} to {D.index.max():%Y-%m-%d})')


def main():
    p = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    p.add_argument('--root', default='D:/era5land')
    p.add_argument('--ne', default='D:/ne_cache', help='Natural Earth folder with a1/ (the city outline)')
    p.add_argument('--obs', default='D:/cmip6vn/hanoi/series/OBS.csv.gz', help='CMIP6-VN gridded observations, city series')
    p.add_argument('--local', action='store_true', help='never download; build the series from raw/')
    a = p.parse_args()
    os.makedirs(os.path.join(a.root, 'raw'), exist_ok=True)
    tc, rc = temp_cells(a.ne), rain_cells(a.ne)
    log(f'temperature: {len(tc)} ERA5-Land cells ({sum(w for *_, w in tc):.0%} of the city); '
        f'rain: {len(rc)} ERA5 cells ({sum(w for *_, w in rc):.0%})')
    if not a.local:
        jobs = [('era5_land', y, x, ['temperature_2m', 'dew_point_2m']) for y, x, _ in tc] + \
               [('era5', y, x, ['precipitation']) for y, x, _ in rc]
        for i, (m, y, x, v) in enumerate(jobs, 1):
            fetch(a.root, m, y, x, v, f'[{i}/{len(jobs)}] {m} {y:.2f} N {x:.2f} E')
    build(a.root, tc, rc, a.obs)


if __name__ == '__main__':
    main()
