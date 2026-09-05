# InfinityVolume

*(formerly "Global Volume Board" — renamed to reflect the actual idea: a
market is always open somewhere, so this tracks volume continuously across
time zones, not just one exchange's trading day.)*

A self-updating dashboard of daily price & dollar-volume, plus rolling
3-trading-day figures, across 15 stock markets, global commodities, and
major currency pairs — everything converted to USD.

**Markets:** United States, China (A-shares), Germany, France, United
Kingdom, Italy, Spain, India, Brazil, Israel, Turkey, Canada, South Korea,
Japan, and Russia (see the Russia note below — it's wired into the config
but not currently populated).

**Also covers:** global commodities (gold, silver, copper, Bitcoin, and
major agricultural futures) and major currency pairs vs. USD — see the
dedicated section below.

---

## This batch: discussion topics, top stories, cleaner market pages

**Left column now has two stacked panels**: a "Discussions" scroll list
(shows ~4 topics, scrolls through 10 total) sits above the existing
country sidebar. **This is a UI shell with placeholder topics, not a real
feature** — there's no discussion/community backend yet (that needs the
auth + database layer from the "deferred, on purpose" section above).
Swap the `PLACEHOLDER_TOPICS` array in `components/DiscussionTopicsList.js`
once that backend exists.

**"Top Stories" pane** now sits above every market's data table (home and
every `/markets/{key}` page) — again a **placeholder UI shell**
(`components/TopStoriesPane.js`), styled and positioned for real
analyst-written content once you have somewhere to publish it. Currently
shows the same 3 sample stories on every market page; worth deciding later
whether stories should be market-specific or genuinely global.

**Market page copy simplified**: removed the explanatory paragraph under
each market's heading ("The most actively traded... turnover is
cumulative...") per your request to keep it clean — the stats bar and
table speak for themselves now.

## This batch: layout, flags, company logos, ticker pages, About page

**1. Layout restored to your preferred design.** The homepage (`/`) is now
the actual US dashboard by default — flag sidebar on the left, stats bar
and table on the right — instead of the card-grid market overview from the
SEO restructuring. `/markets/US` now 301-redirects to `/` (see
`public/_redirects`) rather than duplicating content on two URLs. Every
other market still has its own page at `/markets/{key}` for SEO, now using
the same sidebar layout for a consistent experience site-wide.

**2. Real SVG flags, not emoji.** Emoji flags render as plain two-letter
text on Windows in most browsers (Windows' system font doesn't include the
flag glyphs other platforms do) — likely part of why things looked off
during your testing. Swapped to the `flag-icons` library (loaded via CDN
in `layout.js`), which renders identically everywhere.

**3. Company logos.** Clearbit's old logo API (the free industry standard)
shut down in December 2025. Its official successor, built by the same
team, is **Logo.dev** — `components/CompanyLogo.js` uses their ticker
endpoint. Sign up free at logo.dev, set `NEXT_PUBLIC_LOGO_DEV_TOKEN` in
`.env.local`. Two honest caveats: (1) their ticker lookup is US/major-exchange
oriented, so international tickers (e.g. `SAP.DE`, `005930.KS`) may not
resolve — the code strips exchange suffixes as a best effort, but coverage
outside the US isn't guaranteed; (2) without a token at all, every logo
gracefully falls back to a colored monogram initial rather than a broken
image, so the site never looks broken either way.

**4. Company names now link to their own page.** Every ticker in every
table links to `/markets/{market}/{ticker}` — a real page for each of the
~650 tracked tickers, statically generated (required for the Cloudflare
static export). Currently shows the same price/volume history already in
the data, with a bigger chart, plus a clearly-labeled placeholder section
for the richer content (news, fundamentals, peer comparisons) you'll wire
up later via an external API — this is genuinely "more than UI," so
treat this as a working scaffold, not the finished feature.

