"""Save WMO OSCAR/Surface metadata for Vietnam's registered surface stations.

Why: NOAA files WMO 48820 under Nội Bài airport's coordinates, but OSCAR (WMO's own registry) places
48820 "HA NOI" at Láng, 21.033 N 105.800 E, established 1890. The Hà Nội report takes station names and
positions from OSCAR, not from NOAA.

Writes data/hanoi/stations_oscar.json: every OSCAR station in Viet Nam (id, WIGOS id, name, position,
elevation, status, programmes, date established), with the Hà Nội-area ones flagged.

Usage
  python pipeline/fetch_oscar_stations.py
"""
import json
import math
import os
import time

import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'hanoi', 'stations_oscar.json')
API = 'https://oscar.wmo.int/surface/rest/api/search/station'
LANG = (21.0333, 105.8)
NEAR_KM = 60
KEEP = ('name', 'wigosId', 'latitude', 'longitude', 'elevation', 'declaredStatus', 'assessedStatus',
        'dateEstablished', 'stationTypeName', 'stationProgramsDeclaredStatuses')


def km(a, b):
    dy = (a[0] - b[0]) * 111.32
    dx = (a[1] - b[1]) * 111.32 * math.cos(math.radians((a[0] + b[0]) / 2))
    return math.hypot(dx, dy)


def main():
    r = requests.get(API, params={'territoryName': 'VNM'}, timeout=120)
    r.raise_for_status()
    rows = []
    for s in r.json()['stationSearchResults']:
        d = {k: s.get(k) for k in KEEP}
        d['wmo'] = (d['wigosId'] or '').rsplit('-', 1)[-1]
        d['km_from_lang'] = round(km(LANG, (s['latitude'], s['longitude'])), 1)
        d['hanoi_area'] = d['km_from_lang'] <= NEAR_KM
        rows.append(d)
    rows.sort(key=lambda d: d['km_from_lang'])
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump({'source': 'WMO OSCAR/Surface, ' + API + '?territoryName=VNM',
                   'retrieved': time.strftime('%Y-%m-%d'), 'count': len(rows), 'stations': rows},
                  f, indent=1, ensure_ascii=False)
    print(f'{len(rows)} stations -> {OUT}')
    for d in rows:
        if d['hanoi_area']:
            print(f"  {d['wmo']}  {d['name']:<14} {d['latitude']:.3f} {d['longitude']:.3f}  "
                  f"{d['km_from_lang']:5.1f} km  est. {str(d['dateEstablished'])[:4]}")


if __name__ == '__main__':
    main()
