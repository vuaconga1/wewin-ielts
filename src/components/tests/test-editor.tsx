"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent, type MouseEvent } from "react";
import type { ParsedTestDraft, PartDraft, QuestionDraft } from "@/lib/import/schemas";
import { useTranslations } from "@/i18n/provider";
import { classifyOutlineLine, isNotesSectionLabel, isNotesSubheading } from "@/lib/practice/notes-outline";
import {
  applyLayoutVariant,
  inferQuestionLayoutVariant,
  layoutUsesChoices,
  layoutVariantsForSkill,
  type QuestionLayoutVariant,
} from "@/lib/questions/layout-variants";

type EditorTest = ParsedTestDraft & { savedAt?: string };
type Option = { label: string; text: string };

function looksBold(line: string): boolean {
  const text = line.trim();
  return /^(?:Questions?\s+\d|Complete\b|Write\b|Choose\b|Label\b|PART\s+\d|Section\s+\d)/i.test(text) || (/^[A-Z][^.!?]{2,70}$/.test(text) && !/\.{2,}/.test(text));
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineHtml(value: string): string {
  return escapeHtml(value)
    .replace(/\[\[font:\+1\]\]([\s\S]*?)\[\[\/font\]\]/g, '<span data-font="+1" class="text-[1.12em]">$1</span>')
    .replace(/\[\[font:-1\]\]([\s\S]*?)\[\[\/font\]\]/g, '<span data-font="-1" class="text-[0.9em]">$1</span>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function isBulletedNotesLabel(value: string): boolean {
  return /^(?:responsibilities|requirements|experience)\s*:?$/i.test(
    value.replace(/^\*\*|\*\*$/g, "").trim(),
  );
}

function editorHtml(value: string): string {
  const lines = value.split("\n");
  const noteCompletion = lines.some((line) => /complete the (?:notes?|form|application|table)(?: below)?/i.test(line));
  const instructionEnd = lines.reduce(
    (last, line, index) => /^(?:write|choose)\b/i.test(line.trim()) ? index : last,
    -1,
  );
  const firstNoteLine = noteCompletion
    ? lines.findIndex((line, index) => index > instructionEnd && Boolean(line.trim()))
    : -1;

  return lines.map((line, index) => {
    const keptPlain = line.trim().match(/^\[\[plain\]\]\s*([\s\S]*)$/i);
    if (keptPlain) {
      const content = inlineHtml(keptPlain[1] ?? "") || "<br>";
      return `<div data-line data-plain>${content}</div>`;
    }
    const outline = classifyOutlineLine(line);
    const bulletedLabel = isBulletedNotesLabel(line);
    const autoBullet = noteCompletion
      && index > firstNoteLine
      && Boolean(line.trim())
      && (!isNotesSubheading(line) || bulletedLabel)
      && !isNotesSectionLabel(line);
    if (outline.kind === "bullet" || autoBullet) {
      const level = outline.kind === "bullet" ? outline.level : 0;
      const text = outline.kind === "bullet" ? outline.text : line.trim();
      const rendered = inlineHtml(text) || "<br>";
      const content = bulletedLabel && !/^\*\*/.test(text.trim())
        ? `<strong data-auto-bold>${rendered}</strong>`
        : rendered;
      const padding = Math.min(level, 3) * 1.5 + 1.25;
      const source = outline.kind === "bullet"
        ? `data-bullet-level="${level}"`
        : "data-auto-bullet";
      return `<div data-line ${source} class="flex items-start gap-2" style="padding-left:${padding}rem"><span data-bullet-marker contenteditable="false" class="mt-[0.65rem] h-2 w-2 shrink-0 rounded-full bg-current"></span><span data-bullet-content class="min-w-0 flex-1">${content}</span></div>`;
    }
    const content = inlineHtml(line) || "<br>";
    return looksBold(line) || index === firstNoteLine || isNotesSubheading(line) || isNotesSectionLabel(line)
      ? `<div data-line${index === firstNoteLine ? ' data-auto-title class="text-center"' : ""}><strong data-auto-bold>${content}</strong></div>`
      : `<div data-line>${content}</div>`;
  }).join("");
}
function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof HTMLElement)) return "";
  if (node.hasAttribute("data-bullet-marker")) return "";
  if (node.tagName === "BR") return "\n";
  const inner = Array.from(node.childNodes).map(serializeNode).join("");
  if (node.hasAttribute("data-plain")) return `[[plain]]${inner}`;
  if (node.hasAttribute("data-bullet-level")) return `[[b${node.dataset.bulletLevel ?? "0"}]]${inner}`;
  if (node.tagName === "LI") return `[[b0]]${inner}`;
  if (node.tagName === "UL" || node.tagName === "OL") return Array.from(node.children).map(serializeNode).join("\n");
    if ((node.tagName === "STRONG" || node.tagName === "B") && !node.hasAttribute("data-auto-bold")) return `**${inner}**`;
  const font = node.dataset.font;
  if (font === "+1" || font === "-1") return `[[font:${font}]]${inner}[[/font]]`;
  if (node.tagName === "BLOCKQUOTE") return inner.split("\n").map((line) => `  ${line}`).join("\n");
  return inner;
}

