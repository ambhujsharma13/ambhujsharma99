/**
 * Computes the yield change over an arbitrary date range, for either a US
 * tenor (daily history) or an international country's 10Y yield (monthly
 * history). Change is expressed in PERCENTAGE POINTS (absolute
 * difference), not percentage change — the same reasoning as the Broad
 * Financial Conditions fix: yields can be small or move near zero, so a
 * percentage-of-a-percentage calculation is the wrong convention. Bond
 * markets always describe yield moves in points/basis points, never as a
 * relative percentage.
 *
 * IMPORTANT DESIGN NOTE: this does NOT require an exact data point to
 * fall inside [startDate, endDate]. Instead it finds the most recent
 * known value AS OF endDate, and the most recent known value AS OF
 * startDate, and compares those two snapshots. This was a real bug fixed
 * after testing: the original version required an exact match inside the
 * window, which meant every international (monthly) row returned null
 * and got filtered out entirely whenever the selected date range didn't
 * happen to land exactly on one of that country's ~12 data points a
 * year — which, for the default "most recent day" view, was every single
 * time, since the combined date list's "most recent" day is always a US
 * daily date. The as-of approach works correctly for both dense (daily)
 * and sparse (monthly) series without special-casing either one.
 */
export function computeYieldRangeStats(history, startDate, endDate) {
  if (!history || history.length === 0) return null;

  const upToEnd = history.filter((row) => row.date <= endDate);
  if (upToEnd.length === 0) return null; // no data at all as of this date yet
  const endEntry = upToEnd[upToEnd.length - 1];

  const upToStart = history.filter((row) => row.date <= startDate);
  const startEntry = upToStart.length > 0 ? upToStart[upToStart.length - 1] : null;

  const changeAbsPts =
    startEntry && endEntry ? Math.round((endEntry.yield_pct - startEntry.yield_pct) * 100) / 100 : null;

  return {
    endYield: endEntry.yield_pct,
    changeAbsPts,
    endDate: endEntry.date,
    pointsInRange: upToEnd.filter((r) => r.date >= startDate).length,
  };
}

/**
 * Available dates across a set of yield series (US tenors + international
 * countries combined), for constraining the range picker. Works the same
 * way as getAvailableDates in rangeStats.js, just against a plain array of
 * {history} objects instead of the tickers-keyed-object shape.
 */
export function getAvailableYieldDates(historyArrays, maxDays = 90) {
  const allDates = new Set();
  for (const history of historyArrays) {
    for (const row of history || []) allDates.add(row.date);
  }
  return Array.from(allDates).sort().slice(-maxDays);
}
