# Wewin IELTS

Website luyện IELTS (Study4-style). Import đề → chia Part → luyện tập → chấm điểm.

## Hai cấp độ

| Cấp | Tên | URL | Dành cho |
|-----|-----|-----|----------|
| **A · Học kiến thức** | Học 4 kỹ năng | `/learn` | Xem video bài giảng (không tua nhanh), làm bài tập nhỏ, mở khóa bài tiếp theo |
| **B · Luyện đề** | Catalog đề thi | `/tests` | Luyện đề Listening / Reading / Writing / Speaking như flow hiện tại |

Sidebar dashboard: **Trang chủ** → **Học 4 kỹ năng** → **Luyện đề** → **Tiến độ**.

## Docs

- [Plan tổng thể](docs/PLAN.md)
- [Hướng dẫn format import](docs/IMPORT_GUIDE.md)
- [Quản lý bài học (Học 4 kỹ năng)](docs/LEARN_GUIDE.md)
- [Deploy Vercel](docs/DEPLOY_VERCEL.md)

## Quick start

```bash
npm install
cp .env.example .env   # chỉnh MySQL + SESSION_SECRET (hoặc giữ placeholder nếu chưa có MySQL)
npx prisma generate    # cần khi dùng MySQL
npx prisma db push     # khi MySQL đã chạy + DATABASE_* thật
npm run seed:admin     # admin@wewin.local / change-me (MySQL hoặc data/users.json)
```

### Persist path (MySQL vs local JSON)

| Tình huống | Hành vi |
|------------|---------|
| Preview / luyện tập | **Luôn** lưu `data/tests/*.json` (không cần DB) |
| Login / seed admin | MySQL nếu `DATABASE_*` OK; không thì `data/users.json` |
| Nút "Lưu vào MySQL" | Ghi Prisma khi `DATABASE_*` OK |
| MySQL down / placeholder `USER`/`PASSWORD` | Import + login local; persist MySQL trả lỗi rõ ràng |

**Chưa có MySQL (Windows):** không cần cài ngay — chạy `npm run seed:admin` rồi login. Khi sẵn sàng: cài MySQL/XAMPP, sửa `.env` (thay `USER`/`PASSWORD`), `npx prisma db push`, `npm run seed:admin` lại.

Đặt `ALLOW_OPEN_ADMIN=true` trong `.env` để mở `/admin/*` **khi chưa login** (guest) lúc dev. Tài khoản **STUDENT đã đăng nhập vẫn bị chặn**. Production: `false` + seed admin.

## Vai trò: Khách · Học viên · Admin

| | **Khách** (chưa login) | **Học viên** (`STUDENT`) | **Admin** (`ADMIN`) |
|--|------------------------|--------------------------|---------------------|
| Trang chủ `/` | ✓ | ✓ | ✓ |
| Học `/learn` (tiến độ cookie guest) | ✓ | ✓ (tiến độ theo userId) | ✓ |
| Luyện đề `/tests`, `/practice` | ✓ (attempt local) | ✓ | ✓ |
| Lịch sử `/account/attempts` | ✗ → `/login` | ✓ | ✓ |
| `/admin/import`, `/admin/learn`, Drive sync | ✗ | ✗ → `/forbidden` | ✓ |
| UI | **Đăng nhập**; sidebar **Khách** | Tên + **Đăng xuất**; không link admin | + **Import đề** / **Quản lý bài học** |

**Mặc định admin:** sau `npm run seed:admin` → `admin@wewin.local` / `change-me` (đổi `ADMIN_PASSWORD` trước production).

**Đăng ký học viên:** `/login` → tab **Đăng ký học viên** → `POST /api/auth/register` (luôn tạo `STUDENT`, MySQL hoặc `data/users.json`).

**`ALLOW_OPEN_ADMIN`:** `true` (dev) chỉ mở `/admin/**` và `/api/admin/**` cho **guest** (không session). Học viên đã login **không** được vào admin. Production phải `false` — middleware + layout + API dùng `canAccessAdmin` / `requireAdminResponse` (`src/lib/auth/permissions.ts`).

### Xem trên web

```bash
npm run dev
```

| Trang | URL |
|-------|-----|
| Trang chủ | http://localhost:3000 |
| Học 4 kỹ năng | http://localhost:3000/learn |
| Lộ trình theo skill | http://localhost:3000/learn/listening (…/reading, writing, speaking) |
| Bài học + video | http://localhost:3000/learn/listening/lis-01 |
| Login / Đăng ký học viên | http://localhost:3000/login |
| Không có quyền (403) | http://localhost:3000/forbidden |
| Import đề (ADMIN) | http://localhost:3000/admin/import |
| Quản lý bài học (ADMIN) | http://localhost:3000/admin/learn |
| Drive sync API | `POST /api/admin/drive/sync` (cùng trang import) |
| Luyện đề | http://localhost:3000/tests |
| Chi tiết + bắt đầu | http://localhost:3000/tests/[slug] |
| Làm bài | http://localhost:3000/practice/[attemptId] |
| Kết quả | http://localhost:3000/practice/[attemptId]/result |
| Lịch sử (đã login) | http://localhost:3000/account/attempts |

**Học 4 kỹ năng (test nhanh):** Mở `/learn/listening/lis-01` → thử kéo thanh tiến độ phía trước (bị chặn) → xem hết video (~15s sample) → làm MCQ/gap → nộp đúng hết → bài `lis-02` mở khóa. Tiến độ lưu `data/learn/progress/`.

**Thêm bài học thật (ADMIN):** `/admin/learn` → Thêm bài học → upload video + soạn bài tập → lưu. Chi tiết: [LEARN_GUIDE.md](docs/LEARN_GUIDE.md).

**Flow test:** Import (Preview) → tự lưu local → mở link luyện tập → chọn part → nộp bài → xem đúng/sai + band.

**Audio:** Upload `.mp3` cùng Listening (hoặc trong ZIP batch) → player trên trang practice.

**Google Drive sync:** Service account + folder shared Viewer. Đặt `GOOGLE_SERVICE_ACCOUNT_JSON` (path tới JSON) và (tuỳ chọn) `GOOGLE_DRIVE_FOLDER_ID`. Trên `/admin/import` dán URL `https://drive.google.com/drive/folders/FOLDER_ID` → **Đồng bộ**. Chi tiết: [IMPORT_GUIDE.md](docs/IMPORT_GUIDE.md#google-drive-sync-service-account). **Keys phải là text** (không screenshot).

**Auth:** `npm run seed:admin` rồi `/login` với `admin@wewin.local` / `change-me` (đổi `ADMIN_PASSWORD` trước production). Học viên: tab **Đăng ký học viên** trên cùng trang. Không có MySQL → seed/register ghi `data/users.json`.

### Import thử (CLI, không cần DB)

```bash
npm run import:test -- --file templates/sample-listening.md
```

### Persist vào MySQL

```bash
npm run import:test -- --file templates/sample-listening.md --persist
```

## Cấu trúc import

```
src/lib/import/
  split-parts.ts      # cắt file → Parts
  parse-questions.ts  # trong mỗi Part → Questions
  parse-keys.ts       # merge đáp án từ keys
  batch.ts            # ZIP / multi-file
  audio.ts            # lưu mp3 → public/uploads/audio
  pipeline.ts         # orchestration + Zod
  persist.ts          # ghi DB
src/lib/google-drive/
  client.ts           # service account + Drive API
  sync.ts             # list/download → parseBatchFiles
```
