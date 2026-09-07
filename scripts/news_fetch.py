"""
Fetches financial news from NewsData.io and scores each article for
relevance to InfinityVolume's tracked universe, currently scoped to ONLY
the 25 US equities (per explicit scope restriction) — international
stocks (13 other markets) and ETFs are not queried or matched against.
Macro/financial-conditions keywords (Federal Reserve, Treasury yield,
etc.) are still included, since those are inherently US-focused topics
already, not part of the international-market scope that was dropped.

Kept as its OWN standalone script, separate from fetch_data.py's main
pipeline, because this is meant to run more frequently (a few times a
day) than the once/twice-daily main data fetch — bundling the two
together would force both onto the same schedule. Scheduling this to run
every ~6 hours (via GitHub Actions or similar) is a separate setup step,
not handled by this file itself.

Needs NEWSDATA_API_KEY set — free signup at https://newsdata.io/register
(no credit card; explicitly licensed for commercial use on the free tier,
per NewsData.io's own published terms — see the research that led to this
choice over NewsAPI.org, whose free tier explicitly prohibits production
use).

QUERY BUDGET: with the earlier 164-entity scope (all markets + ETFs), a
100-character query limit (confirmed directly from NewsData.io's own
OpenAPI spec) meant covering everyone in one run would take ~55-65
queries — nearly the entire daily credit budget — which is why a
time-of-day rotation strategy existed (see select_rotation_group, now
unused but left in place). At the current 25-US-equity scope, the full
list fits comfortably in a single run: ~25 entities / 2-3 per batch ≈ 9
queries, plus 2 for the macro keywords ≈ 11 credits/run. At 4 runs/day
that's ~44 credits/day — comfortably inside the ~200/day free-tier
budget, with the full US equity list covered on every single run rather
than split across rotation slots.

There's also a separate 15-minute rate-limit window (distinct from the
daily credit budget), confirmed via a real test run where firing many
requests back-to-back with no delay triggered HTTP 429s partway through —
handled via a fixed pacing delay plus retry-with-backoff.

SCORING (3 signals, confirmed with you before building):
  1. Direct entity match: company name in the headline (10 pts) vs.
     only in the body (4 pts), plus bare-ticker matching (10/4 pts, same
     title/body split) for symbols 3+ letters long — confirmed via
     testing that real headlines almost always use the ticker or a short
     name ("AMD"), not the formal registered name ("Advanced Micro
     Devices"), so name-only matching missed most real articles. Symbols
     under 3 letters or on the manual exclusion list are NEVER
     bare-matched (V, MA, HD, PG double as common words/abbreviations —
     Visa, Mastercard, "HD" for high-definition, "PG" for the movie
     rating — and would false-positive constantly). The $CASHTAG form
     (e.g. $V) always works regardless of length, since that's an
     unambiguous, deliberate reference. Name-matching itself is
     word-boundary-safe (confirmed via testing that plain substring
     matching let "ITC" match inside the unrelated word "bitcoin"), and
     names that are themselves ordinary English words (like "SAP") are
     excluded from plain-text matching entirely, requiring the $CASHTAG
     form instead.
  2. Macro/indicator topic keyword match (6 pts per unique keyword hit),
     tied directly to the site's 7 Financial Conditions indicators and
     Treasury yield curve, not generic finance buzzwords.
  3. Recency decay: full score under 6 hours old, 80% up to 24 hours,
     excluded entirely beyond 24 hours — keeps the feed feeling like
     news, not an archive.

Institutional-filing "13F wire" stories (e.g. "Some Wealth Management LLC
Buys 10,000 Shares of X") are detected and EXCLUDED ENTIRELY (per your
explicit call), not just down-ranked — see is_institutional_filing_noise.
"""

import json
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
TICKERS_FILE = Path(__file__).resolve().parent / "tickers.json"
ETFS_FILE = Path(__file__).resolve().parent / "etfs.json"
DATA_DIR = ROOT / "web" / "public" / "data"

NEWSDATA_API_KEY = os.environ.get("NEWSDATA_API_KEY", "")
NEWSDATA_URL = "https://newsdata.io/api/1/latest"

