"""
Flip DATA_PROVIDER to switch data sources for the entire daily pipeline.
Nothing else in fetch_data.py needs to change when you do this.
"""

import os

# "yahoo" (active today) or "eodhd" (stub, see providers/eodhd.py — needs
# an API key and a symbol-format mapping before it'll actually work).
DATA_PROVIDER = os.environ.get("DATA_PROVIDER", "yahoo")

EODHD_API_KEY = os.environ.get("EODHD_API_KEY", "")


def get_provider():
    if DATA_PROVIDER == "eodhd":
        from providers.eodhd import EODHDProvider
        return EODHDProvider(api_key=EODHD_API_KEY)

    from providers.yahoo import YahooProvider
    return YahooProvider()
