"""Download CMIP6-VN and cut out Hà Nội.

CMIP6-VN: daily pr, tas, tasmax and tasmin at 0.1 deg for Vietnam, from 35 CMIP6 models bias-corrected
(BCSD) against Vietnamese stations, historical 1980-2014 and up to 7 SSPs for 2015-2099.
  Tran-Anh, Ngo-Duc, Espagne & Trinh-Tuan (2023), Scientific Data 10:257, doi:10.1038/s41597-023-02159-2
  Data: figshare collection doi:10.6084/m9.figshare.c.6164352.v1, CC0. One .tar.gz per model (82 GB in
  all) plus the gridded station observations it was corrected to (OBS.Vietnam.1980-2014.nc, 0.5 GB).

What it writes under --root (default D:/cmip6vn, outside the repo):
  raw/<model>.tar.gz, raw/OBS.Vietnam.1980-2014.nc
                         the figshare files, checked against figshare's MD5
  hanoi/box/<model>/<var>_<exp>.nc
                         every 0.1 deg cell in 20.5-21.5 N, 105.2-106.1 E, float32, real units
  hanoi/series/<model>.csv.gz
                         long table: exp, var, date, city (Hà Nội land-area-weighted mean), lang (the cell
                         holding the Láng station, WMO 48820, 21.033 N 105.800 E)
  manifest.json          what was downloaded and extracted, the units found, and the source
Units: the files label every variable 'var_unit'. pr is mm/day; temperatures are converted to degC if
they arrive in kelvin. The script records what it saw for each file in the manifest.

Usage
  python pipeline/fetch_cmip6vn.py --list                     # show models and sizes, download nothing
  python pipeline/fetch_cmip6vn.py --obs                      # observations only (0.5 GB)
  python pipeline/fetch_cmip6vn.py --models MIROC6 GFDL-ESM4  # some models
  python pipeline/fetch_cmip6vn.py --hanoi-set --obs          # the five models hanoi.html uses (~20 GB)
  python pipeline/fetch_cmip6vn.py --all --workers 3          # everything (82 GB, hours)
  --segments N splits each file into N parallel byte ranges (default 4; figshare limits each
  connection, not the total).
  add --delete-raw to drop each tarball once Hà Nội is cut out (re-download needed for other regions)
  add --ne D:/ne_cache for the city outline (Natural Earth admin-1, Hà Nội = VN-HN; its boundary is
  unchanged by the 2025 reorganisation). Without it the 'city' column is left empty.
A rerun skips finished downloads and extractions; interrupted downloads resume.

Downloading by hand instead: save each model's <model>.tar.gz from figshare (links in
docs/hanoi-data-audit.md, or --list) into <root>/raw/ under its figshare name, then run
  python pipeline/fetch_cmip6vn.py --hanoi-set --local --ne D:/ne_cache
--local never downloads: it checks each file's size and MD5 against figshare, cuts out Hà Nội, and
says which files are still missing.
"""
import argparse
import concurrent.futures as cf
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import threading
import time

import numpy as np
import pandas as pd
import requests
import xarray as xr

API = 'https://api.figshare.com/v2'
COLLECTION = 6164352
OBS_TITLE = 'Vietnam Gridded Observation dataset'
BOX = dict(lat=(20.5, 21.5), lon=(105.2, 106.1))   # Hà Nội: 20.56-21.39 N, 105.28-106.02 E
LANG = (21.0333, 105.8000)                          # WMO OSCAR position of 48820 HA NOI (Láng)
CELL = 0.1
# The five models behind hanoi.html (five, like the national page), chosen to run from slow- to
# fast-warming; all have temperature and rain in CMIP6-VN and the main scenarios.
HANOI_SET = ['MIROC6', 'MPI-ESM1-2-HR', 'MRI-ESM2-0', 'IPSL-CM6A-LR', 'UKESM1-0-LL']
NAME = re.compile(r'bcsd_(?P<var>[a-z]+)_(?P<model>.+?)_(?P<exp>hist|ssp\d+)_(?P<y0>\d{4})-(?P<y1>\d{4})_daily\.nc$')

_lock = threading.Lock()


def log(*a):
    with _lock:
        print(time.strftime('%H:%M:%S'), *a, flush=True)


