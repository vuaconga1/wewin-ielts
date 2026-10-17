# Checklist lỗi — IELTS General Training (audit 17/10/2026)

Phạm vi: 132 test trong tab **IELTS General Training** (Cambridge 11–18, mỗi bộ 4 test × 4 kỹ năng, + 4 mock).
10 test **PUBLISHED**: C15 T2 (L/R/W/S), C15 T3-L, C15 T4-L, 4 mock. Còn lại DRAFT.

Ký hiệu: `C` = Cambridge, `T` = Test, `L/R/W/S` = Listening/Reading/Writing/Speaking, `Q` = câu.
Loại: **[CODE]** = sửa renderer/parser (sửa 1 chỗ ảnh hưởng nhiều test) · **[DATA]** = sửa dữ liệu/re-import test cụ thể.
Ưu tiên: 🔴 cao · 🟠 trung bình · 🟢 thấp. ⚠️ = ảnh hưởng test đang PUBLISHED.

Báo cáo gốc (bằng chứng chi tiết, screenshot): `.tmp-import/audit-gt/data-report.md`, `format-report.md`, `ui-report.md`, `ui/`.

## Đã OK (không cần sửa)
- Không câu nào thiếu đáp án; đáp án MCQ/Matching/Map/TFNG đều nằm trong option list.
- 57 cặp MULTI_SELECT hợp lệ; đánh số 1–40 đủ, không trùng/hổng.
- 82 URL audio/ảnh trên R2 đều trả 200; mọi câu Map/Diagram có ảnh.
- Không có i18n key thô / enum SCREAMING_SNAKE; không tràn ngang trang ở 390px và 1366px.
- Headings list hiển thị đúng; câu "Choose TWO" có đủ 2 lựa chọn.

---

## Quy tắc layout đã thống nhất (17/10/2026)

Áp dụng cho Listening **và** Reading, mọi dạng câu hỏi (chi tiết: `QUESTION-LAYOUT-SPEC.md` mục 1.8):

- **Trái = chỉ đọc**: bài đọc (Reading) + toàn bộ đề câu hỏi. Chỗ trống hiện số câu + `______`.
- **Phải = chỉ cột ANSWERS**: mỗi câu đúng một ô (text / dropdown).
- **Tuyệt đối không** có ô nhập, dropdown, radio, checkbox ở cột trái — kể cả trong câu hay danh sách ô dưới nhóm câu.
- Reading đổi theo: hiện tại cột phải chứa câu hỏi + ô nhập → chuyển câu hỏi sang cột trái (dưới/cạnh bài đọc), cột phải chỉ còn ANSWERS giống Listening.

---

## Phần A — Lỗi renderer / parser [CODE]

Sửa trước vì mỗi mục sửa được hàng loạt test.

- [x] **A0 🔴 Đưa layout về quy tắc trái-đọc / phải-trả-lời.** (xong: `question-workspace.tsx`; Reading xl 3 cột Passage | Câu hỏi | ANSWERS, lg 2 cột, mobile xếp chồng; contract 230 phần GT = 0 control ở cột trái)
  - Listening: bỏ mọi ô nhập ở cột trái (vd C11 T3-L Q7–10 đang có ô ở cả hai cột — hình đã chụp).
  - Reading: chuyển phần câu hỏi sang cột trái cùng bài đọc; cột phải chỉ còn ANSWERS (text/dropdown) cho mọi dạng.
  - MCQ / matching / map / TFNG / Choose TWO: chọn bằng dropdown ở cột ANSWERS, không tick ở phần đề.
- [x] **A1 🔴 Gap trong câu điền từ hiển thị không đồng nhất.** (xong: gap chạy liền = 1 blank, gap đầu câu chỉ nhận câu hoàn chỉnh; cột trái chỉ còn `N ______`) Gap `______________` (14 dấu `_`) bị đếm thành 2 blank; câu bắt đầu bằng gap lại sinh ô nhập trong câu.
  - Theo quy tắc mới: mọi gap ở cột trái chỉ hiện số câu + `______` (không ô nhập); bỏ danh sách ô rời dưới nhóm câu.
  - Ảnh hưởng 158/170 câu Reading SENTENCE_COMPLETION + C11 T3-L Q7–10 + C13 T1-L Section 3.
  - Câu đang có ô trong câu: C11 T1-R Q26, C12 T5-R Q16/17/38, C12 T7-R Q17, C18 T2-R Q26.
  - Kiểm tra lại: C11 T1-R Q22–27, C12 T5-R S2/S3, C12 T6-R S2, C18 T3-R, C18 T4-R.
