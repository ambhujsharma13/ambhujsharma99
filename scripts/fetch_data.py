#!/usr/bin/env python3
"""
fetch_data.py
=============
Daily data pipeline for the market volume/price dashboard.

What it does, each time it runs:
  1. Reads the watchlist in tickers.json (11 markets, ~10 liquid tickers each).
  2. Pulls daily OHLCV history for each ticker via yfinance.
     - On the very first run, backfills ~90 calendar days (satisfies the
       "at least 1-2 months of history" requirement immediately).
     - On subsequent runs, only new days are appended (the script is
       idempotent — re-running it never duplicates a date).
  3. Pulls daily FX rates (local currency -> USD) via the free, keyless
     Frankfurter API (https://www.frankfurter.app), and converts every
     price and every dollar-volume figure to USD.
  4. Computes, for every ticker on every trading day:
       - daily $ volume  (close * volume, in USD)
       - daily % price change
       - rolling 3-trading-day $ volume sum and % price change
         (Day1 = 2 trading days ago, Day3 = most recent close, matching
         the "Day 1 / Day 2 / Day 3" convention used earlier in this project)
  5. Pulls daily GDP data per country via the free World Bank API, and a
     lightweight (market-cap-only, no price history) pass over a broader
     ~500-ticker large-cap universe (scripts/market_cap_universe.json) to
     compute a meaningful market-cap-to-GDP ratio per country.
  6. Writes one JSON file per market to /data (e.g. data/US.json), plus a
     data/_meta.json with the last-updated timestamp. The Next.js frontend
     reads these JSON files directly — no live database needed at request time.

Runtime note: step 5 adds roughly 500 extra network calls on top of the
~110 volume-tracking tickers, so expect this script to take noticeably
longer to run (potentially several minutes) than earlier versions. If you
see yfinance timeouts or empty results for a chunk of tickers, that's
usually transient rate-limiting — safe to just re-run the script.

Network note: this script needs real internet access (Yahoo Finance's data
API + Frankfurter's FX API). It will NOT run inside a sandboxed environment
with restricted egress. It's designed to run in GitHub Actions (see
.github/workflows/update-data.yml), which has full internet access.

Usage:
    pip install -r requirements.txt
    python scripts/fetch_data.py
"""

import json
import math
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd
import requests
import yfinance as yf  # only used directly by fetch_10y_yield below — that's a Yahoo-specific
                        # data point (^TNX), not part of the provider-swappable pipeline

from provider_config import get_provider, DATA_PROVIDER
from treasury_yields import fetch_treasury_yields

ROOT = Path(__file__).resolve().parent.parent
TICKERS_FILE = Path(__file__).resolve().parent / "tickers.json"
MARKET_CAP_UNIVERSE_FILE = Path(__file__).resolve().parent / "market_cap_universe.json"
COMMODITIES_FILE = Path(__file__).resolve().parent / "commodities.json"
# Data files are written straight into the Next.js app's public/ folder so
# they're served as static assets with zero build step — the frontend just
# fetch()'s /data/US.json etc. at runtime. When GitHub Actions commits new
# data here and pushes, Vercel (or any static host watching the repo)
# redeploys automatically and the new data is live.
DATA_DIR = ROOT / "web" / "public" / "data"
BACKFILL_DAYS = 90          # first-run history depth (~3 months of calendar days)
ROLLING_WINDOW = 3          # "3-day" window, in trading days

# Currencies that trade in a minor unit (pence / agorot) rather than the
# major unit. yfinance returns raw exchange prices, so these need /100
# before FX conversion to major-unit-per-USD rates applies correctly.
MINOR_UNIT_CURRENCIES = {"GBp": ("GBP", 100), "ILA": ("ILS", 100)}


def fetch_gdp_usd(iso2_codes):
    """
    Latest available GDP (current US$) per country from the World Bank's
    free, keyless API. GDP is reported annually with a lag (you'll usually
    get last year's or the year-before's confirmed figure) — that's fine,
    since GDP doesn't meaningfully move day to day. Returns:
        { "US": {"value": 27360935000000, "year": "2024"}, ... }
    keyed by the same 2-letter code you passed in.
    """
    results = {}
    codes = ";".join(sorted(set(iso2_codes)))
    url = (
        f"https://api.worldbank.org/v2/country/{codes}/indicator/NY.GDP.MKTP.CD"
        f"?format=json&per_page=500&date=2015:2026"
    )
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    payload = resp.json()
    if len(payload) < 2 or payload[1] is None:
        print("    WARNING: World Bank GDP API returned no data")
        return results

    # payload[1] is a flat list of {country: {id, value}, date, value, ...}
    # spanning multiple years per country. Keep the first non-null value
    # seen per country — the API returns newest year first by default.
    for row in payload[1]:
        code = row["country"]["id"]
        if code in results:
            continue
        if row["value"] is not None:
            results[code] = {"value": row["value"], "year": row["date"]}
    return results


