"""When each CMIP6-VN model reaches +1.5, +2, +3 and +4 degC of global warming.

The Hà Nội report uses global warming levels (GWLs) as its main axis: "at +2 degC" means the 20 years
when a model's global mean temperature is 2 degC above its own 1850-1900 mean. This script finds those
20-year windows for every model and scenario in CMIP6-VN (see pipeline/fetch_cmip6vn.py).

Method (the one used for IPCC AR6, as published by Hauser et al., doi:10.5281/zenodo.3591806):
  1. global mean of monthly tas (Amon), weighted by areacella when the archive has it, else cos(lat)
  2. annual mean, months weighted equally
  3. historical 1850-2014 followed by the scenario 2015-2100
  4. minus the 1850-1900 mean
  5. 20-year centred running mean; the first year it exceeds the level is the central year n,
     and the window is [n-10, n+9]
A window is usable with CMIP6-VN only if it lies inside 1980-2099 (CMIP6-VN's years); 'fits' says so.

Observed level: besides the fixed levels, the script adds the level the real world was at over
2006-2025 (the 20 years the Hà Nội page tests the models against), from HadCRUT5's annual global
mean against its own 1850-1900 mean, rounded to 0.01 degC. Berkeley Earth is computed as a check.
Each model's window at that level is its own 20 years at the warming the world actually had, so a
fast-warming model is not penalised for reaching it early. Stored in 'observed_level'; the level's
key in each scenario is str(level), e.g. '1.12'.

Sources
  * Global tas: Google's public CMIP6 zarr archive (the same catalogue as build_data.py).
  * Where Google lacks a run (ACCESS-ESM1-5 r1i1p1f1 SSP2-4.5/3-7.0, GISS-E2-1-G r1i1p1f2 futures),
    the window is taken from Hauser's table, which comes from ESGF (CC BY-SA 4.0); 'source' says so.
  * Checks: every computed window is compared with Hauser's table and with the IPCC AR6 Atlas table
    (github.com/IPCC-WG1/Atlas, warming-levels/CMIP6_Atlas_WarmingLevels.csv); the results go in 'checks'.

Runs: CMIP6-VN's paper (Table 1) gives six run labels that do not exist in CMIP6. They look like
neighbouring rows swapped. Each is replaced by the model's real first run and flagged in 'run_note'.

Output: data/hanoi/warming_levels.json. Annual global series are cached in pipeline/.cache/gmst/.

Usage
  python pipeline/warming_levels.py [--workers 4] [--models MIROC6 ...] [--out path.json]
"""
import argparse
import concurrent.futures as cf
import io
import json
import os
import threading
import time

import numpy as np
import pandas as pd
import requests
import xarray as xr

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'pipeline', '.cache')
OUT = os.path.join(ROOT, 'data', 'hanoi', 'warming_levels.json')
CATALOG = 'https://storage.googleapis.com/cmip6/cmip6-zarr-consolidated-stores.csv'
HAUSER = ('https://raw.githubusercontent.com/mathause/cmip_warming_levels/main/warming_levels/'
          'cmip6_all_ens/csv/cmip6_warming_levels_all_ens_1850_1900.csv')
ATLAS = 'https://raw.githubusercontent.com/IPCC-WG1/Atlas/main/warming-levels/CMIP6_Atlas_WarmingLevels.csv'
HADCRUT_V = '5.1.0.0'
HADCRUT = (f'https://www.metoffice.gov.uk/hadobs/hadcrut5/data/HadCRUT.{HADCRUT_V}/analysis/diagnostics/'
           f'HadCRUT.{HADCRUT_V}.analysis.summary_series.global.annual.csv')
BERKELEY = 'https://berkeley-earth-temperature.s3.us-west-1.amazonaws.com/Global/Land_and_Ocean_summary.txt'
OBS_PERIOD = (2006, 2025)       # the observed 20 years the Hà Nội page tests the models against
LEVELS = (1.0, 1.5, 2.0, 3.0, 4.0)
WINDOW = 20
CMIP6VN_YEARS = (1980, 2099)
SSPS = ('ssp119', 'ssp126', 'ssp245', 'ssp370', 'ssp434', 'ssp460', 'ssp585')

