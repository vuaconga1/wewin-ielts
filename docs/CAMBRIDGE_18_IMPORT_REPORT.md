# BÁO CÁO IMPORT VÀ ĐỐI CHIẾU LAYOUT BỘ ĐỀ CAMBRIDGE IELTS 18
================================================================

- **Thời gian thực hiện:** 2026-11-17
- **Bộ đề gốc:** Cambridge IELTS 18 Academic (Tests 1–4 trong sách)
- **Tên & Slug trên hệ thống:**
  - Test 1: `test-31-listening` / `test-31-reading` (Tiêu đề: `Test 31.C18.01 - Listening` / `Test 31.C18.01 - Reading`)
  - Test 2: `test-32-listening` / `test-32-reading` (Tiêu đề: `Test 32.C18.02 - Listening` / `Test 32.C18.02 - Reading`)
  - Test 3: `test-33-listening` / `test-33-reading` (Tiêu đề: `Test 33.C18.03 - Listening` / `Test 33.C18.03 - Reading`)
  - Test 4: `test-34-listening` / `test-34-reading` (Tiêu đề: `Test 34.C18.04 - Listening` / `Test 34.C18.04 - Reading`)
- **Trạng thái (Status):** `DRAFT` (theo đúng nguyên tắc import an toàn, admin duyệt trước khi publish).
- **Phân loại (ExamType):** `ACADEMIC`.

---

## 1. Xử lý file PDF & Tài nguyên

1. **Phân đoạn PDF (Split <= 40 trang):**
   - File gốc: `docs/cambridge_18/Cambridge 18 - The IELTS Workshop/Cambridge 18.pdf` (147 trang, độ phân giải cao).
   - Đã chia thành các tệp $\le 40$ trang lưu tại `docs/cambridge_18_split/fixed_40_pages/`:
     - `Cambridge_18_Part1_Trang_001-040.pdf`
     - `Cambridge_18_Part2_Trang_041-080.pdf`
     - `Cambridge_18_Part3_Trang_081-120.pdf`
     - `Cambridge_18_Part4_Trang_121-147.pdf`
   - Đã chia theo phân đoạn logic nghiệp vụ lưu tại `docs/cambridge_18_split/`:
     - `Cambridge_18_Part1_Trang_001-033_Intro_Test1.pdf`
     - `Cambridge_18_Part2_Trang_034-056_Test2.pdf`
     - `Cambridge_18_Part3_Trang_057-079_Test3.pdf`
     - `Cambridge_18_Part4_Trang_080-100_Test4.pdf`
     - `Cambridge_18_Part5_Trang_101-120_Audioscripts.pdf`
     - `Cambridge_18_Part6_Trang_121-147_AnswerKeys_WritingSample.pdf`

2. **Audio Listening (16/16 section):**
   - Trích xuất từ `docs/cambridge_18/Cambridge 18 - The IELTS Workshop/AUDIO FILES/` và chuẩn hóa gắn tại:
     - `public/uploads/audio/test-31-section-{1..4}.mp3`
     - `public/uploads/audio/test-32-section-{1..4}.mp3`
     - `public/uploads/audio/test-33-section-{1..4}.mp3`
     - `public/uploads/audio/test-34-section-{1..4}.mp3`
   - Đầy đủ 16 file MP3, không thiếu section nào.

3. **Hình ảnh Map / Plan:**
   - Test 32 (Test 2 trong sách) Section 2 có bản đồ quy hoạch khu nhà ở (Housing development) với các vị trí từ A đến I.
   - Bản đồ đã được trích xuất từ trang PDF 37 gốc ở độ phân giải 300 DPI, cắt sạch viền văn bản câu hỏi, loại bỏ toàn bộ watermark / logo ngoài lề và lưu tại:
     - `public/uploads/images/test-32-map.png`
   - Kích thước crop tối ưu: `(150, 520, 2140, 1770)` - giữ trọn la bàn chỉ hướng, các nhãn A–I, ký hiệu "Key: Housing" và loại bỏ hoàn toàn các dòng câu hỏi text thừa.

