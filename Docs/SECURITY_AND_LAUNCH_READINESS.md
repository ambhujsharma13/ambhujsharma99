# InfinityVolume — Security, Vulnerabilities & Pre-Launch Checklist

*Last updated: September 16, 2026 | Status: Pre-production, active development*

---

## 1. RLS Status — Full Audit

All tables in `public` schema:

| Table | RLS | Status |
|---|---|---|
| `admin_role_definitions` | ✅ ON | Low risk — read-only reference data |
| `article_channel_submissions` | ✅ ON | High — review workflow state |
| `article_channels` | ✅ ON | High — controls what's published where |
| `article_collaborators` | ✅ ON | Medium — article access control |
| `article_comments` | ✅ ON | Medium — user content |
| `article_email_shares` | ✅ ON | Low |
| `article_reactions` | ✅ ON | Low |
| `article_review_comments` | ✅ ON | High — RA review confidentiality |
| `articles` | ✅ ON | Critical — RA/SA can now publish via UPDATE policy |
| `bookmarks` | ✅ ON | Medium — private user data |
| `channel_members` | ✅ ON | High — private channel membership |
| `channels` | ✅ ON | High — channel visibility |
| `contacts` | ✅ ON | Medium — user connections |
| `discussion_posts` | ✅ ON | Medium — channel content |
| `homepage_articles` | ✅ **FIXED** | SELECT open to all, writes via service role only |
| `human_intel_requests` | ✅ ON | High — private research questions |
| `messages` | ✅ ON | Critical — private DMs |
| `notifications` | ✅ ON | Medium — private user data |
| `phone_otp` | ✅ ON | Critical — OTP hashes |
| `post_likes` | ✅ ON | Low |
| `profiles` | ✅ ON | High — added `phone`, `phone_verified`, `requires_phone_verify` columns |
| `support_ticket_votes` | ✅ ON | Low |
| `support_tickets` | ✅ ON | Medium |
| `watchlist_items` | ✅ ON | Medium — private portfolio data |
| `watchlists` | ✅ ON | Medium — private portfolio data |
| `article_likes` | ✅ ON | Low |

**All tables now have RLS enabled. `homepage_articles` was the last outstanding issue — now fixed.**

---

## 2. `homepage_articles` — Fixed

**Previous status:** RLS disabled, any person with the anon key could write directly.

**Current status:** ✅ Fixed
- RLS re-enabled
- SELECT policy: `using (true)` — anyone can read (required for public homepage)
- No INSERT/UPDATE/DELETE policies for anon/authenticated roles
- All writes go through `/api/homepage-save/route.js` which uses the Supabase service role key

**`SUPABASE_SERVICE_ROLE_KEY`** is now configured in both `.env.local` and Vercel (Secret type, never `NEXT_PUBLIC_`).

---

## 3. Authentication — Current Status

| Item | Status | Notes |
|---|---|---|
| Email/password auth | ✅ | Via Supabase Auth |
| Google OAuth | ✅ | SA, RA, CA, TA accounts use this |
| Session cookies | ✅ | HttpOnly + Secure via `@supabase/ssr` |
| Email verification | ❌ Pending | Members can access platform with unverified email. Enable in Supabase Auth settings |
| 2FA via SMS | ✅ **Built** | Twilio OTP, 6-digit, 10-min expiry. New accounts required. Legacy 5 accounts bypassed. A2P pending approval |
| Rate limiting on auth | ✅ | Supabase built-in. Verify enabled in Auth settings |
| CAPTCHA on sign-up | ❌ Pending | Add before public launch |

---

## 4. 2FA Phone Verification — Security Details

### DB columns added to `profiles`
- `phone` TEXT — E.164 format (+1XXXXXXXXXX)
- `phone_verified` BOOLEAN DEFAULT false
- `phone_exception` BOOLEAN DEFAULT false — SA override for 3rd account on same number
- `requires_phone_verify` BOOLEAN DEFAULT true — `false` for legacy accounts

### `phone_otp` table
- OTPs stored as SHA-256 hash with `OTP_SECRET` — never plaintext
- 6-digit codes, 10-minute expiry
- Max 5 verification attempts per OTP (then invalidated)
- Max 3 OTP sends per phone per hour
- Cleaned up immediately on successful verify

### Account limits
- Max 2 verified accounts per phone number (US and international)
- SA can set `phone_exception = true` to allow a 3rd account
- Enforced at both application and DB level (partial unique index)

### Env vars required
```
TWILIO_ACCOUNT_SID=ACxxxxxxxx        # Secret in Vercel
TWILIO_AUTH_TOKEN=xxxxxxxx           # Secret in Vercel
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx     # Secret in Vercel
OTP_SECRET=random_32_char_string     # Secret in Vercel
```

---

## 5. Email System — Security Details

### Resend configuration
- Domain `infinityvolume.com` verified on Resend
- Sending from `noreply@infinityvolume.com`
- `RESEND_API_KEY` stored as Secret in Vercel
- All emails fire-and-forget — failures logged but never block primary action

