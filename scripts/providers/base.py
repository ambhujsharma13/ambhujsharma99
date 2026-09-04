"""
The provider interface every stock/commodity data source must implement.

This exists so fetch_data.py never calls yfinance (or any vendor SDK)
directly — it only calls these three functions, through whichever provider
is selected in scripts/provider_config.py. Swapping data sources later
means writing one new file that implements this interface and flipping one
config value — not touching fetch_data.py's actual logic at all.

Every implementation must return data in exactly this shape, regardless of
what the underlying vendor API looks like:

    get_daily_history(symbol, start_date) -> list[dict] | None
        Each dict: {"date": "YYYY-MM-DD", "close": float, "volume": int}
        sorted ascending by date. Return None (or empty list) if the
        symbol has no data — fetch_data.py already handles that gracefully.
        `close` must be in the SYMBOL'S OWN LISTING CURRENCY — fetch_data.py
        handles USD conversion itself; providers should not pre-convert.

    get_market_cap(symbol) -> float | None
        Current market cap, in the symbol's own listing currency (same
        currency-handling note as above). Return None if unavailable.

    get_current_quote(symbol) -> dict | None
        {"price": float, "change_pct": float} — used only by the live
        Worker's polling logic, not the daily Python pipeline. Python-side
        providers can leave this raising NotImplementedError if a given
        source is only used for the daily batch job.
"""

from abc import ABC, abstractmethod


class DataProvider(ABC):
    @abstractmethod
    def get_daily_history(self, symbol: str, start_date: str) -> list:
        ...

    @abstractmethod
    def get_market_cap(self, symbol: str):
        ...

    def get_current_quote(self, symbol: str):
        raise NotImplementedError(
            f"{self.__class__.__name__} does not implement get_current_quote "
            "(only needed by the live Worker, not the daily pipeline)."
        )
