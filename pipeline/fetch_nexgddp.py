"""Daily humidity and temperature for Hà Nội from NASA NEX-GDDP-CMIP6, for humid heat (wet-bulb temperature).

NEX-GDDP-CMIP6 (Thrasher et al. 2022, Scientific Data 9, 262; CC BY 4.0) is CMIP6 bias-corrected and downscaled
to 0.25 deg with daily near-surface relative humidity (hurs), which CMIP6-VN does not have. This script asks
NASA's THREDDS subset service for a small box around Hà Nội, one file per model, variable and year, and keeps
the city mean (each 0.25 deg cell weighted by its overlap with the Natural Earth outline of Hà Nội).

Years: 1995-2014 (the baseline), plus every year inside each model's warming-level windows for SSP2-4.5 and
SSP5-8.5 as listed in data/hanoi/hanoi.json. Models: the Hà Nội set, except any with no windows there.

Output: <root>/hanoi/<model>.csv.gz with columns exp, var, date, city. Each file is kept as it arrives (<root>/hanoi/parts), so a rerun resumes.

Usage
  python pipeline/fetch_nexgddp.py --ne D:/ne_cache [--root D:/nexgddp] [--workers 8]
"""
import argparse
import glob
import re
import tempfile
import json
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

import numpy as np
import pandas as pd
import xarray as xr

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_URL = 'https://ds.nccs.nasa.gov/thredds/ncss/grid/AMES/NEX/GDDP-CMIP6'
BOX = dict(north=21.45, south=20.5, west=105.25, east=106.05)
VARS = ('tas', 'tasmax', 'hurs')
CELL = 0.25


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


def plan(hn):
    jobs = {}
    for m, r in hn['models'].items():
        yrs = {('historical', y) for y in range(1995, 2015)}
        any_w = False
        for lv in r['levels'].values():
            for w in lv['windows']:
                if w['exp'] not in ('ssp245', 'ssp585'):
                    continue
                any_w = True
                for y in range(w['start'], w['end'] + 1):
                    yrs.add(('historical', y) if y < 2015 else (w['exp'], y))
        if any_w:
            jobs[m] = (r['run'], sorted(yrs))
    return jobs


def weights(lat, lon, ne):
    import geopandas as gpd
    import shapely
    a1 = gpd.read_file(os.path.join(ne, 'a1', 'ne_10m_admin_1_states_provinces.shp'))
    hn = shapely.make_valid(a1[a1.iso_3166_2 == 'VN-HN'].union_all())
    w = np.zeros((lat.size, lon.size))
    for i, y in enumerate(lat):
        for j, x in enumerate(lon):
            c = shapely.box(x - CELL / 2, y - CELL / 2, x + CELL / 2, y + CELL / 2)
            w[i, j] = c.intersection(hn).area / c.area * np.cos(np.radians(y))
    return w


CATALOG_URL = 'https://ds.nccs.nasa.gov/thredds/catalog/AMES/NEX/GDDP-CMIP6/{m}/{e}/{r}/{v}/catalog.xml'
_names = {}


def file_name(model, run, exp, var, year):
    """The archive's file name for one year: grid label (gn/gr) and version differ by model and run."""
    key = (model, run, exp, var)
    if key not in _names:
        for k in range(8):
            try:
                with urllib.request.urlopen(CATALOG_URL.format(m=model, e=exp, r=run, v=var), timeout=60) as r:
                    xml = r.read().decode()
                break
            except Exception as e:  # noqa: BLE001
                log(f'  catalogue retry {k + 1}/8 {model} {exp} {var}: {e}')
                if k == 7:
                    raise
                time.sleep(5 * (k + 1))
        by = {}
        for n in re.findall(r'name="([^"]+\.nc)"', xml):
            y = re.search(r'_(\d{4})(_v[\d.]+)?\.nc$', n)
            if y:
                by.setdefault(int(y.group(1)), []).append(n)
        _names[key] = {y: sorted(v)[-1] for y, v in by.items()}   # the latest version of each year
    return _names[key].get(year)


def fetch(model, run, exp, var, year, tries=6):
    fn = file_name(model, run, exp, var, year)
    if fn is None:
        raise RuntimeError(f'{model} {exp} {var} {year}: not in the archive')
    q = '&'.join(f'{k}={v}' for k, v in BOX.items())
    url = f'{BASE_URL}/{model}/{exp}/{run}/{var}/{fn}?var={var}&{q}&horizStride=1&temporal=all&accept=netcdf4'
    for k in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=90) as r:
                b = r.read()
            fd, tmp = tempfile.mkstemp(suffix='.nc')
            try:
                with os.fdopen(fd, 'wb') as fh:
                    fh.write(b)
                with xr.open_dataset(tmp, engine='netcdf4') as ds:
                    return ds.load()
            finally:
                os.remove(tmp)
        except Exception as e:  # noqa: BLE001 - retry any network or decode failure
            log(f'  retry {k + 1}/{tries} {fn}: {e}')
            if k == tries - 1:
                raise RuntimeError(f'{fn}: {e}')
            time.sleep(5 * (k + 1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ne', required=True)
    ap.add_argument('--root', default='D:/nexgddp')
    ap.add_argument('--workers', type=int, default=3)
    a = ap.parse_args()
    hn = json.load(open(os.path.join(ROOT, 'data', 'hanoi', 'hanoi.json'), encoding='utf-8'))
    jobs = plan(hn)
    parts = os.path.join(a.root, 'hanoi', 'parts')
    os.makedirs(parts, exist_ok=True)
    W = {}
    todo = []
    for model, (run, yrs) in jobs.items():
        for e, y in yrs:
            for v in VARS:
                if not os.path.exists(os.path.join(parts, f'{model}_{e}_{v}_{y}.csv')):
                    todo.append((model, run, e, v, y))
    total = sum(len(y) for _, y in jobs.values()) * len(VARS)
    done = total - len(todo)
    log(f'models: {", ".join(jobs)}; {total} files, {done} already here')
    t0 = time.time()
    with ThreadPoolExecutor(a.workers) as ex:
        futs = {ex.submit(fetch, *j): j for j in todo}
        for f in as_completed(futs):
            model, run, e, v, y = futs[f]
            ds = f.result()
            da = ds[v]
            key = da.shape[1:]
            if key not in W:
                W[key] = weights(ds.lat.values, ds.lon.values, a.ne)
            x = (da.values * W[key][None]).sum((1, 2)) / W[key].sum()
            if v != 'hurs':
                x = x - 273.15
            pd.DataFrame({'exp': e, 'var': v, 'date': da.time.dt.strftime('%Y-%m-%d').values, 'city': np.round(x, 3)}
                         ).to_csv(os.path.join(parts, f'{model}_{e}_{v}_{y}.csv'), index=False)
            done += 1
            n = done - (total - len(todo))
            if n % 10 == 0 or done == total:
                left = (time.time() - t0) / n * (total - done)
                log(f'{done}/{total} files, about {left / 60:.0f} min left ({model} {v} {e} {y})')
    for model in jobs:
        fs = sorted(glob.glob(os.path.join(parts, f'{model}_*.csv')))
        df = pd.concat([pd.read_csv(f) for f in fs]).sort_values(['exp', 'var', 'date'])
        path = os.path.join(a.root, 'hanoi', f'{model}.csv.gz')
        df.to_csv(path, index=False, compression='gzip')
        log(f'wrote {path}: {len(df)} rows')
    log('done')

if __name__ == '__main__':
    sys.exit(main())
