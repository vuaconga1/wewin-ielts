# BÁO CÁO IMPORT VÀ ĐỐI CHIẾU LAYOUT BỘ ĐỀ CAMBRIDGE IELTS 17
================================================================

- **Thời gian thực hiện:** 2026-11-18
- **Bộ đề gốc:** Cambridge IELTS 17 Academic (Tests 1–4 trong sách)
- **Tên & Slug trên hệ thống:**
  - Test 1: `test-39-listening` / `test-39-reading` (Tiêu đề: `Test 39.C17.01 - Listening` / `Test 39.C17.01 - Reading`)
  - Test 2: `test-40-listening` / `test-40-reading` (Tiêu đề: `Test 40.C17.02 - Listening` / `Test 40.C17.02 - Reading`)
  - Test 3: `test-41-listening` / `test-41-reading` (Tiêu đề: `Test 41.C17.03 - Listening` / `Test 41.C17.03 - Reading`)
  - Test 4: `test-42-listening` / `test-42-reading` (Tiêu đề: `Test 42.C17.04 - Listening` / `Test 42.C17.04 - Reading`)
- **Trạng thái (Status):** `PUBLISHED` (đã kích hoạt và sẵn sàng phục vụ học viên trên production).
- **Phân loại (ExamType):** `ACADEMIC`.

---

## 1. Xử lý file PDF & Tài nguyên

1. **Phân đoạn PDF (Split <= 40 trang):**
   - File gốc: `docs/cambridge_17/Cambridge IELTS 17 PDF.pdf` (144 trang).
   - Đã chia thành các tệp $\le 40$ trang lưu tại `docs/cambridge_17_split/fixed_40_pages/`:
     - `Cambridge_17_Part1_Trang_001-040.pdf`
     - `Cambridge_17_Part2_Trang_041-080.pdf`
     - `Cambridge_17_Part3_Trang_081-120.pdf`
     - `Cambridge_17_Part4_Trang_121-144.pdf`
   - Đã chia theo phân đoạn logic nghiệp vụ lưu tại `docs/cambridge_17_split/`:
     - `Part1_Trang_001-030_Intro_Test1.pdf`
     - `Part2_Trang_031-052_Test2.pdf`
     - `Part3_Trang_053-074_Test3.pdf`
     - `Part4_Trang_075-095_Test4.pdf`
     - `Part5_Trang_096-118_Audioscripts.pdf`
     - `Part6_Trang_119-144_AnswerKeys_WritingSample.pdf`

2. **Audio Listening (16/16 section):**
   - Trích xuất từ `docs/cambridge_17/Audio cambridge 17/` và tải bổ sung Test 4 (parts 2, 3, 4) từ mirror chuẩn, gán đúng tại:
     - `public/uploads/audio/test-39-section-{1..4}.mp3`
     - `public/uploads/audio/test-40-section-{1..4}.mp3`
     - `public/uploads/audio/test-41-section-{1..4}.mp3`
     - `public/uploads/audio/test-42-section-{1..4}.mp3`
   - Đầy đủ 16/16 file MP3, kiểm tra bitrate, header và kích thước đầy đủ (1.2MB - 12.8MB).

3. **Hình ảnh Media (0 watermark):**
   - Kiểm tra kỹ toàn bộ 4 bài test Listening và Reading trong Cambridge 17: Không có câu hỏi nào yêu cầu hình ảnh biểu đồ, bản đồ hay sơ đồ (0 maps, 0 plan diagrams). Chỉ có Writing Task 1 trang 50 chứa biểu đồ (không thuộc phạm vi Listening/Reading).

---

## 2. Kết quả Đối chiếu Đáp án (Verification)

Toàn bộ 320 câu hỏi (8 bài thi x 40 câu hỏi) được đối chiếu tự động với Answer Keys gốc trong sách giáo trình Cambridge IELTS 17 (trang 119–126) qua script `scripts/verify_cambridge_17.py`:

```
Checked 320 questions across available tests.
>>> ALL CHECKED ANSWERS MATCH THE OFFICIAL BOOK KEYS 100%! ZERO DISCREPANCIES! <<<
```

- **Tỷ lệ khớp:** 320/320 câu hỏi (100%).
- **Chấp nhận các biến thể đáp án chuẩn của Cambridge:**
  - Viết số và chữ: ví dụ `35 / thirty five`, `19 / nineteen`, `30 / thirty`.
  - Từ đồng nghĩa / chính tả Anh-Mỹ: ví dụ `flavour / flavor`, `litre / liter`.
  - Dạng số ít / số nhiều tuỳ chọn trong ngoặc đơn: ví dụ `floor(s)`, `rock(s)`.
  - Thứ tự tự do trong các câu hỏi chọn nhiều đáp án: ví dụ Test 39 Q15-16, Q17-18, Q19-20; Test 41 Q11-12; Test 42 Q21-22, Q23-24.

