# InfinityVolume — Runbook

**Check this file first when something breaks.** Every entry below has been hit at least once in real development, most of them more than once. The root causes are non-obvious and the symptoms are misleading.

Last updated: 17 September 2026

---

## 1. Failure modes and fixes

### Database / Supabase

| Symptom | Cause | Fix |
|---|---|---|
| `42P17 infinite recursion detected in policy for relation "x"` | Two RLS policies reference each other's tables in a loop. Postgres aborts | Wrap the lookup in a `SECURITY DEFINER STABLE` function. Existing ones: `is_article_collaborator`, `is_channel_member`, `is_channel_admin`, `is_ra_or_sa`. Then rewrite the policy to call the function instead of embedding the subquery |
| `Could not find the table 'public.x' in the schema cache` | PostgREST's schema cache is stale after a DDL change | `notify pgrst, 'reload schema';` in a **clean** SQL tab. If that fails, drop and recreate the table |
| SQL editor says "Success. No rows returned" but nothing actually changed | **The Supabase SQL editor appends new statements to whatever is already in the tab.** Your new statement runs after the old ones, or the old ones error and stop execution before yours runs | Always click **+ New query** for a genuinely blank tab before running any DDL. This single issue masked results and wasted hours repeatedly |
| Insert or update silently fails, no error shown | RLS blocking, or `.update().eq()` matched 0 rows (which returns no error in PostgREST) | Never destructure only `data`. Always capture and log `error` explicitly. If the error object stringifies to `{}`, embed it into the message string — Next.js overlays truncate the second argument to `console.error` |
| `PGRST201 Could not embed because more than one relationship was found` | A newly added table created a second foreign-key path to `profiles` | Disambiguate the embed with the constraint name: `profiles!articles_user_id_fkey(display_name)` |
| Author or member cannot write to a row they clearly own | RLS policy checks `submitted_by = auth.uid()` but the row was created by a different account, or checks only the author and not collaborators | Add an OR clause covering the article owner: `user_id = auth.uid() OR is_article_collaborator(id)`. For admin-only tables, write through an API route using `SUPABASE_SERVICE_ROLE_KEY` instead of loosening the policy |
| `requires_phone_verify` or any new column returns an error on select | The `ALTER TABLE ADD COLUMN` silently failed inside a merged SQL tab | Verify in the Table Editor that the column actually exists before debugging anything downstream |

### Build / deploy

| Symptom | Cause | Fix |
|---|---|---|
| Vercel build: `Module not found: Can't resolve './ComponentName'` but the file exists locally | macOS is case-insensitive, Vercel's Linux build is not. Git never tracked the case rename | `git rm --cached web/components/X.js` then `git add` the same path, commit, push. Or a two-step `git mv` through a temp filename |
| Local changes not appearing no matter how many times you save | Turbopack stale module cache | `rm -rf .next && npm run dev` |
| Build fails with `JSON.parse` error in `lib/getMarketData.js` | A market data JSON file in `web/public/data/` is corrupt, usually from a merge conflict leaving conflict markers in it | `git checkout -- web/public/data/` to discard, then re-run the pipeline. To find the broken file: loop over the folder with `json.load` and print failures |
| Environment variable change has no effect | `NEXT_PUBLIC_*` vars are baked into the bundle at build time, not read at runtime | Redeploy. If a plain redeploy doesn't work, redeploy **without build cache** |
| `supabaseKey is required` in an API route | `SUPABASE_SERVICE_ROLE_KEY` missing from the environment | Add it in Vercel as a **Secret**, and in `.env.local`. Then redeploy |
| Route returns 404 on Vercel but works locally | The folder was created locally but never committed, or the dynamic segment brackets were lost | Confirm the exact path exists in the GitHub file tree, brackets included: `app/member/channels/[channelId]/articles/[articleId]/page.js` |

### Git

