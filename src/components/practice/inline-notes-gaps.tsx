"use client";

import { Fragment, useMemo, type MutableRefObject, type ReactNode } from "react";
import { BoxedContent, OutlineNotesBody } from "@/components/practice/boxed-content";
import { splitBoxedSegments } from "@/lib/practice/boxed-text";
import {
  isBoldNotesLine,
  isBowChartNotes,
  isFlowchartNotes,
  notesLookLikeOutline,
  OUTLINE_BOX_CLASS,
} from "@/lib/practice/notes-outline";
import {
  dropdownChoiceLabel,
  type ChoiceOption,
} from "@/lib/practice/shared-choice";
import { useTranslations } from "@/i18n/provider";
import {
  detectNotesTable,
  unwrapSingleColumnMarkdownNotes,
  type NotesTable,
} from "@/lib/practice/notes-table";

/**
 * Dotted gaps: "7 ............", "9……….", "7 $ ......", "11 ___".
 * Space gaps that lost their dots must sit mid-line ("her 9  and"),
 * not a numbered stem ("1  The name…").
 */
const INLINE_BLANK_RE =
  /(?:(?<!\d)(\d{1,2})\s*(?:[$€£]\s*)?(?:(?:[.…_…]|\.){2,}|_{2,}|\u2026+)|(?<=\S\s)(\d{1,2})\s+(?=\s[A-Za-z]))/gu;

function blankNumber(match: RegExpExecArray): number {
  return Number(match[1] ?? match[2]);
}

export function findInlineBlankNumbers(notes: string): number[] {
  const found = new Set<number>();
  const source = unwrapSingleColumnMarkdownNotes(notes);
  const re = new RegExp(INLINE_BLANK_RE.source, "gu");
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const n = blankNumber(m);
    if (Number.isInteger(n) && n >= 1 && n <= 60) found.add(n);
  }
  return [...found].sort((a, b) => a - b);
}

type Segment =
  | { kind: "text"; value: string }
  | { kind: "blank"; number: number; raw: string };

function splitNotes(notes: string): Segment[] {
  const segments: Segment[] = [];
  const re = new RegExp(INLINE_BLANK_RE.source, "gu");
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(notes)) !== null) {
    if (m.index > last) {
      segments.push({ kind: "text", value: notes.slice(last, m.index) });
    }
    segments.push({
      kind: "blank",
      number: blankNumber(m),
      raw: m[0],
    });
    last = m.index + m[0].length;
  }
  if (last < notes.length) {
    segments.push({ kind: "text", value: notes.slice(last) });
  }
  return segments;
}

type GapBindings = {
  answers: Record<string, string>;
  currentNumber: number | null;
  questionRefs: MutableRefObject<Map<number, HTMLElement>>;
  onFocusQuestion: (n: number) => void;
  onChange: (n: number, v: string) => void;
  placeholder: string;
  allowNumbers?: Set<number>;
  choiceOptions?: Map<number, ChoiceOption[]>;
  /** Flowchart steps stay plain. Section labels in outline notes stay bold. */
  plainText?: boolean;
  /** Bow-chart boxes are narrow, so the answer field stays small. */
  narrowInput?: boolean;
};

