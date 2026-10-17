# WEWIN IELTS — Quy định layout câu hỏi (dùng cho OCR ảnh → Word)

Tài liệu này mô tả cách web WEWIN IELTS đọc file Word đề thi và hiển thị từng dạng câu hỏi.
Mục tiêu: khi OCR một trang đề (ảnh/PDF scan) sang `.docx`, file Word phải có **cấu trúc chữ** đúng như dưới đây để import vào web ra layout giống bản gốc.

> Đối tượng đọc: ChatGPT / người gõ lại đề. Đọc hết phần **Quy tắc chung** trước, sau đó tra từng dạng câu.

---

## 0. Vai trò của bạn (dành cho ChatGPT)

Bạn nhận ảnh một trang đề IELTS. Bạn phải:

1. Chép lại **nguyên văn** nội dung tiếng Anh (không dịch, không tóm tắt, không sửa lỗi chính tả của đề).
2. Xuất ra file Word theo đúng cấu trúc trong tài liệu này.
3. **Không** tự điền đáp án vào chỗ trống. Đáp án nằm ở file Keys riêng (mục 9).
4. **Không** chèn ảnh chụp chữ. Mọi chữ phải là chữ gõ được. Chỉ bản đồ / sơ đồ / biểu đồ mới được chèn dạng ảnh.
5. Nếu một chữ trong ảnh bị mờ, giữ chỗ đó bằng `[?]` thay vì đoán.

---

## 1. Quy tắc chung

### 1.1. Mỗi kỹ năng một file

| File | Nội dung |
|------|----------|
| `Listening N.docx` | 4 Section, 40 câu |
| `Reading N.docx` | 3 Passage, 40 câu (Academic) hoặc 3 Section (General Training) |
| `Writing N.docx` | Task 1 + Task 2 |
| `Speaking N.docx` | Part 1, Part 2, Part 3 |
| `Key N.docx` | Đáp án Listening + Reading (chữ gõ, không phải ảnh) |

### 1.2. Dòng chia phần (Part)

Mỗi phần bắt đầu bằng **một dòng riêng**, ngắn, đứng một mình:

| Kỹ năng | Dòng chia phần |
|---------|----------------|
| Listening | `SECTION 1` … `SECTION 4` (hoặc `PART 1` … `PART 4`) |
| Reading Academic | `READING PASSAGE 1` … `READING PASSAGE 3` |
| Reading General | `SECTION 1` … `SECTION 3` |
| Writing | `WRITING TASK 1`, `WRITING TASK 2` |
| Speaking | `PART 1`, `PART 2`, `PART 3` |

Không viết dòng chia phần dính với câu khác. Sai: `SECTION 1 Questions 1–10 Complete the notes below.`. Đúng: `SECTION 1` một dòng, `Questions 1–10` dòng tiếp theo.

### 1.3. Dòng nhóm câu hỏi

Mỗi nhóm câu bắt đầu bằng **một dòng riêng**:

```
Questions 1–10
```

Các dạng hợp lệ: `Questions 1–10`, `Questions 1-10`, `Questions 21 and 22`, `Question 26`.

Ngay sau đó là dòng hướng dẫn **chép đúng nguyên văn** của đề (web dùng câu này để nhận dạng dạng câu hỏi):

```
Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.
```

### 1.4. Chỗ trống (gap)

Chỗ trống luôn là **số câu + dấu chấm liền**, có một dấu cách giữa số và chấm:

```
Name of company: 1 ...............
```

- Dùng ít nhất 8 dấu chấm `........` (hoặc `……`). Không dùng `_____` cho chỗ trống có số.
- Số câu nằm **ngay trước** dãy chấm, trong cùng dòng với chữ xung quanh.
- Ký hiệu tiền tệ đặt trước số trong đề thì giữ nguyên: `Cost: £ 5 ...............`.
- Chỗ trống của ví dụ (Example) không có số câu: ghi đáp án ví dụ bình thường, ví dụ `Example: Name of hotel: Seaview`.

### 1.5. Lựa chọn A/B/C

Mỗi lựa chọn một dòng, chữ cái đứng đầu:

```
A  a train ticket
B  a bus pass
C  a ferry ticket
```

