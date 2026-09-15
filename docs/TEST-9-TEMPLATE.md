# Test 9 template — fixes, patterns, and checklist

Test 9 is the **canonical reference** for importing real WEWIN Word tests (Listening / Reading / Writing + Key 9). Admin import UI serves four docx files from `public/templates/test-9-samples.zip`.

**Source Word files (authoritative):** `E:\Wewin\IELTS\Test 9\`

| File | Repo copy | Role |
|------|-----------|------|
| `Listening 9.docx` | `public/templates/test-9-listening.docx` | 4 sections, 40 Q, tables + MCQ + matching |
| `Reading 9.docx` | `public/templates/test-9-reading.docx` | 3 passages, 40 Q, TFNG + gaps + matching + MCQ |
| `Writing 9.docx` | `public/templates/test-9-writing.docx` | Task 1 (diagram) + Task 2 essay |
| `Key 9.docx` | `public/templates/test-9-keys.docx` | Canonical keys — see `templates/canonical-keys.md` |

Rebuild zip after updating docx:

```bash
node scripts/build-test-9-templates.mjs
```

---

## What was wrong vs Word source

### Reading

| Problem | Word reality | Fix |
|---------|--------------|-----|
| `Questions N-M` headers with trailing type text failed to split blocks | e.g. `Questions 1-6 TRUE / FALSE / NOT GIVEN` | `parse-questions.ts`: range regex allows trailing instruction text |
| TFNG statements not numbered in Word | Statements run together after header | Fill unnumbered TFNG statements from block text; better TFNG detection in `detectTaskType()` |
| Passage vs tasks mixed in one blob | Passage text + questions in one mammoth dump | `reading-content.ts`: `splitReadingPassageAndTasks()` + group by `Questions` headers |
| UI showed `TRUE. TRUE` for TFNG | Options duplicated in stem + chip | Practice UI: show TRUE/FALSE/NOT GIVEN once (options only) |
| Inline gap blanks not interactive | Notes had `7 ........` but separate input boxes | `inline-notes-gaps.tsx`: render blanks inline in notes text |

### Keys (Key 9)

| Problem | Fix |
|---------|-----|
| Mixed layouts (STT/Đáp án tables, screenshots) | `parse-keys.ts` + `normalize-keys.ts` → canonical `N. answer` per `templates/canonical-keys.md` |
| WRITING/SPEAKING polluted with listening keys | Skip key merge for WRITING/SPEAKING skills in pipeline |

### Listening

| Problem | Word reality | Fix |
|---------|--------------|-----|
| Section headers not matched | `LISTENING SECTION 1 … Questions 1-10` (often tab-separated on one line) | `split-parts.ts`: `Listening Section N` matcher; may still need line breaks in Word for 4-part split |
| Word tables flattened to useless text | Section 1 form, Q31–36 layout table | `docx.ts`: `preserveContentTables` → markdown tables in part content |
| Q31–36 table rendered as bullet dump | Table in notes | `notes-table.ts` + `InlineNotesGaps` render real HTML table |
| UI: double-framed gap inputs | Badge + outer ring around each blank | `inline-notes-gaps.tsx` + `QuestionInput`: number as plain text, single input |
| Bold section / question headers missing | CDI-style layout | `reading-content.ts` groups + practice session bold headers |
| Single column layout | Passage/notes split wrong for Listening | Single interactive column with grouped notes |

**Audio (manual, not in docx):** four mp3 → `public/uploads/audio/test-9-section-{1..4}.mp3`. JSON draft sets `meta.audioUrl` per section + top-level `audioFiles[]`.

### Writing

| Problem | Fix |
|---------|-----|
| Task 1 diagram embedded in docx | `extract-docx-images.ts` → `public/uploads/writing/test-9-task1-diagram.png` |
| Bad key pollution on writing tasks | Keys merge skipped; no `correctAnswer` on essays |
| Prompt + diagram + word count not structured | `writing-prompt.ts` `splitWritingPrompt()` + `WritingDesk` in `practice-session.tsx` |
| Missing i18n for diagram / answer labels | `practice.writingDiagram`, `practice.writingAnswer` in vi + en |

### UI (all skills with gap inputs)

- Removed nested double-frame answer inputs (badge number + outer ring wrapper).
- Gap blanks: plain question number + one `<input>` only.

---

## Code / data files touched

| Area | Files |
|------|-------|
| Parser | `src/lib/import/parse-questions.ts`, `split-parts.ts`, `parse-keys.ts`, `normalize-keys.ts`, `docx.ts`, `pipeline.ts`, `extract-docx-images.ts` |
| Practice layout | `src/lib/practice/reading-content.ts`, `notes-table.ts`, `writing-prompt.ts` |
| Practice UI | `src/components/practice/inline-notes-gaps.tsx`, `practice-session.tsx` |
| Keys docs | `templates/canonical-keys.md`, `docs/IMPORT_GUIDE.md` |
| Sample downloads | `public/templates/test-9-*.docx`, `test-9-samples.zip`, `scripts/build-test-9-templates.mjs` |
| Local JSON (after import) | `data/tests/test-9-listening.json`, `test-9-reading.json`, `test-9-writing.json` |
| Media | `public/uploads/audio/test-9-section-{1..4}.mp3`, `public/uploads/writing/test-9-task1-diagram.png` |

---

## Known data gaps (Test 9 Listening)

After import from current `Listening 9.docx`, these question numbers are **missing** from parsed JSON (37/40 Q):

| Q | Likely cause |
|---|----------------|
| **Q7** | Blank uses `$` prefix: `7 $ ................` — inline gap regex may not match |
| **Q27** | “Choose TWO letters” pair — parser treats as multi-select, not two numbered gaps |
| **Q29** | Same as Q27 (paired TWO-answers block) |

Reading keys merge works (40/40 with Key 9). Re-import Listening after parser fixes for `$` blanks and TWO-letter pairs.

---

## Checklist — applying to Test N (new Word files)

See also **`docs/TEST-1-NOTES.md`** for a full Test 1 import (PART headers, filled Listening, heading-bank tables, Key 1 merge).

### 1. Prepare files

- [ ] `Listening N.docx`, `Reading N.docx`, `Writing N.docx`, `Key N.docx` (typed text keys, Key 9 format)
- [ ] Listening: 4× `.mp3` named consistently (e.g. `test-N-section-1.mp3`)
- [ ] Writing Task 1: diagram as **embedded image** in docx (not screenshot-only)

### 2. Import

- [ ] `/admin/import` → single skill or batch ZIP
- [ ] Attach `Key N.docx` for Listening + Reading imports
- [ ] Attach audio for Listening (or copy to `public/uploads/audio/` and re-save JSON)
- [ ] Preview: 4 listening parts / 3 reading passages / 2 writing tasks; 40+40 questions; keys merged

### 3. Verify parser output

```bash
npx tsx scripts/import-test.ts --file "path/Listening N.docx" --keys "path/Key N.docx"
npx tsx scripts/import-test.ts --file "path/Reading N.docx" --keys "path/Key N.docx"
npx tsx scripts/import-test.ts --file "path/Writing N.docx"
```

- [ ] No `KEYS_IMAGE_ONLY` / `PART_SYNTHETIC_QUESTIONS` unless expected (image-only content)
- [ ] `MISSING_ANSWER` count = 0 for L/R
- [ ] Section/passage split correct (not `Full test` fallback)

### 4. Practice UI smoke test

- [ ] **Reading:** left = passage, right = question groups; TFNG shows one set of options
- [ ] **Listening:** bold `Questions N-M` headers; inline gaps in notes/tables; Q31–36 as table if applicable
- [ ] **Writing:** Task 1 diagram visible; word requirement shown; essay textarea
- [ ] Gap inputs: single border, no double frame

### 5. Persist & refresh

- [ ] Save local JSON (`data/tests/test-N-*.json`) or **Lưu vào DB**
- [ ] **Hard refresh** browser (or new incognito) — cached attempt JSON can show old layout
- [ ] Start a **new attempt** — in-progress attempts keep old question snapshot

### 6. Update templates (optional)

- [ ] Copy docx to `public/templates/test-N-*.docx`
- [ ] Rebuild zip / update admin download if this test becomes the new reference

---

## Re-import reminders

1. **Preview saves local JSON** automatically — DB persist is separate (“Lưu vào DB”).
2. **Hard refresh** after re-import; service worker / Next cache may serve stale chunks.
3. **New attempt required** for students to see parser/UI fixes on an existing test slug.
4. **Audio / diagram paths** are static URLs — copy files to `public/uploads/` before or after import.
5. Keys must remain **typed text** (Key 9 layout) — screenshots → `KEYS_IMAGE_ONLY`.

---

## Related docs

- General import format: `docs/IMPORT_GUIDE.md`
- Keys canonical layout: `templates/canonical-keys.md`
- Cursor rule: `.cursor/rules/keys-format-key9.mdc`