def fetch_market_cap_usd(provider, symbol, currency, fx_by_currency, latest_date):
    """
    Current market cap for one ticker, converted to USD. Routed through
    the active data provider (see provider_config.py) rather than calling
    yfinance directly, so swapping providers later doesn't touch this logic.
    """
    try:
        cap_local = provider.get_market_cap(symbol)
        if not cap_local:
            return None

        if currency in MINOR_UNIT_CURRENCIES:
            major_ccy, divisor = MINOR_UNIT_CURRENCIES[currency]
            cap_local = cap_local / divisor
            fx_lookup_ccy = major_ccy
        else:
            fx_lookup_ccy = currency

        if fx_lookup_ccy == "USD":
            fx = 1.0
        else:
            # market cap is a "right now" figure, not tied to a specific
            # trading day, so fall back to the most recent FX rate available
            # if today's exact date isn't in the FX series yet.
            series = fx_by_currency.get(fx_lookup_ccy, {})
            fx = series.get(latest_date) or (list(series.values())[-1] if series else None)
        if fx is None:
            return None

        return round(cap_local * fx, 2)
    except Exception as e:
        print(f"    WARNING: could not fetch market cap for {symbol}: {e}")
        return None


def load_commodities():
    with open(COMMODITIES_FILE) as f:
        return json.load(f)


def build_commodities_dataset(provider):
    """
    Commodities/crypto are already USD-denominated (futures settle in USD,
    BTC-USD is USD by definition), so this skips the FX-conversion step
    entirely — much simpler than the per-market stock pipeline. Volume here
    is left as raw contract count (labeled as such in the output), NOT
    converted to a dollar-volume figure — futures contract sizes vary
    wildly (100 oz for gold, 5,000 bushels for soybeans, etc.), and getting
    that multiplier wrong per-commodity would silently produce a wrong
    number, so this deliberately doesn't attempt it.
    """
    config = load_commodities()
    existing_path = DATA_DIR / "_commodities.json"
    existing = {}
    if existing_path.exists():
        with open(existing_path) as f:
            existing = json.load(f).get("commodities", {})

    start_date = (
        (datetime.now(timezone.utc) - timedelta(days=BACKFILL_DAYS)).strftime("%Y-%m-%d")
        if not existing
        else (datetime.now(timezone.utc) - timedelta(days=10)).strftime("%Y-%m-%d")
    )

    result = {}
    for c in config["commodities"]:
        symbol, name, unit = c["symbol"], c["name"], c["unit"]
        print(f"  fetching {symbol} ({name})...")
        history = provider.get_daily_history(symbol, start_date)
        if not history:
            print(f"    WARNING: no data returned for {symbol}, skipping")
            continue

        rows_by_date = {r["date"]: r for r in existing.get(symbol, {}).get("history", [])}
        for r in history:
            rows_by_date[r["date"]] = {
                "date": r["date"],
                "close_usd": round(float(r["close"]), 4),
                "volume_contracts": int(r["volume"]) if r["volume"] else None,
            }
        sorted_rows = sorted(rows_by_date.values(), key=lambda x: x["date"])

        for i, row in enumerate(sorted_rows):
            if i > 0:
                prev = sorted_rows[i - 1]["close_usd"]
                row["daily_change_pct"] = round((row["close_usd"] / prev - 1) * 100, 2)
            else:
                row["daily_change_pct"] = None
            if i >= ROLLING_WINDOW - 1:
                start_close = sorted_rows[i - ROLLING_WINDOW + 1]["close_usd"]
                row["rolling_3d_change_pct"] = round((row["close_usd"] / start_close - 1) * 100, 2)
            else:
                row["rolling_3d_change_pct"] = None

        result[symbol] = {"name": name, "unit": unit, "history": sorted_rows}

    return {"commodities": result}


