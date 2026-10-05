"""Build the analysis-ready tables for "How much attention does a new album buy?" (2026-W41).

Sources (both open, no login):
  * Wikimedia Pageviews REST API: daily views of each artist's English Wikipedia article,
    agent=user (bots excluded), all-access, 1 Jul 2015 .. 4 Oct 2026. Data: CC0.
  * MusicBrainz web service: artist life span and album release groups. Core data: CC0.
Artists: 51 well-known artists (the selection follows the Kaggle set "Global Music Popularity &
Cultural Attention", blixture), each matched to their English Wikipedia article and MusicBrainz id.

Two modes
    python veri_hazirla.py            # download from both APIs (needs internet; ~10 min)
    python veri_hazirla.py --aktarim  # rebuild from the snapshot in veri/_aktarim_*.txt

The snapshot was produced on 2026-10-05 by running the same steps in a browser
(the analysis machine could not reach the APIs directly). Each _aktarim file is checked
against the checksum recorded at export (CHECKSUMS).

Outputs (veri/)
    sanatcilar.csv   title, mbid, name, type, country, begin, end, gender, first_day
    albumler.csv     title, date, status, album      every candidate album and why it was kept/dropped
    pencereler.csv   title, date, album, d-35 .. d55 daily views around each kept album (day 0 = release)
    plasebo.csv      title, day, date, peak, excess  the same metrics on ordinary Fridays
    aylik.csv        title, YYYY-MM ...              monthly views, thousands (for the overview heat strip)

Rules (applied identically in both modes)
  1. Article title: the current title plus former titles the article had before a page move
     (FORMER below). Without this, e.g. Drake's article has no history before 28 Jun 2016.
  2. Albums: MusicBrainz release groups, status "website-default" (official), primary type
     Album, no secondary type (drops live, compilation, soundtrack, remix ...), full release
     date between 2015-08-05 and 2026-07-12 (so the -35..+55 window fits in the data).
  3. Dropped: released after the artist's death or within 56 days before it (status
     after_death); titles matching "soundtrack|best of|hits|ver." (MusicBrainz typed them
     as plain albums; title_filter); a second album on the same day (merged into the first);
     any album with another album by the same artist in the 35 days before or 55 days after
     it (overlap: the windows would mix).
  4. Placebo: every 12th Friday from 2015-08-07 per artist, kept if the artist was alive, the
     article existed 35 days earlier and no studio album (any status) is within 90 days.
"""
from __future__ import annotations

import json
import re
import statistics
import sys
import time
import urllib.parse
import urllib.request
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

HERE = Path(__file__).parent
VERI = HERE / "veri"
D0, D1 = date(2015, 7, 1), date(2026, 10, 4)
N = (D1 - D0).days + 1                       # 4114 days
WIN = (-35, 55)
UA = {"User-Agent": "SertanSafak-weekly-analysis/1.0 (https://setosfk.github.io)"}

