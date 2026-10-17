# Kế hoạch sửa lỗi GT — theo `GT-AUDIT-CHECKLIST.md`

Mục tiêu: xử lý toàn bộ checklist audit 17/10/2026 theo thứ tự rủi ro, mỗi bước có test hồi quy và bước kiểm chứng trước khi đánh dấu `[x]`.

## Nguyên tắc làm việc

- **Test trước, sửa sau** (mục [CODE]): thêm/viết lại script `scripts/test-*.ts` (chạy bằng `npx tsx`) tái hiện lỗi → thấy fail → sửa → pass. Thêm lệnh `test:*` vào `package.json`.
- **Kiểm chứng trước khi đánh dấu xong**: chạy lại script audit liên quan trong `.tmp-import/audit-gt/` + mở UI ở 390px và 1366px.
- **Mục ⚠️ PUBLISHED**: sửa xong phải xem lại trên UI trước khi deploy; sau deploy kiểm tra revalidate catalog (A17).
- **[DATA]**: sửa qua script import/patch có thể chạy lại (idempotent), không sửa tay trong DB. Dry-run trước khi ghi.
- Mỗi phase = 1 commit (hoặc 1 PR) riêng để dễ review/rollback.

## Kết quả khảo sát ban đầu (17/10/2026)

| Mục | Trạng thái thực tế | Ghi chú |
|---|---|---|
| A11 | **Còn lỗi** | `practice.answers` không có trong `vi.json`/`en.json` (chỉ có `result.answers`). `practice-session.tsx:1724` gọi `t("answers", "Answers")` → tiếng Việt hiện "Answers". |
| C1/C2 | **Còn lỗi, gốc ở code** | `expandAnswerAlternatives` (`src/lib/scoring.ts`) qua `parenthesisForms` sinh cả phần trong ngoặc làm đáp án riêng: `isAnswerCorrect("s","camera(s)") === true`, tương tự `th`, `e`. Sửa C2 là chữa cho **mọi** test → C1 (sửa dữ liệu) thành tuỳ chọn. |
| A2 | Nghi phạm xác định | `shouldHideStemBesideNotes` (`src/lib/ui/question-type-label.ts:150`), dùng ở `practice-session.tsx:2033` và `shared-choice-answers.tsx:56`. Có test sẵn: `test-map-label-layout.ts`, `test-sentence-gap-layout.ts`. |

Hạ tầng test sẵn có: `test-answer-alternatives`, `test-gap-stems`, `test-layout-variants`, `test-map-label-layout`, `test-notes-outline`, `test-reading-passage-chrome`, `test-sentence-gap-layout`, `test-shared-choice`, `test-keys-parser`.

---

## Phase 0 — Sửa nhanh, rủi ro thấp ✅ xong 17/10/2026

Kết quả: C2 + C1 (10 key, gồm C16 T1-R Q40 audit sót) · A11 · E13 (16 test, cả description). Kiểm chứng: `test-answer-alternatives` pass, 46/46 key có ngoặc đúng luật tuỳ chọn, quét mojibake toàn DB = 0, `eslint` + `tsc --noEmit` sạch. Script vá: `.tmp-import/fix-gt/`.
Ghi chú: `test-reading-passage-chrome.ts` **đã fail từ trước** Phase 0 ("only the reading passage column opts into paragraph layout") → xử lý trong Phase 1.

1. **C2 — chấm điểm dấu ngoặc** (`src/lib/scoring.ts`)
   - Test (thêm vào `scripts/test-answer-alternatives.ts`): `s`/`th`/`st`/`e` phải **sai** với `camera(s)`, `10(th) September`, `1(st) October`, `blond(e)`; `camera`, `cameras`, `10 September`, `10th September`, `blonde` phải **đúng**.
   - Sửa: `parenthesisForms` chỉ sinh dạng "bỏ ngoặc" và "giữ nội dung ngoặc ghép vào từ", không sinh nội dung ngoặc đứng một mình (trừ khi key là `(…)` toàn bộ).
   - Kiểm chứng: chạy toàn bộ test answer-alternatives + `.tmp-import/audit-gt/scorer-check.ts`.