| Symptom | Cause | Fix |
|---|---|---|
| `! [rejected] main -> main (non-fast-forward)` | The data pipeline pushed JSON commits while you were working locally | See the standard recovery sequence in section 2 below |
| `remote: Permission denied` / `403` on push | macOS Keychain is serving cached HTTPS credentials and ignoring your token | Switch to SSH: `git remote set-url origin git@github.com:ambhujsharma13/ambhujsharma99.git`. SSH is already configured on this machine |
| `commit X is a merge but no -m option was given` | Trying to revert a merge commit | `git revert <sha> -m 1 --no-edit` — the `-m 1` reverts to the first parent |
| `git push` says "Everything up-to-date" but the fix isn't live | The file was never actually placed on disk, or the content is byte-identical to what's already committed | Verify with `grep` for a distinctive string from the new version before assuming the push is the problem |

### Data pipeline

| Symptom | Cause | Fix |
|---|---|---|
| Pipeline fails in under 30 seconds | Python error, not a data error. Almost always an import or variable-scope bug | Read the full job log. Fast failures are never network issues |
| `UnboundLocalError: cannot access local variable 'payload'` | Retry loop assigns the variable only in the failure branch, so the success path leaves it undefined | Initialise the variable to `None` before the loop, assign inside the `try` on success |
| `522 Server Error` from `api.frankfurter.dev` | Transient Cloudflare timeout on the FX provider. Not your code | Retry logic with 5s/10s backoff is already in `fetch_data.py`. If all three attempts fail it warns and skips that currency rather than killing the run |
| Pipeline succeeds but still runs old code | GitHub Actions checked out a stale commit, or cached `.pyc` bytecode | `git commit --allow-empty -m "force fresh run"` then push, then dispatch the workflow manually |
| `FINRA 403: mock API credential` | The credential is a Public/mock tier key with no access to that dataset | Corporate bond breadth requires a **Firm** credential at $1,650/mo. Treasury daily aggregates work fine on Public |
| A market shows empty | Russia is permanently unavailable on Yahoo (sanctions, since 2022) and is excluded from the failure check. Other markets going empty usually means Yahoo rate-limiting | Re-run the pipeline. Runs are idempotent — only new dates are appended |
| New tickers or commodities don't appear after a config change | The pipeline ran on a commit from before the config change landed | Confirm the config file on GitHub has the new symbols, then dispatch the workflow manually |

### Frontend data rendering

| Symptom | Cause | Fix |
|---|---|---|
| Prices show `—` and change shows `-100.00%` | A row exists for a date with `close_usd: null` — Yahoo inserted a placeholder for a day whose data hasn't settled | Filter null-close rows out of `getAvailableDates` in `rangeStats.js`, not just out of the range calculation. Otherwise the max date becomes a null day and the table empties |
| Table disappears entirely | The default date range resolved to a day with no valid rows | Same root cause as above — the fix belongs in `getAvailableDates`, one level earlier than it feels like it should |
| `TypeError: history is not iterable` | Iterating over all keys in a `tickers` object, including metadata keys like `__name__AAPL` and `__stats__AAPL` | Skip any key starting with `__`, not just `__name__`. This bug has recurred four times as new metadata prefixes were added |
| Company logos missing locally but fine in production | `NEXT_PUBLIC_LOGO_DEV_TOKEN` not set in `.env.local` | Add it locally, or ignore — production is what matters |
| Data shows on the live site but not localhost | Local repo is behind. The pipeline commits data to GitHub, not to your machine | `git checkout -- web/public/data/ && git pull` |

### Storage / uploads

| Symptom | Cause | Fix |
|---|---|---|
| `StorageApiError: Invalid key: ...Screenshot 2026-09-05 at 9.54.54 PM.png` | Raw filename with spaces and colons used in the object path. Supabase Storage rejects it | Never use the original filename. Build the key from a UUID plus a sanitised extension only. This affected article featured images, inline body images and channel cover images — all three used the same unsafe pattern |

### Domain / DNS

