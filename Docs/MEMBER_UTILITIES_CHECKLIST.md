# InfinityVolume — Member Page Utilities Checklist (Phase 1)

**Phase 1 scope, targeting completion by September 20, 2026.** Anything depending on unread/read state tracking (badges, mark-as-read, mute, per-channel notification granularity, the alerts framework, digest emails, and presence status) has been split out to `PHASE_2_DEFERRED.md` — that infrastructure doesn't exist at all today and is substantial enough to warrant its own phase rather than competing with this deadline.

*Compiled from: Discord (gamification/roles), Reddit (karma-gating, engagement velocity), Slack (pinning, saved items, search, digests), and finance-specific research (Seeking Alpha, StockTwits, Commonstock). Latest round: hands-on exploration of 5 live Discord communities (Phemex, Anonymice, Totec the Young, Meta & Magic, Renga) via an authenticated test session, browsed directly rather than researched secondhand.*

Status key: ✅ Built · 🔜 Proposed, not yet built · 💡 New idea from this round's research

Two findings from the Discord round were validations of existing decisions rather than new build items, so they aren't tracked as line items below: (1) InfinityVolume's Report Generator already solves a real gap these communities have — they route people to external Google Sheets for anything structured/tabular, which a native app doesn't need to do; (2) the existing plan for genuinely topic-specific Public Channels (rather than one general channel) matches what every server explored does successfully.

---

## Publish page

| Item | Status | Notes |
|---|---|---|
| Bold, italic, headings, lists | ✅ | |
| Underline, font size, indent/outdent | ✅ | |
| Blockquote, link insertion, tables | ✅ | |
| Preview mode | ✅ | |
| Position disclosure checkbox | ✅ | |
| Delete button | ✅ | |
| Autosave | ✅ | |
| Collaborator management UI | ✅ | Extended beyond the original scope: adding a collaborator now creates a pending invite requiring acceptance (see the new Requests system below), rather than granting access immediately without consent |
| Ticker autocomplete (`$AA...` → `$AAPL`) | 🔜 | Explicitly deferred per request — needs a custom Mention-style extension, scoped but not started |
| **Featured/cover image** | ✅ | |
| **Reading-time estimate** | ✅ | |
| **Topic tags, in their own section** | ✅ | |
| Version history | 🔜 | Matters more now that async collaboration exists — see what changed and by whom |
| **Suggested "market update" template** | ✅ | "Start from a market-update template" button, shown only while the editor is still empty |

---

## Saved Drafts

| Item | Status | Notes |
|---|---|---|
| List with resume-editing links | ✅ | |
| Search/filter by title | 🔜 | |
| Stale-draft nudge | 🔜 | Gentle warning on drafts untouched for 60+ days |
| **Featured image + reading time shown inline** | 🔜 | Once those fields exist on Publish, surface them here too, not just the title |
| **Own/Shared split, with sortable columns** | ✅ | Two sections — "Your drafts" and "Shared with you" (collaborator invites, once accepted) — each a sortable table with Title, Author, Collaborators, Tags, Words, and date columns, reusing the existing shared `SortableHeader` component |

---

## My Articles

