# BÁO CÁO IMPORT VÀ ĐỐI CHIẾU LAYOUT BỘ ĐỀ CAMBRIDGE IELTS 16
================================================================

- **Thời gian thực hiện:** 2026-11-18
- **Bộ đề gốc:** Cambridge IELTS 16 Academic (Tests 1–4 trong sách)
- **Tên & Slug trên hệ thống:**
  - Test 1: `test-35-listening` / `test-35-reading` (Tiêu đề: `Test 35.C16.01 - Listening` / `Test 35.C16.01 - Reading`)
  - Test 2: `test-36-listening` / `test-36-reading` (Tiêu đề: `Test 36.C16.02 - Listening` / `Test 36.C16.02 - Reading`)
  - Test 3: `test-37-listening` / `test-37-reading` (Tiêu đề: `Test 37.C16.03 - Listening` / `Test 37.C16.03 - Reading`)
  - Test 4: `test-38-listening` / `test-38-reading` (Tiêu đề: `Test 38.C16.04 - Listening` / `Test 38.C16.04 - Reading`)
- **Trạng thái (Status):** `PUBLISHED` (đã kích hoạt và sẵn sàng phục vụ học viên trên production).
- **Phân loại (ExamType):** `ACADEMIC`.

---

## 1. Xử lý file PDF & Tài nguyên

1. **Phân đoạn PDF (Split <= 40 trang):**
   - File gốc: `docs/cambridge_16/C61.pdf` (143 trang).
   - Đã chia thành các tệp $\le 40$ trang lưu tại `docs/cambridge_16_split/fixed_40_pages/`:
     - `Cambridge_16_Part1_Trang_001-040.pdf`
     - `Cambridge_16_Part2_Trang_041-080.pdf`
     - `Cambridge_16_Part3_Trang_081-120.pdf`
     - `Cambridge_16_Part4_Trang_121-143.pdf`
   - Đã chia theo phân đoạn logic nghiệp vụ lưu tại `docs/cambridge_16_split/`:
     - `Cambridge_16_Part1_Trang_001-032_Intro_Test1.pdf`
     - `Cambridge_16_Part2_Trang_033-055_Test2.pdf`
     - `Cambridge_16_Part3_Trang_056-076_Test3.pdf`
     - `Cambridge_16_Part4_Trang_077-098_Test4.pdf`
     - `Cambridge_16_Part5_Trang_099-121_Audioscripts.pdf`
     - `Cambridge_16_Part6_Trang_122-143_AnswerKeys_WritingSample.pdf`

2. **Audio Listening (16/16 section):**
   - Trích xuất từ `docs/cambridge_16/Audio.zip` và chuẩn hóa gắn tại:
     - `public/uploads/audio/test-35-section-{1..4}.mp3`
     - `public/uploads/audio/test-36-section-{1..4}.mp3`
     - `public/uploads/audio/test-37-section-{1..4}.mp3`
     - `public/uploads/audio/test-38-section-{1..4}.mp3`
   - Đầy đủ 16/16 file MP3, không thiếu section nào.

3. **Hình ảnh Media (4/4 ảnh sạch 100% không watermark):**
   - Đã trích xuất gốc từ PDF ở độ nét cao, cắt viền câu hỏi, xử lý xóa sạch hoàn toàn các watermark ngoài lề:
     - `public/uploads/images/test-35-map.png` (Test 35 L-S2: Stevenson's site plan A–H)
     - `public/uploads/images/test-36-white-horse.png` (Test 36 R-P1: The White Horse of Uffington)
     - `public/uploads/images/test-38-map.png` (Test 38 L-S2: Recreation ground map A–I)
     - `public/uploads/images/test-38-diagram.png` (Test 38 R-P1: Persian Qanat & Roman Shaft)

---

## 2. Kết quả Đối chiếu Đáp án (Verification)

Toàn bộ 320 câu hỏi của 8 đề thi đã được đối chiếu 100% với trang Đáp án chính thức trong sách Cambridge 16 (trang 121–128) qua script tự động `scripts/verify_cambridge_16.py`.

```text
Checked 320 questions across available tests.
>>> ALL CHECKED ANSWERS MATCH THE OFFICIAL BOOK KEYS 100%! ZERO DISCREPANCIES! <<<
```

- Bổ sung đầy đủ các cách viết tương đương hợp lệ trong `acceptableAnswers`:
  - Từ nối / gạch nối / số từ: ví dụ `movie / film`, `practice / practise`, `ten / 10 days`, `humans / people`, `microorganisms / micro-organisms`, `mustard / mustard plant(s)`, `spice / spices`, `balance / balancing`, `colony / settlement`.
  - Ngày tháng & giá trị tiền tệ: ví dụ `28th` / `28`, `550` / `£550`, `199` / `$199`.
  - Cặp câu chọn 2 đáp án (`Choose TWO letters`) đều hỗ trợ `acceptableAnswers` chéo nhau để hệ thống chấm điểm không phụ thuộc vào thứ tự học viên nhập.

---

## 3. Kiểm tra Schema & Cấu trúc Dữ liệu

Đã chạy kiểm tra tự động qua `scripts/validate_cambridge_16.ts`:
- **Zod ParsedTestDraftSchema:** Hợp lệ 100%.
- **QuestionContentSchema:** Hợp lệ 100%.
- **Số lượng câu hỏi:** Đủ 40 câu/đề, liên tục từ Q1 đến Q40 không nhảy số, không trùng số.
- **Order thuộc tính:** Contiguous từ 0 đến 39.
- **Tùy chọn trắc nghiệm / nối:** Tất cả các câu `MULTIPLE_CHOICE`, `MATCHING`, `TRUE_FALSE_NG` đều có `options` chứa nhãn khớp chính xác với `correctAnswer`.
- **Tài nguyên Media:** 16/16 file audio và 4/4 ảnh media đều tồn tại thực tế trên ổ cứng tại thư mục `public/`.
- **Kết quả:** `0 errors, 0 warnings`.

---

## 4. Xác nhận Trên Cơ Sở Dữ Liệu Production (Neon PostgreSQL)

Đã chạy `npx tsx scripts/upsert-tests-from-json.ts --only test-35,test-36,test-37,test-38` và kiểm tra lại qua `scripts/check_cambridge_16_db.ts`:

- `test-35-listening` | id=`cmwkkgoh70001n7zli0ff4b4s` | status=`PUBLISHED` | 4 sections | 40 questions
- `test-35-reading`   | id=`cmwkkgp1m0007n7zlw0dyf7ux` | status=`PUBLISHED` | 3 sections | 40 questions
- `test-36-listening` | id=`cmwlx8z5g000a73zl41vgolwc` | status=`PUBLISHED` | 4 sections | 40 questions
- `test-36-reading`   | id=`cmwlx8zo6000g73zl6qt9eolw` | status=`PUBLISHED` | 3 sections | 40 questions
- `test-37-listening` | id=`cmwlx903o000l73zlg9btlj3x` | status=`PUBLISHED` | 4 sections | 40 questions
- `test-37-reading`   | id=`cmwlx90li000r73zlitfqrerf` | status=`PUBLISHED` | 3 sections | 40 questions
- `test-38-listening` | id=`cmwlx9106000w73zlxs14hkab` | status=`PUBLISHED` | 4 sections | 40 questions
- `test-38-reading`   | id=`cmwlx91ir001273zl6odyo6kq` | status=`PUBLISHED` | 3 sections | 40 questions

**Tổng cộng:** 8/8 đề thi Cambridge 16 (Tests 35–38) với 320 câu hỏi đã chính thức hoạt động trên production.