One thing to verify once deployed: a handful of tickers contain characters
like `&` (e.g. India's `M&M.NS`) that need correct URL encoding to work as
a route — the code handles this (`encodeURIComponent` on the way out,
automatic decoding on the way in, standard Next.js behavior), but this is
exactly the kind of edge case worth clicking through to confirm rather
than assuming.

**5. Date-range preset buttons resized.** The 1/3/7/15-day buttons are now
large, high-contrast, and stretch across most of the row — reflecting that
this is the site's central interaction, not a secondary control.

**6. About page** at `/about` — structural scaffold with clearly-labeled
placeholder sections, ready for you to drop in real content.

## Swapping data providers (Yahoo → EODHD or others)

Both the Python pipeline and the live Worker are built around a provider
abstraction specifically so you can evaluate EODHD (or anyone else)
without a rewrite:

- **Python**: `scripts/provider_config.py` has one switch —
  `DATA_PROVIDER = "yahoo"` (active today) or `"eodhd"` (stub). Every
  fetch function in `fetch_data.py` calls through this, never yfinance
  directly. `scripts/providers/eodhd.py` is a solid draft written from
  EODHD's public docs, **not yet tested against a real account** — it
  needs an API key (`EODHD_API_KEY` env var) and, importantly, a
  `SYMBOL_MAP` filled in, since EODHD uses different exchange-suffix
  conventions than Yahoo (e.g. Yahoo's `SAP.DE` vs. whatever EODHD's
  Germany code turns out to be — confirm this once you have access rather
  than guessing).
- **Worker**: same pattern, `wrangler.toml`'s `[vars] DATA_PROVIDER`
  switch, `worker/src/providers/eodhd.js` as the stub.

Flipping both to EODHD once you've confirmed pricing/coverage is: get a
key, fill in both `SYMBOL_MAP`s, set the two config switches, done — no
changes to the actual pipeline logic in either project.

## This batch: Cloudflare migration, live 2-minute data, flexible date ranges

**1. Cloudflare Pages instead of Vercel.** `next.config.js` now sets
`output: "export"` — the entire site builds to plain static HTML/JS/CSS
(the `web/out` folder), with no Next.js server needed at request time. To
deploy:
```bash
cd web
npm run build          # produces the out/ folder
```
Then in the Cloudflare dashboard: Pages → Create a project → connect your
GitHub repo → set the build command to `npm run build` and the output
directory to `out`, with the root directory set to `web`. Every push
auto-redeploys, same as Vercel did. Because this is a plain static export
(not using Next's server features), you don't need the
`@cloudflare/next-on-pages` adapter at all — one less moving part.

**2. Live 2-minute data — a separate Worker.** See `/worker` — its own
README (`worker/README-worker.md`) covers full setup. Short version: it's
a standalone Cloudflare Worker (not part of the Next.js app) that runs on
a cron trigger every 2 minutes, fetches batched stock/commodity quotes and
FX rates, and writes one consolidated snapshot to Workers KV. The website
polls that Worker's URL client-side (`lib/useLiveData.js`) — set
`NEXT_PUBLIC_LIVE_WORKER_URL` in `web/.env.local` (copy from
`.env.example`) once it's deployed. Built assuming the **Workers Paid
plan** ($5/month) per your decision — see the Worker README for exact
cost expectations (should stay right at the $5 base fee).

Currently wired into the site as a small "● Live" status indicator in the
nav bar, proving the connection works — it does **not** yet feed live
prices into the main data tables (those show cumulative range stats over
historical days, a different kind of number than "the price right now").
Merging live single-point prices into the range tables cleanly is a
reasonable next step once you've confirmed the Worker itself is fetching
correctly in production.

**3. Flexible date range (replacing the old Daily/3-day toggle).** Every
market page now has a date-range picker: quick presets (1D/3D/7D/15D) plus
custom start/end dates, constrained to the last 15 trading days actually
in your data. This is computed **client-side** from the daily history
already in each JSON file (`lib/rangeStats.js`) — no changes needed to the
Python pipeline, no bloating the data files with every possible
precomputed window. A ticker with no data in the selected window (e.g., a
market holiday) is simply omitted from that view, rather than showing a
misleading zero — which naturally satisfies "only companies open in that
window."

## Deferred, on purpose: accounts, gated articles, payments

Per our conversation, registered users, gated research articles, and
payments are planned for later stages, not built now — building them
without a real spec would just be wasted, throwaway code. For when you get
there, the recommended direction (not yet implemented):
- **Auth**: Clerk or Supabase Auth — don't hand-roll password/session
  handling.
- **Database**: Cloudflare D1 (serverless SQLite) for
  users/subscriptions/article metadata — pairs naturally with the Worker
  ecosystem you're already using.
- **Payments**: Stripe, with webhooks landing on a Cloudflare Worker to
  update subscription status in D1.

Nothing built in this batch blocks that path — the routing structure
(`app/markets/[market]`, etc.) extends naturally to a future
`app/research/[slug]` section whenever you're ready to build it.

## What's new: market cap, GDP, turnover ratio, and SEO-ready pages

**New metrics** (computed in `fetch_data.py`, no extra setup needed beyond
what you already have):
- **Market cap** per ticker (via yfinance), converted to USD.
- **GDP** per country, via the World Bank's free API (`NY.GDP.MKTP.CD`,
  current US$). Updates annually with a lag — that's expected, GDP doesn't
  move daily.
- **Turnover ratio** — daily $ volume, and rolling 3-day $ volume, each
  shown as a % of market cap. This is the headline metric on each market
  page: it normalizes activity across companies and countries of very
  different sizes, instead of just always highlighting whichever market
  has the biggest companies.
- **Market cap ÷ GDP** per country — the "Buffett Indicator," applied per
  market. **Update:** this now uses a separate, broader large-cap universe
  (`scripts/market_cap_universe.json`, ~500 tickers total) rather than the
  10-ticker volume watchlist — a much more meaningful denominator. Each
  market uses its actual named index where one exists at a well-established
  size (DAX 40, CAC 40, FTSE MIB, Nifty 50, TA-35, BIST 30); markets
  without a clean "top 100" use the broadest reasonable large-cap set
  instead, labeled honestly in the UI. **This list was assembled from
  general knowledge, not verified against a live index provider — spot-check
  a sample from each market after your first real run.** It's kept
  separate from the volume watchlist on purpose: it's a market-cap-only
  snapshot pass (no price history), so it doesn't slow down the daily
  volume pipeline — though it does add ~500 extra network calls per run,
  so expect `fetch_data.py` to take noticeably longer than before.

**New URL structure for SEO**: each market now has its own real,
server-rendered page at `/markets/US`, `/markets/India`, etc., instead of
everything living behind client-side tab-switching on one page. This
matters because search engines can't meaningfully index content that only
appears after client-side JavaScript runs — a real URL per market with
server-rendered text is what actually gets crawled and can rank.

**One thing you need to set before deploying**: the sitemap
(`app/sitemap.js`) and robots.txt (`app/robots.js`) need your real site
URL to generate correct absolute links. In Vercel, add an environment
variable:
```
SITE_URL=https://your-actual-domain.vercel.app
```
(or your custom domain, once you have one). Without this, they'll fall
back to a placeholder URL that won't work for real indexing.

---

## Commodities, currency pairs, and the country-tab additions (FX rate, bond yield)

**New `/commodities` page**: gold, silver, copper, Bitcoin, and the major
agricultural futures (soybeans, corn, wheat, coffee, sugar, cotton, cocoa).
These trade on the **CME/CBOT/ICE** family, not CBOE (CBOE is options and
the VIX — it doesn't list these). All already USD-denominated, so there's
no FX conversion step. Volume is shown as raw contract count, not a dollar
figure — futures contract sizes vary wildly by commodity (100 oz for gold
vs. 5,000 bushels for soybeans), and getting that multiplier wrong per
commodity would silently produce a misleading number, so this deliberately
doesn't attempt it. **Heads up**: grain futures (soybeans/corn/wheat) are
historically quoted in US cents per bushel on some data feeds — check the
unit label shown per row on first run before trusting the price at face
value.

**New `/currencies` page**: reuses the exact same daily FX data already
being fetched to convert stock prices into USD — no extra network calls.
Shown as "1 unit of currency = $X USD" consistently, rather than mixing FX
market quote conventions (EUR/USD vs. USD/JPY), which tends to confuse
anyone not already fluent in forex notation.

**Each market's stats bar now also shows**:
- **Currency exchange rate** (real data, same FX pipeline as above) with
  1-day change.
- **10-year government bond yield** — **US only**, via Yahoo Finance's
  free `^TNX` ticker. Every other country is honestly shown as
  unavailable: every global bond-yield API found during research (Trade­feeds,
  Finnworlds, EODHD, bonds-api.com) requires a paid key, and this project
  is intentionally built entirely on free/keyless sources. If you later
  want full coverage, plugging in one of those paid APIs is a contained
  change (one new fetch function) — ask if you want that built.

## How it fits together


```
scripts/fetch_data.py   →  runs once a day, pulls prices + FX rates,
                            writes JSON into web/public/data/
.github/workflows/         →  the "cron job" — GitHub's free scheduler
  update-data.yml             runs the script daily and commits the new data
web/                     →  Next.js app that reads those JSON files at
                             runtime and renders the dashboard
```

There's no live database and no backend server to maintain. The daily
data files ARE the database — flat JSON, one file per market, committed to
git by the automation, served as static assets by whatever host you deploy
the `web/` app to (Vercel, Netlify, Cloudflare Pages, etc.). When GitHub
Actions commits new data, your host picks it up on the next deploy
(instant on Vercel/Netlify if you connect the repo — pushes auto-deploy).

This keeps the whole thing free to run indefinitely: GitHub Actions is
free for public repos (2,000 min/month free even for private repos), and
Vercel/Netlify's free tiers comfortably cover a dashboard like this.

---

## Setup

### 1. Data pipeline

```bash
cd scripts
pip install -r requirements.txt
python fetch_data.py
```

First run backfills **~90 calendar days** of history per ticker (well past
your "1-2 months minimum" requirement) and writes it to `web/public/data/`.
Every subsequent run only adds new trading days — it's safe to re-run
any time, it won't duplicate dates.

**This script needs real internet access** to Yahoo Finance's data API and
to `api.frankfurter.app` (free FX rates, no key required). It will not run
in a network-sandboxed environment — run it locally, or let GitHub Actions
run it (see below), where the network is unrestricted.

### 2. Automated daily updates (GitHub Actions)

Already configured in `.github/workflows/update-data.yml`. Once you push
this repo to GitHub:

1. It runs automatically every weekday at **22:30 UTC** (after every
   market in the watchlist has closed for the day). Edit the cron line
   if you want a different time.
2. You can also trigger it manually any time from the repo's **Actions**
   tab → "Daily market data update" → **Run workflow**.
3. It commits the refreshed `web/public/data/*.json` files straight back
   to the repo.

No secrets or API keys are required for the default setup — yfinance and
Frankfurter are both free and keyless.

### 3. Frontend

```bash
cd web
npm install
npm run dev       # local dev, http://localhost:3000
npm run build     # production build
```

### 4. Deploy

Easiest path: push this repo to GitHub, then import it into **Vercel**
(vercel.com → New Project → select the repo → set the root directory to
`web/`). Vercel auto-detects Next.js, builds it, and redeploys automatically
every time GitHub Actions commits new data — so the live site updates
itself daily with zero manual steps after the initial setup.

Netlify and Cloudflare Pages work the same way if you'd rather use those.

---

## The "top 10 by volume" design decision

A true "recompute the 10 most actively-traded stocks fresh every day" needs
a live screener API for *each* exchange — most free data sources don't
expose that outside the US (Yahoo's own "most active" screener is US-only).
Building 11 different screener integrations was out of scope for a v1, so
this ships with a **curated, editable watchlist** instead (`scripts/tickers.json`)
— 10 large, genuinely liquid names per market, close to what actually shows
up in each market's real most-active list on a given day.

You can freely edit `tickers.json` to swap names in/out. If you later want
true daily-recomputed rankings, the cleanest path is a paid data provider
with global screener endpoints (e.g. EOD Historical Data, Twelve Data, or
Polygon.io's non-US add-ons) — happy to help wire that in if you want to
go there later.

## The Russia gap

Yahoo Finance (and virtually every free Western data provider) delisted
MOEX-traded securities after the 2022 sanctions — `yfinance` returns empty
data for `.ME` tickers. Rather than fake it, `Russia` is left with an empty
ticker list and a `Russia` tab that's visibly disabled in the UI.

If you want to add it back: the Moscow Exchange runs its own free, public,
unauthenticated REST API (**MOEX ISS**, `iss.moex.com`) that still serves
historical OHLCV data. It's a different response format from yfinance, so
it needs its own small fetch function rather than reusing the existing one
— worth a follow-up if this matters to you.

## Currency handling notes

- Most markets are straightforward: local close price × daily FX rate → USD.
- **UK (pence) and Israel (agorot)** trade in a minor unit (1/100th of the
  major currency). The fetch script divides by 100 before applying the
  GBP/ILS → USD rate — this is handled automatically, just flagging it so
  it's not a mystery if you're cross-checking numbers.
- FX rates are the free ECB reference rates via Frankfurter, refreshed daily
  alongside the price data.

## Extending this

- **More tickers per market**: edit `scripts/tickers.json`, re-run the fetch script.
- **More markets**: add a new block to `tickers.json` with an `exchange_currency`
  and a `tickers` array — the pipeline picks it up automatically. You'll also
  want to add it to `web/lib/markets.js` so it shows up in the sidebar.
- **Alerts / email digest**: the daily GitHub Action already runs on a
  schedule — a follow-up step could diff yesterday's vs today's top movers
  and email or Slack a summary. Ask if you want this built.