---

## 2. Kết quả Đối chiếu Đáp án (Verification)

Toàn bộ 320 câu hỏi của 8 đề thi đã được đối chiếu 100% với trang Đáp án chính thức trong sách Cambridge 18 (trang 119–126 trong sách, tương ứng trang 121–128 của tệp PDF) qua script tự động `scripts/verify_cambridge_18.py`.

```text
Checked 320 questions across 8 tests.
>>> ALL 320 ANSWERS MATCH THE OFFICIAL BOOK KEYS 100%! ZERO DISCREPANCIES! <<<
```

- Bổ sung đầy đủ các cách viết tương đương hợp lệ trong `acceptableAnswers`:
  - Ngày tháng (ví dụ: `24 April` / `24th April` / `April 24` / `24(th) April`)
  - Từ ghép / chính tả Anh-Mỹ (ví dụ: `socialise` / `socialize`, `flavour` / `flavor`, `harbour` / `harbor`, `string` / `strings`, `waist` / `waists`, `1,000 kg` / `1000 kg`)
  - Giờ giấc (ví dụ: `1.15` / `1:15` / `1.15 pm` / `1:15 pm`)
  - Cặp câu chọn 2 đáp án (Choose TWO letters) đều hỗ trợ `acceptableAnswers` chéo nhau để hệ thống chấm không phụ thuộc vào thứ tự nhập.

---

## 3. Kiểm tra Schema & Cấu trúc Dữ liệu

Đã chạy kiểm tra tự động qua `scripts/validate_cambridge_18.ts`:
- **Zod ParsedTestDraftSchema:** Hợp lệ 100%.
- **QuestionContentSchema:** Hợp lệ 100%.
- **Số lượng câu hỏi:** Đủ 40 câu/đề, liên tục từ Q1 đến Q40 không nhảy số, không trùng số.
- **Order thuộc tính:** Contiguous từ 0 đến 39.
- **Tùy chọn trắc nghiệm / nối:** Tất cả các câu `MULTIPLE_CHOICE`, `MATCHING`, `TRUE_FALSE_NG` đều có `options` chứa nhãn khớp chính xác với `correctAnswer`.
- **Tài nguyên Media:** 16/16 file audio và 1/1 ảnh map đều tồn tại thực tế trên ổ cứng tại thư mục `public/`.
- **Kết quả:** `0 errors, 0 warnings`.

---

## 4. Đối chiếu Layout UI Web so với PDF & Sửa lỗi phát hiện

Sau khi import và kiểm tra đối chiếu layout giữa bản in PDF gốc và giao diện luyện thi của web (`PracticeSession` / `HighlightablePassage` / `SharedChoiceAnswers` / `InlineNotesGaps`):

1. **Hiển thị bài đọc Reading (Cột trái):**
   - Đã tách riêng rẽ bài đọc (Passage) sang cột trái, các khối câu hỏi và chỉ dẫn nằm ở cột phải (`splitReadingPassageAndTasks`).
   - Tiêu đề bài đọc được hiển thị căn giữa, in đậm rõ ràng.
   - Các chữ cái phân đoạn (A, B, C...) ở đầu mỗi đoạn văn tự động được định dạng đậm nổi bật, không bị ngắt dòng sai hay dính chữ vào nội dung bài đọc.
   - Cung cấp đầy đủ chú thích thuật ngữ của Cambridge ở cuối bài (ví dụ `Stand – An area covered with trees...`, `Neolithic...`, `Paleoclimatology...`).

2. **Các dạng câu hỏi điền từ (Gap fill / Notes completion / Table completion):**
   - Cột phải hiển thị bảng / ghi chú với ô nhập liệu đặt trực tiếp tại vị trí chỗ trống (inline gaps).
   - Không bị lỗi hiển thị đúp (không bị lặp lại câu hỏi vừa trong ghi chú vừa ở hàng câu hỏi riêng bên dưới).
   - Giữ nguyên giới hạn từ yêu cầu trong hướng dẫn ("ONE WORD ONLY", "NO MORE THAN TWO WORDS", v.v.).

