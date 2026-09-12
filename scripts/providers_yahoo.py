"""
Yahoo Finance data provider via yfinance.

This is the current production provider — the riskiest dependency in the
stack (unofficial, undocumented API that Yahoo can break without notice).
Kept as a concrete provider class so it can be swapped for EODHD or any
other licensed provider by changing DATA_PROVIDER in provider_config.py,
without touching any other part of the pipeline.

Rate limiting: Yahoo is aggressive about rate-limiting when many tickers
are fetched in a tight loop. The retry logic in fetch_ticker_history()
(fetch_data.py) handles transient 429s — this class focuses on getting
data out of yfinance's objects cleanly.
"""

import time
import yfinance as yf
from providers.base import DataProvider


class YahooProvider(DataProvider):
    """Yahoo Finance via yfinance."""

    def name(self) -> str:
        return "Yahoo Finance (yfinance)"

    def get_daily_history(self, symbol: str, start_date: str) -> list[dict]:
        """Pull OHLCV history from Yahoo. Returns [] on any failure."""
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(start=start_date, auto_adjust=True)
            if df.empty:
                return []
            df = df.reset_index()
            records = []
            for _, row in df.iterrows():
                date_val = row["Date"]
                date_str = (
                    date_val.strftime("%Y-%m-%d")
                    if hasattr(date_val, "strftime")
                    else str(date_val)[:10]
                )
                records.append({
                    "date": date_str,
                    "open": float(row["Open"]) if row["Open"] == row["Open"] else None,
                    "high": float(row["High"]) if row["High"] == row["High"] else None,
                    "low": float(row["Low"]) if row["Low"] == row["Low"] else None,
                    "close": float(row["Close"]) if row["Close"] == row["Close"] else None,
                    "volume": float(row["Volume"]) if row["Volume"] == row["Volume"] else None,
                })
            return records
        except Exception as e:
            print(f"    YahooProvider.get_daily_history({symbol}): {e}")
            return []

    def get_market_cap(self, symbol: str) -> float | None:
        """Return market cap in native currency, or None."""
        try:
            info = yf.Ticker(symbol).info
            return info.get("marketCap")
        except Exception:
            return None

    def get_key_stats(self, symbol: str) -> dict:
        """Return key stats dict. Returns {} on failure."""
        try:
            info = yf.Ticker(symbol).info
            return {
                "market_cap_usd": info.get("marketCap"),
                "pe_ratio": info.get("trailingPE"),
                "week_52_high": info.get("fiftyTwoWeekHigh"),
                "week_52_low": info.get("fiftyTwoWeekLow"),
                "avg_volume": info.get("averageVolume"),
            }
        except Exception as e:
            print(f"    YahooProvider.get_key_stats({symbol}): {e}")
            return {}
