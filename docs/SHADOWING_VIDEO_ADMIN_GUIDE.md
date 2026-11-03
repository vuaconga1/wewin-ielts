# Hướng Dẫn Quản Trị & Nhập Video Shadowing (Wewin IELTS)

Tài liệu hướng dẫn quy trình tạo bài học Shadowing từ video YouTube bằng công cụ tự động miễn phí, duyệt transcript, bổ sung phiên âm IPA, bản dịch tiếng Việt và xuất bản lên hệ thống.

---

## 1. Tổng quan quy trình

Quy trình nhập và xuất bản bài học gồm 4 bước đơn giản:

```
[1. Nhập video tự động] ──▶ [2. Điền IPA & Dịch câu] ──▶ [3. Căn chỉnh Karaoke] ──▶ [4. Xuất bản]
      (yt-dlp + R2)             (Admin UI / Script)          (stable-ts CPU)           (Live Web)
```

- **Chi phí API:** 0 đ (hoàn toàn chạy máy tính cục bộ và sử dụng CMUdict + Whisper CPU miễn phí).
- **Lưu trữ:** Video (H.264 720p) và Audio (MP3 128kbps) được tự động nén và tải lên Cloudflare R2 (không tốn dung lượng máy chủ Vercel).

---

## 2. Nhập video mới từ YouTube (Dành cho 29 link tiếp theo)

### 2.1. Cài đặt môi trường một lần duy nhất (One-time Setup)
Nếu máy bạn đã chạy thử bài mẫu, môi trường đã sẵn sàng. Nếu ở máy mới:
1. Đã cài Python 3.10+ và Node.js 18+.
2. Khởi tạo môi trường ảo Python căn chỉnh:
   ```powershell
   python -m venv .venv-align
   .venv-align\Scripts\python -m pip install --index-url https://download.pytorch.org/whl/cpu torch torchaudio
   .venv-align\Scripts\python -m pip install -e ./stable-ts-main faster-whisper imageio-ffmpeg
   ```

### 2.2. Lệnh nhập 1 video bất kỳ
Chạy lệnh sau trên PowerShell (thay link YouTube, slug và level mong muốn):

```powershell
npx tsx scripts/shadowing-import-video.ts --url "<YOUTUBE_URL>" --slug <bai-hoc-slug> --level B1 --publish
```

**Các tham số:**
- `--url`: Link YouTube video (ví dụ: `https://www.youtube.com/watch?v=...`).
- `--slug`: Mã định danh URL (chữ thường, gạch nối, ví dụ: `my-stroke-of-insight`, `ted-steve-jobs`).
- `--title`: *(Tùy chọn)* Tiêu đề hiển thị. Nếu không truyền, hệ thống tự động lấy tiêu đề gốc của YouTube.
- `--level`: Trình độ IELTS (`A2`, `B1`, `B2`, `C1`).
- `--publish`: *(Tùy chọn)* Xuất bản ngay (`PUBLISHED`). Bỏ cờ này nếu muốn lưu nháp (`DRAFT`).
- `--whisper-model`: Mặc định `base.en`. Nếu muốn nhận diện chuẩn xác hơn cho video nói nhanh: dùng `--whisper-model small.en`.
- `--dry-run`: Chạy thử tải và kiểm tra, không upload R2 và không ghi Database.

### 2.3. Mẹo xử lý nhanh cho 29 video tiếp theo
Bạn có thể chuẩn bị sẵn danh sách các lệnh chạy nối tiếp nhau trong PowerShell hoặc file `.bat` / `.ps1`:

```powershell
npx tsx scripts/shadowing-import-video.ts --url "https://www.youtube.com/watch?v=LINK_1" --slug bai-hoc-01 --level B1 --publish
npx tsx scripts/shadowing-import-video.ts --url "https://www.youtube.com/watch?v=LINK_2" --slug bai-hoc-02 --level B2 --publish
npx tsx scripts/shadowing-import-video.ts --url "https://www.youtube.com/watch?v=LINK_3" --slug bai-hoc-03 --level C1 --publish
```

---

## 3. Quản lý Phiên âm IPA & Bản dịch tiếng Việt

