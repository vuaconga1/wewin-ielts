"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type TouchEvent,
} from "react";
import { BoxedContent } from "@/components/practice/boxed-content";
import { useTranslations } from "@/i18n/provider";
import {
  addHighlight,
  buildPassageModel,
  HIGHLIGHT_SPAN_MAX,
  quoteSlice,
  removeHighlight,
  removeOverlapping,
  setHighlightNote,
  splitPiece,
  type PassageHighlight,
  type PassagePiece,
} from "@/lib/practice/passage-highlights";

type ToolbarState = {
  x: number;
  y: number;
  below: boolean;
  start: number;
  end: number;
};

type EditorState = {
  id: string;
  x: number;
  y: number;
};

export function HighlightablePassage({
  text,
  partOrder,
  highlights,
  onChange,
  readOnly = false,
}: {
  text: string;
  partOrder: number;
  highlights: PassageHighlight[];
  onChange: (next: PassageHighlight[]) => void;
  readOnly?: boolean;
}) {
  const { t } = useTranslations("practice");
  const model = useMemo(() => buildPassageModel(text), [text]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);

  useEffect(() => {
    const pane = rootRef.current?.closest(".cdi-pane");
    if (!pane) return;
    const close = () => setToolbar(null);
    pane.addEventListener("scroll", close, { passive: true });
    return () => pane.removeEventListener("scroll", close);
  }, []);

  useEffect(() => {
    if (!toolbar && !editor) return;
    function onDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-highlight-ui]")) return;
      if (rootRef.current?.contains(target)) return;
      setToolbar(null);
      setEditor(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [toolbar, editor]);

  function paint(pieces: PassagePiece[]) {
    return pieces.flatMap((piece) => splitPiece(piece, highlights)).map((seg) => {
      const boldClass = seg.bold ? "text-lg font-bold text-zinc-900" : undefined;
      if (seg.highlightId) {
        const noted = highlights.some(
          (item) => item.id === seg.highlightId && item.note.trim(),
        );
        return (
          <mark
            key={`${seg.start}-${seg.highlightId}`}
            data-off={seg.start}
            data-hid={seg.highlightId}
            className={`cursor-pointer rounded-sm bg-[#ffe566] text-inherit ${
              noted ? "underline decoration-[#1a3a6b] decoration-2 underline-offset-[3px]" : ""
            } ${boldClass ?? ""}`}
          >
            {seg.text}
          </mark>
        );
      }
      return (
        <span key={`${seg.start}-t`} data-off={seg.start} className={boldClass}>
          {seg.text}
        </span>
      );
    });
  }

  function onPointerUp(event: MouseEvent | TouchEvent) {
    if (readOnly) return;
    const root = rootRef.current;
    if (!root) return;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (
        root.contains(range.startContainer) &&
        root.contains(range.endContainer)
      ) {
        const start = offsetAt(range.startContainer, range.startOffset, root);
        const end = offsetAt(range.endContainer, range.endOffset, root);
        if (start != null && end != null && start !== end) {
          const from = Math.min(start, end);
          const to = Math.max(start, end);
          const quote = quoteSlice(model.text, from, to);
          if (quote && to - from <= HIGHLIGHT_SPAN_MAX) {
            const rect = range.getBoundingClientRect();
            const below = rect.top < 64;
            setEditor(null);
            setToolbar({
              x: rect.left + rect.width / 2,
              y: below ? rect.bottom : rect.top,
              below,
              start: from,
              end: to,
            });
            return;
          }
        }
      }
    }

    const target = event.target;
    const mark =
      target instanceof Element ? target.closest("[data-hid]") : null;
    const id = mark?.getAttribute("data-hid");
    if (mark && id) {
      const rect = mark.getBoundingClientRect();
      setToolbar(null);
      setEditor({ id, x: rect.left, y: rect.bottom });
      return;
    }
    setToolbar(null);
  }

  function applyHighlight(openNote: boolean) {
    if (!toolbar) return;
    const next = addHighlight(
      highlights,
      partOrder,
      toolbar.start,
      toolbar.end,
      model.text,
    );
    onChange(next);
    const created = next.find(
      (item) => item.start <= toolbar.start && item.end >= toolbar.end,
    );
    window.getSelection()?.removeAllRanges();
    if (openNote && created) {
      setEditor({ id: created.id, x: toolbar.x, y: toolbar.y });
    }
    setToolbar(null);
  }

  const editing = editor
    ? highlights.find((item) => item.id === editor.id)
    : null;

  return (
    <div
      ref={rootRef}
      className="min-w-0 space-y-3"
      onMouseUp={onPointerUp}
      onTouchEnd={onPointerUp}
    >
      {renderBlocks(model.blocks, paint)}

      {toolbar ? (
        <div
          data-highlight-ui
          role="toolbar"
          aria-label={t("highlightToolbar", "Công cụ tô đoạn")}
          className="flex max-w-[calc(100vw-1rem)] flex-wrap gap-1 rounded-lg border border-zinc-300 bg-white p-1 shadow-lg"
          style={popStyle(toolbar.x, toolbar.y, toolbar.below)}
          onMouseDown={(event) => event.preventDefault()}
        >
          <button
            type="button"
            className="min-h-10 rounded bg-[#ffe566] px-3 text-sm font-semibold text-zinc-900"
            onClick={() => applyHighlight(false)}
          >
            {t("highlight", "Tô vàng")}
          </button>
          <button
            type="button"
            className="min-h-10 rounded bg-wewin-navy px-3 text-sm font-semibold text-white"
            onClick={() => applyHighlight(true)}
          >
            {t("highlightNote", "Ghi chú")}
          </button>
          <button
            type="button"
            className="min-h-10 rounded border border-zinc-300 px-3 text-sm font-semibold text-zinc-800"
            onClick={() => {
              onChange(
                removeOverlapping(highlights, partOrder, toolbar.start, toolbar.end),
              );
              window.getSelection()?.removeAllRanges();
              setToolbar(null);
            }}
          >
            {t("removeHighlight", "Xóa")}
          </button>
        </div>
      ) : null}

      {editor && editing ? (
        <div
          data-highlight-ui
          className="w-[min(18rem,calc(100vw-1.5rem))] rounded-lg border border-zinc-300 bg-white p-2 shadow-lg"
          style={popStyle(editor.x, editor.y, true)}
        >
          <label className="mb-1 block text-xs font-semibold text-zinc-600">
            {t("highlightNote", "Ghi chú")}
          </label>
          <textarea
            value={editing.note}
            maxLength={500}
            rows={3}
            autoFocus
            aria-label={t("highlightNote", "Ghi chú")}
            placeholder={t("highlightNotePlaceholder", "Ghi chú cho chỗ này…")}
            className="w-full resize-y rounded border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-wewin-navy"
            onChange={(event) =>
              onChange(setHighlightNote(highlights, editing.id, event.target.value))
            }
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="min-h-10 rounded border border-zinc-300 px-3 text-sm font-semibold text-zinc-800"
              onClick={() => {
                onChange(removeHighlight(highlights, editing.id));
                setEditor(null);
              }}
            >
              {t("removeHighlight", "Xóa")}
            </button>
            <button
              type="button"
              className="min-h-10 rounded bg-wewin-navy px-3 text-sm font-semibold text-white"
              onClick={() => setEditor(null)}
            >
              {t("highlightDone", "Xong")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderBlocks(
  blocks: ReturnType<typeof buildPassageModel>["blocks"],
  paint: (pieces: PassagePiece[]) => ReactNode,
) {
  const nodes: ReactNode[] = [];
  let index = 0;
  while (index < blocks.length) {
    const block = blocks[index]!;
    if (block.kind === "paragraph") {
      const group: Extract<(typeof blocks)[number], { kind: "paragraph" }>[] = [];
      while (index < blocks.length && blocks[index]?.kind === "paragraph") {
        group.push(
          blocks[index] as Extract<(typeof blocks)[number], { kind: "paragraph" }>,
        );
        index += 1;
      }
      nodes.push(
        <div key={`ps-${index}`} className="min-w-0 space-y-5 text-left">
          {group.map((paragraph, paragraphIndex) => (
            <p
              key={`p-${index}-${paragraphIndex}`}
              className="min-w-0 break-words text-justify indent-8 leading-7"
            >
              {paint(paragraph.pieces)}
            </p>
          ))}
        </div>,
      );
      continue;
    }
    if (block.kind === "box") {
      nodes.push(
        <BoxedContent
          key={`box-${index}`}
          text={`[[box]]\n${block.value}\n[[/box]]`}
        />,
      );
    } else if (block.kind === "title") {
      nodes.push(
        <h2
          key={`title-${index}`}
          className="mb-4 break-words text-center text-sm font-bold leading-relaxed text-zinc-900 sm:text-base"
        >
          {paint(block.pieces)}
        </h2>,
      );
    } else if (block.kind === "phead") {
      nodes.push(
        <p
          key={`phead-${index}`}
          className="break-words text-sm font-bold leading-7 text-zinc-900"
        >
          {paint(block.pieces)}
        </p>,
      );
    } else {
      nodes.push(
        <h3
          key={`section-${index}`}
          className="break-words border-b-2 border-[#1a3a6b] pb-1 pt-4 text-base font-bold text-[#1a3a6b] first:pt-1"
        >
          {paint(block.pieces)}
        </h3>,
      );
    }
    index += 1;
  }
  return nodes;
}

function popStyle(x: number, y: number, below: boolean): CSSProperties {
  const left =
    typeof window === "undefined"
      ? x
      : Math.min(window.innerWidth - 12, Math.max(12, x));
  return {
    position: "fixed",
    left,
    top: y,
    transform: below ? "translate(-50%, 8px)" : "translate(-50%, calc(-100% - 8px))",
    zIndex: 80,
  };
}

function offsetAt(container: Node, offset: number, root: HTMLElement): number | null {
  if (container.nodeType === Node.TEXT_NODE) {
    const host = container.parentElement?.closest("[data-off]");
    if (!host || !root.contains(host)) return null;
    const base = Number(host.getAttribute("data-off"));
    if (!Number.isFinite(base)) return null;
    return base + offset;
  }
  if (!(container instanceof Element) || !root.contains(container)) return null;
  if (offset <= 0) {
    const host = container.closest("[data-off]");
    if (!host || !root.contains(host)) return null;
    const base = Number(host.getAttribute("data-off"));
    return Number.isFinite(base) ? base : null;
  }
  const previous = container.childNodes[offset - 1];
  if (!previous) return null;
  return endOffsetOf(previous, root);
}

function endOffsetOf(node: Node, root: HTMLElement): number | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return offsetAt(node, node.textContent?.length ?? 0, root);
  }
  const host =
    node instanceof Element ? node.closest("[data-off]") : node.parentElement?.closest("[data-off]");
  if (host && root.contains(host)) {
    const base = Number(host.getAttribute("data-off"));
    if (Number.isFinite(base) && (host === node || host.contains(node))) {
      const own = host.getAttribute("data-off");
      if (host === node || node.parentElement === host) {
        return base + (host.textContent?.length ?? 0);
      }
      void own;
    }
  }
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  let current: Node | null = walker.nextNode();
  while (current) {
    last = current as Text;
    current = walker.nextNode();
  }
  if (!last) return null;
  return offsetAt(last, last.textContent?.length ?? 0, root);
}
