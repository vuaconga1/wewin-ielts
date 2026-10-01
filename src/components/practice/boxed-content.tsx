"use client";

import { Fragment, type ReactNode } from "react";
import { splitBoxedSegments, splitPricePieces } from "@/lib/practice/boxed-text";
import {
  classifyOutlineNotes,
  isNotesSectionLabel,
  isNotesSubheading,
  notesLookLikeOutline,
  OUTLINE_BOX_CLASS,
  OUTLINE_CENTER_CLASS,
  OUTLINE_PLAIN_CLASS,
  OUTLINE_TITLE_CLASS,
  outlineBulletRowClass,
  outlineMarkerClass,
} from "@/lib/practice/notes-outline";

const BOX_CLASS = OUTLINE_BOX_CLASS;

export function OutlineNotesBody({
  text,
  renderText,
}: {
  text: string;
  renderText: (value: string, key: string) => ReactNode;
}) {
  const lines = classifyOutlineNotes(text);
  return (
    <div className="space-y-1.5">
      {lines.map((line, index) => {
        if (line.kind === "skip") return null;
        if (line.kind === "blank") {
          return <div key={`sp-${index}`} className="h-2" aria-hidden />;
        }
        if (line.kind === "title") {
          return (
            <p key={`ti-${index}`} className={OUTLINE_TITLE_CLASS}>
              {renderText(line.text, `ti-${index}`)}
            </p>
          );
        }
        if (line.kind === "center") {
          return (
            <p key={`ce-${index}`} className={OUTLINE_CENTER_CLASS}>
              {renderText(line.text, `ce-${index}`)}
            </p>
          );
        }
        if (line.kind === "bullet") {
          return (
            <div key={`bu-${index}`} className={outlineBulletRowClass(line.level)}>
              <span className={outlineMarkerClass(line.marker)} aria-hidden>
                {line.marker === "dash" ? "-" : line.marker === "plus" ? "+" : null}
              </span>
              <div className="min-w-0 flex-1 break-words">
                {renderText(line.text, `bu-${index}`)}
              </div>
            </div>
          );
        }
        return (
          <p
            key={`pl-${index}`}
            className={
              isNotesSubheading(line.text) || isNotesSectionLabel(line.text)
                ? `${OUTLINE_PLAIN_CLASS} font-bold text-zinc-900`
                : OUTLINE_PLAIN_CLASS
            }
          >
            {renderText(line.text, `pl-${index}`)}
          </p>
        );
      })}
    </div>
  );
}

function BoxBody({
  value,
  renderText,
}: {
  value: string;
  renderText: (value: string, key: string) => ReactNode;
}) {
  const pieces = splitPricePieces(value);
  if (
    pieces.length === 1 &&
    pieces[0]?.kind === "text" &&
    notesLookLikeOutline(pieces[0].value)
  ) {
    return <OutlineNotesBody text={pieces[0].value} renderText={renderText} />;
  }
  let titled = false;
  return (
    <div className="space-y-2">
      {pieces.map((piece, index) => {
        if (piece.kind === "price") {
          return (
            <div key={`price-${index}`} className="flex justify-end">
              <span className="inline-block border border-zinc-600 px-2 py-1 text-sm font-bold text-zinc-900">
                {piece.value}
              </span>
            </div>
          );
        }
        const lines = piece.value.replace(/^\n+|\n+$/g, "").split("\n");
        return (
          <div key={`text-${index}`} className="whitespace-pre-wrap">
            {lines.map((line, lineIndex) => {
              const bold = !titled && line.trim().length > 0;
              if (bold) titled = true;
              return (
                <Fragment key={`line-${index}-${lineIndex}`}>
                  {lineIndex > 0 ? "\n" : null}
                  {bold ? (
                    <span className="font-semibold text-zinc-900">{line}</span>
                  ) : (
                    renderText(line, `b-${index}-${lineIndex}`)
                  )}
                </Fragment>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const PLABEL_RE = /\[\[plabel\]\]([\s\S]*?)\[\[\/plabel\]\]/g;

function renderLabeledText(value: string, keyPrefix: string): ReactNode {
  const re = new RegExp(PLABEL_RE.source, "g");
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let labelIndex = 0;
  while ((match = re.exec(value)) !== null) {
    if (match.index > last) nodes.push(value.slice(last, match.index));
    nodes.push(
      <span
        key={`${keyPrefix}-l-${labelIndex}`}
        className="text-lg font-bold text-zinc-900"
      >
        {match[1]}
      </span>,
    );
    last = match.index + match[0].length;
    labelIndex += 1;
  }
  if (labelIndex === 0) return value;
  if (last < value.length) nodes.push(value.slice(last));
  return nodes;
}

function PassageParagraphs({ value }: { value: string }) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/^\n+|\n+$/g, ""))
    .filter((paragraph) => paragraph.trim());
  if (!paragraphs.length) return null;
  return (
    <div className="min-w-0 space-y-5 text-left">
      {paragraphs.map((paragraph, index) => (
        <p
          key={`p-${index}`}
          className="min-w-0 break-words text-justify indent-8 leading-7"
        >
          {renderLabeledText(paragraph, `p-${index}`)}
        </p>
      ))}
    </div>
  );
}

export function BoxedContent({
  text,
  renderText,
  passageLayout = false,
}: {
  text: string;
  renderText?: (value: string, key: string) => ReactNode;
  /** Reading passage column: paragraph gaps and bold leading A/B/C labels. */
  passageLayout?: boolean;
}) {
  const paint = renderText ?? ((value: string) => value);
  const segments = splitBoxedSegments(text);
  return (
    <div className="min-w-0 space-y-3">
      {segments.map((segment, index) => {
        if (segment.kind === "title") {
          return (
            <h2
              key={`title-${index}`}
              className="mb-4 break-words text-center text-sm font-bold leading-relaxed text-zinc-900 sm:text-base"
            >
              {segment.value}
            </h2>
          );
        }
        if (segment.kind === "phead") {
          return (
            <p
              key={`phead-${index}`}
              className="break-words text-sm font-bold leading-7 text-zinc-900"
            >
              {segment.value}
            </p>
          );
        }
        if (segment.kind === "section") {
          return (
            <h3
              key={`section-${index}`}
              className="break-words border-b-2 border-[#1a3a6b] pb-1 pt-4 text-base font-bold text-[#1a3a6b] first:pt-1"
            >
              {segment.value}
            </h3>
          );
        }
        if (segment.kind === "box") {
          return (
            <div key={`box-${index}`} className={BOX_CLASS}>
              <BoxBody value={segment.value} renderText={paint} />
            </div>
          );
        }
        if (passageLayout) {
          return <PassageParagraphs key={`text-${index}`} value={segment.value} />;
        }
        return (
          <div key={`text-${index}`} className="whitespace-pre-wrap text-left">
            {paint(segment.value, `t-${index}`)}
          </div>
        );
      })}
    </div>
  );
}