- [x] **A2 🔴 ⚠️ Nhãn map/plan bị ẩn** (chỉ hiện "17." + ô nhập, mất tên địa điểm). Nghi `shouldHideStemBesideNotes`. (xong: nhãn viết thường bị coi là mảnh notes; MAP_LABELING không bao giờ ẩn stem — quét 95 câu MAP_LABELING toàn DB: 26 ẩn → 0)
  - C11 T2-L Q17–20 · C11 T4-L Q17–20 · **C15 T2-L Q15–20 (PUBLISHED)** · **C15 T4-L Q11–16 (PUBLISHED)** · C16 T1-L Q15–20.
- [x] **A3 🔴 Bảng có ô nhiều dòng (`•` + xuống dòng) bị vỡ.** (xong: `parseMarkdownTable` gộp dòng tiếp theo vào ô tới khi gặp `|` đóng hàng; dòng ngắt mềm nối bằng dấu cách — `test-notes-table.ts`; gap audit 12 thiếu → 0; đã xem 8 bảng trong danh sách + Academic test-4)
  - Gap rơi ra ngoài bảng: C13 T1-L Q1–10 (chỉ 1/10 gap trong bảng); **C17 T4-R Q22–27 — Q23–27 không có ô nhập, không làm được**.
  - Cũng gặp ở Academic (phát hiện bằng `test:left-right-contract`): `test-4-listening` Q38–39 nằm trong ô bảng có bullet `*` → không hiện số câu.
  - Phình hàng / lệch cột: C11 T4-L Q1–7 (Q5 tách thành hàng riêng), C12 T7-L Q18–20, C16 T1-R Q15–20, C18 T1-R Q23–27, C18 T2-L Q6–10, C18 T4-R Q22–27 (nội dung rơi sai cột HAZARD).
- [x] **A4 🔴 Bài đọc thứ hai của section lọt vào khung câu hỏi (flow-chart/notes box) thay vì vùng passage.** (xong cùng A7: mỗi lead-in "Read the text…" kèm bài đọc sau nó được chuyển sang cột passage, có tiêu đề riêng — `test-reading-multi-passage.ts`; quét 148 section Reading: 0 lead-in còn ở cột câu hỏi, Academic không đổi; đã xem trên trình duyệt C11 T1-R S2, C17 T4-R S2, C18 T1-R S2)
  - C17 T4-R Section 2 ("Plumbing skills") · C11 T1-R Section 2.
- [x] **A5 🔴 Lộ marker `[[b0]]`, dòng notes bị gộp vào instruction.** (xong: dòng có ô trống đánh số không bao giờ là instruction — trước đây "Choose…", "According to…", "…no more than 48 hours" bị bắt nhầm; `test-notes-gap-lines.ts`. Quét toàn DB: 8 dòng được trả về notes — 3 dòng A5 + C11 T3-R Q16, C17 T2-L Q38, Academic test-11-L Q28, và 2 dòng summary C15 T3-R/T4-R thuộc A9; 0 instruction còn chứa ô trống/marker)
  - C12 T5-R Q21–27 (Q22 nằm trong instruction in đậm, không có ô) · C12 T8-R Q23 · C12 T5-L Q40.
