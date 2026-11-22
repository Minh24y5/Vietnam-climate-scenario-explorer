"""Seasonal rain and a drought index (SPEI) for Vietnam and its 7 climate zones, from CMIP6 monthly data.

Output: data/vietnam_water.json

Method
  * The same 5 models, runs, zones and land-overlap weights as build_data.py (helpers imported from it).
  * Monthly zone means of tas, tasmax, tasmin (degC) and pr (mm per month), 1950-2100, cached in
    pipeline/.cache as *_mon.npz so a rerun downloads nothing.
  * Seasonal rain: each model's mean rain for each calendar month over 1985-2014 and 2071-2100.
  * Drought: the Standardised Precipitation-Evapotranspiration Index (SPEI; Vicente-Serrano et al. 2010,
    J. Climate 23, 1696-1718) at a 6-month scale. Water balance = rain - potential evaporation, with
    potential evaporation from Hargreaves (FAO-56 eq. 52; Hargreaves & Samani 1985), which needs only
    daily mean, maximum and minimum temperature. A generalized logistic distribution (the SPEI R package's form of the
    log-logistic) is fitted by L-moments for each calendar month to each model's own 1985-2014, so about 16% of baseline
    months fall at or below -1 by construction. A drought month is SPEI-6 <= -1.
  * CESM2's run r4i1p1f1 has no historical tasmax/tasmin in the archive, so the drought index uses the
    other 4 models; seasonal rain uses all 5.

Usage
  python pipeline/build_water.py --ne D:/ne_cache
"""
import argparse
import json
import math
import os
import sys
import time

import numpy as np
import pandas as pd
from statistics import NormalDist

PPF = np.vectorize(NormalDist().inv_cdf)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_data import (CACHE, CATALOG, EXPS, MODELS, ROOT, load_geography, log, open_store,  # noqa: E402
                        overlap_weights, region_grid)

MVARS = ('pr', 'tas', 'tasmax', 'tasmin')
BASE, EOC, MIDC = (1985, 2014), (2071, 2100), (2036, 2065)
SCALE = 6
SCENS = ('ssp245', 'ssp585')


def monthly_series(cat, model, member, var, exp, W, li, lj):
    """(zone+1, months) array of monthly zone means, the 7 zones then national; None if not in the archive."""
    key = os.path.join(CACHE, f'{model}_{member}_{var}_{exp}_mon.npz')
    if os.path.exists(key):
        return np.load(key)['vals']
    try:
        ds, _ = open_store(cat, model, member, var, exp)
    except AssertionError:
        log(f'  {model} {var} {exp}: not in the archive')
        return None
    y0, y1 = EXPS[exp]
    da = ds[var].isel(lat=li, lon=lj)
    da = da.sel(time=(da.time.dt.year >= y0) & (da.time.dt.year <= y1))
    t0 = time.time()
    log(f'  downloading {model} {var} {exp} {tuple(da.shape)} ...')
    x = da.load().values
    n = (y1 - y0 + 1) * 12
    assert x.shape[0] == n, f'{model} {var} {exp}: {x.shape[0]} months, expected {n}'
    days = da.time.dt.days_in_month.values.astype(float)
    Wn = np.concatenate([W, W.sum(0, keepdims=True)])
    sp = (x[None] * Wn[:, None]).sum((2, 3)) / Wn.sum((1, 2))[:, None]
    sp = sp * 86400 * days if var == 'pr' else sp - 273.15
    np.savez(key, vals=sp)
    log(f'  done {model} {var} {exp} in {time.time() - t0:.0f}s')
    return sp


def ra_mm(lat_deg):
    """Extraterrestrial radiation (mm/day evaporation equivalent) on the 15th of each month (FAO-56 eq. 21-25)."""
    phi = math.radians(lat_deg)
    out = []
    for m in range(12):
        J = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349][m]
        dr = 1 + 0.033 * math.cos(2 * math.pi * J / 365)
        d = 0.409 * math.sin(2 * math.pi * J / 365 - 1.39)
        ws = math.acos(-math.tan(phi) * math.tan(d))
        ra = 24 * 60 / math.pi * 0.0820 * dr * (ws * math.sin(phi) * math.sin(d) + math.cos(phi) * math.cos(d) * math.sin(ws))
        out.append(0.408 * ra)
    return np.array(out)


def hargreaves(tas, tmax, tmin, lat, years):
    """Monthly potential evaporation in mm, from monthly mean temperatures."""
    ra = np.tile(ra_mm(lat), len(years))
    days = np.array([pd.Period(f'{y}-{m + 1:02d}').days_in_month for y in years for m in range(12)], float)
    return 0.0023 * ra * (tas + 17.8) * np.sqrt(np.clip(tmax - tmin, 0, None)) * days


def glo_fit(x):
    """Generalized logistic by L-moments (Hosking 1997), the fit the SPEI R package uses for the
    log-logistic option; unlike the 3-parameter log-logistic it allows either skew."""
    x = np.sort(np.asarray(x, float))
    n = len(x)
    i = np.arange(1, n + 1)
    b0 = x.mean()
    b1 = np.sum((i - 1) / (n - 1) * x) / n
    b2 = np.sum((i - 1) * (i - 2) / ((n - 1) * (n - 2)) * x) / n
    l1, l2, l3 = b0, 2 * b1 - b0, 6 * b2 - 6 * b1 + b0
    k = -l3 / l2
    if abs(k) < 1e-6:
        return l1, l2, 0.0
    a = l2 * math.sin(k * math.pi) / (k * math.pi)
    return l1 - a * (1 / k - math.pi / math.sin(k * math.pi)), a, k