function renderInlineSegments(
  text: string,
  keyPrefix: string,
  bindings: GapBindings,
): ReactNode[] {
  const segments = splitNotes(text);
  const nodes: ReactNode[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    if (seg.kind === "text") {
      // Support <br> from reconstructed table cells
      const parts = seg.value.split(/<br\s*\/?>/i);
      parts.forEach((part, pi) => {
        if (pi > 0) nodes.push(<br key={`${keyPrefix}-br-${i}-${pi}`} />);
        if (part) {
          const next = segments[i + 1];
          nodes.push(
            <Fragment key={`${keyPrefix}-t-${i}-${pi}`}>
              {renderNotesText(
                part,
                `${keyPrefix}-t-${i}-${pi}`,
                next?.kind === "blank",
                Boolean(bindings.plainText),
              )}
            </Fragment>,
          );
        }
      });
      continue;
    }
    if (bindings.allowNumbers && !bindings.allowNumbers.has(seg.number)) {
      nodes.push(
        <Fragment key={`${keyPrefix}-skip-${i}`}>{seg.raw}</Fragment>,
      );
      continue;
    }
    const active = bindings.currentNumber === seg.number;
    const choices = bindings.choiceOptions?.get(seg.number);
    nodes.push(
      <span
        key={`${keyPrefix}-b-${seg.number}-${i}`}
        className="mx-0.5 inline-flex max-w-full items-baseline align-baseline"
      >
        <span className="mr-1 font-semibold tabular-nums text-zinc-800">
          {seg.number}
        </span>
        {choices && choices.length >= 2 ? (
          <InlineChoiceSelect
            number={seg.number}
            options={choices}
            value={bindings.answers[String(seg.number)] ?? ""}
            active={active}
            onChange={(value) => bindings.onChange(seg.number, value)}
            onFocus={() => bindings.onFocusQuestion(seg.number)}
            inputRef={(el) => {
              if (el) bindings.questionRefs.current.set(seg.number, el);
              else bindings.questionRefs.current.delete(seg.number);
            }}
          />
        ) : (
        <input
          ref={(el) => {
            if (el) bindings.questionRefs.current.set(seg.number, el);
            else bindings.questionRefs.current.delete(seg.number);
          }}
          data-q={seg.number}
          type="text"
          value={bindings.answers[String(seg.number)] ?? ""}
          onChange={(e) => bindings.onChange(seg.number, e.target.value)}
          onFocus={() => bindings.onFocusQuestion(seg.number)}
          placeholder={bindings.narrowInput ? "……" : bindings.placeholder}
          aria-label={`${bindings.placeholder} ${seg.number}`}
          className={`inline-block max-w-full rounded-sm border bg-white px-1 py-0.5 text-sm leading-snug text-zinc-900 outline-none ${
            bindings.narrowInput
              ? "w-[8.25rem] max-w-full shrink-0 text-xs"
              : bindings.plainText
                ? "w-24 min-w-[3.5rem]"
                : "w-[6.75rem] min-w-[4.5rem]"
          } ${
            active
              ? "border-[#1a3a6b] ring-1 ring-[#1a3a6b]/40"
              : "border-zinc-400 focus:border-[#1a3a6b]"
          }`}
        />
        )}
      </span>,
    );
  }
  return nodes;
}

function renderNotesText(
  part: string,
  key: string,
  brokenByBlank: boolean,
  plain: boolean,
): ReactNode[] {
  const lines = part.split("\n");
  let lastContent = -1;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (lines[i]!.trim()) {
      lastContent = i;
      break;
    }
  }
  return lines.map((line, index) => (
    <Fragment key={`${key}-l-${index}`}>
      {index > 0 ? "\n" : null}
      {isBoldNotesLine(line, plain || (brokenByBlank && index === lastContent)) ? (
        <strong className="font-bold text-zinc-900">{line}</strong>
      ) : (
        line
      )}
    </Fragment>
  ));
}

function InlineChoiceSelect({
  number,
  options,
  value,
  active,
  onChange,
  onFocus,
  inputRef,
}: {
  number: number;
  options: ChoiceOption[];
  value: string;
  active: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  inputRef: (el: HTMLSelectElement | null) => void;
}) {
  const { t } = useTranslations("practice");
  return (
    <select
      ref={inputRef}
      data-q={number}
      value={options.some((opt) => opt.label === value) ? value : ""}
      aria-label={t("chooseAnswerFor", { n: number }, "Đáp án câu {n}")}
      onFocus={onFocus}
      onChange={(e) => onChange(e.target.value)}
      className={`mx-0.5 inline-block w-[4.75rem] align-baseline rounded-sm border bg-white px-1 py-0.5 text-sm font-semibold text-zinc-900 outline-none ${
        active
          ? "border-[#1a3a6b] ring-1 ring-[#1a3a6b]/40"
          : "border-zinc-400 focus:border-[#1a3a6b]"
      }`}
    >
      <option value="">{t("chooseAnswer", "Chọn")}</option>
      {options.map((opt) => (
        <option key={opt.label} value={opt.label}>
          {dropdownChoiceLabel(opt)}
        </option>
      ))}
    </select>
  );
}

