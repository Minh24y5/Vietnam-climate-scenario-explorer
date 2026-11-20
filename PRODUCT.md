# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Educators, university students, and academic researchers studying climate change projections, model consensus, and uncertainty in Vietnam and Southeast Asia. They need to visualize, compare, and explain how multi-model climate ensembles project temperature and precipitation trends across different future emissions pathways.

## Product Purpose
Provide an accessible, interactive, client-side exploratory data visualization tool for Vietnam's CMIP6 climate model projections through 2100. Success means students and educators can intuitively explore warming trajectories, precipitation variability, baseline shifts, and inter-model spread without requiring specialized climate informatics software or code notebooks.

## Positioning
Unlike static IPCC report graphs or cumbersome spatial data portals, Vietnam Climate Scenario Explorer provides instant, zero-friction client-side scenario exploration with interactive baseline tuning, model selection, anomaly toggling, and support for loading custom area-weighted CMIP6 JSON exports.

## Operating Context
Classrooms, university lectures, research group presentations, and self-directed student exploration. Operates as a zero-dependency static web application accessible across desktop, laptop, and tablet browsers without accounts, backend servers, or setup.

## Capabilities and Constraints
- **Variables**: Annual mean surface temperature (`tas`, °C) and mean monthly precipitation (`pr`, mm/month).
- **Scenarios**: CMIP6 Shared Socioeconomic Pathways SSP2-4.5 (medium emissions) and SSP5-8.5 (high emissions), connected to 1950–2014 historical runs.
- **Interactive Controls**:
  - Variable toggle (`tas` / `pr`).
  - Values mode (Absolute values vs Anomaly relative to baseline).
  - 30-year baseline reference period adjustment (slider 1950–1985).
  - Scenario toggles (SSP2-4.5, SSP5-8.5).
  - Individual model toggles (checkboxes for ensemble composition).
  - Display options: 10-year running mean smoothing and individual model traces.
  - Interactive tooltip revealing ensemble mean and model range for any year.
  - End-of-century summary metrics (2071–2100 vs baseline) with directional agreement diagnosis.
- **Custom Data Workflow**: User-provided JSON file upload adhering to the 65-year historical and 86-year projection structure.
- **Technical Constraints**: Pure static HTML/CSS/JavaScript with D3.js v7; fully client-side execution.

## Brand Commitments
- Name: **Vietnam Climate Scenario Explorer**
- Tone & Voice: Objective, educational, scientifically rigorous, and transparent about climate model uncertainty.

## Evidence on Hand
- Working static web application implementation in `index.html`, `styles/` (entry `styles/main.css`, which imports the part files in cascade order), and `scripts/` (plain scripts loaded in order by `index.html`, ending with the entry `scripts/main.js`).
- Real CMIP6 results bundled in `data/vietnam_cmip6.json`: area-weighted annual means for Vietnam from 5 models (`CESM2`, `GFDL-ESM4`, `MPI-ESM1-2-LR`, `MIROC6`, `IPSL-CM6A-LR`), built from NOAA's public CMIP6 archive on Google Cloud. This is the default for the story and the explorer.
- Built-in synthetic sample (4 models, deterministic Gaussian series) as a labelled fallback when the CMIP6 file can't load, and as an option in the explorer.
- Regional series for the 7 climate zones (`data/vietnam_regions.json`) behind the zone-map chapter and the explorer's region control.
- A Hà Nội special report, `hanoi.html`: city-wide daily indicators (hot days at 35/37/39 °C, hot nights, heavy rain) from five models of the 35-model CMIP6-VN dataset (MIROC6, MPI-ESM1-2-HR, MRI-ESM2-0, IPSL-CM6A-LR, UKESM1-0-LL: slow- to fast-warming) and its gridded observations, compared at +1.5, +2 and +3 °C of global warming. Data: `data/hanoi/hanoi.json` (built by `pipeline/build_hanoi.py` from `pipeline/fetch_cmip6vn.py` downloads) and `data/hanoi/warming_levels.json` (`pipeline/warming_levels.py`). The data audit behind it is `docs/hanoi-data-audit.md`.
- Absence: monthly and seasonal views; humidity and humid heat; consequences (health, work, electricity, flooding); observations after 2014.

## Product Principles
- **Scientific Transparency**: Never obscure model disagreement or uncertainty; distinguish historical runs from projections clearly, and explicitly signal when synthetic data is in use.
- **Immediate Interactivity**: Baseline shifts, scenario toggles, and model selections must update visualizations and summary diagnostics instantaneously.
- **Cognitive Clarity for Learners**: Pair complex multi-model ensemble metrics with contextual descriptions, legible legends, and plain-language agreement indicators.
- **Zero-Barrier Portability**: Maintain lightweight, dependency-free client-side code that works out of the box and supports bringing custom data.

## Accessibility & Inclusion
- WCAG AA contrast compliance across light and dark modes.
- Color-blind distinguishable palettes for scenario traces and baseline bands.
- Full keyboard navigation and accessible labeling for sliders, toggles, and file inputs.
- Responsive layout adapting cleanly from mobile viewports to large displays.
