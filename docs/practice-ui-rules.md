# Practice UI rules

Checklist for new imports and practice-UI edits. Do not undo these. Each item names the code that already implements it and the script that locks it.

```bash
npx tsx scripts/test-shared-choice.ts
npx tsx scripts/test-answer-alternatives.ts
npx tsx scripts/test-reading-passage-chrome.ts
npx tsx scripts/test-sentence-gap-layout.ts
npx tsx scripts/test-gap-stems.ts
npx tsx scripts/test-notes-outline.ts
```

## Repeating answer banks

Show one shared option list, then a dropdown per answer. Do not repeat the full radio list on every question.

Use the bank when consecutive questions share the same options (`optionBankKey`): True/False/Not Given, Yes/No/Not Given (`TRUE_FALSE_NG`), matching headings / features / information (`MATCHING`), a summary word list reused across questions, and choose TWO/THREE. A single TFNG or Yes/No item still uses the bank. A multiple-choice item whose options differ from its neighbours stays `kind: "single"` and keeps radios.

- Cluster: `clusterSharedChoices` in `src/lib/practice/shared-choice.ts`.
- Render: `OptionBank` (one bordered box) and `AnswerSelect` (one dropdown per number) in `src/components/practice/shared-choice-answers.tsx`. Dropdown text is the letter (`A`, `i`) or the closed word (`TRUE`, `FALSE`, `NOT GIVEN`, `YES`, `NO`) via `dropdownChoiceLabel`. Full wording stays in the box.
- Wired from `practice-session.tsx` (`clusterSharedChoices` → `SharedChoiceAnswers`, else `QuestionInput` radios).
- Option lines (`A    front feet`) are stripped from the notes pane by `isOptionBankLine` inside `parseReadingQuestionGroups` (`src/lib/practice/reading-content.ts`).
- A bank of single letters with no wording (`A` / `A` … `I` / `I`) is not drawn (`optionBankIsLetterOnly`). The dropdown still lists A–I. Matching-information questions have no word box on the paper. `TRUE` / `FALSE` / `NOT GIVEN` and `YES` / `NO` still draw their box.
- A short letter-and-phrase list of 4–12 items (`A gravitational pull` … `F disk`, or `A front feet` … `L hair`) is a 3-column table (`optionBankUsesWordGrid`), the same shape as a Word summary word box. Longer sentence endings stay one column.
- When those phrases fill numbered gaps already printed in the summary (`27 ……` … `32 ……`), the letter dropdown sits in the gap and the word table is shown once under the summary (`inlineChoiceBank`). The summary paragraph stays one block. A line with numbered gaps is not dropped just because fragment stems overlap it. The same sentence is not repeated as a second question row.
- If the paper’s `List of Options` is longer than the stored bank (A–K stored, `L hair` still printed), `withPrintedWordList` restores the missing letters. The table title is `List of Options`.
- A short untitled line in that summary (`The core-accretion model`, `The gravitational-instability model`) is bold (`isNotesSubheading`). Sentences and instruction lines stay plain. A fragment sitting immediately in front of a numbered gap (`Melatonin causes` before `7 ……`, `Big drop in` before `8 ……`) stays plain (`isBoldNotesLine`). The section labels on their own lines stay bold.
- Test: `scripts/test-shared-choice.ts`, `scripts/test-notes-outline.ts`.

## Choose N letters

`selectCount >= 2` is one set. Three dropdowns are three boxes for that set (`covers` on the lead question), not three separately ordered questions.

Scoring ignores order. `gradeAnswers` in `src/lib/scoring.ts` groups the slots with `buildMultiSelectPairMap` and marks each box with `matchMultiSelectAnswers`: a letter is correct if it matches any remaining key, then that key is consumed. `E, B, D` matches key `B, D, E`. A repeated letter does not score twice. Do not change this to per-box order matching.

- UI: `isMultiSelectQuestion` / `getCoveredNumbers` in `src/lib/practice/multi-select.ts`, rendered by `SharedChoiceAnswers`.
- Test: `scripts/test-answer-alternatives.ts`.

## Reading left column

The left passage does not show exam chrome. Those headings belong on the right.