# Confirmed directly from NewsData.io's own OpenAPI spec: q has a 100-char
# max on the free tier. MAX_QUERY_CHARS stays safely under that.
MAX_QUERY_CHARS = 90
BATCH_SIZE = 3  # small on purpose — also guards against a "too many logical
                # operators" rejection, a separate error code NewsData.io's
                # spec lists but doesn't give an exact threshold for.
ROTATION_GROUPS = 4       # matches an intended ~4 runs/day (every 6 hours)
REQUEST_DELAY_SECONDS = 2  # paces requests inside the 15-minute rate window
MAX_RETRIES = 2
MAX_ARTICLES_KEPT = 50

RECENCY_FULL_HOURS = 6
RECENCY_CUTOFF_HOURS = 24

ENTITY_TITLE_POINTS = 10
ENTITY_BODY_POINTS = 4
CASHTAG_POINTS = 8
MACRO_MATCH_POINTS = 6

MACRO_KEYWORDS = [
    "Federal Reserve",
    "Fed funds rate",
    "Treasury yield",
    "yield curve",
    "money supply",
    "credit spread",
]

# Manual safety net on top of the 3+ character threshold — for any short
# ticker that happens to double as a common English word/abbreviation.
# The 1-2 character tickers in the current universe (V, MA, HD, PG) are
# already excluded by the length check alone; this list exists for
# whatever gets added later that the length rule alone wouldn't catch.
BARE_MATCH_EXCLUDED = {"ALL", "ONE", "ANY", "ARE", "CAN", "FOR", "NEW", "OUT", "WHO"}

# Signal 4 (added after a real test run surfaced this pattern): routine
# "13F filing wire" stories — small advisory firms' PR services
# auto-publish these in bulk ("Some Wealth Management LLC Buys 10,000
# Shares of SPDR Gold Shares $GLD"). They genuinely mention a tracked
# ticker (which is why they'd otherwise score high via the title +
# cashtag bonus), but they're low-information noise for a "Flash" feed
# meant to highlight real news, and there are SO many of them relative to
# genuine breaking news that they crowded out a genuinely relevant
# article in real testing (7 of the top 10 results were this exact
# pattern). Detected via two independent word-presence checks — an
# institutional-firm-name indicator AND a holdings-transaction indicator
# — rather than one combined regex, so word order doesn't matter
# ("X LLC Buys Shares" vs. "Shares Bought by X LLC" both match equally).
# Broadened once to add "PLC" (UK company suffix, reasonably unambiguous).
# Also tried adding AG, SA, NV, SE, AB (German/French/Dutch/EU/Swedish
# suffixes) after a real "...AG Acquires..." example slipped through, but
# reverted after testing found a genuine false positive: "SE" is also the
# common abbreviation for "Southeast" (as in "SE Asian markets"), which
# incorrectly excluded an unrelated NVIDIA article. AG/NV/AB carry similar
# collision risk with "Agriculture"/"Nevada"/"Alberta". Accepting that some
# European institutional-filing noise using these suffixes may occasionally
# slip through uncaught is a much better trade than risking exclusion of
# genuine news over a common geographic abbreviation.
_NOISE_FIRM_RE = re.compile(
    r"\b(LLC|L\.L\.C|Inc|Incorporated|Capital|Wealth|Advisory|Advisors?|Management|Group|PLC)\b",
    re.IGNORECASE,
)
# Broadened after a second real test run surfaced more verb/noun variants
# my first version missed entirely ("Acquires", "Grows", "Invests",
# standalone "Holdings") — rather than keep chasing individual words,
# this combines a wide action-verb list, a wide holdings-noun list, AND a
# dollar-amount/share-count numeric pattern into ONE alternation, since
# every real example seen so far cites a specific dollar value or share
# count regardless of which verb it uses — that numeric detail is the
# actual defining feature of this genre, not any particular word choice.
_NOISE_TRANSACTION_RE = re.compile(
    r"\b(Shares|Stock Holdings|Holdings|Position|Stake|Ownership)\b"
    r"|\b(Has|Have|Buys?|Bought|Purchases?|Purchased|Sells?|Sold|Decreases?|Decreased|"
    r"Increases?|Increased|Takes?|Took|Trims?|Trimmed|Boosts?|Boosted|Reduces?|Reduced|"
    r"Raises?|Raised|Holds?|Held|Acquires?|Acquired|Grows?|Grew|Invests?|Invested|Investment|"
    r"Lowers?|Lowered|Cuts?|Adds?|Added)\b"
    r"|\$[\d,]+(?:\.\d+)?\s*(?:Million|Billion|Thousand)?\b"
    r"|\b\d{1,3}(?:,\d{3})+\b",  # comma-formatted share counts like "64,607"
    re.IGNORECASE,
)