- [x] **A6 🔴 C12 T5-R Q28–30**: câu điền từ hiện thành dropdown A–G (lấy danh sách người của Q31–35); instruction Q31–35 bị cụt. (xong: danh sách chữ cái ngắn chỉ gắn cho ô trống từ header "Questions…" gần nhất — `test-summary-word-list.ts`; so sánh toàn DB: chỉ 8 câu đổi = C12 T5-R Q28–30 + C15 T3-R Q31–35, contract GT 8 → 0. Instruction cắt ở "(" + "Questions x–y) and the list…" được nối lại: 15/15 section, gồm 7 đề Academic)
- [x] **A7 🟠 Lead-in "Read the text below and answer Questions…" dính vào instruction nhóm trước** — hầu hết Reading section 1–2 (trừ C15) + `general-reading-mocktest-1`. (xong: lead-in thành đầu mục `[[section]]` ở cột passage, không còn trong instruction)
- [x] **A8 🟠 C12 T7-L Q21–26 flow-chart**: mất text các bước, Q22/Q23 tách sai. (xong — lỗi dữ liệu, renderer không cần sửa: viết lại khối flow-chart theo đề gốc tr.56 — 3 khung RESEARCH / ANALYSIS / WRITING THE CASE STUDY nối bằng ↓, số câu đặt trước ô trống, Q22+Q23 chung một dòng; stem 6 câu khớp nội dung, variant → FLOW_CHART_COMPLETION, giữ options A–H + key C/E/H/B/A/F. Script `.tmp-import/fix-gt/fix-a8-c12t7l-flow.ts`, nguồn `.tmp-import/c12gt/c12_t7.py` sửa theo; fixture trong `test-left-right-contract.ts`). Cùng lỗi hiển thị (mũi tên rỗng, các bước rơi xuống thành danh sách câu) ở **C12 T6-L Q26–30** và **C13 T1-L Q26–30** — đã đối chiếu đề gốc (C12 T6 tr.36, C13 T1 tr.14) và chuyển số câu về trước ô trống (`fix-a8-flow-numbers.ts`, nguồn `c12_t6.py` / `build_c13.py`). Quét toàn DB: 0 flow-chart còn bước "số câu đầu dòng" sai.
- [x] **A9 🟠 Summary không có notes** (instruction lặp → chỉ hiện ô input trơn): C15 T3-R Q31–35, C15 T4-R Q28–32. → **đã sửa trong Phase 3**: dữ liệu C15 sai cấu trúc (cả đoạn summary + instruction dồn vào một dòng và nằm dưới nhóm câu kế tiếp), đã được thay khi nhập lại C15 từ PDF; vá renderer cho dữ liệu sắp bỏ là sai chỗ. Phần sửa được ngay đã xong cùng A6: C15 T3-R Q31–35 không còn dropdown danh sách nhà nghiên cứu.
- [x] **A10 🟠 Câu không thuộc nhóm nào** (header bọc `[[section]]`, không instruction): C15 T1-R cả 3 section, ⚠️ C15 T2-R Section 1, `general-reading-grade-8` Section 3.
  - [x] `general-reading-grade-8` Section 3 (PUBLISHED): header "Questions 21-25:" có dấu hai chấm bị coi là mảnh câu cụt → không nhóm, mất instruction. Nay header có ":" cuối được nhận (`matchQuestionGroupHeader`; `test-notes-gap-lines.ts`); quét DB: chỉ đề này dùng kiểu header đó. Đã xem trên trình duyệt.
  - [x] Phần C15 → **xong trong Phase 3** (dữ liệu C15 đã được nhập lại từ PDF).
