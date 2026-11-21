---
name: Vietnam Climate Scenario Explorer
description: A Vietnamese daily's inside news page on Vietnam's climate to 2100, with a working explorer.
colors:
  newsprint: "#f7f6f2"
  lighter-stock: "#fbfaf7"
  ink: "#1c1c1a"
  seventy-black: "#5c5b57"
  hairline: "#d9d6cd"
  column-rule: "#1c1c1a"
  control-line: "#77746c"
  chart-grid: "#e2dfd7"
  nameplate-red: "#c8102e"
  history-graphite: "#4b545c"
  ssp245-orange: "#b85c00"
  ssp585-maroon: "#951b1e"
  wet-teal: "#1b7a6e"
  dry-brown: "#8c5a1e"
  baseline-wash: "rgba(28,28,26,.07)"
  window-wash: "rgba(28,28,26,.05)"
  dark-newsprint: "#1e1e1c"
  dark-stock: "#262624"
  dark-ink: "#ece9e2"
  dark-seventy: "#b0ada5"
  dark-hairline: "#3a3936"
  dark-column-rule: "#8d8a83"
  dark-control-line: "#7c7a74"
  dark-chart-grid: "#2c2b29"
  dark-red: "#e0646b"
  dark-history: "#b9c2ca"
  dark-ssp245: "#f2a24b"
  dark-ssp585: "#e5534b"
  dark-wet: "#5cc2b2"
  dark-dry: "#d9a45f"
typography:
  headline:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(32px, 3.7vw, 48px)"
    fontWeight: 700
    lineHeight: 1.14
    letterSpacing: "-0.012em"
  section-head:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(26px, 2.8vw, 38px)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.012em"
  step-head:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(26px, 2.4vw, 32px)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.25
  pull-figure:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(30px, 3vw, 40px)"
    fontWeight: 700
    lineHeight: 1.05
    fontFeature: "tnum"
  sapo:
    fontFamily: "Noto Serif, Georgia, Times New Roman, serif"
    fontSize: "clamp(18px, 1.5vw, 20px)"
    fontWeight: 400
    lineHeight: 1.55
  column:
    fontFamily: "Noto Serif, Georgia, Times New Roman, serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  step-body:
    fontFamily: "Noto Serif, Georgia, Times New Roman, serif"
    fontSize: "17.5px"
    fontWeight: 400
    lineHeight: 1.66
  reading:
    fontFamily: "Noto Serif, Georgia, Times New Roman, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  caption:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label-section:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.08em"
  label-byline:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.03em"
  label-legend:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.06em"
  chart-text:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    fontFeature: "tnum"
  code:
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.86em"
rounded:
  none: "0px"
spacing:
  gutter: "clamp(16px, 4vw, 40px)"
  measure: "1240px"
  folio: "56px"
  chapter-rail: "160px"
  column-pad: "22px"
  rail-gap: "32px"
  rail: "300px"
components:
  section-label:
    textColor: "{colors.seventy-black}"
    typography: "{typography.label-section}"
    padding: "4px 0 4px 14px"
  nameplate:
    textColor: "{colors.nameplate-red}"
    height: "56px"
  folio-toggle:
    backgroundColor: "transparent"
    textColor: "{colors.seventy-black}"
    rounded: "{rounded.none}"
    padding: "0 8px"
    width: "34px"
    height: "40px"
  folio-toggle-pressed:
    textColor: "{colors.ink}"
  segmented-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 10px"
    height: "40px"
  segmented-button-hover:
    backgroundColor: "{colors.baseline-wash}"
  segmented-button-pressed:
    backgroundColor: "{colors.baseline-wash}"
    textColor: "{colors.ink}"
  pull-figure:
    textColor: "{colors.ink}"
    typography: "{typography.pull-figure}"
    padding: "10px 0 12px"
  explorer-surface:
    backgroundColor: "{colors.lighter-stock}"
    rounded: "{rounded.none}"
  tooltip:
    backgroundColor: "{colors.lighter-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
---

# Design System: Vietnam Climate Scenario Explorer

## Overview

Files: `styles/main.css` imports the style parts in cascade order (tokens, base, folio, lead, story, charts, maps, explorer, about, responsive); `scripts/` holds plain scripts that `index.html` loads in order, ending with `scripts/main.js`. All copy lives in `scripts/i18n.js` (static strings), `scripts/copy.js` (story) and `scripts/regions.js` (map chapter). `styles/tokens.css` is the single source for colours and the font stacks (`--font`, `--font-read`, `--font-mono`).