# Signal 4b, added after a real example slipped through with no firm
# suffix at all: "Timothy Schmid Sells 33,597 Shares of Johnson & Johnson
# (NYSE:JNJ) Stock" — an individual insider trade (likely an SEC Form 4
# filing), not a firm's 13F filing. Same low-information genre, just a
# person as the subject instead of a company. Detects a capitalized
# 2-3-word name at the very START of the title, immediately followed by
# a transaction verb — per your explicit call to exclude these too.
#
# KNOWN, ACCEPTED AMBIGUITY: a genuinely newsworthy headline like "Warren
# Buffett Buys Apple Shares" structurally matches this exact same pattern
# and would also get excluded — the same bounded trade-off already
# accepted for the firm-based case ("Berkshire Hathaway Inc. Increases
# Stake" would also be caught). Keyword/structure-based detection can't
# distinguish "a random insider" from "a market-moving investor" without
# real entity recognition, which is out of scope here.
_PERSON_TRADE_RE = re.compile(
    r"^([A-Z][a-z]+\.?\s+){1,2}[A-Z][a-z]+\s+"
    r"(Sells?|Sold|Buys?|Bought|Purchases?|Purchased|Acquires?|Acquired)\b"
)


def is_institutional_filing_noise(title):
    return bool(_NOISE_TRANSACTION_RE.search(title) and (_NOISE_FIRM_RE.search(title) or _PERSON_TRADE_RE.search(title)))


# Company names that are ALSO ordinary English words — confirmed twice
# via testing: SAP's name matched the word "sap" (tree sap) in an
# unrelated Hyundai article, and Intel's name matched "Intel" used
# generically to mean "intelligence" ("Ukraine Intel Agency Feud").
# Word-boundary protection alone doesn't help here, since these ARE
# genuine whole-word collisions, not partial-word bugs — this needs an
# explicit exclusion instead. For any name in this set, only the
# $CASHTAG form counts; the plain name is never matched in text.
#
# "alphabet", "oracle", and "adobe" added proactively (not yet confirmed
# via a live false positive) after reviewing the full US ticker list post
# SAP/Intel — these are all common generic English words/concepts
# independent of the company, and excluding them only risks missing a
# match (a minor, bounded cost), unlike over-broadening noise detection
# (which risks hiding genuine news — a more serious cost, per the
# "SE"/Southeast lesson above).
COMMON_WORD_NAMES = {
    "sap", "intel", "alphabet", "oracle", "adobe",
    # Added after "Visa" matched 3 of 10 top results that were actually
    # about travel visas (Mexico-US visa dispute, visa-free travel
    # announcements) — a bigger real-world impact than SAP/Intel, and a
    # gap in my earlier review: I checked whether each ticker was short
    # enough to need bare-ticker exclusion, but didn't separately
    # re-check every NAME field independently of its ticker's length.
    # "apple", "amazon", "tesla" added proactively given how much real
    # volume this bug category is now demonstrably causing — all three
    # are mega-caps that get plenty of genuine coverage via $AAPL/$AMZN/
    # $TSLA cashtags anyway, so requiring cashtag-only matching for them
    # costs little while meaningfully cutting noise.
    "visa", "apple", "amazon", "tesla",
}

