"""
Builds one consolidated, searchable index across every asset type on the
site: stocks (all markets), ETFs, Treasury tenors, and macro indicators.
Regenerated every time fetch_data.py runs, so it automatically stays
current as tickers are added or removed from tickers.json/etfs.json —
nothing here needs manual updating when the watchlists change.

Written to web/public/data/_search_index.json, loaded once client-side by
the search box component and filtered in-browser (small enough dataset —
a few hundred entries — that a live per-keystroke API call isn't needed).
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TICKERS_FILE = Path(__file__).resolve().parent / "tickers.json"
ETFS_FILE = Path(__file__).resolve().parent / "etfs.json"
DATA_DIR = ROOT / "web" / "public" / "data"

TREASURY_TENORS = [
    ("10yr", "US 10-Year Treasury"),
    ("5yr", "US 5-Year Treasury"),
    ("2yr", "US 2-Year Treasury"),
    ("1yr", "US 1-Year Treasury"),
    ("3mo", "US 3-Month Treasury"),
]

INDICATORS = [
    ("m2_supply", "M2 Money Supply"),
    ("fed_balance_sheet", "Fed Balance Sheet"),
    ("bank_credit", "Total Bank Credit"),
]


def build_search_index():
    index = []

    with open(TICKERS_FILE) as f:
        tickers_config = json.load(f)
    for market, cfg in tickers_config.items():
        if market.startswith("_"):
            continue
        for t in cfg.get("tickers", []):
            index.append({
                "symbol": t["symbol"],
                "name": t["name"],
                "type": "stock",
                "market": market,
                "url": f"/markets/{market}/{t['symbol']}",
            })

    with open(ETFS_FILE) as f:
        etfs_config = json.load(f)
    for etf in etfs_config.get("etfs", []):
        index.append({
            "symbol": etf["symbol"],
            "name": etf["name"],
            "type": "etf",
            "market": None,
            "url": f"/etf/{etf['symbol']}",
        })

    for tenor, label in TREASURY_TENORS:
        index.append({
            "symbol": tenor,
            "name": label,
            "type": "treasury",
            "market": None,
            "url": f"/treasury/{tenor}",
        })

    for key, label in INDICATORS:
        index.append({
            "symbol": key,
            "name": label,
            "type": "indicator",
            "market": None,
            "url": f"/indicator/{key}",
        })

    return index


def write_search_index():
    index = build_search_index()
    with open(DATA_DIR / "_search_index.json", "w") as f:
        json.dump({"items": index}, f, indent=2)
    print(f"  wrote search index: {len(index)} items")
    return index


if __name__ == "__main__":
    write_search_index()