def build_currencies_dataset(fx_by_currency, currency_labels):
    """
    Reuses the FX rate series already fetched for stock-price conversion —
    no extra network calls needed. Rate is expressed as "1 unit of this
    currency = $X USD", the same convention used throughout the site,
    rather than mixing quote conventions (EUR/USD vs USD/JPY) which tends
    to confuse anyone not already fluent in FX market notation.
    """
    result = {}
    for ccy, series in fx_by_currency.items():
        sorted_dates = sorted(series.keys())
        rows = []
        for d in sorted_dates:
            rows.append({"date": d, "usd_rate": round(series[d], 6)})
        for i, row in enumerate(rows):
            if i > 0:
                prev = rows[i - 1]["usd_rate"]
                row["daily_change_pct"] = round((row["usd_rate"] / prev - 1) * 100, 3)
            else:
                row["daily_change_pct"] = None
            if i >= ROLLING_WINDOW - 1:
                start_rate = rows[i - ROLLING_WINDOW + 1]["usd_rate"]
                row["rolling_3d_change_pct"] = round((row["usd_rate"] / start_rate - 1) * 100, 3)
            else:
                row["rolling_3d_change_pct"] = None
        result[ccy] = {"label": currency_labels.get(ccy, ccy), "history": rows}
    return {"currencies": result}


# Only the US has a free, keyless, reliable 10-year bond yield ticker
# (Yahoo's ^TNX). Every global bond-yield API found during research
# requires a paid key — rather than fake the other 14 countries, this is
# left honestly empty for them, matching how the Russia gap is handled.
BOND_YIELD_TICKERS = {"US": "^TNX"}


def fetch_10y_yield(market):
    ticker = BOND_YIELD_TICKERS.get(market)
    if not ticker:
        return None
    try:
        df = yf.Ticker(ticker).history(period="5d", interval="1d")
        if df.empty:
            return None
        # ^TNX is quoted as yield * 10 (e.g. 42.5 = 4.25%) on Yahoo
        return round(float(df["Close"].iloc[-1]), 3)
    except Exception as e:
        print(f"    WARNING: could not fetch 10y yield for {market}: {e}")
        return None


def sanitize_for_json(obj):
    """
    Recursively replaces NaN/Infinity floats with None. Python's json
    module happily writes bare `NaN`/`Infinity` tokens (its own extension,
    not part of the JSON spec), which every browser's JSON.parse then
    rejects outright. This is a safety net applied right before every
    json.dump call, on top of the NaN guards already in the fetch
    functions themselves — belt and suspenders, since a stray division
    edge case anywhere in the pipeline could otherwise silently break the
    whole file again.
    """
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_for_json(v) for v in obj]
    return obj


def load_tickers():
    with open(TICKERS_FILE) as f:
        return json.load(f)


def load_market_cap_universe():
    with open(MARKET_CAP_UNIVERSE_FILE) as f:
        return json.load(f)


def fetch_universe_market_caps(provider, symbols, currency, fx_by_currency, latest_date):
    """
    Lightweight pass: current market cap only (no price history) for a
    larger list of tickers. Deliberately kept separate from the main
    per-ticker history loop so the daily volume pipeline doesn't slow down
    fetching ~100 names' full OHLCV history just to get one snapshot number
    each.
    """
    total = 0.0
    n_found = 0
    for symbol in symbols:
        cap = fetch_market_cap_usd(provider, symbol, currency, fx_by_currency, latest_date)
        if cap:
            total += cap
            n_found += 1
    return total, n_found


def fx_rates_to_usd(base_currencies, start_date, end_date):
    """
    Fetch daily FX rates for each currency vs USD from Frankfurter
    (ECB reference rates, free, no API key). Returns:
        { "EUR": {"2026-06-01": 1.0812, "2026-06-02": 1.0795, ...}, ... }
    Values are "how many USD does 1 unit of this currency buy".
    """
    rates = {}
    for ccy in base_currencies:
        if ccy == "USD":
            continue
        url = (
            f"https://api.frankfurter.app/{start_date}..{end_date}"
            f"?from={ccy}&to=USD"
        )
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        payload = resp.json()
        rates[ccy] = {day: vals["USD"] for day, vals in payload["rates"].items()}
    return rates


def existing_dates_for_market(market):
    path = DATA_DIR / f"{market}.json"
    if not path.exists():
        return set(), {}
    with open(path) as f:
        existing = json.load(f)
    dates = set()
    for key, ticker_rows in existing.get("tickers", {}).items():
        if key.startswith("__name__"):
            continue
        dates.update(row["date"] for row in ticker_rows)
    return dates, existing


