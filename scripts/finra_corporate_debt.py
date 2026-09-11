"""
Fetches FINRA TRACE corporate & agency bond market activity — two
datasets, confirmed directly from FINRA's own /metadata endpoints
(api.finra.org/metadata/group/fixedIncomeMarket/name/{dataset}Mock,
which — unlike the actual /data endpoint — is publicly readable without
an OAuth token, confirmed via direct browser testing):

1. corporatesAndAgenciesCappedVolume — total trade count and volume,
   broken down by gradeCode (IG = Investment Grade, HY = High Yield,
   AGCY = Agency), partitioned by tradeReportDate. This is the primary
   dataset for a "Corporate Debt Market Activity" homepage table.
2. corporateMarketBreadth — advances/declines/unchanged counts plus
   52-week high/low counts, a stock-market-breadth-style indicator
   applied to corporate bonds instead of equities.
3. corporateMarketSentiment — total transactions/trades/volume broken
   down by tradeType, per explicit request for a sentiment breakdown
   alongside breadth.

IMPORTANT — this measures SECONDARY-MARKET TRADING ACTIVITY, not new
issuance. FINRA/TRACE has no primary-issuance dataset at all (that's
tracked by SIFMA instead, via downloadable reports rather than a clean
API) — this module deliberately does not claim to measure "new bonds
issued this month", only how much of the existing corporate/agency bond
market traded hands.

AUTHENTICATION AND REQUEST PATTERN — identical to
finra_treasury_volume.py (duplicated rather than shared, to avoid any
risk of a regression in that already-working, separately-tested module):
OAuth2 client-credentials flow, POST with a JSON body (not GET), an
explicit "Accept": "application/json" header (FINRA's live endpoint
defaults to CSV otherwise — a real bug found and fixed in the Treasury
module), and a required compareFilter on the tradeReportDate partition
field since there's no "give me the latest day" default.

UNITS: not yet confirmed from a real live sample the way Treasury
volume's "$ billions" was — the metadata only says "Total share volume
quantity" without a unit. This module reports the raw number returned
rather than guessing at a multiplier, until confirmed otherwise via a
real test run.
"""

import base64
import os
import time
from datetime import datetime, timedelta, timezone

import requests

FINRA_CLIENT_ID = os.environ.get("FINRA_CLIENT_ID", "")
FINRA_CLIENT_SECRET = os.environ.get("FINRA_CLIENT_SECRET", "")

TOKEN_URL = "https://ews.fip.finra.org/fip/rest/ews/oauth2/access_token?grant_type=client_credentials"
CAPPED_VOLUME_URL_LIVE = "https://api.finra.org/data/group/fixedIncomeMarket/name/corporatesAndAgenciesCappedVolume"
CAPPED_VOLUME_URL_MOCK = "https://api.finra.org/data/group/fixedIncomeMarket/name/corporatesAndAgenciesCappedVolumeMock"
MARKET_BREADTH_URL_LIVE = "https://api.finra.org/data/group/fixedIncomeMarket/name/corporateMarketBreadth"
MARKET_BREADTH_URL_MOCK = "https://api.finra.org/data/group/fixedIncomeMarket/name/corporateMarketBreadthMock"
MARKET_SENTIMENT_URL_LIVE = "https://api.finra.org/data/group/fixedIncomeMarket/name/corporateMarketSentiment"
MARKET_SENTIMENT_URL_MOCK = "https://api.finra.org/data/group/fixedIncomeMarket/name/corporateMarketSentimentMock"

TOKEN_CACHE_SECONDS = 30 * 60

GRADE_LABELS = {"IG": "Investment Grade", "HY": "High Yield", "AGCY": "Agency"}

_token_cache = {"access_token": None, "obtained_at": 0}


def _get_access_token():
    now = time.time()
    if _token_cache["access_token"] and (now - _token_cache["obtained_at"]) < TOKEN_CACHE_SECONDS:
        return _token_cache["access_token"]

    if not FINRA_CLIENT_ID or not FINRA_CLIENT_SECRET:
        return None

    basic_token = base64.b64encode(f"{FINRA_CLIENT_ID}:{FINRA_CLIENT_SECRET}".encode()).decode()
    try:
        resp = requests.post(TOKEN_URL, headers={"Authorization": f"Basic {basic_token}"}, timeout=30)
    except requests.RequestException as e:
        print(f"    WARNING: FINRA token request failed: {e}")
        return None

    if resp.status_code != 200:
        print(f"    WARNING: FINRA token request returned HTTP {resp.status_code}: {resp.text[:200]}")
        return None

    data = resp.json()
    access_token = data.get("access_token")
    if not access_token:
        print(f"    WARNING: FINRA token response had no access_token: {data}")
        return None

    _token_cache["access_token"] = access_token
    _token_cache["obtained_at"] = now
    return access_token