Chấp nhận `A`, `A.`, `A)`. Không gộp nhiều lựa chọn trên một dòng.

### 1.6. Định dạng chữ

- Trình import **bỏ hết in đậm / in nghiêng của Word**. Đừng dựa vào in đậm để thể hiện cấu trúc.
- Muốn giữ in đậm một cụm từ trong nội dung, viết `**cụm từ**`.
- Tiêu đề, bullet, khung, bảng: dùng đúng cấu trúc ở mục 3 bên dưới.

### 1.7. Những thứ KHÔNG được làm

- Không chụp ảnh đoạn chữ rồi dán vào Word.
- Không dùng text box, shape, WordArt, cột báo (columns) của Word. Trình import không đọc được.
- Không đánh số câu bằng Numbering tự động của Word cho câu hỏi. Gõ số tay: `11 What is…`.
- Không lặp lại cùng một câu ở hai chỗ.
- Không dịch hay sửa nội dung đề.

### 1.8. Layout khi làm bài: trái để đọc, phải để trả lời

Quy tắc bắt buộc cho trang làm bài Listening và Reading, với **mọi dạng câu hỏi**:

- **Cột trái chỉ để đọc**: bài đọc (Reading), toàn bộ đề câu hỏi (notes, bảng, flow chart, ảnh map, câu điền từ, MCQ, danh sách lựa chọn, headings…). Chỗ trống hiện là số câu + `______`.
- **Cột phải chỉ có cột ANSWERS**: mỗi câu đúng một ô, đánh số liên tục. Điền từ = ô text; MCQ / matching / map / TFNG = dropdown chọn chữ cái hoặc giá trị; "Choose TWO" = mỗi số câu một ô.
- **Tuyệt đối không** có ô nhập, dropdown, radio hay checkbox ở cột trái, kể cả ô nằm trong câu hoặc danh sách ô bên dưới nhóm câu.
- Mỗi câu chỉ có **một** chỗ nhập đáp án duy nhất (ở cột phải).
- Mobile: hai cột xếp chồng, nhưng phần đề vẫn chỉ để đọc và ANSWERS vẫn là khối riêng.

---

## 2. Bảng tổng hợp dạng câu hỏi

| Mã layout trên web | Tên tiếng Việt | Kỹ năng | Câu hướng dẫn thường gặp |
|---|---|---|---|
| `FORM_COMPLETION` | Điền form | L | Complete the form below. |
| `NOTE_COMPLETION` | Điền ghi chú | L, R | Complete the notes below. |
| `TABLE_COMPLETION` | Hoàn thành bảng | L, R | Complete the table below. |
| `SUMMARY_COMPLETION` | Điền tóm tắt | L, R | Complete the summary below. |
| `SENTENCE_COMPLETION` | Hoàn thành câu | L, R | Complete the sentences below. |
| `FLOW_CHART_COMPLETION` | Hoàn thành lưu đồ | L, R | Complete the flow-chart below. |
| `SHORT_ANSWER` | Câu trả lời ngắn | L, R | Answer the questions below. |
| `SINGLE_CHOICE` | Trắc nghiệm một đáp án | L, R | Choose the correct letter, A, B or C. |
| `MULTI_SELECT` | Chọn nhiều đáp án | L, R | Choose TWO letters, A–E. |
| `TRUE_FALSE_NOT_GIVEN` | True / False / Not Given | R | Do the following statements agree with the information…? |
| `YES_NO_NOT_GIVEN` | Yes / No / Not Given | R | Do the following statements agree with the views/claims…? |
| `MATCHING_HEADINGS` | Nối heading | R | Choose the correct heading for each paragraph… |
| `MATCHING_INFORMATION` | Nối thông tin | R | Which paragraph contains the following information? |
| `MATCHING_FEATURES` | Nối đặc điểm | L, R | Match each statement with the correct person… / What does X decide about…? |
| `MATCHING_SENTENCE_ENDINGS` | Nối kết câu | R | Complete each sentence with the correct ending, A–F. |
| `MAP_LABELING` | Ghi nhãn bản đồ | L | Label the map below. |
| `PLAN_LABELING` | Ghi nhãn sơ đồ mặt bằng | L | Label the plan below. |
| `DIAGRAM_LABELING` | Ghi nhãn sơ đồ | L, R | Label the diagram below. |
| `WRITING_GENERAL_LETTER` | Viết thư (General Task 1) | W | Write a letter… |
| `WRITING_ESSAY` | Bài luận / Task 1 Academic | W | Write at least 250 words. |
| `SPEAKING_PART_1/2/3` | Speaking Part 1/2/3 | S | — |

