"""Istanbul reservoirs: how low will they go this autumn — and can we tell in May?

Run:  python veri_hazirla.py   (once; builds veri/*.csv)
      python analiz.py         (prints the numbers, writes sonuclar.json, then builds the
                                interactive dashboard via dashboard.py)

Question
    Every year Istanbul's reservoirs peak in spring and fall to a low in autumn.
    If you only know the city-wide fill level on 1 May, how well can you
    predict that autumn low — and how much better is that than "an average year"?

Design
    * Unit: hydrological year Y = 1 May Y .. end of February Y+1. 2001-2023 (23 years).
    * Target: lowest weekly city-wide fill (%) in that window.
    * Predictor: the fill level in the week containing 1 May.
    * Rolling-origin backtest: to predict year Y, use only years < Y.
      First forecast year 2006 (5 training years), last 2023 -> 18 forecasts.
    * Methods, simplest first:
        climatology   mean of past autumn lows (ignores May)
        subtract      May level - median past May-to-low drop, floored at 0
        ols           linear regression low ~ May level on past years
    * Metric: mean absolute error in percentage points (pp).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).parent

VERI = HERE / "veri"
CAPACITY = {"Omerli": 235.371, "Darlik": 107.5, "Elmali": 9.6, "Terkos": 162.241,
            "Alibey": 34.143, "Buyukcekmece": 148.943, "Sazlidere": 88.73,
            "Kazandere": 17.424, "Pabucdere": 58.5, "Istrancalar": 6.231}
DISPLAY = {"Omerli": "Ömerli", "Darlik": "Darlık", "Elmali": "Elmalı", "Terkos": "Terkos",
           "Alibey": "Alibey", "Buyukcekmece": "Büyükçekmece", "Sazlidere": "Sazlıdere",
           "Kazandere": "Kazandere", "Pabucdere": "Pabuçdere", "Istrancalar": "Istrancalar"}
TOTAL_CAP = sum(CAPACITY.values())
LOW = 20.0            # "critically low" line used in the text, % full
FIRST_TEST = 2006


def load():
    weekly = pd.read_csv(VERI / "toplam_haftalik.csv", parse_dates=["week_start"])
    dams = pd.read_csv(VERI / "baraj_aylik.csv")
    official = pd.read_csv(VERI / "resmi_aylik.csv")
    return weekly, dams, official


def validate(dams: pd.DataFrame, official: pd.DataFrame) -> dict:
    """Our capacity-weighted total must reproduce ISKI's own city-wide figure."""
    d = dams.copy()
    d["weighted"] = sum(d[k] * c for k, c in CAPACITY.items()) / TOTAL_CAP
    j = d.merge(official, on="month")
    j = j[j["month"] < "2021-04"]              # official series stops on 7 Apr 2021
    err = (j["weighted"] - j["fill_pct_official"]).abs()
    return {"months_compared": int(len(j)), "mae_pp": round(float(err.mean()), 3),
            "max_abs_pp": round(float(err.max()), 2)}


def yearly(weekly: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for y in range(2001, 2024):
        may1 = pd.Timestamp(y, 5, 1)
        wk = weekly[(weekly.week_start <= may1) & (weekly.week_start > may1 - pd.Timedelta(days=7))]
        seg = weekly[(weekly.week_start > may1) & (weekly.week_start < pd.Timestamp(y + 1, 3, 1))]
        i = seg["fill_pct"].idxmin()
        rows.append({"year": y, "may": float(wk["fill_pct"].iloc[0]),
                     "low": float(seg.loc[i, "fill_pct"]), "low_week": seg.loc[i, "week_start"]})
    d = pd.DataFrame(rows)
    d["drop"] = d["may"] - d["low"]
    return d


def backtest(d: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for y in range(FIRST_TEST, int(d["year"].max()) + 1):
        train, test = d[d.year < y], d[d.year == y].iloc[0]
        b = np.polyfit(train["may"], train["low"], 1)
        rows.append({"year": y, "may": test["may"], "actual": test["low"],
                     "climatology": train["low"].mean(),
                     "subtract": max(0.0, test["may"] - train["drop"].median()),
                     "ols": float(np.polyval(b, test["may"]))})
    return pd.DataFrame(rows)


def dam_risk(dams: pd.DataFrame) -> pd.DataFrame:
    full_years = dams[(dams.month >= "2001-01") & (dams.month <= "2023-12")]
    share = (full_years[list(CAPACITY)] < LOW).mean() * 100
    return pd.DataFrame({"dam": [DISPLAY[k] for k in share.index], "key": share.index,
                         "share_low": share.values.round(1),
                         "capacity": [CAPACITY[k] for k in share.index]})


def main() -> dict:
    weekly, dams, official = load()
    val = validate(dams, official)
    d = yearly(weekly)
    bt = backtest(d)
    risk = dam_risk(dams)

    mae = {m: round(float((bt[m] - bt["actual"]).abs().mean()), 1) for m in ["climatology", "subtract", "ols"]}
    err_sub = bt["subtract"] - bt["actual"]
    worst = bt.loc[err_sub.abs().sort_values(ascending=False).index[:2], "year"].tolist()
    low_years = d[d["low"] < LOW].sort_values("low")
    rec = low_years.iloc[0]
    res = {
        "validation": val,
        "years": int(len(d)),
        "drop_median_pp": round(float(d["drop"].median()), 1),
        "drop_q1_pp": round(float(d["drop"].quantile(.25)), 1),
        "drop_q3_pp": round(float(d["drop"].quantile(.75)), 1),
        "drop_median_mcm": round(float(d["drop"].median()) / 100 * TOTAL_CAP),
        "corr_may_low": round(float(d["may"].corr(d["low"])), 2),
        "mae_pp": mae,
        "mae_reduction_pct": round(100 * (1 - mae["subtract"] / mae["climatology"])),
        "forecast_years": [int(bt.year.min()), int(bt.year.max()), int(len(bt))],
        "worst_misses": {int(y): round(float(err_sub[bt.year == y].iloc[0]), 1) for y in worst},
        "years_below_20": [int(y) for y in low_years["year"]],
        "record_low": {"year": int(rec["year"]), "pct": rec["low"], "week": str(rec["low_week"].date())},
        "may_below_50": {"years": [int(y) for y in d.loc[d["may"] < 50, "year"]],
                         "ended_below_20": int((d.loc[d["may"] < 50, "low"] < LOW).sum())},
        "dam_share_months_below_20": dict(zip(risk["dam"], risk["share_low"])),
        "yearly": d.assign(low_week=d.low_week.dt.date.astype(str)).round(1).to_dict("records"),
        "backtest": bt.round(1).to_dict("records"),
    }
    (HERE / "sonuclar.json").write_text(json.dumps(res, indent=2, ensure_ascii=False, default=float))
    if "--no-dashboard" not in sys.argv:
        from dashboard import build          # interactive page: map + time player + linked charts
        for p in build(res):
            print("written:", p)
    return res


if __name__ == "__main__":
    out = main()
    for k in ["validation", "drop_median_pp", "drop_q1_pp", "drop_q3_pp", "drop_median_mcm", "corr_may_low",
              "mae_pp", "mae_reduction_pct", "forecast_years", "worst_misses", "years_below_20",
              "record_low", "dam_share_months_below_20"]:
        print(f"{k}: {out[k]}")
