# Plan: Website luyện IELTS (Study4-style)

## 1. Tổng quan sản phẩm

| Mục tiêu | Mô tả |
|----------|--------|
| **Người dùng** | Học viên luyện IELTS (Academic/General) |
| **Admin** | Thêm đề + đáp án **không cần code**, theo format chuẩn |
| **Giao diện làm bài** | Giống Study4: chọn part, giới hạn thời gian, làm full test, review đúng/sai |
| **Nguồn đề mẫu** | [Drive IELTS](https://drive.google.com/drive/folders/1YOq1oW3VXtBo0451f2zD7diEwtMknE9G) |

### Hai cấp độ sản phẩm

| Cấp | Tên | URL | Mô tả |
|-----|-----|-----|--------|
| **A** | Học kiến thức / 4 kỹ năng | `/learn` | Video bài giảng (không tua nhanh) → bài tập nhỏ → mở khóa bài tiếp (UI kiểu F8) |
| **B** | Luyện đề | `/tests` | Catalog đề + practice session + chấm điểm (giữ nguyên flow hiện tại) |

Dữ liệu học: JSON dưới `data/learn/` (`curriculum.json`, `progress/{owner}.json`). Admin CRUD tại `/admin/learn` (upload video → `public/uploads/learn/videos/`, soạn MCQ / short answer / gap fill). Seed demo (`seed-content.ts`) là fallback khi curriculum trống. Tiến độ gắn `user_*` khi đăng nhập hoặc cookie guest.

---

## 2. Tech stack

```
Frontend:     Next.js 15 (App Router) + React 19 + TypeScript
UI:           Tailwind CSS 4 + Lucide icons
Backend:      Route Handlers + Server Actions
ORM:          Prisma 7 + @prisma/adapter-mariadb
Database:     MySQL 8 (cPanel, localhost)
Auth:         Session httpOnly cookie + bcrypt (sau này Google OAuth)
Validation:   Zod
Hosting:      cPanel Node.js hoặc VPS
```

---

## 3. Ưu tiên hiện tại (Phase 1 focus)

**Ổn định luyện tập (autosave, audio, Writing/Speaking) + import đề.** UI public đã polish theo vibe Study4 (landing, empty states, lỗi tiếng Việt).

Thứ tự:
1. Định nghĩa format đề chuẩn + Zod schema
2. Parser (docx / markdown) → cấu trúc trung gian
3. Logic **chia file thành từng Part/Section**
4. Persist vào MySQL (Test → Sections → Questions → AnswerKeys)
5. CLI/script import để kiểm thử ổn định
6. (Sau) Admin upload wizard + UI học viên

---

## 4. Cách chia file thành Part sau khi import

### 4.1 Cấu trúc nguồn (Drive)

```
Test 13/
├── Listening 13.docx   (+ audio .mp3)
├── Reading 13.docx
├── Writing 13.docx
├── keys.docx           (đáp án chung hoặc theo skill)
└── Speaking/…          (topic theo part)
```

Mỗi **file skill** = 1 **Test** (hoặc 1 skill trong bộ đề). Bên trong file được chia thành nhiều **Part** (= `TestSection`).

### 4.2 Quy ước marker trong nội dung

Parser tìm các heading / marker chuẩn:

| Marker | Ý nghĩa |
|--------|---------|
| `## PART: <tên>` hoặc `## Section N` / `## Passage N` | Bắt đầu một Part mới |
| `### Q<n> [type]` | Một câu hỏi thuộc Part hiện tại |
| `answer:` / block trong `keys` | Đáp án gắn với `Qn` |

Ví dụ Listening:

```markdown
## PART: Section 1 - Accommodation
audioStart: 00:00

### Q1 [gap_fill]
The student wants a ___ room.
answer: single

### Q2 [multiple_choice]
...
answer: B

## PART: Section 2 - Museum tour
...
```

→ Sau import:

| Part (TestSection) | Questions |
|--------------------|-----------|
| Section 1 - Accommodation | Q1, Q2, … |
| Section 2 - Museum tour | … |
| Section 3 | … |
| Section 4 | … |

### 4.3 Pipeline import (logic)

```
Upload ZIP / folder / file
        │
        ▼
┌───────────────────┐
│ 1. Detect skill   │  từ tên file (Listening|Reading|Writing|Speaking)
│    + metadata     │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 2. Extract text   │  docx → markdown/plain (mammoth)
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 3. Split parts    │  cắt theo ## PART / Section / Passage
│                   │  mỗi block = 1 PartDraft { title, order, raw }
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 4. Parse questions│  trong mỗi Part: ### Qn [type] + stem + options
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 5. Merge keys     │  map Qn từ keys.docx nếu đáp án không inline
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 6. Zod validate   │  thiếu part / thiếu answer / type sai → báo lỗi
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 7. Persist DB     │  Test → TestSection(s) → Question(s) → AnswerKey
│                   │  + MediaAsset (audio)
└───────────────────┘
```

### 4.4 Mapping DB

```
Test                (1 đề / 1 skill file)
 └── TestSection    (Part: Section 1, Passage 2, Topic "Headphones"…)
      └── Question  (Qn, type, content JSON)
           └── AnswerKey
```

Học viên sau này:
- **Luyện tập:** chọn checkbox từng `TestSection`
- **Full test:** lấy tất cả sections theo `order`

### 4.5 Fallback nếu file chưa có marker PART

1. Listening: tự chia theo `Section 1..4` nếu có trong text
2. Reading: tự chia theo `Passage 1..3` / `Reading Passage`
3. Writing: Task 1 / Task 2
4. Speaking: mỗi heading topic = 1 part
5. Nếu không detect được → 1 part duy nhất `"Full test"` + toàn bộ câu hỏi (vẫn import được, admin sửa sau)

---

## 5. Database schema (tóm tắt)

```
User, Test, TestSection, Question, AnswerKey,
Attempt, AttemptAnswer, MediaAsset, ImportJob
```

Chi tiết nằm trong `prisma/schema.prisma`.

---

## 6. Các phase

| Phase | Nội dung | Trạng thái |
|-------|----------|------------|
| **0** | Scaffold Next.js + Prisma + MySQL adapter | Xong |
| **1** | Import engine: parse → split parts → validate → DB | Xong |
| **1.5** | Stabilize import + batch/ZIP + audio upload | **Xong** |
| **2** | Catalog + test detail UI (Study4-like) + practice polish | **Xong** |
| **3** | Auth (session/bcrypt) + MySQL path + attempts history | **Xong** |
| **3.5** | Review + scoring (MVP Listening/Reading) | **Xong** |
| **4** | Real practice UX: autosave, resume, audio clip, reading layout | **Xong** |
| **5** | Writing / Speaking (prompt + nộp bài, không chấm AI) | **Xong** |
| **6a** | Google Drive sync (service account → import pipeline) | **Xong (v1)** |
| **6b** | Polish UI Study4 (landing/empty/errors) + OAuth học viên, deploy | UI polish **xong**; OAuth/deploy sau |
| **6c** | Admin CRUD bài học `/admin/learn` (video + exercises) | **Xong** |

---

## 7. Admin workflow (mục tiêu)

### 7a. Học 4 kỹ năng (`/admin/learn`)

1. Mở `/admin/learn` → Thêm / sửa / xóa bài theo skill
2. Upload video (hoặc URL) + soạn bài tập → lưu `curriculum.json`
3. Học viên học trên `/learn` (anti-skip video → bài tập → mở khóa bài tiếp)
4. Chi tiết: [LEARN_GUIDE.md](./LEARN_GUIDE.md)

### 7b. Import đề luyện tập (`/admin/import`)

1. Soạn đề theo template (Google Docs / Markdown) — **keys phải là text**, không screenshot
2. Đặt folder Drive: `Listening.docx` + `keys.docx` + audio (share với service account)
3. Import: `/admin/import` upload ZIP **hoặc** **Đồng bộ Google Drive** (`POST /api/admin/drive/sync`)
4. Hệ thống split Part → Question → Answer (local JSON; tuỳ chọn MySQL)
5. Publish → học viên làm theo part

---

## 8. Dung lượng DB (tham khảo)

Vài trăm đề: MySQL ~**50–300 MB** (text). Audio lưu file riêng (~GB).

---

## 9. Rủi ro

| Rủi ro | Giảm thiểu |
|--------|------------|
| Format Google Docs không đồng nhất | Template + Zod validate bắt buộc |
| Docx phức tạp | Phase 1: text + marker; ảnh sau |
| Không có marker PART | Heuristic Section/Passage + fallback 1 part |
