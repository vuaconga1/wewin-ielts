"use client";

import { useEffect, useState, type MutableRefObject } from "react";
import { BoxedContent } from "@/components/practice/boxed-content";
import { renderRichText } from "@/components/practice/rich-text";
import { HighlightablePassage } from "@/components/practice/highlightable-passage";
import { OptionBank, SharedChoiceAnswers } from "@/components/practice/shared-choice-answers";
import { InlineNotesGaps, findInlineBlankNumbers } from "@/components/practice/inline-notes-gaps";
import {
  parseReadingQuestionGroups,
  decorateReadingPassage,
  splitReadingPassageAndTasks,
  repairImportedText,
  withHeadingBank,
  withPrintedWordList,
  withParagraphLetterBank,
  withRecoveredChoices,
  withYearLetterBank,
  withRecoveredLeadingLetter,
  withStatementBank,
  withSummaryWordList,
  withYesNoBank,
  type ReadingQuestionGroup,
} from "@/lib/practice/reading-content";
import type { PassageHighlight } from "@/lib/practice/passage-highlights";
import { letterRangeOptions } from "@/lib/practice/letter-range";
import {
  formatCoveredLabel,
  getCoveredNumbers,
  getSelectCount,
  isMultiSelectQuestion,
  isPairedSatellite,
  readMultiSelectAnswers,
  toggleMultiSelectAnswer,
} from "@/lib/practice/multi-select";
import {
  clusterSharedChoices,
  inlineChoiceBank,
  optionBankIsLetterOnly,
  optionBankKey,
  optionBankUsesWordGrid,
} from "@/lib/practice/shared-choice";
import { countWords } from "@/lib/scoring";
import { resolveGapDisplayStem } from "@/lib/questions/gap-stems";
import {
  formatQuestionStem,
  isBlankQuestionType,
  shouldHideStemBesideNotes,
} from "@/lib/ui/question-type-label";
import { useTranslations } from "@/i18n/provider";

export type Question = {
  number: number;
  type: string;
  mediaUrl?: string;
  content: {
    stem?: string;
    variant?: import("@/lib/questions/layout-variants").QuestionLayoutVariant;
    tableLayout?: import("@/lib/import/schemas").StructuredTableLayout;
    options?: { label: string; text: string }[];
    minWords?: number;
    hint?: string;
    sample?: string;
    blank?: boolean;
    imageUrl?: string;
    speakingPart?: 1 | 2 | 3;
    topic?: string;
    /** Choose TWO/THREE: max selections */
    selectCount?: number;
    /** Choose TWO/THREE: answer slots written by this lead question */
    covers?: number[];
    /** Satellite of a choose-TWO lead — not rendered alone */
    pairedFrom?: number;
  };
};

export type Part = {
  title: string;
  order: number;
  content?: string;
  meta?: Record<string, unknown>;
  questions: Question[];
};

/**
 * Listening map/plan labels are short lookup labels tied to a large figure.
 * Keep the figure and instructions in the prompt pane, but place the label
 * beside its answer control so the learner does not have to scroll between
 * the map and a detached label list.
 */
export function listeningFigureAnswerLabel(
  question: Question,
  skill: string,
): string | null {
  if (skill !== "LISTENING" || question.type !== "MAP_LABELING") return null;
  const figureUrl = question.content.imageUrl ?? question.mediaUrl;
  if (!figureUrl || /\.(?:mp3|m4a|wav|ogg)(?:\?|$)/i.test(figureUrl)) return null;
  const label = formatQuestionStem(
    question.content.stem ?? "",
    question.number,
  )
    .replace(/\s*_____\s*$/u, "")
    .trim();
  return label || null;
}

