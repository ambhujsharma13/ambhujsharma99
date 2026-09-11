"""
Fetches US housing-market data — home sales, plus two complementary
leading indicators (housing starts, building permits) added per
explicit request. No single source publishes "total home sales in
USD" directly — this module combines a transaction count with a
median price to derive an ESTIMATE of total dollar volume, clearly
labeled as such rather than presented as a directly-published figure.

MONTHLY — via FRED (api.stlouisfed.org), same API and FRED_API_KEY
already used by treasury_yields.py:
  - EXHOSLUSM495S: Existing Home Sales, seasonally-adjusted ANNUAL RATE.
    Units confirmed directly from FRED's own published data ("Number of
    Units, Seasonally Adjusted Annual Rate" — e.g. "4,090,000" for one
    recent month) — a direct count, NOT thousands of units. An earlier
    version of this module incorrectly assumed "thousands" and applied
    a spurious *1000 multiplier, producing a monthly volume estimate
    roughly 1000x too large (~$142 trillion instead of ~$142 billion)
    — confirmed as a real bug via live testing on the actual homepage.
  - HOSMEDUSM052N: Median Sales Price of Existing Homes, monthly,
    dollars, not seasonally adjusted.
  - Estimated monthly dollar volume = (annual rate / 12) * median price
    — dividing by 12 to de-annualize is itself an approximation, since
    SAAR figures don't correspond to any single real month's actual
    count, but no further unit correction is needed beyond that.

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

CONFIRMED ROOT CAUSE (via live run) for why the weekly filter never
matched: PERIOD_DURATION's only value in this specific file is the
number 30 — this file is MONTHLY-ONLY (30-day periods), not a combined
weekly+monthly file as originally assumed. This isn't a column-name or
filter-logic bug — it's the wrong file entirely. A genuinely separate
weekly dataset exists (older references point to a
"weekly_housing_market_data" file, distinct from the
"redfin_market_tracker" family used here), but its current S3 path
post-overhaul wasn't confirmed during research. Per explicit decision,
deprioritized rather than pursued further for now — the frontend shows
monthly-only, and fetch_weekly_home_sales() still runs but will
continue returning empty against this file until pointed at the
correct weekly-specific source.

HOUSING STARTS / BUILDING PERMITS — also via FRED, 3 months of history
each rather than a single latest value:
  - HOUST: New Privately-Owned Housing Units Started, Total Units, SAAR
  - PERMIT: New Privately-Owned Housing Units Authorized by Building
    Permits, Total Units, SAAR

NOT INCLUDED — MBA Weekly Mortgage Applications Index, despite being
one of the three housing indicators explicitly requested. Confirmed
via direct search that FRED does NOT host this series at all — a
search for "mortgage applications" on FRED's own site returns only 4
discontinued historical NBER series from the 1930s-1950s, not the
current, ongoing MBA index. The MBA index itself is MBA's own
proprietary, subscription-gated data, not freely redistributed through
FRED or any other public/free API found during research. Flagged here
rather than silently building something incorrect or dropping the
request without explanation.
"""

import os
from datetime import datetime, timedelta, timezone

import pandas as pd
import requests

FRED_API_KEY = os.environ.get("FRED_API_KEY", "")

EXISTING_HOME_SALES_SERIES = "EXHOSLUSM495S"  # thousands of units, SAAR
MEDIAN_PRICE_SERIES = "HOSMEDUSM052N"  # dollars
HOUSING_STARTS_SERIES = "HOUST"  # New Privately-Owned Housing Units Started, Total Units, SAAR
BUILDING_PERMITS_SERIES = "PERMIT"  # New Privately-Owned Housing Units Authorized by Building Permits, Total Units, SAAR

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


