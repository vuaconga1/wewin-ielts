# Hướng dẫn import bộ đề IELTS (PDF/scan) lên web WEWIN

Tài liệu này mô tả **đúng quy trình đã dùng để import bộ "Real IELTS VOL 1"** (10 test, Academic, Listening + Reading). Người thực hiện có thể là người hoặc một AI agent (Cursor…). Toàn bộ mã mẫu nằm trong `.tmp-import/vol1/`. Khi làm bộ mới, **sao chép thư mục đó** và sửa theo hướng dẫn bên dưới.

> Thư mục `.tmp-import/` hiện **chưa được commit vào git**. Đừng xoá nó: đây là mẫu cho các lần import sau.

---

## 1. Kết quả cần đạt

- Mỗi test tạo **2 đề riêng** trên web: `<Tên bộ> Test N — Listening` và `<Tên bộ> Test N — Reading`.
- Loại đề: **IELTS Academic** (hoặc General nếu bộ đề là GT), trạng thái **DRAFT**. Chủ web tự kiểm tra rồi mới publish.
- Listening có audio từng section (Section 1–4), tải lên R2. Bản đồ/sơ đồ (map/plan) là ảnh sạch.
- Đáp án đầy đủ, có chấp nhận các cách viết tương đương (`9 months / nine months`).
- **Không có watermark** (logo, tên web, link, số điện thoại của nguồn) xuất hiện trên web, kể cả trong ảnh.

## 2. Nguyên tắc bắt buộc

1. **Báo cáo trước khi làm.** Đọc qua toàn bộ bộ đề, liệt kê vấn đề của từng test (mục 4), gửi chủ web quyết định rồi mới import.
2. **Không watermark.** Bỏ mọi dòng chữ watermark khi gõ lại đề. Ảnh map/plan phải lấy từ ảnh gốc nhúng trong PDF, **không chụp màn hình trang** (vì sẽ dính logo).
3. **Không dịch nội dung đề** (bài đọc, câu hỏi, đáp án giữ nguyên tiếng Anh).
4. **Chính sách đáp án (đã được chủ web chốt):**
   - Test không có đáp án thì **tự tạo đáp án**, rồi đối chiếu với nguồn công khai hoặc lời audio.
   - **Nếu không chắc đáp án đúng thì bỏ phần đó** (ví dụ bỏ Listening của test đó), không đoán bừa.
   - Thiếu audio thì **bỏ Listening**, chỉ import Reading.
   - Được sửa lỗi chính tả hoặc đánh số sai hiển nhiên trong đề gốc.
5. **Không dùng dịch vụ trả phí** (OpenAI, Anthropic, Google… dùng key trong `.env`) nếu chưa được chủ web đồng ý rõ ràng. Mọi công cụ trong hướng dẫn này đều miễn phí và chạy trên máy.
6. **Không in hoặc ghi key/secret** ra màn hình, file, hay chat.
7. **Ghi log** vào `docs/IMPORT_MISSING_AUDIO_KEYS.txt` sau mỗi bộ đề (mục 11).

## 3. Chuẩn bị máy

| Thành phần | Dùng để | Cài |
|---|---|---|
| Node + `npm install` trong repo | Chạy bộ phân tích đề và lưu vào DB | có sẵn trong repo |
| File `.env` của dự án | DB và R2 (chủ web cung cấp) | không commit, không in ra |
| Python 3.11+ | Script trích xuất và dựng đề | python.org |
| `pymupdf` | Đọc PDF: chữ, ảnh trang, ảnh nhúng | `pip install pymupdf` |
| `python-docx` | Đọc .docx nguồn, dựng .docx sạch | `pip install python-docx` |
| `imageio-ffmpeg` | ffmpeg cho audio (cắt, đổi định dạng) | `pip install imageio-ffmpeg` |
| `faster-whisper` (tuỳ chọn) | Chép lời audio **trên máy, miễn phí** để tạo hoặc đối chiếu đáp án Listening | `pip install faster-whisper numpy` |

Chạy mọi lệnh tại thư mục gốc repo. Trên PowerShell nên đặt `$env:PYTHONIOENCODING="utf-8"` để không lỗi tiếng Việt.