The Hà Nội report, `hanoi.html`, is a second page in the same paper. It loads the same `styles/main.css` plus `styles/hanoi.css`, and the shared `scripts/util.js`, `scripts/i18n.js` and `scripts/theme.js`, then its own scripts in `scripts/hanoi/` (strings, data, copy, calendar, charts, story, explorer, main). See **Hà Nội report** below.

**Creative North Star: "The Inside News Page, Done Right"**

The page is a Vietnamese daily's inside news page about Vietnam's climate future. It keeps the newspaper's wayfinding (folio, nameplate, section label, ruled columns, byline, pull figure, jump lines) and drops the costume: no filled badge, no red half-headline, no black-weight UI type. Light newsprint, one ink, a nameplate red that appears almost nowhere, Roboto in three weights for heads and interface, and Noto Serif for every paragraph a reader reads through. It reads as print that happens to move; the ink headline carries the turn, a short serif sa-pô states the story, a ruled three-part grid carries the lead, and the scroll story and explorer below keep the same paper, rules and type.

Density is a newspaper's: tight leading on heads, rules instead of boxes, no rounded corners, no decorative shadows. Reading columns are set ragged, in both languages. Data keeps its own inks, separate from the page's red, so a chart never borrows the masthead's voice. Vietnamese is the first language; every number is set in the reader's locale and computed from the loaded dataset. The genre is conventional only: no real paper's masthead, logo or name. Dark mode is quiet charcoal with warm off-white ink, not near-black with coral.

**Key Characteristics:**
- Light newsprint ground (`newsprint`), ink (`ink`), and the paper's 70% black (`seventy-black`) for captions, labels and secondary text.
- Nameplate red only on the nameplate and on synthetic-data warnings.
- Roboto 400/500/700 for heads, labels, controls and charts; Noto Serif 400 for running paragraphs; tabular numerals wherever figures stand in columns.
- Hairline and column rules build structure, heavier ink rules mark heads and figures; corners are square everywhere.
- Data inks: graphite history, orange SSP2-4.5, maroon SSP5-8.5, teal wet, brown dry, RdBu warming stripes.

## Colors

A light newsprint palette: warm pale stock, near-black warm ink, one rationed red, and a separate set of data inks.

### Primary
- **Nameplate Red** (`nameplate-red`; dark `dark-red`): the nameplate text, and the synthetic-data warning (folio data line, chart watermark, chart-subtitle warning, file-load error note). Nothing else. Links, chapter links and controls do not turn red on hover or focus.

### Neutral
- **Newsprint** (`newsprint`; dark `dark-newsprint`): the page ground, the sticky folio, the chapter rail and strip, the pinned phone figure. Also the theme-color meta in each mode.
- **Lighter Stock** (`lighter-stock`; dark `dark-stock`): the explorer section, the tooltip, the `kbd` key and the phone story cards; a second sheet of paper, never a card colour elsewhere.
- **Ink** (`ink`; dark `dark-ink`): text, heavy rules (2px step and explorer tops, 3px pull rule), the pressed control underline, check and range accents, hatching strokes, the focus outline.
- **Seventy Black** (`seventy-black`; dark `dark-seventy`): captions, the section label, rail heads and act heads, unpressed folio toggles, bylines' second line, axis text, legends, inactive story steps, jump-line page references.
- **Column Rule** (`column-rule`; dark `dark-column-rule`): the 1px folio rule, the 1px column rules, the 2px section and table tops. In light mode it is ink itself; in dark mode it steps back to a warm grey.
- **Hairline** (`hairline`; dark `dark-hairline`): the section label's divider, the VI | EN and theme dividers, the data line's divider, table row rules, control separators, glossary separators, the source line's top rule.
- **Control Line** (`control-line`; dark `dark-control-line`): segmented-control borders, chart axes, the 2015 split, the stripes axis tick, `kbd` borders, the scrollbar.
- **Chart Grid** (`chart-grid`; dark `dark-chart-grid`): gridlines only.
- **Baseline and Window Washes** (`baseline-wash`, `window-wash`; dark uses warm white at the same alphas): the 1985–2014 baseline box and the 2071–2100 window box in charts; `baseline-wash` is also the hover wash and the pressed fill on controls.

