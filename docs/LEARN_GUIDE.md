# Hướng dẫn quản lý bài học (Học 4 kỹ năng)

Admin thêm video + bài tập trên web — không cần sửa JSON thủ công.

## Truy cập

| Trang | URL |
|-------|-----|
| Danh sách bài học | `/admin/learn` |
| Thêm bài mới | `/admin/learn/new` |
| Sửa bài | `/admin/learn/[lessonId]` |
| Trang học viên | `/learn` |

Cần role **ADMIN**. `ALLOW_OPEN_ADMIN=true` chỉ mở admin cho guest (chưa login); học viên đã login vẫn bị chặn.

Sidebar / header admin: **Quản lý bài học** · **Import đề**.

## Thêm một bài học thật (end-to-end)

1. Mở [http://localhost:3000/admin/learn](http://localhost:3000/admin/learn) → **Thêm bài học**.
2. Chọn **kỹ năng** (Listening / Reading / Writing / Speaking).
3. Điền **tiêu đề**, **thứ tự (order)** — số nhỏ hơn mở trước; bài `order = 1` luôn mở khóa.
4. **Video:** upload `.mp4` / `.webm` (lưu vào `public/uploads/learn/videos/`) **hoặc** dán URL video công khai.
5. Thêm **bài tập** (ít nhất 1 câu):
   - **Trắc nghiệm (MCQ)** — mỗi dòng một lựa chọn (`A. …`), đáp án đúng có thể là `A` hoặc nội dung đầy đủ.
   - **Trả lời ngắn** / **Điền từ** — một hoặc nhiều đáp án chấp nhận (cách nhau bằng dấu phẩy).
6. **Tạo bài học** → mở `/learn/[skill]/[id]` để kiểm tra.
7. Học viên: xem hết video (≥95%, không tua nhanh) → làm đúng hết bài tập → mở bài tiếp theo trong cùng kỹ năng.

## Dữ liệu

| Thành phần | Vị trí |
|------------|--------|
| Curriculum | `data/learn/curriculum.json` |
| Tiến độ HV | `data/learn/progress/{owner}.json` |
| Video upload | `public/uploads/learn/videos/` |
| Seed mẫu | `src/lib/learn/seed-content.ts` (fallback khi curriculum trống) |

API (admin-protected):

- `GET/POST /api/admin/learn` — danh sách / tạo / `action=reset-seed`
- `GET/PUT/DELETE /api/admin/learn/[lessonId]`

## Ghi chú

- Xóa hết bài → hệ thống khôi phục seed mẫu.
- Nút **Khôi phục seed** ghi đè toàn bộ curriculum bằng nội dung demo.
- Không ảnh hưởng luồng **Luyện đề** (`/tests`).
- Chi tiết import đề thi: [IMPORT_GUIDE.md](./IMPORT_GUIDE.md).
