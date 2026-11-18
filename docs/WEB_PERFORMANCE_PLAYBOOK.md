# Web Performance Playbook (portable)

Single reference for keeping a serverless/Edge web app **fast on soft navigation** and **cheap on CPU/egress**.  
Applies to Next.js, Nuxt, SvelteKit, Remix, or plain Functions on hosts such as Vercel.  
Do not weaken correctness or security for speed. Never hardcode or log secrets.

> Derived from WEWIN IELTS practice (`Fluid Active CPU`, runtime soft-nav, DB indexes) — rewritten so another product can adopt the same behaviors with its own table/API names.

---

## 1. Goals

1. **Warm soft navigation** feels instant: aim for **tens of ms** of server work per click when warm. Hundreds of ms of auth/DB/RSC work on every soft-nav is a regression.
2. **Serverless CPU time** (e.g. Vercel Fluid Active CPU) stays low: billed by **processing time** per request, not request count alone. Heavy hydrate, deep clone, nested loops, and tight polling spike cost **without a cron**.
3. **Warm path stays fast** even if the DB has cold starts — minimize uncached work on hot routes.
4. **Network egress** stays lean: do not pull large JSON blobs (content bodies, slides, full payloads) on list, poll, or autosave paths.

### Non-negotiables

- Correctness and authz first; performance second.
- Never trade security checks or validation for fewer DB round-trips.
- Never log or return secrets, password hashes, or ciphertext.
- Private user data: `Cache-Control: private, no-store` — never CDN-cache secrets or PII.

---

## 2. Why CPU spikes (request-driven cost)

On many Hobby/Pro setups there is **no cron**. Cost rises because **each request**:

- hydrates large JSON trees,
- deep-clones cached catalogs,
- re-runs expensive compute (grade / parse / embed / OCR / AI score) on read,
- or clients poll origin too often.

Treat every hot path as: **list ≠ detail**, **compute once on write**, **shallow cache**, **poll ≤ carefully**.

---

## 3. List ≠ detail (lean payloads)

| Concern | List / catalog / dashboard / admin board | Detail |
|---|---|---|
| Return | ids, titles, slugs, status, **counts**, timestamps, scores | full body, stems, options, answers, transcripts, media refs |
| Do not load | content HTML/markdown, nested answer trees, highlights, binaries | — |
| Counts | prefer stored counters (e.g. `questionCount`) | load children only when needed |

- Treat list-cache data as **immutable**. Prefer shallow copy (`slice()` / top-array spread) over `structuredClone` / `JSON.parse(JSON.stringify(...))` of large trees on every response.
- Full content only via **detail-by-id/slug** used by edit, practice, submit, review.

```text
❌ List API loads content + answers + nested trees “in case UI needs them”
✅ List: metadata + counts; Detail: full body when the user opens one item

❌ Deep-clone entire catalog on each request
✅ Return immutable / shallow copy from cache
```

```ts
// ❌ BAD — fat list + expensive clone
items: { select: { content: true /* large JSON */ } }
return structuredClone(listCache.data);

// ✅ GOOD
items: { select: { title: true, order: true, itemCount: true } }
return listCache.data.slice();
```

---

## 4. Soft navigation & shared shells

- Shared **layouts/shells** must not run cookies + auth + DB + ranking on every soft-nav when the page does not need that data synchronously.
- Prefer **client hydrate** of session, badges, rankings via short-TTL APIs (~**30–60s**). Do not refetch on every route change if data is still fresh.
- Prefer **static/ISR** (or CDN revalidation) for catalog and marketing chrome; put heavy data on the page that needs it.
- Keep RSC/HTML payloads slim; defer fat data to the route that displays it.

```tsx
// ❌ BAD — DB/auth in layout on every soft nav
export default async function Layout({ children }) {
  const session = await getSession(); // cookies + DB
  const rank = await db.ranking.findMany();
  return <Shell user={session} rank={rank}>{children}</Shell>;
}

// ✅ GOOD — ISR / static chrome + client-hydrated shell
export const revalidate = 300;
export default async function Page() {
  return <Shell>{/* lean page data only */}</Shell>;
}
```

When adding a feature, ask:

1. Does this add **per-click** RSC / DB / auth work on soft nav?
2. Prefer cache, client TTL, or deferred fetch over blocking work in layout/shell.
3. Never weaken correctness or security for speed.

---

## 5. Caching

| Data kind | Approach |
|---|---|
| Semi-static (catalog, public ranking) | In-process / framework cache (`unstable_cache` or equivalent) and/or HTTP `Cache-Control` (`s-maxage`, `stale-while-revalidate`) |
| After admin writes that change public lists | Invalidate by tag/path — do not rely on process restart |
| Per-user incomplete / badge endpoints | Short server or client TTL (~60s); **do not drop** that cache when adding soft-nav fetches |
| Private user data | `private, no-store` |