## 4. Bước 1 — Khảo sát nguồn và báo cáo

Với mỗi test, ghi lại:

- Có file đề Listening/Reading không? PDF có chữ chọn được hay là ảnh scan?
- Có audio đủ 4 section không? Định dạng gì (mp3/m4a)? Có đoạn im lặng hay bíp dài ở cuối không?
- Có đáp án không? Đầy đủ không? Có tapescript không?
- Đề gốc có thiếu câu, trùng số câu, đoạn văn bị lộn thứ tự, chữ OCR hỏng không?
- Có map/plan/diagram không?
- Có watermark ở đâu (đầu trang, giữa bài, trong ảnh)?

Gửi bảng tóm tắt cho chủ web và hỏi quyết định cho các trường hợp: thiếu audio, thiếu đáp án, có cắt audio không, có sửa lỗi chính tả không.

## 5. Bước 2 — Trích xuất chữ và ảnh trang

Mẫu: `.tmp-import/vol1/extract.py`. Sửa biến `BASE` thành thư mục bộ đề mới rồi chạy:

```powershell
python .tmp-import/<bo-de>/extract.py
```

Kết quả:
- `text/*.txt`: chữ từng trang (có dấu `===== PAGE n =====`).
- `pages/*.png`: ảnh từng trang. Dùng để **đối chiếu bằng mắt** khi chữ trích ra bị vỡ (bảng, notes, flow-chart, ô chữ).

Chữ trích từ PDF scan luôn có lỗi. **Luôn so với ảnh trang** trước khi gõ lại.

## 6. Bước 3 — Chuẩn hoá audio

Mẫu: `.tmp-import/vol1/audio.py`. Khai báo `SOURCES = {số test: [file section 1, 2, 3, 4]}` rồi chạy:

```powershell
python .tmp-import/<bo-de>/audio.py
```

Script sẽ:
- Xuất ra `audio/test{N}/section-{1..4}.mp3`.
- **Cắt** nếu có đoạn im lặng dài hơn 5 phút (thời gian chép đáp án kèm tiếng bíp ở cuối track). Dùng `silencedetect` của ffmpeg.
- **Đổi** m4a (và các định dạng khác) sang mp3 128 kbps.
- Các trường hợp còn lại chép nguyên.

Nghe thử đầu/cuối vài file sau khi cắt. Nếu một test chỉ có 1 file audio cho cả bài, phải tách theo mốc "Section/Part 2…" (xem `clip_stt.py`, `tapescript_marks.py`).

## 7. Bước 4 — Ảnh map/plan (không watermark)

Mẫu: `.tmp-import/vol1/maps.py`. Ảnh map trong PDF thường là **một ảnh nhúng riêng**, tách khỏi logo watermark. Script lấy đúng ảnh đó theo số trang và kích thước pixel:

```python
TARGETS = [("Test 4/Test 4.pdf", 3, (1110, 850), "t4-fishing-map.png")]
```

Cách tìm kích thước: mở PDF bằng `fitz`, gọi `page.get_images(full=True)` và xem cột width/height. **Mở ảnh kết quả ra xem** để chắc không có logo hoặc chữ lạ. Nếu ảnh nhúng dính watermark thì phải cắt hoặc che bằng công cụ ảnh (xem `.tmp-import/c11gt/crop.py`).

## 8. Bước 5 — Gõ lại đề thành file .docx sạch (bước quan trọng nhất)

Không đưa PDF thẳng vào bộ phân tích. Ta viết **một script Python cho mỗi test** (`vol1_tN.py`) để dựng lại đề bằng các hàm có sẵn. Script xuất ra file .docx sạch đúng định dạng mà bộ phân tích hiểu.

### 8.1 Các hàm dựng đề

Định nghĩa trong `.tmp-import/vol1/vol1_common.py` (lớp `Doc` lấy từ `.tmp-import/ielts17gt/build_docx.py`).

