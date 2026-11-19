# Cambridge + WordPress handoff (Admin Panel Phase 1)

Companion to `2026-11-19-wewin-admin-panel-design.md`.

## Hosting reality

- **`wewin.edu.vn` = WordPress** → do **not** build the panel BFF inside WP.
- **Panel UI + BFF** → `ielts.wewin.edu.vn/admin/hub` (Next).
- **WordPress** → menu/link only to that URL.
- **Cambridge** → lean hub API; panel BFF calls it with `WEWIN_HUB_API_KEY` (no browser CORS).

## IELTS (`wewin-ielts`) already has

- `SESSION_COOKIE_DOMAIN` + allowlisted `returnTo`
- `GET /api/hub/placement-attempts` (ADMIN cookie)
- (Next) `/admin/hub` aggregator page

## Cambridge (`cambridge-placement-test-main`) — implemented

- `GET /api/hub/placement-attempts`
- Auth: existing `wewin_admin` cookie **or** `Authorization: Bearer WEWIN_HUB_API_KEY`
- Lean rows only; `detailUrl` → `/admin?attempt=<id>`
- Env: `WEWIN_HUB_API_KEY`, `WEWIN_SITE_BRANCH`, `WEWIN_PUBLIC_SITE_URL`

Cambridge staff login remains its own account for now. True one-password SSO with IELTS user DB is a later step; the panel uses the hub API key server-side so admins only log into IELTS for the unified view.

## WordPress checklist

1. Create a page or menu item “Admin Panel” → `https://ielts.wewin.edu.vn/admin/hub`
2. Restrict visibility to staff (WP role / private page) if desired — real auth is still IELTS ADMIN.
3. Do not embed hub APIs in WP page JS (CORS + SameSite pain).

## Env checklist

| Site | Vars |
|------|------|
| IELTS | `SESSION_*`, hub origins, `WEWIN_HUB_API_KEY` (same value as Cambridge), `CAMBRIDGE_HUB_URL` |
| Cambridge | `WEWIN_HUB_API_KEY`, `WEWIN_SITE_BRANCH`, `WEWIN_PUBLIC_SITE_URL` |
| WordPress | none for API (link only) |
