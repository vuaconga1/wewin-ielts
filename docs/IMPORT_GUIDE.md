# Hướng dẫn format đề để import (admin)

Mục tiêu: upload file theo format này → hệ thống **tự chia Part** → tạo câu hỏi + đáp án trong DB.

**Mẫu tham chiếu Test 9** (fixes + checklist cho test mới): [`docs/TEST-9-TEMPLATE.md`](./TEST-9-TEMPLATE.md). Admin import tải 4 file mẫu từ `public/templates/test-9-samples.zip`.

## Cấu trúc thư mục gợi ý (giống Drive)

```
Test 13/
├── Listening 13.docx   (hoặc .md)
├── Reading 13.docx
├── Writing 13.docx
├── keys.docx           (tuỳ chọn nếu đáp án không ghi trong đề)
│   hoặc Listening-keys.md + Reading-keys.md
└── audio.mp3           (Listening)
```

## Google Drive sync (service account)

Đồng bộ folder Test từ Drive vào **cùng pipeline** ZIP/batch (không cần tải ZIP thủ công).

### Setup (một lần)

1. [Google Cloud Console](https://console.cloud.google.com/) → tạo project (hoặc chọn project sẵn có).
2. **APIs & Services → Enable APIs** → bật **Google Drive API**.
3. **IAM & Admin → Service Accounts** → Create service account → **Keys → Add key → JSON**.
4. Lưu file JSON vào máy (ví dụ `secrets/google-service-account.json`) — **không commit**.
5. Trong `.env`:

```env
GOOGLE_SERVICE_ACCOUNT_JSON="./secrets/google-service-account.json"
GOOGLE_DRIVE_FOLDER_ID=""   # tuỳ chọn — folder mặc định
```

Hoặc đặt `GOOGLE_APPLICATION_CREDENTIALS` trỏ tới cùng file JSON.

6. Trên Google Drive: **Share** folder đề với **email service account** (`client_email` trong JSON), quyền **Viewer**.
7. Lấy Folder ID từ URL:

`https://drive.google.com/drive/folders/FOLDER_ID` → `FOLDER_ID`

### Dùng trên web

1. Mở `/admin/import` (cần ADMIN; hoặc guest + `ALLOW_OPEN_ADMIN=true` khi dev — STUDENT đã login không vào được).
2. Mục **Đồng bộ Google Drive**: dán URL/ID folder → **Đồng bộ**.
3. Có thể dán:
   - **Một folder Test** (`Test 13` với Listening/Reading/Writing + keys + mp3), hoặc
   - **Folder gốc** chứa nhiều subfolder Test — hệ thống sync từng subfolder có file đề.
4. Kết quả: mới / cập nhật / lỗi. Re-sync cùng folder **ghi đè** draft cùng slug (`test-13-listening`, …) và gắn `driveFolderId` / `driveFileIds` trong JSON local.
5. API: `GET/POST /api/admin/drive/sync` (admin-protected). Thiếu credentials → HTTP 503 + message rõ trên UI.

### Keys trên Drive (bắt buộc dạng text)

Parser **không đọc chữ trong ảnh**. File `keys.docx` / `Keyss.docx` nếu chỉ chứa **screenshot** bảng đáp án → import sẽ thiếu đáp án.

**Phải dùng:** chữ gõ được, bảng Word thật, Google Docs text, hoặc Google Sheet (sync export CSV). Xem mục “Cách thiết kế file Word Keys” bên dưới.

## Cách import trên web (`/admin/import`)

### Một skill

1. Chọn **File đề** (`.docx` / `.md` / `.txt`)
2. (Tuỳ chọn) **Keys** dạng text — không dùng ảnh screenshot
3. (Listening) **Audio** `.mp3` / `.m4a` / `.wav` / `.ogg`
4. **Xem preview** → tự lưu local → mở `/tests/[slug]`

Audio được lưu tại `public/uploads/audio/` và gắn vào draft (`audioFiles`). Trình phát hiện trên trang luyện Listening.

### Batch / ZIP

Tab **Batch / ZIP**:

- Upload **một ZIP** chứa cả folder Test (Listening + Reading + Writing + keys + mp3), **hoặc**
- Chọn **nhiều file** cùng lúc

Hệ thống nhận diện skill từ tên file, ghép keys theo skill/số đề, gắn audio vào Listening.

```bash
# CLI — dùng npx tsx (trên Windows, `npm run import:test -- --file` có thể bị npm nuốt flag)
npx tsx scripts/import-test.ts --file templates/sample-listening.md --keys templates/sample-keys.md

# Regression (templates + Castle/Test 6 nếu có trên máy)
npm run import:regression
```

## Cách hệ thống chia Part

Parser đọc text và cắt theo marker (ưu tiên từ trên xuống):

| Ưu tiên | Marker trong file | Ví dụ |
|--------|-------------------|--------|
| 1 | `## PART: <tên>` | `## PART: Section 1 - Accommodation` |
| 2 | `Section N` | `Section 2` / `Listening Section 3` |
| 3 | `Passage N` | `Reading Passage 1` / `READING PASSAGE 2` |
| 4 | `Task 1` / `Task 2` | Writing |
| 5 | `Topic: ...` hoặc nhiều `## Tiêu đề` | Speaking |
| 6 | Không có marker | **1 part** tên `"Full test"` |

**Reading — tránh false positive:** dòng kiểu `Reading Passage 2 has six sections…` hoặc `based on Reading Passage 2 on pages…` **không** được coi là marker Part (chỉ heading ngắn như `Reading Passage 2`).

Mỗi Part trở thành 1 `TestSection` trong DB. Học viên sẽ chọn checkbox từng part khi luyện tập.

```
File Listening 13
        │
        ▼ splitIntoParts()
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Section 1   │ Section 2   │ Section 3   │ Section 4   │
│ Q1–Q3       │ Q4–Q5       │ Q6–Q7       │ Q8–Q9       │
└─────────────┴─────────────┴─────────────┴─────────────┘
        │
        ▼ persist
Test → TestSection × 4 → Question × N → AnswerKey
       (+ MediaAsset audio nếu có)
```

## Format câu hỏi (trong mỗi Part)

```markdown
### Q1 [gap_fill]
Câu hỏi với chỗ trống ___.
answer: single
acceptableAnswers: single|Single

### Q2 [multiple_choice]
Nội dung câu hỏi?
A) Lựa chọn A
B) Lựa chọn B
answer: B
```

### Loại câu (`[type]`)

`gap_fill` | `multiple_choice` | `true_false_ng` | `matching` | `short_answer` | `table_completion` | `map_labeling` | `essay` | `speaking_prompt`

### Đáp án

1. **Inline** trong đề: dòng `answer: ...`
2. **File keys** riêng:

```
Q1: single
Q2: B
```

Inline được ưu tiên nếu cả hai đều có.

## Audio Listening

| Bước | Chi tiết |
|------|----------|
| Upload | Cùng lúc import Listening (single hoặc trong ZIP) |
| Lưu trữ | `public/uploads/audio/<name>-<id>.mp3` |
| URL | `/uploads/audio/...` trong `draft.audioFiles` |
| DB | `MediaAsset` (type AUDIO) khi persist MySQL |
| UI | Player play/pause + progress trên `/practice/[attemptId]` |

## Chạy thử (không cần DB)

```bash
npx tsx scripts/import-test.ts --file templates/sample-listening.md
npm run import:regression
```

Kết quả `import-test`:
- In ra danh sách Part + câu hỏi
- Ghi `tmp/<slug>.draft.json`

`import:regression` assert:
- sample-listening → **4 parts / 9Q** (+ keys)
- sample-writing → **2 tasks**
- Castle Listening 5 → **4×10 = 40** (nếu có file + `templates/castle-listening-keys.md`)
- Castle Reading 5 → **3 passages / 40Q** (+ castle-reading-keys)
- Keyss.docx ảnh → issue `KEYS_IMAGE_ONLY`
- Test 6 Listening (`Test 6(1).docx`) Section 4 thiếu text diagram → vẫn tạo **Q31–40** (synthetic) + warning `PART_SYNTHETIC_QUESTIONS`

Persist MySQL (sau khi cấu hình `.env` + migrate):

```bash
npx prisma migrate dev --name init
npx tsx scripts/import-test.ts --file templates/sample-listening.md --persist
```

## Format đề thật (Castle & Environment)

Đã kiểm thử với:

| File | Kết quả parser |
|------|----------------|
| `Listening 5.docx` | 4 Section × 10 câu = 40 (gap / matching / MCQ) |
| `Reading 5.docx` | 3 Passage, 40 câu (13+13+14: TFNG / gap / matching / MCQ) |
| `WRITING 5.docx` | Task 1 + Task 2 → ESSAY |
| `Reading 6.docx` / Test 6 | 3 Passage, **40** câu (13+13+14); Q37–40 flowchart chỉ còn header → synthetic |
| `Test 6(1).docx` (Listening) | Section 1–3 OK; Section 4 chỉ còn header `Questions 31–40` (nội dung/diagram trong ảnh) → synthetic Q31–40 |
| `Keyss.docx` | **Không phải text** — chỉ chứa **ảnh screenshot** bảng đáp án → `KEYS_IMAGE_ONLY` |
| `Test 6/Keys.docx` | Text một phần (Reading Passage 1 = Q1–13) + ảnh; Listening gần như trống |

### Issue codes liên quan keys / parts

| Code | Ý nghĩa |
|------|---------|
| `KEYS_IMAGE_ONLY` | Keys docx gần như không có chữ, chỉ có ảnh — **error** |
| `KEYS_PARTIAL_IMAGES` | Parse được vài đáp án nhưng file còn nhiều ảnh — có thể thiếu keys |
| `KEYS_EMPTY` | Có text nhưng không parse được dòng đáp án |
| `PART_SYNTHETIC_QUESTIONS` | Tạo câu từ `Questions N–M` vì thiếu chỗ trống trong text (thường do ảnh) |
| `PART_NO_QUESTIONS` | Part không có câu nào |
| `MISSING_ANSWER` | Listening/Reading thiếu đáp án (inline hoặc keys) |

### Keys dạng bảng STT / Đáp án (Google Sheets)

Admin copy nguyên từ sheet (2 khối cạnh nhau: câu 1–20 | câu 21–40):

```
STT	Đáp án	STT	Đáp án
1	Bittens	21	A
2	group	22	A
...
```

Lưu thành `.md` / `.txt` / paste vào tool import. Parser tự nhận:
- Tab-separated (copy từ Google Sheets)
- Dòng `1. answer` / `Q1: answer`
- Bảng Word (mammoth → dòng xen kẽ số / đáp án)
- Viết tắt: `NGV` → NOT GIVEN

**Listening** = bảng hình 2 (chữ + số + A/B/C…)  
**Reading** = bảng hình 1 (T/F/NGV, chữ, chữ cái A–K…)

Mẫu đã đối chiếu ảnh: `templates/castle-listening-keys.md`, `templates/castle-reading-keys.md`

### Cách thiết kế file Word Keys (quan trọng)

**Chuẩn mặc định từ nay = format `Key 9.docx`** (xem `templates/canonical-keys.md`).

**Không dùng:** chụp ảnh / paste screenshot bảng đáp án vào Word. Parser **không đọc chữ trong ảnh**.

**Phải dùng:** chữ thật (typed text) hoặc bảng Word thật theo layout Key 9.

#### Format chuẩn (Key 9) — khuyến nghị

Một file `Key N.docx` có thể chứa **cả Listening + Reading**:

```
Listening

Section 1
1. answer
2. answer
…
10. answer

Section 2
11. answer
…
20. answer

Section 3
21. A
…
30. D

Section 4
31. traffic flows
…
40. B

Reading

Passage 1
1. FALSE
2. TRUE
…
13. money

Passage 2
14. visual memory
…
26. D

Passage 3
27. YES
…
40. B
```

- Mỗi đáp án: `N. answer` (dấu `.` / `:` / `)` đều được)
- Reading TFNG: `TRUE` / `FALSE` / `NOT GIVEN` (cũng nhận `T` / `F` / `NGV`)
- Có thể để đáp án trong **bảng Word** (4 cột Section / 3 cột Passage) miễn nội dung cell vẫn là `N. answer`
- Import **tự chuẩn hóa** các layout lệch (STT|Đáp án, dòng xen kẽ số/đáp án, …) về dạng Key 9 trước khi gắn đáp án

#### Cách A — mỗi dòng 1 câu (tương đương Key 9)

Trong Word / Google Docs, gõ:

```
Listening
1. Bittens
2. group
3. 23
4. 12.50
5. back
...
40. government

Reading
1. F
2. NGV
3. T
...
40. YES
```

Hoặc:

```
Q1: Bittens
Q2: group
Q14: I
```

Ký tự ngăn cách sau số: `.` `)` `:` `-` đều được.

#### Cách B — Bảng Word 2 cột

| STT | Đáp án |
|-----|--------|
| 1   | Bittens |
| 2   | group |
| 3   | 23 |

(Có thể 4 cột: STT | Đáp án | STT | Đáp án cho 1–20 và 21–40.)

Lưu ý: import **tự extract bảng Word** (mammoth HTML → TSV) khi đọc file keys `.docx`. Nếu bảng vẫn lệch, ưu tiên **Cách A**.

#### Cách C — Copy từ Google Sheets → Word / `.md`

1. Trong Sheet chọn vùng STT/Đáp án
2. Copy → dán vào Notepad / Word (giữ dạng text)
3. Save `.txt` / `.md` / `.docx`
4. Upload làm file keys khi import

#### Quy ước đáp án

| Loại câu | Ghi trong keys |
|----------|----------------|
| Gap fill | `wheelchair`, `12.50`, `one-sixth` |
| MCQ | `A` / `B` / `C` / `D` |
| Matching | `F`, `G`, `K`… |
| True/False/NG | `T` / `F` / `NGV` (hoặc TRUE / FALSE / NOT GIVEN) |
| Yes/No/NG | `YES` / `NO` / `NGV` |

Nên **tách 2 file keys**: `Listening-keys.docx` và `Reading-keys.docx` (hoặc 1 file có tiêu đề `Listening` / `Reading` rồi import riêng từng skill).

#### Checklist Keys.docx

- [ ] Là chữ gõ được, không phải ảnh
- [ ] Mỗi câu có số: `1.` hoặc `Q1:`
- [ ] Đủ 1–40 (Listening/Reading)
- [ ] Không cần format đẹp — plain text là đủ

### Keys dạng ảnh trong docx

`Keyss.docx` chỉ chứa screenshot sheet — cần **copy bảng ra text** như trên (hoặc export CSV). OCR = phase sau.

Khi upload keys ảnh-only, preview/CLI sẽ báo **`KEYS_IMAGE_ONLY`** (không còn chỉ `KEYS_EMPTY` chung chung).

### Hạn chế còn lại

- OCR keys / diagram trong ảnh: chưa hỗ trợ
- Đề Listening/Reading nếu phần câu hỏi nằm hoàn toàn trong ảnh (chỉ còn dòng `Questions 31–35`) → tạo placeholder synthetic; cần sửa file đề hoặc bổ sung text
- Keys lẫn Listening+Reading trong một file: phải có heading `Listening` / `Reading` rõ; import từng skill riêng
- `npm run import:test -- --file` trên một số npm Windows nuốt `--file` → dùng `npx tsx scripts/import-test.ts --file ...`