| Hàm | Dùng cho |
|---|---|
| `d.p("dòng 1", "dòng 2", …)` / `d.blank()` | Đoạn văn, hướng dẫn, dòng trống ngăn khối |
| `gap(n)` | Chỗ trống có số câu, ví dụ `f"Colour: {gap(2)}"` |
| `LINE` | Gạch trống không số (câu sentence completion có số ở đầu dòng) |
| `d.notes_box("Tiêu đề", [(None, "dòng"), (0, "dòng gạch đầu dòng")])` | Note/form completion |
| `d.grid([[ô, ô, …], …])` | Table completion (dòng đầu là tiêu đề cột) |
| `mcq_block(d, [(số, câu hỏi, [A, B, C])])` / `d.mcq(...)` | Trắc nghiệm 1 đáp án |
| `pair(d, 17, "Which TWO …?", [5 lựa chọn])` | "Choose TWO letters" (câu 17 và 18) |
| `opts(d, [..])` + `numbered(d, start, [..])` | Matching: danh sách A, B, C… rồi các mục đánh số |
| `passage(d, n, first, last, title, [đoạn…], subtitle=None)` | Bài đọc. Đoạn có ký hiệu A/B/C thì bắt đầu đoạn bằng `"A "` |
| `tfng(d, a, b, [câu…], n)` / `ynng(...)` | TRUE/FALSE/NOT GIVEN và YES/NO/NOT GIVEN |
| `headings(d, [..])` | List of Headings (i, ii, iii…) |
| `flow(d, title, [bước…])` | Flow-chart |
| `save(d, N, "Listening")` | Ghi ra file `VOL 1 Test N - Listening.docx` |

Mẫu đầy đủ: xem `vol1_t1.py` … `vol1_t10.py`. Hầu hết các dạng câu hỏi IELTS đều đã có ví dụ trong đó.

### 8.2 Quy tắc khi gõ lại

- Gõ **đúng nội dung đề gốc**. Chỉ sửa lỗi OCR, chính tả và đánh số sai hiển nhiên. Ghi lại mọi chỗ sửa để báo cáo.
- **Bỏ hết** dòng watermark, số trang, header/footer, link, quảng cáo.
- Đoạn văn bị lộn thứ tự hoặc mất chữ: đối chiếu ảnh trang. Nếu ảnh cũng hỏng, tìm bản gốc của bài đọc trên mạng (đọc **nội dung trang thật**, đừng tin phần tóm tắt của công cụ tìm kiếm) rồi khôi phục **chỉ phần bị hỏng**.
- Câu hỏi luôn giữ hướng dẫn gốc ("Write NO MORE THAN TWO WORDS…"). Bộ phân tích dùng hướng dẫn này để kiểm tra giới hạn số từ của đáp án.

### 8.3 Mẹo để bộ phân tích nhận đúng dạng câu

| Muốn được | Viết thế này |
|---|---|
| Sentence completion | Hướng dẫn bắt đầu bằng "Complete the sentences below…". Viết cách khác sẽ ra Short answer. |
| Trắc nghiệm thường | **Tránh** câu hỏi mở đầu "Which statement…" trong khối MCQ, vì sẽ bị hiểu thành Matching. |
| Map/plan labelling | Hướng dẫn "Label the map/plan below…", "Write the correct letter, A–I…", và khai báo ảnh trong `MAPS` (mục 10). |
| Chọn 2 đáp án | Dùng `pair()`. Đáp án ghi riêng cho từng số câu (17. B, 18. D); hệ thống chấm không phân biệt thứ tự. |
| Đề thiếu một câu (ví dụ Q27) | `READING_BOUNDS[N] = [(1,13),(14,26),(28,40)]` và để `None` ở vị trí Q27 trong danh sách đáp án. |

Nhãn phân loại phụ hiển thị sai (ví dụ "MATCHING_HEADINGS" cho một bài matching thường) chỉ là nhãn, không ảnh hưởng chấm điểm.

## 9. Bước 6 — Đáp án

Cuối mỗi `vol1_tN.py` gọi:

```python
keys(N, listening=[...40 đáp án...] or None, reading=[...40 đáp án...])
```

Hàm này ghi ra `keys/testN-keys.md` theo định dạng:

```
Listening

Section 1
1. top
3. 12 January / January 12 / 12th January
...
Reading

Passage 1
1. TRUE
```

