---
name: Vietnam Climate Scenario Explorer
description: A Vietnamese daily's inside news page on Vietnam's climate to 2100, with a working explorer.
colors:
  newsprint: "#f1efe9"
  lighter-stock: "#f8f7f3"
  ink: "#212529"
  seventy-black: "#4d4c49"
  hairline: "#cfcbc1"
  column-rule: "#212529"
  control-line: "#77746c"
  chart-grid: "#dedad1"
  nameplate-red: "#c8102e"
  on-red: "#ffffff"
  history-graphite: "#4b545c"
  ssp245-orange: "#b85c00"
  ssp585-maroon: "#951b1e"
  wet-teal: "#1b7a6e"
  dry-brown: "#8c5a1e"
  baseline-wash: "rgba(33,37,41,.07)"
  window-wash: "rgba(33,37,41,.05)"
  dark-newsprint: "#141619"
  dark-stock: "#1b1e22"
  dark-ink: "#e8e6e1"
  dark-seventy: "#aaa9a4"
  dark-hairline: "#34383d"
  dark-column-rule: "#8b8f94"
  dark-control-line: "#757b82"
  dark-chart-grid: "#24282d"
  dark-red: "#ff5a6a"
  dark-history: "#b9c2ca"
  dark-ssp245: "#f2a24b"
  dark-ssp585: "#e5534b"
  dark-wet: "#5cc2b2"
  dark-dry: "#d9a45f"
typography:
  headline:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(36px, 4.6vw, 66px)"
    fontWeight: 900
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  section-head:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(28px, 3vw, 42px)"
    fontWeight: 900
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  step-head:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(28px, 2.6vw, 36px)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "21px"
    fontWeight: 900
    lineHeight: 1.25
  pull-figure:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(30px, 3vw, 40px)"
    fontWeight: 900
    lineHeight: 1.05
    fontFeature: "tnum"
  sapo:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(18px, 1.6vw, 21px)"
    fontWeight: 700
    lineHeight: 1.45
  body:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  column:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  step-body:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.62
  caption:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label-block:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.02em"
  label-byline:
    fontFamily: "Roboto, -apple-system, Segoe UI, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.03em"
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
  column-pad: "22px"
  rail-gap: "32px"
  rail: "300px"
components:
  section-block:
    backgroundColor: "{colors.nameplate-red}"
    textColor: "{colors.on-red}"
    typography: "{typography.label-block}"
    rounded: "{rounded.none}"
    padding: "7px 12px"
  nameplate:
    textColor: "{colors.nameplate-red}"
    height: "56px"
  segmented-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 10px"
    height: "40px"
  segmented-button-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.newsprint}"
  segmented-button-hover:
    backgroundColor: "{colors.baseline-wash}"
  lang-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    width: "38px"
    height: "32px"
  lang-button-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.newsprint}"
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

Files: `styles/main.css` imports the style parts in cascade order (tokens, base, folio, lead, story, charts, maps, explorer, about, responsive); `scripts/` holds plain scripts that `index.html` loads in order, ending with `scripts/main.js`. All copy lives in `scripts/i18n.js` (static strings), `scripts/copy.js` (story) and `scripts/regions.js` (map chapter).

The Hà Nội report, `hanoi.html`, is a second page in the same paper. It loads the same `styles/main.css` plus `styles/hanoi.css`, and the shared `scripts/util.js`, `scripts/i18n.js` and `scripts/theme.js`, then its own scripts in `scripts/hanoi/` (strings, data, copy, calendar, charts, story, explorer, main). See **Hà Nội report** below.

**Creative North Star: "The Inside News Page"**

The page is a Vietnamese daily's inside news page about Vietnam's climate future, set the way Lao Động sets its pages: grey newsprint, one ink, one nameplate red, Roboto in four weights, hairline column rules. It refuses both the online-dashboard and the online-article defaults; it reads as print that happens to move. The headline answers the question in its red second clause, the bold sa-pô states the story, a ruled three-part grid carries the lead, and the scroll story and explorer below keep the same paper, rules and type.