2. **C1** — sau C2 chỉ cần cho đẹp hiển thị đáp án; quyết định có viết lại 9 key thành `a/b` hay không.
3. **A11** — thêm `practice.answers` vào `vi.json` ("Đáp án") + `en.json` ("Answers").
4. **E13** — script patch thay `â€”` → `—` trong title mọi test C12.

## Phase 1 — Layout trái-đọc / phải-trả-lời (A0, A1, A14) 🔴 ✅ xong 17/10/2026

Kết quả: tách `src/components/practice/question-workspace.tsx` (cột trái chỉ đọc + `AnswerSheet`), `src/lib/practice/letter-range.ts`, sửa `gap-stems.ts`, thêm key `practice.sentenceEndings`. Kiểm chứng: 13/13 `scripts/test-*.ts` pass (mới: `test:left-right-contract`, `test:letter-range`), contract GT 67 test / 230 phần = 0 control cột trái, `tsc` + `eslint` 0 lỗi, xem UI ở 390 / 1024 / 1440 px (C11 T1-R, C11 T3-L, C15 T2-L có audio). Còn lại đúng như dự kiến cho Phase 2–3: contract 8 lỗi dữ liệu (A6 C12 T5-R Q28–30, A9 C15 T3-R Q31–35), gap audit 27 thiếu (A2 map: C11 T2-L, C11 T4-L, C15 T2-L, C15 T4-L, C16 T1-L; A3 bảng: C13 T1-L, C17 T4-R). Chưa commit theo yêu cầu (commit khi xong toàn bộ).

Thay đổi kiến trúc lớn nhất; làm trước vì A1–A6 phụ thuộc cách render mới.

- Đọc lại `QUESTION-LAYOUT-SPEC.md` mục 1.8 làm hợp đồng render.
- Tách `practice-session.tsx` (83 KB): trích phần render cột trái (passage + đề, chỉ đọc) và cột phải (ANSWERS) thành component riêng trước khi đổi hành vi — refactor không đổi UI, commit riêng.
- Test hợp đồng (script mới `test-left-right-contract.ts`): với mỗi dạng câu (gap, MCQ, multi-select, matching, map, TFNG, table, flow-chart), cột trái không sinh input/select/radio/checkbox; cột phải đúng 1 control mỗi câu; gap hiển thị `N ______`.
- A1: chuẩn hoá gap (14 dấu `_` = 1 blank; gap đầu câu) trong `src/lib/questions/gap-stems.ts` + `test-gap-stems.ts`.
- A14: map labeling → dropdown chữ cái ở cột ANSWERS.
- Kiểm chứng UI: C11 T3-L Q7–10, C11 T1-R Q22–27, C12 T5-R, C18 T2-R Q26, một Reading C15 T2 (PUBLISHED).

## Phase 2 — Lỗi renderer theo test (A2–A10) 🔴🟠 ✅ xong 17/10/2026

Kết quả: A2–A8, A18, A19 và lỗi legacy PUBLISHED `reading` Q4–13 đã sửa và có test hồi quy. A9 cùng phần C15 của A10 được chuyển sang Phase 3 vì nguồn C15 sẽ được nhập lại toàn bộ. Kiểm chứng: 17/17 test qua; GT contract 0 lỗi/67 test/230 phần; gap audit 0 thiếu, 0 trùng; 0/77 `SHORT_ANSWER` bị ẩn; `tsc --noEmit` và ESLint trên toàn bộ file Phase 0–2 đều sạch.

Thứ tự: **A2 (PUBLISHED)** → A3 → A4 → A5 → A6 → A7–A10. Mỗi mục: tái hiện bằng dữ liệu thật từ `.tmp-import/audit-gt/gt-dump.json` trong test → sửa → chạy lại `fmt-render.ts`/`fmt-checks.ts`.

| Mục | File nghi | Test |
|---|---|---|
| A2 nhãn map ẩn | `question-type-label.ts` (`shouldHideStemBesideNotes`), `map-label-layout.ts` | `test-map-label-layout`, `test-sentence-gap-layout` |
| A3 bảng ô nhiều dòng | `src/lib/practice/notes-table.ts` | test mới `test-notes-table.ts` (C13 T1-L, C17 T4-R Q22–27) |
| A4 passage thứ 2 lọt khung | `src/lib/practice/reading-content.ts` | `test-reading-passage-chrome` |
| A5 lộ `[[b0]]` | `notes-outline.ts` | `test-notes-outline` |
| A6 C12 T5-R Q28–30 | `shared-choice.ts` | `test-shared-choice` |
| A7, A10 lead-in / header `[[section]]` | `reading-content.ts`, `split-parts.ts` | `test-reading-passage-chrome` |
| A8, A9 flow-chart / summary | `layout-variants.ts`, `notes-outline.ts` | `test-layout-variants` |

