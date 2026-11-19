# Admin Hub: IELTS/Cambridge tabs + Cambridge SSO handoff

Date: 2026-11-19  
Repos: `wewin-ielts`, `cambridge-placement-test-main`  
Status: implementing (user approved direction 3 + handoff A)

## Problem

1. Hub banner: Cambridge placement list fails (`WEWIN_HUB_API_KEY` / URL misconfigured or opaque errors).
2. «Xem bài» forces re-login: IELTS `detailUrl` falls back to `VERCEL_URL` (`*.vercel.app`) while the admin is on `ielts.wewin.edu.vn`, so `wewin_session` is not sent. Cambridge links hit a separate `wewin_admin` login with no handoff.
3. IELTS and Cambridge attempts are merged in one table; product wants two separate tabs above the filters.

## Goals

- Reliable Cambridge list when env is correct; clearer i18n errors when not.
- IELTS «Xem bài» stays on the production IELTS host (same session).
- Cambridge «Xem bài» from hub auto-establishes Cambridge admin session via short-lived handoff (option A), then opens `/admin?attempt=`.
- UI: tabs **IELTS | Cambridge** only (no “All”), above search/branch filters.

## Non-goals

- Full shared SSO / shared cookie on `*.wewin.edu.vn` (option C) — deferred.
- Embedding Cambridge results inside the IELTS UI (option B).
- Changing Cambridge staff username/password login for direct `/admin` visits.
- WordPress changes.

## Architecture overview

```
Browser (IELTS ADMIN)
  ├─ GET /api/admin/hub/placement-attempts?source=ielts|cambridge&…
  │     └─ aggregatePlacementAttempts (local Prisma and/or Bearer → Cambridge hub)
  ├─ IELTS «Xem bài» → same-origin /practice/{slug}/{id}/result
  └─ Cambridge «Xem bài» → GET /api/admin/hub/cambridge-sso?attempt=…
        → 302 Cambridge /api/hub/sso-consume?token&attempt
        → Set-Cookie wewin_admin → 302 /admin?attempt=
```

Shared secret: existing `WEWIN_HUB_API_KEY` (same value on both deploys, ≥ 16 chars). Used for list Bearer auth and for SSO HMAC.

---

## 1. Cambridge source reliability + diagnostics

### Behavior (unchanged contract)

- IELTS server calls `CAMBRIDGE_HUB_URL` with `Authorization: Bearer WEWIN_HUB_API_KEY`.
- Partial failure still returns IELTS rows; `sources.cambridge.ok === false` drives the banner.

### Improvements

| Failure | Machine code (already / keep) | UI (i18n) |
|---------|-------------------------------|-----------|
| Missing/short key on IELTS | `CAMBRIDGE_HUB_NOT_CONFIGURED` | Distinct message: key missing on IELTS |
| Cambridge 401 | `ADMIN_REQUIRED` | Key mismatch or Cambridge key unset |
| Timeout / abort | existing | Timeout message |
| Other HTTP | `CAMBRIDGE_HTTP_*` | Generic + optional detail |

Map codes in `hub-panel` via `admin.*` keys (vi + en), not a single catch-all when a specific code is known.

### Env checklist (ops, not code)

| Site | Variables |
|------|-----------|
| IELTS | `WEWIN_HUB_API_KEY`, `CAMBRIDGE_HUB_URL`, `NEXT_PUBLIC_SITE_URL=https://ielts.wewin.edu.vn` |
| Cambridge | `WEWIN_HUB_API_KEY` (identical), `WEWIN_PUBLIC_SITE_URL`, `WEWIN_SITE_BRANCH`, admin session env |

Document in `.env.example` + short note in this spec / handoff doc. Deploy must set keys on **both** Vercel projects; code cannot invent secrets.

---

## 2. IELTS «Xem bài» origin fix

### Root cause

`siteOrigin()` prefers `NEXT_PUBLIC_SITE_URL`, else `https://${VERCEL_URL}`, else production default. Production custom domain without `NEXT_PUBLIC_SITE_URL` yields `*.vercel.app` absolute links → login wall.

### Fix

1. **Hub IELTS rows:** emit **relative** `detailUrl` (`/practice/.../result`) so the browser stays on whatever host the admin already uses.
2. **`siteOrigin()` for other absolute needs:** do **not** use `VERCEL_URL` for user-facing links. Order: `NEXT_PUBLIC_SITE_URL` → hard default `https://ielts.wewin.edu.vn`.
3. Keep `target="_blank"`; same-site relative URL inherits cookies.

Guest vs owner access rules on the result page stay unchanged (ADMIN can view).

---

## 3. Cambridge SSO handoff (option A)

### Flow

1. Aggregator / Cambridge `mapHubRow` sets `detailUrl` to IELTS handoff URL, e.g.  
   `{ieltsOrigin}/api/admin/hub/cambridge-sso?attempt={id}`  
   where `ieltsOrigin` uses the fixed production-safe origin rules above (absolute required because the link may be opened from a bookmark; relative is also fine when only used from hub on IELTS — prefer **relative** `/api/admin/hub/cambridge-sso?attempt=` when rewriting in hub UI, or absolute production IELTS origin when Cambridge builds the URL).

   **Chosen approach:** rewrite on IELTS when tagging Cambridge items in `aggregate-placement.ts` (or in hub-panel for `source === "cambridge"`): always  
   `/api/admin/hub/cambridge-sso?attempt=${encodeURIComponent(id)}`  
   so Cambridge’s own `detailUrl` origin quirks do not matter for hub clicks.

