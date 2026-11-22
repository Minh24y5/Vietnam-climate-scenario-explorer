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

Observed record to 2025 ('record', 'calibration', 'humid'): the gridded observations end in 2014.
ERA5-Land (temperature, 0.1 deg) and ERA5 (rain, 0.25 deg) from pipeline/fetch_era5land.py carry it
on, but never raw: each daily variable is quantile-mapped to OBS's city mean per calendar month over
1980-2014 (empirical, by rank; past the calibration range the end correction is carried on, added
for temperature, as a ratio for rain). The record is OBS for 1980-2014 and calibrated reanalysis for
2015-2025. 'calibration' says how well that works out of sample: mapped on 1980-2004 only, then
checked against OBS for 2005-2014. 'humid' is observed only (raw ERA5-Land heat index; CMIP6-VN has
no humidity).

Matched-warming-level test ('test'): 2006-2025, the last 20 observed years, were a world about
+1.1 degC above 1850-1900 (data/hanoi/warming_levels.json 'observed_level', from HadCRUT5). For each
model the indicators over its own 20 years at that level (averaged over its scenarios, as for the
other levels) are set against the observed 2006-2025, as values and as change from 1995-2014.

Usage
  python pipeline/build_hanoi.py [--series D:/cmip6vn/hanoi/series] [--era5land D:/era5land/hanoi/ERA5L.csv.gz]
                                 [--gwl data/hanoi/warming_levels.json] [--out data/hanoi/hanoi.json]
Rerun after more models finish downloading; it uses whatever series exist. Without the ERA5-Land
series the record, calibration and test are left out.
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
REC_YEARS = (1980, 2025)
CAL_YEARS = (1980, 2014)        # calibration of the reanalysis to OBS
FIT_YEARS = (1980, 2004)        # held-out check: map on these years ...
CHECK_YEARS = (2005, 2014)      # ... and compare with OBS on these
TEST_YEARS = (2006, 2025)       # observed window for the matched-warming-level test
HI_LEVELS = (41, 46)            # heat index, degC: NOAA 'danger' from 103 degF (39.4); 41 = 106 degF, 46 = 115 degF


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


# ---------------------------------------------------------------- observed record to 2025
def qmap(x_fit, y_fit, x, kind):
    """Empirical quantile mapping: each x gets the y_fit quantile at x's rank in x_fit. Past the ends
    of x_fit the end correction is carried on (added for temperature 't', as a ratio for rain)."""
    xs, ys = np.sort(x_fit), np.sort(y_fit)
    n = xs.size
    p = (np.searchsorted(xs, x, 'left') + np.searchsorted(xs, x, 'right')) / 2 / n
    out = np.quantile(ys, np.clip(p, 0.5 / n, 1 - 0.5 / n))
    hi, lo = x > xs[-1], x < xs[0]
    if kind == 't':
        out[hi] = ys[-1] + (x[hi] - xs[-1])
        out[lo] = ys[0] + (x[lo] - xs[0])
    else:
        if xs[-1] > 0:
            out[hi] = ys[-1] * x[hi] / xs[-1]
        out = np.clip(out, 0, None)
    return out


def span(df, a, b):
    return df[(df.index.year >= a) & (df.index.year <= b)]


def drift(era, obs, years, cols=('tasmax', 'tasmin', 'tas')):
    """Linear trend (degC a year) of the yearly mean OBS-minus-reanalysis difference over `years`.
    OBS warms faster than ERA5-Land over Hà Nội (stations see the city grow; ERA5-Land has no urban
    growth), so a mapping fitted on past years undercounts hot days later."""
    out = {}
    for c in cols:
        d = span((obs[c] - era[c]).dropna(), *years)
        y = d.groupby(d.index.year).mean()
        out[c] = float(np.polyfit(y.index.values, y.values, 1)[0])
    return out


def calibrate(era, obs, years, cols=('tasmax', 'tasmin', 'tas', 'pr'), carry_drift=True):
    """Reanalysis daily city means mapped to OBS per calendar month, fitted on `years`. With
    carry_drift, temperatures first get the fit years' drift (see drift()) carried on in a straight
    line: each year is shifted by rate x (year - last fit year), then mapped."""
    era = era.copy()
    if carry_drift:
        for c, k in drift(era, obs, years).items():
            era[c] = era[c] + k * (era.index.year - years[1])
    out = era.copy()
    ef, of = span(era, *years), span(obs, *years)
    for c in cols:
        for m in range(1, 13):
            e = ef[c][ef.index.month == m].dropna().values
            o = of[c][of.index.month == m].dropna().values
            sel = era.index.month == m
            out.loc[sel, c] = qmap(e, o, era.loc[sel, c].values, 'r' if c == 'pr' else 't')
    return out


