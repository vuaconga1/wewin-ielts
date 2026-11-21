# Cambridge IELTS 21 — Listening / Writing / Speaking handoff plan

**Owner handoff date:** 2026-11-21  
**Repo:** `wewin-ielts`  
**Goal:** Fix fabricated Listening questions for C21 Tests 2–4, then import missing Writing + Speaking from the official PDF — **without inventing stems**.

---

## 0. Non-negotiable rules

1. **Ground truth = PDF only**  
   `docs/cambridge_21_split/Cambridge IELTS 21.pdf` (146 pages).  
   Do **not** invent or paraphrase question stems. Do **not** trust OCR alone when it conflicts with a rendered page image.

2. **Same bug as Reading (already fixed)**  
   Prior import often kept Cambridge **answer keys** but **rewrote / invented stems**.  
   Symptom: `correctAnswer` matches the book; the question the learner sees does not.  
   **Never** “fix” by keeping keys on wrong stems — replace stems/options from the PDF.

3. **Text layer of this PDF is unreliable**  
   Embedded text has OCR errors (`lmow`, `Tai` vs visual `Tal`, missing option letters).  
   Workflow: extract text → **render the page to PNG** → verify names, options, maps, diagrams visually before writing JSON.

4. **Do not use paid APIs** without explicit user consent (repo rule `paid-services-consent.mdc`).

5. **Do not upsert to production DB** until the user reviews or explicitly asks.  
   Local JSON first; then:  
   `npx tsx scripts/upsert-tests-from-json.ts --only <slug> --status PUBLISHED`

6. **Log every fix** in `docs/IMPORT_MISSING_AUDIO_KEYS.txt` (repo rule).

---

## 1. Already done (do not redo)

| Skill | Slugs | Status |
|-------|--------|--------|
| Reading | `test-15-reading` … `test-18-reading` | Rebuilt from PDF; upserted PUBLISHED |
| Listening Test 1 | `test-15-listening` | Audited OK vs PDF (keep) |

**Reference rebuild pattern (Reading):**

- `scripts/fix-c21-test1-reading-questions.ts` … `fix-c21-test4-reading-questions.ts`
- PDF extracts: `docs/cambridge_21_split/pdf_extract/test*_reading.txt`, `answer_keys.txt`
- Page renders: `docs/cambridge_21_split/pdf_extract/renders/`

**Mapping:**

| System | Book | Slug prefix |
|--------|------|-------------|
| Test 15 | C21 Test 1 | `test-15-*` |
| Test 16 | C21 Test 2 | `test-16-*` |
| Test 17 | C21 Test 3 | `test-17-*` |
| Test 18 | C21 Test 4 | `test-18-*` |

---

## 2. Work packages (do in order)

### WP-A — Listening rebuild (priority)

**Files to fix**

| Slug | Keep | Rebuild |
|------|------|---------|
| `test-15-listening` | Entire test | Optional polish only (Q19 truncated label; choose-two empty stems on even Q) |
| `test-16-listening` | Parts 1–2 (Q1–20) | Parts 3–4 (Q21–40) |
| `test-17-listening` | Part 1 (Q1–10) | Parts 2–4 (Q11–40) |
| `test-18-listening` | Part 1 (Q1–10) | Parts 2–4 (Q11–40) |

**PDF sources (0-based page index → PDF page = index+1)**

| Block | Approx PDF pages | Extract (already created) |
|-------|------------------|---------------------------|
| Test 1 Listening | 10–16 | `pdf_extract/test1_listening.txt` |
| Test 2 Listening | 32–38 | `pdf_extract/test2_listening.txt` |
| Test 3 Listening | 54–60 | `pdf_extract/test3_listening.txt` |
| Test 4 Listening | 75–81 | `pdf_extract/test4_listening.txt` |
| Answer keys | 118–125 | `pdf_extract/answer_keys.txt` |

Regenerate extracts if needed:

```bash
python -c "import pymupdf; from pathlib import Path; doc=pymupdf.open(r'docs/cambridge_21_split/Cambridge IELTS 21.pdf'); ..."
```

**Audit findings (2026-11-21) — worst examples**

**Test 16 (C21.02)** — ~20/40 fabricated (Parts 3–4)

- Q21–22: book = facts new to Nadia/Fergus; JSON = rewritten “surprised the students” with different options; keys still B/E.
- Q25–26: book = topics to add to the course (sustainable fishing / global differences); JSON = nutrition project success factors; keys still A/C.
- Q27–30: book = opinions on a new food product (aim / lit review / development / production); JSON = survey flow; keys still C/D/F/A.
- Q31–40: book overtourism notes (Pollution, tax, chocolate, …); JSON rewritten gap stems; keys still match book words.
- Map Q15–20: stems/labels OK; image exists at `public/uploads/images/test-16-map.png` — **verify map matches PDF visually**.

