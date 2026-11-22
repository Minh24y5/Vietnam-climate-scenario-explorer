# Vietnam Climate Scenario Explorer:

A static, bilingual (Vietnamese/English) website that explains CMIP6 climate projections for Vietnam to university students, lecturers and researchers. It is written as data journalism and read mostly on laptops (often in dark mode, at night) and phones. It is plain HTML, CSS and JavaScript with D3 v7. There is no backend and no build step.

## How the pages tell the story

Each page follows one **And, But, Therefore** arc:

- **And** sets out what the models say, and puts the common intuition in plain words (the change sounds small, far off, and up to how much the world cuts emissions).
- **But** is the turn, taken from the data and backed by outside evidence.
- **Therefore** puts the two together into one message.

The turn lives in the headings' own words ("Nhưng những thập kỷ tới đã gần như định sẵn", "Vì vậy, hai việc cùng lúc"), not in labels above them. The chapter rail groups its links under three quiet act heads: "Điều ta biết / Nhưng / Vì vậy" ("What we know / But / Therefore").

Temperature and rain are tied together by one piece of physics, stated on both pages: air that is 1 °C warmer holds about 7% more water vapour. Heavy downpours therefore grow faster than yearly rain totals, and heat dries soil and reservoirs faster between rains. Heat and water then reach people's lives through health, work, crops, power and floods.

## The two pages

**`index.html`, the national page.** Vietnam warms **+1,8 °C** by 2071–2100 under SSP2-4.5 and **+3,1 °C** under SSP5-8.5, compared with 1985–2014. These are the medians of five models.

- **Headline:** "Việt Nam sẽ nóng thêm 1,8 đến 3,1 °C. Từ nay đến thập niên 2050, đường đi gần như đã định".
- **Opening paragraph:** the result plus one hook (the two paths stay almost the same until about 2054).
- **Pull figure:** +3,1 °C, with a note under it that this is warming in Vietnam itself, not a global warming level. By 2081–2100 the IPCC puts the whole world about 2,7 °C warmer under SSP2-4.5.

| Act | Chapters | What it says |
|---|---|---|
| And | Models, Change, Two futures | Five models agree that Vietnam warms. The two scenarios end 2071–2100 about 1,3 °C apart. |
| But | Mostly set, Regions | The two paths stay within half a degree until about 2054. The north warms faster: the Red River Delta warms +2,1 °C and +3,7 °C. The change has begun: summers people lived through in 2018–2022 were 0,8 °C hotter than 1986–2005; the 2023 heat record (44,2 °C at Tương Dương); the 2023 northern blackouts, told as heat and drought together (heat raised demand while drought drained the reservoirs: Sơn La fell below dead-storage level on 7 June and about 5.000 MW of hydropower stopped; about US$1,4 billion); Typhoon Yagi (2024). |
| But | Rain | "Nhưng hơi nóng còn đổi cả cơn mưa". Yearly rain grows a median +2,5% per °C of warming across models and scenarios, well under the 7% the air can hold: the extra water goes into the heaviest downpours. Under SSP5-8.5, October and November get +20% and +34% more rain by 2071–2100; no month gets clearly drier nationwide. |
| But | Drought | SPEI-6 drought index (rain minus the water heat evaporates). Under SSP5-8.5, the four northern zones gain 0,8 to 1,1 drought months a year around 2036–2065, in all four models with the data; Nam Bộ gets fewer (−1,0); the other two southern zones show no clear direction. |
| But | Lives | Heatwave hospital admissions (+2,5%, larger in the north), rice yields (−10% per °C of warmer nights), dengue (transmission up 11% since the 1950s, each case now infects more than three people), 16 billion potential labour hours lost to heat in 2022 (US$23 billion, 5,6% of GDP, two-thirds in farming). A 2016–2025 timeline: Mekong droughts (2016, 2020), dengue 2022, the 2023 heat and blackouts, Yagi 2024, the 2025 Hà Nội deluge. World Bank: GDP 12,5% lower by 2050 without adaptation, 6,7% with it. |
| Therefore | Two jobs | Adapt now, because the next decades warm about the same either way. Cut emissions for the second half of the century, and for cleaner air today (about 34.000 deaths from fine-particle pollution in 2020, coal a record 51,6% of energy supply). The chapter links to the Hà Nội report. |

