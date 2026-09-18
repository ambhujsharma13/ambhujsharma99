# InfinityVolume — Decision Log

Every significant decision, why it was made, and what was rejected. The purpose of this file is to stop settled questions from being reopened.

**Reconstructed 17 September 2026** from the full build history. Dates marked *(approx)* were inferred from context rather than explicitly recorded. Going forward, add entries at the time of the decision.

**Format:** date, decision, reasoning, rejected alternatives.

---

## Infrastructure and hosting

### 2026-09-04 — Vercel, not Cloudflare Pages
Originally chose Cloudflare Pages for unlimited bandwidth and commercial use on the free tier (Vercel's Hobby tier prohibits commercial use). Cloudflare suspended the account as "FRAUD" within hours of signup — an automated false positive affecting many new accounts in 2026. Trust & Safety never resolved it despite a paid upgrade, community forum post and abuse-team email. Moved to Vercel as a stopgap; it has worked well enough that migration back is no longer planned.
*Rejected:* Cloudflare Pages + Workers, GitHub Pages (no server-side compute).
*Consequence:* Vercel Hobby prohibits commercial use — must upgrade to Pro (~$20/mo) before monetising.

### 2026-09-04 — Removed `output: "export"` from `next.config.js`
Static export was correct for Cloudflare Pages but makes middleware, server components reading cookies, and OAuth callback routes impossible. Auth cannot work without server-side runtime.
*Rejected:* keeping static export and moving auth client-side.

### 2026-09-08 (approx) — Supabase for both auth and database, not Clerk
Clerk has nicer prebuilt sign-in UI, but provides auth only. A database was needed regardless for watchlists, channels, articles and discussions. Supabase ties auth directly to data access through Row Level Security, so "only show this user their own watchlist" becomes a database rule rather than something re-implemented in every API route. One dashboard, one SDK, roughly $25–162/mo at 100k users versus ~$1,000/mo for Clerk at the same scale.
*Rejected:* Clerk + separate Postgres (Neon/Supabase), NextAuth.

### 2026-09-08 (approx) — Cloudflare D1 abandoned for Supabase Postgres
D1 is designed to be called from Cloudflare Workers, not a Vercel-hosted Next.js app. Once hosting moved to Vercel, D1 no longer fit.
*Rejected:* D1, PlanetScale.

### 2026-08-28 (approx) — Next.js 14 → 16
Next.js 14 reached end of life in October 2025 with no further security patches. 14.x carried a critical RCE and multiple other CVEs. Chasing individual patches on an EOL line was not viable.
*Rejected:* staying on 14.2.x with known CVEs.

### 2026-08-28 (approx) — Recharts stayed on 2.15.x with a `react-is` override
Recharts 3.x has open bug reports (Jan 2026) of charts rendering blank under React 19. 2.15.x works with a documented `react-is: ^19` override in `package.json`. Without the override, sparklines silently render blank with no console error — a nasty failure to debug.
*Rejected:* Recharts 3.x, switching charting library.

### 2026-09-17 — SSH for git, not HTTPS tokens
HTTPS pushes failed repeatedly with `403 Permission denied` because macOS Keychain served cached credentials and ignored the personal access token in the URL. Keychain erase failed. SSH keys work cleanly with no per-push credentials.
*Rejected:* personal access tokens, GitHub Desktop as the only push path.

---

## Brand and legal

### 2026-08-28 — Name: InfinityVolume, using the ∞ symbol
"Infinite global volume" has real meaning for the product: 15 markets across time zones means trading is continuous somewhere at all times. The ∞ glyph works as a logo mark at any size — favicon, avatar, watermark — and is visually distinct from generic chart-line fintech logos. Domain `infinityvolume.com` was available.
*Rejected:* CapWire, GlobalTape, TurnRate (all checked for collisions).

### 2026-08-28 — Greek letters rejected as a naming direction
Surveyed the full Greek alphabet. **Sigma** was the best conceptual fit (summation, which is literally what the tables compute) but collides directly with Sigma Computing, a real financial analytics platform. **Alpha, Beta, Delta, Omega** are heavily used across finance and tech. **Iota** is a well-known cryptocurrency. **Omicron** carries COVID associations. **Xi** carries political sensitivity. **Kappa** has a strong Twitch-meme association. Phi and Rho were clean but lacked immediate recognition.
*Rejected:* all Greek letter naming.

### 2026-09-17 — Display brand is "Infinity", legal name is "InfinityVolume"
Shorter brand for promotion; full name retained for legal and operational use.

### 2026-09-13 — New Hampshire LLC, not Delaware
Delaware is the default recommendation for companies raising venture capital — investors know Delaware corporate law and it handles complex equity structures. Neither applies here. Incorporating in Delaware while operating from NH means also registering as a foreign entity in NH, paying both Delaware franchise tax plus registered agent fees and NH registration fees. NH has no state income tax and no general sales tax.
*Rejected:* Delaware LLC, Delaware C-Corp.
*Revisit if:* outside investors or an eventual public offering enter the picture.

### 2026-09-13 — Liability cap set at $100; legal entity named "Infinity Group LLC"
Nominal cap appropriate for a free-at-the-time information service. Governing law New Hampshire.
*Open:* whether the NH LLC has actually been filed and whether the registered name matches "Infinity Group LLC" as written in the docs.

---

## Market data sources

### 2026-08-28 — Yahoo Finance retained, with a provider abstraction built for later swap
Yahoo is free, covers all 15 markets, and requires no credentials. It is also unofficial, undocumented, prohibited for commercial use in its terms, and could break without notice. Rather than pay before revenue, a `DataProvider` abstraction was built (`provider_config.py`, `providers/yahoo.py`, `providers/eodhd.py` stub) so switching is a config flag plus a symbol map.
*Rejected:* paying for a provider immediately.
*Known risk:* single point of failure with no fallback. This is the platform's largest technical risk.

### 2026-08-28 — EODHD identified as the preferred paid replacement
Repeatedly cited across independent sources specifically for broad global exchange coverage without enterprise pricing — which matters given BIST (Turkey), TASE (Israel) and KOSPI (Korea) are unusual for a consumer-tier API. Bulk exchange downloads would also replace ~650 individual ticker requests per day.
*Rejected:* Twelve Data (cheaper tiers are personal-use only, weaker commodities), Financial Modeling Prep (strong fundamentals, thinner international), Polygon.io (US-centric), Tiingo (US only), IEX Cloud (discontinued after acquisition — avoid entirely).
*Caveat:* the real commercial tier is likely ~$399/mo, not the $99 headline. Published pricing on all of these providers is a starting point for a sales conversation, not a quote.

### 2026-09-17 — Intrinio rejected for fixed income
The $333/mo Startup plan covers equities, options, fundamentals, estimates and ETFs. Intrinio has no bond or fixed income data at any plan level. Still a candidate for Phase 3 company fundamentals, but cannot solve the bond data gap.

### 2026-09-17 — Corporate bond breadth replaced by IG/HY credit spreads
FINRA's `corporateMarketBreadth` dataset (advances/declines) requires a Firm credential at $1,650/mo. The Public credential returns 403. Every provider that carries this data is reselling FINRA, so there is no cheaper path to the same figures. Replaced with ICE BofA Option-Adjusted Spreads from FRED — free, daily, and arguably more useful to investors than raw advance/decline counts since spreads directly show credit conditions tightening or loosening.
*Rejected:* FINRA Firm credential, SIFMA (weekly/monthly only), showing dashes indefinitely, hiding the section.
*Revisit if:* revenue justifies $1,650/mo.

### 2026-09-16 — Redfin weekly home sales abandoned
The national market tracker file contains only monthly data — confirmed by `PERIOD_DURATION` returning `[30]` for every row. A separate weekly file exists but the S3 path was not resolved after Redfin's May 2026 Data Center overhaul. Monthly existing home sales from FRED covers the need.
*Rejected:* continuing to hunt for the weekly S3 path.

### 2026-08-28 — Russia excluded rather than faked
Yahoo Finance dropped MOEX tickers after 2022 sanctions. Rather than fabricate data or silently show an empty market, Russia is kept in the config with an empty ticker list and explicitly excluded from the pipeline's failure check. The Moscow Exchange ISS API is documented in the README as the real alternative if needed later.
*Rejected:* removing Russia entirely, using a proxy source, letting it trigger a false pipeline failure every run.

---

## Market data methodology

### 2026-08-28 — Named indices, not a forced "top 100" per market
Several markets genuinely have 100 large liquid companies (S&P 100, FTSE 100, Nifty 100, BIST 100, IBrX 100, CSI 100). Germany, France, Italy and Israel do not — the whole HDAX universe is ~110 names, SBF 120 tops out at 120. Rather than pad the lists, each market uses its actual named index (DAX 40, CAC 40, FTSE MIB, Nifty 50, TA-35, BIST 30) and the UI labels which index it is using plus how many constituents actually returned data.
*Rejected:* forcing exactly 100 tickers per market and presenting it as a true top-100.

### 2026-08-28 — Market-cap universe separate from the volume watchlist
Fetching full daily price history for ~1,100 tickers (11 markets × 100) daily would be slow and risk Yahoo rate-limiting the whole pipeline. Market cap is a snapshot, not a time series — so a second ~500–700 name list gets a lightweight market-cap-only pass feeding the GDP ratio, while the 10-ticker-per-market volume watchlist keeps full history.
*Rejected:* one combined universe with full history.

### 2026-08-28 — Turnover ratio as the headline metric, not raw dollar volume
Raw dollar volume makes the US look "more active" almost by definition because US mega-caps are simply larger. Normalising by market cap answers a more interesting question: which market is proportionally churning hardest today. This is an established professional metric, and almost no free dashboard shows it cleanly across 15 markets. Market-cap-to-GDP is the Buffett Indicator applied per country — also rare to see outside the US.
*Rejected:* leading with raw dollar volume.

### 2026-09-17 — ETF list expanded 9 → 17, selected on dollar volume relevance
Barchart's unit-volume leaders were reviewed. BITO trades 84M units but only ~$860M dollar volume, versus SPY's $44B. The platform displays dollar volume, so additions were chosen to balance both: IBIT, BITO, ETHA (crypto), HYG, LQD (corporate bond context), XLF, SOXQ, DRAM (sector relevance to the member base).
*Rejected:* adding all Barchart unit-volume leaders indiscriminately.

### 2026-09-17 — Commodities subsection order and layout
Order: Precious Metals → Crypto → Energy → Global Consumption. Gold and Bitcoin appear as the first rows of their respective sections rather than in a separate featured strip. Spread tiles show the absolute bps figure first (leftmost), with no arrow inside the tile and no +/- signs on the 1D/1W change columns, since colour already carries direction.

### 2026-09-17 — Commodities and Currencies merged; Currencies route repurposed
Combined into `/commodities-fx` with separate sections. `/commodities` redirects there. The old `/currencies` route became `/cosmos`, purpose still undefined.

---

## Monetisation

### 2026-09-15 — Freemium: paid subscription with a limited free tier
Free accounts get limited utilities, no private channels, and limited depth behind the homepage charts. Paid unlocks full depth. The existing architecture already maps onto this cleanly — the "compact homepage card → detailed landing page" pattern built for Treasury Yields, ETFs and Corporate Bonds is already a natural free-preview/paid-depth boundary, so gating the landing pages may need no new architecture.
*Rejected:* ads-first, sponsorship-first, fully free.
*Open:* the feature-by-feature tier map, pricing anchor, whether existing members are grandfathered, and Stripe integration.

---

## News and content sourcing

### 2026-09-10 (approx) — NewsData.io, not Finnhub, Marketaux or NewsAPI
**NewsAPI** explicitly prohibits commercial use in its own terms — ruled out outright, not a judgement call. **Finnhub's** free tier is positioned for personal/non-commercial use with international coverage behind a paid plan. **Marketaux** had the best technical fit (native ticker tagging, per-entity sentiment) but no clear answer on commercial use anywhere in its terms — ambiguity itself being a reason to avoid. NewsData.io is unambiguously cleared for commercial use, has a `qInTitle` filter (headline-only search, a much stronger relevance signal than body text), and confirmed commercial safety across multiple independent sources.
*Rejected:* NewsAPI (prohibited), Finnhub (personal-use tier), Marketaux (ambiguous terms), Currents API (commercial-safe but corroborated by fewer sources).

### 2026-09-10 — Institutional 13F filing stories excluded entirely, not down-ranked
The "[Firm] LLC Buys N Shares of [ETF]" genre is auto-published in bulk from routine SEC filings and floods news aggregators. Initially down-ranked to 0.1× score; changed to outright exclusion because it still crowded out genuine news. Detection requires a firm-name indicator (LLC, Inc, PLC, Capital, Wealth, Advisors, Management) plus any one of a transaction verb, a holdings noun, or a cited dollar/share figure.
*Rejected:* down-ranking, keyword-only filtering.
*Known limitation:* a genuinely major filing story ("Berkshire takes a $2B stake") would also be excluded. Text patterns cannot distinguish scale. Accepted trade-off.

### 2026-09-10 — Individual insider trade stories also excluded
"[Person Name] Sells N Shares of [Company]" — same low-information genre, different structure (no firm suffix). Detected by a capitalised 2–3 word name at the start of the title followed by a transaction verb.
*Rejected:* keeping them as occasionally newsworthy.

### 2026-09-10 — Common-word ticker names excluded from bare matching
Live testing surfaced repeated false positives: **Visa** matched travel visa articles (3 of the top 10 results), **Intel** matched "intelligence agency", **SAP** matched "sap", **Cost** matched "cost", and MSTR's legal name is literally "Strategy". Two-letter tickers (V, MA, HD, PG) also collide with everyday abbreviations. These are matchable only via `$CASHTAG`, never bare.
*Rejected:* length-based exclusion alone (AMD is 3 characters and needed to match).

### 2026-09-10 — News scope restricted to US equities only
Originally 164 entities across 15 markets with a time-of-day rotation strategy to fit the API's 100-character query limit and daily credit budget. Narrowing to US equities made rotation unnecessary — all tickers fit in one run at ~11 credits, 44/day across 4 runs.
*Rejected:* full 15-market coverage with rotation.

---

## Email and notifications

### 2026-09-14 — Resend for transactional email
Built by former Vercel engineers, native Next.js integration, React Email for JSX templates, 3,000 emails/month free. Critically it is hosting-agnostic — an official Cloudflare Workers integration exists, so a future migration back to Cloudflare would need zero email changes.
*Rejected:* Postmark, SendGrid, Supabase's built-in auth email only.

### 2026-09-14 — Email only for major account, access and authentication changes
Emails fire for: role assigned/changed/removed, Human Intel answered/follow-up/denied, article approved/changes-requested/rejected, private channel invite. Explicitly **not** for likes, replies, discussion activity, or bookmarks — too noisy, in-app indicators are sufficient.
*Rejected:* notifying on all activity.

### 2026-09-14 — Author engagement digest every 48 hours, not 24
Consolidated across all of an author's published articles. Only sends if there was actual activity (at least one comment or three-plus likes). 48 hours reduces fatigue while still feeling responsive.
*Rejected:* daily digest, real-time per-event emails.

---

## Authentication and 2FA

### 2026-09-15 — Twilio for SMS, with a custom OTP implementation
Twilio is the industry standard. The OTP logic was hand-built: `phone_otp` table, SHA-256 hashing with a secret, 10-minute expiry, 3 sends per hour, 5 attempts per code.
*Open question:* Twilio Verify would replace all of that with a managed service handling rate limiting, fraud scoring and international routing — at roughly $0.05 per verification versus ~$0.008 per raw SMS. This decision was never resolved.

### 2026-09-15 — 2FA applies to new accounts only, not retroactively
The five existing accounts have no phone number on file. Forcing them to add one creates friction and support load for no security gain at this scale. Implemented via a `requires_phone_verify` column set to `false` for the five legacy accounts; new accounts default to requiring it.
*Rejected:* retroactive enforcement on next login, optional-then-mandatory soft rollout.
*Note:* a date-based cutoff was tried first and failed — legacy and new accounts were created the same day. The explicit column is the correct approach.

### 2026-09-15 — Enforced at account creation, not at first login or later
Enforcing at 2FA-setup time rather than registration leaves a loophole: create 100 accounts, then link phone numbers to only two of them. Enforcing at creation closes it.
*Rejected:* enforcing on first login, enforcing only when the user opts into 2FA.

### 2026-09-15 — Phone limit: 2 accounts per number, US and international alike
Covers legitimate dual use (personal plus professional account) while blocking mass fake-account creation. The main realistic abuse vector here is gaming the Omega score or getting extra free Human Intel questions, not bot armies. An SA-settable `phone_exception` flag handles genuine edge cases such as someone losing their old number.
*Rejected:* 1 per number (too strict — blocks families, number changes, legitimate dual use), region-differentiated limits (2 US / 1 international), no limit with anomaly flagging.

### 2026-09-15 — Sign-up phone-request copy
"InfinityVolume is a members-only research community built on the quality of its members — not their quantity. Every insight, article, and discussion here comes from a verified human investor, not a bot, algorithm, or fake profile. We ask for your mobile number once, at sign-up, to ensure every account on this platform is operated by a real person."
Chosen over longer versions because hesitant browsers respond better to a short, specific, non-defensive reason.

---

## Community design

### 2026-09-11 (approx) — TipTap for the article editor
MIT-licensed core, built on ProseMirror, specifically recommended for collaborative authoring products. Character count and image extensions are free; table support consolidated into `TableKit`.
*Rejected:* TinyMCE, Quill, Lexical.
*Note:* several search results pushing a product called "Eddyter" appeared to be coordinated marketing content and were discounted.

### 2026-09-11 — Async collaboration, not real-time
Multiple people can edit the same draft, one at a time. Real-time simultaneous editing would require Yjs plus a sync server or a paid collaboration service.
*Rejected:* real-time collaborative editing.

### 2026-09-12 — No downvotes anywhere
Reddit's well-documented failure mode is that downvotes get used to punish disagreement rather than low quality — someone downvoting a bearish call because they are long the stock. On a platform explicitly built to encourage independent and sometimes contrarian financial analysis, importing that dynamic is a direct risk to the core value proposition. Replaced with flag/report routed to admin review, so disagreement goes through human judgement rather than raw vote counts.
*Rejected:* downvotes, downvotes with a threshold, downvotes visible only to the author.

### 2026-09-12 — No algorithmic feed
Chronological ordering by default, with an optional "Hot" sort using log-scaled like counts plus time decay. Pinned posts always stay on top regardless of sort. Hot sort surfaces recent activity rather than all-time popularity — a fresh post with 10 likes outranks a two-day-old post with 50.
*Rejected:* engagement-ranked default feed.

### 2026-09-13 — Threaded replies: one level deep
Initially decided flat (no threading at all) for simplicity. Revised after a test user organically reported the gap — "I do not have the option to directly respond to a particular post or comment below directly." Replies to replies are allowed but all group under the original top-level post rather than nesting infinitely.
*Rejected:* flat-only, infinite nesting, quote-reply as a substitute.

### 2026-09-12 — Channel posting not gated by Omega score
The idea of requiring a minimum Omega score to post in certain channels was dropped because Omega is earned only by publishing articles. Someone who contributes only to discussions, however well, would be permanently locked out regardless of quality. Reddit's karma comes from both posts and comments; there is no discussion-side reputation signal here yet.
*Rejected:* per-channel Omega gating.
*Revisit if:* a discussion-based reputation signal is added.

### 2026-09-14 — Private channels bypass RA review, public channels require it
Private channel content is between its members. Public channel content is a platform-level representation and needs the plagiarism, authenticity and terms-conformity check.
*Rejected:* reviewing everything, reviewing nothing.

### 2026-09-14 — CA moderation scope is public channels only
Private channels are between their members — CA has no visibility and that is correct. Issues inside a private channel get flagged to TA/SA instead. This keeps the permission model clean: CA is public community health, TA is platform health, RA is research quality, SA is everything.
*Rejected:* CA moderation across all channels.

### 2026-09-14 — CA Omega boost: +5, max 3 active per CA, max 1 per member
A CA vouching for community contribution is a human signal that complements the automated calculation. Limits prevent one CA inflating everyone. No self-boosting, revocable, and SA can revoke any boost. Visible on the recipient's public profile.
*Rejected:* unlimited boosts, variable boost amounts, silent boosts.

### 2026-09-14 — Omega tier thresholds left provisional
0–39 Member, 40–69 Captain, 70–89 Quarterback, 90+ Senior Research Analyst. Explicitly to be recalibrated once real usage distribution exists — the stated concern being that everyone reaching Senior Research Analyst after three days of activity would make the system meaningless. Changing them requires only editing the `tier_for_omega_score` SQL function, no frontend change.
*Open:* recalibration after real usage data.

### 2026-09-14 — Admin roles stored in a database table, not hardcoded
`admin_role_definitions` holds the role key, abbreviation, label, description, badge colour and a permissions JSONB map. SA can edit all of it and create entirely new roles from the console. This was driven directly by the anticipated addition of Community Admin — hardcoding would have meant a code change and deploy for every new role.
*Rejected:* hardcoded role enum.

### 2026-09-13 — Unread/read tracking deferred to Phase 2
Unread badges, mark-as-read, per-channel mute and per-channel notification granularity all depend on read-state tracking, which does not exist. Deferred as a group along with the alerts framework, notification preferences, digest emails and presence status. Pin-to-top and category collapse were kept in Phase 1 since they do not depend on read state.

### 2026-09-13 — Bookmarks: polymorphic single table, scope limited
One `bookmarks` table with two nullable foreign keys and a check constraint enforcing exactly one is set — same pattern as `pending_requests`. Two separate tables would mean two page queries and no way to sort all bookmarks by recency without a UNION. Scope covers articles and discussion posts only.
*Deferred:* News Flash items and external articles (no stable IDs), watchlist reports (not shareable yet, so you can only bookmark your own), channel-level bookmarking (the sidebar already covers navigation).

### 2026-09-16 — Bookmarks page merged into Drafts, nav slot repurposed
"Saved Drafts" became "Drafts & Bookmarks" with a third section. The freed Bookmarks nav slot became "Human Intel".

### 2026-09-16 — Human Intel: one active request per user, enforced at the database
A partial unique index on `user_id WHERE status NOT IN ('answered','denied')` makes this unbypassable regardless of UI, second tabs, or direct API calls. The client also pre-checks and offers recall-and-replace, but that is UX, not enforcement.
*Rejected:* UI-only enforcement.

### 2026-09-16 — Recall-and-replace allowed unless already claimed
A member can withdraw their pending question and submit a different one. Disabled once a researcher has accepted or started work, since interrupting in-progress research wastes it.

### 2026-09-16 — Search placed contextually, not as one global bar
Three separate scoped searches rather than one universal search: the private channels page searches across all your private channels, the Human Intel right panel searches all public channel content (on the reasoning that public channel content is also human-generated), and the Contacts page searches your own DMs. Each lives exactly where it is relevant.
*Rejected:* one global search bar covering everything.

### 2026-09-16 — Search covers title, body and tags
Initially title-only, which failed the obvious test — searching "nvidia" returned nothing despite an article discussing Nvidia at length, because the word was not in the title. Now searches all three in parallel with deduplicated results. HTML tags in the body are harmless since `ilike` finds the text inside them.
*Rejected:* title-only search, full-text search index (unnecessary at current scale).

### 2026-09-17 — Homepage Discussion box: SA only, max 10, explicit save
RA's add/remove rights were removed — curation of the public homepage is an SA decision. Toggles update local draft state only; an explicit Save button writes all changes at once and revalidates the homepage cache so it updates without a manual refresh.
*Rejected:* RA curation rights, auto-save on each toggle, unlimited slots.

---

## Security

### 2026-09-17 — `homepage_articles` RLS re-enabled, writes via service role
RLS had been disabled to unblock development, which meant anyone with the publicly-embedded anon key could write to the table without logging in. Re-enabled with a public SELECT policy and no write policies at all — writes go through an API route using `SUPABASE_SERVICE_ROLE_KEY` after verifying SA role in application code.
*Rejected:* leaving RLS off, loosening the INSERT policy to allow authenticated writes.

### 2026-09-17 — HTML sanitisation on save, not on render
`dangerouslySetInnerHTML` renders article bodies. Sanitising with `sanitize-html` at save time means the stored data is clean, rather than relying on every render path to sanitise correctly. Allows all TipTap rich-text tags; strips scripts, event handlers, iframes and unsafe attributes.
*Rejected:* render-time sanitisation, CSP-only mitigation.

### 2026-09-17 — Uploaded filenames never used in storage paths
A macOS screenshot filename with spaces and colons caused `StorageApiError: Invalid key`. The same unsanitised pattern existed in three places (featured images, inline body images, channel cover images) — the channel cover image "working" was luck, not safety. Storage keys are now UUID plus sanitised extension only, with the original filename discarded entirely.
*Rejected:* sanitising the filename and keeping it, asking users to rename files.

---

## UI and layout

### 2026-09-17 — Sidebar: hover-expand icon strip on data pages, permanent elsewhere
A permanent 176px sidebar compressed the wide market data tables on the homepage and `/markets/*`, causing columns to overlap. A 20px hover ribbon fixed the compression but was undiscoverable. Settled on a permanently visible 48px icon strip that expands on hover — narrow enough not to compress tables, visible enough to be discoverable, and a pattern users already recognise from Discord, Slack and Linear.
*Rejected:* permanent sidebar everywhere, 20px hover ribbon, floating hamburger drawer, moving member nav into the top header.

### 2026-09-14 — Article read pages are channel-scoped
Each article has its own URL within each channel it appears in, with breadcrumb navigation, rather than one canonical article page. Keeps the reader inside channel context and means likes and comments are per-channel.
*Rejected:* one global article page, opening articles in the publish editor.

---

## Deferred features

### 2026-09-17 — Sentiment polling deferred pending design
`/member/sentiment` exists as a live nav placeholder. The capture and aggregation logic for the "Community Fear & Greed Index" is still being designed.

### 2026-09-05 — Live 2-minute polling architecture designed, never built
Planned as a Cloudflare Worker with cron triggers writing a consolidated KV blob, with client-side polling on top. Yahoo's endpoint blocks direct browser calls, so a server-side proxy with caching was required to avoid rate-limiting. Became moot after the move to Vercel.
*Rejected at the time:* pure client-side polling (blocked by CORS), committing fresh JSON to git every 2 minutes (would exhaust Actions minutes and bloat history).

### 2026-09-05 — TradingView embeds rejected
Free embeddable widgets need no backend and would work on static hosting, but they are display-only — the numbers cannot be read back into the platform's own tables, turnover calculations or sparklines. They also show exchange-delayed data to anyone not logged into their own TradingView account, so a personal real-time subscription does not extend to site visitors.
*Rejected:* TradingView widgets as the live data layer.

---

## Hiring

### 2026-09-17 — QA role reframed toward community and permissions
The original JD was data-accuracy focused. Rewritten so roughly 70–80% of the scope is community features — role-based access across four admin roles, the multi-step article review pipeline, public versus private channel isolation, notification state — with market data validation at 20–30%. The reasoning: data integrity is largely handled upstream, while the permission model is where defects are both most likely and most damaging.
*Key screening question:* describe testing role-based access or multi-step workflows across multiple simultaneous user sessions.

### 2026-09-17 — Second hire framed as Production Full-Stack Engineer, not SRE/DevOps
The infrastructure is deliberately simple — Vercel handles deploys, Supabase handles the database, GitHub Actions runs the pipelines. No Kubernetes, no microservices, no on-call rotation. A career SRE would be bored and overpriced. What is actually needed is someone who can read the whole codebase (Next.js, Python, SQL, middleware), has seen production failures in this kind of stack, and can design lightweight evaluation gates appropriate for a one-to-two person dev team.
*Target rate:* $65–90/hr at 10–15 hrs/week. $40–50 is likely too junior to design evaluation frameworks; $150+ is priced for full-time staff-level scope.
*Rejected:* pure DevOps/SRE hire, full-time engineer.

### 2026-09-17 — Upwork as primary hiring platform
Strongest pool for part-time async contract technical roles, with built-in contract and payment infrastructure. LinkedIn as a parallel free posting to reach senior engineers open to side contracts.
*Rejected:* Toptal (pre-vetted but $100/hr floor — revisit with revenue), Fiverr (wrong tier), Freelancer.com (race to the bottom), PeoplePerHour (thin at this level).