# (wikipedia title, musicbrainz id). Matched by id, not by name: MusicBrainz lists Kanye West
# as "Ye", and plain titles such as "Queen" or "Drake" are disambiguation pages.
ARTISTS = """Bruno_Mars afb680f2-b6eb-4cd7-a70b-a63b25c763d5
Taylor_Swift 20244d07-534f-4eff-b4d4-930878889970
Beyoncé 859d0860-d480-4efd-970c-c05d5f1776b8
The_Weeknd c8b03190-306c-4120-bb0b-6f2ebfc06ea9
Adele cc2c9c3c-b7bc-4b8b-84d8-4fbd8779e493
Ed_Sheeran b8a7c51f-362c-4dcb-a259-bc6e0095f0a6
Billie_Eilish f4abc0b5-3f7a-4eff-8f78-ac078dbce533
Lady_Gaga 650e7db6-b795-4eb5-a702-5ea2fc46c848
Michael_Jackson f27ec8db-af05-4f36-916e-3d57f91ecf5e
Queen_(band) 0383dadf-2a4e-4d10-a46a-e9e041da8eb3
Rihanna 73e5e69d-3554-40d8-8516-00cb38737a1c
Drake_(musician) 9fff2f8a-21e6-47de-a2b8-7f449929d43f
Kendrick_Lamar 381086ea-f511-4aba-bdf9-71c753dc5077
Kanye_West 164f0d73-1234-4e2c-8743-d77bf2191051
Justin_Bieber e0140a67-e4d1-4f13-8a01-364355bee46e
Ariana_Grande f4fdbb4c-e4b7-47a0-b83b-d91bbfcfa387
Katy_Perry 122d63fc-8671-43e4-9752-34e846d62a9c
Dua_Lipa 6f1a58bf-9b1b-49cf-a44a-6cefad7ae04f
Sabrina_Carpenter 1882fe91-cdd9-49c9-9956-8e06a3810bd4
Olivia_Rodrigo 6925db17-f35e-42f3-a4eb-84ee6bf5d4b0
The_Beatles b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d
Elvis_Presley 01809552-4f87-45b0-afff-2c6f0730a3be
Whitney_Houston 0307edfc-437c-4b48-8700-80680e66a228
Prince_(musician) 070d193a-845c-479f-980e-bef15710653e
David_Bowie 5441c29d-3602-4898-b1a1-b77fa23b8e50
Bob_Dylan 72c536dc-7137-4477-a521-567eeb840fa8
Stevie_Wonder 1ee18fb3-18a6-4c7f-8ba0-bc41cdd0462e
Marvin_Gaye afdb7919-059d-43c1-b668-ba1d265e7e42
Aretha_Franklin 2f9ecbed-27be-40e6-abca-6de49d50299e
Frank_Sinatra 197450cd-0124-4164-b723-3c22dd16494d
Eminem b95ce3ff-3d05-4e87-9e01-c97b66af13d4
Jay-Z f82bcf78-5b69-4622-a5ef-73800768d9ac
Nicki_Minaj 1036b808-f58c-4a3e-b461-a2c4492ecf1b
Cardi_B 2f3c4d70-0462-40da-bba3-0aec5772c556
Bad_Bunny 89aa5ecb-59ad-46f5-b3eb-2d424e941f19
J_Balvin 5bdeb32d-56a5-4b6d-a768-264101fa0a0a
Shakira bf24ca37-25f4-4e34-9aec-460b94364cfc
Daddy_Yankee 2f522f5c-111c-4ce8-8bd0-d82e97c227ad
BTS 0d79fe8e-ba27-4859-bb8c-2f255f346853
Blackpink 48646387-1664-4c9a-9139-9bfd091b823c
A._R._Rahman e0bba708-bdd3-478d-84ea-c706413bedab
Arijit_Singh ed3f4831-e3e0-4dc0-9381-f5649e9df221
Diljit_Dosanjh f931c961-b647-4861-be8c-f47d84a4de51
Lata_Mangeshkar aeb71bd8-447d-4415-8ea1-2b7d664f67e1
Kishore_Kumar 793b8f58-80ab-49b3-b5ae-d94034dab10c
Burna_Boy 78a19169-ac75-4868-b504-7e2e073118e0
Fela_Kuti 6514cffa-fbe0-4965-ad88-e998ead8a82a
Wizkid efc5d365-a448-4e2f-9b5f-4a7c84be725c
Stromae ab2528d9-719f-4261-8098-21849222a0f2
Daft_Punk 056e4f3e-d505-4dad-8ec1-d04f521cbb56
Sia 2f548675-008d-4332-876c-108b0c7ab9c5"""
ARTISTS = [tuple(l.split()) for l in ARTISTS.splitlines()]

# Former titles of the article. Found on 2026-10-05 by pulling monthly views for all 1,599
# redirects to the 51 articles and keeping those that carried >= 25% of the article's own views
# (and >= 20k) in at least 3 months; "... discography" redirects are separate articles that were
# merged later and are left out. Views of these titles are added over the whole period.
FORMER = {
    "Drake_(musician)": ["Drake_(rapper)", "Drake_(entertainer)"],
    "Jay-Z": ["Jay_Z"],
    "BTS": ["Bangtan_Boys", "BTS_(band)"],
    "Blackpink": ["Black_Pink"],
    "Wizkid": ["Wizkid_(musician)"],
    "Sia": ["Sia_(musician)", "Sia_Furler"],
}

# sum of all digit runs mod 1e9+7, recorded when the snapshot was exported from the browser
CHECKSUMS = {"_aktarim_sanatcilar.txt": 47047297, "_aktarim_albumler.txt": 335612,
             "_aktarim_pencereler.txt": 240292927, "_aktarim_plasebo.txt": 8878906,
             "_aktarim_aylik.txt": 2282699}

TITLE_DROP = re.compile(r"soundtrack|best of|hits|ver\.", re.I)


# --------------------------------------------------------------------------- #
# shared rules                                                                #
# --------------------------------------------------------------------------- #
def di(s: str) -> int:
    return (date.fromisoformat(s[:10]) - D0).days


def ds(i: int) -> str:
    return str(D0 + timedelta(days=int(i)))


