# Test 3 notes

Imported to match Test 9 quality from `IELTS/Test 3/` (also mirrored under
`E:\Wewin\IELTS\Test 3\`).

## Slugs

- `test-3-listening`
- `test-3-reading`
- `test-3-writing`

Speaking (`test-3-speaking`) was **not** edited; JSON timestamp unchanged.

## Keys

Canonical **Key 3** (Listening + Reading, Key 9 layout):

- `IELTS/Test 3/Key 3.docx`
- `public/templates/test-3-keys.md` / `test-3-keys.docx`
- `data/keys/test-3-keys.md`

Source was typed `Reading + Listening 3 keys_.docx` (two-column Reading +
alternating number/answer Listening). Auto-`normalizeKeysToCanonical` mis-merged
skills, so answers were authored explicitly (same approach as Test 2). Matching
letter **F** kept as `F` (not rewritten to FALSE). OE alternate notes in the
source (`17 OE:C`, `26 OE:A`) ignored — WEWIN key preferred.

Archived original: `_old/Reading + Listening 3 keys_.docx`.

Rebuild:

```bash
npx tsx scripts/build-test-3.ts
npx tsx scripts/upsert-tests-from-json.ts --only test-3-listening,test-3-reading,test-3-writing
```

## Audio choices

| Section | Chosen file | Duration | Rationale |
|---------|-------------|----------|-----------|
| 1 | `01Track1(2).mp3` → `section-1.mp3` | 07:38 | Track 1 naming |
| 2 | `audio 2.mp3` → `section-2.mp3` | 05:16 | “audio 2” |
| 3 | `audio 3.mp3` → `section-3.mp3` | 07:28 | “audio 3” |
| 4 | `4-Track-4.mp3` → `section-4.mp3` | 16:32 | Track 4; length matches Test 1/9 §4 |

Archived extras: `4Track4.wma` (same duration as §4 mp3), plus original messy names
under `_old/`. Copied to `public/uploads/audio/test-3-section-{1..4}.mp3`.

## Media

| Asset | Path |
|-------|------|
| Listening §1–4 audio | `public/uploads/audio/test-3-section-{1..4}.mp3` |
| Listening map (Part 2 / Q11–14) | `public/uploads/images/test-3-listening-map.png` |
| Writing Task 1 diagram | `public/uploads/writing/test-3-task1-diagram.png` |

## What differed / parser fixes

1. **Choose TWO** — Word uses `Questions 27 – 28` (en-dash) and `Questions 29 and 30`.
   `normalizeChooseTwoPairs` now accepts `and` / `-` / `–` / `—` / `to`. Both pairs
   get `selectCount` + `covers` + `pairedFrom`; `toPublicQuestion` already forwards them.
2. **Teacher-filled Listening** — Section 1 notes had answers + `(CORRECTED)`.
   `strip-filled-answers.ts`: stop answer tokens from swallowing trailing blank dots
   (ReDoS-safe linear scans); strip `(CORRECTED)` / arrow notes; residual
   `........ ANSWER........` cleanup.
3. **Reading matching** — `Match each event/opinion/history…` was falling through to
   SHORT_ANSWER. `detectTaskType` now treats `match each` + en-dash letter ranges as
   MATCHING (P1 Q5–13 dates/people, P3 Q27–32 Olympics).
4. **Reading double-header** — spend-time / “Questions N–M based on Passage” chrome
   stripped from the left passage panel via `stripPassageChrome` in
   `reading-content.ts`.

## Upsert

```
npx tsx scripts/upsert-tests-from-json.ts --only test-3
```

Persisted listening / reading / writing (and re-saved existing speaking JSON
unchanged because `--only test-3` prefix-matches). Prefer the longer `--only`
list above next time to skip speaking.

## Final folder (`IELTS/Test 3/`)

```
Key 3.docx
Listening 3.docx
Reading 3.docx
Writing 3.docx
section-1.mp3 … section-4.mp3
_old/ (messy audio + combined keys)
```

## Verify in UI

1. Hard refresh / incognito; **new attempt**.
2. Listening: 4 sections + audio; §1 blank notes; §2 map; §3 Choose TWO ×2 (checkboxes).
3. Reading: 3 passages; P1 headings + date/people matching; no spend-time double header.
4. Writing: Task 1 diagram visible.