| Symptom | Cause | Fix |
|---|---|---|
| Whole site unreachable, Vercel shows "Ready" | DNS records at Porkbun were overwritten or deleted, usually while editing email SPF/DKIM records | Restore both: `A @ → 216.198.79.1` and `CNAME www → 7e384ddf20ee99ca.vercel-dns-017.com`. Then hit Refresh on each domain in Vercel → Domains |
| OAuth callback lands on the homepage with `?code=...` dangling | The apex domain's 308 redirect to `www` dropped the path | Ensure the apex A record points at Vercel so the redirect preserves the path. Keep Supabase Site URL and Google OAuth redirect URIs on the `www` form |
| Site loads in Chrome but not Safari | macOS system DNS cache holding the old failed lookup | `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`, then clear Safari's website data for the domain |
| Gmail rejects mail from `admin@infinityvolume.com` with `550 5.7.26` | Missing SPF/DKIM records for the domain | Add SPF `v=spf1 include:_spf.google.com ~all` on `@`, generate DKIM in Google Workspace Admin and add the TXT record, optionally add DMARC on `_dmarc`. Never create a second SPF record — edit the existing one |

---

## 2. Standard command sequences

### Recover from a rejected push (pipeline conflict)

```bash
cd ~/Documents/GitHub/ambhujsharma99
git checkout -- web/public/data/      # discard stale local data files
git pull
git add <your code files>
git commit -m "..."
git push
```

### Force a fresh pipeline run

```bash
git commit --allow-empty -m "force fresh pipeline run"
git push
```
Then GitHub → Actions → **Update Market Data** → Run workflow → main.

### Run the pipeline locally

```bash
cd ~/Documents/GitHub/ambhujsharma99/scripts
export FRED_API_KEY=...
export FINRA_CLIENT_ID=...
export FINRA_CLIENT_SECRET=...
python3 fetch_data.py
```
Env vars only last for that terminal session. Add them to `~/.zshrc` to persist.

### Clear all caches and restart dev

```bash
cd ~/Documents/GitHub/ambhujsharma99/web
rm -rf .next
npm run dev
```

### Check which data files are corrupt

```bash
cd web/public/data
python3 -c "
import json, os
for f in sorted(os.listdir('.')):
    if f.endswith('.json'):
        try: json.load(open(f))
        except Exception as e: print('BROKEN:', f, '—', e)
"
```

### Verify a file actually landed before debugging further

```bash
grep -c "<distinctive string from the new version>" path/to/file.js
```
Returns `0` → the file was never placed. This check should be the **first** step in any "the fix didn't work" investigation, not the last.

---

## 3. Working constraints

- **Files cannot be written to this machine by the assistant.** Everything arrives as a download plus a place-at-path instruction. The dominant failure loop in this project has been: file delivered → not placed → "same error persists" → wrong thing diagnosed → discover the file was never placed. Verify placement with `grep` before reporting that a fix failed.
- **The assistant's sandbox has no network access** to Yahoo, FINRA, Redfin, FRED or Supabase. Only PyPI, npm, GitHub and api.anthropic.com. All live API testing has to be run locally or read through the browser.
- **Browser automation** requires the tab to be in the assistant's tab group. Typing into React-controlled inputs frequently does not fire `onChange` — programmatic value setting looks like it worked in the DOM while React state stays empty.

---

## 4. Escalation notes

| Situation | Where to go |
|---|---|
| Site down, Vercel shows Ready | Check Vercel → Domains for "Invalid Configuration" before anything else |
| Build failing | Vercel → Deployments → click the failed one → Build Logs. Never guess from the email notification |
| Pipeline failing | GitHub → Actions → the failed run → expand the failing step. Fast failures are code, slow failures are data |
| Emails not arriving | Resend dashboard → Emails. If there's no log entry at all, the request never reached Resend — check the API route and `RESEND_API_KEY` |
| SMS not sending | Twilio Console → Monitor → Logs → Messaging. A2P campaign must be approved for unrestricted US sending |
