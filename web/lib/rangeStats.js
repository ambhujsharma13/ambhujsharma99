/**
 * Computes cumulative volume and price change for one ticker/asset over an
 * arbitrary date range, directly from its raw daily history array. This is
 * deliberately done client-side rather than precomputed in the Python
 * pipeline for every possible window — precomputing every 1-to-15-day
 * window for every ticker would bloat the data files ~15x for no real
 * benefit, when a date range only needs a handful of array operations at
 * render time.
 *
 * `history` — array of { date, close_usd, dollar_volume_usd, market_cap_usd, ... }
 *             sorted ascending by date (the shape produced by fetch_data.py).
 * `startDate`, `endDate` — "YYYY-MM-DD" strings, inclusive.
 *
 * Returns null if there's no data at all in the range (e.g., a market
 * holiday closed that exact single day, or the range predates the
 * ticker's available history) — callers should treat that as "not open /
 * no data for this window" rather than showing a zero.
 */
export function computeRangeStats(history, startDate, endDate) {
  if (!history || history.length === 0) return null;

  const inRange = history.filter((row) => row.date >= startDate && row.date <= endDate);
  if (inRange.length === 0) return null;

  const cumulativeVolumeUsd = inRange.reduce((sum, row) => sum + (row.dollar_volume_usd || 0), 0);
  const startClose = inRange[0].close_usd;
  const endClose = inRange[inRange.length - 1].close_usd;
  const changePct = startClose ? ((endClose / startClose - 1) * 100) : null;
  const latestMarketCap = inRange[inRange.length - 1].market_cap_usd ?? null;
  const turnoverPct = latestMarketCap ? (cumulativeVolumeUsd / latestMarketCap) * 100 : null;

  return {
    startDate: inRange[0].date,
    endDate: inRange[inRange.length - 1].date,
    tradingDaysCount: inRange.length,
    startClose,
    endClose,
    changePct,
    cumulativeVolumeUsd,
    marketCapUsd: latestMarketCap,
    turnoverPct,
  };
}

/**
 * The set of calendar dates actually available across a market's tickers,
 * most recent first, capped to the last N. Used to constrain the date
 * picker so users can't select a date outside what's actually been
 * fetched (currently ~90 days of backfill, but the UI intentionally caps
 * selection to the most recent 15 per the current design).
 */
export function getAvailableDates(tickersObj, maxDays = 15) {
  const allDates = new Set();
  for (const [symbol, history] of Object.entries(tickersObj || {})) {
    if (symbol.startsWith("__name__")) continue;
    for (const row of history) allDates.add(row.date);
  }
  return Array.from(allDates).sort().slice(-maxDays);
}
