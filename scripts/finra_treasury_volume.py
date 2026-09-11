"""
Fetches US Treasury trading volume from FINRA's TRACE Treasury Daily
Aggregates dataset. Kept as its own module (not merged into
treasury_yields.py directly) since this is a genuinely separate data
source (FINRA, not FRED) with its own authentication flow — imported and
called from treasury_yields.py to merge volume into the same per-tenor
output structure already in use.

AUTHENTICATION — a standard OAuth2 client-credentials flow, confirmed
directly from FINRA's own "Authentication" documentation page:
  1. POST to the FINRA Identity Platform (FIP) token endpoint, with your
     Client ID + Client Secret sent as HTTP Basic Auth (base64-encoded
     "client_id:client_secret" in the Authorization header).
  2. FIP returns an access_token (a JWT) plus expires_in (seconds).
  3. Use that access_token as a Bearer token on the actual data request.
  4. FINRA's own docs recommend caching the token for 30 minutes before
     regenerating, even though expires_in in their example was much
     longer (~12 hours) — this module follows that conservative guidance.

REQUEST METHOD — confirmed via real test runs to matter, in three stages:
  1. The actual data request is a POST with a JSON body, NOT a GET with
     query parameters. A first attempt using GET + query params returned
     HTTP 204 (empty, not an error) every time; switching to POST+body
     was step one of the fix.
  2. Even with POST, a request with no date filter also returned 204
     with "record-total: 0" in the response headers. FINRA's own
     /metadata endpoint for this dataset confirmed tradeDate is a
     required "partitionField" — meaning every query MUST include an
     explicit compareFilter on tradeDate to match anything at all;
     there's no "most recent" default. The exact compareFilters JSON
     structure (fieldName/fieldValue/compareType) was confirmed from
     FINRA's own general "POST Data" specification page — including a
     real, tested worked example there, which uses lowercase "equal"
     for compareType, even though the summary parameter table above it
     lists "EQUAL"/"EQUALS" (uppercase, and inconsistent with itself).
     This module trusts the actual worked example's casing over the
     summary table's, since the two disagreed and a first attempt using
     uppercase "EQUAL" also returned an empty 204.
  3. The live endpoint (DATA_URL_LIVE) defaults to returning CSV
     (Content-Type: text/plain), NOT JSON, confirmed directly from a
     real live-credential test — a response body like
     `"tradeDate","productCategory"\n"2026-09-09","Bills"\n...` where
     resp.json() failed with a JSONDecodeError. The request's own
     Content-Type: application/json header only describes the REQUEST
     body's format, not the desired response format — an explicit
     "Accept": "application/json" header is required to get JSON back.
     The mock endpoint (DATA_URL_MOCK) apparently defaults to JSON
     already, which is why earlier mock-only testing never caught this;
     it only surfaced once real Public-tier credentials were used
     against the live endpoint.

Needs FINRA_CLIENT_ID and FINRA_CLIENT_SECRET set — both provisioned via
the API Console at developer.finra.org, under an Individual API User
Account (no FINRA member-firm affiliation required). See the
"Treasury Daily Aggregates" dataset page for the exact resource path.

DATASET SCHEMA — confirmed directly from FINRA's own sample response
(not assumed from general docs), which is why this module trusts these
exact field names and values with confidence:
    {
      "yearsToMaturity": "<= 2 years" | "> 2 years and <= 3 years" | null,
      "dealerCustomerVolume": 17.6,      # $ billions, Dealer-to-Customer venue
      "atsInterdealerVolume": 33.4,      # $ billions, ATS+Interdealer venue
      "dealerCustomerCount": 2232,       # trade count, same venue split
      "atsInterdealerCount": 16066,
      "tradeDate": "2023-02-13",
      "volumeWeightedAveragePrice": 99.232,  # only populated for on-the-run Nominal Coupons
      "benchmark": "On-the-run" | "Off-the-run" | null,
      "productCategory": "Bills" | "FRNs" | "Nominal Coupons" | "TIPS",
    }
Total volume for a row = dealerCustomerVolume + atsInterdealerVolume (the
two venues are NOT pre-summed by FINRA — that's computed here).

CONFIRMED LIMITATION: Bills and FRNs both carry null yearsToMaturity and
null benchmark in every sample row seen — they are NOT broken down by
maturity bucket at all. This means 3-month and 1-year Treasury volume
CANNOT be separated from each other through this dataset; both tenors
are left with volume_usd=None and an explanatory note, rather than
showing a misleading combined-Bills figure under two different tenor
labels as if they were separately measured.

BUCKET MAPPING for 2yr/5yr/10yr: all three bucket label strings are now
confirmed directly from real live-endpoint responses (not just assumed):
"<= 2 years", "> 3 years and <= 5 years", and "> 7 years and <= 10 years"
respectively. The module still parses the upper-bound number out of
whatever bucket labels come back rather than hardcoding these exact
strings, since that's more robust to any future relabeling on FINRA's
end — but the pattern these three follow is no longer a guess.
"""

