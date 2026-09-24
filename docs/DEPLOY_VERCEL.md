# Deploy Wewin IELTS lên Vercel

## Lưu ý quan trọng (đọc trước)

App hiện dùng **file local** (`data/`, `public/uploads/`) cho đề, attempt, curriculum, upload local.

Trên Vercel (serverless):

| Tính năng | Trên Vercel |
|-----------|-------------|
| UI /learn (seed demo) | ✅ Hoạt động (seed trong code) |
| Login admin/học viên | ✅ Nếu cấu hình **Neon Postgres**; ❌ JSON local không bền |
| Listening audio / writing diagrams | ✅ Qua **Cloudflare R2** (`R2_PUBLIC_BASE_URL`) — không ship mp3 trong deploy |
| Import đề / upload audio-video | ⚠️ Không bền trên Vercel FS — import local rồi `media:upload-r2` |
| Drive sync | ✅ Nếu set `GOOGLE_SERVICE_ACCOUNT_JSON` (dán JSON) |
| Luyện đề đã import sẵn | ✅ JSON demo trong repo + Neon; audio từ R2 |

**Khuyến nghị production:** Neon Postgres (`DATABASE_URL`) + R2 media + `ALLOW_OPEN_ADMIN=false`. Xem [NEON.md](./NEON.md) và mục Cloudflare R2 bên dưới.

---

## Cách 1 — Deploy nhanh bằng Vercel CLI (máy bạn)

### 1. Đăng nhập Vercel

```bash
npx vercel login
```

Mở link trong trình duyệt, xác nhận.

### 2. Deploy (thư mục project)

```bash
cd e:\Wewin\Wewin-ielts
npx vercel
```

Lần đầu: tạo project, chọn scope, confirm.

Production:

```bash
npx vercel --prod
```

### 3. Env trên Vercel Dashboard

**Project → Settings → Environment Variables** (Production + Preview):

| Key | Giá trị gợi ý |
|-----|----------------|
| `SESSION_SECRET` | Chuỗi ngẫu nhiên ≥ 32 ký tự |
| `ALLOW_OPEN_ADMIN` | `false` (production) hoặc `true` để mở admin tạm |
| `DATABASE_URL` | Neon Postgres connection string (`?sslmode=require`) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | (tuỳ chọn) dán **nguyên JSON** service account |
| `R2_PUBLIC_BASE_URL` | **Bắt buộc cho Listening trên prod** — CDN public URL (xem mục R2 bên dưới) |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | Chỉ cần trên máy local khi chạy `npm run media:upload-r2` (không bắt buộc trên Vercel nếu chỉ đọc CDN) |

Sau khi đổi env → **Redeploy**.

### 4. Seed admin (khi đã có MySQL)

Trên máy local (trỏ `.env` vào cùng DB cloud):

```bash
npx prisma db push
npm run seed:admin
```

Login: `admin@wewin.local` / `change-me` (đổi ngay).

Nếu **chưa có MySQL**: bật `ALLOW_OPEN_ADMIN=true` tạm để vào `/admin` (không an toàn cho public).

---

## Cách 2 — GitHub → Vercel (khuyến nghị lâu dài)