### Data inks
- **History Graphite** (`history-graphite`; dark `dark-history`): the historical run, 1950–2014.
- **SSP2-4.5 Orange** (`ssp245-orange`; dark `dark-ssp245`) and **SSP5-8.5 Maroon** (`ssp585-maroon`; dark `dark-ssp585`): the scenario pair, always with direct labels.
- **Wet Teal** (`wet-teal`) and **Dry Brown** (`dry-brown`): model agreement on wetter or drier, as tinted chips (15% and 17% mixes) with the ink in full.
- **Warming Stripes**: D3's RdBu interpolator reversed on a diverging scale with domain −1, 0, +4 °C (clamped), so the white point sits at zero change and red carries most of the range. The key below the figure shows 26 swatches with ticks at −1, 0, +1 … +4 °C.
- **Zone maps** reuse the stripes scale for temperature change, so a colour means the same °C in the hero and on every map (zones above +4 °C saturate, as the stripes do; the value labels carry the difference). Rainfall change on the explorer map uses D3's BrBG on −20, 0, +20% (clamped): brown drier, teal wetter, in step with the wet/dry inks.
- **Map neutrals**: neighbouring land is ink mixed 8% into newsprint (`--nb-land`); a zone with nothing to show (no scenario ticked, or non-CMIP6 data) is ink at 14% (`--nodata`). The sea is the page itself.

### Named Rules
**The Nameplate-Only Red Rule.** Nameplate red sets the nameplate and warns that data is synthetic or failed to load. It never marks a heading, a kicker, a rule, a link, a hover or focus state, a button, a chart series or a background area.

**The Separate Inks Rule.** The page's red and the data inks never stand in for each other. SSP5-8.5 is maroon, not nameplate red; warnings are nameplate red, never maroon.

## Typography

**Display Font:** Roboto (with -apple-system, Segoe UI, Arial, sans-serif), weights 400, 500, 700
**Body Font:** Noto Serif (with Georgia, Times New Roman, serif), 400, with 700 and 400 italic loaded for emphasis
**Label/Mono Font:** Roboto for labels; the monospace stack (`code`) only for code and the data-format example.

**Character:** A news sans for everything a reader scans (heads, labels, controls, figures, captions, chart text) and a sturdy text serif for everything a reader reads through. Weight carries hierarchy in the sans: Bold (700) heads, figures and bylines; Medium (500) navigation, labels and chart notes; Regular (400) captions and UI copy. There is no Black weight.

### Hierarchy
- **Headline** (Roboto 700, clamp 32–48px, 1.14, −0.012em, balanced, max 30ch): the lead's headline, all ink. The second clause sits on its own line as an upright block, same colour; its numbers are computed.
- **Section head** (Roboto 700, clamp 26–38px, 1.12): the explorer and about heads.
- **Step head** (Roboto 700, clamp 26–32px, 1.18, 2px ink rule above, balanced): each story chapter; 26px under 820px.
- **Title** (Roboto 700, 21px, 1.25): the explorer chart title; results head 700 at 18px.
- **Pull figure** (Roboto 700, clamp 30–40px, tabular): the "+3,1 °C" lead figure; result figures use 700 at clamp 32–44px, −0.02em.
- **Sa-pô** (Noto Serif 400, clamp 18–20px, 1.55, max 900px, `text-wrap: pretty`): the standfirst under the headline.
- **Reading columns** (Noto Serif 400): lead columns 16px/1.6; story steps 17.5px/1.66 at 44ch (17px under 820px); about 17px/1.65 at 62ch; glossary definitions 15px/1.6; the Hà Nội "what we don't know" list 16px/1.6. Bold figures inside them are Noto Serif 700, tabular and unbreakable.
- **UI body** (Roboto 400, 17px, 1.6): explorer intro, result notes (15px), chart help (14px).
- **Caption** (Roboto 400, 14px, 1.45, seventy black): figure captions, pull-figure gloss.
- **Labels**: section label 500/12px uppercase +0.08em; rail head and cross-page label 500/12px uppercase +0.08em; act heads 500/11px uppercase +0.08em; byline 700/13px uppercase +0.03em; control legends 700/13px uppercase +0.06em; chart axes 400/13px; units and end labels 700/13px; chart notes 500/12px.

### Named Rules
**The Two Voices Rule.** Noto Serif sets running paragraphs only: sa-pô, lead columns, story step text, about text, glossary definitions, the Hà Nội list. Heads, labels, captions, controls, chart text, figures, explorer intros and results are Roboto. Never a serif head, never a third family; the monospace stack is for code only.

**The No Black Weight Rule.** Roboto tops out at 700. Hierarchy comes from size, a rule above, and 500 against 700, never from 900.