- [x] **A11 🟠 Thiếu key i18n `practice.answers`** (đã thêm: vi "Phần trả lời", en "Answers") → giao diện tiếng Việt hiện "ANSWERS" ở khung đáp án Listening. Thêm vào `vi.json` + `en.json`.
- [x] **A12 🟠 Writing Task 1 mất dấu "•"** ở bullet khi hiển thị: C11, C12, C13, C17, C18. (xong Phase 4: parser/import khôi phục đúng 3 bullet và dấu `:`; đã chuẩn hoá section + question của 32 bài Writing C11–C18)
- [x] **A13 🟠 Speaking gộp cả part thành một đoạn**, không tách từng câu hỏi (C11–C18). Trường `speakingPart` không bao giờ được set (mọi test). (xong Phase 4: 28 bài Speaking ngoài C15 đã được tách thành 11 prompt theo cấu trúc 4/1/6, đánh số 1–11 và set `speakingPart`/variant; giữ ID section và câu đầu mỗi part)
- [x] **A14 🟠 Map labeling luôn là ô nhập tự do** (xong: dải chữ lấy từ instruction "correct letter, A–I" → 62 dropdown, `letter-range.ts`) — theo quy tắc mới phải là dropdown chữ cái ở cột ANSWERS.
- [x] **A18 🟠 (phát hiện thêm khi sửa A2) Choose TWO: danh sách A–E in trước câu hỏi chung, kèm dòng "21." "22." trống ở cột trái** — sai spec §4.4 (câu hỏi trước, rồi A–E, không đánh số). Vd C15 T2-L Q21–24. (xong: cột trái chỉ đọc in câu hỏi chung một lần rồi tới A–E, ô chọn chỉ ở ANSWERS — `shared-choice-answers.tsx`; fixture trong `test-left-right-contract.ts`; đã xem C15 T2-L ở 1024 px và 390 px)
- [x] **A19 🟠 (phát hiện thêm khi xem lại A4) Tiêu đề notes có ngoặc bị dính vào bullet phía trên**: C18 T1-R Q21 — "Secondary lifting equipment (chains, slings, etc.)" nối vào cuối dòng "…crane driver". (xong: `isNotesSubheading` bỏ qua cụm ngoặc cuối dòng khi xét dấu câu; quét toàn DB chỉ đổi dòng này + 1 phương án MCQ không qua notes — `test-notes-outline.ts`). Cùng họ: nhãn viết hoa kết thúc bằng ":" ("Venue and timing:", "Medical history:", "Periods of availability exclude:"…) bị nối vào bullet trên — 22 chỗ trong 12 test, nay giữ dòng riêng.
- [x] **A20 🔴 Legacy PUBLISHED `reading` mất nội dung Q4–13** — Q4–8 là `SHORT_ANSWER` viết thường bị nhận nhầm thành mảnh notes và ẩn; Q9–13 có stem rỗng trong DB dù câu hỏi đầy đủ còn trong `part.content`. Đã giữ mọi `SHORT_ANSWER` ở prompt và khôi phục dòng câu hỏi đánh số vào `sentenceStems` (`test-sentence-gap-layout.ts`, `test-left-right-contract.ts`). Kiểm chứng trực tiếp DB: Q4–13 hiện đủ, ANSWERS vẫn đúng 10 control; 0/77 `SHORT_ANSWER` còn bị ẩn.
- [x] **A15 🟢 Ảnh map luôn nằm đầu section**, trước cả MCQ không liên quan. (xong: ảnh có question range render ngay sau instruction của group sở hữu; chỉ ảnh section không xác định được range mới nằm ở fallback đầu section)
- [x] **A16 🟢 Mobile: ảnh map thu còn ~329px**, chữ khó đọc. (xong: ảnh là nút phóng to; modal toàn màn hình đóng bằng nút, nền hoặc Escape; có nhãn truy cập và i18n vi/en)
- [x] **A17 🟢 Catalog từng không hiện test C11 do cache cũ** — kiểm tra revalidate sau khi import/publish. (xong: sau persist DB thành công, xoá memory cache, revalidate tag `tests-catalog` và các path `/tests`, `/tests/general`, `/tests/academic`, `/tests/placement`; có regression contract)

---

## Phần B — Audio [DATA]

- [x] **B1 12 bài Listening không có audio** — đã xác nhận đây là chủ đích sản phẩm, không phải lỗi; không cần file hoặc `audioUrl`:
  - [x] C11 T1-L · [x] C11 T2-L · [x] C11 T3-L · [x] C11 T4-L
  - [x] C12 T5-L · [x] C12 T6-L · [x] C12 T7-L · [x] C12 T8-L
  - [x] C18 T1-L · [x] C18 T2-L · [x] C18 T3-L · [x] C18 T4-L

---

## Phần C — Answer keys [DATA]

- [x] **C1 🟠 Đáp án dính ngoặc** — học viên gõ `s`/`th`/`st`/`e` vẫn được chấm đúng. Viết lại thành biến thể tách bằng `/` (vd `camera/cameras`, `10 September/10th September`). Đã sửa DB + file key nguồn (`.tmp-import/fix-gt/fix-c1-paren-keys.ts`).
  - [x] C14 T1-L Q6 `10(th) September` · [x] C14 T1-L Q9 `blond(e)`
  - [x] C14 T1-R Q17 `1(st) October`
  - [x] C14 T2-L Q2 `10(th) October`
  - [x] C14 T4-L Q37 `camera(s)`
  - [x] C16 T4-L Q31 `spice(s)`
  - [x] C17 T4-L Q1 `floor(s)` · [x] C17 T4-L Q34 `rock(s)`
  - [x] C18 T1-L Q2 `24(th) April`
  - [x] (bổ sung, audit sót) C16 T1-R Q40 `multi(-)coloured / multi(-)colored` — gõ `-` từng được chấm đúng.
- [x] **C2 🟠 (CODE)** `isAnswerCorrect` không còn coi phần trong ngoặc là đáp án độc lập — ngoặc = phần tuỳ chọn. Đã kiểm 46/46 đáp án có ngoặc trong DB.

---

## Phần D — Cambridge 15: nhập lại toàn bộ [DATA] ⚠️