# CMIP6-VN Table 1: model, run as printed, data (x = rain and temperature, o = rain only), and the
# scenarios it holds. RUN_FIX replaces labels that do not exist in CMIP6.
TABLE1 = """model,run,hist,ssp119,ssp126,ssp245,ssp370,ssp434,ssp460,ssp585
ACCESS-CM2,r1i1p1f1,x,-,x,x,x,-,-,x
ACCESS-ESM1-5,r1i1p1f1,x,-,x,x,x,-,-,x
AWI-CM-1-1-MR,r1i1p1f1,x,-,x,x,x,-,-,x
BCC-CSM2-MR,r1i1p1f1,x,-,x,x,x,-,-,x
CAMS-CSM1-0,r1i1p1f1,o,-,-,-,-,-,-,-
CAS-ESM2-0,r1i1p1f1,o,-,o,-,o,-,-,o
CESM2,r1i1p1f1,o,-,o,o,o,-,-,o
CESM2-WACCM,r4i1p1f1,o,-,o,-,o,-,-,o
CIESM,r1i1p1f1,x,-,x,x,-,-,-,x
CMCC-ESM2,r1i1p1f1,x,-,x,x,x,-,-,x
CNRM-CM6-1-HR,r1i1p1f1,x,-,x,x,x,-,-,x
CNRM-ESM2-1,r1i1p1f2,x,x,x,x,x,x,x,x
CanESM5,r1i1p1f2,x,x,x,x,x,x,x,x
EC-Earth3,r1i1p1f1,x,-,x,x,x,-,-,x
EC-Earth3-Veg,r1i1p1f1,x,x,x,x,x,-,-,x
FGOALS-f3-L,r1i1p1f1,o,-,o,-,o,-,-,o
FGOALS-g3,r1i1p1f1,x,x,x,x,x,x,x,x
FIO-ESM-2-0,r1i1p1f1,x,-,o,-,-,-,-,o
GFDL-ESM4,r1i1p1f1,x,x,x,x,x,-,-,x
GISS-E2-1-G,r1i1p1f2,x,x,x,x,x,x,x,x
HadGEM3-GC31-LL,r1i1p1f3,x,-,x,x,-,-,-,x
HadGEM3-GC31-MM,r1i1p1f3,x,-,x,-,-,-,-,x
IITM-ESM,r1i1p1f1,o,-,o,-,o,-,-,o
INM-CM5-0,r1i1p1f1,x,-,x,x,x,-,-,x
IPSL-CM6A-LR,r1i1p1f1,x,x,x,x,x,x,x,x
KACE-1-0-G,r1i1p1f1,o,-,o,-,o,-,-,o
MCM-UA-1-0,r1i1p1f2,o,-,o,-,o,-,-,o
MIROC-ES2L,r1i1p1f1,x,x,x,x,x,-,-,x
MIROC6,r1i1p1f2,x,x,x,x,x,x,x,x
MPI-ESM1-2-HR,r1i1p1f1,x,-,x,x,x,-,-,x
MRI-ESM2-0,r1i1p1f1,x,x,x,x,x,x,x,x
NESM3,r1i1p1f1,x,-,x,x,-,-,-,x
NorESM2-MM,r1i1p1f1,o,-,o,o,o,-,-,o
TaiESM1,r1i1p1f1,o,-,-,-,o,-,-,o
UKESM1-0-LL,r1i1p1f2,x,x,x,x,x,-,-,x
"""
# MPI-ESM1-2-HR's SSP3-7.0 is marked '-' in Table 1, but the figshare archive has it (and it is the
# only MPI scenario whose temperature files pass the quality check in build_hanoi.py), so it is listed.
RUN_FIX = {
    'CESM2': ('r4i1p1f1', 'r1i1p1f1 has no scenario runs in CMIP6; r4i1p1f1 is the first run with all of them '
                          '(also used by NEX-GDDP and the national page)'),
    'CESM2-WACCM': ('r1i1p1f1', 'no r4i1p1f1 historical run exists; r1i1p1f1 is the first run'),
    'CanESM5': ('r1i1p1f1', 'CanESM5 has no f2 runs; r1i1p1f1 is the first run'),
    'CNRM-CM6-1-HR': ('r1i1p1f2', 'CNRM models only have f2 runs'),
    'MIROC6': ('r1i1p1f1', 'MIROC6 has no f2 runs (the label looks swapped with MIROC-ES2L)'),
    'MIROC-ES2L': ('r1i1p1f2', 'MIROC-ES2L only has f2 runs (the label looks swapped with MIROC6)'),
}

_lock = threading.Lock()


def log(*a):
    with _lock:
        print(time.strftime('%H:%M:%S'), *a, flush=True)


def cached_get(url, name):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name)
    if not os.path.exists(path):
        r = requests.get(url, timeout=300)
        r.raise_for_status()
        with open(path, 'wb') as f:
            f.write(r.content)
    return path


