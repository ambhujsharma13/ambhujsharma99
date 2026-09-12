"""
Provider configuration — the single place to switch between data providers.

Set DATA_PROVIDER in the environment (or edit the DEFAULT below) to change
which provider the pipeline uses. Everything else in fetch_data.py calls
only the DataProvider interface — it never imports Yahoo or EODHD directly.

Supported providers:
  "yahoo"   Yahoo Finance via yfinance (current default — unofficial API,
            highest breakage risk at scale)
  "eodhd"   EODHD licensed data (requires EODHD_API_KEY env var,
            $399+/mo, 60+ exchanges, recommended for Phase 2)

Adding a new provider: create providers/<name>.py implementing DataProvider,
add it to the registry below, done.
"""

import os
from providers.base import DataProvider

DATA_PROVIDER = os.environ.get("DATA_PROVIDER", "yahoo").lower()


def get_provider() -> DataProvider:
    """Return the configured DataProvider instance."""

    if DATA_PROVIDER == "yahoo":
        from providers.yahoo import YahooProvider
        return YahooProvider()

    if DATA_PROVIDER == "eodhd":
        from providers.eodhd import EodhdProvider
        api_key = os.environ.get("EODHD_API_KEY", "")
        if not api_key:
            raise ValueError(
                "DATA_PROVIDER=eodhd requires EODHD_API_KEY to be set. "
                "Get a key at https://eodhd.com — $399/mo for the All-World plan."
            )
        return EodhdProvider(api_key=api_key)

    raise ValueError(
        f"Unknown DATA_PROVIDER={DATA_PROVIDER!r}. "
        "Valid options: 'yahoo', 'eodhd'."
    )