Web nhận dạng dạng câu chủ yếu từ **câu hướng dẫn**. Vì vậy câu hướng dẫn phải chép nguyên văn.

---

## 3. Khối nội dung đặc biệt (khung, tiêu đề, bullet, bảng)

### 3.1. Khung ghi chú có bullet (notes trong ô viền)

Trên đề, phần "Complete the notes" thường nằm trong **một khung viền**, có tiêu đề in đậm ở giữa và các dòng bullet thụt lề.

**Cách làm trong Word:** tạo **bảng 1 hàng × 1 cột** (một ô duy nhất). Trong ô:

- Dòng đầu là tiêu đề, dùng style **Heading** của Word (Heading 2 hoặc 3).
- Các dòng còn lại dùng **Bullet list thật** của Word (nút Bullets). Bullet cấp 2 thì nhấn Tab để thụt vào.
- Dòng nhóm không có bullet (ví dụ `Ancient Greece:`) là đoạn văn bình thường, không bullet.
- Chỗ trống viết theo mục 1.4.

Ví dụ nội dung trong ô:

```
[Heading] Early history of keeping clean
Prehistoric times:
  • water was used to wash off 31 ...............
Ancient Greece:
  • people cleaned themselves with sand and other substances
  • used a strigil – a scraper made of 32 ...............
```

Web sẽ vẽ: một khung viền đen, tiêu đề đậm căn giữa, bullet tròn đặc (cấp 1), bullet tròn rỗng (cấp 2), bullet vuông (cấp 3). Ô nhập đáp án nằm ngay trong chỗ trống.

Điều kiện để web nhận đây là khung ghi chú: bảng **chỉ có 1 ô**, trong ô **có bullet list** và **có ít nhất một chỗ trống có số**. Thiếu một điều kiện thì web hiển thị như văn bản thường.

Nếu không tạo được bảng, có thể gõ ký hiệu dạng chữ (web cũng đọc):

```
[[box]]
[[ntitle]]Early history of keeping clean[[/ntitle]]
Prehistoric times:
[[b0]]water was used to wash off 31 ...............
Ancient Greece:
[[b0]]people cleaned themselves with sand and other substances
[[b1]]a scraper made of 32 ...............
[[/box]]
```

- `[[box]]` … `[[/box]]`: khung viền.
- `[[ntitle]]…[[/ntitle]]`: tiêu đề căn giữa, in đậm.
- `[[b0]]`, `[[b1]]`, `[[b2]]`: bullet cấp 0 (tròn đặc), 1 (tròn rỗng), 2 (vuông).
- Dòng bắt đầu bằng `- ` là gạch đầu dòng dạng dash.

### 3.2. Bảng thật nhiều cột (table completion, form dạng lưới)

Dùng **bảng Word thật** với đúng số hàng và cột như đề:

- Hàng đầu là tiêu đề cột.
- Ô gộp (merge) trên đề: **chép lại nội dung vào từng ô** thay vì merge. Ví dụ ô "Confined spaces" kéo dài 2 hàng thì ghi "Confined spaces" ở cả 2 hàng.
- Chỗ trống trong ô viết theo mục 1.4: `Risk of 16 ...............`.
- Không để ô trống hoàn toàn nếu đề có chữ. Ô đề để trống thật thì để trống.

Web vẽ thành bảng có viền, ô nhập đáp án nằm đúng ô.

**Không** trộn trong cùng một nhóm `Questions N–M` vừa bảng nhiều cột vừa khung ghi chú bullet. Nếu đề có cả hai (ví dụ Q1–4 là bảng, Q5–10 là notes), tách thành hai nhóm:

```
Questions 1–4
Complete the table below.
[bảng Word]

Questions 5–10
Complete the notes below.
[bảng 1 ô có bullet]
```

