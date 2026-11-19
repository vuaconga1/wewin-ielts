# WeWIN Admin Panel (Phase 1a — IELTS IdP + Hub API) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) or subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `wewin-ielts` a temporary IdP (shared `.wewin.edu.vn` session cookie + safe `return_to`) and expose a lean ADMIN-only placement attempts API for the future wewin.edu.vn panel BFF.

**Architecture:** Extend existing HMAC `wewin_session` with configurable cookie Domain; allowlisted post-login redirect; new hub route returns finished PLACEMENT attempts without stems/keys. Cambridge and wewin.edu.vn panel are separate follow-up slices using the same contract in the design spec.

**Tech Stack:** Next.js App Router, existing `@/lib/auth`, Prisma Attempt/Test, Zod, `unstable_cache` or in-handler short TTL.

**Spec:** `docs/superpowers/specs/2026-11-19-wewin-admin-panel-design.md`

## Global Constraints

- ADMIN only for hub APIs and panel.
- Lean payloads only on hub list (no answers/grade/passage).
- No central placement DB in Phase 1.
- No iframe detail; `detailUrl` only.
- Fluid Active CPU: lean select, short cache, no structuredClone of catalogs.
- Validate query with Zod; errors `{ code }`.
- Do not commit secrets; update `.env.example` with placeholders only.
- Do not git commit unless the user asks.

---

### Task 1: Session cookie Domain + return_to allowlist helpers

**Files:**
- Modify: `src/lib/auth.ts`
- Create: `src/lib/auth/sso-return-to.ts`
- Create: `scripts/test-sso-return-to.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `isAllowedReturnTo(url: string): boolean`
- Produces: `createSession` respects `SESSION_COOKIE_DOMAIN` when set
- Consumes: `process.env.WEWIN_HUB_ALLOWED_RETURN_ORIGINS`, `process.env.SESSION_COOKIE_DOMAIN`

- [ ] **Step 1: Write failing tests for return_to allowlist**

```ts
// scripts/test-sso-return-to.ts
import assert from "node:assert/strict";
import { isAllowedReturnTo } from "../src/lib/auth/sso-return-to";

process.env.WEWIN_HUB_ALLOWED_RETURN_ORIGINS =
  "https://wewin.edu.vn,https://exam.wewin.edu.vn";

assert.equal(isAllowedReturnTo("https://wewin.edu.vn/admin"), true);
assert.equal(isAllowedReturnTo("https://wewin.edu.vn/admin/placement"), true);
assert.equal(isAllowedReturnTo("https://exam.wewin.edu.vn/"), true);
assert.equal(isAllowedReturnTo("https://evil.com/"), false);
assert.equal(isAllowedReturnTo("https://wewin.edu.vn.evil.com/"), false);
assert.equal(isAllowedReturnTo("/relative"), false);
assert.equal(isAllowedReturnTo("javascript:alert(1)"), false);
console.log("sso-return-to: ok");
```

- [ ] **Step 2: Run test — expect fail (module missing)**

Run: `npx tsx scripts/test-sso-return-to.ts`  
Expected: cannot find module / export

- [ ] **Step 3: Implement `sso-return-to.ts`**

```ts
import "server-only";

function allowedOrigins(): string[] {
  const raw = process.env.WEWIN_HUB_ALLOWED_RETURN_ORIGINS?.trim();
  if (!raw) {
    return ["https://wewin.edu.vn"];
  }
  return raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

/** Absolute https URL whose origin is allowlisted (no open redirect). */
export function isAllowedReturnTo(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && process.env.NODE_ENV === "production") {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.username || url.password) return false;
  const origin = url.origin;
  return allowedOrigins().some((allowed) => allowed === origin);
}
```

In development, also allow `http://localhost:*` origins when `NODE_ENV !== "production"` (document in file comment; keep production https-only + allowlist).

- [ ] **Step 4: Update `createSession` cookie options**

In `src/lib/auth.ts` `createSession`:

```ts
const domain = process.env.SESSION_COOKIE_DOMAIN?.trim();
jar.set(COOKIE_NAME, encodeSession(user), {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production" || Boolean(domain),
  path: "/",
  maxAge: MAX_AGE_SEC,
  ...(domain ? { domain } : {}),
});
```

- [ ] **Step 5: Document env in `.env.example`**

```
# Shared SSO across *.wewin.edu.vn (production). Leave unset for localhost host-only cookies.
# SESSION_COOKIE_DOMAIN=".wewin.edu.vn"
# Comma-separated origins allowed for post-login return_to (Admin Panel, Cambridge, …)
# WEWIN_HUB_ALLOWED_RETURN_ORIGINS="https://wewin.edu.vn,https://exam.wewin.edu.vn"
# Default campus label on hub placement rows when User has no campus field
# WEWIN_SITE_BRANCH="NTL"
```

- [ ] **Step 6: Re-run test — expect pass**

Run: `npx tsx scripts/test-sso-return-to.ts`  
Expected: `sso-return-to: ok`

---

### Task 2: Honor `return_to` after login (ADMIN)

**Files:**
- Modify: `src/app/api/auth/route.ts` (or login handler that calls `createSession`)
- Modify: login client/page if it posts without `return_to`

**Interfaces:**
- Consumes: `isAllowedReturnTo`
- Produces: JSON `{ ok: true, returnTo?: string }` or `Location` redirect when `return_to` valid

- [ ] **Step 1: Read current login POST body schema in `src/app/api/auth/route.ts`**

