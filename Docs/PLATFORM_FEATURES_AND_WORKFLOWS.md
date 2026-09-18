# InfinityVolume — Platform Features, Roles & Workflow Guide

*For QA Testers, New Users & Product Team | Last updated September 2026*

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [User Roles & Tiers](#2-user-roles--tiers)
3. [Navigation & Sidebar](#3-navigation--sidebar)
4. [Feature Reference](#4-feature-reference)
5. [Workflows — Step by Step](#5-workflows--step-by-step)
6. [QA Test Matrix](#6-qa-test-matrix)

---

## 1. Platform Overview

InfinityVolume is a members-only financial intelligence platform combining:
- **Live market data** (15+ global markets, ETFs, fixed income, currencies, commodities)
- **Community channels** (public and private discussion + article publishing)
- **Human-powered research** (analyst-reviewed articles, Human Intel Q&A)
- **Portfolio tools** (watchlists, omega scoring)

**Tech stack:** Next.js 16 · Supabase (Postgres + Auth + Storage) · Vercel  
**URL:** www.infinityvolume.com  
**Auth:** Email/password via Supabase Auth. Sessions stored in `HttpOnly` cookies.

---

## 2. User Roles & Tiers

### 2a. Member Tiers (earned/assigned, shown as Ω tier)

| Tier | Label | Description |
|---|---|---|
| `member` | Member | Default for all new sign-ups |
| `captain` | Captain | Elevated member, higher engagement |
| `quarterback` | Quarterback | Senior member tier |
| `senior_research_analyst` | Senior Research Analyst | Top-tier research contributor |

Tiers are set manually by admin. Displayed in the "My Account" button in the top navbar (e.g. "My Account CA Ω 2.2").

**OG Member (★):** Special designation for founding members. Shown with a gold star on their profile.

### 2b. Admin Roles (staff/operational, not earned)

| Role Key | Label | Abbreviation | What they can do |
|---|---|---|---|
| `community` | Community Admin | CA | Moderate discussion posts, flag content, manage channel members |
| `research` | Research Analyst | RA | Review article submissions, approve/reject for public channels, request changes, see full article review queue |
| `technical` | Technical Admin | TA | Technical platform management |
| `super_admin` | Super Admin | SA | Everything RA can do + manage homepage Discussion Box, create/manage channels, access all admin panels |

**Important:** Admin roles and member tiers are independent. A member can be both `captain` tier and have `research` admin role.

### 2c. Role Permissions Matrix

| Feature | Unauthenticated | Member | CA | RA | SA |
|---|---|---|---|---|---|
| View public market data | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Discussion Box on homepage | Login prompt | ✅ | ✅ | ✅ | ✅ |
| Join public channels | ❌ | ✅ | ✅ | ✅ | ✅ |
| Join private channels | ❌ | By invite | By invite | By invite | ✅ |
| Post in channels | ❌ | ✅ | ✅ | ✅ | ✅ |
| Publish articles | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approve public channel articles | ❌ | ❌ | ❌ | ✅ | ✅ |
| Request article changes | ❌ | ❌ | ❌ | ✅ | ✅ |
| Pin articles to homepage | ❌ | ❌ | ❌ | ❌ | ✅ |
| Create channels | ❌ | ❌ | ❌ | ❌ | ✅ |
| Moderate posts (hide/pin) | ❌ | ❌ | ✅ | ❌ | ✅ |
| View flagged content | ❌ | ❌ | ✅ | ❌ | ✅ |
| Direct messages | ❌ | ✅ | ✅ | ✅ | ✅ |
| Human Intel submission | ❌ | ✅ | ✅ | ✅ | ✅ |
| Human Intel queue (respond) | ❌ | ❌ | ❌ | ✅ | ✅ |

### 2d. The Omega Score (Ω)

A numerical reputation score shown next to every user's name throughout the platform. Higher = more trusted/experienced member. Displayed as e.g. "Ω 11.98". Computed based on engagement, contribution quality, and tenure. Shown in:
- Top navbar "My Account" button
- Channel post author lines
- Article author bio cards
- Comment threads
- Article cards in channel feeds

---

## 3. Navigation & Sidebar

The sidebar has two sections: **Core utilities** (always visible) and **Social/community** (channels, contacts).

### Sidebar Items

| Item | Route | Who sees it | Purpose |
|---|---|---|---|
| Publish | `/member/publish` | All members | Write and publish articles |
| My Articles | `/member/articles` | All members | View published articles + submission status |
| Drafts & Bookmarks | `/member/drafts` | All members | Saved drafts, shared drafts, bookmarked content |
| Report Generator | `/member/reports` | All members | Generate formatted market reports |
| Human Intel | `/member/human-intel` | All members | Submit research questions to human analysts |
| Investor Sentiment | `/member/sentiment` | All members | Market sentiment polling (coming soon) |
| Settings / Requests | `/member/settings` | All members | Profile, messaging settings, pending invites |
| Support Queue | `/member/support` | All members | Submit support tickets |
| Flagged Content | `/member/admin/flags` | CA, SA | Review member-flagged posts |
| Community Admin | `/member/admin/community` | CA, SA | Channel moderation tools |
| Article Review | `/member/admin/review` | RA, SA | Approve/reject article submissions + manage homepage |
| Public Channels | Listed in sidebar | All members | Browse and join public channels |
| Private Channels | Listed in sidebar | Invited members | Access private channels you belong to |
| Contacts / Chats | Listed in sidebar | All members | Direct messaging, contact list |
| Tickets & Requests | `/member/support` | All members | Pinned at bottom — support tickets |

### Yellow Dot Notifications

Yellow dots appear on sidebar items when action is required:

| Dot location | Meaning |
|---|---|
| My Articles | One or more articles have "changes requested" by RA |
| Drafts & Bookmarks | One or more drafts have "changes requested" |
| Settings / Requests | Pending channel invite or article collaboration invite |
| Article Review | New article submissions pending RA/SA review |

---

## 4. Feature Reference

### 4a. Market Dashboard (Homepage `/`)

**What it is:** The main page showing live market data across 15+ markets.

**Components:**
- **Ticker tape** — scrolling live prices across top of page
- **Discussion Box** (left column) — SA-curated public channel articles (up to 10). Login prompt for unauthenticated visitors.
- **Market dashboard** (center) — Price/volume tables for selected market (US, EU, Asia, etc.)
- **Treasury/ETF/Market Activity** tables — fixed income yields, top ETFs, market activity
- **Right column** — Top stories, news flash, broad financial conditions
- **Market selector** — Switch between US, UK, EU, Asian markets via tab navigation

**Access:** Fully public for market data. Discussion Box requires login.

---

### 4b. Channels

**What they are:** Topic-focused discussion spaces for community posts and published articles.

**Types:**
- **Public channels** — visible to all authenticated members. Articles require RA review before appearing.
- **Private channels** — invite-only. Members must be explicitly added. Articles auto-publish immediately (no RA review).

**Within a channel:**
- Post composer (text, image attachment, file attachment)
- Articles section — shows published articles with cover image, RA Reviewed badge, Ω score, like/comment counts
- Discussion feed — posts sorted by Newest or Hot, with Like / Share / Pin / Flag / Reply
- Participant list (private channels only)
- Cover image (SA can upload)

**Article cards in feed show:**
- Cover image thumbnail (left)
- Title, author, ✓ RA Reviewed or 🕐 RA Review Pending badge
- Ω score, tags, date
- Share | ♡ Like count | 💬 Comment count | Read article →

---

### 4c. Article Publishing

**What it is:** A rich-text editor for writing long-form research articles, with a review-and-publish workflow for public channels.

**Article fields:**
- Title (max 100 chars)
- Featured image (uploaded to Supabase Storage)
- Body (rich text — bold, italic, headings, lists, links, images, tables)
- Topic tags (free-form, press Enter to add)
- Disclosed holdings (free-text — conflicts of interest)
- Own critique / risks (author's own balanced view)
- Collaborators (invite by username/email — they can edit)
- Channel selection (public or private)

**Article statuses:**
- `draft` — saved, not submitted
- In review (pending) — submitted to public channel, awaiting RA approval
- `changes_requested` — RA sent feedback, author must revise
- `published` — approved and live in channel

---

### 4d. Publish Page (`/member/publish`)

**Read/Write modes:**
- **Write mode** — full editor with all fields, autosave every 30s
- **Read mode** (`?view=1`) — clean read-only article view, no editor controls. Accessible from channel article cards.
- **Locked mode** — editor visible but greyed out (opacity-50) when article is in RA review queue

**Editor states & banners:**
- No banner = draft, freely editable
- 🕐 Yellow banner "Currently in RA review queue" + Recall to drafts button = pending review
- ↩ Red banner "Changes requested by review team" = RA sent feedback, edit box appears per comment
- Published state = shows channel submission status pills (✓ Approved · Semiconductors)

---

### 4e. My Articles (`/member/articles`)

**Sections:**
1. **Your Articles (N)** — articles you authored that are published. Shows: title, author (You), collaborators, tags, word count, date. Status pills show channel submission states.
2. **Shared with you (N)** — published articles where you are a collaborator.

**Status pills on each row:**
- 🕐 In review · [Channel Name] (yellow)
- ↩ Changes requested · [Channel Name] (orange/red)
- ✓ Approved · [Channel Name] (green)

**Note:** Articles appear in "My Articles" if `status = 'published'` OR if they have pending/changes_requested submissions (even if still technically `draft`).

---

### 4f. Drafts & Bookmarks (`/member/drafts`)

**Three sections:**

1. **Your drafts** — articles with `status = 'draft'` that you own. Shared with collaborators also appears.
2. **Shared with you** — draft articles where you are a collaborator.
3. **Bookmarks** — articles and discussion posts you've bookmarked using the bookmark (🔖) button. Shows: content title, author, channel badge (🌐/🔒), saved date. BookmarkButton for quick removal.

---

### 4g. Channel Article Read Page (`/member/channels/[channelId]/articles/[articleId]`)

**What users see:**
- Breadcrumb: `Channels / 🌐 Public / [Channel Name] / [Article Title]`
- Featured image (full width)
- Title, date, tags
- **Author & Collaborators card** — avatar, display name, role badge, Ω score, professional title, bio. Disclosed holdings if set.
- Full article body (no scroll box)
- Own critique / risks section
- Like / Share / Comment action bar
- **Comments section** — thread of member comments with role badges, Ω scores, timestamps. Write a comment textarea + Post comment button.

**Navigation:** Breadcrumb links back to the channel. "Edit ✎" link only visible to the article author.

---

### 4h. Article Review Queue (`/member/admin/review`)

**Access:** RA and SA only.

**What RA/SA see:**
- **Pending Review (N)** section — articles awaiting first review
- **Recently Reviewed (N)** section — previously actioned articles
- **Discussion Homepage banner** (SA only) — shows X/10 slots used

**For each pending article:**
- Collapsed header: status badge, channel badge(s), title, author, time ago, comment count
- Click to expand: full article body (scrollable preview)
- Comment box: type (Suggestion / Issue / Blocker / Praise), optional quote, comment text → "Add comment"
- Action buttons: **Approve & publish to channel** | **Request changes** | **Reject**

**For each reviewed article (SA only right side column):**
- **Add to Homepage** button (if approved + public channel + slot available)
- **📌 On Homepage + Remove** (if currently pinned)

**SA Save Changes button:** Appears (fixed top-right + bottom of list) when SA has toggled homepage articles. Click to persist to DB and immediately update homepage Discussion Box — no page refresh needed.

---

### 4i. Discussion Box (Homepage Left Column)

**What it is:** A curated list of up to 10 public channel articles chosen by SA, shown on the homepage left column to all logged-in users.

**What users see:**
- "Discussion" header
- Article titles (linked to their channel article page)
- Read time (e.g. "5 min") and reaction count (likes + comments×2)
- Unauthenticated visitors see a "Members-only content / Sign in to read →" prompt

**Managed by:** SA via Article Review page → Homepage column

---

### 4j. Direct Messages / Contacts

**Contacts:** Members can add other members as contacts. Mutual contact status unlocks direct messaging.

**Messaging settings (in Settings page):**
- Allow messages from my contacts (toggle)
- Allow messages from anyone (toggle, off by default)
- Filter messages from people I may not know (toggle)

**Inbox (`/member/inbox`):** Shows received messages, contact requests, pending approvals.

---

### 4k. Watchlists (`/member/watchlists`)

Members can create named watchlists and add tickers. Viewable on the watchlists page.

---

### 4l. Report Generator (`/member/reports`)

Generates formatted market reports based on current data. Output can be downloaded or shared.

---

### 4m. Human Intel & Reason (`/member/human-intel`)

**What it is:** A service where members submit research questions to be answered by InfinityVolume's human research team — not AI.

**Phase 1 (current):**
- Member submits one question (category + detailed question, min 20 chars)
- **One active request limit** — cannot submit a new question until the current one is answered
- Status tracking: ⏳ Pending review → 🔬 In progress → ✓ Answered
- Answered questions archived below the form as a permanent Q&A record

**Categories:** General Research / Company or Stock / Sector or Industry / Macro or Economy / Commodity or Resource / Policy or Regulation / Technology or Innovation

**Phase 2 (planned):** RA/SA queue to manage, respond to, and mark requests as answered.

---

### 4n. Settings / Requests (`/member/settings`)

**What members can manage:**
- View member tier, Omega score, admin role badge
- View public profile link
- Messaging permissions (contacts only / anyone / filter unknown)
- Pending requests: channel invites, article collaboration invites — Accept or Decline each

---

## 5. Workflows — Step by Step

---

### Workflow 1: New Member Sign-Up

```
1. User visits www.infinityvolume.com
2. Clicks "Sign up" → enters email + password
3. [PLANNED] Email verification link sent → user clicks link
4. Redirected to member homepage (/)
5. Default tier: 'member', no admin role
6. Can immediately access all public channels and features
```

**QA checkpoints:**
- Duplicate email rejected
- Password minimum enforced
- Session persists across page refresh
- Sidebar shows correct items for new member (no Article Review, no Community Admin)

---

### Workflow 2: Public Channel Article Submission

```
AUTHOR (any member):
1. Navigate to Publish (/member/publish)
2. Write article: fill title, body, tags, disclosed holdings, own critique
3. [Optional] Upload featured image
4. [Optional] Add collaborators by username
5. Select public channel(s) in the right panel under "Public (0/2)"
6. Click "Publish & Submit to N channel(s)"
7. Article saved as published, submission created with status = 'pending'
8. Editor locks (opacity-50), yellow banner appears: "Currently in RA review queue"
9. Recall option available if author changes mind

RA/SA REVIEWER:
10. Yellow dot appears on Article Review in sidebar
11. Navigate to /member/admin/review
12. Article appears in "Pending Review" section
13. Click to expand → read full body, add comments if needed
14. Option A — Approve: click "Approve & publish to channel"
    → submission status = 'approved'
    → article_channels row inserted (article appears in channel)
    → article.status = 'published'
    → author yellow dot appears on My Articles
15. Option B — Request changes: add comment first, then click "Request changes"
    → submission status = 'changes_requested'
    → author sees red banner "Changes requested"
16. Option C — Reject: click "Reject"
    → submission status = 'rejected'

AUTHOR (after changes requested):
17. Author opens article in Publish editor
18. Reads RA comment in red banner
19. Makes edits to article content
20. Types response in the comment reply box → "Send response"
21. Clicks "Publish Again"
    → submission status reset to 'pending'
    → editor locks again
    → RA sees updated article with author response

RA (second review):
22. Reviews updated article + author response
23. Approves → article goes live in public channel
```

**QA checkpoints:**
- Editor locks while in review
- RA cannot see private channel articles in review queue
- Recall to drafts removes the submission
- Author response visible to RA on second review
- Article appears in channel feed after approval
- Status pills on My Articles reflect correct state at each step

---

### Workflow 3: Private Channel Article Submission

```
AUTHOR:
1. Navigate to Publish (/member/publish)
2. Write article
3. Select private channel(s) in the right panel under "Private (0/5)"
   — Only channels the author is a member of appear here
4. Click "Publish & Submit to N channel(s)"
5. Article immediately inserted into article_channels (no RA queue)
6. Article appears in private channel feed instantly
7. No editor lock — article is live

Note: Private channel articles show "Private" badge (grey) in channel feed,
not "✓ RA Reviewed". No submission row is created for private channels.
```

**QA checkpoints:**
- Private channel article does NOT appear in RA review queue
- Article appears in private channel feed immediately
- Non-members of the private channel cannot see the article
- Badge on article card shows "Private" not "RA Reviewed"

---

### Workflow 4: SA Pins Article to Homepage Discussion Box

```
SA:
1. Navigate to /member/admin/review (requires super_admin role)
2. Scroll to "Recently Reviewed" section
3. Find approved public channel article
4. Click "Add to Homepage" button in the right column
   → Article shows "📌 On Homepage" + "Remove"
   → "Save Changes" button appears (fixed top-right + bottom)
5. Toggle other articles as needed (max 10 slots)
6. Click "Save Changes"
   → API call to /api/homepage-save
   → DB writes to homepage_articles table
   → revalidatePath("/") called — homepage updates immediately
7. Navigate to homepage (/) — article appears in Discussion Box
   with title, read time, reaction count, linked to public channel article page
```

**QA checkpoints:**
- Only SA sees the "Add to Homepage" column (RA does not)
- Save Changes button disappears after successful save
- Article appears in Discussion Box without page refresh
- Slot counter updates: "X/10 SLOTS USED"
- At 10 slots, "Add to Homepage" shows "Full (10/10)" and is disabled
- Remove works: article removed from DB and disappears from homepage
- Unauthenticated visitor sees login prompt instead of article list

---

### Workflow 5: Creating a Private Channel

```
SA:
1. Navigate to /member/admin (or click "Public Channels" header — SA only)
2. Create new channel — set name, description, visibility = private
3. Channel appears in SA's Private Channels sidebar section
4. Navigate to the channel
5. Use "Invite Member" form to add members by email/username
   → Pending request created for invited member

INVITED MEMBER:
6. Yellow dot appears on Settings / Requests in sidebar
7. Navigate to /member/settings
8. See pending channel invite under "Pending Requests"
9. Click "Accept" → becomes member, channel appears in their sidebar
10. Click "Decline" → request dismissed
```

**QA checkpoints:**
- Private channel invisible to non-members in sidebar
- Non-member cannot access channel URL directly (404 or redirect)
- Invitee sees yellow dot on Settings
- Accepted invite immediately adds channel to sidebar without page refresh

---

### Workflow 6: Discussion Post in a Channel

```
MEMBER:
1. Navigate to any channel they're a member of
2. Click in the "Post something to this channel..." composer
3. Type message (text)
4. [Optional] Attach image (📷 button)
5. [Optional] Attach file (📎 button)
6. Click "Post"
7. Post appears in feed immediately under "Newest"

OTHER MEMBERS:
8. See post in feed
9. Actions available: ♡ Like | Share | 🔖 Bookmark | Flag | Reply
10. Click "Reply" → reply composer opens below post
11. Type reply → click "Reply" button
12. Reply appears nested under original post
13. Post shows "N replies" count

CHANNEL ADMIN / SA (moderation):
14. Sees "Pin" and "Flag" options on posts
15. Pin: post moves to top of feed with 📌 indicator
16. Flag for review: sends to /member/admin/flags queue
17. Hide post: post shows "[Hidden by community admin]" to all members
```

**QA checkpoints:**
- Hot sort re-orders posts by engagement score
- Newest sort shows chronological order
- Pinned posts appear before non-pinned
- Replies are nested correctly
- Like count updates without full page refresh
- Bookmark saved to user's bookmarks (appears in Drafts & Bookmarks)
- Flagged posts appear in Community Admin flags queue

---

### Workflow 7: Adding a Contact & Direct Messaging

```
MEMBER A (initiating contact):
1. Navigate to another member's profile or find them in contacts
2. Click "Add contact" button
3. Pending request sent to Member B

MEMBER B (receiving request):
4. Yellow dot on Settings / Requests in sidebar
5. Navigate to /member/settings → see contact request
6. Click "Accept" → mutual contact established
7. OR click "Decline" → request dismissed

MEMBER A (sending DM after contact accepted):
8. Navigate to Contacts / Chats in sidebar
9. Find Member B in contacts list
10. Click to open conversation
11. Type message → send
12. Message appears in conversation

MEMBER B (receiving DM):
13. Notification in inbox (/member/inbox)
14. Opens message → can reply
```

**Messaging permissions:**
- Default: only contacts can message you
- Settings: toggle "Allow messages from anyone" to receive from all members
- Settings: toggle "Filter unknown senders" to separate non-contacts into a request inbox

**QA checkpoints:**
- Non-contacts cannot DM by default
- Contact request visible to recipient in Settings
- Decline removes the request entirely
- Messages only visible to sender and recipient (RLS protected)
- Messaging toggles take effect immediately

---

### Workflow 8: Human Intel Request

```
MEMBER (submitting a question):
1. Navigate to Human Intel (/member/human-intel)
2. If no active request: see submission form
3. Select category from dropdown
4. Write question (minimum 20 characters)
5. Click "Submit to Research Team"
6. Request created with status = 'pending'
7. Form replaced by "Your active request" card showing question + ⏳ Pending status
8. Cannot submit another question until this one is answered

RESEARCH TEAM (Phase 2 — planned):
9. RA/SA sees request in their admin queue
10. Clicks "Mark In Progress" → status = 'in_progress', member sees 🔬 badge
11. Researches the question (1–5 business days)
12. Types response, clicks "Submit Answer"
13. status = 'answered', response stored, answered_by + answered_at set

MEMBER (receiving answer):
14. [Planned] Yellow dot on Human Intel sidebar link
15. Navigates to Human Intel page
16. Sees "✓ Answered" pill + full response from analyst
17. Archived in "Answered Questions" section below
18. Form reappears — member can submit a new question
```

**QA checkpoints:**
- Second submit blocked while active request exists (form hidden)
- Minimum 20 chars enforced client-side
- Category saves correctly
- Status transitions: pending → in_progress → answered
- Answered questions persist in archive (not deleted)

---

### Workflow 9: Watchlist Management

```
MEMBER:
1. Navigate to Watchlists (/member/watchlists)
2. Click "Create watchlist" → enter name
3. Add tickers to watchlist (search by symbol)
4. Watchlist saved and visible in watchlists page
5. Can create multiple watchlists
6. Can remove tickers or delete entire watchlist
```

---

### Workflow 10: Bookmarking Content

```
MEMBER (bookmarking a post):
1. In any channel, click 🔖 (bookmark icon) on a discussion post
2. Post saved to bookmarks

MEMBER (bookmarking an article):
1. On any article card, click 🔖
2. Article saved to bookmarks

VIEWING BOOKMARKS:
3. Navigate to Drafts & Bookmarks (/member/drafts)
4. Scroll to "Bookmarks (N)" section
5. See article bookmarks (with channel badge and author)
   and post bookmarks (with channel name and content preview)
6. Click 🔖 again on any row to remove the bookmark
```

**QA checkpoints:**
- Bookmark persists across sessions
- Both article and post types appear correctly
- Removing bookmark updates count immediately
- Channel badge shows 🌐 public or 🔒 private correctly

---

### Workflow 11: Article Commenting (on Channel Article Page)

```
MEMBER:
1. Opens article in channel: /member/channels/[id]/articles/[id]
2. Scrolls to bottom of article
3. Sees "COMMENTS · N" section
4. Types in "Write a comment…" textarea
5. Clicks "Post comment" or uses Cmd+Enter
6. Comment appears immediately above textarea
7. Comment shows: avatar, display name, role badge, Ω score, timestamp

OTHER MEMBERS:
8. Open same article in same channel
9. See all comments in chronological order
10. Can post their own comments

Note: Comments are channel-scoped — same article in two different channels
has separate comment threads.
```

**QA checkpoints:**
- Comment appears without page refresh
- Avatar shows first letter if no profile image
- Role badge (RA/SA/TA/CA) shown correctly
- Comment count on channel card updates after comment posted
- unauthenticated user cannot access article page (redirected to sign-in)

---

### Workflow 12: Article Liking

```
IN CHANNEL FEED:
1. Member sees article card with "♡ Like" button
2. Clicks ♡ → toggles to "♥ Liked"
3. This is client-side only on the card (optimistic UI)

ON ARTICLE PAGE:
1. Member opens article at /member/channels/[id]/articles/[id]
2. Sees "♡ Like" with current count in action bar
3. Clicks → becomes "♥ N" (count increments)
4. Page refresh → still shows liked state (DB-backed)
5. Click again to unlike → count decrements
```

---

## 6. QA Test Matrix

### Authentication Tests

| Test ID | Test | Expected | Notes |
|---|---|---|---|
| AUTH-01 | Sign up with valid email/password | Account created, redirected to homepage | |
| AUTH-02 | Sign up with existing email | Error: email already registered | |
| AUTH-03 | Sign in with correct credentials | Session established, sidebar shows member options | |
| AUTH-04 | Sign in with wrong password | Error shown, no session | |
| AUTH-05 | Access /member/* without session | Redirect to /sign-in | |
| AUTH-06 | Access /member/admin/review as plain member | Redirect to /member/settings | |
| AUTH-07 | Session persists after browser refresh | Still logged in | |
| AUTH-08 | Sign out | Session cleared, redirect to homepage | |

### Channel Tests

| Test ID | Test | Expected |
|---|---|---|
| CHAN-01 | Member opens public channel | Channel loads, posts visible |
| CHAN-02 | Non-member tries to access private channel URL | 404 or redirect |
| CHAN-03 | Member posts in channel | Post appears in feed immediately |
| CHAN-04 | Member replies to post | Reply nested under parent, count increments |
| CHAN-05 | Member likes a post | ♥ shown, count updates |
| CHAN-06 | Member bookmarks a post | Bookmark saved, appears in Drafts & Bookmarks |
| CHAN-07 | CA hides a post | Post shows "[Hidden by community admin]" |
| CHAN-08 | CA pins a post | Post moves to top of feed |
| CHAN-09 | Channel article card shows correct badge | ✓ RA Reviewed for approved, 🕐 pending for pending |
| CHAN-10 | Click "Read article →" on card | Opens /member/channels/[id]/articles/[id] |
| CHAN-11 | Comment count on card | Matches actual comment count in DB |

### Article Workflow Tests

| Test ID | Test | Expected |
|---|---|---|
| ART-01 | Publish article with public channel selected | Editor locks, yellow banner appears |
| ART-02 | RA approves article | Article appears in channel feed |
| ART-03 | RA requests changes | Red banner on author's editor |
| ART-04 | Author responds and clicks Publish Again | RA sees updated article with response |
| ART-05 | Author recalls article | Submission deleted, editor unlocked |
| ART-06 | Publish article to private channel | Article appears immediately, no RA queue |
| ART-07 | Private channel article in RA queue | Should NOT appear |
| ART-08 | Article appears in My Articles after approval | Visible in Your Articles section |
| ART-09 | Article with `changes_requested` appears in My Articles | Visible even though status is 'draft' |
| ART-10 | Read view has no editor controls | No toolbar, no publish button |
| ART-11 | Read view shows author bio card | Avatar, name, role badge, Ω, title, bio visible |
| ART-12 | Back to channel breadcrumb works | Returns to correct channel |

### Human Intel Tests

| Test ID | Test | Expected |
|---|---|---|
| HI-01 | Submit question under 20 chars | Submit blocked, error shown |
| HI-02 | Submit valid question | Request created, form replaced by active request card |
| HI-03 | Try to submit second question while one is active | Form not shown, only active request visible |
| HI-04 | Category saves correctly | Shown on active request card |

### SA Homepage Tests

| Test ID | Test | Expected |
|---|---|---|
| HP-01 | RA visits Article Review | No homepage column visible |
| HP-02 | SA visits Article Review | Homepage column with Add to Homepage buttons |
| HP-03 | SA adds article to homepage | 📌 On Homepage shown, Save Changes button appears |
| HP-04 | SA removes article | Add to Homepage shown, Save Changes appears |
| HP-05 | SA clicks Save Changes | Button shows "Saving…" then disappears, homepage updated |
| HP-06 | Homepage slot counter | Shows "X/10 SLOTS USED" correctly |
| HP-07 | 10 articles pinned | Add to Homepage shows "Full (10/10)", disabled |
| HP-08 | Logged-out user visits homepage | Login prompt in Discussion Box |
| HP-09 | Logged-in user visits homepage | Article list with links to public channel articles |
| HP-10 | Click article in Discussion Box | Opens /member/channels/[publicChannelId]/articles/[id] |

### Role Permission Tests

| Test ID | Test | Expected |
|---|---|---|
| ROLE-01 | RA visits /member/admin/review | Access granted |
| ROLE-02 | Member visits /member/admin/review | Redirect to settings |
| ROLE-03 | SA sees all admin sidebar items | Article Review, Community Admin, Flagged Content visible |
| ROLE-04 | CA does not see Article Review | Sidebar item not present |
| ROLE-05 | RA does not see Add to Homepage | Column not rendered in review page |
| ROLE-06 | SA creates a channel | Channel creation UI accessible |
| ROLE-07 | Regular member cannot create channel | Channel creation not accessible |

---

*End of document. For questions contact the InfinityVolume development team.*

---

## Session 15–16 Updates (Sep 15–16, 2026)

### 2FA Phone Verification — Built & Tested
| Feature | Status | Notes |
|---|---|---|
| Phone number collection on sign-up | ✅ | Country selector (20 countries), E.164 format, 2 accounts max per number |
| OTP send via Twilio | ✅ | 6-digit code, 10-min expiry, SHA-256 hashed with OTP_SECRET |
| OTP verify | ✅ | 5 max attempts, 3 sends/hour rate limit |
| `/verify-phone` wall | ✅ | Middleware redirects new accounts to verification before /member/* |
| Legacy account bypass | ✅ | `requires_phone_verify = false` on 5 existing accounts |
| Twilio A2P registration | 🟡 Pending | Brand under review (~1-2 weeks). SMS works in test mode |

**Middleware logic:** `requires_phone_verify !== false` AND `phone_verified !== true` → redirect to `/verify-phone`. Legacy accounts explicitly set to `false` bypass entirely.

**Brand message on verification screen:**
> "InfinityVolume is a members-only research community built on the quality of its members — not their quantity. Every insight, article, and discussion here comes from a verified human investor, not a bot, algorithm, or fake profile. We ask for your mobile number once, at sign-up, to ensure every account on this platform is operated by a real person."

---

### Email Notification System — Live & Tested
| Email Type | Trigger | Recipient | Status |
|---|---|---|---|
| Role assigned | SA assigns any role | Member receiving role | ✅ Live |
| Role changed | SA changes role | Affected member | ✅ Live |
| Role removed | SA removes role | Affected member | ✅ Live |
| Tier upgrade | SA upgrades member tier | Member | ✅ Live |
| Human Intel answered | CA/RA/SA submits response | Question submitter | ✅ Live — confirmed delivered |
| Human Intel follow-up | CA/RA sends follow-up question | Question submitter | ✅ Live |
| Human Intel denied | CA/RA denies request | Question submitter | ✅ Live |
| Article approved | RA approves submission | Article author | ✅ Live |
| Article changes requested | RA requests changes | Article author | ✅ Live |
| Article rejected | RA rejects submission | Article author | ✅ Live |
| Private channel invite | SA adds member to private channel | Invited member | ✅ Live |
| 48h author digest | Vercel cron `0 18 */2 * *` | Authors with engagement | ✅ Built, not yet live-cycle-tested |

**Stack:** Resend + React Email. Domain `infinityvolume.com` verified on Resend. All emails fire-and-forget — never block the primary action.

---

### Content Search — Built & Tested
| Search | Location | Searches |
|---|---|---|
| Market data search | Top nav (global) | 188 items: 171 stocks, 9 ETFs, 5 treasuries, 3 indicators. All have landing pages |
| Private channel search | `/member/channels/private` | Article title + body + tags + discussion posts across all user's private channels |
| Public channel search | Human Intel page (right panel) | Published articles (title + body + tags) + posts across all public channels |
| Chat/DM search | `/member/contacts` | All direct messages sent and received, with direction indicator |

All article searches run on `title ilike`, `body ilike`, and `tags contains` — body search finds mentions even when not in title.

---

### Corporate Bond Breadth → IG/HY OAS Credit Spreads
**Previous:** FINRA corporate bond Advances/Declines (requires $1,650/mo Firm credential — unavailable on Public tier)

**Replaced with:** ICE BofA OAS credit spreads via FRED (free)

| Metric | FRED Series | Description |
|---|---|---|
| IG Spread | BAMLC0A4CBBB | Investment Grade OAS — spread between IG corporate bonds and equivalent Treasuries |
| HY Spread | BAMLH0A0HYM2 | High Yield OAS — spread between HY (junk) bonds and equivalent Treasuries |

**Display:** Colored tile (red ↑ when widening = bad, green ↓ when tightening = good) + 1D and 1W change in basis points. Hover tooltip shows full definition and FRED series ID.

**Data:** `_broad_financial_conditions.json` now includes `ig_spread` and `high_yield_spread` with `change_1d_abs` and `change_1w_abs` fields. `page.js` passes these to `MarketActivityTable`.

---

### DNS & Infrastructure
| Event | Resolution |
|---|---|
| Site down (DNS broken) | Porkbun DNS records for `@` A record and `www` CNAME were deleted when adding SPF/DKIM email records. Restored: A @ 216.198.79.1 and CNAME www → 7e384ddf20ee99ca.vercel-dns-017.com |
| Merge conflict crash | Commit `7bee6d6` corrupted market data JSON. Fixed with `git revert 7bee6d6 -m 1 --no-edit` |
| SSH push setup | Switched from HTTPS (Keychain conflicts) to SSH. `git remote set-url origin git@github.com:...` |
| FX pipeline transient failure | Frankfurter API returned HTTP 522 (Cloudflare timeout). Resolved by re-running pipeline. Long-term fix: add retry logic |

---

### QA Additions — Human Intel Extended Tests
| Test ID | Test | Expected |
|---|---|---|
| HI-05 | CA/RA/SA accepts a request | Badge → Accepted, only Respond button shown, claimed by that user |
| HI-06 | Different CA tries to act on claimed request | Dimmed (50% opacity), no action buttons |
| HI-07 | CA/RA submits a response | Queue goes to Active (n-1), member receives email |
| HI-08 | CA/RA sends follow-up | Status → follow_up_requested, member sees follow-up on their page |
| HI-09 | CA/RA denies request | Status → denied, member sees denial reason, can resubmit |
| HI-10 | Member tries to submit second request while one is active | Blocked UI with option to recall pending requests |
| HI-11 | Member tries to submit while request is accepted/in_progress | Recall button disabled, must wait |
| HI-12 | Yellow dot appears on Human Intel sidebar | Fires when status is answered/follow_up_requested/denied AND viewed_at IS NULL |
| HI-13 | Yellow dot clears after visiting Human Intel page | viewed_at set on page load, dot disappears |

### QA Additions — 2FA Tests
| Test ID | Test | Expected |
|---|---|---|
| 2FA-01 | New account navigates to /member | Redirected to /verify-phone |
| 2FA-02 | Legacy account navigates to /member | No wall, goes straight through |
| 2FA-03 | Enter phone number without country code | Error: include country code |
| 2FA-04 | Phone already linked to 2 accounts | Error: maximum accounts reached |
| 2FA-05 | Enter wrong OTP | Error with remaining attempts count |
| 2FA-06 | OTP expires after 10 minutes | Error: expired, request new code |
| 2FA-07 | 5 wrong OTP attempts | Code invalidated, must request new |
| 2FA-08 | Request OTP 4 times in one hour | Rate limited after 3 |
| 2FA-09 | After verification, navigate to /member | No wall, access granted |
| 2FA-10 | Resend code button | Disabled for 60s cooldown, then re-enables |

### QA Additions — Email Tests
| Test ID | Test | Expected |
|---|---|---|
| EMAIL-01 | CA denies Human Intel request | Member receives denial email at registered address |
| EMAIL-02 | CA responds to Human Intel request | Member receives "Research response ready" email with preview |
| EMAIL-03 | RA approves article | Author receives approval email with channel name |
| EMAIL-04 | SA assigns admin role | Member receives role assigned email |
| EMAIL-05 | Email to unverified Resend domain | Send fails — domain must be verified |