## Phase 3 — Re-import Cambridge 15 (D1–D12) ⚠️ ✅ xong 17/10/2026

Kết quả Phase 3: tách PDF gốc thành 4 file Test (22 trang/file) + 1 file Keys (8 trang), loại intro/Writing samples/audioscripts; OCR và dựng lại đủ 16 bài C15 từ 5 file này. Reading đủ passage/instruction/legend/options; Listening đủ MCQ/matching/map/form/notes; Writing và Speaking đủ cấu trúc chuẩn. Import tại chỗ giữ nguyên toàn bộ ID, trạng thái, 4 attempts và 0 AttemptAnswer. Nguồn import có dry-run mặc định và từ chối xoá/tạo lại record khi số section/question lệch.

Kiểm chứng: 16/16 draft hợp lệ; Listening/Reading đủ 40 câu, Writing 2 task, Speaking 11 prompt; word count Reading T1–T4 lần lượt 884/916/1321, 877/918/1366, 1008/1015/1226, 914/958/1322; audit `fmt-checks`/`fmt-struct` không còn lỗi D1–D12; 17/17 test hồi quy, `tsc --noEmit` và ESLint phạm vi Phase 3 đều qua. Kiểm tra trình duyệt thủ công đủ 16 bài vẫn nằm trong Phase 7/G; vòng này đã kiểm tra contract renderer và dữ liệu render của toàn bộ C15.

- [x] Re-import cả bộ từ PDF theo `QUESTION-LAYOUT-SPEC.md` (dùng pipeline giống `.tmp-import/c14gt/`: OCR → build → keys → import), không vá từng câu.
- [x] Cập nhật `scripts/import-cambridge-15-general-test-1.ts` / `-tests-2-4.ts` hoặc thay bằng import mới.
- [x] Giữ nguyên slug/ID test PUBLISHED để không mất attempt của học viên — xác nhận cách `persist.ts` upsert trước khi chạy.
- [x] Kiểm chứng tự động: word count passage (`wordcounts.ts`), `fmt-struct.ts`, `fmt-checks.ts` = 0 lỗi D1–D12 cho C15; contract renderer toàn bộ dữ liệu C15. Mở thủ công đủ 16 bài để ở Phase 7/G.

## Phase 4 — Dữ liệu các bộ khác (E1–E15, A12, A13) ✅ xong 17/10/2026

Kết quả: hoàn tất A12, A13 và toàn bộ E1–E15 còn mở. Thêm normalizer dùng chung cho Writing/Speaking vào pipeline; sửa parser Reading để instruction “Label …” đứng trước ảnh; thêm regression E9/E10/E14 và script patch idempotent `scripts/fix-gt-format.ts` (dry-run mặc định, `--apply` chạy trong transaction).

- DB: xoá 110 page ref; tách 28 bài Speaking ngoài C15 thành 308 prompt (4/1/6); chuẩn hoá 32 bài Writing; sửa các mục E2/E3/E5–E8/E11/E12/E15. Tổng cộng cập nhật 183 section + 153 question, tạo 224 question; giữ nguyên ID test/section và ID câu đầu mỗi Speaking part.
- E9/E10 được xác nhận đã đúng ở dữ liệu hiện tại và renderer; E14 cần một sửa code nhỏ trong `reading-content.ts`. Cả ba có test SSR và postflight render trực tiếp từ dump DB.
- Nguồn import C11–C14/C16–C18 và C15 T1 đã được sửa để lần nhập lại không tái phát; 49 file Python parse cú pháp thành công.
- Kiểm chứng: dry-run sau apply = 0 thay đổi; postflight 128 bài = 0 vấn đề; 19/19 `scripts/test-*.ts`, `tsc --noEmit` và ESLint đều qua. Backup: `.tmp-import/phase4/backup-2026-10-17T09-33-02-625Z.json`.
- Lưu ý PUBLISHED: C15 T2-W chỉ được thêm dấu `:` sau “In your letter”; không đổi nội dung, ID, trạng thái hay attempt.