Other parts of the page:
- the warming stripes from 1950 to 2100, which split by scenario at 2015;
- a map of seven climate zones, with the coarsest model's grid cells laid over it; the same map shows drought change by zone;
- figures beyond the line chart and the map: the rain-against-warming scatter (with the 7%/°C guide), monthly rain bars, and the events timeline;
- an explorer.

**The explorer.** The chart stays in view while you work the controls. On desktop it is pinned beside the control rail. On phones and tablets it is pinned above the controls, at about 44% of the screen. The 2071–2100 summary sits directly under the chart. The controls run in this order: variable, scenarios, models, values and baseline, display, region. The data source, JSON upload and example download are folded under "Dữ liệu nâng cao", which opens by itself whenever sample or uploaded data is in use.

**`hanoi.html`, the Hà Nội special report.** It compares the city at +1,5, +2 and +3 °C of global warming, not by year.

| City-wide indicator (a year) | Observed 1995–2014 | Observed 2015–2025 | +1,5 °C | +2 °C | +3 °C |
|---|---|---|---|---|---|
| Days at 35 °C or more | 20 | 31–38 | 44 | 58 | 98 |
| Days at 37 °C or more | 4 | 9–11 | 12,5 | 17 | 40 |
| Nights at 28 °C or more | 7 | 19–27 | 25 | 38 | 93 |
| Drought months (SPEI-6 ≤ −1), change | 2,1 | | +0,6 | +0,8 | +1,0 |
| Humid-heat days (daily-mean wet-bulb ≥ 27 °C) | 10 | 27 | about 67 | 93 | 135 |

The model columns are medians of five models (four for humid heat). The 2015–2025 ranges span two ways of calibrating the reanalysis; the 2015–2025 humid-heat figure is raw ERA5-Land.

| Act | Chapters | What it says |
|---|---|---|
| And | So far (to 2014), Warming levels, Heat, Rain | The "normal" readers remember, and what each warming level brings. Heat adds who is exposed (infants 12 and over-65s 13 life-threatening heatwave days a year), heatwave hospital admissions, rice and hot nights, and humid heat: the summer mean wet-bulb rises from 25,9 °C to 27,6 °C at +2 °C and 28,4 °C at +3 °C. Rain: days of 100 mm or more rise a median +62% at +3 °C (all five models) against +10% for the yearly total; the wettest five days +20%; the city's drains are built for 310 mm in two days and the 2025 rain passed 366 mm. May gets drier (−17%), September–October wetter. Drought months rise at every level in every model. Years opening in an El Niño winter average 3,1 drought months against 0,8 after La Niña; the three driest years (1988, 1998, 2007) all opened in El Niño. |
| But | Arriving early | Hà Nội's 2015–2025 already sits close to the models' +1,5 °C world, while the globe was only about 1,2 °C warmer. 7 of the 10 hottest years since 1980 came after 2014. At matched warming, most models undercount the heat the city actually had. |
| Therefore | Plan for +2 °C | Treat +1,5 °C as the present and plan for +2 °C, which is a level to prepare for, not a safe one: even under 2 °C, over-65s' heatwave exposure is projected to be 7 times greater by 2041–2060. Emission cuts can still avoid the step to +3 °C: 40 more hot days and 55 more hot nights a year. |