def fetch_ticker_history(provider, symbol, start_date):
    """Pull daily OHLCV for one ticker starting at start_date (YYYY-MM-DD)."""
    history = provider.get_daily_history(symbol, start_date)
    if not history:
        return pd.DataFrame()
    df = pd.DataFrame(history)
    return df.rename(columns={"close": "close_local"})


def to_usd(row_close_local, row_volume, currency, fx_by_currency, date):
    """Convert one day's close price + $volume into USD."""
    close = row_close_local
    if currency in MINOR_UNIT_CURRENCIES:
        major_ccy, divisor = MINOR_UNIT_CURRENCIES[currency]
        close = close / divisor
        fx_lookup_ccy = major_ccy
    else:
        fx_lookup_ccy = currency

    if fx_lookup_ccy == "USD":
        fx = 1.0
    else:
        fx = fx_by_currency.get(fx_lookup_ccy, {}).get(date)
        if fx is None:
            return None, None  # no FX rate available for this date (holiday etc.)

    close_usd = close * fx
    dollar_volume_usd = close_usd * row_volume
    return close_usd, dollar_volume_usd


def build_market_dataset(provider, market, config, fx_by_currency, gdp_by_iso2, universe_config):
    currency = config["exchange_currency"]
    tickers = config.get("tickers", [])
    iso2 = config.get("iso2")

    if not tickers:
        return {
            "tickers": {},
            "currency": currency,
            "note": config.get("_note", ""),
            "country_stats": None,
        }

    existing_dates, existing_payload = existing_dates_for_market(market)
    start_date = (
        (datetime.now(timezone.utc) - timedelta(days=BACKFILL_DAYS)).strftime("%Y-%m-%d")
        if not existing_dates
        else (datetime.now(timezone.utc) - timedelta(days=10)).strftime("%Y-%m-%d")
        # small overlap window on incremental runs, de-duped below
    )
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    result_tickers = existing_payload.get("tickers", {}) if existing_dates else {}
    market_caps_usd = {}  # symbol -> current market cap in USD (a "right now" figure, not per-day)

    for t in tickers:
        symbol, name = t["symbol"], t["name"]
        print(f"  fetching {symbol} ({name})...")
        hist = fetch_ticker_history(provider, symbol, start_date)
        if hist.empty:
            print(f"    WARNING: no data returned for {symbol}, skipping")
            continue

        rows_by_date = {r["date"]: r for r in result_tickers.get(symbol, [])}
        for _, r in hist.iterrows():
            close_usd, dvol_usd = to_usd(
                r["close_local"], r["volume"], currency, fx_by_currency, r["date"]
            )
            if close_usd is None:
                continue
            rows_by_date[r["date"]] = {
                "date": r["date"],
                "close_usd": round(close_usd, 4),
                "volume_shares": int(r["volume"]),
                "dollar_volume_usd": round(dvol_usd, 2),
            }

        sorted_rows = sorted(rows_by_date.values(), key=lambda x: x["date"])

        cap_usd = fetch_market_cap_usd(provider, symbol, currency, fx_by_currency, today_str)
        if cap_usd:
            market_caps_usd[symbol] = cap_usd

        # daily % change + rolling 3-day % change and $ volume sum, plus
        # turnover ratio (dollar volume as a % of current market cap) —
        # this is the headline "how hard is this actually trading relative
        # to its own size" metric, much more comparable across wildly
        # different company sizes than raw dollar volume alone.
        for i, row in enumerate(sorted_rows):
            if i > 0:
                prev = sorted_rows[i - 1]["close_usd"]
                row["daily_change_pct"] = round((row["close_usd"] / prev - 1) * 100, 2)
            else:
                row["daily_change_pct"] = None

            if i >= ROLLING_WINDOW - 1:
                window = sorted_rows[i - ROLLING_WINDOW + 1 : i + 1]
                start_close = window[0]["close_usd"]
                row["rolling_3d_change_pct"] = round(
                    (row["close_usd"] / start_close - 1) * 100, 2
                )
                row["rolling_3d_dollar_volume_usd"] = round(
                    sum(w["dollar_volume_usd"] for w in window), 2
                )
            else:
                row["rolling_3d_change_pct"] = None
                row["rolling_3d_dollar_volume_usd"] = None

            if cap_usd:
                row["market_cap_usd"] = cap_usd
                row["turnover_daily_pct"] = round(row["dollar_volume_usd"] / cap_usd * 100, 4)
                if row["rolling_3d_dollar_volume_usd"] is not None:
                    row["turnover_3d_pct"] = round(
                        row["rolling_3d_dollar_volume_usd"] / cap_usd * 100, 4
                    )
                else:
                    row["turnover_3d_pct"] = None
            else:
                row["market_cap_usd"] = None
                row["turnover_daily_pct"] = None
                row["turnover_3d_pct"] = None

        result_tickers[symbol] = sorted_rows
        result_tickers[f"__name__{symbol}"] = name  # cheap lookup, see frontend

    # ---- country-level aggregate stats ----
    country_stats = None
    gdp_entry = gdp_by_iso2.get(iso2) if iso2 else None
    total_tracked_cap = sum(market_caps_usd.values()) if market_caps_usd else None
    latest_total_daily_vol = 0.0
    latest_total_3d_vol = 0.0
    has_latest = False
    for symbol in market_caps_usd:
        rows = result_tickers.get(symbol, [])
        if rows:
            latest = rows[-1]
            latest_total_daily_vol += latest.get("dollar_volume_usd") or 0
            latest_total_3d_vol += latest.get("rolling_3d_dollar_volume_usd") or 0
            has_latest = True

    # broader large-cap universe market cap — used specifically for the
    # market-cap-to-GDP ratio, since 10 volume-tracked tickers is too small
    # a base to meaningfully compare against a whole country's GDP.
    index100_cap = None
    index100_count = 0
    index100_label = universe_config.get("index_label", "") if universe_config else ""
    universe_symbols = universe_config.get("tickers", []) if universe_config else []
    if universe_symbols:
        print(f"  fetching market-cap-only universe ({len(universe_symbols)} names: {index100_label})...")
        total_cap, n_found = fetch_universe_market_caps(
            provider, universe_symbols, currency, fx_by_currency, today_str
        )
        if n_found:
            index100_cap = total_cap
            index100_count = n_found

    # currency exchange rate — reuses the FX series already fetched for
    # price conversion, no extra network calls needed. USD itself has no
    # rate (it's the base), so the US market's fx block stays null.
    fx_rate_usd = None
    fx_daily_change_pct = None
    fx_3d_change_pct = None
    fx_lookup_ccy = MINOR_UNIT_CURRENCIES[currency][0] if currency in MINOR_UNIT_CURRENCIES else currency
    if fx_lookup_ccy != "USD":
        series = fx_by_currency.get(fx_lookup_ccy, {})
        sorted_dates = sorted(series.keys())
        if sorted_dates:
            fx_rate_usd = round(series[sorted_dates[-1]], 6)
            if len(sorted_dates) >= 2:
                prev = series[sorted_dates[-2]]
                fx_daily_change_pct = round((fx_rate_usd / prev - 1) * 100, 3)
            if len(sorted_dates) >= ROLLING_WINDOW:
                start = series[sorted_dates[-ROLLING_WINDOW]]
                fx_3d_change_pct = round((fx_rate_usd / start - 1) * 100, 3)

    bond_yield_10y_pct = fetch_10y_yield(market)

    if total_tracked_cap or gdp_entry or index100_cap:
        country_stats = {
            "gdp_usd": gdp_entry["value"] if gdp_entry else None,
            "gdp_year": gdp_entry["year"] if gdp_entry else None,
            "tracked_market_cap_usd": round(total_tracked_cap, 2) if total_tracked_cap else None,
            "tracked_market_cap_note": (
                "Sum of market cap for the tracked watchlist tickers only — "
                "used for the turnover ratio, not the GDP comparison."
            ),
            "index100_market_cap_usd": round(index100_cap, 2) if index100_cap else None,
            "index100_label": index100_label,
            "index100_count": index100_count,
            "market_cap_to_gdp_pct": (
                round(index100_cap / gdp_entry["value"] * 100, 3)
                if (index100_cap and gdp_entry)
                else None
            ),
            "aggregate_daily_turnover_pct": (
                round(latest_total_daily_vol / total_tracked_cap * 100, 4)
                if (has_latest and total_tracked_cap)
                else None
            ),
            "aggregate_3d_turnover_pct": (
                round(latest_total_3d_vol / total_tracked_cap * 100, 4)
                if (has_latest and total_tracked_cap)
                else None
            ),
            "fx_rate_usd": fx_rate_usd,
            "fx_currency": fx_lookup_ccy if fx_lookup_ccy != "USD" else None,
            "fx_daily_change_pct": fx_daily_change_pct,
            "fx_3d_change_pct": fx_3d_change_pct,
            "bond_yield_10y_pct": bond_yield_10y_pct,
            "bond_yield_note": (
                None
                if bond_yield_10y_pct is not None
                else "No free, reliable global bond-yield API found — only the US 10-year is available for now."
            ),
        }

    return {
        "tickers": result_tickers,
        "currency": currency,
        "note": config.get("_note", ""),
        "country_stats": country_stats,
    }


