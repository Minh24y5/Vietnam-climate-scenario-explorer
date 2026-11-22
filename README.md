# Vietnam Climate Scenario Explorer

A bilingual (Vietnamese/English) data-journalism site about how Vietnam's climate is projected to change, written for university students, lecturers and researchers. It is a static site in plain HTML, CSS and JavaScript with D3 v7: no backend and no build step.

The site has two articles:

- `index.html`, Vietnam. Five CMIP6 models put Vietnam +1.8 °C warmer by 2071–2100 under SSP2-4.5 and +3.1 °C under SSP5-8.5, against 1985–2014. The two paths stay within half a degree until about 2054, the north warms faster than the south, and the extra heat changes the water cycle: heavier downpours, wetter Octobers and Novembers, and more drought months in the north. A chapter near the end covers what heat and water already cost people, from hospital admissions and lost working hours to the 2023 blackouts and Typhoon Yagi.
- `hanoi.html`, Hà Nội at +1.5, +2 and +3 °C. City-wide hot days, hot nights, humid heat, heavy rain and drought at each level of global warming, from CMIP6-VN models corrected to Vietnamese stations. The observed years 2015–2025 already sit close to the models' +1.5 °C world, so the report argues for planning around +2 °C.

Each article tells its story in three acts (what the models say, the turn, and what follows) and ends in an explorer where readers can pick variables, scenarios, models and regions. Hà Nội explorer views can be linked directly, for example `hanoi.html?ind=drought&mode=anom`.

## Running it locally

The pages load their data with `fetch`, so open them through a web server, not from disk:

```bash
python -m http.server 8765
```

Then go to `http://localhost:8765/index.html` or `http://localhost:8765/hanoi.html`. The data files the pages need are already in `data/`.

## Data

| Source | Used for |
|---|---|
| CMIP6 on NOAA's public archive on Google Cloud: CESM2, GFDL-ESM4, MPI-ESM1-2-LR, MIROC6, IPSL-CM6A-LR, weighted by land area over Vietnam's 63 provinces (before the 2025 mergers) and 7 climate zones | National temperature, rain, seasons and the SPEI drought index |
| CMIP6-VN (Tran-Anh et al. 2023, CC0): MIROC6, MPI-ESM1-2-HR, MRI-ESM2-0, IPSL-CM6A-LR, UKESM1-0-LL at 0.1°, plus the gridded observations for 1980–2014 | Hà Nội indicators |
| ERA5-Land and ERA5 via the Open-Meteo archive (CC BY 4.0), calibrated to the gridded observations | Hà Nội's observed record for 2015–2025 |
| NASA NEX-GDDP-CMIP6 (Thrasher et al. 2022, CC BY 4.0) | Change in humid heat (wet-bulb temperature) in Hà Nội |
| CHIRPS v2.0 (Funk et al. 2015) | Tested as the observed rain source after 2014; ERA5 matched station rain better, so it was not adopted |
| NOAA CPC Oceanic Niño Index | El Niño years in Hà Nội's drought record |
| Each model's global warming level (IPCC AR6 method, checked against Hauser et al. and the AR6 Atlas); HadCRUT5 for the observed level | Hà Nội's warming-level windows |

Every number in the narration is computed from these files in both languages. Figures from outside sources (IPCC AR6, the World Bank, the Lancet Countdown 2023 Vietnam data sheet, Forster et al. 2026, UNEP, government and news reports on the 2023 heat, Typhoon Yagi and the 2025 Hà Nội floods) are written into the text and named in each chart's source line.

The output files are:

- `data/vietnam_cmip6.json`, `data/vietnam_regions.json`, `data/vietnam_zones.json`: national and zone series, and the zone map
- `data/vietnam_water.json`: monthly rain and drought by zone
- `data/hanoi/hanoi.json`, `data/hanoi/water.json`, `data/hanoi/warming_levels.json`: the Hà Nội report
- `data/hanoi/stations_oscar.json`: weather station positions from the WMO OSCAR registry

## Rebuilding the data

The scripts in `pipeline/` rebuild everything in `data/`. They need Python 3 with numpy, pandas, xarray, netCDF4, geopandas, shapely, topojson, gcsfs and zarr, and the Natural Earth admin-1 and Vietnam boundary files unzipped into a folder (passed as `--ne`). Raw downloads go to folders outside the repository: the defaults are under `D:/`, and each script's `--root` option changes them.

| Script | What it does |
|---|---|
| `build_data.py` | National and zone CMIP6 series, and the zone map |
| `build_water.py` | Monthly rain and SPEI-6 drought by zone |
| `fetch_cmip6vn.py` | Downloads CMIP6-VN (`--hanoi-set` gets the five models the report uses) |
| `fetch_era5land.py` | Downloads ERA5-Land and ERA5 for Hà Nội |
| `fetch_nexgddp.py` | Downloads NEX-GDDP-CMIP6 for Hà Nội; resumes where it stopped |
| `fetch_chirps.py` | Downloads CHIRPS rain for Hà Nội and the El Niño index; resumes where it stopped |
| `warming_levels.py` | When each model reaches +1.5, +2 and +3 °C, and the observed level for 2006–2025 |
| `build_hanoi.py` | Hà Nội indicators, heat calendar, reanalysis calibration and checks; writes `hanoi.json` |
| `build_hanoi_water.py` | Hà Nội rain by month, drought, humid heat and El Niño years; writes `hanoi/water.json` |
| `fetch_oscar_stations.py` | Vietnamese station metadata from WMO OSCAR |

A typical full rebuild, in order:

```bash
python pipeline/build_data.py --ne D:/ne_cache
python pipeline/build_water.py --ne D:/ne_cache
python pipeline/fetch_cmip6vn.py --hanoi-set --ne D:/ne_cache
python pipeline/fetch_era5land.py
python pipeline/warming_levels.py
python pipeline/fetch_nexgddp.py --ne D:/ne_cache
python pipeline/fetch_chirps.py --ne D:/ne_cache
python pipeline/build_hanoi.py
python pipeline/build_hanoi_water.py
```

The downloads are large and some servers are slow: the five CMIP6-VN models come to about 19 GB, and NASA's NEX-GDDP service takes a couple of hours for the Hà Nội set.

## Project layout

```
index.html, hanoi.html   the two articles
about.html               this README, rendered on the site (README.vi.md in Vietnamese)
styles/                  main.css imports the shared sheets; hanoi.css adds the report; readme.css styles about.html
scripts/                 shared helpers, the national page's charts and narration
scripts/hanoi/           the Hà Nội report
data/                    the JSON the pages load
pipeline/                scripts that build data/
docs/                    notes, including the Hà Nội data audit
DESIGN.md, PRODUCT.md    the design system, and the site's readers and principles
PROJECT_SUMMARY.md       a fuller account of the story, data, methods and open issues
```

## Limitations

- Five models is a small ensemble, and the national drought index uses four (CESM2 has no historical daily highs and lows in the archive).
- From 2015, Hà Nội's observed record is calibrated reanalysis, not station data.
- Projected humidity comes from a different bias correction (NEX-GDDP) than the rest of the Hà Nội report, and only its change is used.
- Effects on health, work and crops come from published studies; they are not computed for each warming level.
- There is no comparison yet with the Ministry of Agriculture and Environment's 2025 climate scenarios.