**The Ragged Columns Rule.** Every reading column is set flush left, ragged right, without hyphenation, in Vietnamese and English alike.

**The Tabular Figures Rule.** Any number that sits in a column, on an axis, in a table, a tooltip, the pull figure, the date line or the stripes key uses tabular numerals.

**The Locale Numbers Rule.** Numbers are set in the reader's locale (Vietnamese 2,0; English 2.0; true minus sign), a narrow no-break space (U+202F) joins a number to its unit (2,0 °C, 120 mm), and scenario names (SSP2-4.5, SSP5-8.5) never break across lines. Every narrated number is computed from the loaded data, in both languages.

## Layout

Content sits in a 1240px measure with a fluid gutter (16–40px). The sticky folio is 56px tall on newsprint with a 1px ink rule beneath. Left to right: the nameplate, the section label after a hairline, then (pushed right) the VI | EN and theme toggles and the date/data line (shortened under 1300px, gone under 820px).

**The chapter rail** sits on the left, fixed below the folio, 160px wide, on newsprint with a 1px column rule at its right. It opens with a muted 500 12px uppercase head ("Các chương" / "Chapters"), lists the chapter links (Medium 15px ink on 38px rows; the current chapter turns Bold with a 3px ink bar at its left; hover underlines), grouped under three muted 500 11px uppercase act heads ("Điều ta biết / Nhưng / Vì vậy"), and ends, under a hairline, with a link to the other page: a muted label ("Bài riêng" on the national page) over a Bold link ("Hà Nội nóng lên"; "Trang chính · Cả nước" on the Hà Nội page). The folio's contents, `main` and the imprint all shift right by the rail's width, so the nameplate and the headline share a left edge.

Under 1120px the page takes the full width again and the rail turns on its side: a 40px strip pinned under the folio (44px on coarse pointers), newsprint with a 1px rule below. The rail head and act heads drop; chapter links sit in a row (Medium 14px, 12px side padding), the current one with a 3px ink bar underneath. Only the chapter list scrolls sideways (no scrollbar, overscroll contained, a 28px fade mask at its right edge says it runs on) and keeps the current link in view; the cross-page link stays pinned at the strip's right after a hairline, its label kept. Sticky offsets and the anchor scroll padding read `--strip`, which is 0 while the rail sits at the left. On phones (≤620px) the strip stays at the top of the page as a 44px contents line and scrolls away, so the pinned story figure keeps its height; the cross-page label is hidden and chapter links tighten to 10px padding, so a third chapter shows cut by the fade. Under 820px a story step's card sits at the foot of a tall scroll block, so chapter links land with the card in the band that activates it and move focus to the card, instead of jumping to the step's empty top. Under 820px the nameplate may wrap; the byline carries the data line's facts.

**The lead** is a ruled grid in 2:1:1 under a 1px ink rule: the stripes figure takes two parts, then the byline column, then a second column ending in the pull figure and jump lines. Columns are separated by 1px column rules with 22px padding. Under 980px the figure spans full width above two columns; under 620px everything stacks, with rules between columns.

**The story** is a 5:7 grid: steps on the left (each step about 88vh tall), the figure pinned on the right at the folio's height, ruled off by a 1px column rule bound to the figure frame so it never hangs in empty paper. Under 820px the figure pins at the top on newsprint with a bottom rule, and steps scroll over it as stock cards, held to 60ch so a tablet card keeps a reading measure.

**The explorer** sits on lighter stock under a 2px ink rule: chart column, then a 1px ink rule, then a 300px control rail with 32px gaps. Under 980px the rail moves below the chart as a grid of control groups under a 2px rule. Results sit under a 2px rule as columns separated by 1px rules.

**The about** section is a 6:5 grid under a 1px rule with the glossary ruled off at left; the imprint closes the page on a 3px double rule.

Breakpoints: 1300, 1240, 1120, 980, 820, 620, 520px; coarse pointers raise controls to 44px.

## Elevation & Depth

