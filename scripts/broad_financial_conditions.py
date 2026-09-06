"""
Fetches 7 "Broad Financial Conditions" indicators from FRED:

  Dollar aggregates (converted to $ trillions):
  - M2SL: M2 Money Supply (Billions of USD, monthly)
  - WALCL: Fed Balance Sheet total assets (Millions of USD, weekly)
  - TOTBKCR: Bank Credit, All Commercial Banks (Billions of USD, weekly)

  Rates/indices (already in their natural unit, no dollar conversion):
  - NFCI: Chicago Fed National Financial Conditions Index (index, weekly)
  - T10Y2Y: 10-Year minus 2-Year Treasury yield spread (percentage points, daily)
  - DFF: Effective Federal Funds Rate (percent, daily)
  - BAMLH0A0HYM2: ICE BofA US High Yield Option-Adjusted Spread (percent, daily)

NOTE the dollar-aggregate units genuinely differ per series (billions vs.
millions) — handled explicitly per-series, same reasoning as always: avoid
the class of unit-mismatch bug hit with the 10-year yield earlier. The 4
new indicators need NO such conversion at all (they're not dollar
amounts), which is exactly why they're marked "is_dollar": False below —
that flag controls whether unit_divisor is applied and whether the
`trillions` field is populated (kept only for the original 3, for
backward compatibility with the existing homepage panel) versus the new
generic `value` field (populated for all 7, for the future landing page
that needs a uniform way to read any indicator's number).

Computes BOTH month-over-month and year-over-year % change for every
indicator now (previously YoY only) — the landing page's "1-month change"
column needs this uniformly across all 7, not just the ones added today.
"""

from datetime import datetime, timedelta, timezone

import requests

from treasury_yields import FRED_API_KEY  # reuse the same key/env var

SERIES = {
    "m2_supply": {"id": "M2SL", "is_dollar": True, "unit_divisor": 1000},
    "fed_balance_sheet": {"id": "WALCL", "is_dollar": True, "unit_divisor": 1_000_000},
    "bank_credit": {"id": "TOTBKCR", "is_dollar": True, "unit_divisor": 1000},
    "financial_conditions_index": {"id": "NFCI", "is_dollar": False, "unit_divisor": 1},
    "yield_curve_10y2y": {"id": "T10Y2Y", "is_dollar": False, "unit_divisor": 1},
    "fed_funds_rate": {"id": "DFF", "is_dollar": False, "unit_divisor": 1},
    "high_yield_spread": {"id": "BAMLH0A0HYM2", "is_dollar": False, "unit_divisor": 1},
}

HISTORY_DAYS = 730  # ~2 years — enough for a meaningful chart on each indicator's landing page


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


def _closest_entry(history, target_date, exclude_last=True):
    """Finds the history entry whose date is closest to target_date."""
    candidates = history[:-1] if exclude_last else history
    if not candidates:
        return None
    return min(candidates, key=lambda h: abs(datetime.strptime(h["date"], "%Y-%m-%d") - target_date))


def _pct_change(new_value, old_value):
    if old_value is None or old_value == 0 or new_value is None:
        return None
    return round((new_value / old_value - 1) * 100, 2)


def _abs_change(new_value, old_value):
    if old_value is None or new_value is None:
        return None
    return round(new_value - old_value, 4)


def fetch_broad_financial_conditions():
    """
    Returns, for each of the 7 keys in SERIES:
        {
          "value": <latest, in the indicator's natural unit>,
          "trillions": <same as value, ONLY for the 3 dollar-aggregate
                        indicators — kept for backward compatibility with
                        the existing homepage panel; null for the other 4>,
          "mom_change_pct": <% change vs. ~1 month ago>,
          "yoy_change_pct": <% change vs. ~1 year ago>,
          "date": "...",
          "history": [{"date": "...", "value": ...}, ...]
        }
    plus "fetched_at" at the top level.

    Returns None entirely if FRED_API_KEY isn't set — same graceful-skip
    pattern as treasury_yields.py.
    """
    if not FRED_API_KEY:
        print("  WARNING: FRED_API_KEY not set — skipping broad financial conditions")
        return None

    start_date = (datetime.now(timezone.utc) - timedelta(days=HISTORY_DAYS)).strftime("%Y-%m-%d")

    result = {}

    for key, cfg in SERIES.items():
        print(f"  fetching {key} ({cfg['id']}) history...")
        obs = _fetch_series_observations(cfg["id"], start_date)
        if len(obs) < 2:
            result[key] = {
                "value": None, "trillions": None,
                "mom_change_pct": None, "yoy_change_pct": None,
                "mom_change_abs": None, "yoy_change_abs": None,
                "date": None, "history": [],
            }
            continue

        divisor = cfg["unit_divisor"]
        history = [
            {"date": o["date"], "value": round(float(o["value"]) / divisor, 4)}
            for o in obs
        ]
        latest = history[-1]
        latest_date = datetime.strptime(latest["date"], "%Y-%m-%d")

        month_ago = _closest_entry(history, latest_date - timedelta(days=30))
        year_ago = _closest_entry(history, latest_date - timedelta(days=365))

        mom_change_pct = _pct_change(latest["value"], month_ago["value"] if month_ago else None)
        yoy_change_pct = _pct_change(latest["value"], year_ago["value"] if year_ago else None)
        mom_change_abs = _abs_change(latest["value"], month_ago["value"] if month_ago else None)
        yoy_change_abs = _abs_change(latest["value"], year_ago["value"] if year_ago else None)

        result[key] = {
            "value": latest["value"],
            "trillions": latest["value"] if cfg["is_dollar"] else None,
            # For the 3 dollar aggregates, use the _pct fields (standard,
            # meaningful convention for large positive dollar amounts).
            # For the 4 rate/spread/index indicators, use the _abs fields
            # instead — percentage change is misleading or nonsensical for
            # values that are small, negative, or cross zero (confirmed by
            # testing: NFCI moving -0.38 -> -0.40 computed as "+5.26%",
            # which reads backwards from what actually happened).
            "mom_change_pct": mom_change_pct,
            "yoy_change_pct": yoy_change_pct,
            "mom_change_abs": mom_change_abs,
            "yoy_change_abs": yoy_change_abs,
            "date": latest["date"],
            "history": history,
        }

    result["fetched_at"] = datetime.now(timezone.utc).isoformat()
    return result


if __name__ == "__main__":
    import json

    result = fetch_broad_financial_conditions()
    print("\nResult (history trimmed to last 3 entries per indicator for readability):")
    if result:
        preview = {}
        for k, v in result.items():
            if isinstance(v, dict) and "history" in v:
                preview[k] = dict(v)
                preview[k]["history"] = preview[k]["history"][-3:]
            else:
                preview[k] = v
        print(json.dumps(preview, indent=2))
    else:
        print(json.dumps(result, indent=2))