# ---------------------------------------------------------------- figshare
def catalogue(root, refresh=False):
    path = os.path.join(root, 'figshare_files.json')
    if os.path.exists(path) and not refresh:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    arts = requests.get(f'{API}/collections/{COLLECTION}/articles', params={'page_size': 100}, timeout=60).json()
    out = {}
    for a in arts:
        d = requests.get(f"{API}/articles/{a['id']}", timeout=60).json()
        out[a['title']] = {'article': a['id'], 'doi': d.get('doi'), 'license': d['license']['name'],
                           'files': [{'name': f['name'], 'size': f['size'], 'url': f['download_url'],
                                      'md5': f.get('computed_md5')} for f in d['files']]}
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=1)
    return out


def md5(path, block=1 << 22):
    h = hashlib.md5()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(block), b''):
            h.update(b)
    return h.hexdigest()


def local_ok(entry, dest_dir):
    """A file someone downloaded by hand and put in raw/: accept it if size and MD5 match figshare's,
    mark it, and clear any partial download of it this script left behind."""
    path = os.path.join(dest_dir, entry['name'])
    if not os.path.exists(path) or os.path.getsize(path) != entry['size']:
        return False
    log(f"  {entry['name']}: found in {dest_dir}, checking MD5")
    if entry['md5'] and md5(path) != entry['md5']:
        log(f"  {entry['name']}: MD5 does not match figshare's; ignoring this copy")
        return False
    open(path + '.md5ok', 'w').close()
    for f in os.listdir(dest_dir):
        if f.startswith(entry['name'] + '.part'):
            os.remove(os.path.join(dest_dir, f))
    return True


def fetch_range(url, seg, start, end, progress, tries=8):
    """Bytes start..end (inclusive) of url into the file seg, resuming whatever seg already holds."""
    want = end - start + 1
    for attempt in range(1, tries + 1):
        have = os.path.getsize(seg) if os.path.exists(seg) else 0
        if have >= want:
            return
        try:
            with requests.get(url, headers={'Range': f'bytes={start + have}-{end}'}, stream=True, timeout=120) as r:
                if r.status_code != 206:
                    raise RuntimeError(f'server ignored the byte range (HTTP {r.status_code})')
                with open(seg, 'ab') as f:
                    for chunk in r.iter_content(1 << 20):
                        f.write(chunk)
                        progress(len(chunk))
        except (requests.RequestException, OSError, RuntimeError) as e:
            log(f'  {os.path.basename(seg)}: attempt {attempt} failed ({e}); retrying')
            time.sleep(5 * attempt)
    if os.path.getsize(seg) < want:
        raise RuntimeError(f'could not download {os.path.basename(seg)}')