function NotesTableView({
  table,
  bindings,
}: {
  table: NotesTable;
  bindings: GapBindings;
}) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-sm border border-zinc-300 bg-white">
      {table.title ? (
        <p className="border-b border-zinc-200 bg-[#f7f8fa] px-3 py-2 text-center text-sm font-semibold italic text-zinc-800">
          {table.title}
        </p>
      ) : null}
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm text-zinc-800">
        <thead>
          <tr className="bg-[#eceff2]">
            {table.headers.map((h) => (
              <th
                key={h}
                className="border border-zinc-300 px-2 py-2 text-xs font-bold uppercase tracking-wide text-zinc-700"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={`r-${ri}`} className="align-top">
              {row.map((cell, ci) => (
                <td
                  key={`c-${ri}-${ci}`}
                  className={`border border-zinc-300 px-2 py-2 leading-relaxed ${
                    ci === 0 ? "whitespace-nowrap font-semibold" : ""
                  }`}
                >
                  {renderInlineSegments(cell, `r${ri}c${ci}`, bindings)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const BOW_BOX =
  "border-[3px] border-zinc-900 bg-white px-2.5 py-2 text-sm leading-snug text-zinc-900";

function ThickArrow({ dir }: { dir: "right" | "left" | "down" }) {
  if (dir === "down") {
    return (
      <svg viewBox="0 0 14 36" className="h-7 w-3.5" aria-hidden>
        <polygon points="3,0 11,0 11,22 14,22 7,36 0,22 3,22" fill="#18181b" />
      </svg>
    );
  }
  const points =
    dir === "left"
      ? "36,3 14,3 14,0 0,7 14,14 14,11 36,11"
      : "0,3 22,3 22,0 36,7 22,14 22,11 0,11";
  return (
    <svg viewBox="0 0 36 14" className="h-3.5 w-7" aria-hidden>
      <polygon points={points} fill="#18181b" />
    </svg>
  );
}

/** Cycle chart: source → needs → develop ↓ processed ← description ← source. */
function BowChart({ notes, bindings }: { notes: string; bindings: GapBindings }) {
  const lines = notes
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line !== "[[bow]]" && line !== "[[/bow]]");
  const [source, find, developTitle, firstStep, secondStep, thirdStep, processed, timely] =
    lines;
  return (
    <div className="min-w-0 overflow-x-auto">
      <div className="grid w-full grid-cols-[minmax(9.25rem,0.95fr)_1.1rem_minmax(0,1fr)_1.1rem_minmax(0,1fr)] items-center gap-x-0.5 gap-y-1">
        <div
          className={`${BOW_BOX} col-start-1 row-span-3 row-start-1 flex min-h-[9.5rem] flex-col items-center justify-center gap-1 text-center`}
        >
          {renderInlineSegments(source ?? "", "bow-source", bindings)}
        </div>
        <div className="col-start-2 row-start-1 flex justify-center">
          <ThickArrow dir="right" />
        </div>
        <div className={`${BOW_BOX} col-start-3 row-start-1 text-center`}>
          {renderInlineSegments(find ?? "", "bow-find", bindings)}
        </div>
        <div className="col-start-4 row-start-1 flex justify-center">
          <ThickArrow dir="right" />
        </div>
        <div className={`${BOW_BOX} col-start-5 row-start-1 text-left`}>
          <p>{developTitle}</p>
          <p className="mt-1">{renderInlineSegments(firstStep ?? "", "bow-step", bindings)}</p>
          <p>{secondStep}</p>
          <p>{thirdStep}</p>
        </div>
        <div className="col-start-5 row-start-2 flex justify-center">
          <ThickArrow dir="down" />
        </div>
        <div className="col-start-2 row-start-3 flex justify-center">
          <ThickArrow dir="left" />
        </div>
        <div className={`${BOW_BOX} col-start-3 row-start-3 text-center`}>
          {timely}
        </div>
        <div className="col-start-4 row-start-3 flex justify-center">
          <ThickArrow dir="left" />
        </div>
        <div className={`${BOW_BOX} col-start-5 row-start-3 text-center`}>
          {renderInlineSegments(processed ?? "", "bow-processed", bindings)}
        </div>
      </div>
    </div>
  );
}

export function InlineNotesGaps({
  notes,
  answers,
  currentNumber,
  questionRefs,
  onFocusQuestion,
  onChange,
  placeholder,
  allowNumbers,
  choiceOptions,
}: {
  notes: string;
  answers: Record<string, string>;
  currentNumber: number | null;
  questionRefs: MutableRefObject<Map<number, HTMLElement>>;
  onFocusQuestion: (n: number) => void;
  onChange: (n: number, v: string) => void;
  placeholder: string;
  allowNumbers?: Set<number>;
  /** Letter dropdowns for summary blanks that share a word list. */
  choiceOptions?: Map<number, ChoiceOption[]>;
}) {
  const bindings: GapBindings = {
    answers,
    currentNumber,
    questionRefs,
    onFocusQuestion,
    onChange,
    placeholder,
    allowNumbers,
    choiceOptions,
  };

  const displayNotes = useMemo(
    () => unwrapSingleColumnMarkdownNotes(notes),
    [notes],
  );
  const segments = useMemo(
    () => splitBoxedSegments(displayNotes),
    [displayNotes],
  );
  const table = useMemo(() => detectNotesTable(displayNotes), [displayNotes]);

  if (isBowChartNotes(displayNotes)) {
    return (
      <BowChart notes={displayNotes} bindings={{ ...bindings, plainText: true, narrowInput: true }} />
    );
  }

  if (segments.some((segment) => segment.kind === "box")) {
    return (
      <BoxedContent
        text={displayNotes}
        renderText={(value, key) => {
          const inner = detectNotesTable(value);
          if (inner) {
            return <NotesTableView table={inner} bindings={bindings} />;
          }
          return renderInlineSegments(value, key, bindings);
        }}
      />
    );
  }

  if (table) {
    return <NotesTableView table={table} bindings={bindings} />;
  }

  if (isFlowchartNotes(displayNotes)) {
    const lines = displayNotes
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const title =
      lines[0] && !/^[↓⬇]$/.test(lines[0]) && !findInlineBlankNumbers(lines[0]).length
        ? lines[0]
        : null;
    const steps = title ? lines.slice(1) : lines;
    const plain: GapBindings = { ...bindings, plainText: true };
    return (
      <div className="break-words rounded-sm border border-zinc-500 bg-white px-4 py-4 text-sm leading-7 text-zinc-900">
        {title ? (
          <p className="mb-4 text-center text-sm font-bold sm:text-base">{title}</p>
        ) : null}
        {steps.map((line, index) =>
          /^[↓⬇]$/.test(line) ? (
            <p key={`arrow-${index}`} className="py-2 text-center text-lg leading-none text-zinc-800">
              ↓
            </p>
          ) : (
            <p key={`step-${index}`} className="text-center">
              {renderInlineSegments(line, `flow-${index}`, plain)}
            </p>
          ),
        )}
      </div>
    );
  }

  if (notesLookLikeOutline(displayNotes)) {
    return (
      <div className={OUTLINE_BOX_CLASS}>
        <OutlineNotesBody
          text={displayNotes}
          renderText={(value, key) => renderInlineSegments(value, key, bindings)}
        />
      </div>
    );
  }

  return (
    <div className="break-words rounded-sm border border-zinc-200 bg-[#f7f8fa] px-3 py-3 text-sm leading-relaxed whitespace-pre-wrap text-zinc-800">
      {renderInlineSegments(displayNotes, "n", bindings)}
    </div>
  );
}