MOCK_FIXED_DATE = "2023-02-13"  # same fixed mock date confirmed for the Treasury dataset — assumed shared across FINRA's mock datasets, not yet independently re-confirmed for this one specifically


def _most_recent_weekday_before(days_back):
    d = datetime.now(timezone.utc).date()
    checked = 0
    while checked < days_back or d.weekday() >= 5:
        d = d.fromordinal(d.toordinal() - 1)
        if d.weekday() < 5:
            checked += 1
    return d.strftime("%Y-%m-%d")


def _fetch_raw_records(url_live, url_mock, fields, trade_date, use_mock=False, limit=1000):
    token = _get_access_token()
    if not token:
        print("  WARNING: FINRA_CLIENT_ID/FINRA_CLIENT_SECRET not set or token fetch failed — skipping")
        return []

    url = url_mock if use_mock else url_live
    payload = {
        "limit": limit,
        "fields": fields,
        "compareFilters": [{"fieldName": "tradeReportDate", "fieldValue": trade_date, "compareType": "equal"}],
    }
    try:
        resp = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",  # confirmed real requirement from the Treasury module — omitting this gets CSV back instead
            },
            json=payload,
            timeout=30,
        )
    except requests.RequestException as e:
        print(f"    WARNING: FINRA data request failed: {e}")
        return []

    if resp.status_code != 200:
        print(f"    WARNING: FINRA data request returned HTTP {resp.status_code}: {resp.text[:200]}")
        return []

    try:
        return resp.json()
    except ValueError:
        print(f"    WARNING: FINRA response was not valid JSON despite Accept header — got: {resp.text[:200]}")
        return []


def _fetch_date_range_records(url_live, url_mock, fields, start_date, end_date, use_mock=False, limit=5000):
    """
    Same request/error-handling shape as _fetch_raw_records, but using
    dateRangeFilters (fieldName/startDate/endDate, both inclusive)
    instead of an exact-match compareFilter — confirmed as a real,
    documented parameter directly from FINRA's own "Getting Started"
    docs page, distinct from compareFilters. This is what makes
    fetching ~3 months of daily history practical as ONE request rather
    than ~65 separate exact-date ones.

    limit defaults to 5000 (the documented synchronous-request cap,
    confirmed from FINRA's own docs) rather than 1000, since a date
    range spanning many days returns many more rows than a single day.
    """
    token = _get_access_token()
    if not token:
        print("  WARNING: FINRA_CLIENT_ID/FINRA_CLIENT_SECRET not set or token fetch failed — skipping")
        return []

    url = url_mock if use_mock else url_live
    payload = {
        "limit": limit,
        "fields": fields,
        "dateRangeFilters": [{"fieldName": "tradeReportDate", "startDate": start_date, "endDate": end_date}],
    }
    try:
        resp = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json=payload,
            timeout=30,
        )
    except requests.RequestException as e:
        print(f"    WARNING: FINRA date-range request failed: {e}")
        return []

    if resp.status_code != 200:
        print(f"    WARNING: FINRA date-range request returned HTTP {resp.status_code}: {resp.text[:200]}")
        return []

    try:
        return resp.json()
    except ValueError:
        print(f"    WARNING: FINRA date-range response was not valid JSON — got: {resp.text[:200]}")
        return []


def _fetch_for_most_recent_date(url_live, url_mock, fields, use_mock=False, max_retry_days=5):
    """
    Shared retry-backward-by-day logic, same pattern as the Treasury
    module — steps back day by day (skipping weekends) in case the most
    recent likely business day turns out to be a market holiday with no
    data yet published.
    """
    if use_mock:
        return _fetch_raw_records(url_live, url_mock, fields, MOCK_FIXED_DATE, use_mock=True), MOCK_FIXED_DATE

    for days_back in range(1, max_retry_days + 1):
        candidate_date = _most_recent_weekday_before(days_back)
        records = _fetch_raw_records(url_live, url_mock, fields, candidate_date, use_mock=False)
        if records:
            return records, candidate_date
        print(f"  no data for {candidate_date}, trying an earlier day (likely a holiday)...")
    return [], None