Density is a newspaper's: justified columns, tight leading on heads, rules instead of boxes, no rounded corners, no decorative shadows. Data keeps its own inks, separate from the page's red, so a chart never borrows the masthead's voice. Vietnamese is the first language; every number is set in the reader's locale and computed from the loaded dataset. The genre is conventional only: no real paper's masthead, logo or name.

**Key Characteristics:**
- Newsprint ground (`newsprint`), ink (`ink`), and the paper's 70% black (`seventy-black`) for captions and secondary text.
- One nameplate red, rationed to named slots.
- Roboto only: Black heads, bold sa-pô, regular body; tabular numerals wherever figures stand in columns.
- Hairline column rules and heavier ink rules build structure; corners are square everywhere.
- Data inks: graphite history, orange SSP2-4.5, maroon SSP5-8.5, teal wet, brown dry, RdBu warming stripes.

## Colors

A newsprint palette: warm grey stock, near-black ink, one red, and a separate set of data inks.

### Primary
- **Nameplate Red** (`nameplate-red`; dark `dark-red`): the section block, the nameplate, the headline's red second clause, the 4px pull-figure rule, the 2px folio rule (and the explorer's top rule that echoes it), and the synthetic-data warning (data line, chart watermark, chart subtitle warning, file-load error). It also serves as the hover colour for links and the focus-ring colour inside segmented controls. Text on red uses `on-red`.

### Neutral
- **Newsprint** (`newsprint`; dark `dark-newsprint`): the page ground and the sticky folio's ground.
- **Lighter Stock** (`lighter-stock`; dark `dark-stock`): the explorer section, the tooltip, the `kbd` key and the mobile story cards; a second sheet of paper, never a card colour elsewhere.
- **Ink** (`ink`; dark `dark-ink`): text, heavy rules, pressed segmented buttons, check and range accents, hatching strokes, the focus outline.
- **Seventy Black** (`seventy-black`; dark `dark-seventy`): captions, bylines' second line, axis text, legends, inactive story steps, jump-line page references.
- **Column Rule** (`column-rule`; dark `dark-column-rule`): the 1px column rules and the 2px table and section tops.
- **Hairline** (`hairline`; dark `dark-hairline`): row rules in tables, control separators, glossary separators, the source line's top rule.
- **Control Line** (`control-line`; dark `dark-control-line`): chart axes, the 2015 split, the stripes axis tick, the scrollbar.
- **Chart Grid** (`chart-grid`; dark `dark-chart-grid`): gridlines only.
- **Baseline and Window Washes** (`baseline-wash`, `window-wash`): the 1985–2014 baseline box and the 2071–2100 window box in charts; `baseline-wash` is also the hover wash on controls.

### Data inks
- **History Graphite** (`history-graphite`; dark `dark-history`): the historical run, 1950–2014.
- **SSP2-4.5 Orange** (`ssp245-orange`; dark `dark-ssp245`) and **SSP5-8.5 Maroon** (`ssp585-maroon`; dark `dark-ssp585`): the scenario pair, always with direct labels.
- **Wet Teal** (`wet-teal`) and **Dry Brown** (`dry-brown`): model agreement on wetter or drier, as tinted chips (15% and 17% mixes) with the ink in full.
- **Warming Stripes**: D3's RdBu interpolator reversed on a diverging scale with domain −1, 0, +4 °C (clamped), so the white point sits at zero change and red carries most of the range. The key below the figure shows 26 swatches with ticks at −1, 0, +1 … +4 °C.
- **Zone maps** reuse the stripes scale for temperature change, so a colour means the same °C in the hero and on every map (zones above +4 °C saturate, as the stripes do; the value labels carry the difference). Rainfall change on the explorer map uses D3's BrBG on −20, 0, +20% (clamped): brown drier, teal wetter, in step with the wet/dry inks.
- **Map neutrals**: neighbouring land is ink mixed 8% into newsprint (`--nb-land`); a zone with nothing to show (no scenario ticked, or non-CMIP6 data) is ink at 14% (`--nodata`). The sea is the page itself.