The page is flat paper. Structure is built with rules: 1px hairlines and column rules, the 1px folio rule, 2px ink rules over step heads and on section and table tops, a 3px ink rule over the pull figure, a 3px double rule over the imprint. One soft shadow exists for things that float over other content.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 1px 2px rgba(28,28,26,.08), 0 8px 22px rgba(28,28,26,.10)`; dark uses black at .30/.35): the chart tooltip and the phone story cards that scroll over the pinned figure. Nothing else.

### Named Rules
**The Rules Not Boxes Rule.** Group with a rule, not a container. A shadow appears only on something that floats over other content.

## Shapes

Square corners everywhere (0px). Segmented controls are 1px control-line boxes divided by 1px control lines; the folio toggles have no box at all. Checks and range inputs take ink as their accent. Legend swatches are squares (series), short bars (lines), washes (bands) and hatched rectangles; Hà Nội model dots are the one round mark. The 2071–2100 margin bar is a thin range bar with an ink tick for the mean.

## Components

### Section label
A plain word on the folio, not a badge: Roboto 500 12px uppercase +0.08em in seventy black, after a 1px hairline at its left (14px gap). One per page, naming the section ("Khí hậu" / "Climate"; "Hà Nội" / "Hanoi" on the report).

### Nameplate
Roboto Bold 20px in nameplate red, first on the folio; stays red on hover; wraps to 15px on phones.

### Language and theme toggles (VI | EN, sun | moon)
Two pairs of plain text buttons on the right of the folio, no borders or fills. Each button is at least 34px wide and 40px tall (44px wide on coarse pointers); unpressed is seventy black at 500, pressed is ink at 700, hover on an unpressed button turns it ink. A 12px hairline divides the two buttons of a pair. The theme pair uses a 16px sun and moon drawn in currentColor with square caps. Until the reader picks, the page follows the system setting and the control shows it; a pick sets `data-theme` on the root, is saved in `localStorage` ("theme"), and is applied by a tiny inline script in `<head>` before first paint. The language choice is saved the same way ("lang"; `?lang=` still wins). Under 520px only the button for the other mode shows. Focus is the shared ink outline, inset 4px.

### Folio date/data line
Medium 12px seventy black, tabular, after a hairline: the date in the reader's locale (Vietnamese weekday plus dd.mm.yyyy) and the data source. In synthetic-data mode it turns bold nameplate red.

### Links
Ink, underlined 1px with a 3px offset; hover thickens the underline to 2px. Chapter links have no underline at rest and underline on hover. Focus everywhere is a 2px ink outline at 3px offset.

### Byline
Bold 13px uppercase label over a regular seventy-black second line, ruled off below, set ragged.

### Pull figure
3px ink rule above, 1px column rule below, Roboto Bold tabular figure with a regular 14px seventy-black gloss.

### Jump lines
Bold 14px links underlined with a 1px border, followed by a regular seventy-black page reference, in the manner of a print "continued on" line.

### Warming stripes figure
One stripe per year from 1950, forking at 2015 into SSP2-4.5 (upper) and SSP5-8.5 (lower) bands, each directly labelled at the right with a colour square in its scenario ink. A three-tick axis (1950, 2015, 2100), a seventy-black caption, and the RdBu key below.

### Story steps
Heads under a 2px ink rule, serif body at 44ch, ragged; inactive steps fade to seventy black and the active step turns ink. Figures in the text are bold, tabular and unbreakable. The story's turn is carried by the heads' own words: the But step opens "Nhưng…" / "But…", the Therefore step "Vì vậy…" / "So…"; there is no kicker line above the head. On phones each step is a lighter-stock card with a column-rule border and the float shadow.

### Zone map (story chapter "Nơi nóng lên nhiều nhất" / "Where it warms most")
Two steps between "Two futures" and "Rain". The pinned frame swaps the line chart for the map with a 170ms fade out and in (an opacity dip under reduced motion); a swap under way always lands on the latest step. A Mercator map of the seven climate zones (Natural Earth admin-1, 63 pre-2025 provinces merged), Hoàng Sa and Trường Sa drawn as ink dots at their true positions, named in italic and marked "no model data". Zone borders are 1.25px newsprint lines, the coastline and land border a 0.75px ink line, neighbours a flat `--nb-land` with letter-spaced medium 11px names (TRUNG QUỐC, LÀO, CAMPUCHIA) and the sea named in italic ("Biển Đông" / "East Sea"). Each zone carries a direct label: medium 12px name over a Bold 15px tabular value, ink with a 3.5px newsprint halo; small or coastal zones (Đồng bằng Bắc Bộ, Nam Trung Bộ) sit offshore on a 0.75px ink leader. A small SSP2-4.5 | SSP5-8.5 segmented control (32px) sits in the map head beside a bold 13px seventy-black title. The second step lays the coarsest model's grid cells over the map as 1px ink boxes (fills drop to 60%), so the reader sees how few cells a zone holds. Under 420px wide the map drops neighbour and sea names, shortens island names, and sets labels at 10.5/13px. The legend shows a 0–+4 °C ramp key, the island-dot key and, on the grid step, a cell key.

### Region control (explorer)
The rail opens with "Vùng / Region": a full-width native select (1px ink border, square, CSS chevron, Bold 14px, 40px; 44px on coarse pointers) as the keyboard and screen-reader path, and a 300px zone map under it for pointers. Zones are coloured by the 2071–2100 change for the current variable, baseline, models and scenario (SSP5-8.5 when ticked, else SSP2-4.5); the selected zone, or the whole outline for "Cả nước", takes a 2.25px ink outline; hover draws a 1.25px ink edge and a native title with the value. A ramp key and a seventy-black note say what the colour means. With synthetic or uploaded data the select is disabled, the map turns `--nodata`, and the note says regional series exist only for CMIP6.

### Chart primitives
Axes in control line with 13px tabular labels; gridlines in chart grid; baseline and 2071–2100 windows as washes; the 2015 split dashed; model-disagreement hatching as 45° ink strokes at 52% opacity on a 7px pattern; 2071–2100 margin bars per scenario (model range plus mean tick); bold end labels in each series ink, model labels medium in seventy black; a red watermark in synthetic mode.

### Segmented controls and checks
Explorer controls are a 1px control-line box divided by control lines, 40px tall (44px on coarse pointers), Medium 14px ink. Pressed is the baseline wash with a 3px inset ink underline and Bold text; hover on an unpressed button is the same wash without the underline; disabled is seventy black on no fill. Checks are 18px with ink accent on 36px rows with a wash on hover. Control groups carry a Bold 13px uppercase +0.06em legend, ruled apart by hairlines.

### Agreement table and data table
Both open with a 2px column-rule top and hairline row rules, tabular figures, no fills. Agreement cells carry tinted wet or dry chips with full-ink text.

### Glossary
Terms in Bold 15px Roboto separated by hairlines, definitions in seventy-black Noto Serif 15px, ruled off from the about text by a column rule.

### Motion
Story transitions run 750ms with cubic in-out easing (lines collapse to the baseline, futures draw in); future series reveal through a clip that widens over 900ms, delayed by 60% of the transition. Step text colour changes in 300ms; controls change colour in 150ms. The explorer redraws instantly. Under reduced motion the figure swaps state with a 160ms opacity dip and smooth scrolling is off.

## Hà Nội report (`hanoi.html`)

Same paper, same parts, a narrower subject. Everything the national page defines (tokens, folio, lead grid, story frame, explorer, about, imprint, breakpoints) applies unchanged; `styles/hanoi.css` adds only what the report needs.

- **Story structure (both pages): And, But, Therefore.** Each page tells one arc, and the headline carries the turn, not the headline number. *And* sets out what the models say and states the common intuition in plain words (small, far off, up to emissions). *But* is the turn, from the data: on the national page the two emissions paths stay within half a degree until the fork year (the computed `F.fork`, shaded on the chart as "mostly set"), the north warms faster (Red River Delta against the national median), and the 2023 heat record and blackouts and Typhoon Yagi show it has begun; on the Hà Nội page the observed 2015–2025 already sits close to the models' +1.5 °C, the heat calendar gains a 2015–2025 row between 1995–2014 and +1.5 °C, and the trust and matched-warming test chapters follow as evidence that the projections are not exaggerated. *Therefore* closes each story: "Vì vậy, hai việc cùng lúc" / "So there are two jobs at once" (adapt now, cut emissions for the second half of the century) nationally; "Vì vậy: chuẩn bị cho +2 °C, và giữ +3 °C ở xa" / "So plan for +2 °C, and keep +3 °C away" in Hà Nội. The But and Therefore heads open with the act's own word ("Nhưng…", "Vì vậy…"); there is no kicker label. The chapter rail groups its links under three quiet act heads (Medium 11px uppercase, seventy black: "Điều ta biết / Nhưng / Vì vậy"), hidden when the rail turns into the strip. The turn chart on the Hà Nội page puts each indicator on a days-a-year strip: 1995–2014 as a graphite dot, 2015–2025 as a band in the heat calendar's deepest ink (from the plain to the drift-carrying calibration), and the model median at each level as a labelled dashed tick; in the closing step +2 °C is the solid median bar and the span to +3 °C is washed and labelled "still avoidable". Outside facts (the 44.2 °C record, the World Bank's US$1.4 billion blackout estimate, Typhoon Yagi, Forster et al. 2026) are named in the step's source line.
- **Folio and rail:** the section label reads "Hà Nội" / "Hanoi"; the nameplate links back to `index.html`. The chapter rail lists Đã trải qua, Mức ấm lên, Nắng nóng, Mưa, then Đến sớm (the turn: recent years, the record, trust and the matched-warming test), Chuẩn bị cho +2 °C, Tự khám phá, then "Trang chính · Cả nước" back to the national page. The national page's lead carries a jump line to the report, and the report's lead carries one back.
- **Axis of the story:** global warming levels (+1.5, +2, +3 °C above 1850–1900), not years. Scenarios appear only in the chapter that explains when each level arrives.
- **Heat calendar (lead figure):** built like the warming stripes. One row per period (observed 1995–2014, then each warming level), one column per day of the year, coloured by the share of years whose city-wide high reaches 35 °C. Each theme has its own ramp, so more heat always reads as more colour against that page's ground. Light: the warm half of the stripes' RdBu scale (`d3.interpolateRdBu(0.5 − 0.5p)`), pale peach to dark red, so darker red reads as "more heat" as on the stripes. Dark: YlOrRd run the other way (`d3.interpolateYlOrRd(1 − 0.8p)`), dim burgundy to bright orange, so the hottest days glow instead of sinking into the dark ground (RdBu there would make rare days the brightest). Below a 20% share the colour fades out by opacity, and days below 0.5% are left as paper. The calendar redraws when the theme changes; the copy says "the stronger the colour" so it holds in both. The key runs from 0 to the highest share any row reaches, rounded up to 10%, not to an unused 100%. Row labels sit at the right like the stripes' scenario labels; a month axis (T1–T12 / Jan–Dec) runs under the calendar only; a 0–100% key sits below. When the widest month label won't fit in February's width, every other month (tick and label) is hidden; this is measured on the calendar's own width, not set by breakpoint.
- **Explorer on one column (≤980px):** the three controls come first, then the chart's title (under a 1px rule) and the chart, so a reader picks and sees the result without scrolling past the chart. The national explorer keeps its controls after the chart, since it has many more of them.
- **Lead layout:** the report's lead takes the stacked 980px layout from 1300px down, a step earlier than the national page. In that layout the calendar runs the full measure and the two text columns sit under it. With the chapter rail present, three columns would leave 365 days about 300px wide. The sa-pô is held to 68ch, and reading copy (every `p` and `li` in `main`) uses `text-wrap: pretty`. All of this is scoped to `.hn`, so the national page's lead is unchanged.
- **Dot charts (story and explorer):** every model is a dot (seventy black at 62%, a newsprint edge), set without overlap in its column. In temperature charts the warming-level columns take the heat calendar's ramp as a data ink, never nameplate red: shares 0.62, 0.8 and 1 of `calColor`, so light runs coral, red, burgundy (+1.5 °C at no less than 3.5:1 on newsprint) and dark runs orange to pale gold, at 90% opacity; 1995–2014 and every rain chart stay graphite, since red would read as heat. The legend's dot swatch shows the four column inks. These charts redraw with the calendar when the theme changes; the model median is a 3px ink bar with a bold tabular value; the observed 1995–2014 value is a 2px dashed line in history graphite with a bold graphite label. Columns are 1995–2014 and the three levels, labelled in bold ink. In the explorer one model can be highlighted: ink dot, a 1.25px ink line across the columns, the others drop to 22%. The focused chart takes the keyboard: ← → move between columns, ↑ ↓ between models (top to bottom by value), Home/End to the ends, Esc clears; the current dot gets a 2px ink ring and the tooltip, and a polite live region reads "model, level: value unit". The view lives in the URL (`?ind=tn28&mode=anom&hl=MIROC6`; defaults are left out), so a lecturer can link one chart. The explorer opens on hot nights (`tn28`), the indicator the story gives least room; chapter 3's hot days are one pick away. In Change mode the 1995–2014 column is dropped from the chart and the table (every model's change from its own baseline is zero). A highlighted model's values at each column print under the highlight control. Under the result cards, "all five models are above their own 1995–2014" is said once when it holds at every level, and per card only when the count differs.
- **About:** "What we don't know" opens with a Bold 18px head under a 2px rule, then a list in Noto Serif 16px/1.6 at 62ch with seventy-black markers.
- **Reader copy and methods:** terms are explained where they first appear, not only in the glossary: the median ("half the models above, half below"), each SSP by its emissions path, BCSD as CMIP6-VN's bias-correction method. Repository paths and run-label notes stay out of the prose and the caveat list; they sit in one muted 13px methods line under "What we don't know" in the about section.
- **Loading and failure:** until `data/hanoi/hanoi.json` arrives the headline reads "Đang tải số liệu Hà Nội…" in seventy black, `main` is `aria-busy`, and the lead grid, story and explorer stay hidden. A failure keeps the grey headline ("Chưa tải được số liệu Hà Nội"), explains the likely cause in the sa-pô slot (opened from disk, or a dropped connection) and offers a bold "Thử lại" link button that reruns the load. Developer instructions go to the console only.
- **Other charts:** observed yearly bars in history graphite (calibrated-reanalysis years from 2015 at 45%) with a dashed ink trend line and the baseline wash; the "when" chart puts the four scenarios in rows, models as dots on a year axis from 2025 (earlier only if a model gets there first) to 2090, ticked every 10 years (20 on phones) with no unit label, the median as a vertical ink tick and a seventy-black count of models that don't get there; the trust chart sets the models' 1980–2014 trends as dots against a dashed graphite line for the observed trend, drawn under the median tick, which carries its own bold value below the dots on the side away from the observed line. The bands chart draws 37 °C as dots and 39 °C as a second, thin dashed median with a regular-weight value; the legend names each median's threshold. A row's "3/5 don't get there before 2090" note moves to the row's foot if a dot would run under it. Values set over dots carry a 3.5px newsprint halo.
- **Hà Nội on one line:** every reader-facing string writes the city as `Hà Nội` (a no-break space as an escape, so it stays visible in source), on both pages.
- **No new inks.** Dots, medians and observed lines use the existing neutrals and history graphite. Scenario rows are told apart by position and label, not colour, so SSP1-2.6 and SSP3-7.0 need no inks of their own.
- **Copy rules:** the national page's rules hold. Every narrated number is computed from `data/hanoi/hanoi.json`; levels print through `lvName` ("+1,5 °C" / "+1.5 °C"); the copy says "city-wide average" wherever a reader might expect a station count, and the about section lists what the page doesn't know yet.

## Do's and Don'ts

### Do:
- **Do** set heads, labels, controls, figures and chart text in Roboto at 400, 500 or 700, and every running paragraph in Noto Serif 400.
- **Do** build structure with rules: 1px column rules between columns, a 1px ink rule under the folio, 2px ink over step heads and on section and table tops, 3px ink over the pull figure.
- **Do** set reading columns ragged left without hyphenation, in both languages.
- **Do** carry the story's turn in the heading's own words ("Nhưng…", "Vì vậy…").
- **Do** show interaction in ink: links thicken their underline on hover, toggles go from seventy black 500 to ink 700 when pressed, segmented controls take the wash and a 3px inset ink underline.
- **Do** compute every narrated number from the loaded data and set it in the reader's locale, with U+202F before the unit and scenario names unbroken.
- **Do** label the scenario pair directly in its own inks (SSP2-4.5 orange, SSP5-8.5 maroon) and keep graphite for history.
- **Do** use tabular numerals for every figure that sits in a column, axis, table or tooltip.

### Don't:
- **Don't** use nameplate red anywhere but the nameplate and synthetic-data or load-failure warnings: not on a heading clause, a rule, a hover or focus state, a button, or a data series.
- **Don't** fill the section label as a badge, or box the folio toggles.
- **Don't** use Roboto Black (900), or set a head in the serif or a paragraph in the sans.
- **Don't** put a kicker or eyebrow label above a story head.
- **Don't** round corners or add shadows to anything that does not float over other content.
- **Don't** type a number into narration by hand, or show a period decimal in Vietnamese.
- **Don't** reproduce a real newspaper's masthead, logo or name; the genre is conventions only.
- **Don't** draw Vietnam without Hoàng Sa and Trường Sa, and don't give them values: at CMIP6 resolution they hold no land cells.
- **Don't** narrate a single "warmest zone" unless at least 4 of 5 models agree on it; the robust finding is the north–south contrast, and the copy checks which one holds.

### Detector exemptions (intentional)
- `overused-font=roboto` is ignored: Roboto was pinned by the user ("Use the same font as Lao Dong newspaper"); this build keeps it for heads and UI and adds Noto Serif for reading.
- `repeating-stripes-gradient` on index.html is ignored: it is the hatching legend key, matching the chart's disagreement hatching.