### 3.3. Tiêu đề đoạn văn và tiêu đề mục (dạng ký hiệu, tuỳ chọn)

| Ký hiệu | Hiển thị |
|---------|----------|
| `[[title]]…[[/title]]` | Tiêu đề bài đọc, căn giữa, in đậm |
| `[[section]]…[[/section]]` | Tiêu đề mục lớn, chữ navy, có gạch chân |
| `[[phead]]…[[/phead]]` | Tiêu đề nhỏ trong bài đọc, in đậm |
| `[[price]]…[[/price]]` | Ô giá tiền nhỏ trong khung |

Chỉ dùng khi đề thật sự có các thành phần đó. Nếu không chắc, cứ để dòng chữ thường. Web tự in đậm các dòng ngắn giống tiêu đề.

### 3.4. Ảnh (bản đồ, sơ đồ, biểu đồ)

- Chèn ảnh **ngay dưới dòng hướng dẫn** của nhóm câu đó.
- Cắt ảnh **chỉ lấy phần hình**, không dính chữ câu hỏi bên cạnh.
- Ảnh không có watermark, không bị nghiêng.
- Trên web, ảnh Listening hiển thị ở cột trái, có nhãn "Câu 11–16".

---

## 4. Listening — từng dạng

### 4.1. Form / Notes completion (`FORM_COMPLETION`, `NOTE_COMPLETION`)

```
SECTION 1
Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

[bảng 1 ô]
  [Heading] Employment Agency: Possible Jobs
  First Job
    • administrative assistant in a company that produces 1 ...............
    • responsibilities include:
        – answering the phone
        – organising 2 ............... and meetings
```

- Form dạng "nhãn: giá trị" (`Name: 1 ......`) cũng đặt trong bảng 1 ô, mỗi trường một dòng.
- Web hiển thị toàn bộ form ở cột phải, ô nhập nằm trong dòng.

### 4.2. Table completion (`TABLE_COMPLETION`)

Xem mục 3.2. Câu hướng dẫn phải có `Complete the table below.`.

### 4.3. Trắc nghiệm một đáp án (`SINGLE_CHOICE`)

```
Questions 11–14
Choose the correct letter, A, B or C.

11 Why did the speaker start the Street Play Scheme?
A  Children were bored at home.
B  Traffic was too heavy.
C  Parents asked for it.

12 How long has the scheme been running?
A  two years
B  three years
C  six years
```

- Số câu đứng đầu dòng câu hỏi, sau đó là câu hỏi.
- 2 đến 5 lựa chọn, mỗi lựa chọn một dòng ngay dưới.
- Web hiển thị nút chọn tròn (radio) cho từng câu.

### 4.4. Chọn nhiều đáp án (`MULTI_SELECT`)

```
Questions 17 and 18
Choose TWO letters, A–E.
Which TWO benefits of the scheme does the speaker mention?
A  more exercise
B  new friendships
C  better school results
D  stronger community
E  less traffic
```

- Dòng nhóm phải là `Questions 17 and 18` (hoặc `Questions 17–18`).
- Phải có chữ `Choose TWO letters` (hoặc THREE).
- **Không** ghi số 17, 18 trước câu hỏi. Câu hỏi chung chỉ ghi một lần.
- Web hiển thị một khung lựa chọn và 2 ô chọn. Thứ tự đáp án không quan trọng khi chấm.

### 4.5. Nối đặc điểm (`MATCHING_FEATURES`) — danh sách A/B/C dùng chung

```
Questions 27–30
What does Hazel decide to do about each of the following types of articles?
Write the correct letter, A, B or C, next to Questions 27–30.

A  She will definitely look for a suitable article.
B  She may look for a suitable article.
C  She definitely won't look for an article.

27 national news item
28 editorial
29 human interest
30 arts
```

- Danh sách A/B/C ghi **một lần** ở trên.
- Mỗi câu chỉ ghi số + mục cần nối. **Không** chép lại A/B/C dưới từng câu.
- Web hiển thị khung lựa chọn chung + một ô thả xuống (dropdown) cho mỗi câu.
- Phải có cụm `Write the correct letter … next to Questions N–M`.

### 4.6. Bản đồ / sơ đồ mặt bằng (`MAP_LABELING`, `PLAN_LABELING`)