- Drop a line that is only `READING PASSAGE N` (`isPassageLabelLine`), a standalone `below.` (`isStandaloneBelowLine`), and a bare `Questions N–M` (`isBareQuestionHeadingLine` / `removeQuestionHeadingLines`). Spend-time lines such as “Questions 14–27, which are based on Reading Passage 2 below.” are leading instructions, not the passage. `decorateReadingPassage` in `src/lib/practice/reading-content.ts` does this. It does not insert question headings; `groups` is only used to drop leftover copies.
- The short heading before paragraphs A/B/C is the title (`readingPassageTitle` wraps it as `[[title]]`). `BoxedContent` centers it and bolds it (`passageLayout`).
- A paragraph label at the start of a paragraph (`A`, `A.`, `A)`, `Paragraph A`, `A After…`) is wrapped by `matchParagraphLabel` and drawn bold and larger (`text-lg font-bold`) in `boxed-content.tsx`. Hard-wrapped lines from Word are joined into flowing paragraphs (`markPlainParagraphs`). A new paragraph starts at the printed opening (`With classes that start…`, `Now, fueled…`, `It does not help…`), not at every line that happens to end with a full stop. A blank line that splits a sentence (`of these` / `publications`) is a page break and stays in the same paragraph. A short in-passage heading (`The melatonin shift`, `Schools respond`) is bold (`[[phead]]`). A standfirst under the title with no full stop (`Objects made by previous generations…`) is centered like the title. Body paragraphs are justified, first-line indented, with `leading-7` and `space-y-5`.
- `A new study` is body text, not a label. The spaced form only matches when the next token starts with a capital or a quote (`A After…`).
- `splitBoxedSegments` in `src/lib/practice/boxed-text.ts` splits `[[title]]` / `[[box]]` / `[[section]]` before the passage renderer.
- When the paper prints questions before the passage (Test 12 Passage 2, Test 10 Passage 2, Test 7 Passage 2), `splitReadingPassageAndTasks` still puts paragraphs A–I on the left. `pullEmbeddedPassage` lifts that lettered block out of the task text. If the heading task is printed before the passage, the lettered passage still goes on the left and the List of Headings stays on the right; passage paragraphs are not the option bank. A letter on its own line (`A` then the paragraph) counts the same as `A Humans…`. `N Section A` and `N. Paragraph A` are task boundaries, so the heading questions stay on the right. A glued `List of Headingsi.` is still that roman list, including heading i. A `List of Headings` (i–xii) replaces matching options that were copied passage paragraphs, so those paragraphs are not drawn again on the right (`withHeadingBank`). The box is titled with the paper’s “List of Headings” line.
- Heading questions printed as `14 Section A` … `20 Section G` under that list are one roman-numeral bank, even when the import stored question 14 as multiple choice (passage paragraphs as radios) and 15–20 as empty text boxes (Test 11 Passage 2). `headingSectionStems` restores `Section A` and `withHeadingBank` attaches i–viii. A line break that leaves `READING PASSAGE 2` alone above `has seven sections…` is joined back into one instruction.
- Test: `scripts/test-reading-passage-chrome.ts`.

## Sentence completion

A numbered line whose gap is an unnumbered `_______` or dotted blank is that question’s sentence. Show it once, with the input in the gap. Never static underscores above plus a stem-less input below.

- Detect: `isStandaloneSentenceGapStem` and `perQuestionSentenceStem` in `src/lib/questions/gap-stems.ts` (`6 Clarence … _______ …`). A gap that already contains the number (`Habitat 1 ……`) is shared notes, not this case.
- `parseReadingQuestionGroups` lifts those lines into `sentenceStems` and removes them from static notes. Shared notes/forms stay in `notes` only when a number sits in the gap (`lineHasInlineBlank`).
- Render: `formatQuestionStem` turns dotted blanks into `_____`; `QuestionInput` in `src/components/practice/practice-session.tsx` splits on one `_____` and puts the input between the two halves (`inlineGap`). `resolveGapDisplayStem` prefers a real stored stem, otherwise the lifted sentence.
- Import must not clear these stems. `shouldClearInlineGapStem` returns false for `isStandaloneSentenceGapStem`, even when the same part also has real notes blanks. `sanitizePartGapStems` only clears sliding-window / notes fragments.
- `shouldHideStemBesideNotes` in `src/lib/ui/question-type-label.ts` hides redundant notes fragments beside the notes pane. It does not hide a standalone sentence gap.
- Tests: `scripts/test-sentence-gap-layout.ts`, `scripts/test-gap-stems.ts`.

## Bordered completion notes

Complete-the-notes blocks that sit in a Word box keep one dark frame, a centered bold title, and indented bullets. The answer input stays in the numbered gap.