def scores(obs_y, raw_y, cal_y, keys):
    """Each yearly indicator averaged over the same years: OBS, raw reanalysis, calibrated; and the
    correlation of the calibrated yearly values with OBS."""
    out = {}
    for k in keys:
        r = np.corrcoef(obs_y[k], cal_y[k])[0, 1] if obs_y[k].std() > 0 and cal_y[k].std() > 0 else np.nan
        out[k] = {'obs': round(float(obs_y[k].mean()), 2), 'raw': round(float(raw_y[k].mean()), 2),
                  'calibrated': round(float(cal_y[k].mean()), 2), 'r_yearly': None if np.isnan(r) else round(float(r), 2)}
    return out


def daily_r(obs, cal, years):
    out = {}
    for c in ('tasmax', 'tasmin', 'pr'):
        d = span(pd.concat([obs[c], cal[c]], axis=1, keys=['o', 'c']).dropna(), *years)
        out[c] = round(float(np.corrcoef(d.o, d.c)[0, 1]), 3)
    return out


def rain_source(obs, cal, chirps_path):
    """CHIRPS against ERA5 for rain after 2014: both quantile-mapped to OBS on the fit years and checked on the
    held-out years. CHIRPS is chosen when its daily and yearly correlations with OBS both beat ERA5's.
    Returns (CHIRPS frame mapped on all of CAL_YEARS or None, report)."""
    if not chirps_path or not os.path.exists(chirps_path):
        return None, {'source': 'era5', 'note': 'no CHIRPS series'}
    c = pd.read_csv(chirps_path)
    ch = pd.DataFrame({'pr': c.pr.values}, index=pd.to_datetime(c.date))
    held = calibrate(ch, obs, (1981, FIT_YEARS[1]), cols=('pr',), carry_drift=False)
    chk = lambda d: yearly(span(d, *CHECK_YEARS))
    sc = scores(chk(obs[['pr']]), chk(ch), chk(held), RAIN)
    d = span(pd.concat([obs.pr, held.pr], axis=1, keys=['o', 'c']).dropna(), *CHECK_YEARS)
    r_daily = round(float(np.corrcoef(d.o, d.c)[0, 1]), 3)
    e_daily, e_year = cal['held_out']['daily_r']['pr'], cal['held_out']['check']['pr']['r_yearly']
    win = r_daily > e_daily and (sc['pr']['r_yearly'] or 0) >= (e_year or 0)
    rep = {'source': 'chirps' if win else 'era5',
           'chirps_held_out': {'check': sc, 'daily_r': r_daily},
           'era5_held_out': {'daily_r': e_daily, 'r_yearly': e_year},
           'note': 'CHIRPS v2.0 and ERA5 each quantile-mapped to OBS per calendar month on 1981-2004, checked on 2005-2014'}
    full = calibrate(ch, obs, (1981, CAL_YEARS[1]), cols=('pr',), carry_drift=False) if win else None
    return full, rep


