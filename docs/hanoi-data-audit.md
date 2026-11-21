# Hà Nội special report: data audit

First pass, 19 Nov 2026. This audit covers step 1 of the Phase 3 plan: what data exists, whether we can get it, and what it can and cannot support. Anything marked **probed** was downloaded or queried during this pass. Anything marked **desk** comes from documentation or web sources only and still needs checking by hand.

## Sources chosen for the report

You picked these sources after the first pass. Each line says what has been done with it so far.

| Source | Role | State |
|---|---|---|
| [WMO OSCAR](https://oscar.wmo.int/surface/rest/api/search/station?wigosId=0-20000-0-48820) | Station identity and positions (48820 = Láng) | **Installed**: `pipeline/fetch_oscar_stations.py` → `data/hanoi/stations_oscar.json` (43 Vietnamese stations; Hà Nội area: 48820 Hà Nội, 48825 Hà Đông) |
| [CMIP6-VN](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10164165/) ([data](https://doi.org/10.6084/m9.figshare.c.6164352.v1)) | Main projection source, plus the gridded station observations it was corrected to | **Five models** (19 Nov 2026): `pipeline/fetch_cmip6vn.py --hanoi-set` → `D:/cmip6vn` (see §3.4) |
| [ERA5-Land](https://doi.org/10.5194/essd-13-4349-2021) and ERA5 via [Open-Meteo](https://open-meteo.com/en/docs/historical-weather-api) | Observed record 2015–2025, calibrated to the gridded observations; humid heat (observed only) | **Built** (20 Nov 2026): `pipeline/fetch_era5land.py` → `D:/era5land`, calibrated in `build_hanoi.py` (see §3.7) |
| [VnGP on DIAS](https://search.diasjp.net/en/dataset/VnGP_010) | Gauge-based daily rain, 1980–2010 | **Cannot be downloaded yet.** Needs the provider's permission (contact on the DIAS page, VNU Hanoi). Non-commercial only |
| [Kịch bản BĐKH 2025 (VnEconomy)](https://vneconomy.vn/lan-dau-ung-dung-ai-du-bao-rui-ro-va-nguy-co-ngap-lut-trong-kich-ban-bien-doi-khi-hau-2025.htm) | The official numbers to set ours against | Press report only; the report itself and its data still need finding |
| [Phung et al., heatwaves and hospitalisation](https://agris.fao.org/search/en/records/65df142b0f3e94b9e5d4c317) | Heat → health chain | Reference (multi-province; heat risk higher in the North) |
| [World Bank CCDR overview](https://www.ifc.org/content/dam/ifc/doc/mgrt/ccdr-overview-english.pdf) | Economy-wide costs | Reference |
| [Hà Nội urban heat island study](https://publications.hse.ru/articles/795585792) | Where the city runs hottest | Reference (Landsat 9, summer 2024: up to 7.2 °C between green and dense built-up areas) |

From the first pass's link list, these were not picked: APHRODITE, the CDS extreme indices, Decision 18/2021 (its thresholds are still quoted in §6), Tran et al. 2022, the EVN press reports, the waterlogging lists and the 2025 boundary sources. The probed archives (NEX-GDDP, ERA5 via Open-Meteo, NOAA, Google CMIP6) were not on that list either way. The sections below still describe all of them.

## The short version

1. **NOAA has no clean Láng record.** WMO's registry (OSCAR) lists 48820 as "HA NOI" at 21.03 N 105.80 E, in operation since 1890: that is Láng. NOAA files 48820 at Nội Bài airport's coordinates (21.22 N, ICAO VVNB) and mixes the two stations' reports together. Since 2013 the NOAA record holds airport METARs only. There is no reported daily max or min and no rain. NOAA's daily max temperature stops in 2016, its daily min in 2012 and its rain in 2016, all with large gaps. The daily means run to 2025 but are not homogeneous (see §2.1). **Daily Tx, Tn and rain for Láng have to come from Vietnam's weather service.** This is the main blocker for the "already lived through" and "can we trust the models" sections.
2. **NASA NEX-GDDP-CMIP6 can be used today.** 35 model folders (34 distinct models), SSP1-2.6 to SSP5-8.5, daily data at 0.25°. NASA's THREDDS server returns a CSV for a single point, so we never need to download the ~245 MB global files. Láng falls inside the cell centred at 21.125 N 105.875 E. Daily max and min temperature are missing for **CESM2**, CESM2-WACCM and IITM-ESM. Humidity is missing for BCC-CSM2-MR and NESM3.
3. **Global warming levels are feasible.** Google's CMIP6 archive holds global monthly `tas` for every NEX run's historical period, and for nearly all of their futures. GISS-E2-1-G (r1i1p1f2) has no futures there, and ACCESS-ESM1-5 lacks SSP2-4.5 and SSP3-7.0.
4. **Vietnam's own updated scenarios are out.** The Ministry of Agriculture and Environment published *Kịch bản BĐKH cập nhật 2025* on 9 Oct 2026, according to press reports. Press coverage says it includes urban content for Hà Nội and TP.HCM, commune-level detail, R50mm extreme rain, prolonged heat and return periods. The report has to set its numbers against these. Downloadable data has not been found yet.
5. **There is a peer-reviewed Vietnam dataset at 0.1°.** CMIP6-VN (Tran-Anh et al. 2023, *Scientific Data*) has 35 models, bias-corrected against 147 Vietnamese temperature stations and 481 rain gauges, with daily tas, tasmax, tasmin and pr. That is closer to the ground than NEX, which is corrected to the global GMFD reanalysis. How to get the data is still unconfirmed.
6. **The health evidence for Hà Nội heat is thin.** The Hà Nội-specific studies found mostly *cold* effects on admissions. Heat effects show up in multi-province northern studies (Phung et al.) and in HCMC. The "heat → health" chain has to say this plainly.
7. **New events to add:** storms No. 10 and 11 (Sept–Oct 2025), with 500–600 mm of rain and about 200–220 waterlogged points in Hà Nội, alongside 2008, 2023 (power shortage) and 2024 (Yagi).

## 1. What the project already has

| Item | State |
|---|---|
| `data/vietnam_cmip6.json`, `vietnam_regions.json`, `vietnam_zones.json` | National and 7-zone annual means, 5 models, historical + SSP2-4.5/5-8.5, **monthly source, annual output** |
| `pipeline/build_data.py` + `pipeline/.cache/*.npz` | Pulls `Amon` from Google's CMIP6 zarr catalogue. Caches annual series only |
| `D:/ne_cache` | Natural Earth admin-0/admin-1, **pre-2025 boundaries** |
| Python env (miniforge base) | xarray 2026.9, zarr 3.4, gcsfs, geopandas, cftime, requests; **netCDF4 1.7.5 and h5netcdf added** for CMIP6-VN. (A stale pip copy of cftime clashed with conda's and was removed.) **cdsapi 0.7.7 added** (20 Nov 2026; unused so far, since no CDS account). **Still missing:** s3fs, earthaccess, xclim, rioxarray, scipy |
| `D:/cmip6vn` (new, outside the repo) | CMIP6-VN raw tarballs, Hà Nội cut-outs, daily series, `manifest.json`, `fetch.log` |
| `data/hanoi/stations_oscar.json` (new) | WMO OSCAR metadata for 43 Vietnamese stations |

Nothing in the project is daily, observed, or below zone level. The Hà Nội report needs a new pipeline (`pipeline/hanoi/`), separate from `build_data.py`.

## 2. Observations

### 2.1 Station record: probed

| Source | Station | What it holds | Verdict |
|---|---|---|---|
| WMO OSCAR | 48820 "HA NOI" 21.033 N 105.800 E, est. 1890, GBON | Metadata only | Confirms 48820 = Láng |
| NOAA GHCN-Daily `VMM00048820` | Labelled "NOIBAI INTL" | TAVG 1958–2025 (complete from 1975); TMAX 1958–2016, TMIN 1958–2012, PRCP 1978–2016, all gappy (TMIN averages ~60–135 days/yr after 1990) | Not usable for extremes |
| NOAA ISD hourly `488200-99999` | Same | 1985–2000: mix of SYNOP (FM-12) and METAR (FM-15), with SYNOP max/min (KA1) and rain (AA1). 2005–2012: METAR + merged synop (SY-MT). **2013 on: METAR only**, no max/min, no rain | Only useful as a Nội Bài humidity/hourly record |
| NOAA GSOD | Same | 2024: MAX/MIN flagged `*` (derived from hourly), PRCP missing | Not a Láng record |
| GHCN-Monthly v4 | `VMXLT492315` HANOI 21.03 N 105.85 E | Monthly mean, 45 complete years 1886–2012 | Long context, not daily |
| GHCN-Daily `VMM00048825` Hà Đông | 20.97 N 105.77 E | 2012 on only, gappy | Short |
| GHCN-Daily `VMM00048826` Phù Liễn | Hải Phòng, 116 m | TMAX/PRCP fairly complete 1995–2014 | Regional neighbour for checks |

**Inhomogeneity check.** I took annual mean TAVG for "48820" minus Phù Liễn. The difference is about +0.5 °C in the 1990s, drops to about +0.1–0.3 °C in 2000–2005, then returns to +0.6–0.9 °C. That points to a break, most likely the switch between Láng and Nội Bài reports. Any trend computed from NOAA's 48820 would be wrong.

**Decision (19 Nov 2026): no station request.** The report doesn't need Láng's own record; city-wide data for Hà Nội is enough. The observed baseline is CMIP6-VN's gridded observations (1980–2014, Hà Nội city mean). A gridded or reanalysis source such as ERA5 will carry it past 2014.

What follows from that:
- Observed numbers on the page are **Hà Nội-wide averages, not station readings**. Gridding smooths extremes: the Láng cell's hottest day in 1980–2014 is 39.9 °C, below the station's records. Counts of 35/37/39 °C days will be lower than the weather service's station counts, and the page has to say so.
- The model check can test the trend, the year-to-year swings and the extremes against the gridded observations for 1980–2014, and against ERA5 for 2015–2025. ERA5 isn't the series CMIP6-VN was corrected to, which makes it the independent check. **Done 20 Nov 2026** with ERA5-Land calibrated to the gridded observations, and a test at matched global warming (§3.7).

### 2.2 Gridded and reanalysis

| Source | Use in report | Access | Status |
|---|---|---|---|
| **ERA5** hourly 0.25° | Humid heat (Td/RH), hourly heat, night temps | Open-Meteo archive API (ERA5): no key, point series, CC BY 4.0, non-commercial. Or the CDS `reanalysis-era5-single-levels-timeseries` (free account) | **Probed**: Open-Meteo returned 2024-06-01 hourly T and Td for Láng. Google's ARCO-ERA5 zarr is chunked one hour per chunk across the globe, so it is impractical for a single point |
| **CHIRPS** 0.05° | Rain climatology, dry spells | `data.chc.ucsb.edu`. The v2.0 daily path now returns 404; **v3.0** is live (prelim updated 2026) | **Probed**. Weak for daily extremes; use it for monthly totals and dry spells only |
| **APHRODITE** V1901 0.25° | Gauge-based daily rain to 2015 | Manual registration (Hirosaki / Chikyu) | **Desk** |
| **VnGP** 0.1°/0.25° | 481-gauge daily rain 1980–2010 | DIAS. Download "currently unavailable" and needs the provider's permission (VNU contact). Non-commercial | **Desk**. Request it |
| **GPM IMERG** V07 | Sub-daily downpours 2000 on | NASA Earthdata login (free) | Not probed |

### 2.3 Event records

| Event | What we need | Where |
|---|---|---|
| Nov 2008 flood | Rain totals, inundation, deaths, losses | VDDMA loss database, published papers |
| May–Jun 2023 heat and power shortage | Láng Tx, EVN load, outage hours | Press confirms the North peaked at ~20,000 MW in early May and 23.57 GW in late July; Hà Nội peaked at 4,546 MW on 18 May. A northern shortfall was forecast at 1,600–4,900 MW, later revised to ~8,000 MW. **Official NLDC/EVN series not yet found** |
| Sept 2024 Yagi | Rain, Red River stage, damage | VDDMA, Hà Nội city reports |
| **Sept–Oct 2025 storms 10–11 (new)** | 500–600 mm, ~200% of drainage design, ~200–220 waterlogged points | Sở Xây dựng Hà Nội, Hà Nội drainage company, press |

## 3. Projections

### 3.1 NEX-GDDP-CMIP6: probed

- Bucket `s3://nex-gddp-cmip6` (us-west-2, public). Each variable-year file is ~245 MB global. Several files have `_v2.0` replacements, so **always prefer v2.0**.
- **Point extraction works:** `ds.nccs.nasa.gov/thredds/ncss/grid/AMES/NEX/GDDP-CMIP6/...?var=tasmax&latitude=21.03&longitude=105.85&accept=csv` returned daily values for grid point 21.125 N 105.875 E. About 34 models × 4 SSPs × 5 variables × ~150 yearly files, all as small CSV requests. Run it in batches, with a cache.
- Variables: tas, tasmax, tasmin, pr, hurs, huss, rsds, rlds, sfcWind.

| Gap | Models |
|---|---|
| No tasmax/tasmin | **CESM2** (r4i1p1f1), CESM2-WACCM, IITM-ESM |
| No hurs | BCC-CSM2-MR, NESM3 |
| No SSP3-7.0 | CESM2-WACCM, GFDL-CM4, HadGEM3-GC31-LL/MM, KIOST-ESM, NESM3 |
| Duplicate | GFDL-CM4_gr2 (same model, regridded: drop it) |

All 5 of the site's current models are in NEX, with the same runs (CESM2 r4i1p1f1, others r1i1p1f1).

**Caveat for the "trust" section.** NEX is bias-corrected to GMFD, a 0.25° reanalysis-based product, not to Vietnamese stations. Its "observed" climate of the Láng cell will not match Láng itself, and the city's heat island makes this worse. The model check has to compare the NEX historical period with the Láng record and with CMIP6-VN.

### 3.2 Google CMIP6 archive: probed (catalogue of 523,774 stores)

- **Global monthly tas for warming levels:** present for all 34 NEX model-runs' historical periods. Futures are missing only for **GISS-E2-1-G r1i1p1f2** (all SSPs) and **ACCESS-ESM1-5 r1i1p1f1** (SSP2-4.5, SSP3-7.0). Fixes: use another run of the same model as a proxy, use ESGF, or use the IPCC AR6 Atlas warming-level crossing tables (published per model-run on GitHub: to check).
- **Extra runs** for spread (Amon tas, SSP5-8.5): MIROC6 50, MPI-ESM1-2-LR 10, IPSL 6, CESM2 3, GFDL-ESM4 1.
- **Natural-only (hist-nat)** for attribution: 15 models, incl. CESM2 3, GFDL-ESM4 3, IPSL 10, MIROC6 50. **MPI-ESM1-2-LR has none.**
- **Daily data for our 5 models:** CESM2 has **no daily historical tasmax** on Google, the same gap as in NEX. MIROC6 has no daily hurs.
- **HighResMIP:** mostly atmosphere-only `highresSST-present` and pr-only futures. Coupled `hist-1950` only for CNRM, ECMWF-IFS, GFDL-CM4C192 and HadGEM3. Daily tasmax futures are rare. **Not worth the effort for this report** beyond one sidebar on resolution.

### 3.3 Other projection products: desk

| Product | Why | Access |
|---|---|---|
| **CMIP6-VN** (Tran-Anh, Ngo-Duc, Espagne, Trinh-Tuan 2023, *Sci Data*, doi:10.1038/s41597-023-02159-2) | 0.1°, 35 GCMs, BCSD against Vietnamese stations; tas/tasmax/tasmin/pr daily 1980–2099 | **Chosen and installing**: see "CMIP6-VN in detail" below |
| **Kịch bản BĐKH cập nhật 2025** (MAE/IMHEN, published 9 Oct 2026 per press) | The official national numbers; urban content for Hà Nội; commune detail; R50mm, heat duration, return periods | Get the report PDF; ask IMHEN whether the data is open |
| **CDS** "Climate extreme indices and heat stress indicators derived from CMIP6" (doi:10.24381/cds.776e08bd) | Ready ETCCDI indices and bias-adjusted heat stress for 4 SSPs | Free CDS account. Indoor/shade heat stress only (no wind/radiation) |
| Kịch bản BĐKH 2020 | Older baseline the press still quotes | IMHEN |

### 3.4 CMIP6-VN in detail: probed

- **Where:** figshare collection [10.6084/m9.figshare.c.6164352.v1](https://doi.org/10.6084/m9.figshare.c.6164352.v1). 36 items: one `.tar.gz` per model (0.04–4.7 GB) and `OBS.Vietnam.1980-2014.nc` (0.49 GB). 82.4 GB in all. **Licence CC0.**
- **Files:** `bcsd_<var>_<model>_<hist|sspNNN>_<y0>-<y1>_daily.nc`, NetCDF4-classic, int16 packed with zlib, chunked one day per chunk. Grid: 161 × 121 cells covering 8–24 N, 100–112 E at 0.1°, with cell centres on whole tenths. Láng falls in the cell centred on 21.0 N 105.8 E.
- **Units:** every variable says `var_unit`. The values show pr is mm/day and the temperatures are °C. The script still converts any file whose mean looks like kelvin, and records the mean it read.
- **Coverage varies by model.** Some models have rain only (CAMS-CSM1-0 holds only historical pr). The per-model, per-SSP availability is in the paper's Table 1 and in `D:/cmip6vn/manifest.json` once everything is extracted.
- **Six run labels in Table 1 don't exist in CMIP6.** The files themselves carry no run label (only CDO history), so Table 1 is the only record. Against Google's archive these six are wrong:

  | Model | Table 1 | Used instead | Why |
  |---|---|---|---|
  | CESM2 | r1i1p1f1 | r4i1p1f1 | r1 has no scenario runs; r4 is the first that has them all (also NEX and the national page) |
  | CESM2-WACCM | r4i1p1f1 | r1i1p1f1 | no r4 historical run exists |
  | CanESM5 | r1i1p1f2 | r1i1p1f1 | CanESM5 has no f2 runs |
  | CNRM-CM6-1-HR | r1i1p1f1 | r1i1p1f2 | CNRM models only have f2 runs |
  | MIROC6 | r1i1p1f2 | r1i1p1f1 | MIROC6 has no f2 runs |
  | MIROC-ES2L | r1i1p1f1 | r1i1p1f2 | MIROC-ES2L only has f2 runs |

  The CESM2/CESM2-WACCM and MIROC6/MIROC-ES2L pairs look like swapped neighbouring rows. These are assumptions until the authors confirm them. The choice matters only for warming levels, since CMIP6-VN's own files are what they are.
- **The models differ from the site's.** CMIP6-VN has MPI-ESM1-2-HR, not the site's MPI-ESM1-2-LR. CESM2, CESM2-WACCM and 8 others are **rain only**, and FIO-ESM-2-0 has temperature for the historical period only. That leaves **24 models with temperature projections** (`cmip6vn_data` per scenario in `warming_levels.json`). Of the national page's five models, four have temperature in CMIP6-VN: GFDL-ESM4, MIROC6, IPSL-CM6A-LR and MPI-ESM1-2-HR (as a stand-in for -LR).
- **Table 1's availability matrix is reliable.** For the two models extracted so far (CAMS-CSM1-0: historical rain only; TaiESM1: rain for historical, SSP3-7.0 and SSP5-8.5), the files match the table exactly. The Hà Nội report's ensemble will not match the national page's five models one to one. Say so on the page.
- **Observations included.** The OBS file is the gridded station product the models were corrected to: pr, tas, tasmax, tasmin, daily, 1980–2014. For the Láng cell it gives a 1980–2014 mean of 23.8 °C, mean daily max 27.6 °C, mean daily min 21.4 °C, and 1,510 mm of rain a year. The hottest day in the cell is 39.9 °C. Gridding smooths extremes, so this **does not replace the Láng station record** for record highs or the 35/37/39 °C day counts. It is still the right baseline for checking CMIP6-VN itself.
- **Known limits (from the paper):** quantile mapping can stretch the tails, and the daily disaggregation can hold back changes in the daily distribution. Both matter for counts of extreme days.

**Five models, not 35 (decision 19 Nov 2026).** Figshare serves each connection at under 1 MB/s, so all 82 GB would take hours. The page uses five models, as many as the national page. They are not the national page's models; they are chosen from CMIP6-VN to run from slow- to fast-warming:
- MIROC6
- MPI-ESM1-2-HR
- MRI-ESM2-0
- IPSL-CM6A-LR
- UKESM1-0-LL

All five have temperature and rain, about 20 GB in total. `--hanoi-set` fetches exactly these, and `--segments` splits each file into parallel byte ranges. Partial downloads of other models from earlier tries were deleted on 20 Nov 2026. Three small complete archives from the first test (CAMS-CSM1-0, FIO-ESM-2-0, TaiESM1, 0.6 GB) remain in `D:/cmip6vn/raw`.

**Pipeline:** `pipeline/fetch_cmip6vn.py` downloads with resume and MD5 checks into `D:/cmip6vn/raw`. It cuts each file to a Hà Nội box (20.5–21.5 N, 105.2–106.1 E) in `D:/cmip6vn/hanoi/box/<model>/`, and writes a daily table per model to `D:/cmip6vn/hanoi/series/<model>.csv.gz`. The table holds the city mean, weighted by land area inside Hà Nội's Natural Earth outline, and the Láng cell.

### 3.4b Broken CMIP6-VN files: found 20 Nov 2026

**CMIP6-VN has file-level faults.** They were found once the five models were extracted. The check compares each scenario's first 30 years (2015–2044) with the model's own historical run, using two measures:
- **Day-to-day spread:** the standard deviation of daily differences, as a ratio to the historical run.
- **Mean position:** where the daily mean sits between the daily maximum and minimum.

| Model | Scenarios | What's wrong | Set aside |
|---|---|---|---|
| MPI-ESM1-2-HR | SSP1-2.6 | tas, tasmax, tasmin spread 1.7–2.4× the historical run; city-mean daily means up to 47 °C | all variables |
| MPI-ESM1-2-HR | SSP2-4.5, SSP5-8.5 | tasmax spread 1.5×, tas and tasmin 1.2–1.3×; daily highs of 50–53 °C | all variables |
| UKESM1-0-LL | SSP1-2.6, 2-4.5, 3-7.0, 5-8.5 | daily mean shifted 0.45 °C towards the daily max, spread 1.3×; city-mean daily means of 37–42 °C on thousands of days | tas only (tasmax/tasmin pass) |

MIROC6, MRI-ESM2-0 and IPSL-CM6A-LR pass in every scenario, staying within ±5% on spread and 0.03 °C on mean position. MPI-ESM1-2-HR's SSP3-7.0 also passes. Table 1 marks that scenario '-', but the archive has it, so warming levels now include it and it is MPI's only scenario used for temperature.

**Rule** (`quality()` in `pipeline/build_hanoi.py`):
- A temperature variable is set aside if its spread ratio falls outside 0.85–1.15.
- tas is also set aside if the mean shifts by more than 0.25 °C.
- Rain is set aside only when all three temperature variables fail, since rain's variability legitimately changes with warming.

Results are stored per model (`qc`) and per window (`set_aside`) in `data/hanoi/hanoi.json`, and the page lists them under "what this page doesn't know yet". These faults are worth reporting to the dataset's authors.

**Bias that remains:** for 1995–2014 the five models give 22–29 days a year with a 35 °C high (median 23), against 20 observed. That fits the authors' warning that quantile mapping stretches the tails, and the page says so in the hot-days chapter.

**Checks of the extracted data** (1995–2014 city means against the gridded observations): tas within 0.3 °C, tasmax within 0.4 °C, rain within ±8% for all five models.

### 3.5 Global warming levels: built

- `pipeline/warming_levels.py` writes `data/hanoi/warming_levels.json`. For each CMIP6-VN model asked for (the page's five; all 35 without `--models`) and every scenario it holds, it gives the 20-year window when the model's global mean temperature passes +1.0, +1.5, +2, +3 and +4 °C above 1850–1900.
- Method: the IPCC AR6 one, as published by Hauser et al. (doi:10.5281/zenodo.3591806). Global tas comes from Google's CMIP6 archive. The window for central year n is [n−10, n+9], and `fits_cmip6vn` says whether it lies inside 1980–2099.
- Gaps on Google (ACCESS-ESM1-5 r1 SSP2-4.5/3-7.0, GISS-E2-1-G r1i1p1f2 futures) are filled from Hauser's table and marked `source: hauser`. SSP4-3.4 and SSP4-6.0 are computed only, since Hauser has neither.
- Checks (`checks` in the JSON), five models (with MPI SSP3-7.0): all 83 windows Hauser also lists match it exactly; 52 of 53 IPCC Atlas windows match exactly and 1 is a year off.

### 3.6 The Hà Nội page: built

- `pipeline/build_hanoi.py` turns the CMIP6-VN Hà Nội series and the warming levels into `data/hanoi/hanoi.json` (city-wide indicators per model and level, observed series, heat calendar). `hanoi.html` draws it. Rerun the build whenever more models finish downloading; the page says how many of the 35 it is using.
- Thresholds used: 35/37/39 °C highs, 28 °C lows, 50/100 mm rain days. For the city-wide gridded observations in 1995–2014 these give about 20, 4 and 0.25 days, 7 nights, and 3.4 and 0.3 days a year.

### 3.7 Observed record to 2025 and the out-of-sample test: built 20 Nov 2026

**Why.** The gridded observations stop in 2014, and the trust chapter said that in-sample agreement after bias correction proves nothing. This step carries the observed record on to 2025 and tests the models against the years since.

**Source.** No Copernicus CDS account was available, so the data comes from the [Open-Meteo archive API](https://open-meteo.com/en/docs/historical-weather-api). It serves the same Copernicus reanalyses as point series, needs no key, and is CC BY 4.0 for non-commercial use. `pipeline/fetch_era5land.py` downloads the data to `D:/era5land` (outside the repo) and writes the daily city series `D:/era5land/hanoi/ERA5L.csv.gz`.
- **Temperature and dewpoint:** ERA5-Land, 0.1°, on the same cell centres as CMIP6-VN.
- **Rain:** ERA5 at 0.25°. Open-Meteo returns only nulls for ERA5-Land precipitation, so this is the 0.25° fallback.
- **Raw grid values:** `elevation=nan` and `cell_selection=nearest` switch off Open-Meteo's height adjustment of temperature.
- **With a CDS account:** the CDS dataset `reanalysis-era5-land-timeseries` has the same ERA5-Land data, including precipitation.

**Not all 47 cells.** Open-Meteo counts a 46-year hourly series as about 1,200 of its 10,000 free daily calls, so the script takes representative cells instead.
- **Temperature:** the city's 47 cells are grouped into 0.3° blocks, and the centre cell of each of the five largest blocks stands for its block. They cover 85% of the city's area, weighted by area. Tested on the gridded observations, this five-cell mean tracks the 47-cell city mean at r = 0.9999 for daily Tmax and Tmin, offset by +0.1 °C.
- **Rain:** the three ERA5 cells with the most city area (56%). On the gridded observations, the matching three-box mean tracks the city mean at r = 0.994.
- **Calibration absorbs the offset:** the mapping below goes onto OBS's own 47-cell city mean, which removes offsets this small.
- **Cost:** eight requests, 88 MB, a few minutes. One cell's request hit the per-minute limit; the script waited and retried.

**Day boundary.** Daily values use local time (UTC+7). The script tried every closing hour and kept the one whose daily rain best matches OBS over 1980–2014. That was **19:00 local**, which is the 19h–19h climatological day of Vietnamese stations. Rank correlation with OBS: rain 0.76, Tmax 0.95, Tmin 0.97.

**Calibration (`build_hanoi.py`, `observed_record`).** Raw reanalysis is never spliced onto OBS.
- **Method:** daily city-mean Tmax, Tmin, Tmean and rain are quantile-mapped onto OBS per calendar month over 1980–2014. The mapping is empirical, by rank. Past the calibration range, the correction at the end carries on: added for temperature, as a ratio for rain.
- **The record:** OBS for 1980–2014, then calibrated reanalysis for 2015–2025 (`record` in `hanoi.json`).
- **Raw ERA5-Land is far too mild in the hot tail:** over 2005–2014 it gives 12 days of 35 °C a year, against 25 in OBS. Without calibration, the counts would jump at 2015 for reasons that have nothing to do with climate.

**Drift: the main caveat.** OBS warms faster than ERA5-Land over Hà Nội: 0.14 °C per decade faster for Tmax and 0.16 for Tmin over 1980–2014, steadily. Stations see the city grow; ERA5-Land has no urban growth, and OBS may have its own network changes. A mapping fitted on earlier years therefore undercounts heat later.
- **Held-out check:** fit on 1980–2004, compare with OBS on 2005–2014 (`calibration.held_out` in `hanoi.json`):

  | 2005–2014, per year | OBS | Raw | Plain mapping | Mapping + drift (used) |
  |---|---|---|---|---|
  | Mean temperature | 23.82 °C | 23.36 | 23.56 | 23.74 |
  | Days ≥ 35 °C | 25.3 | 11.8 | 18.1 | 21.4 |
  | Days ≥ 37 °C | 5.4 | 1.2 | 2.3 | 3.8 |
  | Nights ≥ 28 °C | 8.7 | 1.9 | 5.8 | 7.9 |
  | Rain | 1,571 mm | 1,741 | 1,515 | 1,515 |
  | Days ≥ 50 mm | 3.6 | 4.2 | 3.2 | 3.2 |

  - Daily correlation with OBS: Tmax 0.98, Tmin 0.98, rain 0.60.
  - Year-to-year correlation: 0.83 for hot days, 0.86 for hot nights, but only 0.4 for annual rain and about zero for 100 mm days and the wettest day.
  - Fitting on a more recent window (1990–2004 or 1995–2004) did not help hot days.
- **What the record uses:** the drift-carrying version. Before mapping, temperatures get the fit years' linear drift carried on in a straight line: each year is shifted by rate × (year − last fit year). It halves the held-out error but still undercounts (21.4 against 25.3).
- **Assumption:** this assumes the drift went on after 2014 as it did before. The held-out check covers 1–10 years past the fit, as 2015–2025 is 1–11 years past 2014.
- **Lower bound:** the plain mapping's values are kept in `calibration.without_drift`. Hot days in 2015–2025 come out at 31.4 a year with the plain mapping and 37.6 with the drift carried on.
- **The page:** it shows the drift-carrying value and gives the plain one as the low end of a range in the trust chapter.

**Record, 1980–2025** (city means):
- **Hot days:** 17.3 a year in 1980–1994, 19.9 in 1995–2014, 37.6 in 2015–2025 (31.4 with the plain mapping).
- **Hot nights:** 7.3 a year in 1995–2014, 26.6 in 2015–2025 (18.8 plain).
- **Trends:** +5.6 hot days and +0.31 °C per decade.
- **Hottest year:** 2020, with 62 hot days. Seven of the ten hottest years are after 2014.
- **Rain:** less trustworthy than temperature. The yearly totals after 2014 are reanalysis rain with a monthly distribution correction, not gauge totals.

**Humid heat (`humid`, observed only).** NOAA heat index from hourly ERA5-Land temperature and dewpoint: Rothfusz regression with NOAA's adjustments, and relative humidity from the Magnus formula. It is the daily maximum per cell, then the city mean.
- **Not calibrated:** OBS and CMIP6-VN have no humidity, so it cannot be calibrated or projected.
- **Days with a heat index of 41 °C or more:** 49 a year in 1995–2014, 73 in 2015–2025 (trend +6.6 per decade).
- **Days of 46 °C or more:** 2.7 a year in 1995–2014, 10.3 in 2015–2025.
- **Likely low, and only for trend and comparison:** ERA5-Land's raw daily highs run 0.8 °C below OBS in May–July and 1.25 °C below on OBS's 35 °C days, and the drift above applies too. The levels are therefore probably low and are best read as a trend and a comparison, not as absolute counts.

**Matched-warming-level test (`test`).**
- **The observed level:** `pipeline/warming_levels.py` now adds it: global warming over 2006–2025 against 1850–1900 from HadCRUT5 v5.1.0.0. That is **+1.12 °C**, rounded to 0.01. Berkeley Earth gives +1.18 °C for 2006–2024 as a check.
- **Windows:** each model's 20-year window at +1.12 °C is computed like the other levels, and the existing windows and checks are unchanged. Mean windows across scenarios:

  | Model | Window at +1.12 °C |
  |---|---|
  | IPSL-CM6A-LR | 1998–2017 |
  | UKESM1-0-LL | 2007–2026 |
  | MPI-ESM1-2-HR | 2007–2026 |
  | MRI-ESM2-0 | 2009–2028 |
  | MIROC6 | 2020–2039 |

- **Why not calendar years:** comparing the same calendar years would penalise IPSL and UKESM twice.
- **Values, not changes:** the models had warmed 0.59–1.08 °C by 1995–2014 (observed: 0.87). So a change from each model's own 1995–2014 is not matched: IPSL's +1.12 °C window barely differs from its own baseline. Bias correction pinned every model to the same observed 1980–2014 climate, so absolute values at the same warming level compare like with like.
- **Results** (observed 2006–2025: plain mapping to drift-carrying):

  | Per year | Observed 2006–2025 | Models at +1.12 °C (median, range) |
  |---|---|---|
  | Days ≥ 35 °C | 28.5–31.9 | 28.4 (25.5–43.1) |
  | Days ≥ 37 °C | 7.7–8.9 | 5.7 (5.4–10.9) |
  | Nights ≥ 28 °C | 14.4–18.6 | 13.4 (10.0–24.9) |
  | Rain | 1,654 mm | 1,596 mm (1,438–1,693) |

- **Reading:** the models do not run hot at today's warming. Three of five (IPSL, MIROC6, MPI) give fewer hot days and nights than observed; MRI-ESM2-0 and UKESM1-0-LL match or exceed. Earlier, the models' own 1995–2014 counts ran a little high (BCSD's stretched tails). The two errors pull in opposite directions; the page says both.
- **Limits:**
  - 9 of the 20 observed years (2006–2014) are in CMIP6-VN's calibration period.
  - 2015–2025 is calibrated reanalysis, with the drift caveat above.
  - Some of the observed rise may be urban growth, which the models (bias-corrected, not urban) lack.
  - One 20-year window carries natural variability, with hot years in 2019–2021.

**Reproduce from scratch:**
```
python pipeline/fetch_cmip6vn.py --hanoi-set --obs --ne D:/ne_cache
python pipeline/fetch_era5land.py
python pipeline/warming_levels.py --models MIROC6 MPI-ESM1-2-HR MRI-ESM2-0 IPSL-CM6A-LR UKESM1-0-LL
python pipeline/build_hanoi.py
```
Without `D:/era5land/hanoi/ERA5L.csv.gz`, `build_hanoi.py` writes the earlier JSON unchanged, without the `record`, `calibration`, `humid` and `test` keys.

## 4. Exposure: desk unless marked

| Need | Source | Note |
|---|---|---|
| Population grid | WorldPop (**probed**: VNM 100 m, unconstrained, 2000–2020; age structures endpoint to check), GHSL | 2020 is the last year in this WorldPop series; use GHSL for later years |
| Hottest wards | Landsat 8/9 LST (USGS, free) | Published studies already map Hà Nội SUHI: up to 7.2 °C between green and dense built-up areas (summer 2024). Night air temps in new urban areas up to 1 °C higher |
| Administrative units | **Hà Nội kept its provincial boundary** (Resolution 202/2025/QH15, 3,359.8 km²) but has 126 communes/wards since 1 Jul 2025 (Resolution 1656/NQ-UBTVQH15). Districts no longer exist | Census and labour data are by **old districts**, new maps by **new communes**. Pick one. Natural Earth's pre-2025 Hà Nội outline is still valid for the city as a whole |
| Workers, ages, incomes | GSO census 2019, Labour Force Survey | |
| Waterlogging points | Hà Nội drainage company / Sở Xây dựng lists, press during storms | Not a published dataset; would need to be compiled |
| River and pluvial flood | Aqueduct Floods, GloFAS | Not checked. Pluvial flooding in the inner city is a drainage problem these models don't resolve |

## 5. Consequence chains: desk

| Chain | Best evidence found | Gap |
|---|---|---|
| Heat → health | Tran et al. 2022 (*Front Public Health*): 2 Hà Nội hospitals, respiratory admissions, cold risk > heat risk. Phung et al.: multi-province heatwaves → +2.5% all-cause admissions, higher in the North; 7-province northern study (2021, *ESPR*), heat effect at lag 0 | **No Hà Nội heat-mortality study found.** Hà Nội shows cold effects. Heat work leans on HCMC and multi-province pools |
| Heat → outdoor work | ISO 7243 WBGT limits, published work-loss curves | Needs WBGT from ERA5/NEX hurs, with a sun-exposed adjustment |
| Heat + dry → electricity | 2023 loads (press, above). WB CCDR 2022 and the 2025 *Viet Nam 2045 – Growing Greener* update | Official hourly northern load (NLDC) not found. Cooling-demand link not modelled |
| Rain → flooding | 2008, 2024, 2025 events; drainage at <20% of planned capacity (city official, 2025) | Rain-to-flood depth link is qualitative unless we get drainage modelling |
| Economy-wide | WB CCDR 2022: climate cost 12–14.5% of GDP by 2050 without adaptation. The 10% (now) and 20% (2050) peak-month labour-productivity figures come from the **WB/ADB Climate Risk Country Profile**, not the CCDR | Cite each figure to its own report |

## 6. Thresholds: partly verified

From **Decision 18/2021/QĐ-TTg** (verbatim, Art. 5):

- *Nắng nóng*: daily max air temperature **above 35 °C** (5.21). No humidity condition.
- *Rét hại*: daily mean **below 13 °C** (5.18).
- *Mưa lớn*: above 50 mm/24 h. *Mưa to*: 50–100 mm/24 h. *Mưa rất to*: **above 100 mm/24 h** (5.17).

**Not in Decision 18:** *nắng nóng gay gắt* (≥37 °C), *đặc biệt gay gắt* (≥39 °C) and *rét đậm* (daily mean ≤15 °C). These are NCHMF forecasting conventions. Cite them from Thông tư 25/2022/TT-BTNMT or NCHMF guidance once that text is confirmed. Heat-risk levels (Art. 47) combine Tmax bands of 35–37/37–39/39–41/>41 °C with duration. That table has not been read verbatim yet.

## 7. Requests to send

These need you, because they go out under your name:

1. ~~NCHMF/VNMHA: daily station data for Láng~~ (dropped 19 Nov 2026; see §2.1).
2. **VNU Hanoi (Ngo-Duc / Trinh-Tuan group)**: VnGP permission. CMIP6-VN itself turned out to be open on figshare.
3. **IMHEN**: the data behind Kịch bản BĐKH cập nhật 2025 for Hà Nội.
4. **EVN / NLDC** (optional): northern hourly load for 2019–2025.

Free accounts that would help: Copernicus CDS, NASA Earthdata, APHRODITE.

## 8. Decisions this audit raises

1. **Main projection source:** NEX-GDDP (available now, global correction) or CMIP6-VN (local correction, access unknown). Suggestion: build on NEX now, switch to or cross-check with CMIP6-VN if access comes through.
2. **What to do with CESM2:** it has no daily Tmax/Tmin anywhere we checked. Either drop it from the Hà Nội report or use it only for mean temperature and rain.
3. **Spatial units:** old districts (matching census/labour data) or new communes (matching the 2025 scenarios and today's maps).
4. ~~If the Láng request stalls~~: settled. No station data; the gridded observations and ERA5 are the baseline.
5. **Main projection source:** settled in favour of CMIP6-VN (§3.4), with global warming levels as the axis (§3.5).

## 9. How this was checked

Probes ran on 19 Nov 2026 from the scratchpad. Nothing was added to the repo except this file.

- GHCN-D station list, inventory and CSVs for VMM00048820/48825/48826; ISD history; ISD hourly 1985–2024 from `noaa-global-hourly-pds` (NCEI's old hourly path now redirects there); GSOD 2024; GHCN-M v4 QCF.
- WMO OSCAR REST API for 48820/48821/48823/48825.
- NEX-GDDP S3 listings for all 35 model folders; NASA THREDDS NCSS point request.
- Google `cmip6-zarr-consolidated-stores.csv` queries (Amon/day; historical, SSPs, DAMIP, HighResMIP).
- ARCO-ERA5 `.zmetadata`; Open-Meteo ERA5 archive; CHIRPS directories; WorldPop REST API.
- Web sources for VnGP, APHRODITE, CMIP6-VN, CDS extremes, Kịch bản 2025, 2025 boundaries, Decision 18/2021, health studies, EVN 2023, WB CCDR, waterlogging, Hà Nội SUHI.
