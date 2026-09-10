# Deploy Wewin IELTS lên Vercel

## Lưu ý quan trọng (đọc trước)

App hiện dùng **file local** (`data/`, `public/uploads/`) cho đề, attempt, curriculum, upload.

Trên Vercel (serverless):

| Tính năng | Trên Vercel |
|-----------|-------------|
| UI /learn (seed demo) | ✅ Hoạt động (seed trong code) |
| Login admin/học viên | ✅ Nếu cấu hình **MySQL** cloud; ❌ JSON local không bền |
| Import đề / upload audio-video | ⚠️ Không bền / bị chặn — nên import trên máy local hoặc dùng URL video ngoài |
| Drive sync | ✅ Nếu set `GOOGLE_SERVICE_ACCOUNT_JSON` (dán JSON) |
| Luyện đề đã import sẵn | Chỉ còn nếu bạn **commit** JSON demo vào repo hoặc chuyển sang DB |

**Khuyến nghị production:** Neon Postgres (`DATABASE_URL`) + `ALLOW_OPEN_ADMIN=false`. Xem [NEON.md](./NEON.md).

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

## Tiếp theo (nếu dùng lâu dài trên Vercel)

1. MySQL cloud + migrate  
2. Vercel Blob / S3 cho audio & video  
3. Persist đề/attempt/curriculum vào MySQL thay vì JSON file  