function serializeEditor(editor: HTMLElement): string {
  return Array.from(editor.childNodes).map((node) => serializeNode(node).replace(/\n$/, "")).join("\n").replace(/\n{3,}/g, "\n\n");
}

function RichTextField({ value, onChange, rows = 14, label }: { value: string; onChange: (value: string) => void; rows?: number; label: string }) {
  const { t } = useTranslations("editor");
  const ref = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<Range | null>(null);

  useLayoutEffect(() => {
    const editor = ref.current;
    if (editor && serializeEditor(editor) !== value) editor.innerHTML = editorHtml(value);
  }, [value]);

  function rememberSelection() {
    const selection = window.getSelection();
    if (selection?.rangeCount && ref.current?.contains(selection.anchorNode)) rangeRef.current = selection.getRangeAt(0).cloneRange();
  }
  function restoreSelection() {
    const range = rangeRef.current;
    if (!range) return false;
    const selection = window.getSelection();
    selection?.removeAllRanges(); selection?.addRange(range);
    return true;
  }
  function sync() {
    const editor = ref.current;
    if (editor) onChange(serializeEditor(editor));
  }
  function keepSelection(event: MouseEvent<HTMLButtonElement>) { event.preventDefault(); restoreSelection(); }
  function bold() { if (!restoreSelection()) ref.current?.focus(); document.execCommand("bold"); sync(); rememberSelection(); }
  function currentLine(): HTMLElement | null {
    const root = ref.current;
    const selection = window.getSelection();
    let node: Node | null = selection?.anchorNode ?? null;
    let line: HTMLElement | null = null;
    while (node && node !== root) {
      if (node instanceof HTMLElement && node.hasAttribute("data-line")) line = node;
      node = node.parentNode;
    }
    return line;
  }
  function caretAtStart(content: HTMLElement): boolean {
    const selection = window.getSelection();
    if (!selection?.isCollapsed || !selection.anchorNode || !content.contains(selection.anchorNode)) return false;
    const range = selection.getRangeAt(0);
    const before = range.cloneRange();
    before.selectNodeContents(content);
    before.setEnd(range.startContainer, range.startOffset);
    return before.toString().length === 0;
  }
  function stripBullet(line: HTMLElement) {
    line.querySelectorAll("[data-bullet-marker]").forEach((marker) => marker.remove());
    line.querySelectorAll("ul, ol").forEach((list) => {
      const text = document.createTextNode(list.textContent ?? "");
      list.replaceWith(text);
    });
    line.removeAttribute("data-auto-bullet");
    line.removeAttribute("data-bullet-level");
    line.setAttribute("data-plain", "");
    line.className = "";
    line.style.paddingLeft = "";
  }
  function lineHasBullet(line: HTMLElement): boolean {
    return line.hasAttribute("data-auto-bullet")
      || line.hasAttribute("data-bullet-level")
      || Boolean(line.querySelector("ul, ol, [data-bullet-marker]"));
  }
  function bullet() {
    if (!restoreSelection()) ref.current?.focus();
    const line = currentLine();
    if (line && lineHasBullet(line)) {
      stripBullet(line);
      sync();
      rememberSelection();
      return;
    }
    document.execCommand("insertUnorderedList");
    sync();
    rememberSelection();
  }
  function fontSize(direction: 1 | -1) {
    if (!restoreSelection()) ref.current?.focus();
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.dataset.font = direction > 0 ? "+1" : "-1";
    span.className = direction > 0 ? "text-[1.12em]" : "text-[0.9em]";
    if (range.collapsed) span.textContent = "văn bản";
    else span.append(range.extractContents());
    range.insertNode(span); selection.removeAllRanges();
    const next = document.createRange(); next.selectNodeContents(span); selection.addRange(next);
    rememberSelection(); sync();
  }
  function indent(outdent = false) { if (!restoreSelection()) ref.current?.focus(); document.execCommand(outdent ? "outdent" : "indent"); sync(); rememberSelection(); }
  function onInput(event: FormEvent<HTMLDivElement>) { onChange(serializeEditor(event.currentTarget)); rememberSelection(); }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!(event.ctrlKey || event.metaKey)) {
      if (event.key === "Backspace") {
        const line = currentLine();
        const content = line?.querySelector("[data-bullet-content]");
        if (line && lineHasBullet(line) && content instanceof HTMLElement && caretAtStart(content)) {
          event.preventDefault();
          stripBullet(line);
          sync();
          return;
        }
      }
      if (event.key === "Tab") { event.preventDefault(); indent(event.shiftKey); }
      return;
    }
    if (event.key.toLowerCase() === "b") { event.preventDefault(); bold(); return; }
    if (event.shiftKey && event.key === "8") { event.preventDefault(); bullet(); return; }
    if (event.key === "+" || event.key === "=") { event.preventDefault(); fontSize(1); return; }
    if (event.key === "-") { event.preventDefault(); fontSize(-1); }
  }

  return <div className="space-y-3">
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-zinc-300 bg-white pb-2">
      <span className="mr-auto text-sm font-bold text-wewin-navy">{label}</span>
      <button type="button" onMouseDown={keepSelection} onClick={bold} className="min-w-9 rounded border border-zinc-300 bg-white px-2.5 py-1 text-sm font-bold hover:bg-zinc-50" title="Ctrl+B" aria-label="In đậm">B</button>
      <button type="button" onMouseDown={keepSelection} onClick={bullet} className="min-w-9 rounded border border-zinc-300 bg-white px-2.5 py-1 text-sm font-bold hover:bg-zinc-50" title="Ctrl+Shift+8" aria-label="Bullet">&#8226;</button>
      <button type="button" onMouseDown={keepSelection} onClick={() => fontSize(1)} className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-sm font-semibold hover:bg-zinc-50" title="Ctrl++" aria-label="Tăng cỡ chữ">A+</button>
      <button type="button" onMouseDown={keepSelection} onClick={() => fontSize(-1)} className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-sm font-semibold hover:bg-zinc-50" title="Ctrl+-" aria-label="Giảm cỡ chữ">A−</button>
      <button type="button" onMouseDown={keepSelection} onClick={() => indent(false)} className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-sm hover:bg-zinc-50" title="Tab">Thụt vào</button>
      <button type="button" onMouseDown={keepSelection} onClick={() => indent(true)} className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-sm hover:bg-zinc-50" title="Shift+Tab">Thụt ra</button>
    </div>
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={label}
      onInput={onInput}
      onKeyDown={onKeyDown}
      onMouseUp={rememberSelection}
      onKeyUp={rememberSelection}
      className="overflow-auto rounded-sm border border-zinc-400 bg-white px-4 py-4 text-[15px] leading-7 text-zinc-900 outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg [&_blockquote]:ml-6 [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-3 [&_ul]:list-disc [&_ul]:pl-7"
      style={{ minHeight: Math.max(112, Math.min(rows * 24, 480)) }}
    />
    <p className="text-xs text-zinc-500">Bấm trực tiếp để sửa hoặc xóa. Bôi đen văn bản rồi dùng Ctrl+B, Ctrl++/Ctrl−, Tab/Shift+Tab hoặc các nút phía trên. {t("bulletHint", "Bấm lại nút bullet, hoặc Backspace ở đầu dòng, để bỏ chấm đầu dòng.")}</p>
  </div>;
}

