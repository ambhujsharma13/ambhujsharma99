import { STOCK_SYMBOLS, COMMODITY_SYMBOLS, CURRENCIES } from "./config.js";
import * as yahooProvider from "./providers/yahoo.js";
import * as eodhdProvider from "./providers/eodhd.js";

const KV_KEY = "live-data";

// Set DATA_PROVIDER = "eodhd" in wrangler.toml's [vars] once you've
// activated an EODHD key (and set it via `wrangler secret put EODHD_API_KEY`)
// — mirrors the Python pipeline's provider_config.py switch exactly.
function getProvider(env) {
  if (env.DATA_PROVIDER === "eodhd") {
    return {
      fetchQuotes: (symbols) => eodhdProvider.fetchQuotes(symbols, env.EODHD_API_KEY),
    };
  }
  return { fetchQuotes: yahooProvider.fetchQuotes };
}

async function fetchFxRates(currencies) {
  const results = {};
  await Promise.all(
    currencies.map(async (ccy) => {
      try {
        const res = await fetch(`https://api.frankfurter.app/latest?from=${ccy}&to=USD`);
        if (!res.ok) return;
        const data = await res.json();
        const rate = data?.rates?.USD;
        if (rate) results[ccy] = { usd_rate: rate };
      } catch (e) {
        console.log(`FX fetch error for ${ccy}: ${e.message}`);
      }
    })
  );
  return results;
}

async function runUpdate(env) {
  const provider = getProvider(env);
  const [stocks, commodities, currencies] = await Promise.all([
    provider.fetchQuotes(STOCK_SYMBOLS),
    provider.fetchQuotes(COMMODITY_SYMBOLS),
    fetchFxRates(CURRENCIES),
  ]);

  const snapshot = {
    updated_at: new Date().toISOString(),
    stocks,
    commodities,
    currencies,
  };

  // Single consolidated write, deliberately — see wrangler.toml comment on
  // why this matters even on the Paid plan (still good practice, not just
  // a free-tier workaround).
  await env.LIVE_DATA.put(KV_KEY, JSON.stringify(snapshot));
  console.log(
    `Updated live data: ${Object.keys(stocks).length} stocks, ` +
      `${Object.keys(commodities).length} commodities, ${Object.keys(currencies).length} currencies`
  );
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // public read-only market data — safe to allow any origin
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runUpdate(env));
  },

  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    const url = new URL(request.url);

    // Manual trigger for testing without waiting for the cron: GET /run
    if (url.pathname === "/run") {
      await runUpdate(env);
      return new Response(JSON.stringify({ ok: true }), { headers: CORS_HEADERS });
    }

    const raw = await env.LIVE_DATA.get(KV_KEY);
    if (!raw) {
      return new Response(
        JSON.stringify({ error: "No live data yet — has the Worker run at least once?" }),
        { status: 404, headers: CORS_HEADERS }
      );
    }
    return new Response(raw, { headers: CORS_HEADERS });
  },
};
