"""
Base DataProvider interface. All concrete providers (Yahoo, EODHD, etc.)
must implement these methods. The rest of the pipeline calls only these
methods — swapping providers never touches fetch_data.py.
"""
from abc import ABC, abstractmethod


class DataProvider(ABC):
    """Abstract base for all market data providers."""

    @abstractmethod
    def get_daily_history(self, symbol: str, start_date: str) -> list[dict]:
        """
        Return daily OHLCV records from start_date to today.

        Each record must have keys:
          date        str  "YYYY-MM-DD"
          open        float  local currency
          high        float  local currency
          low         float  local currency
          close       float  local currency
          volume      float  share count

        Returns [] on failure — never raises.
        """
        ...

    @abstractmethod
    def get_market_cap(self, symbol: str) -> float | None:
        """
        Return current market cap in the ticker's native currency,
        or None if unavailable. Never raises.
        """
        ...

    @abstractmethod
    def get_key_stats(self, symbol: str) -> dict:
        """
        Return a dict with any/all of:
          market_cap_usd   float | None
          pe_ratio         float | None
          week_52_high     float | None  (local currency)
          week_52_low      float | None  (local currency)
          avg_volume       float | None
        Never raises — return {} on failure.
        """
        ...

    @abstractmethod
    def name(self) -> str:
        """Human-readable provider name for logging."""
        ...