---

## 6. Persist expensive work; do not recompute on read

- Grade, parse, embed, OCR, AI score, and similar CPU-heavy results: **compute once on write/submit**, store the result, **read back on view**.
- Recompute only for legacy rows missing the persisted field, or when inputs change and you intentionally invalidate.
- Autosave / partial updates must not re-read and rewrite entire large JSON payloads when a path patch (e.g. `jsonb_set`-style) is enough.

```text
❌ Re-grade or re-parse every time the result page opens
✅ Persist grade/score at submit; result page reads stored value

❌ Autosave loads full payload, mutates, writes whole blob
✅ Patch only the changed path
```

---

## 7. Database access

### Lean queries

- **Lean `select`**: never `SELECT *` on hot list paths; omit large JSON columns unless required.
- **Pagination**: every list over growing tables uses `take` / cursor + stable `orderBy`. No unbounded `findMany` on hot paths.
- **No N+1**: batch with `IN` / nested select / `createMany`; no await-in-loop create/update for bulk import.
- **Targeted open-record lookup**: query with equality filters (user + unfinished + resource), not “load all for user then `.find()` in memory”.

```ts
// ❌ BAD — fat payload, no paging, N+1
const rows = await db.attempt.findMany({ where: { userId } });
for (const a of rows) a.item = await db.item.findUnique({ where: { id: a.itemId } });

// ✅ GOOD
const rows = await db.attempt.findMany({
  where: { userId },
  orderBy: { startedAt: "desc" },
  take: 20,
  select: {
    id: true,
    startedAt: true,
    score: true,
    item: { select: { slug: true, title: true } },
  },
});
```

### Lean list mode for history / reports

- Dashboard, ranking, admin reports, history: **lean list** — metadata + scores only; no answers / highlights / full grade trees.
- Full payload only for save, single-record fetch, or one-item review.
- Open/resume record: query `finishedAt: null` + user + resource id/slug (+ small `take`). **Never** load all user rows then `.find()` in memory.

### Indexes travel with the query (same PR/task)

Indexes **do not change business logic** — only how rows are found.

**When you must review indexes**

- New/changed model or filterable column
- New/changed `where` / `orderBy` / `distinct` / raw SQL on growing tables
- Import/seed that grows tables quickly
- Admin/list paths without `take`, or time-range filters (`createdAt`, `finishedAt`, `deadlineAt`, …)

**Checklist**

1. List every `where` + `orderBy` (+ `IN` / range) on the new or hot path.
2. Map to existing indexes / uniques — add what is missing.
3. Composite column order: **equality → range/null → sort**  
   Example: `[userId, resourceId, finishedAt, startedAt]`.
4. Public catalog: `[status, order]` or `[status, updatedAt]` matching real sort.
5. FKs that are filtered → indexed (alone or leftmost in a composite).
6. Ship via normal migrations; **never rewrite** already-applied production migrations.
7. No speculative indexes on unused columns; do not drop indexes without evidence (e.g. `EXPLAIN`).

```text
❌ New filter on (userId, status, createdAt) with no matching index
✅ Same change adds composite index [userId, status, createdAt]

❌ Import: create() per row in a long transaction
✅ createMany / batched writes
```

**Index DoD**

- [ ] Every new/changed `where`/`orderBy` has a supporting index (or sufficient unique).
- [ ] Migration shipped; client regenerated if needed.
- [ ] Query results / business logic unchanged.

---

## 8. Media & deploy weight

- Serve audio, images, and large static assets from **object storage + CDN URLs**, not from the app deploy bundle or blocking server fetches on navigation.
- Do not embed large media blobs in list/API JSON.

---

## 9. Polling & realtime

- Prefer realtime (WebSocket / SSE / Ably / equivalent) over polling when live updates matter.
- If polling is the fallback: **minimum ~10s** to origin; **never ≤2s** when many clients may be connected.
- When realtime is connected, poll even less often (e.g. ~30s) as a safety net only.
- Live polls must not pull large optional JSON (slides, full transcripts) every tick — use flags / separate detail fetches.

---

## 10. Admin, import, and background work

- Long import/sync/admin jobs stay **off the user hot path** (background job, queue, or intentional long-duration route — not soft-nav).
- Admin reports: lean rows, short cache, aggregate in memory by key — do not hydrate full payloads for charts.
- Prefer batch writes (`createMany`) over N+1 inserts.

---

## 11. Serverless CPU anti-patterns

