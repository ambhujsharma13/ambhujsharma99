import { getMarketData } from "./getMarketData";
import { AVAILABLE_COLUMNS } from "./watchlistColumns";

// Standard trading-day approximations, not calendar days — a "week" of
// trading is 5 days (weekends excluded), a "month" is roughly 21.
const WEEK_TRADING_DAYS = 5;
const MONTH_TRADING_DAYS = 21;

function sumDollarVolume(history, days) {
  if (!Array.isArray(history) || history.length === 0) return null;
  const window = history.slice(-days);
  return window.reduce((sum, entry) => sum + (entry.dollar_volume_usd ?? 0), 0);
}

// Looks up current data for a batch of {symbol, market} pairs, fetching
// each unique market's data file only once regardless of how many
// items share that market. Pulls every field defined in
// AVAILABLE_COLUMNS, plus computes the two rolling-window volume sums
// (1-week, 1-month) that don't exist directly in the raw data — those
// need the full history array, not just the latest entry.
export function enrichWithMarketData(items) {
  const marketsNeeded = [...new Set(items.map((i) => i.market))];
  const marketDataCache = {};
  for (const market of marketsNeeded) {
    marketDataCache[market] = getMarketData(market);
  }

  return items.map((item) => {
    const marketData = marketDataCache[item.market];
    const history = marketData?.tickers?.[item.symbol];
    const name = marketData?.tickers?.[`__name__${item.symbol}`] || item.symbol;
    // Use last row with a non-null close — avoids showing nulls when the
    // pipeline inserts a placeholder row for a date with no settled data yet
    // (e.g. a weekend run that adds a Friday row before market close settles).
    const latest = Array.isArray(history) && history.length > 0
      ? [...history].reverse().find(r => r.close_usd != null) ?? null
      : null;

    const extraFields = {};
    for (const col of AVAILABLE_COLUMNS) {
      if (col.field === "volume_1w_usd" || col.field === "volume_1m_usd") continue;
      extraFields[col.field] = latest?.[col.field] ?? null;
    }

    return {
      ...item,
      name,
      currentPrice: latest?.close_usd ?? null,
      currentVolume: latest?.dollar_volume_usd ?? null,
      dataDate: latest?.date ?? null,
      volume_1w_usd: sumDollarVolume(history, WEEK_TRADING_DAYS),
      volume_1m_usd: sumDollarVolume(history, MONTH_TRADING_DAYS),
      ...extraFields,
    };
  });
}
