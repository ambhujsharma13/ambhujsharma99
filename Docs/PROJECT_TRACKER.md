# InfinityVolume — Project Tracker

*Last updated: September 6, 2026*

Tags used: `#infra` `#data` `#frontend` `#news` `#content` `#accounts` `#growth` `#legal` `#product-ideation` `#bug` `#decision-needed`

---

## Newly added this session

| Item | Tags | Notes |
|---|---|---|
| Narrow News Flash to fewer tickers | `#news` | Revisit scope — currently all 25 US equities; you want to focus on "a few" specifically |
| Further reduce unwanted News Flash articles | `#news` | Continue the noise-filtering work (institutional filings, common-word collisions already handled — likely more edge cases remain) |
| Increase historical depth to 1 year, all data types | `#data` | Currently ~90 days for stocks/commodities/ETFs, ~2 years for Treasury/Financial Conditions already. Need to extend stock/ETF/commodity backfill specifically |
| Populate more fields per ticker | `#data` `#decision-needed` | Which fields? Stock pages already have Key Stats (P/E, dividend yield, 52wk range, etc.) — need your input on what's still missing |
| Add PLTR (Palantir) to US equities | `#data` | Straightforward addition to tickers.json |
| Add LITE (Lumentum) to US equities | `#data` | Straightforward addition to tickers.json |
| Add CXMT to China equities | `#data` | **Verified**: IPO'd July 2026, Shanghai STAR Market, ticker `688825.SS` |
| Add Unitree Robotics to China equities | `#data` | **Verified**: IPO'd Aug 2026, Shanghai STAR Market, ticker `688836.SS` |
| Add Alibaba to China equities | `#data` `#decision-needed` | Alibaba's primary listings are NYSE ADR (`BABA`) or Hong Kong (`9988.HK`) — **not** a mainland Shanghai/Shenzhen listing like the rest of your "China" market. Need a decision: use the US ADR, expand "China" to include Hong Kong-listed shares, or create a new "Hong Kong" market bucket |
| Product ideation: new tables/data sources | `#product-ideation` | See dedicated section below — this was actively brainstormed this session |

---

## Data pipeline & sourcing

| Item | Tags | Status |
|---|---|---|
| EODHD subscription conversation | `#data` | Never contacted; still Yahoo-only. Revisit if international data quality becomes a bottleneck |
| China/Brazil/Turkey 10Y yields | `#data` | Confirmed unavailable via free FRED/OECD route after direct research. Accepted gap — 9-10 of 13 international countries work |
| Real-time/live price Worker (2-min polling) | `#infra` | Built early in the project, never deployed — blocked by the Cloudflare suspension below |

---

## Infrastructure & hosting

| Item | Tags | Status |
|---|---|---|
| Cloudflare Trust & Safety suspension | `#infra` `#decision-needed` | Status unknown/unresolved as far as this conversation shows. Vercel has been working well as the "temporary" host for a long time now — worth deciding whether to keep pursuing Cloudflare or make Vercel the permanent home |
| NH LLC formation | `#legal` | Recommended (NH LLC over Delaware, given no VC-raise plans); filing status unconfirmed |
| GitHub Actions for main data pipeline | `#infra` `#decision-needed` | News fetch now runs automatically every 6 hours. Does `fetch_data.py` (stocks/treasury/ETFs/financial conditions) have its own automated schedule yet, or is it still run manually? |

---

## News Flash

| Item | Tags | Status |
|---|---|---|
| Narrow ticker scope | `#news` | See "newly added" above |
| Further noise reduction | `#news` | See "newly added" above |
| Near-duplicate article dedup | `#news` `#bug` | Minor — same story syndicated across multiple small sites under different URLs (e.g., the "MIVI Smartphone" triple-post). Low priority |

---

## Frontend / UI polish (long-deferred batch)

| Item | Tags | Status |
|---|---|---|
| Ticker/name spacing bug ("NVDANVIDIA", "TSLATesla") | `#frontend` `#bug` | Flagged multiple times across this entire project, never fixed — explicitly batched for a later UI pass that hasn't happened yet |
| Homepage "rearranging a few things" | `#frontend` | Mentioned early on, specifics never given |

---

## Content

| Item | Tags | Status |
|---|---|---|
| About Us / charter real copy | `#content` | Still placeholder text |
| Discussions panel — real community feature | `#content` `#accounts` | Still placeholder sample topics; genuinely needs accounts/auth first |
| Infinity Published Stories — actual publishing capability | `#content` `#accounts` | Currently just a renamed placeholder; the actual member-publishing feature needs accounts/auth first |

---

## Accounts, payments, gating (deferred architecture — needs auth first)

| Item | Tags | Status |
|---|---|---|
| Authentication (Clerk or Supabase) | `#accounts` | Not started |
| Database (Cloudflare D1 or equivalent) | `#accounts` `#infra` | Not started |
| Stripe payments | `#accounts` | Not started |
| Gated research articles | `#accounts` `#content` | Not started — depends on auth + payments |

---

## Growth & distribution

| Item | Tags | Status |
|---|---|---|
| YouTube channel | `#growth` | Strategy discussed early in the project; channel never created |
| Newsletter (Beehiiv/Substack) | `#growth` | Platform decision made early on; never built |
| SEO/distribution execution | `#growth` | Never actioned |
| Trademark search / social handle registration | `#legal` `#growth` | Directional check only, never formally pursued |

---

## Product ideation — candidate new tables/features

*(Brainstormed this session — see full writeup in the accompanying response for the reasoning behind each)*

| Idea | Tags | Data source needed |
|---|---|---|
| Sector/industry rotation heatmap | `#product-ideation` | **No new API** — buildable from existing Yahoo sector/industry metadata + already-tracked tickers |
| Global market indices table (S&P 500, Nikkei, DAX, FTSE, etc.) | `#product-ideation` | **No new API** — Yahoo index tickers (^GSPC, ^N225, etc.), same pipeline already in use |
| Cryptocurrency majors table | `#product-ideation` | **No new API** — Yahoo already covers BTC-USD, ETH-USD, SOL-USD, etc. |
| VIX / volatility tracker | `#product-ideation` | **No new API** — Yahoo ^VIX, fits naturally alongside Broad Financial Conditions |
| Dividend calendar / yield table | `#product-ideation` | **No new API** — yfinance already exposes dividend fields |
| Earnings calendar | `#product-ideation` | **No new API** — yfinance has an earnings-date field available |
| Short interest / days-to-cover table | `#product-ideation` | **New but free** — FINRA publishes short-interest data bi-monthly, no cost |
| Insider trading tracker (structured, not noisy wire stories) | `#product-ideation` | **New but free** — SEC EDGAR Form 4 data is public; a *structured* table here could be genuinely valuable, unlike the noisy wire-story version already excluded from News Flash |
| Options volume / open interest | `#product-ideation` | **New, likely paid** — CBOE, Tradier, or Polygon.io options endpoints; options data is rarely free |
| IPO calendar / recent IPO performance | `#product-ideation` | **New, mostly paid** — few free, reliable IPO calendar APIs exist |