# Bare-ticker symbols that are ALSO ordinary words/generic industry terms
# — separate from COMMON_WORD_NAMES because these companies' actual
# tracked NAMES ("Costco", "Salesforce") are perfectly safe and distinct;
# the risk is specifically in the bare-ticker-matching fallback path
# (see score_article), which would otherwise match "COST" against the
# ordinary word "cost" (appearing in virtually every economic article
# ever written) or "CRM" against the generic tech/business term
# "Customer Relationship Management" software, independent of Salesforce.
BARE_TICKER_COMMON_WORDS = {"COST", "CRM"}


def load_entities():
    """
    Returns [{name, symbol, kind}, ...] for US equities ONLY — per your
    explicit scope restriction. International stocks (13 other markets)
    and ETFs are no longer loaded here at all; this reads only the "US"
    entry in tickers.json, nothing from etfs.json.
    """
    entities = []
    with open(TICKERS_FILE) as f:
        tickers_config = json.load(f)
    us_config = tickers_config.get("US", {})
    for t in us_config.get("tickers", []):
        entities.append({"name": t["name"], "symbol": t["symbol"], "kind": "stock"})

    return entities


def select_rotation_group(entities, num_groups=ROTATION_GROUPS):
    """
    NOTE: currently UNUSED — this was needed when the tracked universe was
    164 entities (all 15 markets + ETFs), where a single run's credit
    budget couldn't cover everyone. Now that scope is restricted to just
    the 25 US equities, that full list comfortably fits in one run
    without splitting, so fetch_and_score_news() queries all of them
    directly instead of calling this. Left in place in case the scope
    ever expands back to international coverage later.

    Deterministically picks which slice of the tracked universe to query
    THIS run, based purely on the current UTC hour — no state file needed.
    Running every 6 hours with 4 groups means hours 0-5 -> group 0,
    6-11 -> group 1, 12-17 -> group 2, 18-23 -> group 3, so the full
    universe gets covered once per day across 4 runs, and which group
    runs when is fully predictable from the clock alone.
    """
    hour = datetime.now(timezone.utc).hour
    group_size = len(entities) // num_groups + 1
    group_index = (hour * num_groups) // 24
    start = group_index * group_size
    return entities[start:start + group_size], group_index


def batch_entities(entities, batch_size=BATCH_SIZE, max_chars=MAX_QUERY_CHARS):
    """
    Groups entity names into OR-query batches, respecting both a max
    count per batch and NewsData.io's query-length limit — a batch ends
    early (even below batch_size) if adding the next name would exceed
    max_chars, rather than ever risking a rejected query.
    """
    batches, current, current_len = [], [], 0
    for entity in entities:
        piece_len = len(entity["name"]) + 6  # quotes + ' OR '
        if current and (len(current) >= batch_size or current_len + piece_len > max_chars):
            batches.append(current)
            current, current_len = [], 0
        current.append(entity)
        current_len += piece_len
    if current:
        batches.append(current)
    return batches


def build_or_query(names):
    return "(" + " OR ".join(f'"{n}"' for n in names) + ")"


def fetch_newsdata(query):
    """
    One NewsData.io /latest call, with retry-on-429 (the separate 15-minute
    rate-limit window, distinct from the daily credit budget — confirmed
    via a real test run that firing requests back-to-back with no delay
    triggers this) and a fixed pacing delay after every call, success or
    failure, so the request rate stays gentle throughout a run.
    """
    params = {"apikey": NEWSDATA_API_KEY, "q": query, "language": "en"}
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = requests.get(NEWSDATA_URL, params=params, timeout=30)
        except requests.RequestException as e:
            print(f"    WARNING: request failed ({query[:50]}...): {e}")
            time.sleep(REQUEST_DELAY_SECONDS)
            return []

        if resp.status_code == 429 and attempt < MAX_RETRIES:
            wait = REQUEST_DELAY_SECONDS * (attempt + 2)
            print(f"    rate-limited, waiting {wait}s before retry ({query[:50]}...)")
            time.sleep(wait)
            continue

        if resp.status_code != 200:
            print(f"    WARNING: HTTP {resp.status_code} for query ({query[:50]}...)")
            time.sleep(REQUEST_DELAY_SECONDS)
            return []

        data = resp.json()
        time.sleep(REQUEST_DELAY_SECONDS)
        if data.get("status") != "success":
            print(f"    WARNING: status={data.get('status')} message={data.get('message')}")
            return []
        return data.get("results", []) or []
    return []