**Phase 3 hoàn tất từ 5 PDF đã tách (17/10/2026):** re-import đủ 16 bài C15; D1–D12, A9 và phần C15 của A10 đã được xử lý. Giữ nguyên toàn bộ Test/Section/Question ID, trạng thái xuất bản và 4 lượt làm bài hiện có.

Khuyến nghị re-import cả bộ từ PDF theo `QUESTION-LAYOUT-SPEC.md` thay vì vá từng câu.

- [x] **D1 Reading — passage bị rút gọn/tóm tắt**: T1 S1 283 từ, S2 224 từ, S3 352 từ; T2 nghi là bản tóm tắt.
- [x] **D2 Reading — thiếu instruction**:
  - T1: Q1–6, 7–14, 15–22, 23–27 chỉ có "Questions x–y"; S3 không có header Q28–40.
  - ⚠️ T2: Q1–6 · T3: Q15–20, Q21–27, Q28–40 · T4: Q1–7, Q8–14, Q15–20, Q28–40.
- [x] **D3 Reading — TFNG thiếu legend** TRUE/FALSE/NOT GIVEN: T1, ⚠️ T2, T3, T4.
- [x] **D4 Reading — options placeholder "Option A…K"**: T3 Q8–14, Q21–29; T4 Q1–7, Q38–39. Option có tiền tố "— ": T3 Q30, T4 Q40.
- [x] **D5 Reading — sai variant FLOW_CHART**: T3 Q15–20, Q31–35; T4 Q15–20, Q21–27. T3 Q28–30 instruction thiếu dấu phẩy.
- [x] **D6 Reading — matching**: T1 Q7–14, ⚠️ T2 Q7–14 option là tên sản phẩm thay vì chữ cái; ⚠️ T2 Q7–14 gắn MATCHING_FEATURES (chuẩn: MATCHING_INFORMATION).
- [x] **D7 Reading — ⚠️ T2 Q28–33 không có List of Headings; ⚠️ T2 Q34–37 không có MCQ trong content.**
- [x] **D8 Listening — MCQ không có trong content**: single T1 Q11–14, ⚠️ T2 Q11–14, ⚠️ T3 Q11–16, ⚠️ T4 Q21–24; MULTI_SELECT T1 Q29–30, ⚠️ T2 Q21–24, ⚠️ T3 Q17–20, ⚠️ T4 Q17–20 (T4 Q17/Q19 stem thiếu "Which TWO").
- [x] **D9 Listening — matching bank chữ cái**: ⚠️ T2 Q25–30, ⚠️ T3 Q27–30, ⚠️ T4 Q25–30 gắn MATCHING_FEATURES + thiếu bank trong content (item kết thúc bằng "......"). T1 Q21–30 một header gom 3 loại câu, không instruction, không bank.
- [x] **D10 Listening — sai dạng / thiếu cấu trúc**:
  - T1 Q1–10: instruction "Complete the notes" nhưng lưu FLOW_CHART.
  - T1 Q15–20: bảng thật nhưng variant NOTE, stem điền sẵn.
  - T1 S3 Q21–30 không có instruction; Q29–30 thiếu "Choose TWO".
  - ⚠️ T2 Q31–40, ⚠️ T4 Q31–40: dùng dòng `- ` thay cho `[[b1]]`.
  - ⚠️ T3 Q21–26: notes không có ntitle.
  - ⚠️ T4 Q1–10: instruction "form" nhưng variant NOTE.
- [x] **D11 Writing**:
  - Task 1 T1–T4: dùng bullet "•", tiêu đề "Writing Task N"; T1/T3/T4 "In your letter:" có dấu hai chấm.
  - T3, T4: "Begin: Dear …,", lẫn câu Task 2 ("Give reasons where appropriate…"), thiếu "You do NOT need to write any addresses".
  - T1: dòng 150 words và dòng addresses bị gộp.
  - Task 2 T3, T4: thiếu "Write about the following topic:".
- [x] **D12 Speaking T1–T4** (⚠️ T2): 11 câu rời (4/1/6) thay vì 3 part; tiêu đề "Part N"; cue card 1 dòng ngăn bằng `;`; không "You should say:", không ghi chú thời gian, không nhãn EXAMPLE, không tên chủ đề.

---

## Phần E — Lệch format trong cùng dạng câu (các bộ khác) [DATA]