def metrics(w: list[float]) -> tuple[float, float, float]:
    """The same three numbers analiz.py uses: baseline, peak (x baseline), excess (baseline-days)."""
    b = statistics.median(w[0:28])
    if b <= 0:
        return b, 0.0, 0.0
    return b, max(w[35:49]) / b, sum(v - b for v in w[35:91]) / b


def select_albums(rg: dict, life_end: dict, first: dict) -> tuple[pd.DataFrame, list[dict]]:
    """rg[title] = list of (id, album, first_release_date, primary, secondary). Returns all
    candidates with a status, and the kept events."""
    end = lambda t: di(life_end[t]) if life_end.get(t) else 10**9
    cand = [{"title": t, "d": di(g[2]), "date": g[2], "album": g[1]}
            for t, gs in rg.items() for g in gs
            if g[3] == "Album" and not g[4] and len(g[2]) == 10 and "2015-08-05" <= g[2] <= "2026-07-12"]
    for c in cand:
        c["status"] = ("after_death" if c["d"] >= end(c["title"]) - 56 else
                       "title_filter" if TITLE_DROP.search(c["album"]) else None)
    live = sorted((c for c in cand if c["status"] is None), key=lambda c: (c["title"], c["d"]))
    merged = []
    for c in live:
        p = merged[-1] if merged else None
        if p and p["title"] == c["title"] and p["d"] == c["d"]:
            c["status"] = "same_day_merged"
        else:
            merged.append(c)
    for c in merged:
        clash = any(o is not c and o["title"] == c["title"] and c["d"] - 35 < o["d"] <= c["d"] + 55 for o in merged)
        ok = first[c["title"]] >= 0 and first[c["title"]] <= c["d"] - 35 and c["d"] + 55 < N
        c["status"] = "overlap" if clash else "kept" if ok else "no_history"
    out = pd.DataFrame(cand).sort_values(["title", "d"])[["title", "date", "status", "album"]]
    return out, [c for c in merged if c["status"] == "kept"]


def placebo(daily: dict, rg: dict, life_end: dict, first: dict) -> list[dict]:
    end = lambda t: di(life_end[t]) if life_end.get(t) else 10**9
    alb = {t: [di(g[2]) for g in gs if g[3] == "Album" and not g[4] and len(g[2]) == 10] for t, gs in rg.items()}
    rows, fri0 = [], di("2015-08-07")
    for t, _ in ARTISTS:
        for d in range(fri0, N - 55, 84):
            if first[t] < 0 or first[t] > d - 35 or d >= end(t) - 56 or any(abs(a - d) <= 90 for a in alb.get(t, [])):
                continue
            b, p, e = metrics(daily[t][d - 35:d + 56])
            if b > 0:
                rows.append({"title": t, "day": d, "date": ds(d), "peak": round(p, 3), "excess": round(e, 2)})
    return rows


def months() -> list[str]:
    out, y, m = [], 2015, 7
    while (y, m) <= (2026, 9):
        out.append(f"{y}-{m:02d}")
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    return out


# --------------------------------------------------------------------------- #
# mode 1: from the APIs                                                       #
# --------------------------------------------------------------------------- #
def _get(url: str):
    for k in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return json.load(r)
        except Exception:                    # noqa: BLE001  (rate limit, timeout -> retry)
            if k == 3:
                raise
            time.sleep(2 + 2 * k)


def _views(title: str) -> list[int]:
    a = [0] * N
    url = ("https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/"
           f"{urllib.parse.quote(title, safe='')}/daily/{D0:%Y%m%d}/{D1:%Y%m%d}")
    try:
        for it in _get(url)["items"]:
            a[di(it["timestamp"][:4] + "-" + it["timestamp"][4:6] + "-" + it["timestamp"][6:8])] += it["views"]
    except Exception:                        # noqa: BLE001  404 = no views under that title
        pass
    return a


def from_api() -> None:
    daily, rg, life, meta = {}, {}, {}, []
    for t, mbid in ARTISTS:
        v = _views(t)
        for old in FORMER.get(t, []):
            v = [x + y for x, y in zip(v, _views(old))]
        daily[t] = v
        a = _get(f"https://musicbrainz.org/ws/2/artist/{mbid}?fmt=json"); time.sleep(1.1)
        ls = a.get("life-span") or {}
        life[t] = ls.get("end") or ""
        groups, off = [], 0
        while True:
            j = _get(f"https://musicbrainz.org/ws/2/release-group?artist={mbid}&type=album"
                     f"&release-group-status=website-default&limit=100&offset={off}&fmt=json"); time.sleep(1.1)
            groups += [(g["id"], g["title"], g.get("first-release-date") or "", g.get("primary-type"),
                        "+".join(g.get("secondary-types") or [])) for g in j["release-groups"]]
            off += 100
            if off >= j["release-group-count"]:
                break
        rg[t] = groups
        meta.append([t, mbid, a["name"], a.get("type") or "", a.get("country") or "", ls.get("begin") or "",
                     life[t], a.get("gender") or ""])
    write(daily, rg, life, meta)