def table1():
    t = pd.read_csv(io.StringIO(TABLE1))
    t['run_paper'] = t.run
    t['run_note'] = None
    for m, (run, note) in RUN_FIX.items():
        t.loc[t.model == m, ['run', 'run_note']] = [run, note]
    return t


# ---------------------------------------------------------------- global mean temperature
def store(cat, table, model, member, var, exp=None):
    q = cat[(cat.table_id == table) & (cat.source_id == model) & (cat.variable_id == var)]
    if member:
        q = q[q.member_id == member]
    if exp:
        q = q[q.experiment_id == exp]
    return q.sort_values('version').iloc[-1] if len(q) else None


def open_zarr(zstore):
    import gcsfs
    fs = gcsfs.GCSFileSystem(token='anon')
    return xr.open_zarr(fs.get_mapper(zstore), consolidated=True)


def weights(cat, model, grid_label, ds):
    r = store(cat, 'fx', model, None, 'areacella')
    if r is not None and r.grid_label == grid_label:
        a = open_zarr(r.zstore).areacella.load()
        if a.shape == (ds.lat.size, ds.lon.size):
            return a.values, 'areacella'
    w = np.cos(np.deg2rad(ds.lat.values))[:, None] * np.ones((1, ds.lon.size))
    return w, 'coslat'


def gmst(cat, model, member, exp):
    """Annual global mean tas (degC) as a Series indexed by year; cached as CSV."""
    path = os.path.join(CACHE, 'gmst', f'{model}_{member}_{exp}.csv')
    if os.path.exists(path):
        s = pd.read_csv(path, index_col=0).iloc[:, 0]
        return s, s.name
    r = store(cat, 'Amon', model, member, 'tas', exp)
    if r is None:
        return None, None
    ds = open_zarr(r.zstore)
    da = ds.tas
    w, how = weights(cat, model, r.grid_label, ds)
    w = w / w.sum()
    step = (da.encoding.get('preferred_chunks') or {}).get('time') or da.encoding.get('chunks', (120,))[0]
    vals = []
    for i in range(0, da.time.size, max(int(step), 12)):
        x = da.isel(time=slice(i, i + max(int(step), 12))).values
        vals.append((x * w).sum((1, 2)))
    mon = pd.Series(np.concatenate(vals) - 273.15, index=da.time.dt.year.values)
    ann = mon.groupby(level=0).agg(['mean', 'count'])
    s = ann.loc[ann['count'] == 12, 'mean'].rename(f'{how}|{r.zstore}')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    s.to_csv(path)
    log(f'  {model} {member} {exp}: {s.index.min()}-{s.index.max()} ({how})')
    return s, s.name


def observed_level():
    """Global warming over OBS_PERIOD against 1850-1900, from HadCRUT5 (used) and Berkeley Earth (check).
    Each dataset's own 1850-1900 mean is its baseline. HadCRUT5's file can hold a partial current year;
    only complete years inside OBS_PERIOD are used."""
    a, b = OBS_PERIOD
    had = pd.read_csv(cached_get(HADCRUT, f'hadcrut{HADCRUT_V}_global_annual.csv'), index_col=0).iloc[:, 0]
    had = had - had.loc[1850:1900].mean()
    ber = pd.read_csv(cached_get(BERKELEY, 'berkeley_land_ocean_summary.txt'), comment='%', sep=r'\s+',
                      header=None, index_col=0).iloc[:, 0]
    ber = ber - ber.loc[1850:1900].mean()
    if had.loc[a:b].size < b - a + 1:
        raise SystemExit(f'HadCRUT5 {HADCRUT_V} does not cover {a}-{b} yet')
    level = round(float(had.loc[a:b].mean()), 2)
    by = ber.loc[a:b]
    return {'level': level, 'period': [a, b], 'baseline': '1850-1900',
            'hadcrut5': level, 'hadcrut5_version': HADCRUT_V,
            'hadcrut5_1995_2014': round(float(had.loc[1995:2014].mean()), 3),
            'berkeley_earth': round(float(by.mean()), 2), 'berkeley_earth_years': [int(by.index.min()), int(by.index.max())],
            'sources': {'hadcrut5': HADCRUT, 'berkeley_earth': BERKELEY},
            'note': 'blended surface temperature (GMST); models use near-surface air temperature (GSAT), which AR6 '
                    'assesses as within about 10% of it over this period'}