import base64
import os
import re
import time
from datetime import datetime, timezone

import requests

FINRA_CLIENT_ID = os.environ.get("FINRA_CLIENT_ID", "")
FINRA_CLIENT_SECRET = os.environ.get("FINRA_CLIENT_SECRET", "")

TOKEN_URL = "https://ews.fip.finra.org/fip/rest/ews/oauth2/access_token?grant_type=client_credentials"
DATA_URL_LIVE = "https://api.finra.org/data/group/fixedIncomeMarket/name/treasuryDailyAggregates"
DATA_URL_MOCK = "https://api.finra.org/data/group/fixedIncomeMarket/name/treasuryDailyAggregatesMock"

TOKEN_CACHE_SECONDS = 30 * 60  # FINRA's own recommended caching window

# Maps our tenor keys to a target number of years, used to find the
# closest matching FINRA remaining-maturity bucket for each.
TENOR_TARGET_YEARS = {"2yr": 2, "5yr": 5, "10yr": 10}

_token_cache = {"access_token": None, "obtained_at": 0}


def _get_access_token():
    """
    Returns a valid Bearer access token, using an in-memory cache so a
    single pipeline run doesn't request a fresh token on every call —
    only re-requests once the 30-minute cache window has passed.
    """
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


# The mock dataset is a fixed, static snapshot always pinned to this
# date — confirmed by every sample response we've seen showing
# "tradeDate": "2023-02-13" with no exceptions.
MOCK_FIXED_DATE = "2023-02-13"


def _most_recent_weekday_before(days_back):
    """
    Returns a YYYY-MM-DD string for `days_back` calendar days before
    today, skipping Sat/Sun. Used to build a reasonable default date for
    the live dataset — Treasury volume is published with a lag (the
    prior day's data lands at 8pm ET), so "yesterday" is a sensible
    starting point, with earlier days tried as a fallback for holidays.
    """
    d = datetime.now(timezone.utc).date()
    checked = 0
    while checked < days_back or d.weekday() >= 5:  # 5=Saturday, 6=Sunday
        d = d.fromordinal(d.toordinal() - 1)
        if d.weekday() < 5:
            checked += 1
    return d.strftime("%Y-%m-%d")


def _fetch_raw_records(trade_date, use_mock=False, limit=1000):
    """
    One authenticated POST to the Treasury Daily Aggregates dataset,
    filtered to a specific trade_date.

    IMPORTANT, confirmed via two rounds of real testing:
    1. This is POST with a JSON body, NOT GET with query params — a GET
       attempt returned HTTP 204 every time.
    2. Even with POST, a request with NO date filter also returned 204
       (with "record-total: 0" in the response headers) — FINRA's own
       /metadata endpoint confirmed tradeDate is a required
       "partitionField", meaning a compareFilter on tradeDate is
       mandatory, not optional. There is no "give me the latest day"
       default.
    The exact compareFilters structure (fieldName/fieldValue/compareType)
    is confirmed from FINRA's general "POST Data" specification page.
    """
    token = _get_access_token()
    if not token:
        print("  WARNING: FINRA_CLIENT_ID/FINRA_CLIENT_SECRET not set or token fetch failed — skipping volume")
        return []

    url = DATA_URL_MOCK if use_mock else DATA_URL_LIVE
    payload = {
        "limit": limit,
        "fields": [
            "tradeDate",
            "productCategory",
            "yearsToMaturity",
            "benchmark",
            "dealerCustomerVolume",
            "atsInterdealerVolume",
            "dealerCustomerCount",
            "atsInterdealerCount",
            "volumeWeightedAveragePrice",
        ],
        "compareFilters": [
            {"fieldName": "tradeDate", "fieldValue": trade_date, "compareType": "equal"}
        ],
    }
    try:
        resp = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                # Confirmed real bug via live testing: without this, FINRA's
                # live endpoint defaults to returning CSV (text/plain), not
                # JSON — Content-Type above only describes the request
                # body's format, not the desired response format. The
                # mock endpoint apparently defaults to JSON already (which
                # is why earlier mock-only testing never caught this), but
                # the live endpoint does not.
                "Accept": "application/json",
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