2. **IELTS** `GET /api/admin/hub/cambridge-sso`  
   - `runtime = nodejs`  
   - `getSessionUser` + `canAccessAdmin` → else 401/403  
   - Validate `attempt` (UUID / non-empty, max length) with Zod  
   - Require configured hub key  
   - Mint token (see below)  
   - `302` to  
     `{cambridgePublicOrigin}/api/hub/sso-consume?token=...&attempt=...`  
   - `cambridgePublicOrigin` from `CAMBRIDGE_HUB_URL` origin (strip path) or dedicated `CAMBRIDGE_PUBLIC_SITE_URL` if set; document in `.env.example`.

3. **Cambridge** `GET /api/hub/sso-consume`  
   - Validate query with Zod (`token`, `attempt`)  
   - Verify HMAC + expiry + `attempt` bind  
   - If admin not configured → 503  
   - `Set-Cookie` `wewin_admin` = `createAdminSession()` with  
     `httpOnly`, `secure` in production, **`sameSite: 'lax'`**, `path: '/'`, `maxAge: adminSessionSeconds`  
     (Lax required so cookie is usable after cross-site top-level redirect into Cambridge; password login may keep Strict or also move to Lax — prefer **Lax for SSO-set cookie**; align password login cookie to Lax in the same change for consistency.)  
   - `302` → `/admin?attempt={id}`  
   - Invalid/expired token → `302` → `/admin?attempt={id}&sso=failed` or plain `/admin` with no session (existing login UI).

4. **AdminDashboard** already loads `attempt` from query after session OK — no UI change if cookie is set before first `session` GET. Ensure consume redirect lands with cookie on the subsequent `/admin` document request (same site, Lax OK).

### Token format

- Payload (JSON → base64url): `{ attemptId, exp, nonce }`  
  - `exp`: now + 90 seconds  
  - `nonce`: 16 random bytes hex  
- Signature: `HMAC-SHA256(payload, WEWIN_HUB_API_KEY)` → base64url  
- Wire: `token = payload + "." + sig`  
- Timing-safe compare on verify  
- No server-side nonce store in v1 (short TTL + attempt bind); optional one-time store later if replay becomes a concern.

### Security

- Handoff route: ADMIN session only; no public mint.  
- Token never returned to list JSON.  
- Cambridge consume does not accept hub Bearer for setting cookies (token only).  
- Rate-limit consume lightly if easy (optional); mint already gated by IELTS admin auth.  
- Do not log raw tokens or API keys.

---

## 4. Tabs IELTS | Cambridge

### UI (`hub-panel.tsx`)

- Place a tab control **above** the search + branch filter row, inside the list card, under the list header.
- Tabs: **IELTS** | **Cambridge** only (no All). Default: **IELTS**.
- WEWIN navy active tab styling (existing tokens); i18n keys in `admin.*` (vi + en).
- On tab change: reset or keep `q`/`branch` (keep filters); refetch with `source`.
- Cambridge source error banner: show only when active tab is Cambridge (or when Cambridge fetch failed and user is on that tab).
- Metrics cards: reflect stats for the active tab’s response (`total`, branch counts).

### API / aggregate

- Extend `hubPlacementQuerySchema` with  
  `source: z.enum(["ielts", "cambridge"]).optional()`  
  Hub BFF requires `source` from UI (always send one of the two).
- `aggregatePlacementAttempts`:  
  - `source === "ielts"` → only local list; Cambridge `sources.cambridge` can be `{ ok: true }` skipped or `{ ok: true, skipped: true }` — prefer **not calling** Cambridge (save Fluid CPU / egress).  
  - `source === "cambridge"` → only `fetchCambridge`; IELTS source skipped.  
  - If `source` omitted (compat): keep current merge behavior for any old clients; UI always sends source.
- `take` applies to the single source list (not a post-merge slice of both).

### i18n

Add keys (examples): `hubTabIelts`, `hubTabCambridge`, plus refined Cambridge error keys. Never show raw codes/enums to users.

---

## 5. Testing

- Unit: token mint/verify (valid, expired, wrong key, attempt mismatch).  
- Unit: `siteOrigin` never returns `VERCEL_URL`.  
- Unit/aggregate: `source=ielts` does not call Cambridge fetch (mock).  
- Cambridge: existing hub tests + SSO consume happy path / bad token.  
- Manual: hub on `ielts.wewin.edu.vn` → IELTS «Xem bài» no login; Cambridge «Xem bài» lands on detail without password when keys match.

## 6. Rollout

1. Set/verify env on both Vercel projects (keys + `NEXT_PUBLIC_SITE_URL`).  
2. Deploy Cambridge (SSO consume + cookie SameSite) first or together.  
3. Deploy IELTS (tabs, origin fix, handoff mint, rewrite Cambridge links).  
4. Confirm hub Cambridge tab loads; handoff opens attempt.

## 7. Files (expected)

**IELTS:** `hub-panel.tsx`, `aggregate-placement.ts`, `placement-attempts-pure.ts` / `placement-attempts.ts`, `placement-attempts-query.ts`, new `api/admin/hub/cambridge-sso/route.ts`, i18n `vi.json`/`en.json`, `.env.example`, this spec.

**Cambridge:** new `api/hub/sso-consume/route.ts` (+ token helpers), `admin` session cookie SameSite alignment, tests, `.env.example`.