_CASHTAG_CACHE = {}


def cashtag_pattern(symbol):
    """
    Matches the $CASHTAG form of a symbol, using only the portion before
    any exchange suffix (e.g. "SAP" for "SAP.DE", not the full suffixed
    string) — confirmed via testing that real financial news writes
    "$SAP", never "$SAP.DE", so building the pattern from the full symbol
    silently never matched anything for any of the ~140 international
    tickers that carry an exchange suffix. Only the ~25 suffix-free US
    tickers would ever have actually worked before this fix.
    """
    base_symbol = symbol.split(".")[0]
    if base_symbol not in _CASHTAG_CACHE:
        _CASHTAG_CACHE[base_symbol] = re.compile(r"\$" + re.escape(base_symbol) + r"\b")
    return _CASHTAG_CACHE[base_symbol]


_NAME_PATTERN_CACHE = {}


def name_pattern(name):
    """
    Word-boundary-safe matching for company/ETF names — confirmed via
    testing that plain substring matching (the original approach) is a
    real bug: it matched "itc" (India's ITC Limited) as a hidden substring
    inside the unrelated word "bitcoin", since "in in_str" has no concept
    of word boundaries at all. re.escape handles names with special regex
    characters (apostrophes, ampersands, etc.) safely.
    """
    if name not in _NAME_PATTERN_CACHE:
        _NAME_PATTERN_CACHE[name] = re.compile(r"\b" + re.escape(name) + r"\b", re.IGNORECASE)
    return _NAME_PATTERN_CACHE[name]