def observed_record(obs, era_path, chirps_path=None):
    """OBS 1980-2014 continued by calibrated reanalysis to 2025; the held-out check; humid heat.
    Returns (daily record, calibration report, humid heat, calibrated-only indicators over TEST_YEARS)."""
    if not era_path or not os.path.exists(era_path):
        print(f'no ERA5-Land series at {era_path}: the observed record stops in {OBS_YEARS[1]}')
        return None, None, None, None
    era = wide(pd.read_csv(era_path))
    keys = list(TEMP) + list(RAIN)
    held = calibrate(era, obs, FIT_YEARS)
    held_plain = calibrate(era, obs, FIT_YEARS, carry_drift=False)
    full = calibrate(era, obs, CAL_YEARS)
    plain = calibrate(era, obs, CAL_YEARS, carry_drift=False)
    chk = lambda d: yearly(span(d, *CHECK_YEARS))
    cal = {
        'method': 'empirical quantile mapping, per calendar month, of daily city means (tasmax, tasmin, tas, pr) '
                  'onto the gridded observations\' city means; temperatures first carry on the fit years\' linear drift '
                  'between the two (OBS warming faster than ERA5-Land)',
        'fit_years': list(CAL_YEARS),
        'drift_per_decade': {c: round(k * 10, 3) for c, k in drift(era, obs, CAL_YEARS).items()},
        'held_out': {'fit_years': list(FIT_YEARS), 'check_years': list(CHECK_YEARS),
                     'drift_per_decade': {c: round(k * 10, 3) for c, k in drift(era, obs, FIT_YEARS).items()},
                     'check': scores(chk(obs), chk(era), chk(held), keys),
                     'check_without_drift': scores(chk(obs), chk(era), chk(held_plain), keys),
                     'daily_r': daily_r(obs, held, CHECK_YEARS)},
        'in_sample': scores(*(yearly(span(d, *CAL_YEARS)) for d in (obs, era, full)), keys),
    }
    ch_full, rain = rain_source(obs, cal, chirps_path)
    cal['rain'] = rain
    if ch_full is not None:
        # rain after 2014 from CHIRPS (it beat ERA5 on the held-out years); temperatures stay ERA5-Land
        after = span(ch_full, OBS_YEARS[1] + 1, REC_YEARS[1]).pr
        for d in (full, plain):
            d.loc[after.index.intersection(d.index), 'pr'] = after.reindex(d.index.intersection(after.index)).values
    cols = ['tas', 'tasmax', 'tasmin', 'pr']
    rec = pd.concat([span(obs, *OBS_YEARS)[cols], span(full, OBS_YEARS[1] + 1, REC_YEARS[1])[cols]]).sort_index()
    rec_plain = pd.concat([span(obs, *OBS_YEARS)[cols], span(plain, OBS_YEARS[1] + 1, REC_YEARS[1])[cols]]).sort_index()
    py = yearly(rec_plain)
    cal['without_drift'] = {'note': 'the same record with the plain mapping (no drift carried on): a low end, since it '
                                    'undercounted hot days in the held-out check',
                            **{f'{a0}-{b0}': rnd(py.loc[a0:b0].mean().to_dict()) for a0, b0 in ((OBS_YEARS[1] + 1, REC_YEARS[1]), TEST_YEARS)}}
    hi = span(era, *REC_YEARS).hi.dropna()
    g = hi.groupby(hi.index.year)
    summer = hi[hi.index.month.isin([6, 7, 8])]
    humid = {'years': [int(y) for y in g.groups],
             **{f'hi{t}': [int((s >= t).sum()) for _, s in g] for t in HI_LEVELS},
             'hi_jja': [round(float(v), 1) for v in summer.groupby(summer.index.year).mean()],
             'thresholds': list(HI_LEVELS)}
    return rec, cal, humid, yearly(span(full, *TEST_YEARS)).mean()