- [ ] **Step 2: Add optional `returnTo` string (max 2048) to login body Zod schema**

- [ ] **Step 3: After successful `createSession`, if `returnTo` and `isAllowedReturnTo(returnTo)`, include `returnTo` in JSON response**

- [ ] **Step 4: Login UI — if `?return_to=` present, send it as `returnTo` and `window.location` to it after success (ADMIN or any role? Spec: panel needs ADMIN; still redirect any successful login to allowlisted return_to; panel BFF will 403 non-admin)**

- [ ] **Step 5: Manual check documented in plan notes: `/login?return_to=https://wewin.edu.vn/admin`**

---

### Task 3: Lean hub mapper + service

**Files:**
- Create: `src/lib/hub/placement-attempts.ts`
- Create: `src/lib/hub/placement-attempts-types.ts`
- Create: `scripts/test-hub-placement-map.ts`

**Interfaces:**
- Produces: `mapHubPlacementItem(row): HubPlacementItem`
- Produces: `listHubPlacementAttempts(filters): Promise<HubPlacementListResult>`
- Consumes: Prisma Attempt + Test (`examType: PLACEMENT`, `finishedAt not null`), user name fields

- [ ] **Step 1: Define types**

```ts
export type HubBranch = "NTL" | "XVNT";

export type HubPlacementItem = {
  id: string;
  externalId: string;
  studentName: string;
  branch: HubBranch;
  testLabel: string;
  testSlug: string;
  finishedAt: string;
  scoreCorrect: number | null;
  scoreTotal: number | null;
  scorePercent: number | null;
  detailUrl: string;
};

export type HubPlacementListResult = {
  source: "ielts";
  generatedAt: string;
  items: HubPlacementItem[];
  stats: { total: number; byBranch: Record<HubBranch, number> };
};
```

- [ ] **Step 2: Failing test for score percent + branch env**

```ts
import assert from "node:assert/strict";
import { scorePercent, resolveHubBranch } from "../src/lib/hub/placement-attempts";

assert.equal(scorePercent(8, 10), 80);
assert.equal(scorePercent(null, 10), null);
process.env.WEWIN_SITE_BRANCH = "XVNT";
assert.equal(resolveHubBranch(), "XVNT");
console.log("hub-placement-map: ok");
```

- [ ] **Step 3: Implement mapper + `listHubPlacementAttempts`**

Query constraints:
- `test.examType === "PLACEMENT"`
- `finishedAt: { not: null }`
- `orderBy: { finishedAt: "desc" }`
- `take` capped 100
- `select` only: attempt id, finishedAt, scoreRaw, payload score fragments needed for correct/total, user `{ fullName, username }`, test `{ slug, title, examType }`
- `detailUrl`: `${APP_ORIGIN}${practicePath or result path for attempt}` — use existing result URL helper if present; else `/tests/${slug}/result?attemptId=${id}` matching app routes
- `externalId`: short display id e.g. `PT-` + last 4 of id or sequential — stable string from attempt id is fine (`attempt.id`)
- Default branch from `resolveHubBranch()`
- Wrap list in `unstable_cache` with key including filter hash, `revalidate: 45`

- [ ] **Step 4: Run mapper test — pass**

---

### Task 4: Hub API route

**Files:**
- Create: `src/app/api/hub/placement-attempts/route.ts`
- Create: `src/lib/hub/placement-attempts-query.ts` (Zod query)

**Interfaces:**
- Consumes: `getSessionUser`, `canAccessAdmin`, `listHubPlacementAttempts`
- Produces: `GET` JSON per design spec

- [ ] **Step 1: Zod query schema** (`q` max 100, `branch` enum optional, `take` 1–100 default 50)

- [ ] **Step 2: Route handler**

```ts
export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "LOGIN_REQUIRED" }, { status: 401 });
  if (!canAccessAdmin(user)) {
    return NextResponse.json({ code: "ADMIN_REQUIRED" }, { status: 403 });
  }
  // parse query → listHubPlacementAttempts → JSON + Cache-Control: private, max-age=45
}
```

- [ ] **Step 3: `npx tsc --noEmit` clean for touched files**

---

### Task 5: Cambridge + panel handoff doc (no Cambridge code in this repo)

**Files:**
- Create: `docs/superpowers/specs/2026-11-19-wewin-admin-panel-cambridge-handoff.md`

- [ ] **Step 1: Write handoff** listing: share `SESSION_SECRET`, set cookie domain if Cambridge sets cookies, implement same `GET /api/hub/placement-attempts`, verify `wewin_session` with same decode, map Cambridge placement rows, `detailUrl` absolute.

- [ ] **Step 2: Note panel BFF merge algorithm** (parallel fetch, merge sort, partial error banner) for wewin.edu.vn implementers.

---

### Task 6: Verification

- [ ] **Step 1:** `npx tsx scripts/test-sso-return-to.ts`
- [ ] **Step 2:** `npx tsx scripts/test-hub-placement-map.ts`
- [ ] **Step 3:** `npx tsc --noEmit`
- [ ] **Step 4:** Smoke: as ADMIN, `GET /api/hub/placement-attempts` returns lean JSON only

---

## Follow-up (out of this plan’s code)

- Cambridge hub route in `wewin-cambrigde`
- wewin.edu.vn Admin Panel UI + BFF
- Optional `User.campus` for real NTL/XVNT per student
- Move IdP issuance to wewin.edu.vn