- [x] **E1 🟠 Còn "on page N" / "pages X and Y" trong instruction** — 110 lần trong 28 test Reading (C11–C14, C16–C18). Xoá cụm page ref. (xong: xoá đủ 110 page ref trong 58 section; audit còn 0)
- [x] **E2 🟠 "Label the plan" nhưng variant MAP_LABELING** (chuẩn: PLAN_LABELING): C11 T2-L Q17–20, C11 T4-L Q17–20, C14 T2-L Q16–20. (xong: 13 câu chuyển sang `PLAN_LABELING`; audit không còn MAP/PLAN lệch)
- [x] **E3 🟠 Notes thiếu box/ntitle** (chuẩn `[[box]]` + `[[ntitle]]` + `[[b0]]`): (xong: 5 section có đủ `[[box]]`/`[[ntitle]]`, tiêu đề không còn dính dòng đầu)
  - C11 T2-L Q1–10 (tiêu đề dính "Youth CouncilExample") · C12 T5-L Q31–40 · C12 T6-L Q31–40 · C14 T3-L Q21–26 · C17 T2-R Q15–20.
  - Tiêu đề dính vào dòng đầu (quét chữ dính toàn GT, chỉ còn 3 chỗ, đều thuộc E3): C12 T5-L "Four business valuesMany" · C12 T6-L "Conflict at workConflict" · C14 T3-L "school marching bandIt".
- [x] **E4 🟠 Flow-chart có bank chữ cái lưu thành MATCHING**: C12 T6-L Q26–30, C12 T7-L Q21–26, C13 T1-L Q26–30.
  - C12 T7-L Q21–26 đã sửa cùng A8 (giữ type MATCHING + options để dropdown hiện chữ + từ như `test-11-listening` đang chạy đúng; variant → FLOW_CHART_COMPLETION; bỏ số câu đầu dòng). C12 T6-L Q26–30 và C13 T1-L Q26–30 cũng đã sửa cùng A8 (cùng cách). → E4 xong.
- [x] **E5 🟠 Table bị làm phẳng thành notes box**: C16 T2-L Q1–10. (xong: C16 T2-L Q1–10 dựng lại thành bảng 2 cột, giữ đủ 10 gap)
- [x] **E6 🟠 Matching chữ cái gắn MATCHING_FEATURES** (chuẩn MATCHING_INFORMATION): C16 T1-L Q25–30, C17 T1-R Q1–5. (xong: 11 câu chuyển sang `MATCHING_INFORMATION`)
- [x] **E7 🟢 Word limit thiếu "ONLY"**: C11 T1-L Q11–14, C18 T4-R Q15–21. (xong: cả 2 instruction dùng `ONE WORD ONLY`)
- [x] **E8 🟠 C11 T4**: (xong: 7 heading dùng “Section”, Q22–27 dùng `NOTE_COMPLETION`, dòng “Who is each play suitable for?” hiển thị trên UI)
  - R headings: instruction nói "sections" nhưng stem "Paragraph".
  - R Q22–27: là các bước dạng notes, không phải câu (đang SENTENCE_COMPLETION).
  - L S1: mất dòng "Who is each play suitable for?" trên UI.
- [x] **E9 🟠 C11 T2-L Section 2**: cách hiển thị danh sách lựa chọn khác nhau trong cùng section. (xong: ba nhóm Choose TWO render đồng nhất; regression và live-dump render đều qua)
- [x] **E10 🔴 C14 T3-R Section 1**: mất header Q8–14 và các statement. (xong: header Q8–14 và đủ 7 statement hiện trong prompt; kiểm chứng trực tiếp bằng render dữ liệu DB)
- [x] **E11 🟢 C17 T4-W Task 1**: "Write a letter" nhưng "In your email". (xong: đổi “In your email” thành “In your letter”)
- [x] **E12 🟢 Placeholder lời chào không thống nhất** — chọn một kiểu (đề xuất `Dear ……………,`): (xong: chuẩn hoá placeholder về `Dear ……………,`)
  - `Dear ...............,`: C14 T4, C16 T4 · `Dear …,`: C15 T1 · `Dear ……,`: C17 T1.
