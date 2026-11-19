# WeWIN Unified Admin Panel — Design Spec

**Date:** 2026-11-19  
**Status:** Approved (brainstorming)  
**Host (revised):** `wewin.edu.vn` is **WordPress** (Flatsome) — not a Next BFF.  
Unified Admin Panel UI + BFF ships on **IELTS** (`ielts.wewin.edu.vn/admin/hub`); WordPress only adds a menu/link.  
**Repos:** `wewin-ielts` (IdP + panel + IELTS hub API), `cambridge-placement-test-main` (Cambridge hub API).

## 1. Goal

One internal Admin Panel for NTL & XVNT staff to:

1. See aggregated **placement test** attempt stats/list from multiple WeWIN sites via authenticated APIs.
2. Open **full attempt detail** on the originating site (not hydrated in the panel).
3. Use **one ADMIN account** across sites via real SSO.
4. Keep shortcuts to learning platforms and teaching materials (links only in Phase 1).

## 2. Decisions (locked)

| Topic | Decision |
|--------|----------|
| Host | `wewin.edu.vn` (UI + thin BFF) |
| Architecture | Approach 1: BFF on wewin.edu.vn + IELTS as temporary IdP |
| Phase 1 data sources | IELTS (`ielts.wewin.edu.vn`) + Cambridge (`exam.wewin.edu.vn`) |
| Other mockup links | Shortcuts only (Games, Storyland, Elearning, Material) |
| Detail UX | Lean list on panel + open `detailUrl` on source site (no iframe, no in-panel answer modal as primary) |
| Data path | Pull lean APIs on demand + short cache (30–60s). No central placement DB in Phase 1 |
| Access | `ADMIN` only |
| IdP | IELTS temporary (wewin.edu.vn has no login yet); migrate IdP to wewin.edu.vn later without changing panel UX |
| Cambridge readiness | Site already has placement + admin; add lean API + trust shared session |

## 3. Architecture

```
Admin browser
    │
    ▼
wewin.edu.vn  (Admin Panel UI + BFF)
    │  unauthenticated → redirect to IELTS login with return_to
    ▼
ielts.wewin.edu.vn  (IdP tạm + placement source)
    │  sets shared session cookie Domain=.wewin.edu.vn
    ▼
wewin.edu.vn session OK (ADMIN)
    │
    ├─ BFF GET lean list → IELTS /api/hub/placement-attempts
    ├─ BFF GET lean list → Cambridge /api/hub/placement-attempts
    └─ “Xem bài” → detailUrl on source (same cookie SSO)
```

### Responsibilities

- **wewin.edu.vn:** Panel UI (mockup: Placement / Trang học tập / Teaching Resource), aggregate + cache lean lists, enforce ADMIN, platform shortcuts.
- **IELTS:** Temporary IdP (login + shared cookie), placement lean API, result pages for `detailUrl`.
- **Cambridge:** Placement lean API, result pages, verify same shared session cookie / secret.
- **Out of Phase 1:** Central placement DB, webhook sync, iframe detail, TEACHER access, per-campus RBAC.

### Future IdP move

When wewin.edu.vn owns login: it becomes the cookie issuer; IELTS/Cambridge keep the same cookie name + payload verify using shared `SESSION_SECRET` (or rotate to new issuer with dual-verify window). Panel BFF unchanged.

## 4. SSO (shared cookie)

### Mechanism

Reuse IELTS signed `wewin_session` cookie (HMAC-SHA256, existing `encodeSession` / `decodeSession` shape) with:

- `Domain=.wewin.edu.vn` (covers apex + all subdomains)
- `HttpOnly`, `Secure` (production), `SameSite=Lax`, `Path=/`
- Same `SESSION_SECRET` (≥16 chars) on IELTS, Cambridge, and wewin.edu.vn BFF

### Login flow

1. Admin opens `https://wewin.edu.vn/admin` (or agreed path).
2. BFF/middleware: no valid ADMIN session → redirect  
   `https://ielts.wewin.edu.vn/login?return_to=<urlencoded panel URL>`  
   (`return_to` must be allowlisted: `https://wewin.edu.vn/...`, `https://*.wewin.edu.vn/...`).
3. After successful ADMIN login on IELTS, set cookie with `Domain=.wewin.edu.vn`, redirect to `return_to`.
4. Panel and sibling sites receive the cookie automatically.

### Non-goals for SSO Phase 1

- OAuth authorization-code server (optional later if cookie Domain is blocked).
- Sharing passwords by syncing user tables (IdP is IELTS user store for now).
- Iframe SSO.

### Security

- Only `role === ADMIN` may use the panel and hub APIs.
- `return_to` allowlist prevents open redirects.
- Hub APIs: `Cache-Control: private, no-store` on responses that include PII; list aggregator may use short private cache keyed by session.
- Never return `passwordHash` or full answer keys on hub list endpoints.

## 5. Lean placement API contract

All sources implement the same shape so the panel can merge without per-site special cases beyond `source`.

### Endpoint

`GET /api/hub/placement-attempts`

**Auth:** valid `wewin_session` cookie with `role=ADMIN` (and/or `Authorization: Bearer` only if we later add service tokens — not required for Phase 1).

**Query (optional):**