**Dạng có chữ cái trên bản đồ (chọn A–I):**

```
Questions 15–20
Label the map below.
Write the correct letter, A–I, next to Questions 15–20.

[ẢNH BẢN ĐỒ]

15 statue
16 bridge
17 café
18 toilets
19 children's play area
20 picnic area
```

- Riêng **Listening có ảnh bản đồ/sơ đồ**: cột trái chỉ giữ instruction và ảnh lớn; các nhãn ngắn chuyển sang cột **ANSWERS**, cùng hàng với dropdown, ví dụ `15. Scarecrow [dropdown]`.
- Không áp dụng ngoại lệ này cho Reading hoặc câu Listening không gắn ảnh.

**Dạng điền chữ vào bản đồ:**

```
Questions 11–15
Label the plan below.
Write NO MORE THAN TWO WORDS for each answer.

[ẢNH SƠ ĐỒ]

11 ...............
12 ...............
```

- Mỗi mục là một dòng, số câu đứng đầu.
- Web đặt ô nhập/dropdown ngay cạnh tên mục trên cùng một dòng.

### 4.7. Lưu đồ (`FLOW_CHART_COMPLETION`)

Các bước cách nhau bằng **một dòng chỉ có mũi tên `↓`**:

```
Questions 31–35
Complete the flow-chart below.
Write ONE WORD ONLY for each answer.

Making paper
Wood is cut into 31 ...............
↓
The pieces are mixed with 32 ...............
↓
The mixture is pressed and dried
```

Web căn giữa, tiêu đề đậm, mũi tên giữa các bước.

### 4.8. Câu trả lời ngắn (`SHORT_ANSWER`)

```
Questions 36–40
Answer the questions below.
Write NO MORE THAN TWO WORDS for each answer.

36 What did the first factories produce?
37 Which material replaced wood?
```

Không thêm dãy chấm sau câu hỏi. Web tự thêm ô nhập.

---

## 5. Reading — từng dạng

### 5.1. Bài đọc (passage)

```
READING PASSAGE 1
You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.

The history of glass

A  From our earliest origins, man has been making use of glass...

B  The Romans began blowing glass...
```

- Dòng `You should spend…` giữ nguyên.
- Tên bài là một dòng ngắn riêng.
- Đoạn có chữ cái (A, B, C…) thì chữ cái đứng đầu đoạn: `A  From our…`. Web sẽ in đậm và phóng to chữ cái.
- Mỗi đoạn văn là **một đoạn Word liền** (không xuống dòng giữa câu như trên ảnh scan). Giữa hai đoạn để một dòng trống.
- Tiêu đề nhỏ trong bài (ví dụ `Schools respond`) là một dòng ngắn riêng, không dấu chấm cuối.

Bài đọc đặt **trước** các nhóm câu hỏi. Nếu trên đề danh sách heading in trước bài, vẫn đặt bài đọc trước, rồi `Questions …` + `List of Headings` sau.

General Training thường có nhiều đoạn ngắn trong một Section (quảng cáo, thông báo). Mỗi đoạn có tiêu đề riêng thì ghi tiêu đề trên một dòng, nội dung bên dưới.

### 5.2. True / False / Not Given (`TRUE_FALSE_NOT_GIVEN`)

```
Questions 1–6
Do the following statements agree with the information given in Reading Passage 1?
In boxes 1–6 on your answer sheet, write

TRUE  if the statement agrees with the information
FALSE  if the statement contradicts the information
NOT GIVEN  if there is no information on this

1 Glass was first made in Egypt.
2 The Romans kept glass-making secret.
```

Web hiển thị khung giải thích TRUE/FALSE/NOT GIVEN một lần + dropdown cho mỗi câu.

### 5.3. Yes / No / Not Given (`YES_NO_NOT_GIVEN`)

Giống 5.2, nhưng câu hướng dẫn là `…agree with the views/claims of the writer…` và bảng giải thích là `YES if… / NO if… / NOT GIVEN if…`.

### 5.4. Nối heading (`MATCHING_HEADINGS`)