- [x] **E13 🟠 Lỗi font "â€”" trong tiêu đề** mọi test C12 (thay bằng "—"). Đã sửa title + description 16 test và script nguồn `.tmp-import/c12gt/import-c12.ts`; quét toàn DB còn 0 chỗ.
- [x] **E14 🟢 C18 T3-R Q38–40**: "Label the diagram below." hiện sau hình. (xong: parser nhận “Label …” là instruction nên dòng hướng dẫn render trước ảnh; có regression test)
- [x] **E15 🟢 Chữ dính (xác nhận có phải tên thương hiệu thật)**: FuturePlus (C12 T6), SportWatch (C13 T3), PostBus (C14 T4, cả stem Q38), KitchenAid (C18 T4). (xong theo quyết định đã đối chiếu PDF: `Future Plus`, `Sport Watch`, `Post Bus`, `Kitchen Aid`; còn 0 dạng viết dính)

**Phase 4 hoàn tất 17/10/2026:** script `scripts/fix-gt-format.ts` chạy dry-run mặc định và ghi trong transaction khi có `--apply`; backup khôi phục ở `.tmp-import/phase4/backup-2026-10-17T09-33-02-625Z.json`. Lần apply thành công cập nhật 183 section + 153 question và tạo 224 prompt Speaking; dry-run sau apply còn 0 thay đổi. Postflight 128 bài Cambridge C11–C18 báo 0 vấn đề; 19/19 test, `tsc --noEmit`, ESLint và cú pháp 49 file builder Python đều qua. Riêng C15 T2-W đang PUBLISHED chỉ được thêm dấu `:` sau “In your letter”, không đổi ID hay nội dung bài.

---

## Phần F — Đề mock (PUBLISHED) [DATA] ⚠️

- [x] **F1** Không câu nào có `variant` (cả 4 mock). (xong: gán variant tường minh theo từng nhóm câu; normalizer idempotent và được gọi từ importer nguồn)
- [x] **F2** `general-listening-mocktest-1`: 20 câu / 2 section; "notes" thực chất là bảng có `<br>` trong ô, gap dạng `1 ________`; tiêu đề "Part N" (chuẩn "Section N"). (xong: Section 1–2; Q1–7 table, Q8–10 notes, Q11–20 form; bỏ `<br>` và chuẩn hoá gap)
- [x] **F3** `general-reading-grade-8`: 30 câu; S3 578 từ, không có header nhóm; MCQ chỉ 3 options, đánh số "30." / "A."; lặp tiêu đề "Questions…". (xong: dựng lại header/instruction cho 6 nhóm, bỏ câu hỏi lặp khỏi passage; giữ nguyên bộ option gốc A–C)
- [x] **F4** `general-reading-mocktest-1`: 12 câu / 1 section; header bọc `[[section]]`, lộ marker `[[price]]`; lặp tiêu đề "Questions…". (xong: bỏ marker không hỗ trợ/header lặp; dựng instruction Q1–6, Q7–10 và Q11–12)
- [x] **F5** `general-writing-mocktest-1`: chỉ 1 task. (đã xác nhận đây là chủ đích của mock: chỉ cần Task 1, không yêu cầu Task 2)

---

## Phần G — Chưa kiểm tra trên UI (cần check sau khi sửa)

Đã audit dữ liệu nhưng chưa mở trên trình duyệt:

- [ ] Listening: C12 T5–T6 · C13 T2–T4 · C14 T1, T3, T4 · C15 T1, T3 · C16 T2–T3 · C17 T3–T4 · C18 T1, T3, T4
- [ ] Reading: C11 T2–T3 · C12 T7–T8 · C13 T2–T4 · C14 T1–T4 · C15 T1, T3, T4 · C16 T1–T4 · C17 T1–T3 · C18 T2
- [ ] Writing / Speaking: phần lớn chưa xem
- [ ] Mock: `general-writing-mocktest-1`
- [ ] Console error đầy đủ (chưa bắt được)

---

## Thứ tự sửa đề xuất

1. [x] **A0–A14, A18–A20, C1–C2, D1–D12 và E1–E15** — hoàn tất qua Phase 0–4.
2. [x] **F1–F5** — đề mock PUBLISHED (Phase 5) đã xong; F5 chỉ có Task 1 theo chủ đích.
3. [x] **B1 và A15–A17** — Phase 6 đã xong; C11/C12/C18 không cần audio theo quyết định sản phẩm.
4. [x] Kiểm tra tổng tự động: audit mới có 0 lỗi có thể hành động, 82/82 media URL OK, 21/21 regression và production build pass. [ ] Còn mở UI thủ công các test ở phần **G** (390px + 1366px) và kiểm tra console.