function answerText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return value == null ? "" : JSON.stringify(value);
}

function partAudioUrl(part: PartDraft, audioFiles: string[] | undefined): string {
  const fromMeta = part.meta?.audioUrl ?? part.meta?.audio;
  if (typeof fromMeta === "string") return fromMeta.trim();
  const aligned = audioFiles?.length ? audioFiles[part.order] : "";
  return typeof aligned === "string" ? aligned.trim() : "";
}

function nextOptionLabel(options: Option[]): string {
  const used = new Set(options.map((option) => option.label.trim().toUpperCase()));
  for (let index = 0; index < 26; index += 1) {
    const label = String.fromCharCode(65 + index);
    if (!used.has(label)) return label;
  }
  return String(options.length + 1);
}

function withPartAudio(part: PartDraft, url: string): PartDraft {
  const meta = { ...(part.meta ?? {}) };
  if (url) meta.audioUrl = url;
  else meta.audioUrl = "";
  delete meta.audio;
  return { ...part, meta };
}

export function TestEditor({ initialTest }: { initialTest: EditorTest }) {
  const { t } = useTranslations("editor");
  const { t: tLayout } = useTranslations("questionLayouts");
  const [test, setTest] = useState<ParsedTestDraft>(() => structuredClone(initialTest));
  const [partIndex, setPartIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [message, setMessage] = useState("");
  const part = test.parts[partIndex]!;
  const audioUrl = partAudioUrl(part, test.audioFiles);
  const layoutChoices = layoutVariantsForSkill(test.skill);

  function updatePart(change: (part: PartDraft) => PartDraft) {
    setTest((current) => ({ ...current, parts: current.parts.map((item, index) => index === partIndex ? change(item) : item) }));
  }
  function updateQuestion(index: number, change: (question: QuestionDraft) => QuestionDraft) {
    updatePart((current) => ({ ...current, questions: current.questions.map((q, i) => i === index ? change(q) : q) }));
  }
  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true); setMessage("");
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch(`/api/tests/${test.slug}/image`, { method: "POST", body: form });
      const data = await response.json() as { imageUrl?: string; message?: string };
      if (!response.ok || !data.imageUrl) throw new Error(data.message || "Không tải được ảnh");
      const imageUrl = data.imageUrl;
      updatePart((current) => ({ ...current, meta: { ...(current.meta ?? {}), imageUrl }, questions: current.questions.map((q) => ({ ...q, mediaUrl: imageUrl, content: { ...q.content, imageUrl } })) }));
      setMessage("Đã tải ảnh mới. Bấm Lưu thay đổi để áp dụng.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không tải được ảnh"); }
    finally { setUploading(false); event.target.value = ""; }
  }
  function setAudio(url: string) {
    setTest((current) => {
      const currentPart = current.parts[partIndex];
      if (!currentPart) return current;
      const parts = current.parts.map((item, index) => index === partIndex ? withPartAudio(item, url) : item);
      const audioFiles = current.audioFiles ? [...current.audioFiles] : [];
      if (url && audioFiles.length === parts.length) audioFiles[currentPart.order] = url;
      return { ...current, parts, audioFiles: audioFiles.length ? audioFiles : current.audioFiles };
    });
  }
  async function uploadAudio(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true); setMessage("");
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch(`/api/tests/${test.slug}/audio`, { method: "POST", body: form });
      const data = await response.json() as { audioUrl?: string; message?: string };
      if (!response.ok || !data.audioUrl) throw new Error(data.message || t("audioFailed", "Không tải được audio"));
      setAudio(data.audioUrl);
      setMessage(t("audioUploaded", "Đã tải audio mới. Bấm Lưu thay đổi để áp dụng."));
    } catch (error) { setMessage(error instanceof Error ? error.message : t("audioFailed", "Không tải được audio")); }
    finally { setUploadingAudio(false); event.target.value = ""; }
  }
  function clearAudio() {
    setAudio("");
    setMessage(t("audioRemoved", "Đã gỡ audio khỏi phần này. Bấm Lưu thay đổi để áp dụng."));
  }
  async function save() {
    setSaving(true); setMessage("");
    try {
      const response = await fetch(`/api/tests/${test.slug}/edit`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(test) });
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message || "Không lưu được đề");
      setMessage("Đã lưu và xuất bản thay đổi.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không lưu được đề"); }
    finally { setSaving(false); }
  }
  const imageUrl = typeof part.meta?.imageUrl === "string" ? part.meta.imageUrl : part.questions.map((q) => typeof q.content.imageUrl === "string" ? q.content.imageUrl : q.mediaUrl).find(Boolean);

  return (
    <div className="mx-auto max-w-[1440px] space-y-3 pb-8">
      <header className="flex flex-col gap-3 border border-zinc-300 bg-wewin-navy px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Chế độ chỉnh sửa trực tiếp</p>
          <h1 className="truncate text-lg font-bold">{test.title}</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href={`/tests/${test.slug}`} className="border border-white/50 bg-white px-4 py-2 text-sm font-semibold text-wewin-navy hover:bg-zinc-100">Thoát chỉnh sửa</Link>
          <button type="button" onClick={save} disabled={saving} className="bg-[#ffd21c] px-4 py-2 text-sm font-bold text-wewin-navy disabled:opacity-50">{saving ? "Đang lưu…" : "Lưu thay đổi"}</button>
        </div>
      </header>

      {message ? <div role="status" className="border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-900">{message}</div> : null}

      <details className="border border-zinc-300 bg-white">
        <summary className="cursor-pointer px-4 py-2 text-sm font-semibold text-wewin-navy">Thông tin chung của đề</summary>
        <div className="grid gap-4 border-t border-zinc-200 p-4 md:grid-cols-3">
          <label className="space-y-1 text-sm font-semibold">Tên đề<input value={test.title} onChange={(event) => setTest({ ...test, title: event.target.value })} className="w-full border border-zinc-300 px-3 py-2 font-normal" /></label>
          <label className="space-y-1 text-sm font-semibold">Thời gian (phút)<input type="number" min={1} value={test.timeLimitMinutes ?? ""} onChange={(event) => setTest({ ...test, timeLimitMinutes: Number(event.target.value) || undefined })} className="w-full border border-zinc-300 px-3 py-2 font-normal" /></label>
          <label className="space-y-1 text-sm font-semibold">Tags<input value={(test.tags ?? []).join(", ")} onChange={(event) => setTest({ ...test, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} className="w-full border border-zinc-300 px-3 py-2 font-normal" /></label>
        </div>
      </details>

      <nav className="flex flex-wrap gap-1 border-b border-zinc-400 bg-[#eceff2] px-2 pt-2" aria-label="Các phần của đề">
        {test.parts.map((item, index) => (
          <button key={`${item.order}-${item.title}`} type="button" onClick={() => setPartIndex(index)} className={`border border-b-0 px-4 py-2 text-sm font-semibold ${index === partIndex ? "border-wewin-navy bg-wewin-navy text-white" : "border-zinc-400 bg-white text-zinc-700 hover:bg-zinc-50"}`}>{index + 1}. {item.title}</button>
        ))}
      </nav>

      <div className="grid min-h-[70vh] border border-zinc-400 bg-white lg:grid-cols-2">
        <aside className="min-w-0 border-b border-zinc-400 bg-[#f7f8fa] lg:border-b-0 lg:border-r">
          <div className="border-b border-zinc-300 bg-[#eceff2] px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-700">Media / hình ảnh</div>
          <div className="space-y-4 p-4">
            <section className="space-y-3 border border-zinc-300 bg-white p-3">
              <h2 className="text-sm font-bold text-wewin-navy">{t("audioTitle", "Âm thanh")}</h2>
              {audioUrl ? (
                <audio key={audioUrl} controls preload="none" src={audioUrl} className="w-full min-w-0" />
              ) : (
                <p className="text-sm text-zinc-500">{t("audioEmpty", "Phần này chưa có file nghe.")}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer border border-wewin-navy bg-white px-3 py-2 text-sm font-bold text-wewin-navy hover:bg-wewin-accent-blue-bg">
                  <input type="file" accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm,.mp3,.m4a,.wav,.ogg,.webm" onChange={uploadAudio} disabled={uploadingAudio} className="sr-only" />
                  {uploadingAudio ? t("uploadingAudio", "Đang tải audio…") : audioUrl ? t("replaceAudio", "Thay audio") : t("addAudio", "Thêm audio")}
                </label>
                {audioUrl ? (
                  <button type="button" onClick={clearAudio} className="border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">{t("removeAudio", "Xóa audio")}</button>
                ) : null}
              </div>
            </section>
            {imageUrl ? (
              <div className="overflow-hidden border border-zinc-400 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Ảnh hiện tại của phần" className="mx-auto max-h-[58vh] w-full object-contain" />
              </div>
            ) : (
              <div className="flex min-h-52 items-center justify-center border border-dashed border-zinc-400 bg-white px-6 text-center text-sm text-zinc-500">Phần này không có hình ảnh. Bạn vẫn có thể thêm ảnh mới.</div>
            )}
            <label className="inline-flex cursor-pointer border border-wewin-navy bg-white px-3 py-2 text-sm font-bold text-wewin-navy hover:bg-wewin-accent-blue-bg"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadImage} disabled={uploading} className="sr-only" />{uploading ? "Đang tải…" : imageUrl ? "Thay ảnh" : "Thêm ảnh"}</label>
            <label className="block space-y-1 text-sm font-semibold">Tên phần<input value={part.title} onChange={(event) => updatePart((current) => ({ ...current, title: event.target.value }))} className="w-full border border-zinc-300 bg-white px-3 py-2 font-normal" /></label>
          </div>
        </aside>

        <main className="min-w-0 lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto">
          <div className="sticky top-0 z-20 border-b border-zinc-300 bg-[#eceff2] px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-700">{part.title} · Bấm trực tiếp vào nội dung để sửa</div>
          <section className="border-b border-zinc-300 p-4">
            <RichTextField label="Nội dung và hướng dẫn" value={part.content ?? ""} onChange={(content) => updatePart((current) => ({ ...current, content }))} />
          </section>
          {part.questions.map((question, qIndex) => {
            const options = Array.isArray(question.content.options) ? question.content.options as Option[] : [];
            const variant = inferQuestionLayoutVariant(question, part, test.examType);
            const layoutOptions = layoutChoices.includes(variant) ? layoutChoices : [variant, ...layoutChoices];
            const showChoices = layoutUsesChoices(variant);
            return (
              <section key={`${question.number}-${qIndex}`} className="border-b border-zinc-300 p-4 last:border-b-0">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <h2 className="font-bold text-zinc-900">{question.number}.</h2>
                  <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-zinc-600 sm:w-80">
                    {t("layoutLabel", "Dạng câu hỏi")}
                    <select
                      value={variant}
                      onChange={(event) => updateQuestion(qIndex, (current) => applyLayoutVariant(current, event.target.value as QuestionLayoutVariant))}
                      className="w-full min-w-0 border border-zinc-300 bg-white px-2 py-2 text-sm font-normal text-zinc-900"
                    >
                      {layoutOptions.map((item) => (
                        <option key={item} value={item}>{tLayout(item, item.replaceAll("_", " ").toLowerCase())}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {variant === "MULTI_SELECT" ? (
                  <label className="mb-4 flex max-w-xs items-center gap-3 text-sm font-semibold text-zinc-700">
                    <span className="shrink-0">{t("selectCount", "Số đáp án cần chọn")}</span>
                    <input
                      type="number"
                      min={2}
                      max={7}
                      value={typeof question.content.selectCount === "number" ? question.content.selectCount : 2}
                      onChange={(event) => updateQuestion(qIndex, (current) => ({ ...current, content: { ...current.content, selectCount: Math.max(2, Number(event.target.value) || 2) } }))}
                      className="w-20 border border-zinc-300 bg-white px-2 py-2 font-normal"
                    />
                  </label>
                ) : null}
                <RichTextField rows={3} label={`Nội dung câu ${question.number}`} value={typeof question.content.stem === "string" ? question.content.stem : ""} onChange={(stem) => updateQuestion(qIndex, (current) => ({ ...current, content: { ...current.content, stem } }))} />
                {showChoices ? (
                  <div className="mt-4 space-y-2">
                    {options.map((option, optionIndex) => (
                      <div key={optionIndex} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] border border-zinc-300 bg-white">
                        <input aria-label={t("optionLabel", { n: optionIndex + 1 }, "Nhãn lựa chọn {n}")} value={option.label} onChange={(event) => updateQuestion(qIndex, (current) => ({ ...current, content: { ...current.content, options: options.map((item, index) => index === optionIndex ? { ...item, label: event.target.value } : item) } }))} className="border-r border-zinc-300 px-2 py-2 text-center font-bold outline-none focus:bg-blue-50" />
                        <input aria-label={t("optionText", { n: optionIndex + 1 }, "Nội dung lựa chọn {n}")} value={option.text} onChange={(event) => updateQuestion(qIndex, (current) => ({ ...current, content: { ...current.content, options: options.map((item, index) => index === optionIndex ? { ...item, text: event.target.value } : item) } }))} className="min-w-0 px-3 py-2 outline-none focus:bg-blue-50" />
                        <button type="button" disabled={options.length <= 2} onClick={() => updateQuestion(qIndex, (current) => ({ ...current, content: { ...current.content, options: options.filter((_, index) => index !== optionIndex) } }))} className="border-l border-zinc-300 px-3 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-40">{t("removeOption", "Xóa lựa chọn")}</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => updateQuestion(qIndex, (current) => ({ ...current, content: { ...current.content, options: [...options, { label: nextOptionLabel(options), text: "" }] } }))} className="border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-wewin-navy hover:bg-zinc-50">{t("addOption", "Thêm lựa chọn")}</button>
                  </div>
                ) : null}
                <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-zinc-700"><span className="shrink-0">Đáp án đúng</span><input value={answerText(question.correctAnswer)} onChange={(event) => updateQuestion(qIndex, (current) => ({ ...current, correctAnswer: event.target.value }))} className="min-w-0 flex-1 border border-zinc-300 bg-amber-50 px-3 py-2 font-normal outline-none focus:border-wewin-navy" /></label>
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
}