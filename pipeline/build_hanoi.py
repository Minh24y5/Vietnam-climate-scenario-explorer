"""Build data/hanoi/hanoi.json, the data behind hanoi.html.

Inputs
  D:/cmip6vn/hanoi/series/<model>.csv.gz   daily Hà Nội city means from CMIP6-VN (pipeline/fetch_cmip6vn.py)
  D:/cmip6vn/hanoi/series/OBS.csv.gz       the gridded observations CMIP6-VN was corrected to
  data/hanoi/warming_levels.json           each model's +1.5/+2/+3 degC windows (pipeline/warming_levels.py)

What it computes, all for the Hà Nội city mean (land-area-weighted 0.1 deg cells inside the city):
  per year (observations 1980-2014) and per 20-year window (models):
    tas    annual mean temperature, degC
    tx35   days with a daily high of 35 degC or more (Decision 18/2021/QĐ-TTg: nắng nóng)
    tx37   ... 37 degC or more (the forecast service's "nắng nóng gay gắt")
    tx39   ... 39 degC or more ("đặc biệt gay gắt")
    tn28   nights whose low stays at 28 degC or more
    pr     annual rainfall, mm
    r50    days with 50 mm or more (Decision 18: mưa to)
    r100   days with 100 mm or more (mưa rất to)
    rx1    wettest day of the year, mm (mean of the yearly maxima)
  for every model: the same indicators for 1995-2014 (its own historical run) and for each warming
  level, averaged over every scenario window that reaches the level inside CMIP6-VN's years;
  trends over 1980-2014 (per decade) for tas and tx35, observed and modelled;
  a heat calendar: for each day of the year, the share of years with a 35 degC high, observed
  1995-2014 and pooled over the models at each level (7-day running mean, Feb 29 dropped).
City means smooth out extremes: counts are city-wide, lower than a single station's.

Quality check: quality() compares each scenario's first 30 years with the model's historical run and
sets aside variables whose day-to-day spread or mean-vs-max/min position has jumped (broken source
files, see docs/hanoi-data-audit.md). What was set aside is in each model's 'qc' and each window's
'set_aside'.

Usage
  python pipeline/build_hanoi.py [--series D:/cmip6vn/hanoi/series] [--gwl data/hanoi/warming_levels.json] [--out data/hanoi/hanoi.json]
Rerun after more models finish downloading; it uses whatever series exist.
"""
import argparse
import glob
import json
import os
import time

import numpy as np
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'hanoi', 'hanoi.json')
GWL = os.path.join(ROOT, 'data', 'hanoi', 'warming_levels.json')
BASE = (1995, 2014)
OBS_YEARS = (1980, 2014)
LEVELS = ('1.5', '2.0', '3.0')
TEMP = ('tas', 'tx35', 'tx37', 'tx39', 'tn28')
RAIN = ('pr', 'r50', 'r100', 'rx1')


def wide(df):
    w = df.pivot_table(index='date', columns='var', values='city')
    w.index = pd.to_datetime(w.index)
    return w


def yearly(w):
    """Indicators per calendar year from a wide daily frame (columns: pr, tas, tasmax, tasmin)."""
    g = w.groupby(w.index.year)
    out = pd.DataFrame(index=sorted(g.groups))
    if 'tas' in w:
        out['tas'] = g.tas.mean()
    if 'tasmax' in w:
        out['tx35'] = g.tasmax.apply(lambda s: int((s >= 35).sum()))
        out['tx37'] = g.tasmax.apply(lambda s: int((s >= 37).sum()))
        out['tx39'] = g.tasmax.apply(lambda s: int((s >= 39).sum()))
    if 'tasmin' in w:
        out['tn28'] = g.tasmin.apply(lambda s: int((s >= 28).sum()))
    if 'pr' in w:
        out['pr'] = g.pr.sum()
        out['r50'] = g.pr.apply(lambda s: int((s >= 50).sum()))
        out['r100'] = g.pr.apply(lambda s: int((s >= 100).sum()))
        out['rx1'] = g.pr.max()
    return out


def calendar(w):
    """Share of years with a 35 degC high on each day of the year (365 values, 7-day smoothed)."""
    if 'tasmax' not in w:
        return None
    s = w.tasmax[~((w.index.month == 2) & (w.index.day == 29))]
    hot = (s >= 35).astype(float)
    doy = s.index.strftime('%m-%d')
    p = hot.groupby(doy).mean().sort_index()
    p = pd.concat([p.iloc[-3:], p, p.iloc[:3]]).rolling(7, center=True).mean().iloc[3:-3]
    return p.values