def write(daily, rg, life, meta) -> None:
    VERI.mkdir(exist_ok=True)
    first = {t: next((i for i, x in enumerate(v) if x > 0), -1) for t, v in daily.items()}
    pd.DataFrame([m + [first[m[0]]] for m in meta],
                 columns=["title", "mbid", "name", "type", "country", "begin", "end", "gender", "first_day"]
                 ).to_csv(VERI / "sanatcilar.csv", index=False)
    cand, kept = select_albums(rg, life, first)
    cand.to_csv(VERI / "albumler.csv", index=False)
    rows = [[c["title"], c["date"], c["album"]] + daily[c["title"]][c["d"] - 35:c["d"] + 56] for c in kept]
    pd.DataFrame(rows, columns=["title", "date", "album"] + [f"d{o}" for o in range(WIN[0], WIN[1] + 1)]
                 ).to_csv(VERI / "pencereler.csv", index=False)
    pd.DataFrame(placebo(daily, rg, life, first)).to_csv(VERI / "plasebo.csv", index=False)
    ms = months()
    mon = []
    for t, _ in ARTISTS:
        s = {}
        for i, x in enumerate(daily[t]):
            k = ds(i)[:7]
            s[k] = s.get(k, 0) + x
        mon.append([t] + [round(s.get(k, 0) / 1000) for k in ms])
    pd.DataFrame(mon, columns=["title"] + ms).to_csv(VERI / "aylik.csv", index=False)


# --------------------------------------------------------------------------- #
# mode 2: from the snapshot                                                   #
# --------------------------------------------------------------------------- #
def _checked(name: str) -> str:
    s = (VERI / name).read_text().rstrip("\n")
    ck = sum(int(x) for x in re.findall(r"\d+", s)) % 1_000_000_007
    if name in CHECKSUMS and ck != CHECKSUMS[name]:
        raise ValueError(f"{name}: checksum {ck} != {CHECKSUMS[name]} recorded at export")
    return s


def from_transfer() -> None:
    VERI.mkdir(exist_ok=True)
    art = [l.split("|") for l in _checked("_aktarim_sanatcilar.txt").splitlines()]
    pd.DataFrame(art, columns=["title", "mbid", "name", "type", "country", "begin", "end", "gender", "first_day"]
                 ).to_csv(VERI / "sanatcilar.csv", index=False)
    alb = [l.split("|", 3) for l in _checked("_aktarim_albumler.txt").splitlines()]
    alb = pd.DataFrame(alb, columns=["title", "date", "status", "album"])
    alb.to_csv(VERI / "albumler.csv", index=False)
    kept = alb[alb.status == "kept"].set_index(["title", "date"])["album"]
    rows = []
    for l in _checked("_aktarim_pencereler.txt").splitlines():
        t, d, vals = l.split("|")
        rows.append([t, d, kept[(t, d)]] + [int(x) for x in vals.split(",")])
    pd.DataFrame(rows, columns=["title", "date", "album"] + [f"d{o}" for o in range(WIN[0], WIN[1] + 1)]
                 ).to_csv(VERI / "pencereler.csv", index=False)
    rows = []
    for l in _checked("_aktarim_plasebo.txt").splitlines():
        t, recs = l.split("|")
        for r in recs.split(";"):
            d, p, e = (int(x) for x in r.split(","))
            rows.append({"title": t, "day": d, "date": ds(d), "peak": p / 1000, "excess": e / 100})
    pd.DataFrame(rows).to_csv(VERI / "plasebo.csv", index=False)
    rows = [[l.split("|")[0]] + [int(x) for x in l.split("|")[1].split(",")] for l in _checked("_aktarim_aylik.txt").splitlines()]
    pd.DataFrame(rows, columns=["title"] + months()).to_csv(VERI / "aylik.csv", index=False)


if __name__ == "__main__":
    if "--aktarim" in sys.argv:
        from_transfer()
    else:
        try:
            from_api()
        except OSError as e:                 # no internet, API down, proxy ...
            print(f"APIs not reachable ({e}); rebuilding from the snapshot.")
            from_transfer()
    print("written:", *sorted(p.name for p in VERI.glob("*.csv")))