def download(entry, dest_dir, segments=4):
    """Download with MD5 check, in `segments` parallel byte ranges (figshare limits each connection,
    not the total). Resumes: what is already in <name>.part is kept and only the rest is fetched."""
    path = os.path.join(dest_dir, entry['name'])
    ok = path + '.md5ok'
    if os.path.exists(ok):
        return path
    part, size = path + '.part', entry['size']
    if local_ok(entry, dest_dir):
        return path
    if segments == 0:
        raise FileNotFoundError(f"{entry['name']} is not in {dest_dir} (or is incomplete); --local never downloads")
    for attempt in (1, 2):
        have = os.path.getsize(part) if os.path.exists(part) else 0
        if have < size:
            rest = size - have
            n = max(1, min(segments, rest // (32 << 20) + 1))
            edges = [have + rest * i // n for i in range(n + 1)]
            segs = [(f'{part}.{edges[i]}-{edges[i + 1] - 1}', edges[i], edges[i + 1] - 1) for i in range(n)]
            keep = {s for s, _, _ in segs}
            for f in os.listdir(dest_dir):                 # segments left by a run with another split
                full = os.path.join(dest_dir, f)
                if f.startswith(os.path.basename(part) + '.') and full not in keep:
                    os.remove(full)
            done = [have + sum(os.path.getsize(s) for s, _, _ in segs if os.path.exists(s))]
            t0, start_done, last = time.time(), done[0], [0.0]

            def progress(nb):
                with _lock:
                    done[0] += nb
                    if time.time() - last[0] > 20:
                        last[0] = time.time()
                        rate = (done[0] - start_done) / 1e6 / max(time.time() - t0, 1e-3)
                        left = (size - done[0]) / 1e6 / rate / 60 if rate > 0 else float('nan')
                        print(time.strftime('%H:%M:%S'), f"  {entry['name']:22s} {done[0] / size:6.1%}  "
                              f"{done[0] / 1e6:6.0f} of {size / 1e6:.0f} MB  {rate:4.1f} MB/s  ~{left:.0f} min left", flush=True)
            with cf.ThreadPoolExecutor(max_workers=n) as ex:
                for fut in [ex.submit(fetch_range, entry['url'], s, a, b, progress) for s, a, b in segs]:
                    fut.result()
            with open(part, 'ab') as out:
                for s, _, _ in segs:
                    with open(s, 'rb') as f:
                        shutil.copyfileobj(f, out, 1 << 24)
                    os.remove(s)
        if os.path.getsize(part) == size and (not entry['md5'] or md5(part) == entry['md5']):
            os.replace(part, path)
            open(ok, 'w').close()
            return path
        log(f"  {entry['name']}: size or MD5 mismatch, downloading again")
        os.remove(part)
    raise RuntimeError(f"could not download {entry['name']}")


# ---------------------------------------------------------------- Hà Nội cut-out
def city_weights(lat, lon, ne):
    """Fraction of each 0.1 deg cell inside Hà Nội, times cos(lat). None without Natural Earth."""
    if not ne:
        return None
    import geopandas as gpd
    import shapely
    a1 = gpd.read_file(os.path.join(ne, 'a1', 'ne_10m_admin_1_states_provinces.shp'))
    hn = shapely.make_valid(a1[a1.iso_3166_2 == 'VN-HN'].union_all())
    w = np.zeros((lat.size, lon.size))
    for i, y in enumerate(lat):
        for j, x in enumerate(lon):
            c = shapely.box(x - CELL / 2, y - CELL / 2, x + CELL / 2, y + CELL / 2)
            w[i, j] = c.intersection(hn).area / c.area * np.cos(np.radians(y))
    return xr.DataArray(w, coords={'lat': lat, 'lon': lon}, dims=('lat', 'lon'))


def cut(nc_path, var):
    ds = xr.open_dataset(nc_path)
    # a few files (MPI-ESM1-2-HR SSP5-8.5) name their dimensions Time/latitude/longitude
    ds = ds.rename({k: v for k, v in {'Time': 'time', 'latitude': 'lat', 'longitude': 'lon'}.items() if k in ds.variables or k in ds.dims})
    ds = ds.sortby('lat').sortby('lon')
    src_units = ds[var].attrs.get('units', '')
    da = ds[var].sel(lat=slice(*BOX['lat']), lon=slice(*BOX['lon'])).load().astype('float32')
    ds.close()
    seen = float(da.mean())
    units = 'mm/day' if var == 'pr' else 'degC'
    if var != 'pr' and seen > 200:
        da = da - 273.15
    da.attrs = {'units': units, 'source_units_attr': src_units, 'mean_as_read': round(seen, 3)}
    return da


def series(da, w):
    lang = da.sel(lat=LANG[0], lon=LANG[1], method='nearest')
    city = (da * w).sum(('lat', 'lon')) / float(w.sum()) if w is not None else xr.full_like(lang, np.nan)
    return pd.DataFrame({'date': da.time.dt.strftime('%Y-%m-%d').values,
                         'city': np.round(city.values, 3), 'lang': np.round(lang.values, 3)})


def cut_file(job):
    """Worker process: cut one CMIP6-VN NetCDF to the Hà Nội box and save it (skipped if saved)."""
    nc, var, box = job
    if not os.path.exists(box):
        da = cut(nc, var)
        tmp = box + '.tmp'
        da.to_dataset(name=var).to_netcdf(tmp, encoding={var: {'zlib': True, 'complevel': 4}})
        os.replace(tmp, box)
    return box


def extract_model(tar_path, model, root, ne, weights_cache, procs=8):
    """Unpack the model's archive with the system tar (fast, C), cut every file to the Hà Nội box in
    parallel processes, then build the daily city/Láng series from the small box files."""
    box_dir = os.path.join(root, 'hanoi', 'box', model)
    out_csv = os.path.join(root, 'hanoi', 'series', f'{model}.csv.gz')
    if os.path.exists(out_csv):
        return None
    os.makedirs(box_dir, exist_ok=True)
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)
    work = os.path.join(root, 'work', model)
    with tarfile.open(tar_path, 'r:gz') as tf:          # the member list only; tar does the unpacking
        members = [m.name for m in tf if m.isfile() and NAME.match(os.path.basename(m.name))]
    jobs, meta = [], []
    for name in members:
        g = NAME.match(os.path.basename(name))
        box = os.path.join(box_dir, f"{g['var']}_{g['exp']}.nc")
        jobs.append((os.path.join(work, name), g['var'], box))
        meta.append(g)
    todo = [j for j in jobs if not os.path.exists(j[2])]
    if todo:
        os.makedirs(work, exist_ok=True)
        log(f'  {model}: unpacking {len(todo)} of {len(jobs)} files with tar')
        tar = shutil.which('tar') or 'tar'
        subprocess.run([tar, '-xzf', tar_path, '-C', work] + [n for n in members if os.path.join(work, n) in {j[0] for j in todo}],
                       check=True)
        with cf.ProcessPoolExecutor(max_workers=max(1, procs)) as ex:
            for i, fut in enumerate(cf.as_completed([ex.submit(cut_file, j) for j in todo]), 1):
                log(f'  {model}: {os.path.basename(fut.result())[:-3]} done ({i} of {len(todo)})')
        shutil.rmtree(work, ignore_errors=True)
    rows, files = [], []
    for (nc, var, box), g in zip(jobs, meta):
        with xr.open_dataset(box) as ds:
            if 'Time' in ds.dims or 'Time' in ds.variables:   # boxes cut before names were normalised
                ds = ds.rename({'Time': 'time'})
            da = ds[var].load()
        key = (round(float(da.lat[0]), 2), round(float(da.lon[0]), 2), da.lat.size, da.lon.size)
        with _lock:
            if key not in weights_cache:
                weights_cache[key] = city_weights(da.lat.values, da.lon.values, ne)
        s = series(da, weights_cache[key])
        s.insert(0, 'var', var)
        s.insert(0, 'exp', g['exp'])
        rows.append(s)
        files.append({'file': os.path.basename(nc), 'var': var, 'exp': g['exp'], 'years': [int(g['y0']), int(g['y1'])],
                      'units': da.attrs.get('units'), 'mean_as_read': da.attrs.get('mean_as_read')})
    pd.concat(rows).to_csv(out_csv, index=False, compression='gzip')
    return files


def extract_obs(nc_path, root, ne):
    out_dir = os.path.join(root, 'hanoi', 'box', 'OBS')
    out_csv = os.path.join(root, 'hanoi', 'series', 'OBS.csv.gz')
    if os.path.exists(out_csv):
        return None
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)
    with xr.open_dataset(nc_path) as ds:
        names = [v for v in ds.data_vars if {'lat', 'lon', 'time'} <= set(ds[v].dims)]
    rows, files, w = [], [], None
    for var in names:
        da = cut(nc_path, var)
        da.to_dataset(name=var).to_netcdf(os.path.join(out_dir, f'{var}_hist.nc'),
                                          encoding={var: {'zlib': True, 'complevel': 4}})
        if w is None:
            w = city_weights(da.lat.values, da.lon.values, ne)
        s = series(da, w)
        s.insert(0, 'var', var)
        s.insert(0, 'exp', 'obs')
        rows.append(s)
        files.append({'var': var, 'units': da.attrs['units'], 'mean_as_read': da.attrs['mean_as_read']})
        log(f'  OBS: {var} done')
    pd.concat(rows).to_csv(out_csv, index=False, compression='gzip')
    return files


# ---------------------------------------------------------------- main
def main():
    p = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    p.add_argument('--root', default='D:/cmip6vn')
    p.add_argument('--models', nargs='*', default=[])
    p.add_argument('--all', action='store_true', help='every model')
    p.add_argument('--hanoi-set', action='store_true', help='the five models hanoi.html uses: ' + ', '.join(HANOI_SET))
    p.add_argument('--segments', type=int, default=4, help='parallel byte ranges per file')
    p.add_argument('--local', action='store_true', help='never download: use only files already in raw/')
    p.add_argument('--obs', action='store_true', help='also (or only) the gridded observations')
    p.add_argument('--list', action='store_true')
    p.add_argument('--ne', default=None, help='Natural Earth folder with a1/ (for the city mean)')
    p.add_argument('--workers', type=int, default=2)
    p.add_argument('--procs', type=int, default=8, help='parallel processes for cutting out Hà Nội')
    p.add_argument('--delete-raw', action='store_true')
    p.add_argument('--no-extract', action='store_true')
    p.add_argument('--refresh', action='store_true', help='re-read the figshare listing')
    a = p.parse_args()

    raw = os.path.join(a.root, 'raw')
    os.makedirs(raw, exist_ok=True)
    cat = catalogue(a.root, a.refresh)
    models = {k: v for k, v in cat.items() if k != OBS_TITLE}

    if a.list:
        for k in sorted(models):
            print(f"{k:18s} {sum(f['size'] for f in models[k]['files']) / 1e9:6.2f} GB  {models[k]['license']}")
        print(f"{'OBS':18s} {sum(f['size'] for f in cat[OBS_TITLE]['files']) / 1e9:6.2f} GB")
        print(f"total {sum(f['size'] for v in cat.values() for f in v['files']) / 1e9:.1f} GB; "
              f"free on {a.root}: {shutil.disk_usage(a.root).free / 1e9:.0f} GB")
        return

    want = sorted(models) if a.all else list(dict.fromkeys((HANOI_SET if a.hanoi_set else []) + a.models))
    unknown = [m for m in want if m not in models]
    if unknown:
        sys.exit(f'unknown model(s): {unknown}. Use --list.')
    if not want and not a.obs:
        sys.exit('nothing to do: give --models, --hanoi-set, --all or --obs (or --list).')

    need = 0 if a.local else sum(f['size'] for m in want for f in models[m]['files']) + (cat[OBS_TITLE]['files'][0]['size'] if a.obs else 0)
    free = shutil.disk_usage(a.root).free
    if need > free * 0.9:
        sys.exit(f'needs {need / 1e9:.0f} GB, only {free / 1e9:.0f} GB free on {a.root}')

    mpath = os.path.join(a.root, 'manifest.json')
    manifest = json.load(open(mpath, encoding='utf-8')) if os.path.exists(mpath) else {
        'source': 'CMIP6-VN, Tran-Anh et al. 2023, Sci Data 10:257, doi:10.1038/s41597-023-02159-2',
        'data_doi': '10.6084/m9.figshare.c.6164352.v1', 'license': 'CC0', 'box': BOX,
        'lang_station': {'wmo': 48820, 'lat': LANG[0], 'lon': LANG[1]}, 'models': {}}
    weights_cache = {}

    if a.obs:
        entry = cat[OBS_TITLE]['files'][0]
        log('OBS: download')
        path = download(entry, raw, 0 if a.local else a.segments)
        if not a.no_extract:
            files = extract_obs(path, a.root, a.ne)
            if files is not None:
                manifest['obs'] = {'file': entry['name'], 'vars': files}

    def one(model):
        entry = models[model]['files'][0]
        log(f'{model}: download {entry["size"] / 1e9:.2f} GB')
        path = download(entry, raw, 0 if a.local else a.segments)
        if a.no_extract:
            return model, None
        files = extract_model(path, model, a.root, a.ne, weights_cache, a.procs)
        if a.delete_raw:
            os.remove(path)
        return model, files

    with cf.ThreadPoolExecutor(max_workers=max(1, a.workers)) as ex:
        for fut in cf.as_completed([ex.submit(one, m) for m in want]):
            try:
                model, files = fut.result()
            except FileNotFoundError as e:               # --local and the file isn't there yet
                log(f'missing: {e}')
                continue
            except Exception as e:                       # keep going; report at the end
                log(f'FAILED: {e!r}')
                continue
            if files is not None:
                manifest['models'][model] = {'doi': models[model]['doi'], 'files': files}
                with open(mpath, 'w', encoding='utf-8') as f:
                    json.dump(manifest, f, indent=1, ensure_ascii=False)
            log(f'{model}: finished')

    manifest['updated'] = time.strftime('%Y-%m-%d')
    with open(mpath, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=1, ensure_ascii=False)
    log('done')


if __name__ == '__main__':
    main()
