"""
Fetches US home sales data at two granularities, per explicit request.
No single source publishes "total home sales in USD" directly — this
module combines a transaction count with a median price to derive an
ESTIMATE of total dollar volume, clearly labeled as such rather than
presented as a directly-published figure.

MONTHLY — via FRED (api.stlouisfed.org), same API and FRED_API_KEY
already used by treasury_yields.py:
  - EXHOSLUSM495S: Existing Home Sales, seasonally-adjusted ANNUAL RATE,
    in thousands of units. Being an annual rate, it's divided by 12
    below to estimate a monthly transaction count — this is itself an
    approximation, since SAAR figures don't correspond to any single
    real month's actual count.
  - HOSMEDUSM052N: Median Sales Price of Existing Homes, monthly,
    dollars, not seasonally adjusted.
  - Estimated monthly dollar volume = (annual rate / 12) * median price
    * 1000 (unit correction, since the sales series is in thousands).

WEEKLY — via Redfin's public national market-tracker file, since FRED
has no genuinely weekly home-sales series at all:
  https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/us_national_market_tracker.tsv000.gz
  A large gzipped TSV, no API key needed, read directly with
  pandas.read_csv(url, compression="gzip", sep="\t").

IMPORTANT — Redfin overhauled their Data Center's methodology and
column names in May 2026 (per their own "Introducing the New &
Improved Redfin Data Center" announcement). Most third-party code
examples found during research predate this and may use stale column
names. Since the actual gzipped file couldn't be decompressed and
inspected directly during development (blocked by network access in
that environment), this module does NOT hardcode a single assumed
column name for each field — it fetches the file's actual header first
and picks whichever of several plausible candidate names is actually
present, printing a WARNING if none match so a real mismatch is
immediately visible rather than silently producing wrong numbers.
"""

import os
from datetime import datetime, timedelta, timezone

import pandas as pd
import requests

FRED_API_KEY = os.environ.get("FRED_API_KEY", "")

EXISTING_HOME_SALES_SERIES = "EXHOSLUSM495S"  # thousands of units, SAAR
MEDIAN_PRICE_SERIES = "HOSMEDUSM052N"  # dollars

REDFIN_NATIONAL_URL = (
    "https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/us_national_market_tracker.tsv000.gz"
)

# Each inner list is tried in order — first match wins, matched
# case-insensitively. Confirmed via live testing that the actual file
# uses ALL-CAPS column names (PERIOD_BEGIN, MEDIAN_SALE_PRICE, etc.),
# not lowercase as first assumed — case-insensitive matching handles
# that without needing to enumerate every casing variant explicitly.
# Covers both pre- and post-May-2026 naming conventions found during
# research for the field names themselves.
REDFIN_COLUMN_CANDIDATES = {
    "period_begin": ["period_begin"],
    "period_end": ["period_end"],
    "duration": ["period_duration", "duration"],
    "region_type": ["region_type"],
    "median_sale_price": ["median_sale_price"],
    "homes_sold": ["homes_sold", "total_homes_sold"],
}


def _fred_latest_observation(series_id):
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "sort_order": "desc",
        "limit": 1,
    }
    try:
        resp = requests.get(url, params=params, timeout=30)
    except requests.RequestException as e:
        print(f"    WARNING: FRED request failed for {series_id}: {e}")
        return None
    if resp.status_code != 200:
        print(f"    WARNING: FRED request failed for {series_id}: HTTP {resp.status_code}")
        return None
    data = resp.json()
    obs = [o for o in data.get("observations", []) if o["value"] != "."]
    return obs[0] if obs else None


def fetch_monthly_home_sales():
    """
    Returns:
        {
          "sales_count_annualized_thousands": ...,
          "median_price_usd": ...,
          "estimated_monthly_volume_usd": ...,
          "date": ...,
          "is_estimate": true,
        }
    or {} if FRED_API_KEY isn't set or either series fails.
    """
    if not FRED_API_KEY:
        print("  WARNING: FRED_API_KEY not set — skipping monthly home sales")
        return {}

    sales_obs = _fred_latest_observation(EXISTING_HOME_SALES_SERIES)
    price_obs = _fred_latest_observation(MEDIAN_PRICE_SERIES)
    if not sales_obs or not price_obs:
        return {}

    sales_annualized_thousands = float(sales_obs["value"])
    median_price = float(price_obs["value"])
    # / 12 to de-annualize, * 1000 since the sales series is itself in
    # thousands of units — an approximation, not a directly-published
    # monthly transaction count.
    estimated_monthly_volume = (sales_annualized_thousands / 12) * 1000 * median_price

    return {
        "sales_count_annualized_thousands": sales_annualized_thousands,
        "median_price_usd": median_price,
        "estimated_monthly_volume_usd": estimated_monthly_volume,
        "date": sales_obs["date"],
        "is_estimate": True,
    }


