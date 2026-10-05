"""How much Wikipedia attention does a new album buy — and how long does it last?

Run:  python veri_hazirla.py   (once; builds veri/*.csv)
      python analiz.py         (prints the numbers, writes sonuclar.json, builds the dashboard)

Question
    When an artist releases a studio album, how much do views of their English Wikipedia
    article rise, how fast does the rise fade, and is that more than an ordinary week?

Design
    * Artists: 51 well-known artists, each matched to their English Wikipedia article and
      MusicBrainz id (see veri_hazirla.py).
    * Events: official studio albums (MusicBrainz release groups, primary type Album, no
      secondary type) with a full release date, Aug 2015 – Jul 2026, by a living artist,
      not overlapping another album by the same artist (veri_hazirla.py has the rules).
    * Window: day -35 .. +55 around the release date (day 0).
      baseline = median daily views on days -35 .. -8 (four weeks, ending a week before)
      peak     = highest day in 0 .. 13, divided by baseline
      excess   = sum over days 0 .. 55 of (views - baseline), divided by baseline
                 = "extra baseline-days of attention in the first eight weeks"
    * Comparison: the same three numbers on ordinary Fridays (same artists, no album
      within 90 days, every 12 weeks) -> what a random week looks like.
    * Forecast check (rolling origin, chronological): predict an album's excess using only
      albums released before it. Simplest first:
        all_median     median excess of every earlier album
        prev_album     the same artist's previous album
        artist_median  median of the same artist's earlier albums
      metric: mean absolute error of log10(excess) -> "typically off by a factor of x".
"""
from __future__ import annotations

import json
import re
import sys
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).parent
VERI = HERE / "veri"
D0 = date(2015, 7, 1)
OFF = list(range(-35, 56))          # window offsets
BASE = (-35, -8)                    # inclusive
PEAK = (0, 13)
EXC = (0, 55)
MIN_TRAIN = 20                      # earlier albums needed before the first forecast



def display(title: str) -> str:
    """Article title as a name: 'Drake_(musician)' -> 'Drake'. (MusicBrainz names differ: 'Ye', 'JAŸ-Z'.)"""
    return re.sub(r"\s*\(.*\)$", "", title.replace("_", " "))


def ds(i: int) -> str:
    return str(D0 + timedelta(days=int(i)))


def load():
    art = pd.read_csv(VERI / "sanatcilar.csv")
    alb = pd.read_csv(VERI / "albumler.csv")
    win = pd.read_csv(VERI / "pencereler.csv")
    pla = pd.read_csv(VERI / "plasebo.csv")
    mon = pd.read_csv(VERI / "aylik.csv")
    return art, alb, win, pla, mon


def metrics(w: np.ndarray) -> tuple[float, float, float]:
    """w: 91 daily values for offsets -35..55."""
    i = lambda o: o + 35
    b = float(np.median(w[i(BASE[0]):i(BASE[1]) + 1]))
    peak = float(w[i(PEAK[0]):i(PEAK[1]) + 1].max()) / b
    exc = float((w[i(EXC[0]):i(EXC[1]) + 1] - b).sum()) / b
    return b, peak, exc


def events(win: pd.DataFrame, art: pd.DataFrame) -> pd.DataFrame:
    cols = [f"d{o}" for o in OFF]
    m = np.array([metrics(r) for r in win[cols].to_numpy(float)])
    e = win[["title", "date", "album"]].copy()
    e["baseline"], e["peak"], e["excess"] = m[:, 0], m[:, 1], m[:, 2]
    e["name"] = e["title"].map(display)
    return e.sort_values("date").reset_index(drop=True)


def curve(win: pd.DataFrame, e: pd.DataFrame) -> dict:
    cols = [f"d{o}" for o in OFF]
    lift = win[cols].to_numpy(float) / e.set_index(["title", "date"]).loc[
        list(zip(win.title, win.date)), "baseline"].to_numpy()[:, None]
    q = np.nanpercentile(lift, [25, 50, 75], axis=0)
    med = q[1]
    pk = int(np.argmax(med))                       # index of the median peak
    half = 1 + (med[pk] - 1) / 2
    after = np.where(med[pk:] <= half)[0]
    return {"q25": q[0].round(3).tolist(), "q50": med.round(3).tolist(), "q75": q[2].round(3).tolist(),
            "peak_day": OFF[pk], "peak_lift": round(float(med[pk]), 2),
            "half_life_days": int(after[0]) if len(after) else None,
            "lift_day7": round(float(med[OFF.index(7)]), 2), "lift_day28": round(float(med[OFF.index(28)]), 2),
            "lift_day55": round(float(med[OFF.index(55)]), 2),
            "pre_week_lift": round(float(np.median(med[OFF.index(-7):OFF.index(-1) + 1])), 2)}