The heat calendar in the lead has one row per period: 1995–2014, 2015–2025, and then each warming level. The "when" chart marks where the real world is now (1,37 °C in 2025) and when +2 °C comes at today's pace (about 2048). The explorer can be linked to an exact view, for example `?ind=tn28&mode=anom&hl=MIROC6`. It now also offers the wettest five days, drought months and humid-heat days (group "Khô hạn và oi bức"), e.g. `?ind=drought&mode=anom`.

## Design: "the newspaper done right"

The site is a Vietnamese daily's inside news page, without the costume that made an earlier version read like a game website.

- **Colour:**
  - Light newsprint `#f7f6f2` with ink `#1c1c1a`.
  - Dark mode is a quiet charcoal `#1e1e1c` with warm off-white text.
  - Nameplate red appears only on the nameplate and the synthetic-data warnings.
  - Data keeps its own inks. Water uses `--wet`; the drought map runs brown (more drought) to blue-green (less); El Niño years use the SSP5-8.5 ink, La Niña `--wet`.
- **Type:**
  - Roboto 700 for headlines and interface. The weight 900 is no longer used.
  - Noto Serif 400 for every reading paragraph.
  - Columns are set ragged, not justified.
- **Wayfinding:**
  - A nameplate, then a plain "Khí hậu" section label.
  - VI | EN and the light/dark switch are plain text.
  - A chapter rail on wide screens. Below 1120px it becomes a strip in which only the chapter list scrolls, so the link to the other page stays visible. The national rail now has Rain, Drought and Lives under "Nhưng".
- **Rules:** hairlines and ink rules instead of boxes. The pull figure sits under a 3px ink rule.

The design system and every page decision are in `DESIGN.md`, which was refreshed after the redesign. The direction contract is in `.impeccable/surfaces/index-html.md`. Neither has been updated for the water chapters yet.

**Design reviews.** The national page's critique scores have run 23 → 25 → 24 → 28 → 29 out of 40, the last two after the redesign. The reports are in `.impeccable/critique/`.

## Data

| Dataset | Used for | File |
|---|---|---|
| CMIP6 from NOAA's public archive on Google Cloud. 5 models: CESM2, GFDL-ESM4, MPI-ESM1-2-LR, MIROC6, IPSL-CM6A-LR. Area-weighted over Vietnam's provinces (63, before the 2025 mergers) | National page | `data/vietnam_cmip6.json`, `data/vietnam_regions.json`, `data/vietnam_zones.json` |
| The same CMIP6 models, monthly tas, tasmax, tasmin and pr: rain for each calendar month and SPEI-6 by zone (CESM2 has no historical tasmax/tasmin, so drought uses 4 models) | National page: seasons, drought map | `data/vietnam_water.json` |
| CMIP6-VN (Tran-Anh et al. 2023, CC0): 35 models bias-corrected to Vietnamese stations at 0.1°. The report uses 5, picked to run from slow- to fast-warming: MIROC6, MPI-ESM1-2-HR, MRI-ESM2-0, IPSL-CM6A-LR, UKESM1-0-LL. Also the gridded observations for 1980–2014 | Hà Nội report | `data/hanoi/hanoi.json`, `data/hanoi/water.json` |
| ERA5-Land (temperature, dewpoint) and ERA5 (rain) via the Open-Meteo archive (CC BY 4.0), calibrated to the gridded observations. This extends the observed record from 2014 to 2025 | Hà Nội report | `data/hanoi/hanoi.json` (raw downloads in `D:/era5land`) |
| NASA NEX-GDDP-CMIP6 (Thrasher et al. 2022, CC BY 4.0): daily tas, tasmax and humidity for 4 of the Hà Nội models at the city's 0.25° cells. Its summer humidity over Hà Nội is far too high (about 92% against ERA5-Land's 84%), so only each model's monthly change in wet-bulb is used, added to the observed 1995–2014 (the delta method) | Hà Nội humid heat | `data/hanoi/water.json` (raw in `D:/nexgddp`) |
| CHIRPS v2.0 daily rain (Funk et al. 2015) via the IRI Data Library, 1981–2025. Tested against ERA5 on held-out 2005–2014: better on yearly totals (r 0,81 vs 0,40), worse on daily (0,50 vs 0,60) and monthly (0,90 vs 0,91) rain, so ERA5 stays | Rain-source test, reported in the Hà Nội caveats | `hanoi.json` `calibration.rain` (raw in `D:/chirps`) |
| NOAA CPC Oceanic Niño Index | Hà Nội El Niño chart | `data/hanoi/water.json` (raw in `D:/chirps/oni.ascii.txt`) |
| Global warming levels: each model's 20-year running mean against 1850–1900, checked against Hauser et al. and the IPCC AR6 Atlas. The observed level for 2006–2025 is +1,12 °C (HadCRUT5) | Hà Nội report | `data/hanoi/warming_levels.json` |
| WMO OSCAR station registry | Station positions (Láng = 48820) | `data/hanoi/stations_oscar.json` |