### Named Rules
**The Rationed Red Rule.** Nameplate red appears only in its named slots: section block, nameplate, headline's red clause, pull-figure rule, folio rule, synthetic-data warning, and as a hover/focus state. It never fills a chart series, a button or a background area beyond the section block.

**The Separate Inks Rule.** The page's red and the data inks never stand in for each other. SSP5-8.5 is maroon, not nameplate red; warnings are nameplate red, never maroon.

## Typography

**Display Font:** Roboto (with -apple-system, Segoe UI, Arial, sans-serif)
**Body Font:** Roboto (same stack)
**Label/Mono Font:** Roboto for labels; the monospace stack (`code`) only for code and the data-format example.

**Character:** One family carried by weight, as Lao Động sets it: Black (900) heads and figures, Bold (700) sa-pô and bylines, Medium (500) navigation and chart notes, Regular (400) body and captions. Weights loaded: 400, 500, 700, 900, and 400 italic.

### Hierarchy
- **Headline** (900, clamp 36–66px, 1.04, −0.02em, balanced): the lead's two-line headline. The second clause is a block in nameplate red, upright, and its numbers are computed.
- **Section head** (900, clamp 28–42px, 1.08): the explorer and about heads.
- **Step head** (900, clamp 28–36px, 1.1, 4px ink rule above): each story chapter; 26px on phones.
- **Title** (900, 21px, 1.25): the explorer chart title; results head at 18px.
- **Pull figure** (900, clamp 30–40px, tabular): the boxed "+3,6 °C" figure; result figures use 900 at clamp 32–44px.
- **Sa-pô** (700, clamp 18–21px, 1.45, max 900px): the bold standfirst under the headline.
- **Body** (400, 17px, 1.6): about text at 62ch; lead columns 16px/1.55; story steps 18px/1.62 at 44ch.
- **Caption** (400, 14px, 1.45, seventy black): figure captions, pull-figure gloss, chart help.
- **Labels**: section block 900/15px uppercase +0.02em; byline 700/13px uppercase +0.03em; control legends 900/13px uppercase +0.03em; chart axes 400/13px; units and end labels 700/13px.

### Named Rules
**The One Family Rule.** Roboto is the only face on the page. Hierarchy comes from weight and size, never a second family; the monospace stack is for code only.

**The Tabular Figures Rule.** Any number that sits in a column, on an axis, in a table, a tooltip, the pull figure, the date line or the stripes key uses tabular numerals.

**The Locale Numbers Rule.** Numbers are set in the reader's locale (Vietnamese 2,0; English 2.0; true minus sign), a narrow no-break space (U+202F) joins a number to its unit (2,0 °C, 120 mm), and scenario names (SSP2-4.5, SSP5-8.5) never break across lines. Every narrated number is computed from the loaded data, in both languages.

## Layout

Content sits in a 1240px measure with a fluid gutter (16–40px). The sticky folio is 56px tall on newsprint with a 2px red rule beneath: section block, nameplate, the VI | EN and theme controls, and the date/data line (shortened under 1300px, hidden under 520px).

**The chapter rail** sits on the left, fixed below the folio, 160px wide, on newsprint with a 1px column rule at its right. It opens with a Black 12px uppercase seventy-black head ("Các chương" / "Chapters"), lists the chapter links (Medium 15px ink on 38px rows; the current chapter turns Bold with a 3px ink bar at its left; hover is nameplate red), and ends, under a hairline, with a link to the other page: "Bài riêng · Hà Nội nóng lên" (special report) on the national page, "Trang chính · Cả nước" (main page) on the Hà Nội page. The folio's contents, `main` and the imprint all shift right by the rail's width, so the nameplate and the headline share a left edge. Under 1120px the page takes the full width again and the rail turns on its side: a 40px strip pinned under the folio (44px on coarse pointers), newsprint with a 1px rule below. The rail head is dropped; chapter links sit in a row (Medium 14px), the current one with a 3px ink bar underneath instead of at its left. The other page closes the row after a hairline column rule, its kicker kept. The strip scrolls sideways when it runs out of room (no scrollbar; overscroll contained), and keeps the current chapter's link in view. Sticky offsets and the anchor scroll padding read `--strip`, which is 0 while the rail sits at the left. On phones (≤620px) the strip stays at the top of the page as a contents line and scrolls away, so the pinned story figure keeps its height. Under 820px a story step's card sits at the foot of a tall scroll block, so chapter links land with the card in the band that activates it and move focus to the card, instead of jumping to the step's empty top. The data badge leaves the folio under 820px, and the nameplate may wrap; the byline carries the same facts.

