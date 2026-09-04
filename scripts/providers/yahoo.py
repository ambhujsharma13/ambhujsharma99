"""
Yahoo Finance provider, via the yfinance library. This is the ACTIVE
provider today. Unofficial/reverse-engineered endpoint under the hood —
see the README's "known risk" note. Swap providers by changing
scripts/provider_config.py, not this file.
"""

import pandas as pd
import yfinance as yf

from .base import DataProvider


class YahooProvider(DataProvider):
    def get_daily_history(self, symbol: str, start_date: str):
        df = yf.Ticker(symbol).history(start=start_date, interval="1d", auto_adjust=False)
        if df.empty:
            return []
        df = df.reset_index()
        df["date"] = df["Date"].dt.strftime("%Y-%m-%d")
        df = df.dropna(subset=["Close"])  # NaN close breaks downstream JSON — drop, don't propagate
        return [
            {"date": r["date"], "close": float(r["Close"]), "volume": int(r["Volume"]) if not pd.isna(r["Volume"]) else 0}
            for _, r in df.iterrows()
        ]

    def get_market_cap(self, symbol: str):
        try:
            t = yf.Ticker(symbol)
            cap = None
            try:
                cap = t.fast_info.get("market_cap")
            except Exception:
                pass
            if not cap:
                cap = t.info.get("marketCap")
            return float(cap) if cap else None
        except Exception:
            return None

    def get_current_quote(self, symbol: str):
        try:
            df = yf.Ticker(symbol).history(period="2d", interval="1d")
            if df.empty:
                return None
            latest = df["Close"].iloc[-1]
            prev = df["Close"].iloc[-2] if len(df) > 1 else latest
            change_pct = (latest / prev - 1) * 100 if prev else None
            return {"price": float(latest), "change_pct": change_pct}
        except Exception:
            return None
