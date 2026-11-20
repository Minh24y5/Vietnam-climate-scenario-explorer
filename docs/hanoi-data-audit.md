# Hà Nội special report: data audit

First pass, 19 Nov 2026. This audit covers step 1 of the Phase 3 plan: what data exists, whether we can get it, and what it can and cannot support. Anything marked **probed** was downloaded or queried during this pass. Anything marked **desk** comes from documentation or web sources only and still needs checking by hand.

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
| Python env (miniforge base) | xarray 2026.9, zarr 3.4, gcsfs, geopandas, cftime. **Missing:** h5py/h5netcdf, s3fs, cdsapi, earthaccess, xclim, rioxarray |

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

**What to ask for.** Daily Tx, Tn, Tmean, RH (or Td) and rain for Láng 1961–2025 (ideally 1931 on), plus Hà Đông, Sơn Tây, Ba Vì and Nội Bài if they will give them. The source is the **National Centre for Hydro-Meteorological Forecasting / Vietnam Meteorological and Hydrological Administration** (data service under the Ministry of Agriculture and Environment). Usually this needs a formal letter and may involve a fee. The other route is through the IMHEN or VNU Hanoi researchers who built CMIP6-VN and VnGP, since they already hold these station series.

**Fallbacks if the request stalls:** SACA&D (not checked), Ogimet SYNOP decodes for 48820 (no response during the probe), or published Láng statistics from papers and the national climate reports.

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
| **CMIP6-VN** (Tran-Anh, Ngo-Duc, Espagne, Trinh-Tuan 2023, *Sci Data*, doi:10.1038/s41597-023-02159-2) | 0.1°, 35 GCMs, BCSD against Vietnamese stations; tas/tasmax/tasmin/pr daily 1980–2099 | Read the paper's data-availability statement. Probably the strongest candidate for the main projection |
| **Kịch bản BĐKH cập nhật 2025** (MAE/IMHEN, published 9 Oct 2026 per press) | The official national numbers; urban content for Hà Nội; commune detail; R50mm, heat duration, return periods | Get the report PDF; ask IMHEN whether the data is open |
| **CDS** "Climate extreme indices and heat stress indicators derived from CMIP6" (doi:10.24381/cds.776e08bd) | Ready ETCCDI indices and bias-adjusted heat stress for 4 SSPs | Free CDS account. Indoor/shade heat stress only (no wind/radiation) |
| Kịch bản BĐKH 2020 | Older baseline the press still quotes | IMHEN |

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

1. **NCHMF/VNMHA**: daily station data for Láng (+ Hà Đông, Sơn Tây, Ba Vì, Nội Bài) for 1961–2025.
2. **VNU Hanoi (Ngo-Duc / Trinh-Tuan group)**: CMIP6-VN data access, and VnGP permission.
3. **IMHEN**: the data behind Kịch bản BĐKH cập nhật 2025 for Hà Nội.
4. **EVN / NLDC** (optional): northern hourly load for 2019–2025.

Free accounts that would help: Copernicus CDS, NASA Earthdata, APHRODITE.

## 8. Decisions this audit raises

1. **Main projection source:** NEX-GDDP (available now, global correction) or CMIP6-VN (local correction, access unknown). Suggestion: build on NEX now, switch to or cross-check with CMIP6-VN if access comes through.
2. **What to do with CESM2:** it has no daily Tmax/Tmin anywhere we checked. Either drop it from the Hà Nội report or use it only for mean temperature and rain.
3. **Spatial units:** old districts (matching census/labour data) or new communes (matching the 2025 scenarios and today's maps).
4. **If the Láng request stalls:** run the model check against ERA5 + GHCN-Monthly, and say so on the page.

## 9. How this was checked

Probes ran on 19 Nov 2026 from the scratchpad. Nothing was added to the repo except this file.

- GHCN-D station list, inventory and CSVs for VMM00048820/48825/48826; ISD history; ISD hourly 1985–2024 from `noaa-global-hourly-pds` (NCEI's old hourly path now redirects there); GSOD 2024; GHCN-M v4 QCF.
- WMO OSCAR REST API for 48820/48821/48823/48825.
- NEX-GDDP S3 listings for all 35 model folders; NASA THREDDS NCSS point request.
- Google `cmip6-zarr-consolidated-stores.csv` queries (Amon/day; historical, SSPs, DAMIP, HighResMIP).
- ARCO-ERA5 `.zmetadata`; Open-Meteo ERA5 archive; CHIRPS directories; WorldPop REST API.
- Web sources for VnGP, APHRODITE, CMIP6-VN, CDS extremes, Kịch bản 2025, 2025 boundaries, Decision 18/2021, health studies, EVN 2023, WB CCDR, waterlogging, Hà Nội SUHI.
