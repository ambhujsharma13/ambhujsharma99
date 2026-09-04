/**
 * Every live-quote provider for the Worker must export a single function:
 *
 *   fetchQuotes(symbols: string[]) -> Promise<{ [symbol]: { price, change_pct, market_time } }>
 *
 * This mirrors scripts/providers/base.py's interface on the Python side —
 * same idea, same reason: index.js never talks to a vendor API directly,
 * only through this shape, so swapping sources is a one-line change in
 * index.js, not a rewrite.
 */

const CHUNK_SIZE = 40; // keeps each Yahoo quote request's URL a sane length

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Batched Yahoo Finance quote fetch. NOTE: Yahoo's unofficial v7 quote
 * endpoint has occasionally required a "crumb" auth token in the past when
 * Yahoo tightens anti-scraping measures — if this starts returning 401s
 * after deployment, that's what's happening. The fallback is per-symbol
 * calls to the v8 chart endpoint (https://query1.finance.yahoo.com/v8/finance/chart/{symbol}),
 * which has historically been more stable but doesn't batch — flag this to
 * me if you hit that and I'll swap the implementation.
 */
export async function fetchQuotes(symbols) {
  const results = {};
  for (const group of chunk(symbols, CHUNK_SIZE)) {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${group.join(",")}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; InfiniVolumeBot/1.0)" },
      });
      if (!res.ok) {
        console.log(`Yahoo quote batch failed: ${res.status}`);
        continue;
      }
      const data = await res.json();
      for (const q of data?.quoteResponse?.result || []) {
        results[q.symbol] = {
          price: q.regularMarketPrice ?? null,
          change_pct: q.regularMarketChangePercent ?? null,
          market_time: q.regularMarketTime ?? null,
        };
      }
    } catch (e) {
      console.log(`Yahoo quote batch error: ${e.message}`);
    }
  }
  return results;
}