### Cron digest endpoint
- `CRON_SECRET` required in Authorization header
- `/api/digest` returns 401 if secret missing or wrong
- Vercel sends the secret automatically in cron calls

### User email lookup
- Uses `SUPABASE_SERVICE_ROLE_KEY` to call `auth.admin.getUserById()` — never exposed to browser
- Falls back gracefully if service role key missing (skips email, logs warning)

---

## 6. Content Security

### 6a. `dangerouslySetInnerHTML`
**Status:** ❌ Not yet sanitized server-side

Article bodies render raw HTML. Tiptap sanitizes at write time but server-side sanitization is not yet in place.

**Pre-launch fix:**
```bash
npm install sanitize-html
```
```js
import sanitizeHtml from 'sanitize-html';
const cleanBody = sanitizeHtml(body, {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h2', 'h3']),
  allowedAttributes: { '*': ['href', 'src', 'alt', 'class'] }
});
```

### 6b. Content moderation
Articles: human RA review before public channel publication ✅
Discussion posts: CA/SA flag queue exists. Ensure moderation workflow is staffed before launch.

### 6c. File uploads
Featured images uploaded to Supabase Storage. Validate MIME type and size server-side before launch.

---

## 7. API Route Security

| Route | Auth | Notes |
|---|---|---|
| `/api/phone-otp/send` | ✅ `auth.getUser()` | Rate limited, phone limit checked |
| `/api/phone-otp/verify` | ✅ `auth.getUser()` | Attempt counting, expiry check |
| `/api/email-trigger` | ✅ `auth.getUser()` | Returns 401 unauthenticated |
| `/api/digest` | ✅ `CRON_SECRET` header | GET-only cron endpoint |
| `/api/homepage-save` | ✅ SA role check + service role | selectedIds validated ≤ 10 |
| `/api/dev-confirm-user` | ⚠️ DEV ONLY | Must delete before production push |
| `/api/setup-legacy-accounts` | ⚠️ DEV ONLY | Must delete before production push |

**⚠️ Critical: Delete dev routes before any public traffic:**
```bash
rm -rf web/app/api/dev-confirm-user
rm -rf web/app/api/setup-legacy-accounts
git add -A && git commit -m "remove dev-only routes" && git push
```

---

## 8. Data Privacy

| Data | Protection | Status |
|---|---|---|
| Phone numbers | `phone_verified` gated, stored E.164, OTPs hashed | ✅ |
| Human Intel questions | RLS: users see own, CA/RA/SA see all | ✅ |
| Private channel content | RLS: channel_members only | ✅ |
| Direct messages | RLS: sender/recipient only | ✅ |
| User PII (profiles) | RLS: authenticated users | ✅ Acceptable for community platform |
| Article bodies | RLS on articles table | ✅ Published articles readable, drafts gated |

---

## 9. Infrastructure

| Item | Status | Notes |
|---|---|---|
| DNS (Porkbun) | ✅ | A @ 216.198.79.1, CNAME www → 7e384ddf20ee99ca.vercel-dns-017.com. SPF + DKIM for email |
| Vercel deployment | ✅ | Auto-deploys on push to main |
| Environment variables | ✅ | All secrets in Vercel as Secret type, none `NEXT_PUBLIC_` except intentional |
| Supabase backups | ⚠️ | Free tier = 1 day. Upgrade to paid for 7-day retention |
| Dev/prod isolation | ❌ | Single Supabase project used for both. Create separate dev project before launch |
| Error monitoring | ❌ | No Sentry or equivalent. Add before launch |
| SSH push | ✅ | Switched from HTTPS (Keychain conflicts) to SSH key auth |

---

## 10. Pre-Launch Checklist

### 🔴 Critical — Must fix before any public traffic
- [ ] **Delete dev routes** — `dev-confirm-user` and `setup-legacy-accounts`
- [ ] **HTML sanitization** — add `sanitize-html` on article body save
- [ ] **Email verification** — enable "Confirm email" in Supabase Auth settings
- [ ] **Validate featured image MIME type** — restrict to `image/*` in Supabase Storage
- [ ] **Test live SMS end-to-end** — pending Twilio A2P brand approval (~1-2 weeks)
- [ ] **Audit private channel RLS** — test non-member access via API

### 🟡 High — Fix within first week of launch
- [ ] FX pipeline retry logic (Frankfurter 522 transient failures)
- [ ] Request size validation on all API routes
- [ ] CAPTCHA on sign-up form
- [ ] Create separate Supabase dev project
- [ ] Configure Vercel attack protection
- [ ] Supabase Storage MIME type whitelist

### 🟢 Medium — First month
- [ ] Per-field privacy controls on profiles
- [ ] Audit messages RLS — consider E2E encryption
- [ ] Privacy Policy and Terms of Service pages (partially done)
- [ ] Cookie consent banner (EU/GDPR)
- [ ] GDPR data export / account deletion
- [ ] Set up error monitoring (Sentry)
- [ ] Upgrade Supabase to paid plan for 7-day backups
- [ ] Penetration test or external security review

---

*Document maintained by the InfinityVolume development team. Review before each major release.*