def _row_total_volume_usd(row):
    """
    Sums the two venue fields into one total, converting from $ billions
    (FINRA's unit, confirmed from the sample) to raw dollars — matching
    the unit convention used everywhere else in this pipeline.
    """
    dealer = row.get("dealerCustomerVolume") or 0
    ats = row.get("atsInterdealerVolume") or 0
    return round((dealer + ats) * 1_000_000_000, 2)


def _bucket_upper_bound_years(years_to_maturity_str):
    """
    Extracts the upper-bound year number from a bucket label like
    "<= 2 years" or "> 2 years and <= 3 years". Returns None if the
    string doesn't parse (e.g. it's null, or an unexpected new format).
    """
    if not years_to_maturity_str:
        return None
    matches = re.findall(r"(\d+(?:\.\d+)?)\s*years?", years_to_maturity_str)
    if not matches:
        return None
    return float(matches[-1])  # the LAST number in the string is always the upper bound


def fetch_treasury_volume(use_mock=False, max_retry_days=5):
    """
    Returns:
        {
          "2yr": {"volume_usd": ..., "volume_date": ..., "volume_bucket_label": "<= 2 years"},
          "5yr": {...}, "10yr": {...},
          "1yr": {"volume_usd": None, "volume_note": "..."},
          "3mo": {"volume_usd": None, "volume_note": "..."},
        }
    Only On-the-run Nominal Coupons rows are used for 2yr/5yr/10yr — the
    on-the-run issue is the closest available proxy for "the current
    benchmark Nth-year Treasury" that this project's tenor-based design
    calls for. Returns an empty dict entirely if credentials aren't set
    or the fetch fails — same graceful-skip pattern used throughout this
    pipeline.

    For the mock dataset, always queries the one fixed date it actually
    has data for. For the live dataset, starts at the most recent likely
    business day (accounting for the ~1-day publish lag) and steps
    backward day by day, up to max_retry_days times, in case that day
    turns out to be a market holiday with no data.
    """
    if use_mock:
        records = _fetch_raw_records(MOCK_FIXED_DATE, use_mock=True)
    else:
        records = []
        for days_back in range(1, max_retry_days + 1):
            candidate_date = _most_recent_weekday_before(days_back)
            records = _fetch_raw_records(candidate_date, use_mock=False)
            if records:
                break
            print(f"  no data for {candidate_date}, trying an earlier day (likely a holiday)...")

    if not records:
        return {}

    bills_note = (
        "FINRA's Treasury Daily Aggregates dataset does not break Bills down by "
        "remaining maturity (yearsToMaturity is null for every Bills row) — "
        "3-month and 1-year volume cannot be separated from each other through "
        "this dataset, confirmed directly from a real sample response."
    )
    result = {
        "1yr": {"volume_usd": None, "volume_note": bills_note},
        "3mo": {"volume_usd": None, "volume_note": bills_note},
    }

    # Only on-the-run Nominal Coupons rows are candidates for the 2yr/5yr/10yr mapping.
    candidates = [
        r for r in records
        if r.get("productCategory") == "Nominal Coupons" and r.get("benchmark") == "On-the-run"
    ]

    for tenor_key, target_years in TENOR_TARGET_YEARS.items():
        best_row, best_diff = None, None
        for row in candidates:
            upper = _bucket_upper_bound_years(row.get("yearsToMaturity"))
            if upper is None:
                continue
            diff = abs(upper - target_years)
            if best_diff is None or diff < best_diff:
                best_row, best_diff = row, diff

        if best_row is None:
            result[tenor_key] = {
                "volume_usd": None,
                "volume_note": "No matching on-the-run Nominal Coupons bucket found in this response.",
            }
            continue

        result[tenor_key] = {
            "volume_usd": _row_total_volume_usd(best_row),
            "volume_date": best_row.get("tradeDate"),
            "volume_bucket_label": best_row.get("yearsToMaturity"),
            "volume_source": "finra_trace_treasury_daily_aggregates",
        }

    return result


if __name__ == "__main__":
    import json

    print("Testing against the MOCK dataset first...")
    result = fetch_treasury_volume(use_mock=True)
    print(json.dumps(result, indent=2))
