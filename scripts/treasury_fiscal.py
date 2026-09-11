"""
Fetches US Treasury auction data via the Treasury Fiscal Data API
(api.fiscaldata.treasury.gov) — free, public, no API key needed at
all, confirmed directly via live browser testing before writing this
module (unlike FINRA/FRED, there's no credential or rate-limit
handling needed here whatsoever).

Two datasets, both confirmed with real, current (not mock/sample) data
during development:

1. upcoming_auctions (od/upcoming_auctions) — announced-but-not-yet-
   held auctions: security type/term, CUSIP, offering amount,
   announcement/auction/issue dates. No result fields at all (rate/
   yield/price), since these auctions haven't happened yet.
2. auctions_query (od/auctions_query) — the full historical auction
   record, ~90 fields per row. Confirmed this single dataset actually
   contains BOTH past (with real results) and already-announced-but-
   not-yet-held future auctions together — sorting by -auction_date
   alone returned future dates first, with every result field null for
   those rows. Filtered explicitly to auction_date <= today rather than
   relying on a result field being non-null (some security types use
   high_discnt_rate instead of high_yield as their "result" field, so
   checking one specific field would silently miss the others).

"Clearing yield" per explicit request maps to high_yield — the highest
accepted yield at auction, which by Treasury's own single-price auction
rules is the rate ALL accepted bidders (competitive and noncompetitive)
receive, not just the top bidder. Bills use high_discnt_rate instead of
high_yield (a discount rate, not a yield, this dataset does not
convert one into the other) — both are fetched so bills aren't shown
as having no result at all.
"""

from datetime import datetime, timedelta, timezone

import requests

BASE_URL = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service"
UPCOMING_AUCTIONS_URL = f"{BASE_URL}/v1/accounting/od/upcoming_auctions"
AUCTIONS_QUERY_URL = f"{BASE_URL}/v1/accounting/od/auctions_query"


def _get(url, params):
    try:
        resp = requests.get(url, params=params, timeout=30)
    except requests.RequestException as e:
        print(f"    WARNING: Treasury Fiscal Data request failed: {e}")
        return []
    if resp.status_code != 200:
        print(f"    WARNING: Treasury Fiscal Data request returned HTTP {resp.status_code}: {resp.text[:200]}")
        return []
    try:
        return resp.json().get("data", [])
    except ValueError:
        print(f"    WARNING: Treasury Fiscal Data response was not valid JSON: {resp.text[:200]}")
        return []


def _to_number(value):
    # Confirmed live: this API returns every field as a string,
    # including numeric ones, and uses the literal string "null" (not
    # JSON null) for genuinely missing values — both handled here
    # rather than at each call site.
    if value is None or value == "null" or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def fetch_upcoming_auctions(limit=20):
    """
    Returns a list, soonest auction first:
        [{"security_type": ..., "security_term": ..., "cusip": ...,
          "offering_amount": ..., "announcement_date": ...,
          "auction_date": ..., "issue_date": ..., "reopening": ...}, ...]

    Confirmed real bug via live testing: this endpoint's name suggests
    it only contains currently-pending auctions, but it actually
    behaves as a running archive of every upcoming-auction announcement
    ever made, past ones included — sorting ascending by auction_date
    alone surfaced 2024 records, the oldest in the whole archive, not
    the soonest ones relative to today. Fixed by adding an explicit
    auction_date >= today filter, the same technique already used in
    fetch_past_auctions below, rather than relying on sort order alone.
    """
    fields = [
        "record_date",
        "security_type",
        "security_term",
        "cusip",
        "offering_amt",
        "announcemt_date",
        "auction_date",
        "issue_date",
        "reopening",
    ]
    today = datetime.now(timezone.utc).date().strftime("%Y-%m-%d")
    params = {
        "fields": ",".join(fields),
        "filter": f"auction_date:gte:{today}",
        "sort": "auction_date",  # soonest first — ascending, the default direction without a leading "-"
        "page[size]": limit,
    }
    rows = _get(UPCOMING_AUCTIONS_URL, params)
    result = []
    for r in rows:
        result.append(
            {
                "security_type": r.get("security_type"),
                "security_term": r.get("security_term"),
                "cusip": r.get("cusip"),
                "offering_amount": _to_number(r.get("offering_amt")),
                "announcement_date": r.get("announcemt_date"),
                "auction_date": r.get("auction_date"),
                "issue_date": r.get("issue_date"),
                "reopening": r.get("reopening"),
            }
        )
    return result


def fetch_past_auctions(days=95, limit=100):
    """
    Returns a list, most recent auction first:
        [{"security_type": ..., "security_term": ..., "cusip": ...,
          "offering_amount": ..., "auction_date": ..., "issue_date": ...,
          "high_yield_pct": ..., "high_discount_rate_pct": ...,
          "bid_to_cover_ratio": ...}, ...]
    high_yield_pct is populated for notes/bonds/TIPS/FRNs;
    high_discount_rate_pct for bills — a given row will only ever have
    one of the two populated, matching which result type that security
    type actually uses, per the module docstring.
    """
    fields = [
        "record_date",
        "security_type",
        "security_term",
        "cusip",
        "auction_date",
        "issue_date",
        "offering_amt",
        "high_yield",
        "high_discnt_rate",
        "bid_to_cover_ratio",
    ]
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=days)
    params = {
        "fields": ",".join(fields),
        "filter": f"auction_date:gte:{start_date.strftime('%Y-%m-%d')},auction_date:lte:{today.strftime('%Y-%m-%d')}",
        "sort": "-auction_date",
        "page[size]": limit,
    }
    rows = _get(AUCTIONS_QUERY_URL, params)
    result = []
    for r in rows:
        result.append(
            {
                "security_type": r.get("security_type"),
                "security_term": r.get("security_term"),
                "cusip": r.get("cusip"),
                "auction_date": r.get("auction_date"),
                "issue_date": r.get("issue_date"),
                "offering_amount": _to_number(r.get("offering_amt")),
                "high_yield_pct": _to_number(r.get("high_yield")),
                "high_discount_rate_pct": _to_number(r.get("high_discnt_rate")),
                "bid_to_cover_ratio": _to_number(r.get("bid_to_cover_ratio")),
            }
        )
    return result


if __name__ == "__main__":
    import json

    print("Upcoming auctions:")
    print(json.dumps(fetch_upcoming_auctions(limit=5), indent=2))
    print("\nPast auctions (last 95 days):")
    print(json.dumps(fetch_past_auctions(limit=5), indent=2))