- Import: a one-cell table with list bullets and numbered gaps becomes `[[box]]` … `[[/box]]`. The heading is `[[ntitle]]` … `[[/ntitle]]`. Word list level N is `[[bN]]` (`[[b1]]` draws the hollow circle). `borderedNotesFromTableHtml` / `htmlTableToMarkdown` in `src/lib/practice/notes-outline.ts` and `src/lib/practice/notes-table.ts`.
- Render: `classifyOutlineNotes` splits title, full-width section lines, and bullets. `OutlineNotesBody` in `src/components/practice/boxed-content.tsx` uses `OUTLINE_BOX_CLASS` (`border-zinc-500 bg-white`), `OUTLINE_TITLE_CLASS` (centered, bold), and `outlineBulletRowClass` (deeper levels indent further). Hollow, filled, and dash markers keep the glyph already in the line (`•`, `○`, `o `, `- `, `[[bN]]`). `InlineNotesGaps` uses that layout for `[[box]]` notes and for notes that already contain those bullets.
- A numbered gap inside the notes (`1 ……`) stays inline. An unnumbered `_______` on its own numbered line stays a sentence gap.
- A bullet glyph on its own line (`•` then the sentence) is joined to that sentence (`joinOrphanBullets`). The first short line (`The melatonin shift`) is the centered title. Later short lines (`Biological changes`, `Sleep loss`, `Caffeine`) are bold section labels (`isNotesSubheading`).
- A short A–E list printed under a summary (`A competitiveness` … `E city`, Test 10 Questions 22–26) is one word bank. The gaps become letter dropdowns and the list is not also a radio question (`withSummaryWordList`). `isOptionBankLine` also matches a single space when the phrase is short, so the list is not copied into the notes.
- A word list that the import split around the next `Questions` header (`A skilful`, `D practical`, then Questions 37–40, then `B creative` … `G detailed`) is still one bank, in letter order (`scatteredWordLists`). Stored options that are only part of that list are replaced by the full list.
- A short A–D block that follows a numbered stem (`24 The Manatuto…` then `A charitable trust.`) is that question’s radios, not a word bank for earlier gaps. Flow-chart blanks such as Test 8 questions 14–19 stay text answers (`shortLetterRuns`).
- A matching list of full sentences (`A. Since the speakers…` … `D. Because…`, Test 8 questions 38–40) is one bank even when the import stored only C and D (`withStatementBank`).
- A people or organisation list whose first row is glued to the heading (`organisationsA Scott Klara`, Test 7 questions 1–6) is still that bank. When the stored options start at B, put A back in front and leave labels B–F as stored. The questions stay one dropdown bank (`withRecoveredLeadingLetter`). A short A–D block after a numbered stem stays that question’s radios.
- “Which paragraph contains the following information?” with “Write the correct letter, A–J” is a letter dropdown (Test 7 questions 7–9), not a text box and not the previous people list. No letter-only box is drawn (`withParagraphLetterBank`).
- A flow chart (`↓` on its own line) is centered: bold title, plain steps, a centered arrow between steps. A step such as `Remove the filters from the fire` is not a bold section label.
- A bow chart stored only as `Complete the Bow-chart below` (Test 6 questions 37–40) is the cycle in the paper. The figure’s boxes 11, 12, 13, 14 are questions 37, 38, 39, 40 in that order: the tall source box, `Find out their`, the first `Develop through` bullet, then `Processed by the`. `marketing intelligence activities`, `research process`, and `Timely and accurate data description` stay plain text. The four answers sit in those boxes, not as a second stack of inputs (`bowChartNotes`).
- When the paper’s gloss is YES / NO / NOT GIVEN and the import stored TRUE / FALSE / NOT GIVEN, the dropdown and the box use YES / NO / NOT GIVEN (`withYesNoBank`). The three words and the three `if…` lines are zipped into one gloss each. `READING PASSAGE N` on its own line, including across a blank line, is joined back into the instruction sentence.
- A multiple-choice stem split over two lines, with A–D only in the paper (Test 10 Question 21), gets the rest of the stem and those options back (`withRecoveredChoices`).
- `Ddomestic` at the start of a line is `domestic` (the extra letter is dropped). Later `ddomestic` is `domestic` (`repairImportedText`).
- Test: `scripts/test-notes-outline.ts`.

## Answer-key alternatives

Scoring, not layout. Keys from imports hit this often.

`expandAnswerAlternatives` in `src/lib/scoring.ts` (used by `isAnswerCorrect` and `matchMultiSelectAnswers`):

- `a/b` means either side is correct. The full key (`a/b` or `a / b`) still matches.
- Glued `word(other)` (no space before `(`) means either word. Concatenation is also accepted, but not required.
- A space before `(`, or a leading `(the) royal antelope`, is an optional word. The phrase with and without it is correct. The optional word alone is not.
- `n/g` is a NOT GIVEN alias (`isNotGivenSlash`). It is not split into `n` and `g`.
- An all-numeric slash such as `1/2` or `12/05/1990` stays one token (`isPureNumberToken`). `10/ten` still splits.

Test: `scripts/test-answer-alternatives.ts`.