**The lead** is a ruled grid in 2:1:1 under a 1px ink rule: the stripes figure takes two parts, then the byline column, then a second column ending in the pull figure and jump lines. Columns are separated by 1px column rules with 22px padding. Under 980px the figure spans full width above two columns; under 620px everything stacks, with rules between columns.

**Justification.** Vietnamese lead and story columns are justified with hyphenation; Vietnamese syllables justify cleanly. English lead columns are set ragged, because English words are long and browser hyphenation is unreliable in a 30-character column. Under 620px all columns go ragged.

**The story** is a 5:7 grid: steps on the left (each step about 88vh tall), the figure pinned on the right at the folio's height, ruled off by a 1px column rule bound to the figure frame so it never hangs in empty paper. Under 820px the figure pins at the top on newsprint with a bottom rule, and steps scroll over it as stock cards, held to 60ch so a tablet card keeps a reading measure.

**The explorer** sits on lighter stock under a 2px red rule: chart column, then a 1px ink rule, then a 300px control rail with 32px gaps. Under 980px the rail moves below the chart as a grid of control groups under a 2px rule. Results sit under a 2px rule as columns separated by hairline rules.

**The about** section is a 6:5 grid with the glossary ruled off at left; the imprint closes the page on a 3px double rule.

Breakpoints: 1300, 1240, 1120, 980, 820, 620, 520px; coarse pointers raise controls to 44px.

## Elevation & Depth

