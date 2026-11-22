"""Build data/hanoi/water.json: Hà Nội's rain by season, dry spells, drought (SPEI) and humid heat.

Inputs
  data/hanoi/hanoi.json                    the models and warming-level windows hanoi.html uses (build_hanoi.py)
  D:/cmip6vn/hanoi/series/<model>.csv.gz   daily city means from CMIP6-VN (pr, tasmax, tasmin, tas)
  D:/cmip6vn/hanoi/series/OBS.csv.gz       gridded observations 1980-2014
  D:/era5land/hanoi/ERA5L.csv.gz           reanalysis 1980-2025 (temperature, dewpoint, rain)
  D:/chirps/hanoi_chirps.csv.gz            CHIRPS v2.0 daily rain 1981-2025 (pipeline/fetch_chirps.py)
  D:/chirps/oni.ascii.txt                  NOAA CPC Oceanic Niño Index
  D:/nexgddp/hanoi/<model>.csv.gz          NEX-GDDP-CMIP6 daily tas, tasmax, hurs (pipeline/fetch_nexgddp.py), optional

What it computes, for the Hà Nội city mean
  months    mean rain for each calendar month (mm)
  dry, wet  rain in the dry season (Nov-Apr, counted within the calendar year) and the rainy season (May-Oct)
  rx5       wettest 5-day total of the year (mm, mean of yearly maxima)
  cdd       longest run of dry days (< 1 mm) in the year
  drought   months a year with SPEI-6 <= -1. SPEI as in build_water.py: rain minus Hargreaves potential
            evaporation from daily max/min temperature, a generalized logistic fitted per calendar month to
            1985-2014 (each model to its own historical run, the observed record to OBS)
  tw        days a year whose daily-mean wet-bulb temperature (Stull 2011) reaches TW_DAY degC, and the
            June-August mean wet-bulb temperature. Observed: raw ERA5-Land (not calibrated). Models: NEX-GDDP-CMIP6
            (CMIP6-VN has no humidity), by the delta method: each model's change in mean wet-bulb for each calendar
            month (window against its own 1995-2014) is added to the observed 1995-2014 daily series, because
            NEX-GDDP's own summer humidity over Hà Nội is far too high (about 92% against ERA5-Land's 84%).
Models: the same windows as hanoi.json (scenario windows of each warming level, set-aside variables dropped).

Observed rain after 2014: CHIRPS and ERA5 are both quantile-mapped to OBS per calendar month on 1981-2004,
then checked against OBS on 2005-2014 ('rain_check'). The better monthly match carries the rain record from 2015
(this file's observed products are monthly); build_hanoi.py chooses separately for its daily counts.

Usage
  python pipeline/build_hanoi_water.py
"""
import itertools
import json
import os
import sys
import time

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_hanoi import (CHECK_YEARS, FIT_YEARS, calibrate, observed_record, span, wide, window)  # noqa: E402
from build_water import hargreaves, spei  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HN_JSON = os.path.join(ROOT, 'data', 'hanoi', 'hanoi.json')
OUT = os.path.join(ROOT, 'data', 'hanoi', 'water.json')
SERIES = 'D:/cmip6vn/hanoi/series'
ERA = 'D:/era5land/hanoi/ERA5L.csv.gz'
CHIRPS = 'D:/chirps/hanoi_chirps.csv.gz'
ONI = 'D:/chirps/oni.ascii.txt'
NEX = 'D:/nexgddp/hanoi'
LAT = 21.03
BASE = (1995, 2014)
DRY_MONTHS = (11, 12, 1, 2, 3, 4)
TW_DAY = 27.0
REC = (1980, 2025)


def stull(t, rh):
    """Wet-bulb temperature (degC) from air temperature (degC) and relative humidity (%), Stull (2011)."""
    rh = np.clip(rh, 5, 99)
    return (t * np.arctan(0.151977 * np.sqrt(rh + 8.313659)) + np.arctan(t + rh) - np.arctan(rh - 1.676331)
            + 0.00391838 * rh ** 1.5 * np.arctan(0.023101 * rh) - 4.686035)