def fetch_corporate_capped_volume(use_mock=False):
    """
    Returns:
        {
          "Investment Grade": {"trade_count": ..., "volume_quantity": ..., "date": ...},
          "High Yield": {...}, "Agency": {...},
        }
    One row per gradeCode (IG/HY/AGCY) for the most recent available
    trade date. volume_quantity is the raw number FINRA returns — see
    the module docstring on units not yet being independently confirmed
    for this specific dataset.
    """
    fields = ["tradeReportDate", "gradeCode", "totalTradeCount", "totalVolumeQuantity"]
    records, trade_date = _fetch_for_most_recent_date(
        CAPPED_VOLUME_URL_LIVE, CAPPED_VOLUME_URL_MOCK, fields, use_mock=use_mock
    )
    if not records:
        return {}

    result = {}
    for row in records:
        grade = row.get("gradeCode")
        label = GRADE_LABELS.get(grade, grade)
        if not label:
            continue
        result[label] = {
            "trade_count": row.get("totalTradeCount"),
            "volume_quantity": row.get("totalVolumeQuantity"),
            "date": row.get("tradeReportDate"),
            "source": "finra_trace_corporate_agency_capped_volume",
        }
    return result


def fetch_corporate_market_breadth(use_mock=False):
    """
    Returns:
        {"advances": ..., "declines": ..., "unchanged": ..., "total_trades": ...,
         "total_volume": ..., "fifty_two_week_high": ..., "fifty_two_week_low": ...,
         "date": ...}
    Aggregated across whatever productCategory breakdown the dataset
    returns for the most recent available trade date — summed rather
    than kept per-category, since a single homepage-table row is the
    goal here, not a full breakdown.
    """
    fields = [
        "tradeReportDate",
        "productCategory",
        "totalTrades",
        "advances",
        "declines",
        "unchanged",
        "fiftyTwoWeekHigh",
        "fiftyTwoWeekLow",
        "totalVolume",
    ]
    records, trade_date = _fetch_for_most_recent_date(
        MARKET_BREADTH_URL_LIVE, MARKET_BREADTH_URL_MOCK, fields, use_mock=use_mock
    )
    if not records:
        return {}

    def _sum(key):
        return sum((r.get(key) or 0) for r in records)

    return {
        "advances": _sum("advances"),
        "declines": _sum("declines"),
        "unchanged": _sum("unchanged"),
        "total_trades": _sum("totalTrades"),
        "total_volume": _sum("totalVolume"),
        "fifty_two_week_high": _sum("fiftyTwoWeekHigh"),
        "fifty_two_week_low": _sum("fiftyTwoWeekLow"),
        "date": trade_date,
        "source": "finra_trace_corporate_market_breadth",
    }


def fetch_corporate_market_breadth_history(days=95, use_mock=False):
    """
    Returns a list, one entry per trading day, most recent first:
        [
          {"date": "2026-09-10", "advances": ..., "declines": ..., "unchanged": ...,
           "total_trades": ..., "total_volume": ..., "fifty_two_week_high": ...,
           "fifty_two_week_low": ...},
          ...
        ]
    Powers the /market-activity landing page's 1D/3D/1W/1M/3M toggles —
    the frontend slices/aggregates over however many of these entries
    the selected window needs, rather than this function being called
    separately per toggle.

    days=95 calendar days (not trading days) comfortably covers 3
    months of trading days (~63-65) even accounting for weekends and
    holidays, fetched in a single request via dateRangeFilters rather
    than ~65 separate exact-date requests.

    Same per-day grouping as fetch_corporate_market_breadth (multiple
    productCategory rows per day, summed into one), just grouped by
    date here instead of collapsed across the whole result set.
    """
    fields = [
        "tradeReportDate",
        "productCategory",
        "totalTrades",
        "advances",
        "declines",
        "unchanged",
        "fiftyTwoWeekHigh",
        "fiftyTwoWeekLow",
        "totalVolume",
    ]

    if use_mock:
        # The mock dataset only has one fixed date available — a real
        # date range against it wouldn't return the multi-day history
        # this function exists for, so this mirrors what the single-day
        # mock fetch already does rather than pretending otherwise.
        records = _fetch_raw_records(
            MARKET_BREADTH_URL_LIVE, MARKET_BREADTH_URL_MOCK, fields, MOCK_FIXED_DATE, use_mock=True
        )
    else:
        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=days)
        records = _fetch_date_range_records(
            MARKET_BREADTH_URL_LIVE,
            MARKET_BREADTH_URL_MOCK,
            fields,
            start_date.strftime("%Y-%m-%d"),
            end_date.strftime("%Y-%m-%d"),
            use_mock=False,
        )

    if not records:
        return []

    by_date = {}
    for r in records:
        d = r.get("tradeReportDate")
        if not d:
            continue
        if d not in by_date:
            by_date[d] = {
                "date": d,
                "advances": 0,
                "declines": 0,
                "unchanged": 0,
                "total_trades": 0,
                "total_volume": 0,
                "fifty_two_week_high": 0,
                "fifty_two_week_low": 0,
            }
        row = by_date[d]
        row["advances"] += r.get("advances") or 0
        row["declines"] += r.get("declines") or 0
        row["unchanged"] += r.get("unchanged") or 0
        row["total_trades"] += r.get("totalTrades") or 0
        row["total_volume"] += r.get("totalVolume") or 0
        row["fifty_two_week_high"] += r.get("fiftyTwoWeekHigh") or 0
        row["fifty_two_week_low"] += r.get("fiftyTwoWeekLow") or 0

    return sorted(by_date.values(), key=lambda row: row["date"], reverse=True)


