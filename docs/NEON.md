# Neon Postgres (Wewin IELTS)

App dùng **Neon** (PostgreSQL) + `@prisma/adapter-neon`.

## 1. Tạo project Neon

1. https://console.neon.tech → New Project → tên `wewin-ielts`
2. Copy **Connection string** (pooled, có `sslmode=require`)

Hoặc CLI (sau `npx neonctl auth`):

```bash
npx neonctl projects create --name wewin-ielts --output json
npx neonctl connection-string --project-id <ID> --pooled
```

## 2. Local `.env`

```env
DATABASE_URL="postgresql://...@ep-....neon.tech/neondb?sslmode=require"
SESSION_SECRET="..."
ALLOW_OPEN_ADMIN="false"
```

```bash
npx prisma db push
npm run seed:admin
```

Login: `admin@wewin.local` / `change-me`

## 3. Vercel

Settings → Env → set `DATABASE_URL` (Production) → Redeploy.

Xóa các `DATABASE_HOST` / `DATABASE_USER` / MySQL cũ nếu còn.
