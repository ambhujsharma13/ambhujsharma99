"""
Shared utilities for the data pipeline:

  RateLimiter     — token-bucket limiter, prevents 429s on any HTTP source
  FileCache       — disk-based JSON cache keyed by URL/params, with TTL
  fetch_with_retry — wraps requests.get with retry + backoff + rate limiting

These live here rather than in each individual fetcher so the behaviour is
consistent across all sources (FRED, FINRA, Treasury, Redfin, World Bank)
and tunable from one place.
"""

import hashlib
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Cache directory — written to /tmp so it survives between pipeline steps in
# the same GitHub Actions job but resets each job (no stale cache across runs).
# For local dev, also writes to /tmp (consistent, always writable).
# ---------------------------------------------------------------------------
CACHE_DIR = Path(os.environ.get("PIPELINE_CACHE_DIR", "/tmp/iv_pipeline_cache"))
CACHE_DIR.mkdir(parents=True, exist_ok=True)


class FileCache:
    """
    Simple disk-backed JSON cache with a per-entry TTL.

    Usage:
        cache = FileCache(ttl_seconds=3600)
        cached = cache.get(url, params)
        if cached is None:
            data = expensive_fetch(url, params)
            cache.set(url, params, data)

    The cache key is a SHA-256 hash of the URL + sorted params, so it's
    stable across restarts and safe for any URL/param combination.
    """

    def __init__(self, ttl_seconds: int = 3600):
        self.ttl = ttl_seconds

    def _key(self, url: str, params: dict | None) -> str:
        raw = json.dumps({"url": url, "params": params or {}}, sort_keys=True)
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    def _path(self, key: str) -> Path:
        return CACHE_DIR / f"{key}.json"

    def get(self, url: str, params: dict | None = None):
        """Return cached value if fresh, else None."""
        path = self._path(self._key(url, params))
        if not path.exists():
            return None
        try:
            with open(path) as f:
                entry = json.load(f)
            age = time.time() - entry["cached_at"]
            if age > self.ttl:
                return None
            return entry["data"]
        except Exception:
            return None

    def set(self, url: str, params: dict | None = None, data=None) -> None:
        """Write data to cache."""
        if data is None:
            return
        path = self._path(self._key(url, params))
        try:
            with open(path, "w") as f:
                json.dump({"cached_at": time.time(), "data": data}, f)
        except Exception as e:
            print(f"  Cache write warning: {e}")


class RateLimiter:
    """
    Simple token-bucket rate limiter.

    RateLimiter(calls=5, period=1.0) allows at most 5 calls per second.
    Call .wait() before each request — it blocks only when the bucket is
    empty, so it doesn't add delay when the pipeline is under the limit.

    Defaults chosen per source:
      FRED:     10 calls/second (their documented limit is 120/minute)
      FINRA:    2 calls/second (conservative — OAuth token is shared across calls)
      Redfin:   1 call per 3 seconds (public S3, no stated limit, be polite)
      Treasury: 10 calls/second (free public API, generous limits)
      Yahoo:    1 call per 2 seconds (unofficial API, aggressive rate limiting)
    """

    def __init__(self, calls: int = 5, period: float = 1.0):
        self.calls = calls
        self.period = period
        self._timestamps: list[float] = []

    def wait(self) -> None:
        """Block until a call is permitted."""
        now = time.monotonic()
        # Drop timestamps outside the current window
        self._timestamps = [t for t in self._timestamps if now - t < self.period]
        if len(self._timestamps) >= self.calls:
            # Must wait until the oldest timestamp exits the window
            sleep_for = self.period - (now - self._timestamps[0])
            if sleep_for > 0:
                time.sleep(sleep_for)
        self._timestamps.append(time.monotonic())


# Pre-configured limiters for each source — import these in fetcher scripts
fred_limiter = RateLimiter(calls=8, period=1.0)
finra_limiter = RateLimiter(calls=2, period=1.0)
treasury_limiter = RateLimiter(calls=10, period=1.0)
yahoo_limiter = RateLimiter(calls=1, period=2.0)
default_limiter = RateLimiter(calls=5, period=1.0)


def fetch_with_retry(
    url: str,
    params: dict | None = None,
    headers: dict | None = None,
    limiter: RateLimiter | None = None,
    cache: FileCache | None = None,
    max_retries: int = 3,
    timeout: int = 30,
    source_name: str = "",
) -> dict | list | None:
    """
    GET a URL with:
      - optional cache check first
      - rate limiting before each attempt
      - exponential backoff on 429 / 5xx / connection error
      - returns parsed JSON or None on total failure

    This replaces the ad-hoc requests.get() calls scattered across all the
    individual fetcher scripts — consistent retry/backoff/cache everywhere.
    """
    lbl = f"[{source_name}] " if source_name else ""

    # Check cache first
    if cache is not None:
        cached = cache.get(url, params)
        if cached is not None:
            return cached

    last_error = None
    for attempt in range(max_retries):
        if limiter:
            limiter.wait()
        try:
            resp = requests.get(url, params=params, headers=headers, timeout=timeout)

            if resp.status_code == 429:
                # Rate limited — back off longer than normal
                wait = 60 * (attempt + 1)
                print(f"  {lbl}429 rate limited — waiting {wait}s (attempt {attempt+1}/{max_retries})")
                time.sleep(wait)
                continue

            if resp.status_code >= 500:
                wait = 10 * (2 ** attempt)  # 10s, 20s, 40s
                print(f"  {lbl}HTTP {resp.status_code} — waiting {wait}s (attempt {attempt+1}/{max_retries})")
                time.sleep(wait)
                continue

            if resp.status_code != 200:
                print(f"  {lbl}HTTP {resp.status_code} — skipping")
                return None

            data = resp.json()

            # Write to cache on success
            if cache is not None:
                cache.set(url, params, data)

            return data

        except requests.exceptions.Timeout:
            wait = 10 * (attempt + 1)
            print(f"  {lbl}Timeout — waiting {wait}s (attempt {attempt+1}/{max_retries})")
            time.sleep(wait)
            last_error = "timeout"

        except requests.exceptions.ConnectionError as e:
            wait = 15 * (attempt + 1)
            print(f"  {lbl}Connection error: {e} — waiting {wait}s (attempt {attempt+1}/{max_retries})")
            time.sleep(wait)
            last_error = str(e)

        except json.JSONDecodeError as e:
            print(f"  {lbl}JSON decode error: {e} — giving up")
            return None

        except Exception as e:
            print(f"  {lbl}Unexpected error: {e} — giving up")
            return None

    print(f"  {lbl}Failed after {max_retries} attempts (last error: {last_error})")
    return None


def write_pipeline_status(data_dir: Path, run_results: dict) -> None:
    """
    Write a _pipeline_status.json file alongside the data files.
    The frontend reads this to show data freshness and flag stale sources.

    run_results: dict mapping source_name -> {"ok": bool, "fetched_at": iso_str, "error": str|None}
    """
    status = {
        "run_at": datetime.now(timezone.utc).isoformat(),
        "sources": run_results,
        "all_ok": all(v.get("ok", False) for v in run_results.values()),
    }
    out = data_dir / "_pipeline_status.json"
    with open(out, "w") as f:
        json.dump(status, f, indent=2)
    if not status["all_ok"]:
        failed = [k for k, v in run_results.items() if not v.get("ok")]
        print(f"\n  WARNING: {len(failed)} source(s) failed: {', '.join(failed)}")
    else:
        print(f"\n  All {len(run_results)} sources fetched successfully.")