Sau khi nhập video, truy cập trang quản trị admin:
`http://localhost:3000/admin/shadowing` (hoặc trên trang production: `/admin/shadowing`).

Bấm **Sửa / Bài nộp** tại bài học tương ứng. Ngay dưới ô Transcript là bảng **Phiên âm IPA & Bản dịch theo câu**:

### Cách 1: Thao tác trực tiếp trên giao diện Admin
1. **Điền IPA tự động:**
   - Bấm nút **[ Điền IPA tự động ]**.
   - Hệ thống dùng từ điển ngữ âm chuẩn CMU Pronouncing Dictionary chuyển đổi toàn bộ câu sang ký hiệu IPA quốc tế trong vài giây.
   - Những câu bạn đã tự sửa tay sẽ không bị ghi đè.
2. **Dán bản dịch tiếng Việt hàng loạt:**
   - Bấm nút **[ Dán bản dịch hàng loạt ]**.
   - Dán toàn bộ bản dịch (mỗi dòng tương ứng 1 câu theo thứ tự).
   - Hệ thống đếm và khớp từng câu, báo số lượng câu đã có bản dịch.
3. Bấm **Lưu thay đổi** ở cuối trang.

### Cách 2: Sử dụng Script xuất/nhập file JSON (Tiện lợi khi dịch hàng loạt)
```powershell
# 1. Xuất transcript và IPA ra file JSON
npx tsx scripts/shadowing-annotations.ts --slug <slug> --export tmp/<slug>.json

# 2. Bạn điền hoặc dịch trường "translation" trong file tmp/<slug>.json

# 3. Nhập ngược lại vào cơ sở dữ liệu
npx tsx scripts/shadowing-annotations.ts --slug <slug> --import tmp/<slug>.json

# 4. Tự động điền nốt các câu chưa có IPA
npx tsx scripts/shadowing-annotations.ts --slug <slug> --fill-ipa
```

---

## 4. Căn chỉnh Mốc thời gian & Karaoke từng từ (Cues v2)

- Khi nhập video bằng `scripts/shadowing-import-video.ts`, hệ thống đã tự động chạy căn chỉnh cues phiên bản 2 (kèm mốc thời gian từng từ).
- **Lưu ý quan trọng:** Nếu trong quá trình duyệt bài, bạn có **chỉnh sửa câu chữ trong ô transcript**, mốc thời gian cũ sẽ bị lệch.
- Khi đó, hệ thống Admin sẽ hiện hộp cảnh báo màu vàng kèm sẵn lệnh cần chạy:
  ```powershell
  npx tsx scripts/shadowing-cues.ts --slug <slug>
  ```
- Chạy lệnh trên xong, tải lại trang Admin cảnh báo sẽ tự động biến mất.

Để căn chỉnh lại toàn bộ tất cả bài học trong hệ thống:
```powershell
npx tsx scripts/shadowing-cues.ts --all
```

---

## 5. Kiểm tra bài học trên trang học viên

1. Mở trang học viên:
   `http://localhost:3000/learn/shadowing/<slug>`
2. Kiểm tra các tính năng nâng cao:
   - **Video Player:** Video chạy mượt, có phụ đề karaoke chữ sáng theo từng từ.
   - **Thẻ câu 3 tầng:** Câu tiếng Anh, phiên âm IPA màu xám, nút "Xem nghĩa" hoặc toggle "Dịch" để hiện tiếng Việt.
   - **Chế độ Luyện từng câu:** Ghi âm thử 1 câu, xem hệ thống chấm điểm trực tiếp tại client, từ đúng màu xanh, từ sai màu đỏ, nghe lại giọng đọc của mình.
   - **Chế độ Shadow tự động:** Bấm **[ ✨ Shadow tự động ]**, nghe xong câu mic tự bật để đọc, đọc xong tự chuyển câu tiếp theo.
   - **Thanh điều khiển nổi ở đáy:** Trên điện thoại / màn hình nhỏ, thanh điều khiển nổi cố định dưới chân trang, không bị che nội dung, có phím tắt: Space (phát/dừng), mũi tên trái/phải (đổi câu), R (nghe lại), M (bật/tắt micro).

