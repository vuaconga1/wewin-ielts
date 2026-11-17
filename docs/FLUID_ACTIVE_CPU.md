# Fluid Active CPU — thiết kế & vận hành (WEWIN IELTS)

Tài liệu nền cho rule Cursor `.cursor/rules/fluid-active-cpu.mdc` (always apply). Rule = hợp đồng ngắn; file này = bối cảnh và lý do.

## Bối cảnh

Trên Vercel Hobby, **Fluid Active CPU** của project `wewin-ielts` chiếm phần lớn usage tài khoản (đo ~60% trong 30 ngày, spike sau ~13/11 khi catalog Cambridge phình + homework/worksheets).

Không có Vercel cron. CPU tăng vì **mỗi request** hydrate / clone / lọc dữ liệu lớn, hoặc client poll / soft-nav gọi API lặp.

## Kiến trúc dữ liệu nóng

| API / helper | Vai trò | Ràng buộc |
|---|---|---|
| `listTests` / `listPublicTests` | Catalog, dashboard, homework catalog, reports | Slim: **không** `Question.content`; cache process + `slice()` |
| `getTestBySlug` | Practice, submit, result, Speaking queue | Full sections + questions + keys |
| `listAttempts({ lean: true })` | List UI / báo cáo | Metadata + score/aiScore; không answers/highlights/grade |
| `listAttempts()` / `getAttempt` | Save, một attempt | Full `payload` |
| `findOpenAttempt` | Start practice resume | Query unfinished theo user + slug |

## Vì sao bỏ `content` khỏi catalog

`Question.content` (stem, options, table…) từng chiếm ~1.9 MB / ~2.5 MB catalog (315 đề, ~9k câu). Catalog chỉ cần đếm câu / metadata. Speaking detail vẫn build queue từ `getTestBySlug`.

## Neon egress (network transfer)

Free Neon ~5 GB transfer/tháng. Catalog giờ chỉ lấy `TestSection.questionCount` (không hydrate ~9k Question rows). Autosave practice dùng `jsonb_set` (không đọc full `payload`). Poll lớp học `includeSlides: false`. Lean attempts chỉ lấy `aiScore.overallBand`.

## Lean attempts

`payload` Attempt chứa answers + highlights + grade — nặng khi list hàng trăm dòng. Lean path lấy jsonb từng phần (`score`, `aiScore`, `sectionOrders`, …) qua SQL, bỏ answers. Dashboard / admin reports phải dùng lean.

## Grade persist

`gradeAnswers` chạy regex / pair multi-select trên ~40 câu. Submit đã tính một lần → lưu `StoredAttempt.grade`. Result page không tính lại trừ bài cũ.

## Polling & soft-nav

- Live class không Ably: poll **10s** (trước đây 2s ≈ 30 req/phút/user).
- `/api/homework/incomplete`: cache 60s / userId.
- `/api/auth`, ranking-me: TTL client 60s — không rút ngắn tùy tiện.

## Đo lường

```bash
npx tsx scripts/bench-fluid-cpu-hotspots.ts
```

So snapshot: `scripts/.bench-fluid-cpu-before.json` / `.bench-fluid-cpu-after.json` (local).  
Sau deploy, theo dõi Vercel → Usage → Fluid Active CPU (project `wewin-ielts`).

Mục tiêu định hướng (local, warm):

- Catalog JSON ≲ **1 MB** (không quay lại ~2.5 MB vì load lại `content`)
- `listAttempts({ lean: true })` rõ nhỏ hơn full payload
- Không `structuredClone` toàn catalog

## Anti-patterns (không làm lại)

1. Hydrate Question rows / `content: true` vào catalog “cho tiện Speaking”.
2. `structuredClone(testsCache.data)` khi trả list.
3. `listAttempts({ userId })` rồi linear find open attempt / đọc full `payload` trên autosave.
4. Re-grade trên mọi lần mở result dù đã có `attempt.grade`.
5. Poll presentation ≤2s, hoặc kéo `slides` JSON trên mọi poll.
6. N+1 `question.create` trong import khi `createMany` đủ dùng.
7. Admin attempts: `listAttempts({ lean: true })` global khi Prisma list đã OK (Vercel).

## Liên quan

- Soft-nav / ISR: `.cursor/rules/runtime-performance.mdc`
- Prisma lean select: `.cursor/rules/database-standards.mdc`
- API mỏng + cache: `.cursor/rules/backend-standards.mdc`
