"""Build the three analysis-ready CSVs for the Istanbul reservoir analysis.

Source: Istanbul Metropolitan Municipality (IBB) Open Data Portal, published by
ISKI, licence "IBB Open Data License".
  * 10 dams, daily fill rate, 2000-10-23 .. 2024-02-19
    https://data.ibb.gov.tr/dataset/istanbul-barajlari-gunluk-doluluk-oranlari
  * city-wide daily fill rate + stored water, 2005-01-01 .. 2021-04-07
    (the same series is mirrored on Kaggle as "istanbul-baraj-doluluk-dam-occupancy-rate")
    https://data.ibb.gov.tr/dataset/istanbul-dam-occupany-rates-data

Two modes
---------
    python veri_hazirla.py            # download from the IBB CKAN API (needs internet)
    python veri_hazirla.py --aktarim  # rebuild from the compact snapshot in veri/_aktarim_*.txt

Outputs (veri/)
---------------
    toplam_haftalik.csv  week_start, fill_pct        capacity-weighted city total, 7-day means
    baraj_aylik.csv      month, <10 dams>            monthly mean fill per dam, %
    resmi_aylik.csv      month, fill_pct_official    ISKI's own city-wide figure, monthly mean, %

Cleaning rules (all found in the raw data, see BULGULAR.md):
    1. 130 rows (2023-04-01 .. 2023-08-08) are stored as percentages (e.g. 60.65)
       while every other row is a fraction (0.6065)  -> divide by 100.
    2. In the same block, days 1-12 have day and month swapped (2023-01-04 means
       1 April 2023)  -> a date that is not "previous day + 1" but becomes so after
       swapping day/month is swapped back.
    3. 2007-12-25 is a one-day spike in every dam (city total 59.6% between two
       days at 25.6% and 25.7%; ISKI's own series says 25.7%)  -> replaced by the
       mean of its neighbours.
    4. The official series has two duplicated dates (2020-04-19, 2021-01-07)
       -> first record kept; and two missing days -> left missing.
"""
from __future__ import annotations

import json
import sys
import urllib.request
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

HERE = Path(__file__).parent
VERI = HERE / "veri"

API = "https://data.ibb.gov.tr/api/3/action/datastore_search"
RES_DAMS = "af0b3902-cfd9-4096-85f7-e2c3017e4f21"
RES_TOTAL = "b68cbdb0-9bf5-474c-91c4-9256c07c4bdf"

DAMS = ["Omerli", "Darlik", "Elmali", "Terkos", "Alibey", "Buyukcekmece",
        "Sazlidere", "Kazandere", "Pabucdere", "Istrancalar"]
# Active storage capacity, million m3 (ISKI). Check: stored water / fill rate in the
# official series gives 868.6 on the median day; these sum to 868.683.
CAPACITY = {"Omerli": 235.371, "Darlik": 107.5, "Elmali": 9.6, "Terkos": 162.241,
            "Alibey": 34.143, "Buyukcekmece": 148.943, "Sazlidere": 88.73,
            "Kazandere": 17.424, "Pabucdere": 58.5, "Istrancalar": 6.231}
START = date(2000, 10, 23)          # first day of the dam series (a Monday)
START_MONTH_OFFICIAL = "2005-01"


# --------------------------------------------------------------------------- #
# Mode 1: from the API                                                        #
# --------------------------------------------------------------------------- #
def _fetch(resource_id: str) -> list[dict]:
    rows, offset = [], 0
    while True:
        url = f"{API}?resource_id={resource_id}&limit=5000&offset={offset}&sort=_id"
        with urllib.request.urlopen(url, timeout=60) as r:
            res = json.load(r)["result"]
        rows += res["records"]
        offset += 5000
        if offset >= res["total"]:
            return rows


def _swap_day_month(d: date) -> date | None:
    try:
        return date(d.year, d.day, d.month)
    except ValueError:
        return None


