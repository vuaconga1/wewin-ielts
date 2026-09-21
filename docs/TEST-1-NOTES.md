# Test 1 notes

Imported to match Test 9 quality as closely as possible from
`E:\Wewin\IELTS\Test 1\`.

## Slugs

- `test-1-listening`
- `test-1-reading`
- `test-1-writing`

## Keys

Canonical Key 1 (Listening + Reading, Key 9 layout):

- `public/templates/test-1-keys.md`
- `public/templates/test-1-keys.docx` (generated text docx)
- `data/keys/test-1-keys.md`

Built from `Listening Test Keys.docx` + `Reading keys.docx` via
`normalizeKeysToCanonical` (40 + 40 answers).

Rebuild everything:

```bash
npx tsx scripts/build-test-1.ts
```

## Media

| Asset | Path |
|-------|------|
| Listening audio §1–4 | `public/uploads/audio/test-1-section-{1..4}.mp3` |
| Listening map (Part 2) | `public/uploads/images/test-1-listening-map.png` |
| Writing Task 1 diagram | `public/uploads/writing/test-1-task1-diagram.png` |

## What differed from Test 9

1. **Listening uses `PART N` headers** (not `LISTENING SECTION N`) — `split-parts.ts` now treats `PART N` as sections and restores a `Questions N–M` trailer into the part body when it sat on the same heading line.
2. **Teacher-filled Listening docx** — no blank student paper. Import strips filled dots (`1 ......database......`), `£`/`$` currency blanks, `= …` teacher notes, `(x2) / sửa lần`, and map letters. See `strip-filled-answers.ts`.
3. **Section 1 notes box is a 1-column Word table** — previously became markdown soup (`| Music Alive Agency |`, `| --- |`, trailing `|`) and crushed lines in the UI. `htmlTableToMarkdown` now emits plain multiline text for single-column tables; `unwrapSingleColumnMarkdownNotes` + `InlineNotesGaps` also strip leftover single-col markdown at render time (Test 9-style inline gaps).
4. **Nested Word `<ol>` MCQs** — HTML→text conversion labels A/B/C; protects heading-bank tables so List of Headings is not turned into fake MCQ options.
5. **Reading heading bank** lived in a 1×1 Word table with `<ol>` — previously wiped (`htmlTableToMarkdown` required 2+ rows). Now preserved and auto-labeled `i.`–`ix.` when roman numerals are missing in Word.
6. **Bare `Question 26` headers** used to trigger the markdown template parser and skip IELTS parsing for the whole passage — template path now requires `[type]` / `### Qn` markers.

## Q36–37 (Reading Passage 3)

Word stems for Q36–37 are about **mapmaking / satellite mapping** — clearly copy-pasted from another passage into the Ronalds telegraph text. Keys still have answers (`36. G`, `37. A`).

**Handling:** questions kept with keys; stems prefixed with a recovery flag (`notesFlag: FOREIGN_STEM`) rather than inventing replacement IELTS stems. Q38–40 look on-topic for Ronalds and were left as in Word.

## Listening stubborn gaps / repairs

- **Section 2 Q11–14:** Word flattens the first MCQs into one run-on line. `scripts/build-test-1.ts` repairs stems/options from the recoverable Word/HTML source, then re-merges keys.
- **Section 3 Q21:** same flattening — repaired when stem is garbage.
- Map Q15–20 use synthetic blanks + map image on part/question meta.

## Reading Passage 1 (BOVIDS) — parser fixes

Word source is correct; older imports mis-rendered:

1. **Q1–3 MCQ** — stale JSON had `MULTIPLE_CHOICE` with empty stem/`blank:true` (text inputs). Fresh parse already had radios; rebuild refreshes local/DB.
2. **Q4–8 matching** — unnumbered MCQ stole Q4 as "List of sub-families" + bank A–D. Parser now skips unnumbered MCQ on `MATCHING` blocks and accepts `4 can endure…` without a period.
3. **Q9–13 short answers** — "Answer the questions below / NO MORE THAN THREE WORDS" was treated as notes `GAP_FILL`; `\s{2,}` blank regex treated `9   What is…?` as inline gaps → empty stems. Now `SHORT_ANSWER` with full stems; blank detection requires real dots/underscores (or mid-line space blanks only).

## Remaining known gaps

- Some Listening MCQ option wording is lightly cleaned vs teacher markup (not always word-for-word identical to a clean Cambridge paper).
- Section 3 matching Q27–30 exhibition stems may still show residual teacher notes on one label (`City Life`).
- Writing Task prompts in Word are minimal (spend-time + word count only); diagram image is attached like Test 9.
- Practice UI: start a **new attempt** and hard-refresh after re-import — in-progress attempts keep old snapshots.

## Verify in UI

1. Hard refresh browser (or incognito).
2. Open practice for `test-1-listening` / `test-1-reading` / `test-1-writing` — **new attempt**.
3. Listening: 4 sections, per-section audio, Part 2 map image, blank notes (no filled answers). Section 1 = “Music Alive Agency” notes form with inline Q1–10 (no `|` / `---` markdown).
4. Reading: 3 passages, ~40 questions; P1 Q1–3 radios + stems, Q4–8 matching, Q9–13 short-answer stems; check P3 Q36–37 flag text.
5. Writing: Task 1 diagram visible.