def _fred_observations_since(series_id, start_date):
    """
    Returns a list of {"date": ..., "value": float}, most recent first
    — unlike _fred_latest_observation, which only returns the single
    newest point. Used for the 3-month history views (housing starts,
    building permits) rather than a single latest-value snapshot.
    FRED's observation_start parameter is inclusive; "." (FRED's own
    missing-value marker) rows are dropped the same way
    _fred_latest_observation already does.
    """
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "sort_order": "desc",
        "observation_start": start_date,
    }
    try:
        resp = requests.get(url, params=params, timeout=30)
    except requests.RequestException as e:
        print(f"    WARNING: FRED history request failed for {series_id}: {e}")
        return []
    if resp.status_code != 200:
        print(f"    WARNING: FRED history request failed for {series_id}: HTTP {resp.status_code}")
        return []
    data = resp.json()
    return [
        {"date": o["date"], "value": float(o["value"])} for o in data.get("observations", []) if o["value"] != "."
    ]


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

    sales_annualized = float(sales_obs["value"])
    median_price = float(price_obs["value"])
    # / 12 to de-annualize — an approximation, since SAAR figures don't
    # correspond to any single real month's actual count. No further
    # unit correction needed: confirmed EXHOSLUSM495S is already a
    # direct "Number of Units" count, not thousands (see module
    # docstring — an earlier version incorrectly multiplied by 1000
    # here, producing a ~1000x-inflated estimate).
    estimated_monthly_volume = (sales_annualized / 12) * median_price

    return {
        "sales_count_annualized": sales_annualized,
        "median_price_usd": median_price,
        "estimated_monthly_volume_usd": estimated_monthly_volume,
        "date": sales_obs["date"],
        "is_estimate": True,
    }


def fetch_housing_starts_history(days=150):
    """
    Returns a list of {"date": ..., "value": ...}, most recent first —
    New Privately-Owned Housing Units Started, Total Units, SAAR. A
    leading indicator for future home sales/construction activity,
    per explicit request, complementing existing-home-sales above.

    Confirmed real gap via live testing: with days=95 (the original
    value, chosen to comfortably cover "3 months" at face value), this
    returned only 2 monthly data points instead of ~3. Housing starts
    has real publication lag — the latest available observation as of
    a mid-September run was for July, not August or September — so
    part of a 95-day lookback window fell into that not-yet-published
    gap rather than reaching 3 actual data points. days=150 (~5
    calendar months) leaves enough slack to comfortably reach 3
    published monthly observations even accounting for this lag.
    """
    if not FRED_API_KEY:
        print("  WARNING: FRED_API_KEY not set — skipping housing starts")
        return []
    start_date = (datetime.now(timezone.utc).date() - timedelta(days=days)).strftime("%Y-%m-%d")
    return _fred_observations_since(HOUSING_STARTS_SERIES, start_date)


def fetch_building_permits_history(days=150):
    """
    Returns a list of {"date": ..., "value": ...}, most recent first —
    New Privately-Owned Housing Units Authorized by Building Permits,
    Total Units, SAAR. An earlier leading indicator than starts, since
    permits are issued before construction begins. Same days=150
    lookback and same publication-lag reasoning as housing starts above.
    """
    if not FRED_API_KEY:
        print("  WARNING: FRED_API_KEY not set — skipping building permits")
        return []
    start_date = (datetime.now(timezone.utc).date() - timedelta(days=days)).strftime("%Y-%m-%d")
    return _fred_observations_since(BUILDING_PERMITS_SERIES, start_date)


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

    # Diagnostic: confirmed via live testing that a text .str.contains
    # ("week") filter on PERIOD_DURATION matched zero rows — printing
    # the actual unique values here rather than continuing to guess at
    # the format (could be day-counts, a different label entirely, etc).
    if col_duration:
        print(f"  Unique {col_duration} values: {sorted(df[col_duration].dropna().unique().tolist())[:20]}")
    if col_region_type:
        print(f"  Unique {col_region_type} values: {sorted(df[col_region_type].dropna().unique().astype(str).tolist())[:20]}")

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
    print("\nHousing starts, 3mo history (FRED):")
    print(json.dumps(fetch_housing_starts_history(), indent=2))
    print("\nBuilding permits, 3mo history (FRED):")
    print(json.dumps(fetch_building_permits_history(), indent=2))
    print("\nWeekly (Redfin):")
    print(json.dumps(fetch_weekly_home_sales(), indent=2))