def backtest(e: pd.DataFrame) -> pd.DataFrame:
    rows = []
    le = np.log10(e["excess"].clip(lower=0.5))     # excess can be ~0 or negative for flops
    for i in range(len(e)):
        past = e.iloc[:i]
        mine = past[past.title == e.title.iloc[i]]
        if i < MIN_TRAIN or mine.empty:
            continue
        lp, lm = le.iloc[:i], le[mine.index]
        rows.append({"title": e.title.iloc[i], "date": e.date.iloc[i], "album": e.album.iloc[i],
                     "actual": le.iloc[i], "all_median": float(lp.median()),
                     "prev_album": float(lm.iloc[-1]), "artist_median": float(lm.median())})
    return pd.DataFrame(rows)


def first_week_share(win: pd.DataFrame, e: pd.DataFrame) -> float:
    """Median share of an album's 8-week extra attention that arrives in days 0..6."""
    b = e.set_index(["title", "date"]).loc[list(zip(win.title, win.date))]
    first = win[[f"d{o}" for o in range(0, 7)]].sum(axis=1).to_numpy() - 7 * b["baseline"].to_numpy()
    total = b["excess"].to_numpy() * b["baseline"].to_numpy()
    ok = total > 0
    return round(float(np.median(first[ok] / total[ok]) * 100))


def spearman(a, b) -> float:
    return float(pd.Series(a).rank().corr(pd.Series(b).rank()))


def main() -> dict:
    art, alb, win, pla, mon = load()
    e = events(win, art)
    cv = curve(win, e)
    bt = backtest(e)
    methods = ["all_median", "prev_album", "artist_median"]
    mae = {m: round(float((bt[m] - bt["actual"]).abs().mean()), 3) for m in methods}
    best = min(mae, key=mae.get)

    plc = pla[pla.peak > 0]
    peak_med, pla_med = float(e.peak.median()), float(plc.peak.median())
    status = alb["status"].value_counts().to_dict()
    top = e.sort_values("excess", ascending=False).head(5)
    low = e.sort_values("excess").head(5)

    res = {
        "coverage": {"artists": int(art.shape[0]), "days": 4114, "first_day": ds(0), "last_day": ds(4113)},
        "albums": {"candidates": int(len(alb)), "kept": int(status.get("kept", 0)),
                   "dropped": {k: int(v) for k, v in status.items() if k != "kept"},
                   "artists_with_album": int(e.title.nunique())},
        "former_titles": {"Drake": ["Drake (rapper)", "Drake (entertainer)"], "Jay-Z": ["Jay Z"],
                          "BTS": ["Bangtan Boys", "BTS (band)"], "Blackpink": ["Black Pink"],
                          "Wizkid": ["Wizkid (musician)"], "Sia": ["Sia (musician)", "Sia Furler"]},
        "placebo_n": int(len(pla)), "placebo_artists": int(pla.title.nunique()),
        "peak": {"album_median": round(peak_med, 2), "album_q1": round(float(e.peak.quantile(.25)), 2),
                 "album_q3": round(float(e.peak.quantile(.75)), 2),
                 "placebo_median": round(pla_med, 2), "placebo_q90": round(float(plc.peak.quantile(.9)), 2),
                 "share_placebo_above_album_median": round(float((plc.peak >= peak_med).mean() * 100), 1),
                 "share_albums_above_placebo_q90": round(float((e.peak > plc.peak.quantile(.9)).mean() * 100), 1),
                 "albums_below_1_5x": int((e.peak < 1.5).sum())},
        "excess": {"album_median": round(float(e.excess.median()), 1),
                   "album_q1": round(float(e.excess.quantile(.25)), 1), "album_q3": round(float(e.excess.quantile(.75)), 1),
                   "placebo_median": round(float(pla.excess.median()), 1),
                   "first_week_share_pct": first_week_share(win, e),
                   "albums_negative": int((e.excess < 0).sum())},
        "curve": cv,
        "size_vs_lift": {"spearman_baseline_peak": round(spearman(e.baseline, e.peak), 2),
                         "spearman_baseline_excess": round(spearman(e.baseline, e.excess), 2)},
        "backtest": {"n": int(len(bt)), "first": str(bt.date.min()), "last": str(bt.date.max()),
                     "mae_log10": mae, "factor": {m: round(10 ** v, 2) for m, v in mae.items()}, "best": best,
                     "improvement_pct": round(100 * (1 - mae[best] / mae["all_median"]))},
        "top_excess": top[["name", "album", "date", "peak", "excess"]].round(1).to_dict("records"),
        "low_excess": low[["name", "album", "date", "peak", "excess"]].round(1).to_dict("records"),
        "events": e.round(3).to_dict("records"),
        "backtest_rows": bt.round(3).to_dict("records"),
    }
    (HERE / "sonuclar.json").write_text(json.dumps(res, indent=2, ensure_ascii=False, default=float))
    if "--no-dashboard" not in sys.argv:
        from dashboard import build
        for p in build(res):
            print("written:", p)
    return res


if __name__ == "__main__":
    out = main()
    for k in ["coverage", "albums", "placebo_n", "peak", "excess", "curve", "size_vs_lift", "backtest"]:
        v = out[k]
        if k == "curve":
            v = {x: y for x, y in v.items() if not x.startswith("q")}
        print(f"{k}: {v}")
    print("top:", [(r["name"], r["album"], r["excess"]) for r in out["top_excess"]])