def main():
    p = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    p.add_argument('--series', default='D:/cmip6vn/hanoi/series')
    p.add_argument('--era5land', default='D:/era5land/hanoi/ERA5L.csv.gz', help='daily reanalysis city series (pipeline/fetch_era5land.py)')
    p.add_argument('--chirps', default='D:/chirps/hanoi_chirps.csv.gz', help='CHIRPS daily rain (pipeline/fetch_chirps.py); used after 2014 if it beats ERA5')
    p.add_argument('--gwl', default=GWL, help='warming levels JSON (default data/hanoi/warming_levels.json)')
    p.add_argument('--out', default=OUT, help='output JSON (default data/hanoi/hanoi.json)')
    a = p.parse_args()

    gwl = json.load(open(a.gwl, encoding='utf-8'))
    obs = wide(pd.read_csv(os.path.join(a.series, 'OBS.csv.gz')))
    oy = yearly(obs).loc[OBS_YEARS[0]:OBS_YEARS[1]]
    ob = obs[(obs.index.year >= BASE[0]) & (obs.index.year <= BASE[1])]
    rec_d, cal, humid, era_only = observed_record(obs, a.era5land, a.chirps)
    ry = yearly(rec_d) if rec_d is not None else None
    test_lv = str(gwl['observed_level']['level']) if gwl.get('observed_level') else None

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
        for lv in LEVELS + ((test_lv,) if test_lv else ()):
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
            if vals and lv == test_lv:      # the matched-warming-level test, not a page level
                rec['test'] = {'windows': used, **rnd(pd.concat(vals, axis=1).mean(axis=1).to_dict())}
            elif vals:
                m = pd.concat(vals, axis=1).mean(axis=1).to_dict()
                rec['levels'][lv] = {'windows': used, **rnd(m)}
                if cals:
                    cal_sum[lv].append(np.mean(cals, axis=0))
        out_models[name] = rec
        tw = sorted({f"{w['start']}-{w['end']}" for w in rec.get('test', {}).get('windows', [])})
        print(f"{name:18s} {'T+R' if has_t else 'R  '}  levels: {', '.join(rec['levels'])}  test: {', '.join(tw) or '-'}")

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
    if ry is not None:
        out['meta']['sources']['reanalysis'] = (
            'ERA5-Land 2 m temperature and dewpoint (Muñoz-Sabater et al. 2021, ESSD 13:4349) and ERA5 precipitation '
            '(Hersbach et al. 2020, QJRMS 146:1999), Copernicus Climate Change Service, via the Open-Meteo archive API '
            '(CC BY 4.0); pipeline/fetch_era5land.py')
        out['meta']['record_years'] = list(REC_YEARS)
        if cal['rain']['source'] == 'chirps':
            out['meta']['sources']['chirps'] = 'CHIRPS v2.0 (Funk et al. 2015, Sci Data 2:150066), daily, via the IRI Data Library; rain after 2014'
        out['record'] = {
            'years': [int(y) for y in ry.index], 'gridded_to': OBS_YEARS[1],
            'source': 'gridded observations 1980-2014, then ERA5-Land (temperature) and ' + ('CHIRPS' if cal['rain']['source'] == 'chirps' else 'ERA5') + ' (rain) quantile-mapped to them',
            **{k: [round(float(v), 2) for v in ry[k]] for k in ry.columns},
            'trend': rnd({'tas': trend(ry.tas), 'tx35': trend(ry.tx35)}, 3),
            'periods': {f'{a0}-{b0}': rnd(ry.loc[a0:b0].mean().to_dict())
                        for a0, b0 in ((1980, 1994), BASE, (OBS_YEARS[1] + 1, REC_YEARS[1]), TEST_YEARS)},
            'record_tx': round(float(rec_d.tasmax.max()), 1), 'record_tx_date': rec_d.tasmax.idxmax().strftime('%Y-%m-%d')}
        out['calibration'] = cal
        # the recent years as their own calendar row (calibrated reanalysis, drift carried on)
        recent = calendar(span(rec_d, OBS_YEARS[1] + 1, REC_YEARS[1]))
        out['calendar']['recent'] = [round(float(x), 3) for x in recent]
        out['calendar']['recent_years'] = [OBS_YEARS[1] + 1, REC_YEARS[1]]
        out['humid'] = {**humid, 'observed_only': True,
                        'source': 'ERA5-Land hourly 2 m temperature and dewpoint, not calibrated (the gridded observations '
                                  'and CMIP6-VN have no humidity); NOAA heat index, daily maximum per cell, city mean',
                        'trend': {f'hi{t}': round(trend(pd.Series(humid[f'hi{t}'], index=humid['years'])), 2) for t in HI_LEVELS}}
        t_obs = ry.loc[TEST_YEARS[0]:TEST_YEARS[1]]
        if test_lv and len(t_obs) == TEST_YEARS[1] - TEST_YEARS[0] + 1:
            t_mean, b_obs = t_obs.mean(), yearly(ob).mean()
            out['test'] = {
                'level': gwl['observed_level']['level'], 'key': test_lv, 'observed_years': list(TEST_YEARS),
                'level_source': {k: v for k, v in gwl['observed_level'].items() if k != 'sources'},
                'obs': rnd(t_mean.to_dict()), 'obs_change': rnd((t_mean - b_obs).to_dict()),
                'obs_calibrated_only': rnd(era_only.to_dict()),
                'reanalysis_years': int((t_obs.index > OBS_YEARS[1]).sum()),
                'models': {m: r.pop('test') for m, r in out_models.items() if r.get('test')}}
    for r in out_models.values():
        r.pop('test', None)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'), allow_nan=False)   # browsers reject NaN
    nt = sum(m['temperature'] for m in out_models.values())
    print(f'wrote {a.out}: {len(out_models)} models ({nt} with temperature), {os.path.getsize(a.out) / 1e3:.0f} kB')


if __name__ == '__main__':
    main()
