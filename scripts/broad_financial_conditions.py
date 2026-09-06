"""
Fetches the three "Broad Financial Conditions" indicators from FRED:
  - M2SL: M2 Money Supply (Billions of USD, monthly)
  - WALCL: Fed Balance Sheet total assets (Millions of USD, weekly)
  - TOTBKCR: Bank Credit, All Commercial Banks (Billions of USD, weekly)

NOTE the units genuinely differ per series (billions vs. millions) — this
is handled explicitly per-series below rather than with one shared
conversion, specifically to avoid the class of unit-mismatch bug we hit
with the 10-year yield earlier.

Also computes a simple loose/tight classification from each series' own
year-over-year % change, averaged across the three — expanding balance
sheet/money supply/credit = "loose" financial conditions, contracting =
"tight". This is a defensible, explainable basis (based on each
indicator's own trend) rather than an arbitrary absolute-level threshold.
"""

from datetime import datetime, timedelta, timezone

import requests

from treasury_yields import FRED_API_KEY  # reuse the same key/env var

SERIES = {
    "m2_supply": {"id": "M2SL", "unit_divisor": 1000},       # billions -> trillions
    "fed_balance_sheet": {"id": "WALCL", "unit_divisor": 1_000_000},  # millions -> trillions
    "bank_credit": {"id": "TOTBKCR", "unit_divisor": 1000},  # billions -> trillions
}


def _fetch_series_observations(series_id, start_date):
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
    return [o for o in resp.json().get("observations", []) if o["value"] != "."]


def fetch_broad_financial_conditions():
    """
    Returns:
        {
          "m2_supply": {"trillions": 22.1, "yoy_change_pct": 4.2, "date": "..."},
          "fed_balance_sheet": {...},
          "bank_credit": {...},
          "condition": "loose" | "neutral" | "tight",
          "avg_yoy_change_pct": 3.1,
          "fetched_at": "..."
        }
    Returns None entirely if FRED_API_KEY isn't set — same graceful-skip
    pattern as treasury_yields.py.
    """
    if not FRED_API_KEY:
        print("  WARNING: FRED_API_KEY not set — skipping broad financial conditions")
        return None

    # ~13 months back is enough to always have a real observation from
    # "about a year ago" even for monthly series with reporting lag.
    start_date = (datetime.now(timezone.utc) - timedelta(days=395)).strftime("%Y-%m-%d")

    result = {}
    yoy_changes = []

    for key, cfg in SERIES.items():
        print(f"  fetching {key} ({cfg['id']})...")
        obs = _fetch_series_observations(cfg["id"], start_date)
        if len(obs) < 2:
            result[key] = {"trillions": None, "yoy_change_pct": None, "date": None}
            continue

        latest = obs[-1]
        # Find the observation closest to ~1 year before the latest one,
        # rather than assuming a fixed index offset (weekly vs. monthly
        # series have very different observation counts over 13 months).
        latest_date = datetime.strptime(latest["date"], "%Y-%m-%d")
        year_ago_target = latest_date - timedelta(days=365)
        year_ago_obs = min(obs[:-1], key=lambda o: abs(datetime.strptime(o["date"], "%Y-%m-%d") - year_ago_target))

        latest_value = float(latest["value"]) / cfg["unit_divisor"]
        year_ago_value = float(year_ago_obs["value"]) / cfg["unit_divisor"]
        yoy_change_pct = (latest_value / year_ago_value - 1) * 100 if year_ago_value else None

        result[key] = {
            "trillions": round(latest_value, 2),
            "yoy_change_pct": round(yoy_change_pct, 2) if yoy_change_pct is not None else None,
            "date": latest["date"],
        }
        if yoy_change_pct is not None:
            yoy_changes.append(yoy_change_pct)

    if yoy_changes:
        avg_yoy = sum(yoy_changes) / len(yoy_changes)
        # Simple, explainable bands — not scientifically calibrated, just
        # Simple, explainable bands — not scientifically calibrated, just
        # a reasonable read on "expanding" vs "contracting" vs "flat".
        if avg_yoy > 3:
            condition = "loose"
        elif avg_yoy < 0:
            condition = "tight"
        else:
            condition = "neutral"
        result["avg_yoy_change_pct"] = round(avg_yoy, 2)
        result["condition"] = condition
    else:
        result["avg_yoy_change_pct"] = None
        result["condition"] = None

    result["fetched_at"] = datetime.now(timezone.utc).isoformat()
    return result


if __name__ == "__main__":
    import json

    print("\nResult:")
    print(json.dumps(fetch_broad_financial_conditions(), indent=2))