The page is flat paper. Structure is built with rules: 1px hairlines and column rules, 2px section and table tops, 4px ink rules over step heads, a 4px red rule over the pull figure, a 3px double rule over the imprint. One soft shadow exists for things that float over other content.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 1px 2px rgba(33,37,41,.08), 0 8px 22px rgba(33,37,41,.10)`; dark uses black at .30/.35): the chart tooltip and the phone story cards that scroll over the pinned figure. Nothing else.

### Named Rules
**The Rules Not Boxes Rule.** Group with a rule, not a container. A shadow appears only on something that floats over other content.

## Shapes

Square corners everywhere (0px). Segmented controls are 1px ink boxes divided by 1px ink lines; checks and range inputs take ink as their accent. Legend swatches are squares (series), short bars (lines), washes (bands) and hatched rectangles. The 2071–2100 margin bar is a thin range bar with an ink tick for the mean.

## Components

### Section block
A red label on the folio: Roboto Black 15px uppercase, white on nameplate red, 7px 12px padding, square. One per page, naming the section ("Khí hậu" / "Climate").

### Nameplate
Roboto Black 20px in nameplate red beside the section block; stays red on hover; wraps to 15px on phones.

### Language control (VI | EN)
A 1px ink box with two buttons divided by an ink line; pressed is ink fill with newsprint text; hover a baseline wash; focus ring red, inset.

### Theme control (light | dark)
Sits right of VI | EN in the same 1px ink box: a sun and a moon icon (16px, ink, square caps), pressed in ink fill. Until the reader picks, the page follows the system setting and the control shows it; a pick sets `data-theme` on the root, is saved in `localStorage` ("theme"), and is applied by a tiny inline script in `<head>` before first paint. The language choice is saved the same way ("lang"; `?lang=` still wins). Under 520px only the button for the other mode shows.

### Folio date/data line
Medium 12px seventy black, tabular, left hairline: the date in the reader's locale (Vietnamese weekday plus dd.mm.yyyy) and the data source. In synthetic-data mode it turns bold nameplate red.

### Byline
Bold 13px uppercase label over a regular seventy-black second line, ruled off below, set ragged even in justified columns.

### Pull figure
4px nameplate-red rule above, 1px column rule below, Roboto Black tabular figure with a regular 14px seventy-black gloss.

### Jump lines
Bold 14px links underlined with a 1px border, followed by a regular seventy-black page reference, in the manner of a print "continued on" line.

### Warming stripes figure
One stripe per year from 1950, forking at 2015 into SSP2-4.5 (upper) and SSP5-8.5 (lower) bands, each directly labelled at the right with a colour square in its scenario ink. A three-tick axis (1950, 2015, 2100), a seventy-black caption, and the RdBu key below.

### Story steps
Heads with a 4px ink rule, justified body at 44ch; inactive steps fade to seventy black and the active step turns ink. Figures in the text are bold, tabular and unbreakable. On phones each step is a lighter-stock card with a column-rule border and the float shadow.

### Zone map (story chapter "Nơi nóng lên nhiều nhất" / "Where it warms most")
Two steps between "Two futures" and "Rain". The pinned frame swaps the line chart for the map with a 170ms fade out and in (an opacity dip under reduced motion); a swap under way always lands on the latest step. A Mercator map of the seven climate zones (Natural Earth admin-1, 63 pre-2025 provinces merged), Hoàng Sa and Trường Sa drawn as ink dots at their true positions, named in italic and marked "no model data". Zone borders are 1.25px newsprint lines, the coastline and land border a 0.75px ink line, neighbours a flat `--nb-land` with letter-spaced medium 11px names (TRUNG QUỐC, LÀO, CAMPUCHIA) and the sea named in italic ("Biển Đông" / "East Sea"). Each zone carries a direct label: medium 12px name over a Black 15px tabular value, ink with a 3.5px newsprint halo; small or coastal zones (Đồng bằng Bắc Bộ, Nam Trung Bộ) sit offshore on a 0.75px ink leader. A small SSP2-4.5 | SSP5-8.5 segmented control (32px) sits in the map head beside a bold 13px seventy-black title. The second step lays the coarsest model's grid cells over the map as 1px ink boxes (fills drop to 60%), so the reader sees how few cells a zone holds. Under 420px wide the map drops neighbour and sea names, shortens island names, and sets labels at 10.5/13px. The legend shows a 0–+4 °C ramp key, the island-dot key and, on the grid step, a cell key.

### Region control (explorer)
The rail opens with "Vùng / Region": a full-width native select in the segmented-control box (1px ink, square, CSS chevron, 40px; 44px on coarse pointers) as the keyboard and screen-reader path, and a 300px zone map under it for pointers. Zones are coloured by the 2071–2100 change for the current variable, baseline, models and scenario (SSP5-8.5 when ticked, else SSP2-4.5); the selected zone, or the whole outline for "Cả nước", takes a 2.25px ink outline; hover draws a 1.25px ink edge and a native title with the value. A ramp key and a seventy-black note say what the colour means. With synthetic or uploaded data the select is disabled, the map turns `--nodata`, and the note says regional series exist only for CMIP6.

### Chart primitives
Axes in control line with 13px tabular labels; gridlines in chart grid; baseline and 2071–2100 windows as washes; the 2015 split dashed; model-disagreement hatching as 45° ink strokes at 52% opacity on a 7px pattern; 2071–2100 margin bars per scenario (model range plus mean tick); bold end labels in each series ink, model labels medium in seventy black; a red watermark in synthetic mode.

### Segmented controls and checks
Explorer controls use the same 1px ink box as the language control at 40px (44px on coarse pointers). Checks are 18px with ink accent on 36px rows with a wash on hover. Control groups carry a Black 13px uppercase legend.

### Agreement table and data table
Both open with a 2px column-rule top and hairline row rules, tabular figures, no fills. Agreement cells carry tinted wet or dry chips with full-ink text.

### Glossary
Terms in Black 15px separated by hairlines, definitions in seventy black, ruled off from the about text by a column rule.

### Motion
Story transitions run 750ms with cubic in-out easing (lines collapse to the baseline, futures draw in); future series reveal through a clip that widens over 900ms, delayed by 60% of the transition. Step text colour changes in 300ms; controls change colour in 150ms. The explorer redraws instantly. Under reduced motion the figure swaps state with a 160ms opacity dip and smooth scrolling is off.

## Hà Nội report (`hanoi.html`)

Same paper, same parts, a narrower subject. Everything the national page defines (tokens, folio, lead grid, story frame, explorer, about, imprint, breakpoints) applies unchanged; `styles/hanoi.css` adds only what the report needs.

- **Folio and rail:** the section block reads "Hà Nội" / "Hanoi"; the nameplate links back to `index.html`. The chapter rail lists Đã trải qua, Mức ấm lên, Nắng nóng, Mưa, Độ tin cậy, Tự khám phá, then "Trang chính · Cả nước" back to the national page. The national page's lead carries a jump line to the report, and the report's lead carries one back.
- **Axis of the story:** global warming levels (+1.5, +2, +3 °C above 1850–1900), not years. Scenarios appear only in the chapter that explains when each level arrives.
- **Heat calendar (lead figure):** built like the warming stripes. One row per period (observed 1995–2014, then each warming level), one column per day of the year, coloured by the share of years whose city-wide high reaches 35 °C. Each theme has its own ramp, so more heat always reads as more colour against that page's ground. Light: the warm half of the stripes' RdBu scale (`d3.interpolateRdBu(0.5 − 0.5p)`), pale peach to dark red, so darker red reads as "more heat" as on the stripes. Dark: YlOrRd run the other way (`d3.interpolateYlOrRd(1 − 0.8p)`), dim burgundy to bright orange, so the hottest days glow instead of sinking into the dark ground (RdBu there would make rare days the brightest). Below a 20% share the colour fades out by opacity, and days below 0.5% are left as paper. The calendar redraws when the theme changes; the copy says "the stronger the colour" so it holds in both. The key runs from 0 to the highest share any row reaches, rounded up to 10%, not to an unused 100%. Row labels sit at the right like the stripes' scenario labels; a month axis (T1–T12 / Jan–Dec) runs under the calendar only; a 0–100% key sits below. When the widest month label won't fit in February's width, every other month (tick and label) is hidden; this is measured on the calendar's own width, not set by breakpoint.
- **Explorer on one column (≤980px):** the three controls come first, then the chart's title (under a 1px rule) and the chart, so a reader picks and sees the result without scrolling past the chart. The national explorer keeps its controls after the chart, since it has many more of them.
- **Lead layout:** the report's lead takes the stacked 980px layout from 1300px down, a step earlier than the national page. In that layout the calendar runs the full measure and the two text columns sit under it. With the chapter rail present, three columns would leave 365 days about 300px wide. Above 1300px the three-column lead holds; once the lead grid is under 1120px (text columns under ~240px) both text columns set ragged together instead of justified. The sa-pô is held to 68ch, and reading copy uses `text-wrap: pretty`. All of this is scoped to `.hn`, so the national page's lead is unchanged.
- **Dot charts (story and explorer):** every model is a dot (seventy black at 62%, a newsprint edge), set without overlap in its column. In temperature charts the warming-level columns take the heat calendar's ramp as a data ink, never nameplate red: shares 0.62, 0.8 and 1 of `calColor`, so light runs coral, red, burgundy (+1.5 °C at 3.5:1 on newsprint) and dark runs orange to pale gold, at 90% opacity; 1995–2014 and every rain chart stay graphite, since red would read as heat. The legend's dot swatch shows the four column inks. These charts redraw with the calendar when the theme changes; the model median is a 3px ink bar with a bold tabular value; the observed 1995–2014 value is a 2px dashed line in history graphite with a bold graphite label. Columns are 1995–2014 and the three levels, labelled in bold ink. In the explorer one model can be highlighted: ink dot, a 1.25px ink line across the columns, the others drop to 22%. The focused chart takes the keyboard: ← → move between columns, ↑ ↓ between models (top to bottom by value), Home/End to the ends, Esc clears; the current dot gets a 2px ink ring and the tooltip, and a polite live region reads "model, level: value unit". The view lives in the URL (`?ind=tn28&mode=anom&hl=MIROC6`; defaults are left out), so a lecturer can link one chart. The explorer opens on hot nights (`tn28`), the indicator the story gives least room; chapter 3's hot days are one pick away. In Change mode the 1995–2014 column is dropped from the chart and the table (every model's change from its own baseline is zero). A highlighted model's values at each column print under the highlight control. Under the result cards, "all five models are above their own 1995–2014" is said once when it holds at every level, and per card only when the count differs.
- **Reader copy and methods:** terms are explained where they first appear, not only in the glossary: the median ("half the models above, half below"), each SSP by its emissions path, BCSD as CMIP6-VN's bias-correction method. Repository paths and run-label notes stay out of the prose and the caveat list; they sit in one muted 13px methods line under "What we don't know" in the about section.
- **Loading and failure:** until `data/hanoi/hanoi.json` arrives the headline reads "Đang tải số liệu Hà Nội…" in seventy black, `main` is `aria-busy`, and the lead grid, story and explorer stay hidden. A failure keeps the grey headline ("Chưa tải được số liệu Hà Nội"), explains the likely cause in the sa-pô slot (opened from disk, or a dropped connection) and offers a "Thử lại" link button that reruns the load. Developer instructions go to the console only.
- **Other charts:** observed yearly bars in history graphite with a dashed ink trend line and the baseline wash; the "when" chart puts the four scenarios in rows, models as dots on a year axis from 2025 (earlier only if a model gets there first) to 2090, ticked every 10 years (20 on phones) with no unit label, the median as a vertical ink tick and a seventy-black count of models that don't get there; the trust chart sets the models' 1980–2014 trends as dots against a dashed graphite line for the observed trend, drawn under the median tick, which carries its own bold value below the dots on the side away from the observed line. The bands chart draws 37 °C as dots and 39 °C as a second, thin dashed median with a regular-weight value; the legend names each median's threshold. A row's "3/5 don't get there before 2090" note moves to the row's foot if a dot would run under it.
- **Hà Nội on one line:** every reader-facing string writes the city as `Hà\u00a0Nội` (a no-break space as an escape, so it stays visible in source), on both pages.
- **No new inks.** Dots, medians and observed lines use the existing neutrals and history graphite. Scenario rows are told apart by position and label, not colour, so SSP1-2.6 and SSP3-7.0 need no inks of their own.
- **Copy rules:** the national page's rules hold. Every narrated number is computed from `data/hanoi/hanoi.json`; levels print through `lvName` ("+1,5 °C" / "+1.5 °C"); the copy says "city-wide average" wherever a reader might expect a station count, and the about section lists what the page doesn't know yet.

## Do's and Don'ts

### Do:
- **Do** set every head in Roboto Black and the sa-pô in Roboto Bold; carry hierarchy by weight, never a second family.
- **Do** build structure with rules: 1px column rules between columns, 2px tops on sections and tables, 4px ink over step heads.
- **Do** justify Vietnamese columns with hyphenation, and set narrow English lead columns ragged.
- **Do** compute every narrated number from the loaded data and set it in the reader's locale, with U+202F before the unit and scenario names unbroken.
- **Do** label the scenario pair directly in its own inks (SSP2-4.5 orange, SSP5-8.5 maroon) and keep graphite for history.
- **Do** use tabular numerals for every figure that sits in a column, axis, table or tooltip.

### Don't:
- **Don't** use nameplate red outside its named slots, and never as a data series.
- **Don't** round corners or add shadows to anything that does not float over other content.
- **Don't** introduce a second typeface; the monospace stack is for code only.
- **Don't** type a number into narration by hand, or show a period decimal in Vietnamese.
- **Don't** reproduce a real newspaper's masthead, logo or name; the genre is conventions only.
- **Don't** draw Vietnam without Hoàng Sa and Trường Sa, and don't give them values: at CMIP6 resolution they hold no land cells.
- **Don't** narrate a single "warmest zone" unless at least 4 of 5 models agree on it; the robust finding is the north–south contrast, and the copy checks which one holds.

### Detector exemptions (intentional)
- `overused-font=roboto` is ignored: Roboto was pinned by the user ("Use the same font as Lao Dong newspaper").
- `repeating-stripes-gradient` on index.html is ignored: it is the hatching legend key, matching the chart's disagreement hatching.
