"""
Fetches daily price/volume history (same mechanism as stocks — ETFs trade
on regular exchanges) plus AUM (Assets Under Management) for the ETF
watchlist in etfs.json.

Kept as its own standalone script rather than folded into the Yahoo
provider abstraction (providers/yahoo.py) because AUM isn't a concept
that applies to individual stocks — it's fund-specific, so forcing it
into the shared DataProvider interface would make that interface worse
for its main job (stocks). This script calls yfinance directly.

AUM note: yfinance exposes this via the `totalAssets` field in a fund's
`.info` dict. This isn't guaranteed to be populated for every ETF (Yahoo's
own data completeness varies) — if it's missing, this returns None rather
than guessing, and the frontend shows "$—" for that one row, same
graceful-degradation pattern as everywhere else on the site.
"""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd
import yfinance as yf

ROOT = Path(__file__).resolve().parent.parent
ETFS_FILE = Path(__file__).resolve().parent / "etfs.json"
DATA_DIR = ROOT / "web" / "public" / "data"
BACKFILL_DAYS = 90


def load_etfs():
    with open(ETFS_FILE) as f:
        return json.load(f)["etfs"]


def fetch_etf_aum(symbol):
    try:
        info = yf.Ticker(symbol).info
        aum = info.get("totalAssets")
        return float(aum) if aum else None
    except Exception as e:
        print(f"    WARNING: could not fetch AUM for {symbol}: {e}")
        return None


def build_etf_dataset():
    existing_path = DATA_DIR / "_etfs.json"
    existing = {}
    if existing_path.exists():
        with open(existing_path) as f:
            existing = json.load(f).get("etfs", {})

    start_date = (
        (datetime.now(timezone.utc) - timedelta(days=BACKFILL_DAYS)).strftime("%Y-%m-%d")
        if not existing
        else (datetime.now(timezone.utc) - timedelta(days=10)).strftime("%Y-%m-%d")
    )

    result = {}
    for etf in load_etfs():
        symbol, name, etf_type = etf["symbol"], etf["name"], etf["type"]
        print(f"  fetching {symbol} ({name})...")

        df = yf.Ticker(symbol).history(start=start_date, interval="1d", auto_adjust=False)
        if df.empty:
            print(f"    WARNING: no price data returned for {symbol}, skipping")
            continue
        df = df.reset_index()
        df["date"] = df["Date"].dt.strftime("%Y-%m-%d")
        df = df.dropna(subset=["Close"])  # NaN close breaks JSON — same guard as stocks/commodities

        rows_by_date = {r["date"]: r for r in existing.get(symbol, {}).get("history", [])}
        for _, r in df.iterrows():
            close = float(r["Close"])
            volume_shares = int(r["Volume"]) if not pd.isna(r["Volume"]) else 0
            rows_by_date[r["date"]] = {
                "date": r["date"],
                "close_usd": round(close, 4),
                "volume_shares": volume_shares,
                "dollar_volume_usd": round(close * volume_shares, 2),
            }
        sorted_rows = sorted(rows_by_date.values(), key=lambda x: x["date"])

        for i, row in enumerate(sorted_rows):
            if i > 0:
                prev = sorted_rows[i - 1]["close_usd"]
                row["daily_change_pct"] = round((row["close_usd"] / prev - 1) * 100, 2) if prev else None
            else:
                row["daily_change_pct"] = None

        aum = fetch_etf_aum(symbol)

        result[symbol] = {
            "name": name,
            "type": etf_type,
            "aum_usd": aum,
            "history": sorted_rows,
        }

    return {"etfs": result}


if __name__ == "__main__":
    dataset = build_etf_dataset()
    print("\nSample result (first ETF):")
    first_key = next(iter(dataset["etfs"]), None)
    if first_key:
        sample = dataset["etfs"][first_key].copy()
        sample["history"] = sample["history"][-3:]  # just show last 3 days, not the whole backfill
        print(json.dumps({first_key: sample}, indent=2))