def glo_cdf(x, xi, a, k):
    with np.errstate(invalid='ignore', divide='ignore', over='ignore'):
        if k == 0:
            y = (x - xi) / a
        else:
            arg = 1 - k * (x - xi) / a
            y = np.where(arg > 0, -np.log(np.where(arg > 0, arg, 1)) / k, np.inf if k > 0 else -np.inf)
        return 1 / (1 + np.exp(-y))


def spei(D, years):
    """SPEI at SCALE months from the monthly water balance D, fitted on BASE for each calendar month."""
    acc = np.convolve(D, np.ones(SCALE), 'valid')
    acc = np.concatenate([np.full(SCALE - 1, np.nan), acc])
    out = np.full(len(D), np.nan)
    yr = np.repeat(years, 12)
    mo = np.tile(np.arange(12), len(years))
    for m in range(12):
        sel = mo == m
        ref = acc[sel & (yr >= BASE[0]) & (yr <= BASE[1])]
        ref = ref[~np.isnan(ref)]
        xi, a, k = glo_fit(ref)
        x = acc[sel]
        p = glo_cdf(x, xi, a, k)
        v = np.clip(PPF(np.nan_to_num(np.clip(p, 1e-6, 1 - 1e-6), nan=0.5)), -3, 3)
        out[sel] = np.where(np.isnan(x), np.nan, v)
    return out


def r(x, k=1):
    return None if x is None or not np.isfinite(x) else round(float(x), k)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ne', required=True)
    a = ap.parse_args()
    zones, _, _ = load_geography(a.ne)
    ids = list(zones.id) + ['vn']
    cat = pd.read_csv(CATALOG)
    years = np.arange(1950, 2101)
    out = {i: {'months': {}, 'drought': {}} for i in ids}
    used_drought = []
    for model, member in MODELS.items():
        log(f'{model} {member}')
        ds, _ = open_store(cat, model, member, 'tas', 'historical')
        li, lj, latb, lonb = region_grid(ds)
        W = overlap_weights(zones, li, lj, latb, lonb)
        Wn = np.concatenate([W, W.sum(0, keepdims=True)])
        clat = (latb[0] + latb[1]) / 2
        lat = (Wn.sum(2) * clat[None]).sum(1) / Wn.sum((1, 2))  # weighted latitude of each region
        S = {}
        for v in MVARS:
            for s in SCENS:
                h = monthly_series(cat, model, member, v, 'historical', W, li, lj)
                f = monthly_series(cat, model, member, v, s, W, li, lj)
                S[(v, s)] = None if h is None or f is None else np.concatenate([h, f], 1)
        has_t = all(S[(v, s)] is not None for v in ('tas', 'tasmax', 'tasmin') for s in SCENS)
        if has_t:
            used_drought.append(model)
        for k, i in enumerate(ids):
            for s in SCENS:
                pr = S[('pr', s)][k].reshape(len(years), 12)
                yb = (years >= BASE[0]) & (years <= BASE[1])
                ye = (years >= EOC[0]) & (years <= EOC[1])
                mo = out[i]['months'].setdefault(model, {})
                mo['base'] = [r(x) for x in pr[yb].mean(0)]
                mo[s] = [r(x) for x in pr[ye].mean(0)]
                if not has_t:
                    continue
                pet = hargreaves(S[('tas', s)][k], S[('tasmax', s)][k], S[('tasmin', s)][k], lat[k], years)
                D = S[('pr', s)][k] - pet
                sp = spei(D, years).reshape(len(years), 12)
                dm = (sp <= -1).sum(1).astype(float)
                dm[:1] = np.nan  # the first months have no full 6-month window
                dr = out[i]['drought'].setdefault(model, {})
                dr[s] = [None if not np.isfinite(x) else int(x) for x in dm]
                pm = pet.reshape(len(years), 12)
                dr.setdefault('pet_base', [r(x) for x in pm[yb].mean(0)])
                dr[f'pet_{s}'] = [r(x) for x in pm[ye].mean(0)]
            log(f'  {i}: done')
    meta = {
        'source': 'CMIP6 via NOAA / Google Cloud public datasets (' + CATALOG + ')',
        'members': MODELS,
        'regions': [{'id': z.id, 'vi': z.vi, 'en': z.en} for z in zones.itertuples()] + [{'id': 'vn', 'vi': 'Việt Nam', 'en': 'Vietnam'}],
        'months': 'mean rain (mm) for each calendar month, Jan..Dec, over 1985-2014 (base) and 2071-2100 (by scenario)',
        'drought': f'months per year with SPEI-{SCALE} <= -1, 1950-2100 (historical then scenario); pet_*: mean monthly '
                   'potential evaporation (mm, Hargreaves) for 1985-2014 and 2071-2100',
        'drought_models': used_drought,
        'spei': {'scale': SCALE, 'threshold': -1, 'baseline': list(BASE), 'pet': 'Hargreaves (FAO-56 eq. 52)',
                 'distribution': 'generalized logistic (SPEI package log-logistic), L-moments, per calendar month'},
        'built': time.strftime('%Y-%m-%d'),
    }
    path = os.path.join(ROOT, 'data', 'vietnam_water.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump({'meta': meta, 'regions': out}, f, ensure_ascii=False, separators=(',', ':'))
    log('wrote', path, f'{os.path.getsize(path) / 1024:.0f} KB; drought models: {used_drought}')


if __name__ == '__main__':
    main()
