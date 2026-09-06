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
 * Note for international (monthly) rows: a short window like "1 Day" or
 * "3 Day" will often show zero change, simply because the underlying data
 * hasn't updated within that short a window — that's expected given the
 * monthly reporting cadence, not a bug. A wider custom range (60+ days)
 * is needed to see real movement on those rows.
 */
export function computeYieldRangeStats(history, startDate, endDate) {
  if (!history || history.length === 0) return null;

  const inRange = history.filter((row) => row.date >= startDate && row.date <= endDate);
  if (inRange.length === 0) return null;

  const firstInRangeIndex = history.findIndex((row) => row.date === inRange[0].date);
  const priorRow = firstInRangeIndex > 0 ? history[firstInRangeIndex - 1] : null;
  const startYield = priorRow ? priorRow.yield_pct : inRange[0].yield_pct;
  const endYield = inRange[inRange.length - 1].yield_pct;

  const changeAbsPts = startYield != null && endYield != null ? Math.round((endYield - startYield) * 100) / 100 : null;

  return {
    endYield,
    changeAbsPts,
    endDate: inRange[inRange.length - 1].date,
    pointsInRange: inRange.length,
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