| Item | Status | Notes |
|---|---|---|
| List of published work | ✅ | |
| Per-article stats inline (Sigma score, views, reactions) | 🔜 | Data already exists, just not surfaced in this list yet |
| Edit vs. view toggle | 🔜 | Published pieces should open a read view by default, not straight into the editor |
| **Pinned articles** | 🔜 (confirmed) | Author pins their best 1-2 pieces to the top of their own list/profile |
| **Own/Shared split, with sortable columns** | ✅ | Same treatment as Saved Drafts, for published pieces — "Your articles" / "Shared with you" (a collaborator invite accepted on an already-published article shows up here, not in Saved Drafts, since it's no longer a draft) |

---

## Watchlists

| Item | Status | Notes |
|---|---|---|
| Schema | ✅ | Multiple named lists per user |
| UI (add/remove tickers) | ✅ | |
| Inline current price/volume | ✅ | Fixed — works correctly for exact ticker symbols |
| **Company name → symbol resolution** | 🐛 Confirmed still broken | Exact symbols (AAPL, MU) work correctly; typing a company name ("micron", "Apple") still doesn't resolve. Root cause not yet found — batching with the items below per explicit request rather than continuing to debug in isolation |
| "Turn into an article" | 🔜 | One-click start a Publish draft pre-populated with the watchlist's current tickers |
| Custom columns from existing backend data | 🔜 (new) | Let users choose which stored fields to display, not just price/volume |
| **More historical volume / additional data columns** | 🔜 (new, batched) | |
| **Sorting, matching the homepage equity table's sortable columns** | 🔜 (new, batched) | Reuse the existing SortableHeader pattern already built for the homepage/landing pages |
| Share / export watchlist | 🔜 (new) | Multiple output formats |

---

## Bookmarks

| Item | Status | Notes |
|---|---|---|
| Schema — `bookmarks` table | ✅ | Polymorphic single table with `content_type` discriminator and nullable FKs (`article_id`, `post_id`). Unique constraint per user per item. Check constraint enforces exactly one FK set. RLS: users see/add/delete own bookmarks only. Run `supabase-add-bookmarks.sql`. |
| Bookmark articles | ✅ | `BookmarkButton.js` wired into `ArticlesTable.js` — outline icon when not bookmarked, filled brass when bookmarked. Toggles inline with optimistic state. |
| Bookmark discussion posts | ✅ | `BookmarkButton.js` wired into `ChannelPosts.js` on every post and reply — sits between Share and Flag. Confirmed live: bookmarking a channel post from Semiconductors channel, appeared on bookmarks page with correct channel name and excerpt. |
| `/member/bookmarks` page | ✅ | Two sections (Articles / Discussion Posts), each a table with columns: Title/Content, Author, Type (Published/Draft/Discussion pill), Channel (with 🔒 for private), Saved (time ago), remove button. Empty state with guidance. Confirmed: add flow, remove flow, page count ("1 saved"), both content types rendering correctly. |
| `bookmark-actions.js` server actions | ✅ | `toggleBookmark({ contentType, articleId, postId })` — checks for existing row first, removes if present, adds if not. `removeBookmark(bookmarkId)` for direct removal. Both revalidate `/member/bookmarks`. |
| Bookmark News Flash items | 🔜 | Deferred — no stable row IDs for News Flash items yet. Prerequisite: a `news_flash_items` table with stable PKs. |
| Bookmark channels (channel-level) | 🔜 | Deferred — bookmarking a whole channel is less urgent than specific posts. Channel sidebar already covers navigation. |
| Bookmark report outputs | 🔜 | Deferred — Report Generator outputs (watchlists) aren't shareable yet. Own watchlists already accessible from My Watchlists. Once sharing is built, revisit. |
| Bookmark external articles | 🔜 | Deferred — no stable IDs for external content. Would need a separate `external_articles` ingestion table first. |

---

## Discussions / Channels (schema exists, no UI built yet at all)

| Item | Status | Notes |
|---|---|---|
| Channel creation, flat posts | ✅ | |
| **Sidebar sections: Public Channels vs. Private Channels** | ✅ (redesigned) | Public Channels is a non-link header with an italicized sub-list of admin-created channels (super_admin only, enforced at RLS level). Private Channels is a regular link to a create+list page. |
| **Private channels also shown as sidebar sub-items** | ✅ | Same treatment as Public Channels — italicized sub-list of the user's own private channels |
| **Channel invite/membership** | ✅ | `channel_members`/`channel_admins` schema, invite-by-email/username form, shown only to channel admins |
| **Channel cover image** | ✅ | Channel admins only (private creator or public super_admin) — reuses the existing Supabase Storage pattern from article images |
| **Participant list window (scrollable)** | ✅ (private only) | Public channels don't track explicit membership, scoped to private per the earlier open question |
| **Participant list layout — move to left side of the channel page** | 🔜 (new) | Currently stacked above posts; should become a left-column box instead, likely implying a two-column layout for the channel detail page |
| **Participant list grouped by member tier** | 💡 (from Discord research) | Discord's role-grouped member lists (e.g. "Mods — 3", "Verified — 5") map cleanly onto data InfinityVolume already has — group the participant list by Captain/Quarterback/Senior Research Analyst instead of a flat list |
| **Post interactions: comments, like, share** | ✅ | Reconciled with the earlier flat-posts decision by explicitly choosing full threaded replies (Slack-style, one level deep, not infinite nesting) — see resolved item below. Like (with count + per-user state) and Share (copy-link to the specific post) both built and confirmed working. |
| **Role-based UI audit across channel features** | ✅ | Found and fixed one real gap in the process — see the `discussion_posts` INSERT policy fix in Known Issues below |
| **Pinned posts per channel** | 🔜 (confirmed) | Channel creator/admin pins important posts to the top. Discord research suggests a template for the pinned "about this channel" post itself: founding context, numbered principles/rules, link to more detail — worth offering as a suggested structure, not enforcing. |
| ~~Per-channel minimum Omega score to post~~ | ❌ Dropped | Omega score is currently article-only — gating discussion participation on it would lock out anyone who only ever discusses, never publishes full articles. Revisit once a discussion-based reputation signal exists. |
| **"Hot"/trending sort, not just chronological** | ✅ | A likes-only adaptation of Reddit's engagement-velocity model (no downvotes, consistent with the earlier decision) — log-scaled like count minus a time-decay term, so recent engagement genuinely outranks stale all-time popularity |
| **Flag/report on posts** (not raw downvotes) | 🔜 (confirmed, redesigned) | Deliberately NOT a downvote — Reddit's well-documented problem is downvotes getting used to punish disagreement rather than genuine low quality, which is a real risk for a platform meant to encourage contrarian financial analysis. Flags go to admin review instead of directly affecting any score — connects naturally to the moderation queue idea below. |
| Threaded replies | ✅ | Explicitly reopened the earlier flat-posts decision, by choice — one level deep only (reply to a top-level post, not to another reply), consistent with keeping complexity bounded rather than open-ended nesting |

---

## Settings

| Item | Status | Notes |
|---|---|---|
| Tier, Omega score, admin role display | ✅ | |
| Sign out | ✅ | |
| Editable screen/display name | ✅ | Built as part of the new Public Profile modal (accessible from the sidebar user panel), rather than a separate Settings-page field — same underlying `display_name` column |
| Public profile preview | 🔜 | See your own author page the way others see it — distinct from the Public Profile *editor* now built; this would be a read-only view |
| 💡 Full-text search across your own content | 💡 | Still unscoped from the last round |

---

## Auth & Account Security

*Currently: Google SSO only (via Supabase Auth). Pre-distribution additions scoped below.*

| Item | Status | Notes |
|---|---|---|
| Google / Gmail SSO sign-in | ✅ | Currently the only sign-in method — Supabase's built-in OAuth provider |
| Email + password sign-up | 🔜 | Any email address (not just Gmail). Standard email/password flow via Supabase Auth — adds a sign-up form with email + password + confirm-password fields, and a "forgot password" / reset-by-email flow. Should be built before any distribution push so the platform isn't Gmail-only for new users. |
| 2FA via mobile number | 🔜 | To be enabled just before distribution goes live, as a bot/spam gate. Design decisions already locked: mobile number required at signup (any country); country auto-populates the dialling code; US numbers capped at 2 accounts max (covers shared-device households); international numbers capped at 1 account per number; email remains the primary unique identifier (enforced by Supabase Auth already). SMS delivery via Supabase Auth's built-in Twilio integration or a separate Twilio account. |
| Rate limiting / CAPTCHA on sign-up | 🔜 | Secondary layer to consider alongside 2FA — Supabase has built-in rate limiting on auth endpoints; a CAPTCHA (hCaptcha or Turnstile) on the sign-up form adds a visible human-verification step before phone verification fires |
| Sign-up number uniqueness enforcement | 🔜 | Requires a `phone_numbers` table (or a column on `profiles`) with a unique constraint, plus a check at sign-up time that counts existing accounts per number before permitting the new one. Supabase Auth's own `phone` field on the `auth.users` table can store the number but doesn't enforce the per-number account cap — that logic lives in a server action or a database trigger. |

---

Built in response to a real gap found while testing collaborator invites: adding someone as a channel member or article collaborator used to take effect immediately, with no consent from the other person.

| Item | Status | Notes |
|---|---|---|
| Pending-request schema | ✅ | Single `pending_requests` table covers both channel invites and collaborator invites (two nullable reference columns + a check constraint, rather than two separate tables), so one inbox UI can show both together |
| Channel invites require acceptance | ✅ | `addChannelMember` now creates a pending request instead of inserting into `channel_members` directly |
| Collaborator invites require acceptance | ✅ | `addCollaborator` now creates a pending request instead of inserting into `article_collaborators` directly |
| Requests box on Settings page | ✅ | Shows each pending request with inviter name, target (channel/article), and Accept / Deny / Wait actions |
| "Settings" renamed to "Settings / Requests" in the nav | ✅ | |
| Yellow "unattended" dot on the nav item | ✅ | Specifically tracks *unattended* (never even looked at), not just *pending* — choosing "Wait" clears the dot without forcing an accept/deny decision, matching the requested behavior |
| Accept / Deny / Wait actions | ✅ | Accept grants access and resolves the request; Deny resolves without granting; Wait leaves status as `pending` but marks it seen, clearing the dot only |
| Accepted channels appear under Private Channels | ✅ | No separate code needed — the sidebar's private-channels query already relies on RLS, which depends on a `channel_members` row that now only exists post-acceptance |
| Accepted articles appear in Saved Drafts / My Articles | ✅ | Whichever one matches the article's actual status (draft vs. published) — see the Own/Shared split work above |

---

## Admin (super_admin only)

| Item | Status | Notes |
|---|---|---|
| Assign/remove Technical & Research roles | ✅ | |
| Article originality/verification scoring UI | 🔜 | Research admins currently have no actual interface to set `originality_score`/`admin_verified_score` on articles — the schema fields exist, the review workflow doesn't |
| 💡 **Moderation queue** | 💡 | Reddit/Discord pattern — flagged posts/articles awaiting admin review, rather than admins having to browse everything manually |

---

## Site-wide / cross-cutting

| Item | Status | Notes |
|---|---|---|
| 💡 **Global search** | 💡 | Across articles, discussions, and channels — the single most-cited Slack feature in this research, and currently nothing on the site supports it |
| **Live-updating browser tab title** | 💡 (from Discord research) | Discord bots show live prices as their always-visible status text with zero clicks — doesn't port literally (that's a Discord-bot-API mechanism), but the underlying idea of truly ambient data translates to updating the tab title with a tracked ticker's live price on relevant pages |
| **Persistent user panel at the bottom of the sidebar** | ✅ | Avatar + display name + status dot, permanently visible at the bottom of the sidebar (genuinely pinned to the viewport via sticky positioning, not just resting at the bottom of a min-height container — found and fixed a real positioning bug during testing where it required scrolling to become visible). Clicking opens a quick menu with 4 manually-set status options (Available/Away/Do Not Disturb/Invisible — not automatic presence detection, which stays deferred to Phase 2) plus a "Public Profile" link opening the full editor: 8 predefined avatar options (upload-your-own deferred), bio, display name (doubling as the Settings display-name field), and professional info (title/tagline/role — filled in manually, styled like a LinkedIn import rather than an actual LinkedIn API integration, which isn't realistically available without a partnership agreement) plus links (LinkedIn/X/GitHub/website). |
| **Sidebar scalability toolkit, for once channel lists get long** | 💡 (from Discord research) | Confirmed directly in a live long channel list: the list scrolls internally while the bottom user panel stays pinned in place — the new user panel above should be built to behave the same way. Two mechanisms adopted here (rest of the toolkit — mute, per-channel notification granularity, mark-as-read, unread badges — moved to Phase 2, since they depend on read/unread tracking that doesn't exist yet): **(1)** "Pin to top" per channel — lets a user override default ordering to surface a priority channel, directly applicable to both Public and Private Channels sub-lists; **(2)** category collapse/expand for hiding a whole section's channels — a well-established Discord mechanic, though not one I was able to cleanly re-confirm live due to an automation-rendering quirk in this session, so flagging it as based on general knowledge rather than freshly verified here. |
| Dark grey member-page box backgrounds | 🔜 (styling, this round) | Visual consistency pass across all member pages, not a new utility |

---

## Contacts and Inbox

Built as a full feature this round — originally scoped as one of the four "new major concepts" below, now substantial enough to warrant its own section like Requests and the sidebar user panel did.

| Item | Status | Notes |
|---|---|---|
| Contacts schema | ✅ | `contacts` table (`user_id`, `contact_id` pairs) |
| **Contact invites via the pending_requests system** | ✅ | Revised mid-build from the original "immediate add, no acceptance needed" plan, per explicit request — contact adds now go through the exact same accept/deny mechanism as channel and collaborator invites, shown in the same Settings / Requests inbox with an "Add to Contacts" / "Deny" / "Wait" set of actions, rather than a separate, simpler mechanism |
| **Mutual contact established on acceptance** | ✅ | Accepting a request inserts both directions of the relationship at once, since the recipient's acceptance itself is their explicit consent — no separate "add them back" step needed the way a naive immediate-add design would have required for messaging to unlock |
| Messaging requires mutual contact status | ✅ | Centralized in a `can_message()` function checking the recipient's messaging permissions (allow from contacts / allow from anyone) — reused by both the RLS INSERT policy and the send-message server action, so a blocked send returns a clear message rather than a generic RLS failure |
| Direct messages schema + inbox (list + thread) | ✅ | 90-day default display window, confirmed as a filter, not a deletion policy — older messages still exist, just aren't shown by default |
| **Messaging permissions toggles (Settings)** | ✅ | Three toggles: allow from contacts (default on), allow from anyone (default off), filter unknown senders (default off) — the third toggle saves correctly but isn't yet enforced anywhere at the display layer (no separate "message requests" holding-area inbox section reads it yet) |
| Sidebar "Contacts" section | ✅ | Third section after Private Channels, same 4-item cap + "+ N more" expander pattern already used for Private Channels |
| Public member profile pages | ✅ | Bio, professional info, links, and an "Add to Contacts" button with three states (not added / request sent / added) |
| Per-field public/private profile checkbox | 🔜 | Deferred — profile fields (bio, socials, etc.) are all publicly readable for now, matching the existing `profiles` RLS policy, rather than building a privacy toggle per field |
| Presence status | 🔜 (Phase 2) | Status stays manually-set (Available/Away/DND/Invisible, from the sidebar user panel) — real-time online/offline detection is still a separate, unbuilt piece |

---

## New major concepts (not yet scoped in detail)

| Item | Notes |
|---|---|
| **Private Mastermind Registry** | Members self-organize into private sub-channels by theme (region, large-cap, value, crypto, real estate). Creator gets admin rights (add/remove members, appoint up to 2 more admins). Public channels stay visible to everyone; these are visible only to members within them. Meaningfully extends the existing `channels` schema — needs a `visibility` field (public/private), a `channel_members` table, and a separate `channel_admins` table for the channel-scoped admin rights (creator + up to 2 appointed) — this is explicitly independent of the site-wide `admin_role` system, not a subset of it. A site-wide Technical/Research admin has no special standing inside someone else's private channel unless separately made a channel admin there. |
| **Public channel moderation via existing site-wide roles** | No new schema needed — Technical/Research admins moderating public channels just extends what those existing roles can *do* (pin posts, remove content) once inside a public channel; the permission-holder concept is already solved. |
| **Exclusive Event Calendars** | Centralized dashboard for macro events, webinars, guest speaker slots, member meetups — with "Add to Calendar" (likely iCal export) and RSVP. Needs a new `events` table plus RSVP tracking. |
| **Community Sentiment Polling** | Live, page-level polls on short/long-term direction for specific assets, sectors, or the broader market — aggregating into a proprietary "Community Fear & Greed Index." Needs a `polls` + `poll_votes` schema, live aggregation, and a display mechanism embedded on relevant pages (ticker pages, market pages, homepage). |

Each of these is a genuinely substantial build in its own right — comparable in scope to the whole auth/publishing system already built, not a quick addition. Worth scoping and prioritizing individually rather than batching together.

---

## Known issues (confirmed bugs, pending fixes)

| Item | Status |
|---|---|
| Watchlist price/volume not populating | ✅ Fixed — was a `router.refresh()` gap, not a data-shape issue |
| Watchlist company name → symbol resolution | 🐛 Still broken — exact symbols work, names/partial names don't. Root cause not yet found; batching with custom columns/sorting per explicit request rather than continuing to debug in isolation |
| Publish body editor growing the whole page | ✅ Fixed — now a fixed-height, internally-scrolling box |
| Sidebar compressing wide tables (homepage + /markets/*) | ✅ Fixed — hover-collapse overlay mode on both, permanent sidebar everywhere else |
| Sidebar invisible when signed out | ✅ Fixed — now always renders; clicking while signed out naturally redirects to sign-in via existing middleware |
| Channel creation: infinite RLS recursion (2 separate instances) | ✅ Fixed — self-referential policies on `channel_members`/`channel_admins` querying their own table, and a circular reference between `channels` and `channel_admins` policies. Both fixed with `SECURITY DEFINER` helper functions (`is_channel_member`, `is_channel_admin`, `is_public_channel`) that bypass RLS internally, breaking the cycles. Worth remembering this pattern if a similar "infinite recursion detected" error shows up on any other table later. |
| Channel creation: RLS violation despite correct-looking policy | ✅ Fixed — genuinely subtle root cause: chaining `.select().single()` onto the insert makes Supabase build a single `INSERT ... RETURNING` statement, and the RETURNING clause is subject to the table's SELECT policy at a point in the same transaction where a trigger-created row (the auto-added channel admin) wasn't yet resolving as visible to that check. Fixed by running the follow-up fetch as a separate query after the insert's transaction fully commits, rather than chaining it. |
| Featured/inline/cover image uploads: "Invalid key" from Supabase Storage | ✅ Fixed — the raw filename (spaces, colons, etc. — e.g. a default macOS screenshot name) was being embedded directly into the storage path across all three upload locations. Fixed by dropping the original filename entirely and keying storage paths on the UUID + a sanitized extension only. |
| Channel posts silently disappeared after adding `post_likes` | ✅ Fixed — a genuinely subtle `PGRST201` PostgREST error: adding `post_likes` (with its own FK to both `discussion_posts` and `profiles`) created a second path between `discussion_posts` and `profiles`, so the existing `profiles(display_name)` embed became ambiguous and the whole query silently failed. Fixed by explicitly specifying the FK constraint (`profiles!discussion_posts_user_id_fkey`). Worth remembering if a similar silent failure shows up after adding any future table with its own FK to `profiles`. |
| **`discussion_posts` INSERT policy never checked channel access** | ✅ Fixed — confirmed real gap via the role-based audit: the policy only checked `auth.uid() = user_id`, never whether the poster could actually see/access the `channel_id` they were posting into. Any signed-in user could post into a private channel they weren't a member of. Fixed by requiring `channel_id` to be one returned by `channels`' own (already-correct) visibility rules. **Lower-priority, same pattern, not yet fixed:** `post_likes` and `post_flags` INSERT policies have the identical shape — but liking/flagging a post you can't even see doesn't leak or modify content the way posting into a channel does, so this is genuinely lower severity. |
| `saveArticle` could silently transfer article ownership | ✅ Fixed — confirmed real bug found while building the collaborator UI: the same `row` object (including `user_id: user.id`) was used for both insert and update. A collaborator saving/autosaving an existing article would silently overwrite the original author's `user_id` with their own. Fixed by never including `user_id` in the update path — ownership is only ever set at creation time. |
| Accepting a channel/collaborator invite silently failed at the RLS layer | ✅ Fixed — the `channel_members` and `article_collaborators` INSERT policies were written for the old direct-add flow (author/admin inserting someone else's row), so `auth.uid()` there meant the author/admin. Once adding someone went through a pending-request Accept flow instead, it's the *invited person* performing the insert — and neither policy allowed that, so every Accept failed with no visible error. Fixed by adding `or auth.uid() = user_id` to both, safe specifically because the application layer already verifies a matching pending request exists before ever attempting the insert. |
| Collaborators could never actually see a draft they'd been added to | ✅ Fixed — the original `articles` SELECT policy only ever checked `status = 'published' or auth.uid() = user_id`; only the UPDATE policy was ever extended for collaborators, SELECT never was. Fixed by adding a collaborator check to the SELECT policy too. |
| Infinite recursion between `articles` and `article_collaborators` | ✅ Fixed — adding the fix above created a new circular dependency: the `articles` policy queried `article_collaborators`, whose own policy queried `articles` right back. Same class of bug as the earlier `channel_members`/`channel_admins` recursion, fixed the same proven way — a `SECURITY DEFINER` helper function (`is_article_collaborator`) that bypasses RLS internally, breaking the cycle. |
| `current_role` column name rejected by Postgres | ✅ Fixed — confirmed via a live Supabase syntax error: `current_role` is a reserved PostgreSQL keyword (a built-in pseudo-constant like `current_user`), not a usable plain column name. Renamed to `current_job_role` across the schema and every referencing file before it ever shipped. |
| FINRA Treasury volume never actually reached the homepage | ✅ Fixed — two separate, unrelated causes stacked together: (1) the account only had Mock-type API credentials, not Public — FINRA doesn't have a "Live" tier at all, that was just this script's own internal naming; (2) FINRA's live endpoint defaults to returning CSV, not JSON, unless an explicit `Accept: application/json` header is sent — the mock endpoint apparently defaults to JSON, which is why this never surfaced during earlier mock-only testing. Neither needed the FINRA helpdesk ticket that had been pending. |
| `finra_treasury_volume.py` was never actually wired into the real pipeline | ✅ Fixed — the module's own docstring said it was "imported and called from treasury_yields.py", but that integration was never actually built; the volume-fetching script worked standalone but nothing in the real pipeline called it. Fixed by importing it into `treasury_yields.py` and merging volume fields into each tenor's existing yield data. |
| Homepage Treasury table showed "$—" for Volume regardless of real data | ✅ Fixed — `FixedIncomeTable.js` had `$—` hardcoded as literal placeholder text in the Volume/Total columns, never actually reading the `volume_usd` field. The Python-side fetch had been working correctly the whole time; the frontend simply was never wired up to display it. "Total" stays "—" — FINRA's data doesn't provide a real outstanding-debt total for a tenor, only daily trading volume, so no number is guessed at for it. |
| Predefined avatars all rendered as solid black circles | ✅ Fixed — Tailwind's `fill-*`/`stroke-*` utility classes weren't actually generating any CSS for this project's custom color names, even though `bg-*`/`text-*` variants of the same colors work correctly everywhere else in the app. Fixed by using hardcoded hex values via inline `style` instead of Tailwind classes for these specific SVG shapes. |
| Sidebar user panel required scrolling to become visible | ✅ Fixed — two compounding issues: (1) the sidebar used `min-h-screen`, so it scrolled away with the page like any normal-flow element instead of staying pinned; (2) even after making it `sticky`, using a plain `h-screen` didn't account for the sidebar starting below the header in normal page flow, so its bottom edge (and the user panel on it) extended past the visible viewport by the header's own height. Fixed with `sticky top-16` and `h-[calc(100vh-4rem)]` together. |
| Messaging permission toggle switches were completely invisible | ✅ Fixed — used non-standard Tailwind spacing values (`h-5.5`, `w-4.5`, `h-4.5`) that don't exist in Tailwind's default scale (which only has half-steps at 0.5/1.5/2.5/3.5, not 4.5/5.5). These invalid classes generated no CSS at all, collapsing the toggle to zero size. |
| Toggle thumb visibly overflowed past the pill's right edge once fixed | ✅ Fixed — confirmed via zoomed-in live testing: the earlier fix relied purely on a `translate-x` offset with no explicit base `left` position, which pushed the white thumb circle entirely outside the colored background once "on." Fixed by setting an explicit `left-0.5` resting position and using a relative `translate-x-5` (one thumb-width) for the "on" state, landing it flush and fully contained within the pill either way. |
| Contact acceptance duplicate-row bug ("Could not add this contact") | ✅ Fixed — confirmed via live testing across SA, RA, and TA accounts: accepting a contact request when a relationship row already existed in the contacts table (from a previous session or a concurrent request from the same sender) was failing with "Could not add this contact" due to a unique constraint violation on the two-direction batch insert in `request-actions.js`. Fixed with `ignoreDuplicates: true` on the Supabase insert (`ON CONFLICT DO NOTHING`). Replace `web/lib/request-actions.js` to apply. |
| Public channel creation completely undiscoverable for super admins | ✅ Fixed — `MemberSidebar.js` had "Public Channels" hardcoded as a non-link header for *everyone* regardless of role, making the create-channel page (`/member/admin`) unreachable from anywhere a super admin would naturally look. The one link that did exist (Settings page) was labeled "Manage member roles →" with no mention of channels. Fixed by: (a) adding `admin_role` to `layout.js`'s profile query, (b) making the sidebar header link to `/member/admin` for super admins only, (c) updating the Settings page label to "Manage member roles & public channels →". |
| `RoleConsole.js` import path wrong for `PERMISSION_KEYS` | ✅ Fixed (two iterations) — first import used `../../../lib/role-definition-actions` (wrong depth from a component). Fixed to `../lib/role-definition-actions`. Then Next.js 16 threw a second error: "Only async functions are allowed to be exported in a 'use server' file" — `PERMISSION_KEYS` is a plain constant array, not an async function, so it can't be exported from a `"use server"` file even with `export { ... } from`. Fixed by moving `PERMISSION_KEYS` into a new plain module `role-permissions.js` (no `"use server"` directive), with `RoleConsole.js` importing from there directly. |
| `MemberSidebar.js` parse error after profile prop was added | ✅ Fixed — the first `str_replace` that added `profile={profile}` to the NavLinks call inside the permanent-sidebar branch accidentally consumed the closing `</div>` and `<UserPanel profile={profile} />` lines, leaving the JSX unclosed. Fixed by restoring those two lines immediately after the NavLinks block. |
| `corporatesAndAgenciesCappedVolume` needs a paid FINRA credential | ✅ Diagnosed, not fixed — confirmed via live testing: the mock endpoint returned an explicit 403 ("basic API credential... cannot access"), the live endpoint silently returned 204 for the same underlying reason across every date tried. This dataset specifically needs a Firm/Organization-tier credential, unlike `corporateMarketBreadth`, which uses the same free Public tier successfully. Dropped from the active pipeline per explicit decision rather than pursuing a paid upgrade — the fetch function itself is left intact in `finra_corporate_debt.py`, just unused. |
| Home sales monthly volume showed $142,318Bn ($142.3 trillion) | ✅ Fixed — a real ~1000x unit-conversion bug: FRED's `EXHOSLUSM495S` series was assumed to be reported "in thousands of units," but FRED's own published data confirms it's already a direct count ("Number of Units, Seasonally Adjusted Annual Rate" — e.g. "4,090,000"). An erroneous `* 1000` multiplier in the volume-estimate formula was removed; the fix was sanity-checked against real homepage numbers before shipping, landing at a realistic ~$146Bn/month. |
| Redfin weekly home sales columns not matching expected names | 🔜 Diagnosed, not fixed — confirmed the actual file uses ALL-CAPS column names (`PERIOD_BEGIN`, `MEDIAN_SALE_PRICE`, etc.), fixed via case-insensitive matching in `_find_column()`. The remaining open question is why the `PERIOD_DURATION` filter for "week"-only rows still doesn't match anything — deferred per explicit decision (frontend now shows monthly-only; `fetch_weekly_home_sales()` still runs server-side but isn't displayed). |
| Live site fully down — HTTP 503 / "Internal Server Error" on every page | ✅ Fixed — two entirely separate, unrelated root causes stacked together, not one bug: **(1)** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` didn't exist at all in Vercel's environment variables — confirmed directly from Vercel's own function logs ("Your project's URL and Key are required to create a Supabase client"), crashing every request in middleware (which runs on nearly every path via a broad matcher). Fixed by adding both variables (as Config type, not Secret — they're meant to be public, prefixed `NEXT_PUBLIC_` for exactly that reason). **(2)** Even after adding them, the same error persisted — because `NEXT_PUBLIC_*` variables are baked into the JavaScript bundle at *build time*, a first redeploy that reused the existing build cache never actually picked up the new values. Fixed by redeploying with build cache explicitly disabled. **(3)** Once the app itself was confirmed working (via the direct `.vercel.app` deployment URL), the custom domain still failed for everyone, in every browser — confirmed via Vercel's Domains page showing "Invalid Configuration" on both `infinityvolume.com` and `www.infinityvolume.com`, a third and entirely separate cause: a stale CNAME record at Porkbun (the domain registrar) pointing to an outdated Vercel value, unrelated to the Supabase issue. Fixed by updating the record to the current value Vercel's dashboard specified. A lingering Safari-specific failure after all three fixes turned out to be Safari's own cached DNS/site data from the earlier outage, resolved by flushing macOS's system DNS cache and clearing Safari's site data for the domain — confirmed as local-only once the site loaded correctly in a Private Browsing window while the regular window still didn't. |

---

## Homepage market-data tables (separate track from Member Utilities, tracked here per established precedent — same as the earlier FINRA Treasury volume work)

| Item | Status | Notes |
|---|---|---|
| Corporate Bond Market Breadth (FINRA TRACE) | ✅ | Advances, declines, unchanged, total trades/volume, 52-week highs/lows — confirmed field names directly from FINRA's own `/metadata` endpoint (publicly readable without auth, unlike `/data`) before building, same proven pattern as the Treasury volume integration |
| US Home Sales, monthly (FRED) | ✅ | Units sold (annualized rate) and an estimated dollar volume (units × median price) — explicitly labeled as an estimate, since no single source publishes a direct dollar figure |
| US Home Sales, weekly (Redfin) | 🔜 | Fetch logic exists (`fetch_weekly_home_sales()`) and correctly handles the real ALL-CAPS column schema, but the week-vs-month row filter still isn't matching — not yet displayed anywhere |
| **Combined "Corporate Bonds & Home Sales" homepage card** | ✅ | Per explicit request, combines the FINRA and FRED data above into a single card — genuinely unrelated data sources (fixed income vs. real estate) sharing a table by request, not by any conceptual connection. Advances/declines shown as a two-row mini-heatmap (green/red background intensity scaled by relative share) plus an advance/decline ratio row, rather than a plain breadth table |
| **`/market-activity` landing page** | ✅ | Expanded detail beyond the compact homepage card — restores the 52-week highs/lows and unchanged count (dropped from the compact card for space), plus the home-sales-estimate methodology note (also dropped from the compact card) |
| Top ETFs table — whole-number rounding | ✅ | Volume and AUM columns now round to the nearest whole number ($25B, not $25.02B) — a display-only change, `formatUsdCompact()` in `TopETFsTable.js` |
| US Treasury Yields table — width fix | ✅ | Widened to `1.2fr` (vs `1fr` for the other two homepage columns) after confirmed live overlap between the Yield and Volume columns |
| Treasury issuance calendar (upcoming auctions, size/date) | 🔜 | Next up — via Treasury's own Fiscal Data API (`api.fiscaldata.treasury.gov`), free and keyless, unlike FINRA/Redfin. Second of three items from the original homepage-table wishlist; corporate debt and home sales are both done |

---

## CA Role — Community Admin capabilities (built Sep 2026)

| Item | Status | Notes |
|---|---|---|
| `is_hidden` + `is_locked` on `discussion_posts` | ✅ | SQL migration `supabase-add-ca-moderation.sql`. `hidden_by`, `hidden_at`, `locked_by`, `locked_at` added for audit trail. |
| CA moderation UPDATE policy on `discussion_posts` | ✅ | CA and SA can hide/lock posts in **public channels only**. Private channels excluded by design. |
| `omega_boosts` table | ✅ | `recipient_id`, `granted_by`, `boost_points` (default 5), optional `reason`. Unique: one boost per recipient. Self-boost blocked via DB check constraint. |
| Omega score includes CA boost | ✅ | `calculate_omega_score()` sums `boost_points` from `omega_boosts`. Trigger fires on insert/delete. Confirmed: TA Ω 17.11 → 22.11 immediately after boost granted. |
| `CAModerationMenu` component | ✅ | ⋯ dropdown on public channel posts, CA/SA only. Hide/Unhide toggle + Lock/Unlock toggle. |
| Hidden post placeholder | ✅ | "[Hidden by community admin]" — faded italic. CA still sees ⋯ for reversal. Regular members filtered server-side. |
| Locked post indicator | ✅ | 🔒 Locked label. Reply button removed — "N replies · thread locked" shown instead. |
| `CABoostManager` component | ✅ | Member dropdown with Ω scores, reason field, grant button. Active boosts with Revoke. Slot counter (0/3 active). |
| `/member/admin/community` page | ✅ | CA-gated. Boost management + post moderation guidance. SA sees all platform boosts. |
| Community Admin sidebar link | ✅ | CA + SA only. |
| Community boost badge on public profile | ✅ | ⭐ "Community boost +5" with tooltip (reason + grantor). Shown next to Omega score. |
| Limits enforced | ✅ | Max 3 active boosts per CA, max 1 per member, no self-boost — all DB-level. |

**Confirmed live (CA account ambhuj58@gmail.com):** CA badge ✅ · Community Admin page ✅ · Boost granted (TA Ω 22.11) ✅ · ⭐ badge on TA profile ✅ · ⋯ menu on posts (not visible to TA) ✅ · Hide/Unhide ✅ · Revoke ✅

---

## RA — Article Channel Submission (built Sep 2026)

| Item | Status | Notes |
|---|---|---|
| `article_channel_submissions` table | ✅ | `article_id`, `channel_id`, `submitted_by`, `status` (pending/approved/changes_requested/rejected), `reviewer_id`, `reviewed_at`. Unique per (article, channel). Run `supabase-add-review-and-support.sql`. |
| `article_review_comments` table | ✅ | Track-changes: `comment`, `selected_text`, `selection_start/end`, `comment_type` (comment/suggestion/approval_note/rejection_reason), `resolved_at`. |
| Channel selector on Publish page | ✅ | Right panel below Collaborators. Always visible. Public (0/2) and Private (0/5) lists. Click to select with brass highlight + ✓. Hint shows count. |
| Publish button label | ✅ | "Publish" → "Publish & Submit to 2 channels" when channels selected. |
| Submit fires on Publish | ✅ | `submitArticleToChannels()` runs after `performSave("published")`. Server validates max limits. |
| `/member/admin/review` page | ✅ | RA-gated. Pending + reviewed submissions. Body preview, channel badge, comment thread, type selector, Add comment, Approve/Request changes/Reject. Approve auto-inserts into `article_channels`. |
| "Article Review" sidebar link | ✅ | RA only. |

---

## TA + All Members — Support System (built Sep 2026)

| Item | Status | Notes |
|---|---|---|
| `support_tickets` table | ✅ | Types: bug/feature/data_issue/dataset_request. `vote_count` trigger-maintained. |
| `support_ticket_votes` table | ✅ | One vote per member per ticket. Trigger syncs `vote_count`. |
| `/member/support` page | ✅ | 4-type form + community-upvoted ticket list grouped by type. Confirmed live: ticket submitted, appeared immediately. |
| `/member/admin/support` page | ✅ | TA-gated. Status dropdown + TA notes. Confirmed: "Add dark mode" ticket updated Open → In progress with notes. |
| `/member/admin/flags` page | ✅ | TA-gated. Post content, channel, flagger, reason. Dismiss / Reviewed actions. (Note: dismiss RLS fix still needed — one SQL policy.) |
| Support Queue + Flagged Content sidebar links | ✅ | TA + SA only. |
| "Support & Feedback" nav button | ✅ | All members. 8th nav item. |

---

## Pinning System (built Sep 2026)

| Item | Status | Notes |
|---|---|---|
| `is_pinned` on `articles` | ✅ | SQL migration `supabase-add-pinning-and-attachments.sql` |
| `is_pinned` on `watchlists` | ✅ | Same migration |
| `is_pinned` on `direct_messages` | ✅ | Same migration |
| `InlinePinButton.js` component | ✅ | Generic reusable pin toggle — accepts `isPinned`, `onToggle` callback, `title`. Used for articles, watchlists, DMs. |
| `pin-actions.js` server actions | ✅ | `toggleArticlePin`, `toggleWatchlistPin`, `toggleDirectMessagePin` |
| Pinned articles on My Articles | ✅ | Pin icon on own article rows, pinned articles float to top with 📌 label |
| Pinned watchlists in Report Generator | ✅ | `is_pinned` fetched, ordering by pinned first |
| Pin in private channels — any member | ✅ | `canPin` prop passed from channel page. Private channels: any member. Channel admin: always. RLS policy updated. |
| Pin in public channels — SA/RA only | ✅ | `canPin` derived from `profiles.admin_role` — `super_admin` or `research` only |
| Pin in DMs | ✅ | Hover a message → "Pin"/"Unpin" link appears. Server action handles both sender and recipient. Pinned messages show 📌 label. |

## Attachment System (this session)

| Item | Status | Notes |
|---|---|---|
| SQL schema | ✅ | `attachment_url`, `attachment_type`, `attachment_name`, `attachment_size` added to `discussion_posts` and `direct_messages`. Check constraint on type. |
| Supabase Storage bucket | ✅ | `attachments` bucket (public), 25MB ceiling, allowlist of MIME types enforced at bucket level. RLS: own folder upload, public read, own-folder delete. |
| `attachment-actions.js` | ✅ | `uploadAttachment(formData)` — server-side type gate + size gate + extension derived from MIME (never from filename). Returns `{url, type, name, size}`. |
| Allowed file types | ✅ | Images (JPEG/PNG/GIF/WebP, 5MB), PDF (25MB), Excel/xls/xlsx (25MB), PowerPoint/ppt/pptx (25MB), Word/doc/docx (25MB), CSV/JSON/TXT/MD/ipynb (10MB) |
| `AttachmentComposer.js` | ✅ | Toolbar row with 🖼️ image icon and 📎 file icon. Separate file pickers with correct `accept` attributes. Upload spinner + error display. Preview: image thumbnail or filename+size pill with ✕ to remove. |
| Attachments in channel posts | ✅ | `PostForm` in `ChannelPosts.js` — compressed 2-row textarea, attachment toolbar below, `createPost` extended to accept `attachment` param. |
| Attachments in DMs | ✅ | `MessageComposer.js` rewritten — compressed single auto-expanding row, attachment toolbar, `sendDirectMessage` extended to accept `attachment` param. |
| Attachment display in posts | ✅ | `AttachmentDisplay` component inline in `ChannelPosts.js` — images render inline max-h-64, docs render as clickable download pill with icon+size |
| Attachment display in DMs | ✅ | `AttachmentBubble` component in DM page — images inline, docs as styled download pill matching bubble colour |

## Email + Password Auth (this session)

| Item | Status | Notes |
|---|---|---|
| `auth-actions.js` expanded | ✅ | Added `signUpWithEmail`, `signInWithEmail`, `sendPasswordReset`, `updatePassword` — all clean server actions, no inline `"use server"` |
| `/sign-in` redesigned | ✅ | Two-tab UI (Email / Google). Email tab: email+password fields, "Forgot password?" link, "Sign up" link. Google tab: existing Google button. |
| `/sign-up` page | ✅ | New page at `app/sign-up/`. Email + password + confirm. 4-bar password strength indicator (8/12/16/20 chars). Inline mismatch error on confirm field with red border. Post-submit "Check your email" confirmation state. |
| `/forgot-password` page | ✅ | New page. Always shows success (account enumeration protection). "Expires in 1 hour" note. |
| `/reset-password` page | ✅ | New page. Waits for Supabase `PASSWORD_RECOVERY` auth event (hash fragment exchanged client-side via `onAuthStateChange`). Shows "Verifying…" state until session ready. New password + confirm with strength indicator. Redirects home after success. |
| `auth/callback/route.js` updated | ✅ | Comments clarified — handles OAuth + email confirmation; password reset is hash-fragment based so handled entirely client-side in `/reset-password`. |
| Supabase URL Configuration | ✅ | Site URL updated to `https://infinityvolume.com`. Redirect URLs added: `http://localhost:3000/**`, `https://infinityvolume.com/**`, `https://*.vercel.app/**` |
| End-to-end sign-up confirmed | ✅ | `testuser2@infinityvolume.com` created in Supabase with Email provider — visible in Auth → Users dashboard |

## Nav Bar — Compressed Chat + Icons (this session)

| Item | Status | Notes |
|---|---|---|
| Compressed DM composer | ✅ | `MessageComposer.js` — single auto-expanding row (`rows={1}`, max 128px), border-contained card, attachment icons in toolbar below text. Replaces old fixed 3-row textarea. |
| Compressed channel post composer | ✅ | `PostForm` in `ChannelPosts.js` — 2-row textarea with attachment toolbar in a compact card. |

---

| Item | Status | Notes |
|---|---|---|
| Homepage sidebar — replace hover ribbon with icon strip | ✅ | 48px permanent icon strip replaces the 20px brass ribbon. Icons with tooltips, avatar at bottom. Hover expands to full 176px sidebar using CSS `group-hover` — no JavaScript state needed. Tables on homepage unaffected (48px too narrow to compress them). |
| Permanent sidebar — inline icons on all nav buttons | ✅ | `w-4 h-4` SVG icon next to each label on all 7 nav buttons. |
| Investor / Community Sentiment nav button | ✅ | 7th nav item at `/member/sentiment`, placeholder page with description. Sits between Bookmarks and Settings. |
| Collapsible sections (Public Channels / Private Channels / Contacts) — default closed | ✅ | All three sections collapsed on load. Chevron-only to expand — title still navigates if it's a link. |
| Collapsible section styling — consistent with nav items | ✅ | All three headers now use `text-sm font-body text-paper/60` — same font as nav items, no more all-caps label or different style on Private Channels. Thin divider between nav items and channel/contact sections. |
| Channel and contact sub-items — remove italic | ✅ | Sub-item links previously had `font-body italic` — removed, all sub-items now match the standard non-italic font. |
| Chevron size increase | ✅ | `text-base` `›/⌄` characters — noticeably larger than the previous `text-xs` `▸/▾`. `truncate + min-w-0` on the title prevents long labels from pushing the chevron out of the sidebar boundary. |
| Contacts / Chats rename | ✅ | "Contacts" → "Contacts / Chats" in the sidebar. |

---

## Homepage table cleanup (this session)

| Item | Status | Notes |
|---|---|---|
| Treasury table — drop "Total" column | ✅ | Was always a hardcoded `—` placeholder with no real data source. Removed header + cell entirely. |
| Treasury table — Volume zero decimal places | ✅ | `$221.2B` → `$221B`. Changed `toFixed(1)` to `Math.round()` in `formatVolumeUsd()`. |
| ETF table — drop "Type" column | ✅ | Type column removed from the homepage compact table. Still available on the `/etf/[symbol]` landing page. |

---

## Omega Score (this session)

| Item | Status | Notes |
|---|---|---|
| Root cause investigation | ✅ | Original system was article-only — Omega = recency-weighted Sigma of published articles. Sigma requires `originality_score` + `admin_verified_score` set by a reviewer. No articles reviewed → sigma = 0 → omega = 0 for everyone. |
| Expanded to 5 pillars | ✅ | Article quality 25% (unchanged), channel posts 20% (log-scaled), post engagement/likes received 20% (log-scaled), article reactions 15% (log-scaled), network/contacts 10% (log-scaled). Run `supabase-expand-omega-score.sql`. |
| New triggers | ✅ | `on_discussion_post_changed` (discussion_posts insert/delete), `on_post_like_changed` (post_likes insert/delete — finds post author), `on_contact_changed` (contacts insert/delete). |
| Backfill on migration | ✅ | All existing users recalculated immediately on migration run. Confirmed live: TA account showed 17.11 after backfill (was 0). |
| `OmegaBadge.js` component | ✅ | Tier pill (CPT/QB/SRA) shown on channel posts once Omega ≥ 40. No badge for base "member" tier. `showScore=true` on profile pages shows "Ω 17.11". |
| Wired into channel posts and replies | ✅ | `ChannelPosts.js` — `member_tier` + `omega_score` added to the profiles embed. Badge appears after the role badge. |
| Wired into public profile page | ✅ | Badge + Ω score shown inline with display name (`showScore=true`). |
| Tier thresholds | ✅ (held) | 0-39 = Member (no badge), 40-69 = Captain (CPT), 70-89 = Quarterback (QB), 90+ = Senior Research Analyst (SRA). To be tuned once real usage distribution is visible — currently appropriate given all scores are low early-stage numbers. |

---

## Role-based utilities built this session

| Item | Status | Notes |
|---|---|---|
| Reply-to-a-reply (nested threading) | ✅ | Reply button added to `ReplyItem`. Opens inline form. `parentPostId = reply.parent_post_id \|\| reply.id` so all replies group flat under the original top-level post. Confirmed: parent post reply count incremented from 2 → 3 correctly. |
| Article title in collaborator invite cards | ✅ | SQL migration `supabase-fix-invite-article-visibility.sql` adds pending invite recipient to articles SELECT policy using `is_article_collaborator(id)`. Fixed so invitees can see the article title in the request card before accepting. |
| Deny confirmation feedback | ✅ | `RequestsBox.js` — `denied` state shows "Request declined." for 1.2s then router refresh. |
| Role badge in inviter name on request cards | ✅ | `RequestsBox.js` now accepts `roleDefinitions` prop, shows `RoleBadge` next to inviter name. Inviter's `admin_role` included in the settings page query. |
| Role badges in private channel participant list | ✅ | `ParticipantList.js` accepts `roleDefinitions`, shows `RoleBadge` per member. `admin_role` added to the channel_members profiles embed. |
| Contacts page disambiguation | ✅ | `admin_role` added to profiles query, `RoleBadge` renders next to each contact. Confirmed live: SA/CA/RA all distinguishable. |
| Settings page — admin role as badge pill | ✅ | `RoleBadge` + `OmegaBadge` rendered, "View your public profile →" link using `profile.id`. |

---

*Built and tested across 3 accounts in this session (SA, RA, TA). CA pending.*

### What was built

| Item | Status | Notes |
|---|---|---|
| `admin_role_definitions` table | ✅ | Dynamic, editable role definitions — `role_key`, `abbreviation` (SA/TA/RA/CA), `label`, `description`, `badge_color` (hex), `permissions` (JSONB), `is_system_role`, `sort_order`. Foreign-keyed from `profiles.admin_role`. RLS: public read (badges shown everywhere), super_admin-only write, system role protected from deletion. Run `supabase-add-role-definitions.sql` to apply. |
| Seed data: SA / TA / RA / CA | ✅ | All four roles seeded. SA is `is_system_role = true` — key/deletion protected. |
| `RoleBadge.js` component | ✅ | Reusable pill badge — abbreviation, tooltip = label + description, badge_color from role definitions table. Renders nothing for members with no role. Two sizes (sm / md). |
| Badge on channel posts and replies | ✅ | `ChannelPosts.js` + channel `page.js` — `admin_role` added to the profiles embed, role definitions fetched once per page and passed as props. Confirmed live: SA (brass), RA (green), TA (blue) simultaneously visible in a single channel view. |
| Badge in "My Account" toolbar dropdown | ✅ | `AccountMenu.js` — badge renders inline next to the button label. `layout.js` fetches `admin_role` + role definitions globally, passes to `AccountMenu`. |
| Badge + role card on public profile pages | ✅ | `profile/[userId]/page.js` — badge next to display name (md size), plus a full role card with the description in the role's own badge color. Only renders for members who hold a role. |
| Admin console — Role Definitions editor | ✅ | `RoleConsole.js` — editable label, description, color picker, permission checkboxes per role. Save button with "Saved" confirmation. Delete button (with confirm step) for non-system roles. "+ Add a new role" form (role key, abbreviation, label, description, color). All wired to `role-definition-actions.js` server actions. |
| Admin console — Member Roles dropdown | ✅ | `RoleAssignmentRow.js` — dropdown now builds dynamically from `admin_role_definitions` rather than a hardcoded `["technical", "research"]` array. Any new role added via the console immediately appears as an assignable option without a code change. |
| `setAdminRole` server action | ✅ | `admin-actions.js` — validates new role against the live definitions table (`is_system_role = false`) instead of a hardcoded allowlist. Revalidates layout on change so badges update immediately across all pages. |
| `role-definition-actions.js` | ✅ | Server actions: `fetchRoleDefinitions`, `updateRoleDefinition`, `createRoleDefinition`, `deleteRoleDefinition`. `PERMISSION_KEYS` array moved to `role-permissions.js` (plain module) — required by Next.js 16's stricter "use server" file rule that only allows async function exports. |
| `create_public_channels` permission wired to real enforcement | ✅ | The channels INSERT RLS policy was previously hardcoded to `'super_admin'`. Now reads `permissions->>'create_public_channels'` from the role definitions table, so toggling this permission on/off in the console actually changes who can create a public channel, rather than the console being cosmetic on top of a still-hardcoded rule. |
| Public Channels sidebar header — SA discoverability fix | ✅ | Previously non-clickable for everyone including super admins, making the create-public-channel page (`/member/admin`) undiscoverable. Now links to `/member/admin` for super admins only. `layout.js` was already fetching `admin_role`, so no extra DB round-trip. |
| Contact acceptance duplicate-row bug | ✅ Fixed | Confirmed via live testing across SA, RA, and TA accounts: accepting a contact request when a relationship row already existed (e.g., from a previous session) was failing with "Could not add this contact" due to a unique constraint violation on the two-direction batch insert. Fixed in `request-actions.js` with `ignoreDuplicates: true` (Supabase's `ON CONFLICT DO NOTHING` equivalent). Needs `request-actions.js` to be replaced. |

### Four permission keys defined (only first enforced today)

| Key | Enforced today? | Description |
|---|---|---|
| `create_public_channels` | ✅ Yes | Wired to the channels INSERT RLS policy |
| `pin_posts_in_any_channel` | 🔜 Not yet | Placeholder — defined for a future global-pin feature, doesn't gate anything today |
| `moderate_content` | 🔜 Not yet | Placeholder — moderation queue UI not yet built |
| `manage_private_channels` | 🔜 Not yet | Placeholder — no cross-channel management UI exists yet |

### What was found during live testing (SA / RA / TA accounts)

**SA account findings:**
- ✅ SA badge on posts, in toolbar, in settings — all confirmed
- ✅ Admin console accessible, role editing + save confirmed working
- ✅ Public Channels sidebar header now clickable/navigable
- ✅ 2 public channels created (Bitcoin and Gold, Semiconductors)
- 🐛 Contact acceptance duplicate-row bug — fixed (see above)
- 📋 Omega score stays 0 even with active posting/liking — scoring logic may not be implemented or not incrementing on activity

**RA account findings:**
- ✅ RA badge confirmed on posts and toolbar
- ✅ `/member/admin` correctly blocked — redirects to Settings
- ✅ No Pin button in public channels — correct (no channel-moderation permissions)
- ✅ Threading confirmed: parent post with 2 replies, correct badge on each
- ✅ Collaborator invites accepted — shared articles appear in Saved Drafts
- 🐛 Duplicate-contact bug confirmed again (pre-fix) — fixed
- 📋 Collaborator invite card shows no article title — user accepts blind

**TA account findings:**
- ✅ TA badge confirmed on posts and toolbar (blue)
- ✅ `/member/admin` correctly blocked
- ✅ Deny path tested and confirmed: first contact request denied cleanly, count decremented, no error
- ✅ Threading confirmed in "My trades" private channel: 2 replies, both with TA badge
- ✅ Participant list in private channel shows "Work Ambhuj (Admin)" vs regular member — correct
- ✅ 7 requests processed (most of any account) — all request types covered
- 📋 TA's own post: "I do not have the option to directly respond to a particular post or comment below directly" — genuine organic user feedback on missing nested-reply UX
- 📋 Role badges don't appear in the private channel participant list (only names shown)

---

## Role-Based Utilities — Prioritised Build Queue

*Consolidated from all three test sessions. Ordered by impact.*

### High priority (concrete permissions / visible UX gaps)

| Item | Notes |
|---|---|
| **Reply-to-a-reply (nested threading)** | The single most-requested missing feature, organically surfaced by the TA test user in their own post. Currently you can only reply to the top-level post, not to an individual reply. Most thread-based communities (Reddit, Discord) make this the primary engagement mechanism. |
| **Article title in collaborator invite card** | Request card just says "invited you to collaborate on an article" — no title. User accepts blind. One extra join on `pending_requests` to `articles` would fix this. Same gap in channel invites (no channel name shown). |
| **Role badges in private channel participant list** | Participant list shows names but not role badges. An SA seeing "Ambhuj sharma" with no badge has no contextual info about who that person is in the platform hierarchy. Low-effort since `RoleBadge.js` already exists. |
| **TA — flag/content review queue** | TA currently has zero distinct capabilities vs a regular member. Most natural fit: TA can see a review queue of flagged posts (`post_flags` table exists) before SA has to act. Gives the TA role actual meaning without granting dangerous permissions. |
| **RA — designated posting permissions** | RA currently identical to regular member in capability. Most natural fit: RA gets `can_post_to_research_channel` permission, letting them publish to a designated Research channel without SA approval, or gets a visual "Research" quality mark on their published articles. |
| **CA — community moderation** | Community Admin role defined but completely empty. Natural fit: CA can hide/remove posts from public channels that violate community guidelines, without the nuclear option of full SA access. Needs `moderate_content` permission to be enforced. |
| **Deny confirmation feedback** | When you deny a request, the card disappears with no confirmation toast or message. A brief "Request denied" feedback (even just a transient text state, not a full toast system) would make the action feel intentional rather than like a glitch. |

### Medium priority (UX improvements from testing)

| Item | Notes |
|---|---|
| ~~**Contacts page — distinguish identically-named contacts**~~ | ✅ Done — role badges added to contacts page, SA/CA/RA all distinguishable |
| ~~**Omega score — confirm scoring logic is active**~~ | ✅ Done — expanded to 5 pillars, triggers confirmed, TA shows Ω 22.11 (17.11 base + 5 CA boost) |
| ~~**Admin role badge in Settings page itself**~~ | ✅ Done — badge pill renders correctly for all roles |
| ~~**Messaging from contacts page**~~ | ✅ Done — tested live, DM thread opens correctly, compressed composer confirmed |
| **Shared drafts/articles — distinguish same-title entries** | Still open — two "Optics Finds Its Moment" entries in Saved Drafts still indistinguishable |

### Lower priority (deferred)

| Item | Notes |
|---|---|
| **`pin_posts_in_any_channel` enforcement** | Now partially wired — CA gets global pin rights via the `canPin` prop. Full cross-channel pinning pending a dedicated global-pin UI. |
| **`manage_private_channels` enforcement** | Defined, not enforced. No use case designed yet. |
| **Per-field profile privacy toggles** | All profile fields publicly readable for now. |
| **`filter_unknown_senders` enforcement** | Toggle saves but doesn't gate the DM inbox yet — "message requests" holding area not built. |
| **Ticker autocomplete** | `$AA...` → `$AAPL` in channels/articles — deferred since early sessions. |
| **Live-updating tab title** | `(3) InfinityVolume` when unread messages — not started. |
| **Redfin weekly home sales** | S3 path post-May-2026 overhaul not resolved. |
| **External article bookmarks** | No stable IDs for external content — deferred until ingestion pipeline exists. |
| **Post flag dismiss by TA** | TA dismiss action not completing — one SQL update policy needed on `post_flags` table. |

---

Every batch below follows the same shape: **(a)** ship the code changes to the local dev server, **(b)** run a Claude-in-Chrome testing pass against the updated local server as a real signed-in member — exercising the new functionality, checking role-based gating where relevant, and logging anything found — **(c)** fix anything the testing pass surfaces, retest, **then** move to the next batch. This isn't a one-time step; it repeats after every batch, the same way it did for the Channels foundation round (which is exactly what caught the word-count bug and confirmed the RLS fixes actually worked).

**Honest timeline note:** today is September 10 — that's roughly 10 days for what remains. Items 3 (Channels remaining layer) and 4 (Publish Wave 2, minus ticker autocomplete) are now fully done, plus three items not originally on this list as their own batches: the Requests system (channel/collaborator invites requiring acceptance), the sidebar user panel (avatar/status/public profile), and now Contacts and Inbox itself — one of the original four "new major concepts," done ahead of the other three since the Requests and profile-field groundwork made it a natural next step. Items 5–7 are individually more modest and achievable in the remaining window; the three remaining major concepts (Mastermind Registry, Event Calendar, Sentiment Polling) realistically may need to be prioritized down to one or two rather than all three, or pushed partially into a later phase. **Separately from this Phase 1 member-utilities list**, a parallel homepage market-data track has also been running (Treasury volume, corporate bond breadth, home sales, the combined homepage card — see the dedicated section above) — worth keeping in mind when weighing what to prioritize next, since it's real, ongoing scope alongside this numbered list, not fully captured by it.

1. ~~**Watchlist page batch**~~ ✅ Done (custom columns, historical/rolling columns, homepage-style sorting via the real shared SortableHeader component, CSV/JSON export). Name-resolution bug remains open, deferred per explicit request.
2. ~~**Channels — foundation + first layer**~~ ✅ Done (schema, permission model, browsing/creating/posting, invite/membership, sidebar redesign with sub-items for both public and private, cover images, participant list).
3. ~~**Channels — remaining layer**~~ ✅ Done (participant-list left-column layout + role-grouped-by-tier display, threaded replies + like + share, role-based UI audit — including a real security fix, pinned posts, hot sort, flag/report, sidebar pin-to-top + category collapse). This batch surfaced and fixed 4 genuine bugs along the way: a silent publish failure, an unsanitized-filename storage error, a PostgREST ambiguous-relationship error, and a real RLS gap letting anyone post into channels they didn't belong to.
4. ~~**Publish page Wave 2 remainder**~~ ✅ Done except ticker autocomplete (explicitly deferred) — collaborator UI (now requiring acceptance via the new Requests system), suggested market-update template, plus autosave/featured image/reading time/tags/disclosure redesign/delete/preview all already done from earlier. This batch surfaced and fixed a real ownership-transfer bug in `saveArticle`, plus a chain of RLS issues once the Requests system layered on top (self-acceptance blocked at the DB level, collaborators unable to even see a draft, and the resulting infinite recursion once that visibility was fixed).
5. ~~**Requests system**~~ ✅ Done (not originally scoped as its own item — added mid-build after testing revealed channel/collaborator invites took effect with no consent from the invited person). Settings renamed to "Settings / Requests", pending-request inbox with Accept/Deny/Wait, yellow "unattended" indicator on the nav.
6. ~~**Sidebar user panel**~~ ✅ Done (not originally scoped as its own item) — predefined avatar picker (8 options, upload-your-own deferred), manually-set status (Available/Away/DND/Invisible), and a full Public Profile editor (bio, display name, professional info, LinkedIn/X/GitHub/website). Also incidentally completed the earlier-pending "editable display name" Settings item, since the same modal handles it. Found and fixed 2 real bugs: all preset avatars rendering as solid black (a Tailwind utility-class issue), and the panel requiring scrolling to become visible (a sticky-positioning + header-height issue).
7. ~~**Contacts and Inbox**~~ ✅ Done — the first of the four "new major concepts" to be built, ahead of the others since the Requests system and new `profiles` fields (bio/socials/avatar/status) had already laid real groundwork for it. Revised mid-build, per explicit request, from "immediate add, no acceptance" to going through the same Requests accept/deny mechanism, with mutual contact status established the moment a request is accepted rather than needing a separate "add them back" step. Found and fixed 3 real bugs along the way: the messaging permission toggle switches being entirely invisible (invalid Tailwind spacing classes), the toggle thumb visibly overflowing outside the pill once that was fixed (a missing explicit base position), and accepting a contact request failing outright at the RLS layer (the same class of self-acceptance gap hit earlier with channel/collaborator invites).
8. ~~**Settings remainder**~~ ✅ Done — profile preview link (view your own public profile), admin role as badge pill, role definitions fetched live, `id` added to the profile query.
9. ~~**Bookmarks**~~ ✅ Done — polymorphic schema covering articles and discussion posts, `BookmarkButton` wired into channel posts and article lists, full `/member/bookmarks` page with two-section table layout. Confirmed live: add/remove both content types, channel name resolved, correct empty state.
10. ~~**Pinned articles on My Articles**~~ ✅ Done — `is_pinned` added to `articles` table, pin icon on own article rows (📌 floats to top), `InlinePinButton.js` component shared across articles and watchlists.
11. ~~**Email + password sign-up**~~ ✅ Done — full email/password auth flow built and tested end-to-end: sign-in page redesigned with Email/Google tabs, `/sign-up` page with password strength indicator and confirm-field mismatch validation, `/forgot-password` with account-enumeration protection, `/reset-password` handling Supabase `PASSWORD_RECOVERY` event client-side. All four server actions added to `auth-actions.js` (`signUpWithEmail`, `signInWithEmail`, `sendPasswordReset`, `updatePassword`). Confirmed live: test user `testuser2@infinityvolume.com` created in Supabase with Email provider. Supabase URL Configuration updated: Site URL → `https://infinityvolume.com`, Redirect URLs → `http://localhost:3000/**`, `https://infinityvolume.com/**`, `https://*.vercel.app/**`.
12. **2FA via mobile number** (just before distribution goes live — US max 2 accounts/number, international max 1; country selector auto-populates dialling code; uniqueness enforced via server action or DB trigger)
13. **Remaining new major concepts**: Event Calendar, Sentiment Polling (Mastermind Registry largely solved by Channels; Investor / Community Sentiment nav placeholder at `/member/sentiment` exists) — scope and build individually
14. **Remaining lower-priority items**: global/scoped search (search bar is cosmetic), `filter_unknown_senders` message requests inbox, live-updating tab title, per-field profile privacy checkbox, shared drafts disambiguation, post flag dismiss fix (one SQL policy)

---

## Session 10 — UI, Roles, Article Workflow, Channel Publishing (Sep 2026)

### UI / Navigation changes

| Item | Status | Notes |
|---|---|---|
| **Support & Feedback → "Tickets & Requests"** | ✅ | Renamed everywhere — sidebar (3 locations), page title, `<h1>`. Pinned at bottom of sidebar above user panel, outside scroll area. |
| **Ω symbol larger in "My Account" button** | ✅ | `AccountMenu.js` — Ω symbol at `text-sm`, score stays `text-xs`. `layout.js` now fetches `omega_score` + `member_tier` for all users. |
| **Omega score in top-right "My Account" button** | ✅ | Shows "My Account RA Ω 11.98" — only when score > 0. |
| **Yellow dot on "Article Review" sidebar link** | ✅ | `layout.js` fetches `pendingReviewCount` for RA/SA; `MemberLayoutWrapper` now passes it through to `MemberSidebar` (was silently dropped — root cause of all missing dots). |
| **Yellow dot on "My Articles" + "Saved Drafts"** | ✅ | `pendingChangesCount` fires on both nav items when author has `changes_requested` submissions. |
| **Support & Feedback icon at bottom of icon strip** | ✅ | Stays pinned with flex-1 spacer in collapsed sidebar too. |

### Article Submission & Review Workflow (full end-to-end)

| Item | Status | Notes |
|---|---|---|
| **Article publish flow for CA** | ✅ | Fixed `disclosed_holdings` + `own_critique` missing columns, RLS infinite recursion (42P17) via `SECURITY DEFINER` function on `is_article_collaborator`, `disclosed_holdings`/`own_critique` added to DB |
| **Public channel → RA review queue** | ✅ | Author submits → `article_channel_submissions` row `status=pending` → RA sees it in queue with "1 pending" badge |
| **Private channel → direct publish** | ✅ | `submitArticleToChannels` now splits: public channels → RA queue, private channels → direct insert into `article_channels` + `status=approved` submission row |
| **RA review queue yellow dot** | ✅ | Root cause: `MemberLayoutWrapper` was dropping `pendingReviewCount` prop. Fixed. RLS on `article_channel_submissions` SELECT also fixed to include both `submitted_by = auth.uid()` OR admin role check. |
| **Author sees "🕐 in review queue" banner** | ✅ | `ArticleEditor` shows yellow banner with "↩ Recall to drafts" button when `hasPendingSubmissions=true`. Editor locked (`opacity-50 pointer-events-none`) while in review. |
| **Author sees "↩ Changes requested" banner** | ✅ | Red banner with RA comments shown when `hasChangesRequested=true`. Each RA comment has a response textarea + "Send response" button. |
| **Author INSERT RLS on `article_review_comments`** | ✅ | Was missing — authors couldn't save responses. Added policy: `author_id = auth.uid() AND comment_type = 'author_response'`. |
| **Author resubmit UPDATE RLS** | ✅ | Added policy allowing authors to update `changes_requested → pending`. `submitArticleToChannels` now uses UPDATE (not DELETE+INSERT) to preserve submission ID and comment links. |
| **"Publish Again" button** | ✅ | Shows instead of "Publish" when `changesRequested=true`. Resets submission to `pending` and locks editor. |
| **RA approval publishes article** | ✅ | `reviewSubmission` now also sets `articles.status = 'published'` + `published_at = now()` on approval. Previously only updated submission row. |
| **`article_channels` INSERT RLS for RA/SA** | ✅ | Added policy — RA/SA can publish approved articles to channels. Was blocking approval silently. |
| **Author DELETE RLS on submissions** | ✅ | Authors can delete their own pending submissions (for recall). |
| **Recall to drafts** | ✅ | Deletes pending submissions, sets `articles.status = 'draft'`, `published_at = null`. |

### Article Read Page & Channel Display

| Item | Status | Notes |
|---|---|---|
| **Article read view** | ✅ | `publish/page.js` with `?view=1` renders clean read-only layout — no editor, no toolbar, no channel selector. Full-length body via `dangerouslySetInnerHTML`. |
| **Author/collaborator bio card** | ✅ | Below featured image: avatar, name, role badge, Ω score (text-sm), professional title, bio. |
| **← Back to channel** | ✅ | `?from=CHANNEL_ID` in URL makes back button return to channel instead of My Articles. |
| **Date fix** | ✅ | Uses `published_at \|\| updated_at \|\| created_at` as fallback — no more "Invalid Date". |
| **Like/Share/Comment bar** | ✅ | `ArticleLikeShare.js` client component at bottom of article — ♡ Like (toggles ♥), Share (copies URL), Comment. |
| **Articles in channel feed** | ✅ | `ChannelPosts.js` accepts `articles` prop, renders inline after sort tabs — cover image, "✓ RA Reviewed" badge, Ω score (14px), tags, date. |
| **Like + Share buttons on channel card** | ✅ | ♡ Like (client-side toggle) + Share (clipboard copy) in article card action bar. |
| **`post_likes` RLS fix** | ✅ | Was causing infinite recursion. Simplified to `auth.role() = 'authenticated'`. |
| **`article_channels` SELECT** | ✅ | Channel page queries and renders published articles. `ChannelArticlesList` → moved into `ChannelPosts` as `articles` prop. |
| **Article status → My Articles** | ✅ | DB fix: `reviewSubmission` now publishes article on approval. Manual SQL fix for current article. |

### Open / Needs Testing

| Item | Status | Notes |
|---|---|---|
| **Full article workflow re-test** | ⏳ | CA publish → RA review → approve → appears in My Articles + channel feed. Deferred for next session. |
| **Private channel auto-publish** | ⏳ | "Everything Bitcoin and crypto" — needs CA to reselect and publish. |
| **Author response → RA sees it** | ⏳ | `author_response` comment INSERT policy added. Needs live test with RA seeing responses in review queue. |
| **Article title disambiguation** | ⏳ | Two "Optics Finds Its Moment" in Saved Drafts still indistinguishable. |

---

## Next Recommended Build Batch

### Priority 1 — Complete the article workflow (test + fix)
Full live test of: CA publish → channel select → RA review queue notification → RA approve → article appears in CA's My Articles → article visible in Semiconductors channel → CA clicks card → read view with bio card → Like/Share/Comment working. Fix anything that surfaces.

### Priority 2 — Article comments on the read page
Currently the Comment button on the article read page scrolls but there's no actual comment box. Need to build: comment thread for articles (separate from `discussion_posts`) or link to the channel's discussion if the article is posted there. `article_review_comments` with `author_response` type shows for the RA — a parallel `article_comments` table for reader comments makes sense.

### Priority 3 — 2FA via mobile
Before public distribution. US: max 2 accounts/number, international: max 1. Country selector auto-populates dialling code. Uniqueness enforced at DB level via trigger or server action.

### Priority 4 — Global search
Search bar is currently cosmetic. Needs: ticker/article/post/member search scoped to visible content (respecting channel RLS). Supabase full-text search on `articles.title + tags`, `discussion_posts.body`, `profiles.display_name`.

### Priority 5 — Sentiment Polling (`/member/sentiment`)
Nav placeholder exists. Scope: members can create polls on market questions (e.g. "Where does NVDA close Q4?"), vote, see live aggregated results. Ties into Omega score (voters who are right get points).

### Priority 6 — Event Calendar
Scope: members can post market events (earnings, FOMC, economic releases), follow events for notifications, filter by ticker/type. Calendar view by week/month.

---

## Session 12 — Article Channel Pages, Comments, Likes, Human Intel, Homepage Discussion (Sep 2026)

### Channel Article Sub-Pages
| Item | Status | Notes |
|---|---|---|
| **Dedicated channel article URL** | ✅ | `/member/channels/[channelId]/articles/[articleId]/page.js` — clean read-only page per channel. No editor, no toolbar. |
| **Breadcrumb navigation** | ✅ | `Channels / 🌐 Public / Semiconductors / Article Title` — each segment linked. Private shows 🔒. |
| **Back to channel** | ✅ | Breadcrumb returns to correct channel, not My Articles. |
| **Author/Collaborator bio card** | ✅ | Avatar, name, role badge (RA/SA/TA/CA), Ω score, professional title, bio. |
| **Featured image full-width** | ✅ | 256px tall, rounded, full width. |
| **Full article body** | ✅ | `dangerouslySetInnerHTML` — no scroll box, no editor. Flows naturally. |
| **Own Critique / Risks** | ✅ | Shown at bottom if not "TBD". |
| **Login prompt for unauthenticated users** | ✅ | `DiscussionBox` checks session — shows "Sign in to read →" for logged-out visitors. |

### Article Likes & Comments (DB-backed)
| Item | Status | Notes |
|---|---|---|
| **`article_likes` table** | ✅ | `article_id`, `channel_id`, `user_id` — unique constraint, no RLS issues. |
| **`article_comments` table** | ✅ | `article_id`, `channel_id`, `user_id→profiles`, `content`. RLS: auth can read, users insert own. |
| **`ArticleLikeShare.js`** | ✅ | DB-backed — fetches like count + user's own like on mount. Toggle via insert/delete. |
| **`ArticleComments.js`** | ✅ | Full comment thread — avatar, name, role badge, Ω, timestamp, textarea + Post comment. |
| **Like/comment counts on channel cards** | ✅ | Channel page fetches counts per article from `article_likes` + `article_comments`. Shows ♡ N and 💬 N on cards. |
| **Comment button scrolls to box** | ✅ | `data-comment-box` anchor on `ArticleComments` wrapper. |
| **schema cache reloads** | ✅ | Both `article_likes` and `article_comments` required `notify pgrst, 'reload schema'` after creation. |

### Sidebar / Navigation Updates
| Item | Status | Notes |
|---|---|---|
| **"Saved Drafts" → "Drafts & Bookmarks"** | ✅ | Sidebar label updated, page title updated. |
| **"Bookmarks" → "Human Intel"** | ✅ | Route changed to `/member/human-intel`, sidebar label updated. |
| **SA gets "Article Review" sidebar link** | ✅ | `MemberSidebar.js` — condition changed from `research` only to `research OR super_admin`. |
| **Article Review badge dot for SA** | ✅ | SA sees yellow dot when articles are pending review. |

### Drafts & Bookmarks Page (merged)
| Item | Status | Notes |
|---|---|---|
| **Three-section page** | ✅ | Your Drafts / Shared With You / Bookmarks — all in one page at `/member/drafts`. |
| **Bookmarks section** | ✅ | Fetches `bookmarks` table — shows article bookmarks (with channel badge) and post bookmarks (with channel name). `BookmarkButton` in each row for quick removal. |
| **Private channel badges** | ✅ | 🔒 shown on private channel items, 🌐 on public. |

### Human Intel & Reason Page (`/member/human-intel`)
| Item | Status | Notes |
|---|---|---|
| **`human_intel_requests` table** | ✅ | `user_id`, `question`, `category`, `status` (pending/in_progress/answered), `response`, `answered_by`, `answered_at`. RLS: users see own, RA/SA see all and can update. |
| **Phase 1 explanation** | ✅ | Human-powered research, not AI. Callout banner with ⚗️ explaining Phase 1 scope. |
| **Submission form** | ✅ | Category dropdown (7 categories) + question textarea (min 20 chars) + submit. `HumanIntelForm.js` client component. |
| **1 active request limit** | ✅ | If active request exists (pending/in_progress), shows it with status pill — form hidden. |
| **Past answered requests** | ✅ | Shows full Q&A thread for answered requests below the form. |
| **Status pills** | ✅ | ⏳ Pending review (yellow), 🔬 In progress (blue), ✓ Answered (green). |
| **Workflow Phase 2 (PENDING)** | ⏳ | RA/SA queue UI to view all requests, respond, mark in_progress/answered. DB table exists. |
| **CA-facing UX (PENDING)** | ⏳ | Notification when response arrives. Response view redesign. Ability to follow up. |

### Homepage Discussion Box
| Item | Status | Notes |
|---|---|---|
| **`homepage_articles` table** | ✅ | `article_id` (unique), `added_by`, `added_at`. RLS disabled — app-layer SA check in API route. |
| **`/api/homepage-save` route** | ✅ | Server-side SA-verified write. Calls `revalidatePath("/")` so homepage updates immediately. No manual refresh needed. |
| **SA homepage pin UI** | ✅ | `HomepageReviewList.js` — draft state with "Add to Homepage" / "Remove" per row. "Save Changes" fixed-top-right button persists to DB via API route. |
| **RA cannot pin** | ✅ | Homepage column only renders when `isSA = true`. RA sees only approve/request changes. |
| **Slot counter** | ✅ | "Discussion Homepage · X/10 SLOTS USED" shown in review page banner. |
| **`DiscussionBox.js`** | ✅ | Server component — fetches `homepage_articles`, joins articles, computes read time + reactions (1 like = 1, 1 comment = 2). Links to PUBLIC channel article page (not private). |
| **Public channel link fix** | ✅ | `DiscussionBox` now does `find(ac => ac.channels?.visibility === "public")` to prefer public over private channel links. |
| **Unauthenticated login prompt** | ✅ | `DiscussionBox` checks session — logged-out visitors see "Members-only content / Sign in to read →". |

---

## Pending / Next Build Batch

### 🔴 Priority 1 — Human Intel Full Workflow
**Phase 2: Research team (RA/SA) queue and response UI**

The `human_intel_requests` table exists. What's missing:

| Item | Status | Notes |
|---|---|---|
| **RA/SA request queue page** | ⏳ | New page or section on Settings/Admin showing all pending/in_progress requests across all users. Sortable by date/category/status. |
| **RA/SA inline response UI** | ⏳ | Click a request → expandable panel with question, textarea for response, "Mark In Progress" + "Submit Answer" buttons. On submit: sets `status='answered'`, `response=text`, `answered_by=user.id`, `answered_at=now()`. |
| **Member notification on answer** | ⏳ | Yellow dot on "Human Intel" sidebar link when `status='answered'` and member hasn't viewed it. Needs a `viewed_at` column or separate read-receipts approach. |
| **CA/member follow-up** | ⏳ | After answer is received, member can ask a follow-up (creates new request, referencing original). Or a threaded reply model. |
| **Phase 3 ML layer** | 🔮 | Future — ML algorithm surfaces previous research answers as suggestions when similar questions are submitted. Repository of Q&A pairs. Not in scope yet. |

**DB changes needed:**
```sql
-- Add viewed_at for notification dot
alter table public.human_intel_requests add column if not exists viewed_at timestamptz;
-- Index for RA/SA queue
create index if not exists idx_human_intel_status on public.human_intel_requests(status, created_at);
```

### 🟡 Priority 2 — Article Workflow Remaining
| Item | Status | Notes |
|---|---|---|
| **Everything Optics auto-publish** | ⏳ | Private channel INSERT keeps failing silently for articles — `submitArticleToChannels` private path needs RLS fix or service role. |
| **`saveArticle` user_id mismatch** | ⏳ | Article status stays draft because UPDATE RLS fails when `user_id` doesn't match session (cross-session issue). Permanent fix: always set `published_at` on first channel submission approval. |
| **Author response visible in RA queue** | ⏳ | `author_response` comments exist in DB but aren't shown in `ReviewQueueItem`. Need to render under RA's original comment. |

### 🟡 Priority 3 — 2FA via Mobile
Before public distribution. US: max 2 accounts/number, international: max 1. Country selector with dialling code. DB trigger for uniqueness.

### 🟡 Priority 4 — Global Search
Search bar is cosmetic. Supabase full-text search on `articles.title + tags`, `discussion_posts.body`, `profiles.display_name`. Scoped to visible content (RLS-respecting).

### 🟢 Priority 5 — Sentiment Polling
Nav placeholder at `/member/sentiment` exists. Members create market polls, vote, see live results. Omega score integration for correct predictions.

### 🟢 Priority 6 — Event Calendar
Members post market events (earnings, FOMC, economic releases), follow events, filter by ticker/type. Week/month calendar view.

---

## Session 14 Updates — Search, Email Notifications, Deployment Fixes (Sep 15 2026)

### Search Features Built
| Item | Status | Notes |
|---|---|---|
| **Market data search** | ✅ | Already built. `_search_index.json` regenerated — 188 items: 171 stocks (15 markets), 9 ETFs, 5 treasuries, 3 indicators. All have landing pages. |
| **Private Channel Search** | ✅ | `PrivateChannelSearch.js` on `/member/channels/private` page. Searches article title + **body** + tags + discussion posts across ALL user's private channels. Debounced 350ms. |
| **Public Channel Search** | ✅ | `PublicChannelSearch.js` in Human Intel right panel. Searches published articles (title + body + tags) + posts in public channels. Replaced "coming soon" placeholder. |
| **Chat/DM Search** | ✅ | `ChatSearch.js` on `/member/contacts` page. Searches across all direct messages (sent + received) with direction indicator (You → / → You). |
| **Body content search fix** | ✅ | All article searches initially only searched `title`. Updated to also search `body` (HTML — `ilike` finds text within tags) so searching "nvidia" finds articles mentioning it in body. |

### Human Intel — Full Workflow Built
| Item | Status | Notes |
|---|---|---|
| **`human_intel_requests` table** | ✅ | Created fresh: `id`, `user_id`, `question`, `context`, `category`, `status`, `response`, `answered_by`, `answered_at`, `accepted_by`, `accepted_at`, `follow_up_question`, `denial_reason`, `viewed_at`. |
| **Statuses** | ✅ | `pending` → `accepted` → `in_progress` / `follow_up_requested` / `answered` / `denied` |
| **Partial unique index** | ✅ | `one_active_request_per_user ON human_intel_requests(user_id) WHERE status NOT IN ('answered','denied')` — DB-level enforcement of 1 active request per member. |
| **HumanIntelForm.js** | ✅ | Submission form with category, question (min 20 chars), context field. Pre-checks DB before INSERT. Shows ⚠️ blocked state with "Recall & replace" if active request exists. Recall disabled if accepted/in_progress. |
| **Member page** | ✅ | Two-column layout. Left: active request card + answered Q&A archive. Right: public channel search + request history panel. |
| **Yellow dot on sidebar** | ✅ | Fires on Human Intel link when `status IN ('answered','follow_up_requested','denied') AND viewed_at IS NULL`. Clears when member visits the page. |
| **CA/RA/SA queue** | ✅ | `ResearchQueue.js` on Community Admin page (CA) and Article Review page (RA/SA). 3 actions per request: ✋ Accept & claim / ↩ Follow-up / ✕ Deny. Claimed requests locked to claimer. |
| **RLS policies** | ✅ | Users see own; CA/RA/SA see all + can update; users can insert own. |

### Email Notification System — Built & Delivered
| Item | Status | Notes |
|---|---|---|
| **`resend` + `@react-email/components`** | ✅ | Added to `package.json`. Domain `infinityvolume.com` verified on Resend. |
| **`lib/email/send.js`** | ✅ | Central `sendEmail()` wrapper + `getUserEmail()` via service role. Never throws — fire-and-forget. |
| **`lib/email/trigger.js`** | ✅ | Client-side `triggerEmail(type, payload)` — calls `/api/email-trigger` fire-and-forget. |
| **Base template** | ✅ | Dark brand base: brass `#C9A84C`, dark bg, card layout, Button/Heading/Body/InfoBox/Divider components. |
| **Role change templates** | ✅ | `RoleAssignedEmail`, `RoleChangedEmail`, `RoleRemovedEmail`, `TierUpgradeEmail` |
| **Human Intel templates** | ✅ | `HumanIntelAnsweredEmail`, `HumanIntelFollowUpEmail`, `HumanIntelDeniedEmail` |
| **Article templates** | ✅ | `ArticleApprovedEmail`, `ArticleChangesRequestedEmail`, `ArticleRejectedEmail`, `PrivateChannelInviteEmail` |
| **Digest template** | ✅ | `AuthorDigestEmail` — 48h engagement digest with per-article breakdown. |
| **`/api/email-trigger` route** | ✅ | Unified handler for all 11 email types. Auth-gated (401 if not logged in). Uses service role for cross-user email lookup. |
| **`/api/digest` cron route** | ✅ | 48h batch digest — fetches engagement since last 48h, groups by author, sends only if 1+ comment or 3+ likes. |
| **Vercel cron** | ✅ | `vercel.json`: `"0 18 */2 * *"` — 6pm UTC every other day. Protected by `CRON_SECRET`. |
| **Wired triggers** | ✅ | `ResearchQueue.js` → human intel emails. `ReviewQueueItem.js` → article review emails. `RoleAssignmentRow.js` → role change emails. `channel-actions.js` → channel invite email. |
| **Live test** | ✅ | Email delivered to `hardy.ramanujan1729.1@gmail.com` — "Our research team needs more information — InfinityVolume". Resend dashboard confirmed **Delivered**. |
| **Env vars required** | ✅ | `RESEND_API_KEY` (Resend), `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` — all set in Vercel. |

### Deployment Fixes
| Item | Status | Notes |
|---|---|---|
| **Merge conflict fix** | ✅ | Commit `7bee6d6` merged manual push with auto-update market data, corrupted JSON. Fixed with `git revert 7bee6d6 -m 1 --no-edit`. |
| **Missing packages** | ✅ | `resend` and `@react-email/components` not in `package.json`. Fixed with `npm install ... --save`. |
| **SSH push setup** | ✅ | Switched from HTTPS (403 / Keychain conflicts) to SSH. `git remote set-url origin git@github.com:...` |
| **`homepage_articles` RLS** | ✅ | Re-enabled RLS via Supabase Table Editor UI. SELECT policy: anyone can read. Writes via service role only. |
| **`SUPABASE_SERVICE_ROLE_KEY`** | ✅ | Added to Vercel env vars (Secret). Required for `getUserEmail()` in email trigger route. |

---

## Current Pending — Next Build Items (Priority Order)

### 🔴 Critical Pre-Launch
| # | Item | Notes |
|---|---|---|
| 1 | **2FA via Mobile** | Required before public launch. US: max 2 accounts/number, international: max 1. Country selector + dialling code. DB trigger for uniqueness. |
| 2 | **HTML sanitization on article save** | `dangerouslySetInnerHTML` without `sanitize-html` is XSS risk. Add server-side sanitization on save. |
| 3 | **Email verification enforcement** | Members can sign up with unverified email. Enable in Supabase Auth settings. |

### 🟡 High Priority — Growth Features
| # | Item | Notes |
|---|---|---|
| 4 | **Sentiment Polling** | Nav placeholder at `/member/sentiment` exists. Members create polls, vote, see live results. Omega score integration for correct predictions. Self-contained build. |
| 5 | **Company Landing Pages (Phase 3 layout)** | Build layout now (`/markets/US/[ticker]` already exists). Placeholders for: price chart, key stats, financials tabs, about section. Wire Intrinio data once contracted. |
| 6 | **Author response in RA review queue** | `author_response` comments not shown in `ReviewQueueItem`. Render under RA's original comment. |

### 🟢 Medium Priority
| # | Item | Notes |
|---|---|---|
| 7 | **Event Calendar** | Members post/follow market events — earnings, FOMC, economic releases. Week/month view, filter by ticker. |
| 8 | **GDPR data export / account deletion** | Required for EU members. Supabase has built-in deletion triggers. |
| 9 | **Cookie consent banner** | Required for EU/GDPR if tracking any analytics. |
| 10 | **48h digest — test + launch** | Template built, cron configured. Test on a real 48h cycle before enabling. |
| 11 | **`saveArticle` user_id permanent fix** | Permanent RLS fix: RA/SA UPDATE policy added but needs testing across all approval paths. |

---

## Session 15 — 2FA via Mobile, Twilio Setup, Dev Tooling (Sep 15 2026)

### 2FA Phone Verification — Fully Built & Tested

**DB changes:**
| Column | Table | Notes |
|---|---|---|
| `phone` | `profiles` | E.164 normalized format e.g. +14155551234 |
| `phone_verified` | `profiles` | boolean, default false |
| `phone_exception` | `profiles` | SA override — bypasses 2-account limit |
| `requires_phone_verify` | `profiles` | boolean, default true. Legacy 5 accounts set to false. New accounts inherit true. |
| `phone_otp` | new table | id, phone, otp_hash, expires_at, attempts, sends_this_hour, hour_window, created_at |

**Limits enforced:**
- 2 verified accounts per phone number (US and international)
- SA can set `phone_exception = true` to allow a 3rd account
- Max 3 OTP sends per phone per hour
- Max 5 OTP verification attempts per code
- OTP expires in 10 minutes
- 6-digit code, SHA-256 hashed with `OTP_SECRET` before storage

**New files:**
| File | Purpose |
|---|---|
| `web/app/api/phone-otp/send/route.js` | Generates OTP, rate-limits, sends via Twilio |
| `web/app/api/phone-otp/verify/route.js` | Verifies OTP hash, marks phone_verified = true |
| `web/components/PhoneVerification.js` | Full UI — country selector (20 countries), phone input, OTP entry, resend cooldown, branded messaging |
| `web/app/verify-phone/page.js` | Server page — redirects verified/legacy users, shows PhoneVerification for new accounts |
| `web/lib/supabase/middleware.js` | Updated — intercepts /member/* for new accounts, redirects to /verify-phone |

**Middleware logic:**
- `requires_phone_verify !== false` AND `phone_verified !== true` → redirect to /verify-phone
- Legacy accounts have `requires_phone_verify = false` explicitly → bypass wall
- New signups get `requires_phone_verify = null/true` by default → hit wall

**Twilio setup:**
- Account created, upgraded to paid, phone number purchased
- A2P 10DLC compliance profile completed
- Messaging service created and linked
- A2P Brand registration submitted (under review — 1-2 weeks)
- During review: SMS works but may have trial disclaimer prepended

**Env vars required:**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
OTP_SECRET=random_32_char_string
```

**Dev-only routes (DELETE before production):**
- `web/app/api/dev-confirm-user/route.js` — confirms test user email via service role
- `web/app/api/setup-legacy-accounts/route.js` — sets requires_phone_verify=false on all existing profiles

**Test results:**
| Test | Result |
|---|---|
| New account (`testuser2fa`) → `/member` | ✅ Redirected to `/verify-phone` |
| Phone verification page renders | ✅ Branded message, country selector, OTP input |
| Legacy account (TA) → `/member` | ✅ No wall, goes straight through |
| `/api/phone-otp/send` rate limit check | ✅ Returns 401 unauthed, 400 invalid format |
| `/api/phone-otp/verify` available | ✅ Returns 401 unauthed |

**Pending (blocked by A2P review):**
- Live SMS delivery test — Twilio A2P brand under review (1-2 weeks)
- Once approved: sign up with a real phone number and complete full OTP flow

---

## Updated Priority Order

### 🔴 Critical Pre-Launch
| # | Item | Notes |
|---|---|---|
| 1 | **Delete dev routes before prod push** | `dev-confirm-user` and `setup-legacy-accounts` must be removed |
| 2 | **Test live SMS once A2P approved** | Enter real number on verify-phone, receive OTP, verify |
| 3 | **HTML sanitization on article save** | `dangerouslySetInnerHTML` XSS risk — add `sanitize-html` |
| 4 | **Email verification enforcement** | Enable in Supabase Auth settings |

### 🟡 High Priority
| # | Item | Notes |
|---|---|---|
| 5 | **Sentiment Polling** | Nav placeholder at `/member/sentiment` ready |
| 6 | **Company Landing Pages (Phase 3 layout)** | Build layout now, wire Intrinio data later |
| 7 | **Author response in RA queue** | Small — render author_response comments in ReviewQueueItem |

### 🟢 Medium Priority
| # | Item | Notes |
|---|---|---|
| 8 | **Event Calendar** | Members post/follow earnings, FOMC, releases |
| 9 | **48h digest — test + launch** | Template and cron built, needs live test cycle |
| 10 | **GDPR data export / account deletion** | Required for EU members |
| 11 | **Cookie consent banner** | Required for EU/GDPR |