1. Tạo repo GitHub, push code (không commit `.env`, `secrets/`, `data/`).
2. [vercel.com/new](https://vercel.com/new) → Import repo.
3. Framework: Next.js (auto).
4. Thêm Environment Variables như trên.
5. Deploy.

---

## Build đã cấu hình sẵn

- `postinstall`: `prisma generate`
- `build`: `prisma generate && next build`
- `vercel.json`: buildCommand tương ứng

---

## Checklist sau deploy

- [ ] Mở URL `*.vercel.app`
- [ ] `/learn` hiện 4 kỹ năng (seed)
- [ ] Login / admin (MySQL hoặc `ALLOW_OPEN_ADMIN`)
- [ ] Không expect upload file bền trên Vercel

---

## Cloudflare R2 (Listening audio + writing/images)

Vercel Hobby không chứa ~1GB mp3. Media production phục vụ từ **R2 public URL**; local `npm run dev` vẫn dùng `public/uploads/...` khi **không** set `R2_PUBLIC_BASE_URL`.

### 1. Tạo bucket + public access (Cloudflare Dashboard)

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 Object Storage** → **Create bucket**  
   Tên gợi ý: `wewin-ielts-media`
2. **Account ID**: trang overview R2 (sidebar phải) hoặc URL dashboard — cần cho `R2_ACCOUNT_ID`.
3. Mở bucket → **Settings**:
   - **Khuyến nghị:** **Custom Domains** → gắn `media.your-domain.com`
   - **Hoặc nhanh:** bật **Public access** → Allow Access trên subdomain `pub-….r2.dev`
4. CORS (browser `<audio>` / `<img>` GET/HEAD): bucket → **Settings → CORS policy**, ví dụ thu hẹp origin:

```json
[
  {
    "AllowedOrigins": [
      "https://wewin-ielts-zeta.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 86400
  }
]
```

(Thêm domain custom của bạn vào `AllowedOrigins` nếu có. Dev tạm có thể dùng `["*"]`.)

### 2. API token (chỉ để upload từ máy local)

1. R2 → **Manage R2 API Tokens** → **Create API token**
2. Quyền: **Object Read & Write** trên bucket `wewin-ielts-media`
3. Copy: **Access Key ID**, **Secret Access Key** (+ **Account ID** từ bước 1)

### 3. Env local (`.env` — không commit)

Không có trailing slash ở `R2_PUBLIC_BASE_URL`:

```env
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="wewin-ielts-media"
R2_PUBLIC_BASE_URL="https://media.your-domain.com"
# hoặc: R2_PUBLIC_BASE_URL="https://pub-xxxxxxxx.r2.dev"
```

### 4. Upload media một lần (audio + ảnh cùng script)

```bash
npm run media:upload-r2
# ghi đè object đã có:
npm run media:upload-r2 -- --force
```

Script đẩy **cùng bucket**:

| Thư mục local | Object key trên R2 |
|---------------|--------------------|
| `public/uploads/audio/**` | `uploads/audio/...` |
| `public/uploads/writing/**` (diagram Writing) | `uploads/writing/...` |
| `public/uploads/images/**` (map Listening, v.v.) | `uploads/images/...` |

Object đã tồn tại thì skip (trừ `--force`). **Không** upload `avatars/` hay `learn/videos/` — hai thư mục đó cũng bị loại khỏi deploy (`.vercelignore`).

### 5. Env trên Vercel

**Project → Settings → Environment Variables** (Production) — thêm ít nhất:

| Key | Ghi chú |
|-----|---------|
| `R2_PUBLIC_BASE_URL` | **Cùng giá trị** local, **không** trailing slash — app rewrite `/uploads/...` → CDN |

Secret R2 (`R2_ACCOUNT_ID` / keys) chỉ cần trên máy khi chạy upload; không bắt buộc trên Vercel nếu chỉ đọc CDN. Redeploy sau khi set.

### 6. Hình ảnh trên Vercel (Hobby)

- **Audio:** `.vercelignore` loại hết `public/uploads/audio/*` → **bắt buộc** R2 + `R2_PUBLIC_BASE_URL`.
- **Writing diagrams + Listening maps:** vẫn **có thể** vào artifact deploy (các dòng ignore đang comment). Khi set `R2_PUBLIC_BASE_URL`, app (`mediaUrl`) rewrite `/uploads/...` sang R2 — browser lấy từ CDN dù file nhỏ còn trong deploy.
- **Một lần** `npm run media:upload-r2` đủ cho audio + ảnh practice; không cần pipeline ảnh riêng.
- Sau khi R2 đã đầy, có thể bỏ comment trong `.vercelignore` để cũng loại `writing/*` / `images/*` khỏi deploy (tiết kiệm size).

### 7. Verify

1. Mở Listening / Writing practice trên `*.vercel.app`
2. DevTools → Network → `.mp3` / diagram `.png`
3. Host phải là domain R2 (`media.…` hoặc `pub-….r2.dev`), **không** phải `*.vercel.app/uploads/audio/...`
4. Local **không** set `R2_PUBLIC_BASE_URL` → vẫn dùng `public/uploads`

---

## Tiếp theo (nếu dùng lâu dài trên Vercel)

1. Neon Postgres + migrate (đã khuyến nghị ở trên)
2. R2 cho audio & diagrams (mục trên)
3. Persist đề/attempt/curriculum vào DB thay vì JSON file (đã một phần trên Neon)