Quy tắc:
- Đáp án thay thế ngăn bằng ` / ` (dấu cách, gạch chéo, dấu cách). Áp dụng cho mọi dạng câu, kể cả số (`10 / ten`), ngày tháng, số điện thoại có hoặc không dấu cách, và chính tả Anh/Mỹ (`advisors / advisers`).
- **Không thêm** đáp án thay thế vượt giới hạn số từ. Nếu báo cáo kiểm tra có `ANSWER_EXCEEDS_WORD_LIMIT` thì xem lại.
- TFNG ghi `TRUE / FALSE / NOT GIVEN`; YNNG ghi `YES / NO / NOT GIVEN`; matching ghi chữ cái hoặc số La Mã (`vii`).

**Khi thiếu đáp án**, làm theo thứ tự:
1. Tự làm đáp án từ đề (Reading: tìm câu bằng chứng trong bài; Listening: dùng tapescript nếu có).
2. Đối chiếu ít nhất một nguồn công khai, ví dụ tutorlistening, mini-ielts, engnovate, ieltsit, owlenglish, ib8english. Đọc nội dung trang thật.
3. Listening không có tapescript: chép lời audio **trên máy** bằng `.tmp-import/vol1/transcribe.py` (faster-whisper, model `medium.en`, miễn phí, mỗi section mất vài phút). Đọc file `stt/testN-sectionM.txt` để xác nhận từng câu.
4. Các nguồn mâu thuẫn mà không tự kết luận được: **bỏ phần đó** (thêm số test vào `SKIP_LISTENING`), hoặc giữ đáp án có bằng chứng tốt nhất và **ghi rõ trong báo cáo** để chủ web xem lại.

## 10. Bước 7–9 — Dựng .docx, chạy thử, lưu lên web

Mẫu script import: `.tmp-import/vol1/import-vol1.ts`. Khi làm bộ mới, sửa các mục sau:
- `OCR`: thư mục chứa .docx đã dựng (phải trùng với `build_docx.OUT` trong `vol1_common.py`).
- `SKIP_LISTENING`: các test bỏ Listening.
- `MAPS`: `{ số test: { file: "ảnh.png", letters: "ABCDEFGHI" } }`.
- `dirFor()` / `slug` / `title` / `tags` / `description`: đổi "vol-1", "VOL 1" sang tên bộ mới. `examType` là `"ACADEMIC"` hoặc `"GENERAL"`.

Các lệnh (PowerShell):

```powershell
$env:PYTHONIOENCODING="utf-8"
python .tmp-import/<bo-de>/build_<bo-de>.py 1 2 3            # dựng .docx + keys cho test 1, 2, 3

$env:DETAIL="1"; npx tsx .tmp-import/<bo-de>/import-<bo-de>.ts 1 *> .tmp-import/<bo-de>/dry1.log
#   chạy thử (KHÔNG ghi DB), in chi tiết từng câu

npx tsx .tmp-import/<bo-de>/import-<bo-de>.ts 1 2 3 --commit
#   tải audio/ảnh lên R2 + lưu đề DRAFT
```

### Kiểm tra file chạy thử (dry run) — bắt buộc, từng test

Mỗi dòng có dạng `Q12 MATCHING v=... ans="H" opts=A,...,I stem="..."`. Kiểm tra:
- Mỗi Section Listening có **10 câu**, Reading có **13/13/14** câu (hoặc đúng như đề gốc), tổng 40.
- Không nhảy số, không trùng số.
- Dạng câu đúng: notes/table thì `GAP_FILL`/`TABLE_COMPLETION`; TFNG thì `TRUE_FALSE_NG`; chọn 2 đáp án thì `MULTI_SELECT sel=2`; map thì `MAP_LABELING`.
- `opts=` đúng dải chữ cái, và đáp án nằm trong dải đó.
- `ans=` khớp với file đáp án.

Ý nghĩa cảnh báo:

