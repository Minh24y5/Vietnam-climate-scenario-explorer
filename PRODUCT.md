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
- Working static web application implementation in `index.html`, `style.css`, and `main.js`.
- Built-in synthetic dataset modeling 4 CMIP6 models (`CESM2`, `GFDL-ESM4`, `MPI-ESM1-2-LR`, `MIROC6`) using deterministic gaussian series.
- Absence: Verified empirical/CMIP6 NetCDF-derived values are not yet bundled into the default payload (planned next step); sub-national/provincial shapefile breakdowns are currently not implemented.

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
