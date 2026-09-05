# InfinityVolume Live Data Worker

A small, standalone Cloudflare Worker — separate from the main Next.js
site — that fetches live stock/commodity prices and FX rates every 2
minutes and serves them as JSON. The Next.js site (a fully static export,
see the root README) polls this Worker's URL client-side to overlay live
prices on top of the daily-computed volume/turnover data.

## Why this is a separate project from the website

The main site is a static export (`output: "export"` in `next.config.js`)
— plain HTML/JS/CSS with no server. That's what lets it deploy to
Cloudflare Pages with zero adapter complexity. A scheduled background job
(the cron-triggered price fetch) is a fundamentally different kind of
thing — an always-on service, not a page — so it lives here as its own
Worker with its own `wrangler.toml`, deployed independently.

## Setup

```bash
cd worker
npm install

# Create the KV namespace once (only needs doing one time, ever):
npx wrangler kv:namespace create LIVE_DATA
```

That command prints an `id`. Paste it into `wrangler.toml` in place of
`REPLACE_WITH_YOUR_KV_NAMESPACE_ID`.

```bash
# Log in to Cloudflare (opens a browser window):
npx wrangler login

# Deploy:
npm run deploy
```

Once deployed, the cron trigger runs automatically every 2 minutes — no
further action needed. Wrangler will print your Worker's URL
(`https://InfinityVolume-live.<your-subdomain>.workers.dev`); that's what the
frontend needs to poll.

## Testing without waiting for the cron

```bash
# Trigger a manual run:
curl https://InfinityVolume-live.<your-subdomain>.workers.dev/run

# Then check the latest snapshot:
curl https://InfinityVolume-live.<your-subdomain>.workers.dev/
```

You can also watch it run live: `npm run tail` streams logs from the
deployed Worker in real time, including every `console.log` from a
scheduled run.

## `src/config.js` is auto-generated — don't hand-edit it

It's generated from `scripts/tickers.json` and `scripts/commodities.json`
(the same source of truth the daily Python pipeline uses), so the live
Worker and the daily historical data never drift apart. If you add/remove
tickers there, regenerate this file rather than editing it directly (ask
me to regenerate it, or see the generation snippet used to build it
originally — it's a straightforward Python script that flattens both JSON
files into three JS arrays).

## Known risk worth watching after deployment

Yahoo Finance's quote endpoint (`v7/finance/quote`) is unofficial and has,
in the past, started requiring an authentication "crumb" token when Yahoo
tightens anti-scraping measures. If quotes start coming back empty or with
401 errors in the logs (`npm run tail`), that's almost certainly what
happened — the fix is switching to the `v8/finance/chart/{symbol}`
endpoint per-symbol instead of the batched `v7/quote` endpoint, which has
historically been more stable but doesn't support fetching multiple
symbols in one call. Flag this to me if you see it and I'll swap the
implementation.

## Cost expectations (Workers Paid plan, $5/month base)

At a 2-minute cadence: ~720 runs/day, one consolidated KV write per run
(~21,600 writes/month) — nowhere near the 1,000,000 writes/month included
in the Paid plan. Realistically this stays right at the $5/month base fee
indefinitely unless you dramatically increase fetch frequency or add many
more tracked symbols.