def rh_from_td(t, td):
    """Relative humidity (%) from temperature and dewpoint (degC), Magnus formula."""
    es = lambda x: np.exp(17.625 * x / (243.04 + x))
    return 100 * es(td) / es(t)


def yearly_water(w):
    """Per calendar year: dry, wet, rx5, cdd from a daily frame with 'pr'."""
    pr = w.pr.dropna()
    g = pr.groupby(pr.index.year)
    out = pd.DataFrame(index=sorted(g.groups))
    out['dry'] = pr[pr.index.month.isin(DRY_MONTHS)].groupby(lambda d: d.year).sum()
    out['wet'] = pr[~pr.index.month.isin(DRY_MONTHS)].groupby(lambda d: d.year).sum()
    out['rx5'] = g.apply(lambda s: s.rolling(5).sum().max())
    out['cdd'] = g.apply(lambda s: max((len(list(r)) for k, r in itertools.groupby(s.values < 1) if k), default=0))
    return out


def months(w):
    pr = w.pr.dropna()
    m = pr.groupby([pr.index.year, pr.index.month]).sum().unstack()
    return [round(float(x), 1) for x in m.mean().reindex(range(1, 13)).values]


def drought_years(w):
    """Drought months per calendar year from a continuous daily frame with pr, tasmax, tasmin."""
    m = w[['pr', 'tasmax', 'tasmin']].resample('MS').agg({'pr': 'sum', 'tasmax': 'mean', 'tasmin': 'mean'})
    years = np.arange(m.index.year[0], m.index.year[-1] + 1)
    if len(m) != len(years) * 12:
        raise ValueError(f'{len(m)} months for {len(years)} years')
    tm = (m.tasmax + m.tasmin) / 2
    pet = hargreaves(tm.values, m.tasmax.values, m.tasmin.values, LAT, years)
    sp = spei(m.pr.values - pet, years).reshape(len(years), 12)
    dm = (sp <= -1).sum(1).astype(float)
    dm[0] = np.nan
    return pd.Series(dm, index=years)


def tw_years(t, rh):
    tw = pd.Series(stull(t.values, rh.values), index=t.index).dropna()
    g = tw.groupby(tw.index.year)
    jja = tw[tw.index.month.isin([6, 7, 8])]
    return pd.DataFrame({'tw': g.apply(lambda s: int((s >= TW_DAY).sum())),
                         'tw_jja': jja.groupby(jja.index.year).mean()})


def tw_monthly(w):
    """Mean daily wet-bulb temperature for each calendar month (12 values) from a frame with tas and hurs."""
    tw = pd.Series(stull(w.tas.values, w.hurs.values), index=w.index).dropna()
    return tw.groupby(tw.index.month).mean().reindex(range(1, 13)).values


def tw_delta(obs_tw, delta):
    """The observed daily wet-bulb series shifted by a model's change for each calendar month: days a year at
    TW_DAY or more, and the June-August mean. NEX-GDDP's own humidity is far too high over Hà Nội in summer
    (about 92% against ERA5-Land's 84%), so only its change is used (the delta method)."""
    shifted = obs_tw + delta[obs_tw.index.month - 1]
    g = (shifted >= TW_DAY).groupby(shifted.index.year).sum()
    jja = shifted[shifted.index.month.isin([6, 7, 8])]
    return float(g.mean()), float(jja.groupby(jja.index.year).mean().mean())


def oni_by_year(path):
    t = pd.read_csv(path, sep=r'\s+')
    y = t.groupby('YR').ANOM.mean()
    djf = t[t.SEAS == 'DJF'].set_index('YR').ANOM
    return y, djf


def rnd(x, k=1):
    return None if x is None or not np.isfinite(x) else round(float(x), k)


def nex_series(model):
    p = os.path.join(NEX, f'{model}.csv.gz')
    if not os.path.exists(p):
        return None
    df = pd.read_csv(p)
    out = {}
    for exp, g in df.groupby('exp'):
        w = g.pivot_table(index='date', columns='var', values='city')
        # 360-day calendars: keep the dates that exist, drop the rest (30 February)
        idx = pd.to_datetime(w.index, errors='coerce')
        w = w[~idx.isna()]
        w.index = idx[~idx.isna()]
        out[exp] = w
    return out