## Phase 5 — Mock PUBLISHED (F1–F5) ⚠️ ✅ xong 17/10/2026

Kết quả: F1–F4 đã được chuẩn hoá bằng normalizer dùng chung và script patch idempotent `scripts/fix-gt-mocks.ts` (dry-run mặc định, `--apply` chạy trong transaction). Bốn mock có variant rõ ràng; Listening dùng tiêu đề Section và đúng cấu trúc table/notes/form; hai Reading không còn marker thô/header lặp và có đủ instruction cho các nhóm câu hiện có. Importer nguồn đã gọi normalizer để lần nhập lại không tái phát. F5 được xác nhận không phải lỗi: `general-writing-mocktest-1` chủ đích chỉ có Task 1, không cần Task 2.

Kiểm chứng: regression `test:mock-normalization` pass; `tsc --noEmit` và ESLint phạm vi Phase 5 sạch; dry-run sau apply = 0 thay đổi. DB giữ nguyên 4 test PUBLISHED, 3 attempts và 0 AttemptAnswer; không tạo/xoá record.

## Phase 6 — Audio (B1) + UI nhỏ (A15–A17) ✅ xong 17/10/2026

- B1: xác nhận theo quyết định sản phẩm rằng 12 bài Listening C11, C12 và C18 **không cần audio**; không upload hoặc gán `audioUrl` giả.
- A15–A17 đã xong: ảnh theo câu nằm trong đúng group sau instruction; ảnh không xác định được range mới dùng vị trí fallback đầu section; ảnh có modal phóng to trên mobile, đóng bằng nút/nền/Escape; persist DB thành công invalidates tag và các route catalog.
- Kiểm chứng: `test:catalog-invalidation`, `test:map-label-layout`, `test:left-right-contract` (28 test / 98 phần), `tsc --noEmit` và ESLint đều pass. Dev server compile sạch; `GET /tests/general` trả 200.

## Phase 7 — Kiểm chứng tổng (G) 🟡 tự động xong 17/10/2026

- Đã làm mới dump 132 test và chạy lại `.tmp-import/audit-gt/`: 82/82 URL media hợp lệ, **0 lỗi có thể hành động**. 85 cảnh báo còn lại đều thuộc quyết định sản phẩm đã chốt (12 đề không audio, cấu trúc Speaking 4/1/6, các mock rút gọn).
- Phát hiện và sửa thêm 32 cue card Speaking Part 2 bị dẹt thành một dòng; normalizer và importer nay xuất `You should say:`, bullet và dòng `and explain...` đúng cấu trúc. Dry-run sau apply = 0 thay đổi. Backup: `.tmp-import/phase4/backup-2026-10-17T10-41-55-193Z.json`.
- Thêm `test:gt-final-audit` để khóa chính sách audit; toàn bộ 21 script hồi quy pass. ESLint phạm vi thay đổi sạch và production build pass. Full lint toàn repo vẫn báo lỗi/cảnh báo tồn tại sẵn chủ yếu trong thư mục audit/tạm, không thuộc thay đổi GT.
- Còn kiểm tra trình duyệt thủ công các test phần G ở 390px + 1366px và console; môi trường hiện tại không có browser automation nên chưa đánh dấu hoàn tất phần này.

---

## Quyết định (17/10/2026)

1. C1: **có** — viết lại 9 key thành dạng `a/b` (vd `camera/cameras`).
2. Phase 3: **được** thay toàn bộ question của bài C15 PUBLISHED khi re-import.
3. F5 + B1: Writing mock chủ đích chỉ có Task 1; 12 bài Listening C11/C12/C18 chủ đích không cần audio.
4. E15: **không** phải tên viết liền trong đề gốc → tách thành `Future Plus`, `Sport Watch`, `Post Bus`, `Kitchen Aid` (đối chiếu PDF từng chỗ trước khi sửa).
5. Quy trình: đi **từng phase một**, dừng báo cáo sau mỗi phase. **Chỉ commit/push khi đã sửa xong toàn bộ.**