**Test 17 (C21.03)** — ~30/40 fabricated (Parts 2–4)

- Part 1 OK: Shetland ferry notes.
- Q11–12: book = why street food popular; JSON = youth hostel facilities; keys still C/E.
- Q21+: fabric/semi-synthetic / invasive species topics rewritten; keys still match book.
- Q25–26 Lyocell/Cupro/Modal comments swapped vs book while letters still “match” keys.

**Test 18 (C21.04)** — ~30/40 fabricated (Parts 2–4)

- Part 1 OK: Broadbeach shopping form.
- Q11+: business exhibition / houses of the future / surgery & routine → JSON has different scenarios; keys still match.
- Q15–20 speaker list fully replaced (Jim Clowrie… → Dr Alan Vance…); keys still C/G/D/A/F/B.

**Audio (already present — do not re-upload unless broken)**

```
public/uploads/audio/test-{15,16,17,18}-section-{1,2,3,4}.mp3
```

Keep `audioFiles` + part `meta.audioUrl` pointing at these paths.

**JSON shape reference:** `data/tests/test-15-listening.json`

- Top-level: `title`, `slug`, `skill: LISTENING`, `examType`, `timeLimitMinutes: 40`, `tags`, `audioFiles`, `parts`, `sourceFolder`, `savedAt`
- Each part: `title` Section 1–4, `content` (full task text from PDF), `meta.audioUrl`, `questions[]`
- Questions: `number`, `order`, `type` (`GAP_FILL` | `MULTIPLE_CHOICE` | `MATCHING` | …), `content`, `correctAnswer`, optional `acceptableAnswers` (e.g. `10` / `ten`, `cafe` / `café`)
- For choose-TWO: follow test-15 pattern (both letters on the pair; or explicit two questions — match existing UI conventions in test-15)
- Map/label questions: set `imageUrl` / `mediaUrl` on question + part meta when the book has a plan/map

**Implementation steps (per test)**

1. Render every Listening question page for that test to PNG; read visually.
2. Copy authentic stems/options into part `content` and each question object.
3. Set `correctAnswer` / `acceptableAnswers` from `answer_keys.txt` for that TEST’s LISTENING section only.
4. Write `scripts/fix-c21-test{N}-listening-questions.ts` (mirror Reading fix scripts).
5. Run script → verify 40 answers printout vs key.
6. Spot-check: pick Q1, Q11, Q21, Q31 stems — must appear verbatim (modulo whitespace) in PDF render.
7. Upsert only after user OK:  
   `npx tsx scripts/upsert-tests-from-json.ts --only test-16-listening --status PUBLISHED`  
   (repeat for 17, 18; upsert one slug at a time — comma `--only` can fail under PowerShell)

**Definition of done (Listening)**

- [ ] Zero invented stems vs PDF render
- [ ] 40/40 keys match book (including IN EITHER ORDER pairs)
- [ ] Audio still plays for all 4 sections
- [ ] Maps/diagrams present and match PDF (Test 16 Melby Coal Mine confirmed)
- [ ] `IMPORT_MISSING_AUDIO_KEYS.txt` updated
- [ ] Optional: local smoke open `/practice/...` for each slug

---

### WP-B — Writing import (missing)

**Status:** `data/tests/test-15-writing.json` … `test-18-writing.json` **do not exist**.  
Nothing corrupted — never imported.

**Reference shape:** `data/tests/test-14-writing.json`

- `skill: WRITING`, 2 parts: Task 1 + Task 2, type `ESSAY`
- Task 1: `minWords: 150`, chart/plan `imageUrl` under `/uploads/writing/`
- Task 2: `minWords: 250`, usually no image
- Titles: `Test 15.C21.01 - Writing` (match Reading/Listening naming)

**PDF Writing pages (approx)**

| Test | PDF pages | Task 1 (authentic summary) | Task 2 (authentic summary) |
|------|-----------|----------------------------|----------------------------|
| 1 → 15 | ~30–31 | Line graph: US jobs in manufacturing, retail, agriculture, healthcare, 1960–2020 | Tall apartment blocks best way to house people in large cities — agree/disagree |
| 2 → 16 | ~52–53 | Plans: college café before redesign / now | Theatres & cinemas no longer important in digital age vs still important — discuss both |
| 3 → 17 | ~74–75 | Process: how a rain-shadow desert forms | Every undergrad course should include study abroad or work placement — advantages outweigh disadvantages? |
| 4 → 18 | ~95–96 | Chart + table: university library users & satisfaction | Primary schools focus too much on formal learning — agree? importance of play? |

**Graphics (required for Task 1)**

1. Render PDF Task 1 pages at high DPI (pymupdf pixmap).
2. Crop chart/plan only; remove Chinese reprint watermarks if any.
3. Save to e.g. `public/uploads/writing/test-15-writing-task1.png` (and 16–18).
4. If production uses R2, follow existing media upload pattern (`src/lib/media/url.ts`) — ask before bulk paid/cloud ops.