def rnd(d, k=2):
    return {a: (None if v is None or (isinstance(v, float) and np.isnan(v)) else round(float(v), k)) for a, v in d.items()}


def trend(y):
    y = y.dropna()
    if len(y) < 20:
        return None
    return float(np.polyfit(y.index.values, y.values, 1)[0] * 10)


def model_series(path):
    df = pd.read_csv(path)
    return {exp: wide(g) for exp, g in df.groupby('exp')}


TEMP_VARS = ('tas', 'tasmax', 'tasmin')
QC_YEARS = (2015, 2044)     # little warming yet, so day-to-day spread should match the historical run
QC_SD = (0.85, 1.15)        # allowed ratio of day-to-day variability, scenario / historical
QC_GAP = 0.25               # allowed shift, degC, in where the daily mean sits between max and min


def quality(S):
    """Flag scenario files that are broken at the source. Some CMIP6-VN files are: MPI-ESM1-2-HR's
    SSP1-2.6, SSP2-4.5 and SSP5-8.5 temperatures swing far more from day to day than its historical
    run, and UKESM1-0-LL's daily mean drifts towards its daily maximum. Returns
    {exp: {'bad': [variables], 'sd': {var: ratio}, 'gap': shift}} for every scenario."""
    h = S['hist']
    out = {}
    if not all(v in h for v in TEMP_VARS):
        return {e: {'bad': [], 'sd': {}, 'gap': None} for e in S if e != 'hist'}
    h_gap = (h.tas - (h.tasmax + h.tasmin) / 2).mean()
    for exp, w in S.items():
        if exp == 'hist':
            continue
        w = w[(w.index.year >= QC_YEARS[0]) & (w.index.year <= QC_YEARS[1])]
        sd = {v: float(w[v].diff().std() / h[v].diff().std()) for v in TEMP_VARS}
        gap = float((w.tas - (w.tasmax + w.tasmin) / 2).mean() - h_gap)
        bad = [v for v in TEMP_VARS if not QC_SD[0] <= sd[v] <= QC_SD[1]]
        if abs(gap) > QC_GAP and 'tas' not in bad:
            bad.append('tas')
        if all(v in bad for v in TEMP_VARS):
            bad.append('pr')        # the whole file set for this scenario is suspect
        out[exp] = {'bad': bad, 'sd': {v: round(x, 2) for v, x in sd.items()}, 'gap': round(gap, 2)}
    return out


def window(series, exp, a, b):
    h, f = series.get('hist'), series.get(exp)
    parts = [x for x in (h, f) if x is not None]
    if not parts:
        return None
    w = pd.concat(parts).sort_index()
    w = w[(w.index.year >= a) & (w.index.year <= b)]
    years = set(w.index.year)
    return w if len(years) == b - a + 1 else None