| Mã | Ý nghĩa | Xử lý |
|---|---|---|
| `[error] ...` | Lỗi chặn lưu | Bắt buộc sửa builder hoặc keys |
| `ANSWER_EXCEEDS_WORD_LIMIT` | Đáp án dài hơn giới hạn từ | Bỏ cách viết thay thế quá dài, hoặc xác nhận chấp nhận |
| `PART_SYNTHETIC_QUESTIONS` | Câu được tạo tự động vì không thấy chỗ trống | Kiểm tra trên giao diện. Thường do câu hỏi nằm trong ảnh. |
| `REDUNDANT_GAP_STEMS_CLEARED` | Đã dọn phần stem thừa | Thường không sao, xem thử giao diện |
| `IMAGE_REQUIRED` | Map/plan chưa có ảnh | Khai báo trong `MAPS` |

Sau khi sửa xong, **chạy thử lại tất cả test** một lượt rồi mới `--commit`.

Ghi chú về `--commit`: lưu lại cùng slug sẽ **thay thế** nội dung đề cũ (xoá section cũ, tạo lại) và đặt trạng thái về DRAFT. Nếu đề đã publish thì phải publish lại.

## 11. Bước 10 — Kiểm tra sau khi lưu

1. **Quét watermark trong DB:** `npx tsx .tmp-import/vol1/verify.ts` (đổi prefix slug nếu cần). Script in số câu, số media, câu thiếu đáp án, và mọi đoạn khớp `www.`, `http`, `.com`, `facebook`, `zalo`, `©`, tên nguồn… Các kết quả chỉ là đường dẫn file audio, hoặc là nội dung thật của đề (ví dụ câu hỏi về địa chỉ web), thì bỏ qua.
2. **Xem trên web** (`npm run dev`, mở `http://localhost:3000/tests/<slug>`, bấm Luyện tập):
   - Audio phát được ở từng section.
   - Map/plan hiện ảnh sạch, dropdown đúng chữ cái.
   - Bảng, notes, flow-chart hiển thị đủ chỗ trống.
   - Xem thử trên màn hình hẹp (điện thoại).
3. **Ghi log** vào `docs/IMPORT_MISSING_AUDIO_KEYS.txt` theo định dạng ở đầu file: thiếu audio, thiếu đáp án (tự tạo từ đâu, hay bỏ), đề thiếu câu, đáp án gốc đã sửa.
4. **Báo cáo cho chủ web**:
   - Danh sách đề đã tạo.
   - Phần bị bỏ và lý do.
   - Đáp án tự tạo hoặc đã sửa.
   - Câu cần xem lại vì nguồn mâu thuẫn.
   - Nội dung đã sửa hoặc khôi phục.

## 12. Checklist nhanh

- [ ] Đã khảo sát và chủ web đã chốt các quyết định.
- [ ] Audio: đủ 4 section, đã cắt đoạn im lặng cuối, đúng mp3.
- [ ] Ảnh map/plan lấy từ ảnh nhúng, đã mở ra xem, không logo.
- [ ] Builder từng test: nội dung khớp ảnh trang, không watermark, lỗi chính tả đã sửa và ghi lại.
- [ ] Đáp án: đủ 40 câu (hoặc `None` cho câu đề thiếu), có cách viết thay thế hợp lý, không vượt giới hạn từ.
- [ ] Đáp án tự tạo đã đối chiếu nguồn hoặc lời audio; phần không chắc đã bỏ.
- [ ] Chạy thử: không `[error]`, số câu, dạng câu và đáp án đều đúng.
- [ ] `--commit` xong, `verify.ts` sạch, đã xem trên web.
- [ ] Đã ghi `docs/IMPORT_MISSING_AUDIO_KEYS.txt` và gửi báo cáo.

## 13. Câu lệnh gợi ý khi giao cho AI agent

> Đọc `docs/HUONG_DAN_IMPORT_DE_IELTS.md` và làm theo đúng quy trình. Bộ đề nằm ở `DE-IELTS/<thư mục>`. Import thành các đề "<Tên bộ> Test 1…N", IELTS Academic, trạng thái DRAFT. Dùng `.tmp-import/vol1/` làm mẫu (chép sang `.tmp-import/<bo-de>/`). Trước khi làm: khảo sát toàn bộ và báo cho tôi các vấn đề của từng test. Không dùng dịch vụ trả phí. Không để watermark trên web.
