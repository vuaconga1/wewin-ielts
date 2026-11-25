# Admin Panel hub (`admin.wewin.edu.vn`)

**Status:** Phase 1 scaffolded in `AdminPanel/` (separate Next app; own deploy / git).

## Architecture

```
Browser
  └─ admin.wewin.edu.vn (AdminPanel)
       ├─ verifies wewin_session (SESSION_SECRET, Domain=.wewin.edu.vn)
       ├─ BFF GET /api/placement → Bearer WEWIN_HUB_API_KEY
       │     ├─ IELTS /api/hub/placement-attempts
       │     └─ Cambridge /api/hub/placement-attempts
       └─ “Mở admin” / “Xem bài” → product origin (deep-link, no iframe)
```

- **IdP (Phase 1):** IELTS `/login?return_to=https://admin.wewin.edu.vn/...`
- **Full CRUD:** stays on each product `/admin`
- **Cookie migrate:** IELTS `createSession` clears host-only then sets `SESSION_COOKIE_DOMAIN`; `destroySession` clears both

## Env (production)

| App | Variables |
|-----|-----------|
| IELTS | `SESSION_SECRET`, `SESSION_COOKIE_DOMAIN=.wewin.edu.vn`, `WEWIN_HUB_ALLOWED_RETURN_ORIGINS` (include `https://admin.wewin.edu.vn` or `.wewin.edu.vn`), `WEWIN_HUB_API_KEY` |
| AdminPanel | same `SESSION_SECRET`, `SESSION_COOKIE_DOMAIN`, `WEWIN_HUB_API_KEY`, hub URLs, `NEXT_PUBLIC_ADMIN_ORIGIN`, product admin URLs |
| Cambridge | `WEWIN_HUB_API_KEY` (same), hub route |

## Rollout

1. Deploy Cambridge hub Bearer (already) + AdminPanel.
2. Set IELTS cookie Domain + allowlist; redeploy IELTS.
3. Staff re-login once (or wait for session re-issue) → shared cookie.
4. Keep IELTS `/admin/hub` until traffic moves; then deprecate as shortcut to AdminPanel.