def fetch_corporate_market_sentiment_history(days=60, use_mock=False):
    """
    Returns a list, one entry per trading day, most recent first:
        [
          {"date": "2026-09-10", "by_trade_type": {"<tradeType>": {"total_transactions": ...,
            "total_trades": ..., "total_volume": ...}, ...}},
          ...
        ]
    Per explicit request, ~1-2 months back (days=60 covers this
    comfortably even accounting for weekends/holidays), same
    dateRangeFilters approach as the breadth history function.

    Kept broken out BY tradeType per day, rather than summed the way
    breadth is — tradeType's actual values were never independently
    confirmed from a real live response (the metadata only says
    "String", no enum), so collapsing it into one number per day would
    risk hiding exactly the buy/sell or customer/interdealer split this
    dataset exists to show. The frontend can choose how to display the
    breakdown once real tradeType values are visible.
    """
    fields = ["tradeReportDate", "tradeType", "productCategory", "totalTransactions", "totalTrades", "totalVolume"]

    if use_mock:
        records = _fetch_raw_records(
            MARKET_SENTIMENT_URL_LIVE, MARKET_SENTIMENT_URL_MOCK, fields, MOCK_FIXED_DATE, use_mock=True
        )
    else:
        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=days)
        records = _fetch_date_range_records(
            MARKET_SENTIMENT_URL_LIVE,
            MARKET_SENTIMENT_URL_MOCK,
            fields,
            start_date.strftime("%Y-%m-%d"),
            end_date.strftime("%Y-%m-%d"),
            use_mock=False,
        )

    if not records:
        return []

    by_date = {}
    for r in records:
        d = r.get("tradeReportDate")
        t = r.get("tradeType")
        if not d or not t:
            continue
        if d not in by_date:
            by_date[d] = {"date": d, "by_trade_type": {}}
        bucket = by_date[d]["by_trade_type"].setdefault(
            t, {"total_transactions": 0, "total_trades": 0, "total_volume": 0}
        )
        bucket["total_transactions"] += r.get("totalTransactions") or 0
        bucket["total_trades"] += r.get("totalTrades") or 0
        bucket["total_volume"] += r.get("totalVolume") or 0

    return sorted(by_date.values(), key=lambda row: row["date"], reverse=True)


if __name__ == "__main__":
    import json

    print("Testing against the MOCK datasets first...")
    print("\nCapped volume by grade:")
    print(json.dumps(fetch_corporate_capped_volume(use_mock=True), indent=2))
    print("\nMarket breadth:")
    print(json.dumps(fetch_corporate_market_breadth(use_mock=True), indent=2))
    print("\nMarket breadth history (mock — single date only):")
    print(json.dumps(fetch_corporate_market_breadth_history(use_mock=True), indent=2))
    print("\nMarket sentiment history (mock — single date only):")
    print(json.dumps(fetch_corporate_market_sentiment_history(use_mock=True), indent=2))