def main():
    DATA_DIR.mkdir(exist_ok=True)
    config = load_tickers()
    universe = load_market_cap_universe()

    provider = get_provider()
    print(f"Using data provider: {DATA_PROVIDER}")

    all_currencies = {
        v["exchange_currency"]
        for k, v in config.items()
        if not k.startswith("_") and v.get("tickers")
    }
    # expand minor-unit currencies to their major-unit equivalent for FX lookup
    fx_needed = set()
    for ccy in all_currencies:
        if ccy in MINOR_UNIT_CURRENCIES:
            fx_needed.add(MINOR_UNIT_CURRENCIES[ccy][0])
        else:
            fx_needed.add(ccy)

    end_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    start_date = (datetime.now(timezone.utc) - timedelta(days=BACKFILL_DAYS)).strftime("%Y-%m-%d")

    print(f"Fetching FX rates for {sorted(fx_needed)} from {start_date} to {end_date}...")
    fx_by_currency = fx_rates_to_usd(fx_needed, start_date, end_date)

    iso2_codes = [v["iso2"] for k, v in config.items() if not k.startswith("_") and v.get("iso2")]
    print(f"\nFetching GDP for {sorted(iso2_codes)} from the World Bank API...")
    try:
        gdp_by_iso2 = fetch_gdp_usd(iso2_codes)
    except Exception as e:
        print(f"  WARNING: GDP fetch failed entirely ({e}), continuing without it")
        gdp_by_iso2 = {}
    print("\nFetching US Treasury yields...")
    treasury_yields = fetch_treasury_yields()
    if treasury_yields:
        with open(DATA_DIR / "_treasury_yields.json", "w") as f:
            json.dump(sanitize_for_json(treasury_yields), f, indent=2)

    summary = {}
    for market, cfg in config.items():
        if market.startswith("_"):
            continue
        print(f"\n=== {market} ===")
        dataset = build_market_dataset(
            provider, market, cfg, fx_by_currency, gdp_by_iso2, universe.get(market)
        )
        out_path = DATA_DIR / f"{market}.json"
        with open(out_path, "w") as f:
            json.dump(sanitize_for_json(dataset), f, indent=2)
        n_tickers = len([k for k in dataset["tickers"] if not k.startswith("__name__")])
        summary[market] = n_tickers
        print(f"  wrote {out_path} ({n_tickers} tickers)")

    print("\n=== Commodities ===")
    commodities_dataset = build_commodities_dataset(provider)
    with open(DATA_DIR / "_commodities.json", "w") as f:
        json.dump(sanitize_for_json(commodities_dataset), f, indent=2)
    print(f"  wrote {len(commodities_dataset['commodities'])} commodities")

    print("\n=== Currency pairs ===")
    currency_labels = {
        "EUR": "Euro", "GBP": "British Pound", "CNY": "Chinese Yuan",
        "INR": "Indian Rupee", "BRL": "Brazilian Real", "RUB": "Russian Ruble",
        "ILS": "Israeli Shekel", "TRY": "Turkish Lira", "CAD": "Canadian Dollar",
        "KRW": "South Korean Won", "JPY": "Japanese Yen",
    }
    currencies_dataset = build_currencies_dataset(fx_by_currency, currency_labels)
    with open(DATA_DIR / "_currencies.json", "w") as f:
        json.dump(sanitize_for_json(currencies_dataset), f, indent=2)
    print(f"  wrote {len(currencies_dataset['currencies'])} currency pairs")

    meta = {
        "last_updated_utc": datetime.now(timezone.utc).isoformat(),
        "markets": summary,
    }
    with open(DATA_DIR / "_meta.json", "w") as f:
        json.dump(sanitize_for_json(meta), f, indent=2)

    print("\nDone. Last updated:", meta["last_updated_utc"])


if __name__ == "__main__":
    main()