**Steps**

1. Extract exact Task 1/2 wording from PDF (render + copy).
2. Create four JSON files under `data/tests/`.
3. Attach Task 1 images.
4. Upsert when user asks.
5. Log import in `IMPORT_MISSING_AUDIO_KEYS.txt`.

**Do not** invent essay prompts. If a chart is unreadable, stop and ask — do not replace with a different chart.

---

### WP-C — Speaking import (missing)

**Status:** No `test-15-speaking` … `test-18-speaking`. Speaking JSON exists only for tests 1–14.

**Reference shape:** `data/tests/test-1-speaking.json`

- `skill: SPEAKING`, `timeLimitMinutes: 15`
- Parts: Part 1 / Part 2 / Part 3
- Question type: `SPEAKING_PROMPT` with `stem`, `topic`, `speakingPart`

**PDF Speaking pages**

| Test | Approx PDF page | Part 1 theme | Part 2 cue | Part 3 |
|------|-----------------|--------------|------------|--------|
| 1 → 15 | 32 | Hairstyles | A time you used tourist information | Holidays; tourist attractions |
| 2 → 16 | 54 | Cities | Something you read/heard that was not true | Honesty & children; honesty & advertising |
| 3 → 17 | 75 | Spending and saving money | An interesting garden or park | Homes and gardens; gardening as hobby |
| 4 → 18 | 97 | Bread | A person who is very competitive | Competitions; being competitive in sports |

**Steps**

1. Render Speaking pages; copy Part 1 bullets, Part 2 cue card (including “You should say”), Part 3 questions exactly.
2. Create `test-15-speaking.json` … `test-18-speaking.json` with titles `Test 15.C21.01 - Speaking`, etc.
3. Upsert when user asks; log import.

No audio required for standard Speaking cue import unless product requires sample answers (out of scope).

---

## 3. Suggested execution order for the assignee

1. **WP-A Test 16 Listening Parts 3–4** (smallest incremental fix; map already linked).
2. **WP-A Test 17 Listening Parts 2–4**.
3. **WP-A Test 18 Listening Parts 2–4**.
4. Optional polish **Test 15 Listening** choose-two stem UX / Q19 label.
5. **WP-B Writing** (4 tests) — graphics first, then JSON.
6. **WP-C Speaking** (4 tests).
7. User review → upsert → append `IMPORT_MISSING_AUDIO_KEYS.txt`.

Parallelization: Listening tests can be fixed in parallel by different people **if** they do not touch the same file; Writing/Speaking are independent.

---

## 4. Verification checklist (copy-paste)

For each Listening slug after rebuild:

```text
[ ] Open PDF render for that section side-by-side with JSON stems
[ ] Q1, Q11, Q21, Q31 stem match PDF (not paraphrased)
[ ] All MCQ/MATCHING option texts match PDF
[ ] correctAnswer list equals answer_keys.txt for that TEST LISTENING
[ ] IN EITHER ORDER pairs handled
[ ] acceptableAnswers for variants (spellings, numbers as words)
[ ] audioUrls resolve (files exist under public/uploads/audio/)
[ ] map/diagram image matches PDF if any
[ ] No leftover fabricated names (e.g. Curitiba-style swaps, fake speaker lists)
[ ] Script reproducible: npx tsx scripts/fix-c21-testN-listening-questions.ts
```

For Writing/Speaking: prompts pixel/text match PDF; no placeholder inventing.

---

## 5. Useful commands

```bash
# Extract / render PDF pages
python -c "import pymupdf; doc=pymupdf.open(r'docs/cambridge_21_split/Cambridge IELTS 21.pdf'); print(doc.page_count)"

# Upsert one test (after user approval)
npx tsx scripts/upsert-tests-from-json.ts --only test-16-listening --status PUBLISHED

# Schema check if a validate script exists for listening (optional)
# Follow patterns in scripts/validate_cambridge_*.ts if adapting
```

---

## 6. Out of scope / ask first

- Regenerating audio with TTS or Whisper (paid / consent).
- Changing Reading again (already fixed).
- Inventing Writing Task 1 graphics if crop fails.
- Force-pushing or amending published attempts’ historical grades (old attempts may have been graded against fabricated stems — product decision).

---

## 7. Contact context for the assignee

If something in the PDF text layer conflicts with the page image, **trust the image**.  
If unsure whether a stem is paraphrased or authentic, treat as **not done** until a screenshot of the PDF page is attached to the PR/notes.

**Prior Reading fix commit context:** fabricated stems + correct keys; rebuild scripts under `scripts/fix-c21-test*-reading-questions.ts`; log entries dated 2026-11-21 in `docs/IMPORT_MISSING_AUDIO_KEYS.txt`.