def clean_dams(records: list[dict]) -> pd.DataFrame:
    out, prev = [], None
    for r in records:
        d = date.fromisoformat(r["Tarih"][:10])
        if prev is not None and d != prev + timedelta(days=1):
            if _swap_day_month(d) == prev + timedelta(days=1):
                d = prev + timedelta(days=1)                       # rule 2
            else:
                raise ValueError(f"unexpected date jump {prev} -> {d} (_id {r['_id']})")
        vals = {k: float(r[k]) for k in DAMS}
        if max(vals.values()) > 1.5:                               # rule 1
            vals = {k: v / 100 for k, v in vals.items()}
        out.append({"date": d, **vals})
        prev = d
    df = pd.DataFrame(out)
    df["total"] = sum(df[k] * CAPACITY[k] for k in DAMS) / sum(CAPACITY.values())
    # rule 3: isolated one-day spikes (>10 points away from both neighbours, same sign)
    t = df["total"]
    up, down = t - t.shift(1), t - t.shift(-1)
    spike = (up.abs() > .10) & (down.abs() > .10) & (up * down > 0)
    for i in df.index[spike]:
        df.loc[i, DAMS + ["total"]] = (df.loc[i - 1, DAMS + ["total"]] + df.loc[i + 1, DAMS + ["total"]]) / 2
    return df


def aggregate(df: pd.DataFrame, official: pd.DataFrame) -> None:
    VERI.mkdir(exist_ok=True)
    # weekly: consecutive 7-day blocks from START, keep blocks with >= 4 days
    blk = (pd.to_datetime(df["date"]) - pd.Timestamp(START)).dt.days // 7
    g = df.groupby(blk)["total"].agg(["mean", "size"])
    g = g[g["size"] >= 4]
    weekly = pd.DataFrame({
        "week_start": [START + timedelta(days=7 * int(b)) for b in g.index],
        "fill_pct": (g["mean"] * 1000).round().astype(int) / 10,
    })
    weekly.to_csv(VERI / "toplam_haftalik.csv", index=False)

    df["month"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m")
    monthly = df.groupby("month")[DAMS].mean()
    ((monthly * 1000).round().astype(int) / 10).reset_index().to_csv(VERI / "baraj_aylik.csv", index=False)

    off = official.drop_duplicates("DATE", keep="first").copy()          # rule 4
    off["month"] = off["DATE"].str[:7]
    om = off.groupby("month")["GENERAL_DAM_OCCUPANCY_RATE"].mean().round(2)
    om.rename("fill_pct_official").reset_index().to_csv(VERI / "resmi_aylik.csv", index=False)


def from_api() -> None:
    dams = clean_dams(_fetch(RES_DAMS))
    official = pd.DataFrame(_fetch(RES_TOTAL))
    aggregate(dams, official)


# --------------------------------------------------------------------------- #
# Mode 2: from the compact snapshot (used where the API is not reachable)     #
# --------------------------------------------------------------------------- #
def from_transfer() -> None:
    """The snapshot holds the *same* aggregates as integers (per-mille / per-10k),
    produced by running the rules above on 2026-09-25."""
    w = [int(x) for x in (VERI / "_aktarim_haftalik_toplam.txt").read_text().strip().split(",")]
    pd.DataFrame({"week_start": [START + timedelta(days=7 * i) for i in range(len(w))],
                  "fill_pct": [v / 10 for v in w]}).to_csv(VERI / "toplam_haftalik.csv", index=False)

    rows = []
    for rec in (VERI / "_aktarim_baraj_aylik.txt").read_text().strip().split(";"):
        m, *v = rec.split(",")
        rows.append({"month": m, **{k: int(x) / 10 for k, x in zip(DAMS, v, strict=True)}})
    pd.DataFrame(rows).to_csv(VERI / "baraj_aylik.csv", index=False)

    rows = []
    for rec in (VERI / "_aktarim_resmi_aylik.txt").read_text().strip().split(";"):
        m, v = rec.split(",")
        rows.append({"month": m, "fill_pct_official": int(v) / 100})
    pd.DataFrame(rows).to_csv(VERI / "resmi_aylik.csv", index=False)


if __name__ == "__main__":
    if "--aktarim" in sys.argv:
        from_transfer()
    else:
        try:
            from_api()
        except OSError as e:  # no internet, portal down, ...
            print(f"API not reachable ({e}); falling back to the snapshot.")
            from_transfer()
    print("written:", *sorted(p.name for p in VERI.glob("*.csv")))
