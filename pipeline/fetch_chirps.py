"""Daily CHIRPS rain for Hà Nội, 1981 to the latest full year, and NOAA's Oceanic Niño Index.

CHIRPS v2.0 (Funk et al. 2015, Scientific Data 2, 150066; public domain): satellite rain estimates blended
with station data at 0.05 deg. The IRI Data Library cuts a box around Hà Nội; the city mean weights each
cell by its overlap with the Natural Earth outline of Hà Nội (as fetch_cmip6vn.py does at 0.1 deg).

ONI (NOAA Climate Prediction Center): the 3-month running mean of sea-surface temperature anomalies in the
Niño 3.4 region; El Niño at +0.5 degC or more, La Niña at -0.5 or less.

Outputs
  <root>/hanoi_chirps.csv.gz   date, pr (mm/day, city mean)
  <root>/oni.ascii.txt         the ONI table as published

Usage
  python pipeline/fetch_chirps.py --ne D:/ne_cache [--root D:/chirps] [--end 2025]
"""
import argparse
import os
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import subprocess

import numpy as np
import pandas as pd
import xarray as xr

IRI = ('https://iridl.ldeo.columbia.edu/SOURCES/.UCSB/.CHIRPS/.v2p0/.daily-improved/.global/.0p05/.prcp/'
       'X/105.25/106.05/RANGEEDGES/Y/20.5/21.45/RANGEEDGES/T/(1%20Jan%20{a})/(31%20Dec%20{b})/RANGEEDGES/data.nc')
ONI = 'https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt'
CELL = 0.05


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


def get(url, path, tries=5):
    for k in range(tries):
        try:
            # curl, not urllib: the IRI server stalls urllib's requests but serves curl's in seconds
            subprocess.run(['curl', '-sS', '-f', '-m', '300', '-o', path, url], check=True)
            return
        except Exception as e:  # noqa: BLE001
            if k == tries - 1:
                raise
            log(f'  retry after {e}')
            time.sleep(5 * (k + 1))


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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ne', required=True)
    ap.add_argument('--root', default='D:/chirps')
    ap.add_argument('--end', type=int, default=2025)
    ap.add_argument('--workers', type=int, default=4)
    a = ap.parse_args()
    os.makedirs(a.root, exist_ok=True)
    if not os.path.exists(os.path.join(a.root, 'oni.ascii.txt')):
        get(ONI, os.path.join(a.root, 'oni.ascii.txt'))
    log('ONI saved')
    W = None
    todo = [y for y in range(1981, a.end + 1) if not os.path.exists(os.path.join(a.root, f'part_{y}.csv'))]
    log(f'{a.end - 1980 - len(todo)} years here, {len(todo)} to fetch, {a.workers} at a time')

    def one(y0):
        fd, tmp = tempfile.mkstemp(suffix='.nc', dir=a.root)
        os.close(fd)
        try:
            get(IRI.format(a=y0, b=y0), tmp)
            with xr.open_dataset(tmp, decode_times=False) as ds:
                return y0, ds.prcp.load()
        finally:
            os.remove(tmp)

    with ThreadPoolExecutor(a.workers) as ex:
        for f in as_completed([ex.submit(one, y) for y in todo]):
            y0, pr = f.result()
            if W is None:
                W = weights(pr['Y'].values, pr['X'].values, a.ne)
            x = (np.nan_to_num(pr.values) * W[None]).sum((1, 2)) / W.sum()
            # T is a Julian day number at noon
            dates = pd.Timestamp('1970-01-01') + pd.to_timedelta(np.floor(pr['T'].values.astype('float64') - 2440587.5).astype('int64'), unit='D')
            pd.DataFrame({'date': dates.strftime('%Y-%m-%d'), 'pr': np.round(x, 3)}).to_csv(os.path.join(a.root, f'part_{y0}.csv'), index=False)
            log(f'{y0}: {len(dates)} days, {x.sum():.0f} mm')
    parts = [pd.read_csv(os.path.join(a.root, f'part_{y}.csv')) for y in range(1981, a.end + 1)]
    df = pd.concat(parts)
    out = os.path.join(a.root, 'hanoi_chirps.csv.gz')
    df.to_csv(out, index=False, compression='gzip')
    log(f'wrote {out}: {len(df)} days, {df.date.iloc[0]} to {df.date.iloc[-1]}')


if __name__ == '__main__':
    main()