```
Questions 14–20
Reading Passage 2 has seven paragraphs, A–G.
Choose the correct heading for each paragraph from the list of headings below.

List of Headings
i  The early history of the project
ii  Problems with funding
iii  A new approach
iv  Public reaction

14 Paragraph A
15 Paragraph B
16 Paragraph C
```

- Danh sách heading dùng số La Mã thường: `i`, `ii`, `iii`, `iv`…
- Có thể đặt danh sách trong bảng 1 ô. Dòng đầu phải là `List of Headings`.
- Mỗi câu: `14 Paragraph A` (hoặc `14 Section A`).

### 5.5. Nối thông tin (`MATCHING_INFORMATION`)

```
Questions 21–24
Reading Passage 2 has seven paragraphs, A–G.
Which paragraph contains the following information?
Write the correct letter, A–G, in boxes 21–24 on your answer sheet.

21 a reference to the cost of the project
22 an example of public opposition
```

Không cần liệt kê A–G thành danh sách. Web tự tạo dropdown A–G.

### 5.6. Nối đặc điểm (`MATCHING_FEATURES`)

```
Questions 25–28
Look at the following statements and the list of researchers below.
Match each statement with the correct researcher, A–D.

List of Researchers
A  Mary Jones
B  Tom Smith
C  Lee Wong
D  Ana Costa

25 found that sleep affects memory
26 studied children under five
```

Có thể ghi chú `NB You may use any letter more than once.` nếu đề có.

### 5.7. Nối kết câu (`MATCHING_SENTENCE_ENDINGS`)

```
Questions 29–32
Complete each sentence with the correct ending, A–F, below.

29 The early experiments failed because
30 Scientists later discovered that

A  the equipment was too expensive.
B  the results could not be repeated.
C  the weather affected the samples.
```

Phần đầu câu (có số) đặt trước, danh sách kết câu A–F đặt sau.

### 5.8. Tóm tắt có danh sách từ (`SUMMARY_COMPLETION` với word list)

```
Questions 33–37
Complete the summary using the list of words, A–I, below.

The new system was introduced to reduce 33 ............... and improve 34 ............... .

A  costs        B  delays        C  safety
D  quality      E  speed         F  staff
```

- Đoạn tóm tắt là một đoạn liền, chỗ trống theo mục 1.4.
- Danh sách từ có thể là bảng Word 3 cột, hoặc mỗi từ một dòng `A  costs`.
- Web đặt dropdown chữ cái ngay trong chỗ trống và hiện danh sách từ bên dưới.

### 5.9. Tóm tắt / câu điền từ tự do

- Tóm tắt không có word list: giống 5.8 nhưng không có danh sách A–I. Câu hướng dẫn có `Choose ONE WORD ONLY from the passage…`.
- Hoàn thành câu (`SENTENCE_COMPLETION`): mỗi câu một dòng, số đứng đầu câu, chỗ trống là dãy gạch dưới **không số**:

```
Questions 38–40
Complete the sentences below.
Choose NO MORE THAN TWO WORDS from the passage for each answer.

38 The first factory was built near a ______________ .
39 Workers were paid in ______________ .
```

Chỉ dạng này dùng `______` không số. Mọi dạng notes/form/table/summary dùng `số + ........`.

### 5.10. Trắc nghiệm, chọn nhiều, short answer, lưu đồ, sơ đồ

Giống Listening (mục 4.3, 4.4, 4.7, 4.8, 4.6).

---

## 6. Writing

### 6.1. General Training Task 1 — viết thư (`WRITING_GENERAL_LETTER`)

```
WRITING TASK 1
You should spend about 20 minutes on this task.

You recently saw an advertisement for volunteers at a local museum.

Write a letter to the museum manager. In your letter
  • say why you want to be a volunteer
  • describe any relevant experience you have
  • explain when you would be available

Write at least 150 words.
You do NOT need to write any addresses.
Begin your letter as follows:
Dear Sir or Madam,
```

Ba gạch đầu dòng dùng Bullet list thật.

### 6.2. Academic Task 1 — biểu đồ (`WRITING_ESSAY`, có ảnh)

```
WRITING TASK 1
You should spend about 20 minutes on this task.

The chart below shows the number of visitors to three museums between 2010 and 2020.
Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

[ẢNH BIỂU ĐỒ]

Write at least 150 words.
```