def main():
    p = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    p.add_argument('--series', default='D:/cmip6vn/hanoi/series')
    p.add_argument('--gwl', default=GWL, help='warming levels JSON (default data/hanoi/warming_levels.json)')
    p.add_argument('--out', default=OUT, help='output JSON (default data/hanoi/hanoi.json)')
    a = p.parse_args()

    gwl = json.load(open(a.gwl, encoding='utf-8'))
    obs = wide(pd.read_csv(os.path.join(a.series, 'OBS.csv.gz')))
    oy = yearly(obs).loc[OBS_YEARS[0]:OBS_YEARS[1]]
    ob = obs[(obs.index.year >= BASE[0]) & (obs.index.year <= BASE[1])]

    out_models, cal_sum = {}, {lv: [] for lv in LEVELS}
    for path in sorted(glob.glob(os.path.join(a.series, '*.csv.gz'))):
        name = os.path.basename(path)[:-7]
        if name == 'OBS' or name not in gwl['models']:
            continue
        G = gwl['models'][name]
        S = model_series(path)
        if 'hist' not in S:
            continue
        has_t = 'tasmax' in S['hist']
        hy = yearly(S['hist'])
        Q = quality(S) if has_t else {}
        rec = {'temperature': has_t, 'run': G['run'], 'run_paper': G.get('run_paper'), 'run_note': G.get('run_note') if isinstance(G.get('run_note'), str) else None,
               'base': rnd(hy.loc[BASE[0]:BASE[1]].mean().to_dict()),
               'trend': rnd({'tas': trend(hy.tas) if has_t else None, 'tx35': trend(hy.tx35) if has_t else None}, 3),
               'levels': {}, 'qc': Q}
        for lv in LEVELS:
            vals, used, cals = [], [], []
            for exp, e in G['scenarios'].items():
                v = e.get(lv)
                if not v or not v.get('fits_cmip6vn') or exp not in S:
                    continue
                w = window(S, exp, v['start'], v['end'])
                if w is None:
                    continue
                bad = Q.get(exp, {}).get('bad', [])
                w = w.drop(columns=[c for c in bad if c in w])
                if w.empty or not len(w.columns):
                    continue
                vals.append(yearly(w).mean())
                used.append({'exp': exp, 'start': v['start'], 'end': v['end'], 'set_aside': bad})
                c = calendar(w)
                if c is not None:
                    cals.append(c)
            if vals:
                m = pd.concat(vals, axis=1).mean(axis=1).to_dict()
                rec['levels'][lv] = {'windows': used, **rnd(m)}
                if cals:
                    cal_sum[lv].append(np.mean(cals, axis=0))
        out_models[name] = rec
        print(f"{name:18s} {'T+R' if has_t else 'R  '}  levels: {', '.join(rec['levels'])}")

    # global windows for the "when" chart: every CMIP6-VN model, the four main scenarios
    when = {}
    for exp in ('ssp126', 'ssp245', 'ssp370', 'ssp585'):
        when[exp] = {}
        for lv in LEVELS:
            when[exp][lv] = sorted(
                [{'m': m, 'y': r['scenarios'][exp][lv]['central']} for m, r in gwl['models'].items()
                 if exp in r['scenarios'] and r['scenarios'][exp].get('source') != 'missing'
                 and r['scenarios'][exp].get(lv)], key=lambda d: d['y'])
        when[exp]['n'] = sum(1 for r in gwl['models'].values()
                             if exp in r['scenarios'] and r['scenarios'][exp].get('source') != 'missing')

    base_gw = [r['warming_by_period']['1995-2014'] for r in gwl['models'].values() if r.get('warming_by_period')]
    out = {
        'meta': {
            'what': 'Hà Nội city-mean climate indicators: gridded observations and CMIP6-VN at global warming levels',
            'sources': {
                'cmip6vn': 'Tran-Anh, Ngo-Duc, Espagne & Trinh-Tuan (2023), Sci Data 10:257, doi:10.1038/s41597-023-02159-2; data doi:10.6084/m9.figshare.c.6164352.v1 (CC0)',
                'obs': 'OBS.Vietnam.1980-2014.nc in the same collection: gridded station observations, 0.1 deg',
                'warming_levels': 'data/hanoi/warming_levels.json (pipeline/warming_levels.py), checked against Hauser et al. and the IPCC AR6 Atlas',
                'thresholds': 'Decision 18/2021/QĐ-TTg (35 degC, 50 and 100 mm); 37 and 39 degC are the forecast service\'s heat bands',
                'city': 'Natural Earth admin-1 outline of Hà Nội (unchanged by the 2025 reorganisation)'},
            'baseline': list(BASE), 'obs_years': list(OBS_YEARS), 'levels': [float(l) for l in LEVELS],
            'temp_indicators': list(TEMP), 'rain_indicators': list(RAIN),
            'baseline_global_warming': {'median': round(float(np.median(base_gw)), 2), 'min': round(min(base_gw), 2),
                                        'max': round(max(base_gw), 2), 'models': len(base_gw)},
            'models_total': len(gwl['models']),
            'cmip6vn_models': 35,
            'built': time.strftime('%Y-%m-%d')},
        'obs': {
            'years': [int(y) for y in oy.index],
            **{k: [round(float(v), 2) for v in oy[k]] for k in oy.columns},
            'base': rnd(yearly(ob).mean().to_dict()),
            'trend': rnd({'tas': trend(oy.tas), 'tx35': trend(oy.tx35)}, 3),
            'record_tx': round(float(obs.tasmax.max()), 1),
            'record_tx_date': obs.tasmax.idxmax().strftime('%Y-%m-%d')},
        'calendar': {'obs': [round(float(x), 3) for x in calendar(ob)],
                     **{lv: [round(float(x), 3) for x in np.mean(c, axis=0)] for lv, c in cal_sum.items() if c},
                     'models': {lv: len(c) for lv, c in cal_sum.items()}},
        'when': when,
        'models': out_models,
    }
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'), allow_nan=False)   # browsers reject NaN
    nt = sum(m['temperature'] for m in out_models.values())
    print(f'wrote {a.out}: {len(out_models)} models ({nt} with temperature), {os.path.getsize(a.out) / 1e3:.0f} kB')


if __name__ == '__main__':
    main()