def crossings(anom, levels=LEVELS):
    """First central year where the 20-yr centred mean exceeds each level."""
    roll = anom.rolling(WINDOW, center=True).mean().dropna()   # label i covers [i-10, i+9]
    out = {}
    for lv in levels:
        hit = roll[roll > lv]
        if len(hit):
            n = int(hit.index[0])
            out[str(lv)] = {'central': n, 'start': n - WINDOW // 2, 'end': n + WINDOW // 2 - 1}
        else:
            out[str(lv)] = None
    return out


def add_fits(levels):
    for v in levels.values():
        if v:
            v['fits_cmip6vn'] = CMIP6VN_YEARS[0] <= v['start'] and v['end'] <= CMIP6VN_YEARS[1]
    return levels


# ---------------------------------------------------------------- per model
def one_model(row, cat, hauser, levels=LEVELS):
    model, run = row['model'], row['run']
    exps = [e for e in SSPS if row[e] != '-']
    res = {'run': run, 'run_paper': row['run_paper'], 'run_note': row['run_note'],
           'cmip6vn_historical': 'rain and temperature' if row['hist'] == 'x' else 'rain only', 'scenarios': {}}
    hist, src = gmst(cat, model, run, 'historical')
    if hist is not None:
        base = hist.loc[1850:1900]
        res['baseline_1850_1900_degC'] = round(float(base.mean()), 3)
        res['gmst_weighting'] = src.split('|')[0]
        res['warming_by_period'] = {p: round(float(hist.loc[a:b].mean() - base.mean()), 3)
                                    for p, (a, b) in {'1980-2014': (1980, 2014), '1995-2014': (1995, 2014)}.items()}
    for exp in exps:
        fut = gmst(cat, model, run, exp)[0] if hist is not None else None
        if fut is not None and hist is not None:
            s = pd.concat([hist.loc[:2014], fut.loc[2015:2100]])
            anom = s - hist.loc[1850:1900].mean()
            entry = {'source': 'computed', **add_fits(crossings(anom, levels)),
                     'warming_2081_2100': round(float(anom.loc[2081:2100].mean()), 3)}
        else:
            h = hauser[(hauser.model == model) & (hauser.ensemble == run) & (hauser.exp == exp)]
            if not len(h):
                entry = {'source': 'missing'}
            else:
                entry = {'source': 'hauser'}
                for lv in levels:           # Hauser has no row for the observed level: None there
                    r = h[np.isclose(h.warming_level, lv)]
                    entry[str(lv)] = ({'central': int(r.start_year.iloc[0]) + WINDOW // 2,
                                       'start': int(r.start_year.iloc[0]), 'end': int(r.end_year.iloc[0])}
                                      if len(r) else None)
                add_fits({k: v for k, v in entry.items() if k != 'source'})
        entry['cmip6vn_data'] = 'rain and temperature' if row[exp] == 'x' else 'rain only'
        res['scenarios'][exp] = entry
    log(f'{model}: done ({", ".join(f"{e}:{v["source"]}" for e, v in res["scenarios"].items())})')
    return model, res


# ---------------------------------------------------------------- checks and summary
def checks(models, hauser, atlas):
    rows = []
    for m, r in models.items():
        for exp, e in r['scenarios'].items():
            if e.get('source') != 'computed':
                continue
            for lv in LEVELS:
                ours = e.get(str(lv))
                h = hauser[(hauser.model == m) & (hauser.ensemble == r['run']) & (hauser.exp == exp)
                           & np.isclose(hauser.warming_level, lv)]
                a_col = f'{lv:g}_{exp}'
                a = atlas.loc[atlas.model_run == f"{m}_{r['run']}", a_col] if a_col in atlas else pd.Series(dtype=object)
                listed = ((hauser.model == m) & (hauser.ensemble == r['run']) & (hauser.exp == exp)).any()
                rows.append({'model': m, 'exp': exp, 'level': lv,
                             'ours': ours['start'] if ours else None,
                             'hauser': int(h.start_year.iloc[0]) if len(h) else None,
                             'hauser_listed': bool(listed),
                             # Atlas central year n means the window [n-9, n+10]
                             'atlas': (int(a.iloc[0]) - 9) if len(a) and str(a.iloc[0]) not in ('NA', '9999', 'nan') else None,
                             'atlas_listed': bool(len(a))})
    df = pd.DataFrame(rows)

    def compare(col):
        both = df.dropna(subset=['ours', col])
        d = (both.ours - both[col]).abs()
        only = df[df[col].isna() != df.ours.isna()]
        only = only[only[f'{col}_listed']]          # only where that table covers the run and scenario
        return {'pairs': int(len(both)), 'same_start_year': int((d == 0).sum()), 'within_1_year': int((d <= 1).sum()),
                'max_diff_years': int(d.max()) if len(d) else None,
                'reached_in_one_only': int(len(only)),
                'largest': both.assign(diff=d).sort_values('diff', ascending=False).head(5)[
                    ['model', 'exp', 'level', 'ours', col]].to_dict('records')}
    return {'start_year_vs_hauser': compare('hauser'), 'start_year_vs_ipcc_atlas': compare('atlas')}


def summary(models, levels=LEVELS):
    out = {}
    for exp in SSPS:
        out[exp] = {}
        for lv in levels:
            cen, n, fits, temp = [], 0, 0, 0
            for r in models.values():
                e = r['scenarios'].get(exp)
                if not e or e.get('source') == 'missing':
                    continue
                n += 1
                v = e.get(str(lv))
                if v:
                    cen.append(v['central'])
                    fits += bool(v.get('fits_cmip6vn'))
                    temp += bool(v.get('fits_cmip6vn')) and e['cmip6vn_data'] == 'rain and temperature'
            if n:
                out[exp][str(lv)] = {'models': n, 'reached': len(cen), 'usable_with_cmip6vn': fits,
                                     'usable_with_temperature': temp,
                                     'central_median': int(np.median(cen)) if cen else None,
                                     'central_min': min(cen) if cen else None, 'central_max': max(cen) if cen else None}
    return {k: v for k, v in out.items() if v}


def main():
    p = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    p.add_argument('--workers', type=int, default=4)
    p.add_argument('--models', nargs='*', default=[])
    p.add_argument('--out', default=OUT, help='output JSON (default data/hanoi/warming_levels.json)')
    a = p.parse_args()

    cat = pd.read_csv(cached_get(CATALOG, 'cmip6-zarr-consolidated-stores.csv'))
    cat = cat[cat.table_id.isin(['Amon', 'fx']) & cat.variable_id.isin(['tas', 'areacella'])]
    hauser = pd.read_csv(cached_get(HAUSER, 'hauser_cmip6_warming_levels_all_ens_1850_1900.csv'),
                         comment='#', skipinitialspace=True)
    hauser.columns = [c.strip() for c in hauser.columns]
    atlas = pd.read_csv(cached_get(ATLAS, 'ipcc_atlas_cmip6_warming_levels.csv'), dtype=str)
    obs = observed_level()
    levels = tuple(sorted(set(LEVELS) | {obs['level']}))
    log(f"observed {obs['period'][0]}-{obs['period'][1]}: +{obs['level']} degC (HadCRUT5), "
        f"+{obs['berkeley_earth']} (Berkeley Earth {obs['berkeley_earth_years'][0]}-{obs['berkeley_earth_years'][1]})")
    t = table1()
    if a.models:
        t = t[t.model.isin(a.models)]

    models = {}
    with cf.ThreadPoolExecutor(max_workers=a.workers) as ex:
        for fut in cf.as_completed([ex.submit(one_model, r, cat, hauser, levels) for _, r in t.iterrows()]):
            m, r = fut.result()
            models[m] = r
    models = dict(sorted(models.items()))

    out = {
        'meta': {
            'what': 'Global warming level windows for the CMIP6-VN models and scenarios',
            'baseline': '1850-1900', 'window_years': WINDOW,
            'convention': 'central year n = first year the 20-year centred mean exceeds the level; window [n-10, n+9]',
            'fits_cmip6vn': f'window inside {CMIP6VN_YEARS[0]}-{CMIP6VN_YEARS[1]}',
            'sources': {'gmst': CATALOG,
                        'hauser': 'Hauser, Engelbrecht & Fischer, cmip_warming_levels, doi:10.5281/zenodo.3591806, CC BY-SA 4.0',
                        'ipcc_atlas': 'IPCC AR6 WGI Atlas, ' + ATLAS,
                        'cmip6vn_table1': 'Tran-Anh et al. 2023, Sci Data 10:257, Table 1',
                        'observed_gmst': f'HadCRUT5 {HADCRUT_V} (Morice et al. 2021), Berkeley Earth as a check'},
            'built': time.strftime('%Y-%m-%d')},
        'levels': list(levels),
        'observed_level': obs,
        'summary': summary(models, levels),
        'checks': checks(models, hauser, atlas),
        'models': models,
    }
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=1, ensure_ascii=False, default=lambda o: o.item() if hasattr(o, 'item') else str(o))
    log(f'wrote {a.out}')
    print(json.dumps(out['checks'], indent=1, default=str))


if __name__ == '__main__':
    main()