---

## 3. Kiểm định Cấu trúc & Layout (Validation)

Toàn bộ 8 tệp JSON được kiểm định theo chuẩn `ParsedTestDraftSchema`, `QuestionContentSchema` và hướng dẫn layout:
- **Lệnh chạy:** `npx tsx scripts/validate_cambridge_17.ts`
- **Kết quả:** `Validation finished for 8 tests with 0 errors, 0 warnings.`
- **Đặc điểm layout được bảo đảm:**
  - Bài nghe: 4 sections (Part 1, Part 2, Part 3, Part 4) với file audio tương ứng từng section.
  - Bài đọc: 3 passages (Passage 1, Passage 2, Passage 3).
  - Không có hiện tượng mất stem, thiếu options hay đè câu.
  - Đúng chuẩn Markdown không watermark.

---

## 4. Trạng thái Triển khai trên Cơ sở Dữ liệu Production (Neon PostgreSQL)

Đã chạy upsert thành công toàn bộ 8 bài thi vào database:
- **Lệnh thực hiện:** `npx tsx scripts/upsert-tests-from-json.ts --only test-39,test-40,test-41,test-42 --status PUBLISHED`
- **Kiểm tra trạng thái:** `npx tsx scripts/check_cambridge_17_db.ts`

| Test Slug | Kỹ năng | Tiêu đề | Số phần | Số câu | Trạng thái DB | Test ID |
|---|---|---|---|---|---|---|
| `test-39-listening` | LISTENING | Test 39.C17.01 - Listening | 4 | 40 | `PUBLISHED` | `cmwlya2dm0001zlzlhle64wqr` |
| `test-39-reading` | READING | Test 39.C17.01 - Reading | 3 | 40 | `PUBLISHED` | `cmwlya2zd0007zlzlpjeup4h4` |
| `test-40-listening` | LISTENING | Test 40.C17.02 - Listening | 4 | 40 | `PUBLISHED` | `cmwlyad72000a0zzln89ffvce` |
| `test-40-reading` | READING | Test 40.C17.02 - Reading | 3 | 40 | `PUBLISHED` | `cmwlyado4000g0zzl9sxsq5h5` |
| `test-41-listening` | LISTENING | Test 41.C17.03 - Listening | 4 | 40 | `PUBLISHED` | `cmwlyae2h000l0zzli1qzetd2` |
| `test-41-reading` | READING | Test 41.C17.03 - Reading | 3 | 40 | `PUBLISHED` | `cmwlyaeiw000r0zzltxt0cgm0` |
| `test-42-listening` | LISTENING | Test 42.C17.04 - Listening | 4 | 40 | `PUBLISHED` | `cmwlyaexh000w0zzltk6ns44y` |
| `test-42-reading` | READING | Test 42.C17.04 - Reading | 3 | 40 | `PUBLISHED` | `cmwlyafek00120zzljx51mafa` |

---

## 5. Danh mục Tệp tin đã Tạo / Cập nhật

1. **Bộ dữ liệu JSON:**
   - `data/tests/test-39-listening.json`
   - `data/tests/test-39-reading.json`
   - `data/tests/test-40-listening.json`
   - `data/tests/test-40-reading.json`
   - `data/tests/test-41-listening.json`
   - `data/tests/test-41-reading.json`
   - `data/tests/test-42-listening.json`
   - `data/tests/test-42-reading.json`

2. **Tệp Audio chuẩn hóa:**
   - `public/uploads/audio/test-39-section-{1..4}.mp3` (4 files)
   - `public/uploads/audio/test-40-section-{1..4}.mp3` (4 files)
   - `public/uploads/audio/test-41-section-{1..4}.mp3` (4 files)
   - `public/uploads/audio/test-42-section-{1..4}.mp3` (4 files)

3. **Scripts Tự động hóa & Kiểm thử:**
   - `scripts/cambridge_17_t1.py` (Builder Test 39)
   - `scripts/cambridge_17_t2.py` (Builder Test 40)
   - `scripts/cambridge_17_t3.py` (Builder Test 41)
   - `scripts/cambridge_17_t4.py` (Builder Test 42)
   - `scripts/build_cambridge_17.py` (Master Builder)
   - `scripts/verify_cambridge_17.py` (Answer Key Validator)
   - `scripts/validate_cambridge_17.ts` (Zod Schema & Layout Validator)
   - `scripts/check_cambridge_17_db.ts` (Neon DB Status Checker)

4. **Tài liệu hướng dẫn & Báo cáo:**
   - `docs/IMPORT_MISSING_AUDIO_KEYS.txt`
   - `docs/CAMBRIDGE_17_IMPORT_REPORT.md`
