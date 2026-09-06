"""
Fetches:
  1. The 5 US Treasury constant-maturity yields (DGS3MO/DGS1/DGS2/DGS5/DGS10)
     — daily, direct from the source, same as before.
  2. 10-year government bond yields for the OTHER 13 tracked markets
     (excluding US, which is covered above, and Russia, which has no data
     anywhere on this site), via FRED's mirror of OECD's "Long-term
     Government Bond Yields: 10-Year" series.

IMPORTANT DIFFERENCE between the two: the international series are
MONTHLY, with a real ~1-2 month reporting lag (confirmed via direct
research — e.g. Japan's series showed February 2026 as the latest point
when checked in early September 2026). This is a genuine trade-off,
accepted deliberately rather than a bug: it's still free, official OECD
data through the same FRED integration already in use, just not same-day
fresh the way the US series is. The frontend should label these rows
clearly as monthly figures so nobody mistakes them for daily quotes.

Series ID pattern: IRLTLT01{2-letter-country-code}M156N — the same
2-letter codes already used as "iso2" throughout tickers.json.

Needs FRED_API_KEY set (get a free key at
https://fred.stlouisfed.org/docs/api/api_key.html — takes a couple of
minutes, no cost, no credit card).
"""

import os
from datetime import datetime, timedelta, timezone

import requests

FRED_SERIES = {
    "3mo": "DGS3MO",
    "1yr": "DGS1",
    "2yr": "DGS2",
    "5yr": "DGS5",
    "10yr": "DGS10",
}

# Full FRED series IDs, not just iso2 codes — most follow the standard
# IRLTLT01{code}M156N pattern, but India does NOT (confirmed via direct
# research: India's actual series is INDIRLTLT01STM, a completely
# different naming convention, not just a different code). Storing full
# IDs directly here avoids ever silently generating a wrong ID for a
# country that turns out to be an exception like India.
#
# China, Brazil, and Turkey are left in this list even though no matching
# FRED series was found for any of them during research — the fetch
# function already handles a missing/empty series gracefully (prints a
# warning, omits that market from the result), so leaving them costs
# nothing and means this would start working automatically if FRED adds
# the data later, without needing a code change to notice.
INTERNATIONAL_10Y_SERIES = {
    "China": "IRLTLT01CNM156N",
    "Germany": "IRLTLT01DEM156N",
    "France": "IRLTLT01FRM156N",
    "UK": "IRLTLT01GBM156N",
    "Italy": "IRLTLT01ITM156N",
    "Spain": "IRLTLT01ESM156N",
    "India": "INDIRLTLT01STM",
    "Brazil": "IRLTLT01BRM156N",
    "Israel": "IRLTLT01ILM156N",
    "Turkey": "IRLTLT01TRM156N",
    "Canada": "IRLTLT01CAM156N",
    "Korea": "IRLTLT01KRM156N",
    "Japan": "IRLTLT01JPM156N",
}

FRED_API_KEY = os.environ.get("FRED_API_KEY", "")
HISTORY_DAYS = 90            # US daily series — enough for a meaningful chart
INTL_HISTORY_DAYS = 760      # international monthly series — ~2 years of monthly points


def _fred_observations(series_id, start_date):
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "sort_order": "asc",
        "observation_start": start_date,
    }
    resp = requests.get(url, params=params, timeout=30)
    if resp.status_code != 200:
        print(f"    WARNING: FRED request failed for {series_id}: HTTP {resp.status_code}")
        return []
    data = resp.json()
    return [o for o in data.get("observations", []) if o["value"] != "."]


def fetch_yield_history(series_id, days_back=HISTORY_DAYS):
    """
    Returns a list of {date, yield_pct} sorted ascending by date, for the
    last `days_back` calendar days. FRED marks non-trading days
    (holidays/weekends) with "." instead of omitting them — those are
    filtered out here rather than turned into a broken data point.
    """
    start_date = (datetime.now(timezone.utc) - timedelta(days=days_back)).strftime("%Y-%m-%d")
    obs = _fred_observations(series_id, start_date)
    return [{"date": o["date"], "yield_pct": float(o["value"])} for o in obs]