3. **Các nhóm câu hỏi chung lựa chọn (Repeating Option Banks):**
   - Các câu hỏi `TRUE/FALSE/NOT GIVEN` và `YES/NO/NOT GIVEN` được gom nhóm hiển thị gọn gàng theo chuẩn UI rules (OptionBank dạng hộp viền, bên dưới mỗi câu là dropdown chọn phương án).
   - Nhóm câu hỏi tóm tắt có bảng từ vựng (Summary with list of words/phrases, ví dụ Test 32 Q24–26, Test 33 Q31–35, Test 34 Q31–36) hiển thị bảng từ lựa chọn A–F/A–I/A–J phía trên, ô chọn phương án nằm ngay trong câu.
   - Nhóm câu hỏi nối người / phát biểu (Matching people / features) hiển thị bảng danh sách đối tượng một lần, tránh lặp lại toàn bộ danh sách cho từng câu.

4. **Câu hỏi Map Labeling (Test 32 Section 2):**
   - Ảnh bản đồ khu nhà ở `test-32-map.png` được render sắc nét, không dính logo watermark.
   - Dưới bản đồ là các câu hỏi 15–20 tương ứng các địa điểm (School, Sports centre, Clinic, Community centre, Supermarket, Playground) với dropdown lựa chọn các vị trí từ A đến I.

5. **Sửa các lỗi mã nguồn (Code fixes) trong quá trình kiểm thử:**
   - **`src/app/practice/[slug]/[attemptId]/result/page.tsx`**: Khắc phục lỗi thiếu biến `questions` trong khối render kỹ năng Speaking/Writing sau khi refactor hàm `gradeAnswers`.
   - **`src/lib/validation/auth.ts` & `src/lib/validation/primitives.ts`**: Chuẩn hóa kiểu type assertion `(issue as any)?.params` để tương thích chặt chẽ với bản cập nhật TypeScript compiler (`tsc --noEmit` đạt 0 lỗi).
   - **QuestionType Schema Alignment**: Căn chỉnh các câu hỏi YES/NO/NOT GIVEN dùng `type: "TRUE_FALSE_NG"` kèm tập `options: [YES, NO, NOT GIVEN]` đúng theo Zod schema của hệ thống.

---

## 5. Xác nhận Database PostgreSQL (Neon)

Toàn bộ 8 đề thi đã được persist thành công vào cơ sở dữ liệu Neon qua `scripts/upsert-tests-from-json.ts` và kiểm tra lại bằng `scripts/check_cambridge_18_db.ts`:

- `test-31-listening`: id=`cmwkfhxc90001qqzl7k9hrp5j` | status=`DRAFT` | sections=4 | totalQ=40
- `test-31-reading`: id=`cmwkfhxw80007qqzlt829cfso` | status=`DRAFT` | sections=3 | totalQ=40
- `test-32-listening`: id=`cmwkfhybx000cqqzlkmnilaal` | status=`DRAFT` | sections=4 | totalQ=40
- `test-32-reading`: id=`cmwkfhyt0000iqqzl97ju8kpn` | status=`DRAFT` | sections=3 | totalQ=40
- `test-33-listening`: id=`cmwkfhz8q000nqqzl0ahdq3kq` | status=`DRAFT` | sections=4 | totalQ=40
- `test-33-reading`: id=`cmwkfhzq6000tqqzljq7okuld` | status=`DRAFT` | sections=3 | totalQ=40
- `test-34-listening`: id=`cmwkfi059000yqqzlmj5jx5gy` | status=`DRAFT` | sections=4 | totalQ=40
- `test-34-reading`: id=`cmwkfi0ms0014qqzl2kya7b0i` | status=`DRAFT` | sections=3 | totalQ=40

**Tổng cộng:** 8 đề thi, 56 sections, 320 questions đã có mặt trên web đầy đủ và hoàn thiện.

