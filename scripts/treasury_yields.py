"""
Fetches the 5 US Treasury constant-maturity yields from FRED (Federal
Reserve Bank of St. Louis) — a free, official, keyless-to-browse but
key-required-to-fetch source. Kept as its own small module rather than
folded into the stock provider abstraction, since this is macro/rates
data with a completely different shape, not a stock quote.

Needs FRED_API_KEY set (get a free key at
https://fred.stlouisfed.org/docs/api/api_key.html — takes a couple of
minutes, no cost, no credit card).
"""

import os
from datetime import datetime, timezone

import requests

FRED_SERIES = {
    "3mo": "DGS3MO",
    "1yr": "DGS1",
    "2yr": "DGS2",
    "5yr": "DGS5",
    "10yr": "DGS10",
}

FRED_API_KEY = os.environ.get("FRED_API_KEY", "")


def fetch_latest_yield(series_id):
    """
    Returns the most recent non-missing value for a FRED series.
    FRED marks non-trading days (holidays/weekends) with "." instead of
    omitting them, so this pulls a small batch of recent observations and
    picks the first one that's an actual number.
    """
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "sort_order": "desc",
        "limit": 10,  # small buffer past holidays/weekends
    }
    resp = requests.get(url, params=params, timeout=30)
    if resp.status_code != 200:
        print(f"    WARNING: FRED request failed for {series_id}: HTTP {resp.status_code}")
        return None, None
    data = resp.json()
    for obs in data.get("observations", []):
        if obs["value"] != ".":
            return float(obs["value"]), obs["date"]
    return None, None


def fetch_treasury_yields():
    """
    Returns a dict shaped for direct use by the Fixed Income table:
        {
          "3mo": {"yield_pct": 3.76, "date": "2026-09-04"},
          "1yr": {...}, "2yr": {...}, "5yr": {...}, "10yr": {...},
          "fetched_at": "2026-09-05T12:00:00+00:00"
        }
    Any tenor FRED can't resolve is left as None rather than guessed —
    the frontend shows "—" for missing values instead of a wrong number.
    """
    if not FRED_API_KEY:
        print("  WARNING: FRED_API_KEY not set — skipping treasury yields (see scripts/treasury_yields.py)")
        return None

    result = {}
    for label, series_id in FRED_SERIES.items():
        print(f"  fetching {label} Treasury yield ({series_id})...")
        value, date = fetch_latest_yield(series_id)
        result[label] = {"yield_pct": value, "date": date}

    result["fetched_at"] = datetime.now(timezone.utc).isoformat()
    return result


if __name__ == "__main__":
    # Standalone test: `python treasury_yields.py` — lets you verify this
    # piece works on its own before it's wired into the full fetch_data.py
    # pipeline, so a mistake here doesn't get lost inside a 5-minute run.
    import json as _json

    yields = fetch_treasury_yields()
    print("\nResult:")
    print(_json.dumps(yields, indent=2))