Every number in the narration is computed from these files, in both languages. Outside figures are written into the copy as text and named in source lines:
- **Forster et al. 2026:** 1,37 °C in 2025, rising 0,27 °C a decade.
- **UNEP Emissions Gap Report 2026:** 2,8 °C under current policies.
- **IPCC AR6:** 2,7 °C under SSP2-4.5; heavy rain intensifies about 7% per °C (WG1 SPM B.2.2).
- **2023 heat and blackouts:** the 44,2 °C record, the US$1,4 billion World Bank blackout estimate, and the reservoir figures (EVN and VnExpress, June 2023).
- **Typhoon Yagi (2024):** 318 dead, 26 missing, about 81.500 billion đồng (government, via Vietnam News).
- **Mekong drought 2020:** 13 provinces, over 80.000 households short of water (UN Viet Nam).
- **Dengue 2022:** 303.637 cases and 112 deaths by mid-November (Ministry of Health, via Tuổi Trẻ); D-MOSS early warning (UNDP, HR Wallingford).
- **Hà Nội 2025 deluge:** over 366 mm at several spots against drains built for 310 mm in two days (Hà Nội Department of Construction, via Vietnam News).
- **Health and crops:** heatwave hospital admissions (Phung et al. 2017); rice yields and night temperature (Peng et al. 2004).
- **World Bank, Viet Nam 2045 (2025):** GDP 12,5% lower by 2050 without adaptation, 6,7% with it.
- **Lancet Countdown 2023, Vietnam data sheet (data to 2022):** summers 0,8 °C hotter where people live; heatwave days for infants and over-65s; 7× over-65 exposure under 2 °C; dengue transmission up 11%; 16 billion potential labour hours (US$23 billion, 5,6% of GDP); 34.000 deaths from fine-particle pollution and coal at 51,6% in 2020.

## Pipeline (`pipeline/`)