export function ReadingOrNotesSplit({
  part,
  isReading,
  skill,
  answers,
  currentNumber,
  questionRefs,
  onFocusQuestion,
  onChange,
  onPatchAnswers,
  highlights = [],
  onHighlightsChange,
}: {
  part: Part;
  isReading: boolean;
  skill: string;
  answers: Record<string, string>;
  currentNumber: number | null;
  questionRefs: MutableRefObject<Map<number, HTMLElement>>;
  onFocusQuestion: (n: number) => void;
  onChange: (n: number, v: string) => void;
  onPatchAnswers: (patch: Record<string, string>, focusNumber: number) => void;
  highlights?: PassageHighlight[];
  onHighlightsChange?: (next: PassageHighlight[]) => void;
}) {
  const { t } = useTranslations("practice");
  const reading = isReading
    ? splitReadingPassageAndTasks(part.content ?? "")
    : null;
  const taskSource = isReading
    ? (reading?.tasks ?? "")
    : (part.content ?? "");
  let questions = isReading
    ? withHeadingBank(
        withRecoveredChoices(
          withYesNoBank(
            withRecoveredLeadingLetter(
              withParagraphLetterBank(
                withYearLetterBank(
                  withStatementBank(
                    withSummaryWordList(
                      withPrintedWordList(part.questions, taskSource),
                      taskSource,
                    ),
                    taskSource,
                  ),
                  taskSource,
                ),
                taskSource,
              ),
              taskSource,
            ),
            taskSource,
          ),
          taskSource,
        ),
        taskSource,
      ).map((question) => ({
        ...question,
        content: {
          ...question.content,
          stem: question.content.stem
            ? repairImportedText(question.content.stem)
            : question.content.stem,
          options: question.content.options?.map((opt) => ({
            ...opt,
            text: repairImportedText(opt.text),
          })),
        },
      }))
    : part.questions;
  // Some imported "choose answers from the box" groups incorrectly tag their
  // first item as MULTIPLE_CHOICE. Restore it as a matching item so every
  // number in the printed range uses the same answer control.
  const matchingRange =
    taskSource.match(
      /questions?\s+(\d{1,2})\s*[-–]\s*(\d{1,2})[\s\S]{0,800}?choose\s+(?:two|three|four|\d+)\s+answers?\s+from\s+(?:the\s+)?(?:box|list)/i,
    ) ??
    taskSource.match(
      /choose\s+(?:two|three|four|\d+)\s+answers?\s+from\s+(?:the\s+)?(?:box|list)[\s\S]*?questions?\s+(\d{1,2})\s*[-–]\s*(\d{1,2})/i,
    );
  const matchingInstruction = /choose\s+(?:two|three|four|\d+)\s+answers?\s+from\s+(?:the\s+)?(?:box|list)/i.exec(taskSource);
  const precedingRanges = matchingInstruction
    ? [
        ...taskSource
          .slice(0, matchingInstruction.index)
          .matchAll(/questions?\s+(\d{1,2})\s*[-–—]\s*(\d{1,2})/gi),
      ]
    : [];
  const nearestMatchingRange = precedingRanges[precedingRanges.length - 1];
  const resolvedMatchingRange = nearestMatchingRange ?? matchingRange;
  if (resolvedMatchingRange) {
    const start = Number(resolvedMatchingRange[1]);
    const end = Number(resolvedMatchingRange[2]);
    const inRange = questions.filter(
      (question) =>
        question.number >= start &&
        question.number <= end &&
        (question.content.options?.length ?? 0) >= 2,
    );
    const bankSource =
      inRange.find((question) => question.type === "MATCHING") ?? inRange[0];
    const optionBank = bankSource?.content.options;
    const bankTexts = new Set(
      (optionBank ?? []).map((opt) => opt.text.trim().toLowerCase()),
    );
    if (optionBank) {
      questions = questions.map((question) => {
        if (
          question.number < start ||
          question.number > end ||
          question.type !== "MULTIPLE_CHOICE" ||
          // A real A/B/C item with its own options is not part of the box.
          !(question.content.options ?? []).every((opt) =>
            bankTexts.has(opt.text.trim().toLowerCase()),
          )
        ) {
          return question;
        }
        const location = taskSource.match(
          new RegExp(`(?:^|\\n)\\s*${question.number}\\s+([^\\n]+)`, "i"),
        )?.[1]?.trim();
        return {
          ...question,
          type: "MATCHING",
          content: {
            ...question.content,
            stem: location || question.content.stem,
            options: optionBank,
          },
        };
      });
    }
  }
  const groups = taskSource
    ? parseReadingQuestionGroups(taskSource, questions)
    : [];
  const leftBody = isReading
    ? decorateReadingPassage(reading?.passage ?? part.content ?? "", groups)
    : "";

  /** Prefer the tightest Questions range so Q27 is not rendered under both 21–30 and 27–28. */
  const primaryGroupByNumber = new Map<number, ReadingQuestionGroup>();
  for (const q of questions) {
    let best: ReadingQuestionGroup | null = null;
    for (const g of groups) {
      if (q.number < g.start || q.number > g.end) continue;
      const span = g.end - g.start;
      if (
        !best ||
        span < best.end - best.start ||
        (span === best.end - best.start && g.start > best.start)
      ) {
        best = g;
      }
    }
    if (best) primaryGroupByNumber.set(q.number, best);
  }

  const sentenceStemByNumber = new Map<number, string>();
  for (const g of groups) {
    for (const [key, value] of Object.entries(g.sentenceStems)) {
      if (value) sentenceStemByNumber.set(Number(key), value);
    }
  }

  const groupedNumbers = new Set(primaryGroupByNumber.keys());
  const ungrouped = questions.filter(
    (q) => !groupedNumbers.has(q.number) && !isPairedSatellite(q.content),
  );

  const isGapQuestion = (q: Question) =>
    q.type === "GAP_FILL" ||
    q.type === "TABLE_COMPLETION" ||
    q.type === "MAP_LABELING" ||
    Boolean(q.content.blank);
  /**
   * ANSWERS column: choose-TWO slots get the lead's letter bank; letter groups
   * without an option list ("Write the correct letter, A–H") get A…H.
   */
  const sidebarQuestions = questions
    .map((q) => {
      if ((q.content.options?.length ?? 0) >= 2) return q;
      if (isPairedSatellite(q.content)) {
        const lead = questions.find((other) => other.number === q.content.pairedFrom);
        if (lead?.content.options) {
          return { ...q, content: { ...q.content, options: lead.content.options } };
        }
      }
      const letters = letterRangeOptions(taskSource, q.number);
      return letters ? { ...q, content: { ...q.content, options: letters } } : q;
    });

  const renderQuestion = (q: Question) => {
    if (listeningFigureAnswerLabel(q, skill)) return null;
    const displayStem = resolveGapDisplayStem(
      q.content.stem,
      sentenceStemByNumber.get(q.number),
    );
    const question =
      displayStem === (q.content.stem ?? "").trim()
        ? q
        : { ...q, content: { ...q.content, stem: displayStem } };
    return (
      <div key={question.number} data-q={question.number}>
        <QuestionInput
          question={question}
          skill={skill}
          answers={answers}
          onChange={(v) => onChange(question.number, v)}
          onPatchAnswers={onPatchAnswers}
          compactStem={Boolean(part.content)}
          readOnly
        />
      </div>
    );
  };

  const renderQuestionBlocks = (list: Question[], bankTitle?: string) =>
    clusterSharedChoices(list).map((block) => {
      if (block.kind === "single") return renderQuestion(block.question);
      const options = block.questions[0]?.content.options ?? [];
      const variant = block.questions[0]?.content.variant;
      const romanBank =
        Boolean(bankTitle) &&
        options.length >= 3 &&
        options.every((opt) =>
          /^(?:xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)$/i.test(opt.label.trim()),
        );
      return (
        <SharedChoiceAnswers
          key={`bank-${block.questions[0]!.number}`}
          questions={block.questions}
          answers={answers}
          onChange={onChange}
          currentNumber={currentNumber}
          questionRefs={questionRefs}
          onFocusQuestion={onFocusQuestion}
          compactStem={Boolean(part.content)}
          bankTitle={
            variant === "MATCHING_SENTENCE_ENDINGS"
              ? t("sentenceEndings", "Sentence endings")
              : romanBank
                ? bankTitle
                : undefined
          }
          readOnlyPlaceholders
        />
      );
    });

  const renderGroup = (group: ReadingQuestionGroup) => {
    const qs = questions.filter(
      (q) =>
        primaryGroupByNumber.get(q.number) === group &&
        !isPairedSatellite(q.content),
    );
    if (qs.length === 0 && !group.notes && !group.header) return null;

    const mcqNumbers = new Set<number>();
    for (const q of qs) {
      if (q.type !== "MULTIPLE_CHOICE") continue;
      if ((q.content.options?.length ?? 0) < 2) continue;
      for (const n of getCoveredNumbers(q.number, q.content)) mcqNumbers.add(n);
    }
    const notesText = stripOwnedBlankLines(group.notes ?? "", mcqNumbers);
    const explicitLayoutVariant = qs.find(
      (question) => typeof question.content.variant === "string",
    )?.content.variant;
    const groupInstructionText = [group.header, ...group.instructions].join("\n");
    const completionLayoutVariant =
      explicitLayoutVariant ??
      (/complete the (?:form|application)|booking form/i.test(groupInstructionText)
        ? "FORM_COMPLETION"
        : /complete the (?:notes?|table)(?: below)?/i.test(groupInstructionText)
          ? "NOTE_COMPLETION"
          : undefined);
    const inlineNumbers = notesText
      ? new Set(
          findInlineBlankNumbers(notesText).filter(
            (n) => n >= group.start && n <= group.end && !mcqNumbers.has(n),
          ),
        )
      : new Set<number>();
    const notesBank = inlineChoiceBank(qs, inlineNumbers);
    const notesBankKey = optionBankKey(notesBank ?? undefined);
    const notesChoices = new Map<number, NonNullable<typeof notesBank>>();
    if (notesBank && notesBankKey) {
      for (const q of qs) {
        if (
          inlineNumbers.has(q.number) &&
          optionBankKey(q.content.options) === notesBankKey
        ) {
          notesChoices.set(q.number, notesBank);
        }
      }
    }
    const restQs = qs.filter((q) => {
      if (notesChoices.has(q.number)) return false;
      if (!inlineNumbers.has(q.number)) return true;
      if (isGapQuestion(q) || isBlankQuestionType(q.type)) return false;
      if (q.type === "MATCHING" && (q.content.options?.length ?? 0) < 2) {
        return false;
      }
      return true;
    });

    const wordListTitle =
      notesBank && optionBankUsesWordGrid(notesBank)
        ? group.instructions.find((line) =>
            /^list of (options|words)$/i.test(line.trim()),
          )
        : undefined;
    const romanHeadingBank = restQs.some((q) => {
      const options = q.content.options ?? [];
      return (
        options.length >= 3 &&
        options.every((opt) =>
          /^(?:xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)$/i.test(opt.label.trim()),
        )
      );
    });
    const headingListTitle = romanHeadingBank
      ? group.instructions.find((line) => /^list of headings$/i.test(line.trim()))
      : undefined;

    return (
      <section
        key={`${group.start}-${group.end}-${group.header}`}
        className="space-y-4 border-b border-zinc-200 pb-5 last:border-0 last:pb-0"
      >
        <div className="space-y-1">
          <h3 className="break-words border-b-2 border-[#1a3a6b] pb-1 text-base font-bold text-[#1a3a6b]">
            {group.header}
          </h3>
          {group.instructions
            .filter((line) => line !== wordListTitle && line !== headingListTitle)
            .map((line) => (
            <p
              key={line}
              className="break-words text-base font-bold leading-relaxed text-zinc-900"
            >
              {line}
            </p>
          ))}
        </div>
        <ListeningFigures
          part={part}
          range={{ start: group.start, end: group.end }}
          className="space-y-3"
        />
        {notesText ? (
          inlineNumbers.size > 0 ? (
            <InlineNotesGaps
              notes={notesText}
              answers={answers}
              currentNumber={currentNumber}
              questionRefs={questionRefs}
              onFocusQuestion={onFocusQuestion}
              onChange={onChange}
              placeholder={t("answerPlaceholder", "Enter answer…")}
              allowNumbers={inlineNumbers}
              choiceOptions={notesChoices.size > 0 ? notesChoices : undefined}
              tableLayout={qs.find((question) => question.content.tableLayout)?.content.tableLayout}
              layoutVariant={completionLayoutVariant}
              readOnlyPlaceholders
            />
          ) : (
            <BoxedContent text={notesText} />
          )
        ) : null}
        {notesBank && !optionBankIsLetterOnly(notesBank) ? (
          <OptionBank options={notesBank} title={wordListTitle} />
        ) : null}
        {restQs.length > 0 ? (
          <div className="space-y-5">
            {renderQuestionBlocks(restQs, headingListTitle)}
          </div>
        ) : null}
      </section>
    );
  };

  const questionsPanel = (
    <div className="space-y-6 p-3 sm:p-4">
      {groups.length > 0 ? (
        <>
          {groups.map(renderGroup)}
          {ungrouped.length > 0 ? (
            <div className="space-y-5">{renderQuestionBlocks(ungrouped)}</div>
          ) : null}
        </>
      ) : (
        questions.filter((q) => !isPairedSatellite(q.content)).length > 0
          ? renderQuestionBlocks(
              questions.filter((q) => !isPairedSatellite(q.content)),
            )
          : null
      )}
    </div>
  );

  const answerSheet = (
    <AnswerSheet
      questions={sidebarQuestions}
      answers={answers}
      currentNumber={currentNumber}
      questionRefs={questionRefs}
      onFocusQuestion={onFocusQuestion}
      onChange={onChange}
      paneHeight={isReading ? "reading" : "listening"}
    />
  );

  if (!isReading) {
    return (
      <div className="cdi-split mx-auto grid w-full max-w-[1504px] min-h-0 min-w-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-stretch">
        <div
          data-pane="prompt"
          className="cdi-pane min-w-0 border border-zinc-400/70 bg-white lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto"
        >
          <div className="sticky top-0 z-[2] border-b border-zinc-300 bg-[#eceff2] px-3 py-2 text-xs font-semibold text-zinc-800">
            {part.title}
          </div>
          <ListeningFigures
            part={part}
            unscopedOnly={groups.length > 0}
            className="space-y-3 px-3 pt-3 sm:px-4"
          />
          {questionsPanel}
        </div>
        {answerSheet}
      </div>
    );
  }

  const hasPassage = leftBody.trim().length > 0;
  // lg: passage + questions share one scrolling column; xl: three columns.
  return (
    <div className="cdi-split grid min-h-0 min-w-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-stretch xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_22rem]">
      <div className="min-w-0 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto xl:contents">
        {hasPassage ? (
          <div
            data-pane="passage"
            className="cdi-pane min-w-0 border border-zinc-400/70 bg-[#f7f8fa] xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto"
          >
            <div className="sticky top-0 z-[1] border-b border-zinc-300 bg-[#eceff2] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-700">
              {t("passage", "Passage")}
            </div>
            <div className="break-words px-3 py-3 text-sm leading-relaxed text-zinc-800 sm:px-4">
              <HighlightablePassage
                text={leftBody}
                partOrder={part.order}
                highlights={highlights}
                onChange={onHighlightsChange ?? (() => undefined)}
              />
            </div>
          </div>
        ) : null}
        <div
          data-pane="prompt"
          className={`cdi-pane min-w-0 border border-zinc-400/70 bg-white xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto ${
            hasPassage ? "border-t-0 xl:border-l-0 xl:border-t" : ""
          }`}
        >
          <div className="sticky top-0 z-[1] border-b border-zinc-300 bg-[#eceff2] px-3 py-2 text-xs font-semibold text-zinc-800">
            {part.title}
          </div>
          {questionsPanel}
        </div>
      </div>
      {answerSheet}
    </div>
  );
}