def main():
    hn = json.load(open(HN_JSON, encoding='utf-8'))
    obs = wide(pd.read_csv(os.path.join(SERIES, 'OBS.csv.gz')))
    rec, cal, _, _ = observed_record(obs, ERA)
    era = wide(pd.read_csv(ERA))

    # ---- which reanalysis carries observed rain after 2014: CHIRPS or ERA5, by a held-out check
    check = {}
    pr_after = None
    if os.path.exists(CHIRPS):
        ch = pd.read_csv(CHIRPS)
        ch = pd.DataFrame({'pr': ch.pr.values}, index=pd.to_datetime(ch.date))
        cands = {'chirps': ch, 'era5': era[['pr']]}
        for k, src in cands.items():
            held = calibrate(src, obs, (1981, FIT_YEARS[1]), cols=('pr',), carry_drift=False)
            o = span(obs, *CHECK_YEARS)
            c = span(held, *CHECK_YEARS)
            oy, cy = o.pr.groupby(o.index.year).sum(), c.pr.groupby(c.index.year).sum()
            om = o.pr.resample('MS').sum(); cm = c.pr.resample('MS').sum()
            o50 = (o.pr >= 50).groupby(o.index.year).sum(); c50 = (c.pr >= 50).groupby(c.index.year).sum()
            check[k] = {'pr_obs': rnd(oy.mean(), 0), 'pr_mapped': rnd(cy.mean(), 0),
                        'r_monthly': rnd(np.corrcoef(om, cm)[0, 1], 2), 'r_daily': rnd(np.corrcoef(o.pr, c.pr.reindex(o.index).fillna(0))[0, 1], 2),
                        'r50_obs': rnd(o50.mean(), 2), 'r50_mapped': rnd(c50.mean(), 2)}
        # this file's observed products are monthly (seasons, SPEI), so the better monthly match carries rain after 2014;
        # build_hanoi.py makes its own choice for the daily counts (r50, r100), where the daily match matters
        best = max(check, key=lambda k: check[k]['r_monthly'] or 0)
        check['chosen'] = best
        full = calibrate(cands[best], obs, (1981, 2014), cols=('pr',), carry_drift=False)
        pr_after = span(full, 2015, REC[1]).pr
        print('rain check (held out 2005-2014):', json.dumps(check))

    # ---- observed record: OBS to 2014, then calibrated reanalysis temperatures and the chosen rain
    r = rec[['pr', 'tasmax', 'tasmin']].copy()
    if pr_after is not None:
        r.loc[pr_after.index, 'pr'] = pr_after.values
    ry = yearly_water(r)
    dr = drought_years(r)
    oni_y, oni_djf = oni_by_year(ONI)
    td = era[['tas', 'td']].dropna()
    otw = tw_years(td.tas, rh_from_td(td.tas, td.td))
    obs_tw = span(pd.Series(stull(td.tas.values, rh_from_td(td.tas, td.td).values), index=td.index).dropna(), *BASE)
    years = list(range(REC[0], REC[1] + 1))
    ob = span(r, *BASE)
    out = {
        'meta': {
            'what': 'Hà Nội rain by season, dry spells, drought (SPEI-6) and humid heat (wet-bulb)',
            'baseline': list(BASE), 'dry_months': list(DRY_MONTHS), 'tw_day': TW_DAY,
            'spei': {'scale': 6, 'threshold': -1, 'fit': [1985, 2014], 'pet': 'Hargreaves (FAO-56 eq. 52) from daily max/min',
                     'distribution': 'generalized logistic, L-moments, per calendar month'},
            'rain_check': check,
            'sources': {
                'chirps': 'CHIRPS v2.0 (Funk et al. 2015, Sci Data 2:150066), via the IRI Data Library; quantile-mapped to OBS',
                'oni': 'NOAA Climate Prediction Center, Oceanic Niño Index (ERSSTv5)',
                'nex': 'NASA NEX-GDDP-CMIP6 (Thrasher et al. 2022, Sci Data 9:262; CC BY 4.0), daily tas and hurs, city mean',
                'wetbulb': 'Stull (2011), J. Appl. Meteor. Climatol. 50:2267, from daily mean temperature and humidity',
                'era5land': 'ERA5-Land daily mean temperature and dewpoint (raw) for the observed wet-bulb'},
            'built': time.strftime('%Y-%m-%d')},
        'obs': {
            'years': years,
            'rain_after_2014': check.get('chosen', 'era5'),
            **{k: [rnd(ry[k].get(y)) for y in years] for k in ('dry', 'wet', 'rx5', 'cdd')},
            'drought': [rnd(dr.get(y), 0) for y in years],
            'oni': [rnd(oni_y.get(y), 2) for y in years],
            'oni_djf': [rnd(oni_djf.get(y), 2) for y in years],
            'tw': [rnd(otw.tw.get(y), 0) for y in years],
            'tw_jja': [rnd(otw.tw_jja.get(y), 2) for y in years],
            'months': {'1995-2014': months(ob), '2015-2025': months(span(r, 2015, 2025))}},
        'models': {}}

    for name, M in hn['models'].items():
        path = os.path.join(SERIES, f'{name}.csv.gz')
        if not os.path.exists(path):
            continue
        df = pd.read_csv(path)
        S = {exp: wide(g) for exp, g in df.groupby('exp')}
        has_t = M.get('temperature')
        h = S['hist']
        nx = nex_series(name)
        rec_m = {'levels': {}}
        bw = span(h, *BASE)
        base = {**yearly_water(bw).mean().to_dict()}
        dh = {}
        if has_t:
            for exp in S:
                if exp == 'hist':
                    continue
                bad = M['qc'].get(exp, {}).get('bad', []) if M.get('qc') else []
                if any(v in bad for v in ('pr', 'tasmax', 'tasmin')):
                    continue
                dh[exp] = drought_years(pd.concat([h, S[exp]]).sort_index())
            if dh:
                base['drought'] = float(np.mean([d.loc[BASE[0]:BASE[1]].mean() for d in dh.values()]))
        tw0 = None
        if nx is not None and 'historical' in nx:
            tw0 = tw_monthly(span(nx['historical'], *BASE))
            base['tw'], base['tw_jja'] = tw_delta(obs_tw, np.zeros(12))   # every model starts from the observed record
        rec_m['base'] = {**{k: rnd(v) for k, v in base.items()}, 'months': months(bw)}
        for lv, L in M['levels'].items():
            vals, mons = [], []
            for wd in L['windows']:
                exp, a, b, bad = wd['exp'], wd['start'], wd['end'], wd.get('set_aside', [])
                w = window(S, exp, a, b)
                if w is None:
                    continue
                v = {}
                if 'pr' not in bad:
                    v.update(yearly_water(w).mean().to_dict())
                    mons.append(months(w))
                if exp in dh:
                    v['drought'] = float(dh[exp].loc[a:b].mean())
                if nx is not None and exp in ('ssp245', 'ssp585'):
                    parts = [x for x in (nx.get('historical'), nx.get(exp)) if x is not None]
                    nw = span(pd.concat(parts).sort_index(), a, b)
                    if tw0 is not None and len(set(nw.index.year)) == b - a + 1 and {'tas', 'hurs'} <= set(nw.columns):
                        v['tw'], v['tw_jja'] = tw_delta(obs_tw, tw_monthly(nw) - tw0)
                vals.append(pd.Series(v))
            if vals:
                m = pd.concat(vals, axis=1).mean(axis=1)
                rec_m['levels'][lv] = {**{k: rnd(x) for k, x in m.items()},
                                       'months': [rnd(x) for x in np.mean(mons, axis=0)] if mons else None}
        out['models'][name] = rec_m
        print(f'{name:16s} base {rec_m["base"]}  levels {list(rec_m["levels"])}')
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
    print(f'wrote {OUT}: {os.path.getsize(OUT) / 1e3:.0f} kB')


if __name__ == '__main__':
    main()
