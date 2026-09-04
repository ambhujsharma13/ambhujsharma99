/**
 * EODHD provider stub for the live Worker — NOT YET ACTIVATED.
 *
 * Same caveats as scripts/providers/eodhd.py:
 *   1. Needs an API key (passed in via env.EODHD_API_KEY, set as a Worker
 *      secret with `wrangler secret put EODHD_API_KEY` once you have one).
 *   2. Symbol format differs from Yahoo's — SYMBOL_MAP needs filling in
 *      with confirmed EODHD exchange codes before non-US tickers will
 *      resolve correctly. Keep this in sync with the Python-side
 *      SYMBOL_MAP in scripts/providers/eodhd.py if/when you fill it in —
 *      ideally these should eventually be generated from one shared
 *      source rather than maintained twice, worth asking me to set up
 *      once you're actually activating this.
 *
 * EODHD's real-time endpoint is per-symbol (no batching the way Yahoo's
 * v7/quote does), so this fetches all symbols in parallel instead —
 * within the Paid Workers plan's 10,000 subrequests/invocation limit,
 * ~150-650 parallel requests is fine, but this hasn't been tested against
 * a real account and should be verified once you have a key.
 */

const SYMBOL_MAP = {
  // "SAP.DE": "SAP.XETRA",
  // "005930.KS": "005930.KO",
};

export async function fetchQuotes(symbols, apiKey) {
  if (!apiKey) {
    throw new Error("EODHD_API_KEY not set — see wrangler secret put EODHD_API_KEY");
  }
  const results = {};
  await Promise.all(
    symbols.map(async (symbol) => {
      const eodSymbol = SYMBOL_MAP[symbol] || symbol;
      try {
        const res = await fetch(
          `https://eodhd.com/api/real-time/${eodSymbol}?api_token=${apiKey}&fmt=json`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data?.close != null) {
          results[symbol] = {
            price: parseFloat(data.close),
            change_pct: data.change_p != null ? parseFloat(data.change_p) : null,
            market_time: data.timestamp ?? null,
          };
        }
      } catch (e) {
        console.log(`EODHD fetch error for ${symbol}: ${e.message}`);
      }
    })
  );
  return results;
}
