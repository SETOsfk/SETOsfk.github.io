# How low will Istanbul's reservoirs go this autumn — and can we tell in May?

**Week:** 2026-W39 · **Author:** Sertan Şafak · **Dashboard:** `dashboard.html` (published at https://setosfk.github.io/analyses/istanbul-reservoirs/)

## Question

Every year Istanbul's reservoirs peak in spring and fall to a low in autumn. If you only know the city-wide fill level on 1 May, how well can you predict that autumn low, and how much better is that than assuming an average year?

## Data

| Series | Source | Coverage | Licence |
|---|---|---|---|
| Daily fill of 10 dams | [IBB Open Data, ISKI](https://data.ibb.gov.tr/dataset/istanbul-barajlari-gunluk-doluluk-oranlari) | 23 Oct 2000 – 19 Feb 2024 (8,520 days) | IBB Open Data License |
| Daily city-wide fill + stored water | [IBB Open Data, ISKI](https://data.ibb.gov.tr/dataset/istanbul-dam-occupany-rates-data) | 1 Jan 2005 – 7 Apr 2021 (5,941 days) | IBB Open Data License |

The widely used Kaggle dataset ([istanbul-baraj-doluluk-dam-occupancy-rate](https://www.kaggle.com/datasets/aiwithcagri/istanbul-baraj-doluluk-dam-occupancy-rate)) is a copy of the second series. I went to the original portal instead: it adds the per-dam breakdown and three more years.

## Data quality: four defects found and fixed

| # | Defect | Fix |
|---|---|---|
| 1 | 130 rows (1 Apr – 8 Aug 2023) are stored as percentages (60.65) while all other rows are fractions (0.6065) | divide by 100 |
| 2 | In the same block, days 1–12 have day and month swapped ("2023-01-04" is 1 April) | swap back when that restores a continuous daily sequence |
| 3 | 25 Dec 2007 is a one-day spike in every dam (city total 59.6% between 25.6% and 25.7%; ISKI's own series says 25.7%) | mean of the neighbouring days |
| 4 | City-wide series: 2 duplicated dates, 2 missing days | keep the first record; leave the gaps |

Also noted and left as they are: Alibey reads exactly 0% for 210 days (2000, 2005, 2007–08 droughts). Elmalı reads a flat 0.5% from Aug 2016 to Oct 2017, which looks like the dam was emptied for works (not verified).

**Validation.** Weighting the 10 dams by capacity (868.7 million m³ in total) reproduces ISKI's own city-wide figure within **0.014 points on average** (max 0.35) over 195 months. The implied capacity from the official series, stored water ÷ fill rate, is 868.6 on the median day.

## Method

- **Unit:** hydrological year Y, from 1 May Y to the end of February Y+1; 23 years (2001–2023).
- **Target:** lowest weekly city-wide fill in that window. **Predictor:** fill in the week containing 1 May.
- **Rolling-origin backtest:** each year is predicted using only earlier years. There are 18 forecasts (2006–2023), with 5 to 22 years of history each.
- **Methods, simplest first:**
  1. climatology: the mean of past lows
  2. subtract: May level − median past drop, floored at 0
  3. OLS: past lows regressed on May level
- **Metric:** mean absolute error (MAE) in percentage points.

## Findings

1. **The city loses a median 40 points between May and the autumn low**, about 347 million m³. In the middle half of years the drop is 34–49 points.
2. **The May level sets the floor.** The correlation between May level and autumn low is 0.82. The subtract rule has an MAE of **9.3 points**, against **16.4** for climatology (43% lower). OLS does not beat it (9.5), so the extra parameter buys nothing.
3. **The remaining ~9 points are the weather after May.** The rule's biggest misses were dry years where it was too optimistic: 2013 (22 points too high; this is the run-up to the 2014 crisis) and 2022 (19 points).
4. **A May level below 50% was a reliable warning.** All four such years (2007, 2008, 2014, 2023) ended below 20%. The only other sub-20% year, 2020, started May at 69%. The record low was **9.5% in the week of 5 Nov 2007**.

Per dam, the two Kırklareli reservoirs run dry most often: Pabuçdere was below 20% in 25% of months and Kazandere in 22%. For Terkos the figure is 1.4% and for Ömerli 4.7%. Size alone does not explain it: Istrancalar, the smallest, was below 20% in only 2.9% of months.

## Caveats

- These are reservoir levels only. There is no rainfall, consumption or inter-basin transfer data (e.g. Melen), so this measures how much water was lost, not why.
- The portal's data ends in Feb 2024 (per dam) and Apr 2021 (city-wide). This is **not** a forecast for 2026.
- 23 years is a small sample. "4 of 4" is a pattern, not a law.
- Weekly means smooth the daily extremes by well under one point.

## Dashboard

One page, one time position. The map shows the 10 dams as tanks (area ∝ capacity, water level = that month's fill, red below 20%) with a player over the 281 months from Oct 2000 to Feb 2024; a second colour mode shows each dam's difference from its own 2001–2023 average for that calendar month. Every chart is linked to the map: the season lines, the May-vs-low scatter, the backtest rows and the dam-by-month heat strip all move it. Dam locations come from Wikipedia, Yandex Maps and OpenStreetMap; the basemap is Natural Earth 1:10m (public domain).

## Reproduce

```bash
python veri_hazirla.py        # downloads from the IBB API and applies the four fixes (falls back to the snapshot in veri/)
python analiz.py              # numbers -> sonuclar.json, then dashboard.py -> dashboard.html (+ the portfolio copy)
python gorsel.py              # link preview, LinkedIn image, portfolio thumbnail (needs playwright)
```