| Anti-pattern | Prefer |
|---|---|
| Hydrating full content into every catalog/list response | Metadata + counts; detail by id |
| Deep-cloning large cached trees per request | Shallow / immutable cache returns |
| Full payload on history / ranking / admin lists | Lean list mode; full only for one record |
| Recomputing grade / parse / embed on every view | Persist on write; read on view |
| Polling origin every 1–2s | Realtime or ≥10s fallback |
| Auth + DB in shared layout every soft-nav | Client hydrate + TTL |
| Unbounded lists / N+1 loops | `take` + batch + indexes |
| Autosave re-reading full JSON blobs | Path patch / partial update |
| Polling that always includes optional heavy JSON | Flags + separate detail fetch |

---

## 12. Architecture pattern (map to your domain)

Use this split even if names differ:

| Helper / API role | Used for | Constraint |
|---|---|---|
| `listX` / public catalog | Home, dashboards, homework pickers, reports | Slim: **no** body/content columns; process cache + shallow copy |
| `getXBySlug` / by id | Practice, edit, submit, result, queues that need stems | Full sections + content + keys |
| `listAttempts({ lean: true })` (or equivalent) | List UI / reports | Metadata + scores; no answers/highlights/full grade |
| `getAttempt` / save | One record | Full payload |
| `findOpenAttempt` (or equivalent) | Resume unfinished work | Targeted query: user + unfinished + resource |

**Egress tip (managed Postgres free tiers):** loading thousands of child rows only to count them burns transfer. Prefer stored counts; keep polls and autosaves off large JSON columns.

---

## 13. Definition of Done (hot path)

Before merging changes that touch lists, soft-nav, autosave, polling, or serverless handlers:

- [ ] List/catalog responses stay lean (no full content / blobs / answers).
- [ ] No deep clone of large trees on the hot path.
- [ ] Queries use lean select + limit + matching indexes.
- [ ] Expensive results are persisted on write when applicable.
- [ ] Shared layout/shell does not add per-click auth/DB work.
- [ ] Polling is not tightened below the realtime fallback floor (≥10s without realtime).
- [ ] Measured locally when touching hotspots: **handler time + response JSON size** (warm); after deploy, check host usage (e.g. Vercel → Usage → Fluid Active CPU) and DB egress.

---

## 14. Measurement (lightweight)

**Local (warm)**

- Compare catalog/list JSON size before/after (guard against regressions like “list grew back to multi‑MB”).
- Compare lean list vs full single-record payload size.
- Confirm no whole-catalog `structuredClone` on the response path.
- Optional: a small bench script that hits list + lean list + detail and writes before/after snapshots.

**Production**

- Watch serverless CPU and DB egress.
- Spikes usually mean: fat lists, tight polls, deep clones, or recompute-on-read.

**Directional targets (adapt to your product)**

- Catalog/list JSON stays well below the size of “full content for every row”.
- Lean history clearly smaller than full payloads.
- Soft-nav warm server work stays in the tens of ms when cache is warm.

---

## 15. Adoption checklist for a new web app

1. Identify **catalog/list** vs **detail** APIs; strip bodies from lists; add stored counts if needed.
2. Find shared layout/shell; move session/rank/badges to **client TTL** fetch if they run on every soft-nav.
3. Add **lean list mode** for attempts/history/admin reports.
4. Persist expensive compute on write; stop recompute on every view.
5. Cap live polling (≥10s fallback); prefer realtime; strip heavy fields from poll payloads.
6. Audit hot `where`/`orderBy`; add composite indexes in the same change.
7. Move bulk import off the user hot path; use batch inserts.
8. Serve media from CDN/object storage.
9. Add a before/after size + latency check for the hottest list endpoint.
10. Copy §13 DoD into the team’s PR template.

---

## 16. Source mapping (WEWIN IELTS)

This playbook consolidates:

| Source | Focus |
|---|---|
| `docs/FLUID_ACTIVE_CPU.md` | Why CPU/egress spiked; catalog slim; lean attempts; grade persist; anti-patterns |
| `.cursor/rules/fluid-active-cpu.mdc` | Mandatory hot-path contract |
| `.cursor/rules/runtime-performance.mdc` | Soft-nav, ISR, shell hydrate, cache |
| `.cursor/rules/db-index-optimization.mdc` | Index checklist with every model/query change |
| `.cursor/rules/database-standards.mdc` / backend cache notes | Lean select, paging, `unstable_cache` |
| `~/.cursor/rules/web-performance-standards.mdc` | Cross-project portable standard |

Keep project-specific table names, ORM APIs, and route paths out of the **shared** copy of this file when you paste it into another repo — apply the same *behaviors* with that project’s stack.