| Param | Type | Notes |
|--------|------|--------|
| `q` | string | Search name / attempt id (max 100) |
| `branch` | `NTL` \| `XVNT` | Filter if source supports it |
| `test` | string | Filter by test label/slug |
| `from` / `to` | ISO date | Finished-at range |
| `take` | int | Default 50, max 100 |
| `cursor` | string | Opaque pagination if needed |

### Response

```json
{
  "source": "ielts",
  "generatedAt": "2026-11-19T07:00:00.000Z",
  "items": [
    {
      "id": "clxyz...",
      "externalId": "PT-0112",
      "studentName": "Nguyễn Minh An",
      "branch": "NTL",
      "testLabel": "IELTS Placement",
      "testSlug": "placement-listening",
      "finishedAt": "2026-11-18T01:02:00.000Z",
      "scoreCorrect": 8,
      "scoreTotal": 10,
      "scorePercent": 80,
      "detailUrl": "https://ielts.wewin.edu.vn/tests/.../result?attempt=..."
    }
  ],
  "stats": {
    "total": 12,
    "byBranch": { "NTL": 7, "XVNT": 5 }
  }
}
```

**Rules:**

- Lean only: no stems, options, keys, audio, passages, highlights, grade blobs.
- Finished attempts only (`finishedAt != null`).
- IELTS: filter tests with `examType = PLACEMENT` (or agreed placement slug set).
- `branch`: Phase 1 from env `WEWIN_SITE_BRANCH` (`NTL` \| `XVNT`) when per-user campus is not stored; document upgrade path to `User.campus` / attempt tag later. If a site serves both campuses, it must populate `branch` per row.
- `detailUrl`: absolute HTTPS URL on the source origin; panel opens in same or new tab.
- Errors: `{ "code": "LOGIN_REQUIRED" | "ADMIN_REQUIRED" | "INVALID_INPUT" | "SERVER_ERROR" }` + HTTP status.

### Panel aggregation

1. BFF (authenticated) fetches IELTS + Cambridge in parallel.
2. Merge `items`, sort by `finishedAt` desc.
3. Recompute display stats from merged list (or sum source `stats` when unfiltered).
4. Cache merged result **30–60s** per admin session (or global short TTL private cache) to limit Fluid Active CPU on source sites.
5. On partial failure: show available rows + non-blocking error banner for the failed source.

## 6. UI (wewin.edu.vn)

Base visual language: handed-off mockup `WeWIN_Admin_Panel.html` (navy rail, teal hero, NTL/XVNT badges).

### Nav

1. **Placement Test** — metrics + filters + lean table + “Xem bài” → `detailUrl`.
2. **Trang học tập** — external shortcuts (IELTS, Cambridge, Games, Storyland, Elearning).
3. **Teaching Resource** — link to materials URL.

### Placement table columns

Học viên, Cơ sở, Bài kiểm tra, Ngày giờ nộp (UTC+7), Kết quả (`correct/total` + %), Chi tiết.

### Explicitly not primary in Phase 1

In-panel answer dialog from the HTML mockup. Optional later via on-demand detail API; not in Phase 1 scope.

## 7. Config / env

| Variable | Where | Purpose |
|----------|--------|---------|
| `SESSION_SECRET` | IELTS, Cambridge, panel | Shared HMAC for `wewin_session` |
| `SESSION_COOKIE_DOMAIN` | IELTS (issuer), others if they set cookies | `.wewin.edu.vn` in production |
| `WEWIN_SITE_BRANCH` | IELTS, Cambridge | Default `NTL` or `XVNT` for lean rows when no per-user campus |
| `WEWIN_HUB_ALLOWED_RETURN_ORIGINS` | IELTS | Comma list, e.g. `https://wewin.edu.vn,https://exam.wewin.edu.vn` |
| `WEWIN_HUB_SOURCES` | Panel BFF | URLs of IELTS + Cambridge hub endpoints |

## 8. Error handling & ops

- Source timeout (e.g. 8s): fail that source, keep the other.
- 401/403 from source: treat as auth problem; prompt re-login via IELTS.
- Rate-limit hub endpoints lightly per admin id (abuse protection).
- Audit: optional `HUB_PLACEMENT_LIST` on IELTS/Cambridge when ADMIN lists (metadata: take, q length) — nice-to-have, not blocking.

## 9. Testing

- Unit: session encode/decode with `Domain` option; `return_to` allowlist accept/reject; lean mapper from Attempt+Test → hub item (no fat fields).
- Integration: ADMIN cookie → 200 lean JSON; STUDENT → 403; unfinished attempts excluded.
- Manual: login on IELTS → open wewin.edu.vn panel without re-login; “Xem bài” opens IELTS result while still ADMIN.

## 10. Implementation slices

1. **wewin-ielts:** shared cookie domain + `return_to` login; `GET /api/hub/placement-attempts`; docs for Cambridge parity.
2. **Cambridge:** same cookie verify + hub endpoint + `detailUrl`.
3. **wewin.edu.vn:** panel UI + BFF aggregator + cache (new site logic).

Phase 1 is complete when an ADMIN can log in once on IELTS, open the panel on wewin.edu.vn, see merged lean placement rows from IELTS (+ Cambridge when wired), and open detail on the source site.
