# How much attention does a new album buy — and for how long?

**Week:** 2026-W41 · **Author:** Sertan Şafak · **Dashboard:** `dashboard.html`

## Question

When an artist releases a studio album, how much do views of their English Wikipedia article rise, how fast does the rise fade, and is it more than an ordinary week?

## Data

| Series | Source | Coverage | Licence |
|---|---|---|---|
| Daily article views (agent = user, bots excluded) | [Wikimedia Pageviews API](https://wikimedia.org/api/rest_v1/) | 51 artists, 1 Jul 2015 – 4 Oct 2026 (4,114 days) | CC0 |
| Album release groups, artist life span | [MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API) | 162 candidate studio albums | core data CC0 |

The collected data is published on Kaggle: [Music Artists: 11 Years of Daily Wikipedia Views](https://www.kaggle.com/datasets/sertanafak/music-artists-11-years-of-daily-wikipedia-views) (CC0). The artist selection follows the Kaggle set [Global Music Popularity & Cultural Attention](https://www.kaggle.com/datasets/blixture/global-music-popularity-and-cultural-attention).

## Data preparation

- **One article per artist.** Each artist is matched to their English Wikipedia article and MusicBrainz id by id, not by name: plain titles such as "Queen", "Drake" or "Prince" are disambiguation pages, and MusicBrainz lists Kanye West as "Ye".
- **Renamed articles.** Six articles (Drake, Jay-Z, BTS, Blackpink, Wizkid, Sia) had other titles during the period; e.g. Drake's article was "Drake (rapper)" until 28 Jun 2016. Views under a former title are added to the current one. Former titles were found by checking all 1,599 redirects to the 51 articles.
- **Bots excluded.** `agent=user`.

**Album selection.** 162 official studio albums with a full release date. Dropped: 7 released after (or within 8 weeks of) the artist's death, 4 that MusicBrainz typed as plain albums but are soundtracks, "best of" collections or a Japanese edition, 2 released on the same day as another (merged), and 5 that overlap another album by the same artist. **144 albums by 38 artists** remain.

## Method

- **Window:** day −35 to +55 around the release date.
- **Usual level (baseline):** median daily views on days −35 to −8.
- **Peak:** highest day in 0..13 ÷ baseline. **Extra attention:** Σ(views − baseline) over days 0..55 ÷ baseline, i.e. "days' worth of usual attention added in eight weeks".
- **Comparison:** the same metrics on 1,538 ordinary Fridays (same artists, no album within 90 days, every 12 weeks).
- **Forecast check:** rolling origin in release order; each album predicted only from earlier albums (103 forecasts, Mar 2017 – Jun 2026). Methods, simplest first: median of all earlier albums; the artist's previous album; the artist's median so far. Metric: mean absolute error of log10(extra attention), shown as a factor.

## Findings

1. **Release day is a spike.** The median album peaks at **4.7×** the usual level (middle half 2.7–7.5×). Ordinary Fridays peak at 1.3×; only 5.3% of them reach 4.7×, and 68.8% of albums beat the Fridays' 90th percentile (3.2×).
2. **It fades fast.** On the day-by-day median curve, half of the rise is gone after **5 days**; it is 1.2× at day 28 and 1.0× at day 55. 45% of the eight-week extra attention arrives in the first week. A typical album adds **28 days' worth** of usual attention (middle half 12–58; ordinary Fridays 2.9).
3. **Bigger artists get bigger jumps, not smaller.** Rank correlation between usual daily views and peak: +0.31. Extra attention relative to the baseline is unrelated to size (0.03).
4. **Past albums do not predict the next one.** The median of all earlier albums is typically off by a factor of 2.7. The artist's own previous album (3.5) and their median so far (3.4) are worse.

Largest eight-week extra attention: SOUR (Olivia Rodrigo, 173 days), DeBÍ TiRAR MáS FOToS (Bad Bunny, 165), Kamikaze (Eminem, 151), Mr. Morale & the Big Steppers (Kendrick Lamar, 150; highest single-day peak, 39×).

## Caveats

- Wikipedia views measure attention, not streams, sales or chart position.
- English Wikipedia only; artists with mostly non-English audiences are undercounted.
- 51 well-known artists, mostly US/UK. No Turkish artists, no newcomers.
- Release dates are MusicBrainz's earliest release date; a few are a day or two off.
- A before/after comparison is not proof of cause: singles, promotion and tours cluster around releases.
- When singles or a tour lift the four weeks before release, the baseline is too high and the album looks smaller. 10 albums end up with negative extra attention, e.g. 1989 (Taylor's Version), released during the Eras Tour.

## Reproduce

```bash
python veri_hazirla.py   # downloads from both APIs (falls back to the checksummed snapshot in veri/)
python analiz.py         # numbers -> sonuclar.json, then dashboard.py -> dashboard.html
```

The snapshot in `veri/_aktarim_*.txt` was exported from a browser on 2026-10-05, because the analysis machine could not reach the APIs directly. Each file is checked against the checksum recorded at export.