def fetch_international_10y_yields():
    """
    Returns:
        {
          "Germany": {"yield_pct": 3.34, "date": "2026-07-01", "history": [...]},
          "Japan": {...}, ... (however many of the 13 markets FRED
          actually has a matching series for — keyed by the same market
          names used everywhere else on the site)
        }
    A market missing from the result entirely means FRED had no matching
    series under the ID configured for it in INTERNATIONAL_10Y_SERIES —
    confirmed during research that this is the case for China, Brazil,
    and Turkey specifically (no working series ID found for any of the
    three, and accepted as a known gap rather than pursued further).
    """
    start_date = (datetime.now(timezone.utc) - timedelta(days=INTL_HISTORY_DAYS)).strftime("%Y-%m-%d")
    result = {}
    for market, series_id in INTERNATIONAL_10Y_SERIES.items():
        print(f"  fetching {market} 10Y yield ({series_id})...")
        obs = _fred_observations(series_id, start_date)
        if not obs:
            print(f"    WARNING: no data for {market} ({series_id}) — check this series ID directly on FRED")
            continue
        history = [{"date": o["date"], "yield_pct": float(o["value"])} for o in obs]
        latest = history[-1]
        result[market] = {
            "yield_pct": latest["yield_pct"],
            "date": latest["date"],
            "history": history,
        }
    return result


def fetch_treasury_yields():
    """
    Returns:
        {
          "3mo": {"yield_pct": ..., "date": ..., "history": [...]},
          "1yr": {...}, "2yr": {...}, "5yr": {...}, "10yr": {...},
          "international_10yr": {
            "Germany": {"yield_pct": ..., "date": ..., "history": [...]},
            ... 13 markets
          },
          "fetched_at": "..."
        }
    The top-level "3mo".."10yr" keys are unchanged from before (existing
    frontend code keeps working untouched) — "international_10yr" is a
    new, additive key.
    """
    if not FRED_API_KEY:
        print("  WARNING: FRED_API_KEY not set — skipping treasury yields (see scripts/treasury_yields.py)")
        return None

    result = {}
    for label, series_id in FRED_SERIES.items():
        print(f"  fetching {label} Treasury yield history ({series_id})...")
        history = fetch_yield_history(series_id)
        if history:
            latest = history[-1]
            result[label] = {
                "yield_pct": latest["yield_pct"],
                "date": latest["date"],
                "history": history,
            }
        else:
            result[label] = {"yield_pct": None, "date": None, "history": []}

    print("\n  Fetching international 10Y yields (monthly, OECD via FRED)...")
    result["international_10yr"] = fetch_international_10y_yields()

    result["fetched_at"] = datetime.now(timezone.utc).isoformat()
    return result


if __name__ == "__main__":
    # Standalone test: `python treasury_yields.py` — lets you verify this
    # piece works on its own before it's wired into the full fetch_data.py
    # pipeline, so a mistake here doesn't get lost inside a 5-minute run.
    import json as _json

    yields = fetch_treasury_yields()
    print("\nResult (histories trimmed for readability):")
    if yields:
        preview = dict(yields)
        for tenor in ["3mo", "1yr", "2yr", "5yr", "10yr"]:
            if preview.get(tenor):
                preview[tenor] = dict(preview[tenor])
                preview[tenor]["history"] = preview[tenor]["history"][-3:]
        if preview.get("international_10yr"):
            intl_preview = {}
            for market, data in preview["international_10yr"].items():
                d = dict(data)
                d["history"] = d["history"][-3:]
                intl_preview[market] = d
            preview["international_10yr"] = intl_preview
        print(_json.dumps(preview, indent=2))
    else:
        print(_json.dumps(yields, indent=2))