def _find_column(df, field_key):
    # Case-insensitive: confirmed via live testing that the actual file
    # uses ALL-CAPS names while the candidates above are lowercase.
    # Builds a lowercase->actual-casing lookup so the returned value is
    # the real column name (needed for correct DataFrame indexing),
    # not the lowercase candidate string itself.
    lower_to_actual = {col.lower(): col for col in df.columns}
    for candidate in REDFIN_COLUMN_CANDIDATES[field_key]:
        if candidate.lower() in lower_to_actual:
            return lower_to_actual[candidate.lower()]
    return None


def fetch_weekly_home_sales():
    """
    Returns:
        {
          "homes_sold": ..., "median_price_usd": ...,
          "estimated_weekly_volume_usd": ...,
          "period_begin": ..., "period_end": ...,
          "is_estimate": true,
        }
    or {} on any failure. See module docstring — column names for this
    file were not independently confirmed the way FRED's were, so this
    prints exactly which candidate matched (or didn't) for visibility.
    """
    try:
        df = pd.read_csv(REDFIN_NATIONAL_URL, compression="gzip", sep="\t", low_memory=False)
    except Exception as e:
        print(f"  WARNING: could not fetch/parse Redfin national tracker file: {e}")
        return {}

    print(f"  Redfin file columns found ({len(df.columns)} total): {list(df.columns)}")
    sold_related = [c for c in df.columns if "sold" in c.lower()]
    print(f"  Columns containing 'sold': {sold_related}")

    col_period_begin = _find_column(df, "period_begin")
    col_period_end = _find_column(df, "period_end")
    col_duration = _find_column(df, "duration")
    col_region_type = _find_column(df, "region_type")
    col_price = _find_column(df, "median_sale_price")
    col_homes_sold = _find_column(df, "homes_sold")

    missing = [
        name
        for name, col in [
            ("period_begin", col_period_begin),
            ("period_end", col_period_end),
            ("median_sale_price", col_price),
            ("homes_sold", col_homes_sold),
        ]
        if col is None
    ]
    if missing:
        print(f"  WARNING: could not find expected columns in Redfin file: {missing} — skipping weekly home sales")
        return {}

    # Filter to weekly rows specifically — the file mixes weekly and
    # monthly periods together, distinguished by the duration column
    # where available, falling back to a ~7-day period span otherwise.
    if col_duration:
        weekly = df[df[col_duration].astype(str).str.contains("week", case=False, na=False)]
    else:
        span_days = (pd.to_datetime(df[col_period_end]) - pd.to_datetime(df[col_period_begin])).dt.days
        weekly = df[span_days <= 10]

    if col_region_type:
        national = weekly[weekly[col_region_type].astype(str).str.contains("nation", case=False, na=False)]
        if not national.empty:
            weekly = national

    if weekly.empty:
        print("  WARNING: no weekly rows found in Redfin national tracker file after filtering")
        return {}

    weekly = weekly.sort_values(col_period_end)
    latest = weekly.iloc[-1]

    try:
        homes_sold = float(latest[col_homes_sold])
        median_price = float(latest[col_price])
    except (ValueError, TypeError):
        print("  WARNING: latest Redfin row had non-numeric homes_sold/median_sale_price — skipping")
        return {}

    return {
        "homes_sold": homes_sold,
        "median_price_usd": median_price,
        "estimated_weekly_volume_usd": homes_sold * median_price,
        "period_begin": str(latest[col_period_begin]),
        "period_end": str(latest[col_period_end]),
        "is_estimate": True,
    }


if __name__ == "__main__":
    import json

    print("Monthly (FRED):")
    print(json.dumps(fetch_monthly_home_sales(), indent=2))
    print("\nWeekly (Redfin):")
    print(json.dumps(fetch_weekly_home_sales(), indent=2))
