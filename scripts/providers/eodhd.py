"""
EODHD (EOD Historical Data) provider — NOT YET ACTIVATED.

Written from EODHD's publicly documented API patterns as of the time this
was built, without a live API key to test against. Verify every endpoint
and response shape against their actual current docs (eodhd.com/financial-apis)
once you have a real account — treat this as a solid starting draft, not a
tested implementation.

TWO THINGS THAT MUST HAPPEN BEFORE THIS WORKS, BEYOND JUST ADDING A KEY:

1. Set EODHD_API_KEY (see provider_config.py) once you have one.

2. Symbol format is DIFFERENT from Yahoo's. Yahoo uses suffixes like
   "SAP.DE" or "005930.KS"; EODHD uses "SYMBOL.EXCHANGE_CODE" with its own
   exchange codes (e.g. likely "SAP.XETRA" for Germany, "005930.KO" for
   Korea — EXACT codes need confirming against EODHD's exchange list once
   you have access). This means swapping providers isn't just a config
   flip — tickers.json and market_cap_universe.json's symbol strings need
   a translation layer for this provider. A `SYMBOL_MAP` dict (Yahoo
   symbol -> EODHD symbol) is stubbed below as the place to put that
   mapping once you confirm the correct EODHD codes.
"""

import requests

from .base import DataProvider

BASE_URL = "https://eodhd.com/api"

# Fill in once you've confirmed EODHD's exact exchange codes for your 14
# markets. Left empty on purpose rather than guessed — a wrong guess here
# would silently fetch the wrong ticker instead of failing loudly.
SYMBOL_MAP = {
    # "SAP.DE": "SAP.XETRA",
    # "005930.KS": "005930.KO",
    # ... etc, one entry per ticker across all markets
}


class EODHDProvider(DataProvider):
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError(
                "EODHD_API_KEY not set — see scripts/provider_config.py. "
                "Get a key from eodhd.com once you've confirmed pricing/coverage."
            )
        self.api_key = api_key

    def _map_symbol(self, symbol: str) -> str:
        return SYMBOL_MAP.get(symbol, symbol)  # falls back to the raw symbol if unmapped — will likely 404 for non-US tickers until mapped

    def get_daily_history(self, symbol: str, start_date: str):
        eod_symbol = self._map_symbol(symbol)
        url = f"{BASE_URL}/eod/{eod_symbol}"
        params = {"api_token": self.api_key, "fmt": "json", "from": start_date}
        resp = requests.get(url, params=params, timeout=30)
        if resp.status_code != 200:
            return []
        rows = resp.json()
        return [
            {"date": r["date"], "close": float(r["close"]), "volume": int(r.get("volume") or 0)}
            for r in rows
            if r.get("close") is not None
        ]

    def get_market_cap(self, symbol: str):
        eod_symbol = self._map_symbol(symbol)
        url = f"{BASE_URL}/fundamentals/{eod_symbol}"
        resp = requests.get(url, params={"api_token": self.api_key}, timeout=30)
        if resp.status_code != 200:
            return None
        data = resp.json()
        # Exact path needs confirming — EODHD's fundamentals response is
        # deeply nested and has shifted before between API versions.
        try:
            return float(data["Highlights"]["MarketCapitalization"])
        except (KeyError, TypeError, ValueError):
            return None

    def get_current_quote(self, symbol: str):
        eod_symbol = self._map_symbol(symbol)
        url = f"{BASE_URL}/real-time/{eod_symbol}"
        resp = requests.get(url, params={"api_token": self.api_key, "fmt": "json"}, timeout=30)
        if resp.status_code != 200:
            return None
        data = resp.json()
        try:
            return {"price": float(data["close"]), "change_pct": float(data.get("change_p"))}
        except (KeyError, TypeError, ValueError):
            return None