| Script | What it does |
|---|---|
| `build_data.py` | Builds the national and regional CMIP6 series |
| `build_water.py` | Monthly CMIP6 by zone: rain for each calendar month and SPEI-6 (Hargreaves evaporation, generalized logistic fitted per calendar month to each model's 1985–2014), writes `vietnam_water.json` |
| `fetch_cmip6vn.py` | Downloads CMIP6-VN in parallel, with progress output (`--hanoi-set` gets the 5 models) |
| `fetch_era5land.py` | Downloads the ERA5-Land and ERA5 series for Hà Nội |
| `fetch_nexgddp.py` | Downloads NEX-GDDP-CMIP6 for Hà Nội from NASA's subset service, keeping each file as it arrives so it resumes |
| `fetch_chirps.py` | Downloads CHIRPS daily rain for Hà Nội (several years at a time, resumable) and the ONI table |
| `warming_levels.py` | Computes when each model reaches each warming level, and the observed level for 2006–2025 |
| `build_hanoi.py` | Computes the Hà Nội indicators and the heat calendar, runs the quality check, calibrates the reanalysis (with a held-out check), tests CHIRPS against ERA5 for rain after 2014, runs the matched-warming test, and writes `hanoi.json` |
| `build_hanoi_water.py` | Hà Nội rain by month, the wettest five days, dry spells, SPEI-6, humid heat (delta method) and the ONI by year, writes `hanoi/water.json` |
| `fetch_oscar_stations.py` | Pulls Vietnamese station metadata from WMO OSCAR |

## Code layout

- `styles/`: `main.css` imports tokens, base, folio, lead, story, charts, maps, explorer, about and responsive in order; `hanoi.css` adds the report.
- `scripts/`: shared helpers (`util.js`, `i18n.js`, `theme.js`) and the national page's scripts. The narration is in `copy.js`, `regions.js` and `water.js` (seasons, drought, lives, and their figures); `story-scatter.js` draws the rain-against-warming scatter. `scripts/hanoi/` holds the report; `scripts/hanoi/water.js` merges `water.json` into the indicators and adds the season, drought, El Niño and humid-heat steps, the impact lines and the caveats. Without the water files these steps leave the pages.
- `DESIGN.md` (with `.impeccable/design.json`): the design system. `PRODUCT.md`: users, purpose and principles.

## Running it

The pages fetch their JSON, so they must be served over http:

```bash
python -m http.server 8765
```

Then open `http://localhost:8765/index.html` or `http://localhost:8765/hanoi.html`.

## Known issues and next steps

- **Two gap figures.** The "mostly set" chapter still says the paths are 1,8 °C apart in the 2090s (the last smoothed year). Everywhere else gives 1,3 °C (2071–2100), and 1,8 is also the SSP2-4.5 headline number.
- **Narration not gated on data.** Some sentences are stated regardless of the data:
  - "The north warms more" appears even when the regional data is missing.
  - "Most models are wetter" appears whatever the rain models show.
  - The "next 28 years" count is hard-coded to 2026.
  - The water chapters are gated (each claim needs most models to agree), but the closing line about "more frequent drought in the north" only checks that the water data loaded.
- **Drought index.** Four models only (CESM2 lacks historical tasmax/tasmin). Hargreaves evaporation uses temperature only; Penman–Monteith would need humidity, wind and radiation. The index is zone-wide on coarse grids.
- **Humid heat.** NEX-GDDP is a different bias correction from CMIP6-VN, and only its change is used. The monthly delta warms every day in a month alike, so longer or shorter humid spells are not captured. Wet-bulb is from daily means, so it sits below the day's peak. Observed 2015–2025 (27 days, raw ERA5-Land) is well below the models' +1,5 °C (about 67), which a careful reader may notice.
- **Lancet Countdown figures** are national and from the 2023 edition (data to 2022); newer editions may differ. Labour hours are "potential" (heavy outdoor work).
- **Dark-mode inks.** The SSP5-8.5 colour sits close to the nameplate red.
- **Phone details.** The explorer's year labels crowd at 343px. The rain scatter hides model names and slope labels below 560px.
- **Light-mode contrast.** The SSP2-4.5 orange is slightly under AA contrast for small text.
- **Explorer features.** The national explorer has no shareable URL state, export or reset.
- **Calibrated reanalysis, not stations.** From 2015 the observed record is calibrated reanalysis, not station data. The city's own growth probably adds about 0,15 °C a decade to the station-based record, so the page shows a range.
- **Data gaps:**
  - Five representative cells stand in for Hà Nội; with a Copernicus CDS account, all 47 cells and ERA5-Land rain become possible.
  - Consequences are told from existing studies, not computed for Hà Nội at each warming level.
  - Five models is a small ensemble.
- **Design docs.** `DESIGN.md` and the direction contract don't yet cover the water chapters, the drought map ramp or the timeline.
- **Ministry scenarios.** There is no comparison yet with the Ministry of Agriculture and Environment's 2025 climate scenarios.