### 6.3. Task 2 — bài luận (`WRITING_ESSAY`)

```
WRITING TASK 2
You should spend about 40 minutes on this task.

Write about the following topic:

Some people think that children should start school at a very early age.
To what extent do you agree or disagree?

Give reasons for your answer and include any relevant examples from your own knowledge or experience.

Write at least 250 words.
```

---

## 7. Speaking

```
PART 1
Hometown
  • Where is your hometown?
  • What do you like about it? [Why/Why not?]

PART 2
Describe a book you enjoyed reading.
You should say:
  • what the book was
  • when you read it
  • what it was about
and explain why you enjoyed it.

PART 3
Reading habits
  • Do people in your country read more or less than in the past?
  • How can parents encourage children to read?
```

- Mỗi chủ đề trong Part 1 / Part 3 là một dòng ngắn, câu hỏi là bullet bên dưới.
- Giữ nguyên các gợi ý trong ngoặc vuông như `[Why/Why not?]`.

---

## 8. Khác biệt Academic và General Training

| | Academic | General Training |
|---|---|---|
| Listening | Giống nhau | Giống nhau |
| Reading | 3 `READING PASSAGE`, bài dài học thuật | 3 `SECTION`, Section 1–2 gồm nhiều văn bản ngắn |
| Writing Task 1 | Mô tả biểu đồ, có ảnh | Viết thư, không ảnh |

Đặt tên file / tiêu đề đề thi ghi rõ `Academic` hoặc `General Training`.

---

## 9. File đáp án (Keys)

Một file `Key N.docx`, **chữ gõ**, không phải ảnh:

```
Listening

Section 1
1. furniture
2. meetings
3. diary
4. detail/details
5. 1 year/one year
...

Section 2
11. B
12. A
17. B
18. D
...

Reading

Passage 1
1. FALSE
2. TRUE
3. NOT GIVEN
...
28. iv
```

Quy ước:

| Dạng | Cách ghi |
|------|----------|
| Điền từ | Đúng chữ: `furniture`, `23.70` |
| Nhiều đáp án đúng | Dùng `/`: `detail/details`, `1 year/one year` |
| Chữ có thể bỏ | Ngoặc có dấu cách trước: `(the) museum` |
| Trắc nghiệm, nối | Chữ cái: `B` |
| Chọn TWO | Ghi riêng từng câu, mỗi câu một dòng: `17. B` và `18. D` (thứ tự hai chữ cái không quan trọng khi chấm) |
| TFNG | `TRUE` / `FALSE` / `NOT GIVEN` |
| YNNG | `YES` / `NO` / `NOT GIVEN` |
| Heading | Số La Mã thường: `iv` |

---

## 10. Checklist trước khi xuất file Word

- [ ] Mỗi phần có dòng chia phần riêng (`SECTION 1`, `READING PASSAGE 2`, …).
- [ ] Mỗi nhóm câu có `Questions N–M` một dòng riêng + câu hướng dẫn chép nguyên văn.
- [ ] Mọi chỗ trống có số dạng `N ...............`.
- [ ] Câu hoàn thành câu (sentence completion) dùng `______` không số.
- [ ] Lựa chọn A/B/C mỗi dòng một lựa chọn.
- [ ] Danh sách lựa chọn dùng chung (matching) chỉ ghi một lần.
- [ ] Choose TWO: dòng `Questions X and Y`, không đánh số câu hỏi.
- [ ] Notes trong khung: bảng 1 ô + bullet list thật + có chỗ trống.
- [ ] Bảng nhiều cột: bảng Word thật, ô gộp được chép lại từng ô.
- [ ] Không trộn bảng nhiều cột và khung notes trong cùng một nhóm câu.
- [ ] Bản đồ/sơ đồ/biểu đồ là ảnh đã cắt gọn, đặt dưới câu hướng dẫn.
- [ ] Đoạn văn bài đọc là một đoạn liền, không xuống dòng giữa câu.
- [ ] Không có ảnh chụp chữ, text box, shape, cột báo.
- [ ] Không điền đáp án vào đề. Đáp án nằm trong `Key N.docx`.
- [ ] Tổng số câu Listening = 40, Reading = 40, số câu liên tục không trùng, không thiếu.
