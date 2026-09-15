"use client";

import { Fragment, useMemo, type MutableRefObject, type ReactNode } from "react";
import { detectNotesTable, type NotesTable } from "@/lib/practice/notes-table";

/** Match "7 ............", "9……….", "13.……….", "7 $ ......", "11 ___" */
const INLINE_BLANK_RE =
  /(\d{1,2})\s*(?:[$€£]\s*)?(?:(?:[.…_…]|\.){2,}|_{2,}|\u2026+)/gu;

export function findInlineBlankNumbers(notes: string): number[] {
  const found = new Set<number>();
  const re = new RegExp(INLINE_BLANK_RE.source, "gu");
  let m: RegExpExecArray | null;
  while ((m = re.exec(notes)) !== null) {
    const n = Number(m[1]);
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
      number: Number(m[1]),
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
          nodes.push(
            <Fragment key={`${keyPrefix}-t-${i}-${pi}`}>{part}</Fragment>,
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
    nodes.push(
      <Fragment key={`${keyPrefix}-b-${seg.number}-${i}`}>
        <span className="mx-0.5 font-semibold tabular-nums text-zinc-800">
          {seg.number}
        </span>
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
          placeholder={bindings.placeholder}
          aria-label={`${bindings.placeholder} ${seg.number}`}
          className={`inline-block w-[min(100%,8.5rem)] min-w-[4.5rem] align-baseline rounded-sm border bg-white px-1.5 py-0.5 text-sm leading-snug text-zinc-900 outline-none ${
            active
              ? "border-[#1a3a6b] ring-1 ring-[#1a3a6b]/40"
              : "border-zinc-400 focus:border-[#1a3a6b]"
          }`}
        />
      </Fragment>,
    );
  }
  return nodes;
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

export function InlineNotesGaps({
  notes,
  answers,
  currentNumber,
  questionRefs,
  onFocusQuestion,
  onChange,
  placeholder,
  allowNumbers,
}: {
  notes: string;
  answers: Record<string, string>;
  currentNumber: number | null;
  questionRefs: MutableRefObject<Map<number, HTMLElement>>;
  onFocusQuestion: (n: number) => void;
  onChange: (n: number, v: string) => void;
  placeholder: string;
  allowNumbers?: Set<number>;
}) {
  const bindings: GapBindings = {
    answers,
    currentNumber,
    questionRefs,
    onFocusQuestion,
    onChange,
    placeholder,
    allowNumbers,
  };

  const table = useMemo(() => detectNotesTable(notes), [notes]);

  if (table) {
    return <NotesTableView table={table} bindings={bindings} />;
  }

  return (
    <div className="break-words rounded-sm border border-zinc-200 bg-[#f7f8fa] px-3 py-3 text-sm leading-relaxed whitespace-pre-wrap text-zinc-800">
      {renderInlineSegments(notes, "n", bindings)}
    </div>
  );
}