/** The only place a Listening / Reading answer is entered: one control per question. */
function AnswerSheet({
  questions,
  answers,
  currentNumber,
  questionRefs,
  onFocusQuestion,
  onChange,
  paneHeight,
}: {
  questions: Question[];
  answers: Record<string, string>;
  currentNumber: number | null;
  questionRefs: MutableRefObject<Map<number, HTMLElement>>;
  onFocusQuestion: (n: number) => void;
  onChange: (n: number, v: string) => void;
  paneHeight: "listening" | "reading";
}) {
  const { t } = useTranslations("practice");
  const bindRef = (n: number) => (el: HTMLElement | null) => {
    if (el) questionRefs.current.set(n, el);
    else questionRefs.current.delete(n);
  };
  const controlClass = (n: number) =>
    currentNumber === n
      ? "border-[#1a3a6b] ring-1 ring-[#1a3a6b]/40"
      : "border-zinc-400 focus:border-[#1a3a6b]";
  return (
    <div
      data-pane="answers"
      className={`cdi-pane min-w-0 border border-t-0 border-zinc-400/70 bg-[#f7f8fa] lg:overflow-y-auto lg:border-l-0 lg:border-t ${
        paneHeight === "listening"
          ? "lg:max-h-[calc(100vh-14rem)]"
          : "lg:max-h-[calc(100vh-11rem)]"
      }`}
    >
      <div className="sticky top-0 z-[2] border-b border-zinc-300 bg-[#eceff2] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-700">
        {t("answers", "Answers")}
      </div>
      <div className="space-y-5 p-4 sm:p-6">
        {questions.map((question) => {
          const figureLabel = listeningFigureAnswerLabel(
            question,
            paneHeight === "listening" ? "LISTENING" : "READING",
          );
          return (
            <label
              key={question.number}
              className={
                figureLabel
                  ? "grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_6rem] items-center gap-3"
                  : "flex items-center gap-3"
              }
            >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[#1a3a6b]">
              {question.number}
            </span>
            {figureLabel ? (
              <span className="min-w-0 break-words text-sm font-medium leading-snug text-zinc-800">
                {figureLabel}
              </span>
            ) : null}
            {(question.content.options?.length ?? 0) >= 2 ? (
              <select
                ref={bindRef(question.number)}
                data-q={question.number}
                value={answers[String(question.number)] ?? ""}
                onChange={(event) => onChange(question.number, event.target.value)}
                onFocus={() => onFocusQuestion(question.number)}
                aria-label={t("chooseAnswerFor", { n: question.number }, "Answer {n}")}
                className={`h-10 max-w-full rounded-sm border bg-white px-3 text-sm font-semibold outline-none ${
                  figureLabel ? "w-24" : "w-72"
                } ${controlClass(question.number)}`}
              >
                <option value="">{t("chooseAnswer", "Choose")}</option>
                {question.content.options?.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                ref={bindRef(question.number)}
                data-q={question.number}
                type="text"
                value={answers[String(question.number)] ?? ""}
                onChange={(event) => onChange(question.number, event.target.value)}
                onFocus={() => onFocusQuestion(question.number)}
                placeholder={t("answerPlaceholder", "Enter answer…")}
                aria-label={`${t("answerPlaceholder", "Enter answer…")} ${question.number}`}
                className={`h-10 w-72 max-w-full rounded-sm border bg-white px-3 text-sm outline-none ${controlClass(question.number)}`}
              />
            )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

type ListeningFigure = { src: string; from: number | null; to: number | null };

/** One image per URL. The caption range is the questions that use that image. */
function listeningFigures(part: Part): ListeningFigure[] {
  const order: string[] = [];
  const numbers = new Map<string, number[]>();
  const add = (value: unknown, questionNumber?: number) => {
    if (typeof value !== "string") return;
    const url = value.trim();
    if (!url || /\.(mp3|m4a|wav|ogg)(\?|$)/i.test(url)) return;
    if (!numbers.has(url)) {
      order.push(url);
      numbers.set(url, []);
    }
    if (questionNumber != null) numbers.get(url)!.push(questionNumber);
  };
  for (const question of part.questions) {
    add(question.content.imageUrl, question.number);
    if (question.mediaUrl !== question.content.imageUrl) {
      add(question.mediaUrl, question.number);
    }
  }
  add(part.meta?.imageUrl);
  const many = part.meta?.imageUrls;
  if (Array.isArray(many)) {
    for (const item of many) add(item);
  }
  return order.map((src) => {
    const nums = [...new Set(numbers.get(src) ?? [])].sort((a, b) => a - b);
    return {
      src,
      from: nums[0] ?? null,
      to: nums[nums.length - 1] ?? null,
    };
  });
}

function ListeningFigures({
  part,
  className,
  range,
  unscopedOnly = false,
}: {
  part: Part;
  className: string;
  /** Only figures used by questions inside this range (Reading question groups). */
  range?: { start: number; end: number };
  /** Section-level fallback images whose question range cannot be determined. */
  unscopedOnly?: boolean;
}) {
  const { t } = useTranslations("practice");
  const figures = listeningFigures(part).filter(
    (fig) =>
      unscopedOnly
        ? fig.from == null || fig.to == null
        : !range ||
          (fig.from != null &&
            fig.to != null &&
            fig.from >= range.start &&
            fig.to <= range.end),
  );
  if (figures.length === 0) return null;
  return (
    <div className={className}>
      {figures.map((fig) => {
        const caption =
          fig.from == null || fig.to == null
            ? t("sectionFigure", "Figure")
            : fig.from === fig.to
              ? t("figureQuestion", { from: fig.from }, "Question {from}")
              : t(
                  "figureQuestions",
                  { from: fig.from, to: fig.to },
                  "Questions {from}–{to}",
                );
        return (
          <figure
            key={fig.src}
            className="overflow-hidden rounded-sm border-2 border-zinc-500 bg-white"
          >
            <div className="border-b border-zinc-300 bg-[#eceff2] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-zinc-600">
              {caption}
            </div>
            <ZoomableFigure src={fig.src} alt={caption} />
          </figure>
        );
      })}
    </div>
  );
}

function ZoomableFigure({ src, alt }: { src: string; alt: string }) {
  const { t } = useTranslations("practice");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("enlargeFigure", "Enlarge figure")}
        className="group relative block w-full cursor-zoom-in bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a3a6b]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="mx-auto h-auto max-h-[min(42rem,60dvh)] w-auto max-w-full object-contain bg-white"
        />
        <span className="absolute bottom-2 right-2 rounded-sm bg-zinc-950/75 px-2 py-1 text-[11px] font-semibold text-white opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
          {t("tapToEnlarge", "Tap to enlarge")}
        </span>
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-3 sm:p-6"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 rounded-sm border border-white/70 bg-black/70 px-3 py-2 text-sm font-bold text-white hover:bg-black sm:right-6 sm:top-6"
          >
            {t("closeFigure", "Close")}
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[calc(100dvh-2rem)] max-w-full object-contain sm:max-h-[calc(100dvh-3rem)]"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}

/** Drop "18 ……" lines that only exist as slots for a multiple-choice group. */
function stripOwnedBlankLines(notes: string, owned: Set<number>): string {
  if (!notes.trim() || owned.size === 0) return notes;
  return notes
    .split("\n")
    .filter((line) => {
      const match = line
        .trim()
        .match(/^(\d{1,2})\s*(?:[.…_\u2026]{2,}|\.{2,})\s*$/u);
      return !(match && owned.has(Number(match[1])));
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function defaultMinWords(question: Question, skill: string): number {
  if (typeof question.content.minWords === "number") return question.content.minWords;
  if (question.type !== "ESSAY" && skill !== "WRITING") return 0;
  return question.number === 1 ? 150 : 250;
}

export function QuestionInput({
  question,
  skill,
  answers,
  onChange,
  onPatchAnswers,
  compactStem = false,
  active = false,
  readOnly = false,
}: {
  question: Question;
  skill: string;
  answers: Record<string, string>;
  onChange: (v: string) => void;
  onPatchAnswers?: (
    patch: Record<string, string>,
    focusNumber: number,
  ) => void;
  /**
   * Render contract: shared notes with numbered gaps stay in the notes pane
   * (number + input only here). A sentence-completion stem ("… _______ …")
   * is shown once, with the input in the blank — never also as static notes.
   * See scripts/test-sentence-gap-layout.ts.
   */
  compactStem?: boolean;
  /** Highlight the answer control (not an outer wrapper frame). */
  active?: boolean;
  /**
   * Prompt pane: the answer is entered in the ANSWERS column, so show options
   * as text and gaps as "N ______" — never an input, radio or checkbox here.
   */
  readOnly?: boolean;
}) {
  const { t } = useTranslations("practice");
  const options = question.content.options ?? [];
  const rawStem = question.content.stem ?? "";
  const stem = formatQuestionStem(rawStem, question.number);
  const isEssay = question.type === "ESSAY";
  const isSpeaking = question.type === "SPEAKING_PROMPT";
  const isBlank = isBlankQuestionType(question.type);
  const multi =
    isMultiSelectQuestion(question.content) &&
    getSelectCount(question.content) >= 2;
  const covers = multi
    ? getCoveredNumbers(question.number, question.content)
    : [question.number];
  const selectCount = multi ? getSelectCount(question.content) : 1;
  const selectedLetters = multi
    ? readMultiSelectAnswers(covers, answers)
    : [];
  const value = answers[String(question.number)] ?? "";
  const numberLabel = multi
    ? formatCoveredLabel(covers)
    : String(question.number);
  const minWords = defaultMinWords(question, skill);
  const words = countWords(value);
  const hint = question.content.hint;
  const hideBesideNotes = shouldHideStemBesideNotes({
    compactStem,
    questionType: question.type,
    stem: rawStem,
    optionCount: options.length,
  });
  const showStem = Boolean(stem) && !hideBesideNotes;
  const letterOnlyOptions = options.every(
    (opt) => !opt.text.trim() || opt.text.trim() === opt.label.trim(),
  );
  const gapParts = showStem ? stem.split(/_____/) : [];
  const inlineGap = gapParts.length === 2 && options.length < 2 && isBlank;
  const inputActiveClass = active
    ? "border-[#1a3a6b] ring-1 ring-[#1a3a6b]/40"
    : "border-zinc-400 focus:border-[#1a3a6b]";

  if (isEssay) {
    const ok = minWords > 0 && words >= minWords;
    return (
      <div className="min-w-0 border-b border-zinc-200 pb-5 last:border-0 last:pb-0">
        <p className="mb-2 text-sm font-medium text-zinc-900">
          <span className="mr-2 font-semibold tabular-nums text-zinc-800">
            {question.number}.
          </span>
          {t("writingTask", "Writing task")}
        </p>
        {stem && (
          <div className="mb-3 break-words whitespace-pre-wrap border border-zinc-300 border-l-[3px] border-l-[#1a3a6b] bg-[#f7f8fa] px-3 py-3 text-base font-bold leading-relaxed text-zinc-900">
            {renderRichText(stem, `stem-${question.number}`)}
          </div>
        )}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={14}
          placeholder={t("writingPlaceholder", "Write your essay…")}
          className={`w-full min-w-0 rounded-sm border bg-white px-3 py-2 text-sm leading-relaxed outline-none ${inputActiveClass}`}
        />
        <p
          className={`mt-2 text-xs font-medium ${
            ok
              ? "text-zinc-800"
              : minWords > 0 && words > 0
                ? "text-amber-800"
                : "text-zinc-500"
          }`}
        >
          {t("wordCount", {
            count: words,
            min: minWords || 0,
          }, "{count} words · minimum {min}")}
        </p>
      </div>
    );
  }

  if (isSpeaking) {
    const practiced = value.trim().length > 0;
    return (
      <div className="min-w-0 border-b border-zinc-200 pb-5 last:border-0 last:pb-0">
        <p className="mb-2 flex min-w-0 items-center gap-2 text-sm font-medium text-zinc-900">
          <span className="font-semibold tabular-nums text-zinc-800">
            {question.number}.
          </span>
          <span>{t("speakingQuestion", "Câu hỏi nói")}</span>
        </p>
        {stem ? (
          <div className="mb-3 break-words whitespace-pre-wrap border border-zinc-300 border-l-[3px] border-l-[#1a3a6b] bg-[#f7f8fa] px-3 py-3 text-sm leading-relaxed text-zinc-800">
            {renderRichText(stem, `stem-${question.number}`)}
          </div>
        ) : (
          <p className="mb-3 text-sm text-zinc-500">
            {t(
              "speakingEmptyStem",
              "Chưa có nội dung đề nói cho câu này — xem phần chủ đề phía trên nếu có.",
            )}
          </p>
        )}
        {hint ? (
          <details className="mb-3 border border-dashed border-zinc-400 bg-[#f7f8fa] px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium text-zinc-800">
              {t("sampleHint", "Tips / sample (if any)")}
            </summary>
            <p className="mt-2 break-words whitespace-pre-wrap text-zinc-600">
              {hint}
            </p>
          </details>
        ) : null}
        <p className="mb-3 text-sm text-zinc-600">
          {t(
            "speakingInstruction",
            "Đọc đề rồi tự nói to. Hiện chưa ghi âm / chấm AI.",
          )}
        </p>
        <button
          type="button"
          onClick={() =>
            onChange(practiced ? "" : t("speakingPracticedMark", "Đã luyện"))
          }
          className={`inline-flex items-center rounded-sm border px-3 py-2 text-sm font-semibold transition ${
            practiced
              ? "border-[#1a3a6b] bg-[#1a3a6b] text-white"
              : "border-zinc-400 bg-white text-zinc-800 hover:bg-zinc-50"
          }`}
          aria-pressed={practiced}
        >
          {practiced
            ? t("speakingPracticed", "Đã luyện ✓")
            : t("speakingMarkPracticed", "Đánh dấu đã luyện")}
        </button>
      </div>
    );
  }

  if (inlineGap) {
    const before = gapParts[0]!.trim();
    const after = gapParts[1]!.trim();
    return (
      <div className="min-w-0 border-b border-zinc-200 pb-5 last:border-0 last:pb-0">
        <p className="min-w-0 break-words text-sm leading-8 text-zinc-700">
          <span className="font-semibold tabular-nums text-zinc-800">
            {numberLabel}.
          </span>
          {before ? <> {renderRichText(before, `before-${question.number}`)}</> : null}{" "}
          {readOnly ? (
            <GapMark />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={t("answerPlaceholder", "Enter answer…")}
              aria-label={`${t("answerPlaceholder", "Enter answer…")} ${numberLabel}`}
              className={`mx-0.5 inline-block w-[min(100%,11rem)] min-w-[5.5rem] align-middle rounded-sm border bg-white px-2 py-1 text-sm outline-none ${inputActiveClass}`}
            />
          )}
          {after ? <> {renderRichText(after, `after-${question.number}`)}</> : null}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 border-b border-zinc-200 pb-5 last:border-0 last:pb-0">
      {showStem ? (
        <p className="mb-2 min-w-0 break-words whitespace-pre-wrap text-sm text-zinc-700">
          <span className="mr-1.5 font-semibold tabular-nums text-zinc-800">
            {numberLabel}.
          </span>
          {renderRichText(stem, `stem-${question.number}`)}
        </p>
      ) : null}

      {options.length >= 2 && readOnly && letterOnlyOptions ? (
        showStem ? null : (
          <p className="text-sm font-semibold tabular-nums text-zinc-800">
            {numberLabel}.
          </p>
        )
      ) : options.length >= 2 ? (
        <div className="space-y-2">
          {!showStem ? (
            <p className="text-sm font-semibold tabular-nums text-zinc-800">
              {numberLabel}.
            </p>
          ) : null}
          {options.map((opt) => {
            const label = opt.label.trim();
            const text = opt.text.trim();
            const same =
              label.localeCompare(text, undefined, { sensitivity: "accent" }) ===
              0;
            const optionText = same ? (
              text
            ) : (
              <>
                <strong className="mr-1">{label}.</strong>
                {text}
              </>
            );
            if (readOnly) {
              return (
                <p
                  key={opt.label}
                  className="min-w-0 break-words border border-zinc-200 px-3 py-2 text-sm text-zinc-800"
                >
                  {optionText}
                </p>
              );
            }
            const selected = multi
              ? selectedLetters.some(
                  (s) =>
                    s.localeCompare(label, undefined, {
                      sensitivity: "accent",
                    }) === 0,
                )
              : value === opt.label;
            return (
              <label
                key={opt.label}
                className={`flex min-w-0 cursor-pointer items-start gap-2 border px-3 py-2 text-sm ${
                  selected
                    ? "border-[#1a3a6b] bg-[#eef2f7]"
                    : "border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <input
                  type={multi ? "checkbox" : "radio"}
                  name={
                    multi
                      ? `q-multi-${covers.join("-")}`
                      : `q-${question.number}`
                  }
                  className="mt-0.5 shrink-0"
                  checked={selected}
                  onChange={() => {
                    if (multi && onPatchAnswers) {
                      const next = toggleMultiSelectAnswer(
                        covers,
                        label,
                        answers,
                        selectCount,
                      );
                      onPatchAnswers(next, question.number);
                    } else {
                      onChange(opt.label);
                    }
                  }}
                />
                <span className="min-w-0 break-words">{optionText}</span>
              </label>
            );
          })}
        </div>
      ) : readOnly ? (
        showStem || hideBesideNotes ? null : (
          <p className="text-sm text-zinc-700">
            <span className="font-semibold tabular-nums text-zinc-800">
              {numberLabel}
            </span>
            <GapMark />
          </p>
        )
      ) : (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {!showStem ? (
            <span className="font-semibold tabular-nums text-zinc-800">
              {numberLabel}.
            </span>
          ) : null}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("answerPlaceholder", "Enter answer…")}
            aria-label={`${t("answerPlaceholder", "Enter answer…")} ${numberLabel}`}
            className={`w-full max-w-md min-w-0 rounded-sm border bg-white px-3 py-2 text-sm outline-none ${inputActiveClass}`}
          />
        </div>
      )}
    </div>
  );
}

/** Printed answer position in the prompt pane ("N ______"); answers go in the ANSWERS column. */
function GapMark() {
  return (
    <span
      aria-hidden="true"
      className="mx-1 inline-block w-24 min-w-[4.5rem] border-b border-zinc-700 align-baseline"
    />
  );
}