def recency_multiplier(pub_date_str):
    """
    1.0 under RECENCY_FULL_HOURS old, 0.8 up to RECENCY_CUTOFF_HOURS,
    None (exclude entirely) beyond that or if the date can't be parsed —
    excluding on a parse failure is the safer default than guessing.
    """
    try:
        pub_dt = datetime.strptime(pub_date_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        return None
    age_hours = (datetime.now(timezone.utc) - pub_dt).total_seconds() / 3600
    if age_hours < 0:
        return 1.0  # clock-skew edge case — treat as fresh rather than reject
    if age_hours <= RECENCY_FULL_HOURS:
        return 1.0
    if age_hours <= RECENCY_CUTOFF_HOURS:
        return 0.8
    return None


def score_article(article, entities):
    """
    Comprehensive scoring pass — checks the article against the FULL
    entity list and macro keyword list (not just whichever batch query
    happened to surface it), so an article mentioning two tracked
    companies gets credit for both regardless of which query found it.
    Returns (score, matched_names) or (None, []) if it doesn't clear the
    bar (no real match, or too old).

    Bare ticker matching (no $ required) is allowed ONLY for symbols 4+
    characters long — confirmed via testing that this genuinely matters:
    a real headline like "NVIDIA and AMD both rally" only matches AMD's
    full tracked name ("Advanced Micro Devices"), which real news
    headlines almost never use, so relying on name-matching alone missed
    it entirely. But symbols under 4 characters (V, MA, HD, PG in this
    tracked universe) double as common words/abbreviations (Visa,
    Mastercard, "HD" for high-definition, "PG" for the movie rating) and
    would false-positive constantly if bare-matched — those still
    require either their full name or the explicit $CASHTAG form.
    """
    title = article.get("title") or ""

    if is_institutional_filing_noise(title):
        return None, []

    full_text = " ".join(
        filter(None, [title, article.get("description") or "", article.get("content") or ""])
    )
    full_lower = full_text.lower()

    raw_score = 0.0
    matched_names = []
    for entity in entities:
        hit = False
        name_lower = entity["name"].lower()
        if name_lower not in COMMON_WORD_NAMES:
            if name_pattern(entity["name"]).search(title):
                raw_score += ENTITY_TITLE_POINTS
                hit = True
            elif name_pattern(entity["name"]).search(full_text):
                raw_score += ENTITY_BODY_POINTS
                hit = True

        if cashtag_pattern(entity["symbol"]).search(full_text):
            raw_score += CASHTAG_POINTS
            hit = True
        elif (
            len(entity["symbol"]) >= 3
            and entity["symbol"].isalpha()
            and entity["symbol"] not in BARE_MATCH_EXCLUDED
            and entity["symbol"] not in BARE_TICKER_COMMON_WORDS
        ):
            # Bare ticker match (no $ required) allowed for symbols 3+
            # letters that aren't on the manual exclusion list below.
            # isalpha() also naturally excludes suffix-heavy international
            # symbols like "300308.SZ", which would never appear as bare
            # text in English-language news anyway.
            bare_pattern = re.compile(r"\b" + re.escape(entity["symbol"]) + r"\b")
            if not hit and bare_pattern.search(full_text):
                raw_score += ENTITY_TITLE_POINTS if bare_pattern.search(title) else ENTITY_BODY_POINTS
                hit = True

        if hit:
            matched_names.append(entity["symbol"])

    for keyword in MACRO_KEYWORDS:
        if keyword.lower() in full_lower:
            raw_score += MACRO_MATCH_POINTS
            matched_names.append(keyword)

    if raw_score <= 0:
        return None, []

    multiplier = recency_multiplier(article.get("pubDate"))
    if multiplier is None:
        return None, []

    return round(raw_score * multiplier, 2), matched_names


def fetch_and_score_news():
    """
    Returns:
        {
          "articles": [
            {"title": ..., "url": ..., "source": ..., "pub_date": ...,
             "score": 27.5, "matched": ["NVDA", "Federal Reserve"]},
            ...
          ],
          "fetched_at": "..."
        }
    Sorted by score, descending. Returns None entirely if
    NEWSDATA_API_KEY isn't set — same graceful-skip pattern used
    throughout this pipeline.
    """
    if not NEWSDATA_API_KEY:
        print("  WARNING: NEWSDATA_API_KEY not set — skipping news fetch (see scripts/news_fetch.py)")
        return None

    all_entities = load_entities()
    batches = batch_entities(all_entities)
    print(
        f"  {len(all_entities)} tracked US equities -> {len(batches)} queries "
        f"(full list covered every run — no rotation needed at this scope)"
    )

    seen_urls = set()
    raw_articles = []

    for i, batch in enumerate(batches):
        query = build_or_query([e["name"] for e in batch])
        print(f"  fetching batch {i + 1}/{len(batches)} ({len(batch)} entities)...")
        for article in fetch_newsdata(query):
            url = article.get("link") or article.get("article_id")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            raw_articles.append(article)

    # Macro keywords also need small batches — even the full 6-keyword
    # list exceeds the 90-char safe limit once quoted and OR-joined.
    macro_batches = [MACRO_KEYWORDS[i:i + BATCH_SIZE] for i in range(0, len(MACRO_KEYWORDS), BATCH_SIZE)]
    for i, batch in enumerate(macro_batches):
        query = build_or_query(batch)
        print(f"  fetching macro query {i + 1}/{len(macro_batches)}...")
        for article in fetch_newsdata(query):
            url = article.get("link") or article.get("article_id")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            raw_articles.append(article)

    # Scoring always checks against the FULL entity list, not just this
    # run's rotation slice — an article surfaced by one group's query
    # might also mention an entity from a different group, and that
    # should still get full credit.
    scored = []
    for article in raw_articles:
        score, matched = score_article(article, all_entities)
        if score is None:
            continue
        scored.append({
            "title": article.get("title"),
            "url": article.get("link"),
            "source": article.get("source_id"),
            "pub_date": article.get("pubDate"),
            "score": score,
            "matched": matched,
        })

    scored.sort(key=lambda a: a["score"], reverse=True)
    return {
        "articles": scored[:MAX_ARTICLES_KEPT],
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def write_news():
    result = fetch_and_score_news()
    if result is None:
        return None
    with open(DATA_DIR / "_news.json", "w") as f:
        json.dump(result, f, indent=2)
    print(f"  wrote {len(result['articles'])} scored articles to _news.json")
    return result


if __name__ == "__main__":
    write_news()
