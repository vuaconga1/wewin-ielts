"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { ImportIssue, ParsedTestDraft } from "@/lib/import/schemas";
import { friendlyError } from "@/lib/ui/friendly-error";
import { questionTypeLabel } from "@/lib/ui/question-type-label";
import { FriendlyErrorAlert } from "@/components/ui/friendly-error-alert";
import { useTranslations } from "@/i18n/provider";

type BatchItem = {
  sourceName: string;
  draft?: ParsedTestDraft | null;
  issues?: ImportIssue[];
  audioAttached?: string[];
};

type ApiResponse = {
  draft?: ParsedTestDraft | null;
  issues?: ImportIssue[];
  error?: string;
  errorDetail?: string;
  practiceUrl?: string;
  savedLocal?: boolean;
  batch?: boolean;
  items?: BatchItem[];
  saved?: { slug: string; practiceUrl: string; title: string }[];
  persist?: {
    testId: string | null;
    importJobId: string;
  };
};

const SKILL_VALUES = ["", "LISTENING", "READING", "WRITING", "SPEAKING"] as const;

export function ImportForm() {
  const { t } = useTranslations("importForm");
  const { t: ts } = useTranslations("skills");
  const { t: tqt } = useTranslations("questionTypes");
  const te = useTranslations("errors").t;
  const { t: tc } = useTranslations("common");
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [keysFile, setKeysFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [batchFiles, setBatchFiles] = useState<FileList | null>(null);
  const [skill, setSkill] = useState("");
  const [title, setTitle] = useState("");
  const [force, setForce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  async function submit(action: "preview" | "persist") {
    setLoading(true);
    setResult(null);

    const form = new FormData();
    form.append("action", action);
    if (skill) form.append("skill", skill);
    if (title) form.append("title", title);
    if (force) form.append("force", "true");

    if (mode === "batch") {
      if (zipFile) form.append("zipFile", zipFile);
      if (batchFiles) {
        for (const f of Array.from(batchFiles)) {
          form.append("batchFiles", f);
        }
      }
      if (!zipFile && (!batchFiles || batchFiles.length === 0)) {
        setResult({ error: t("needZip") });
        setLoading(false);
        return;
      }
    } else {
      if (!contentFile) {
        setResult({ error: t("needFile") });
        setLoading(false);
        return;
      }
      form.append("contentFile", contentFile);
      if (keysFile) form.append("keysFile", keysFile);
      if (audioFile) form.append("audioFile", audioFile);
    }

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as ApiResponse;
      if (data.error) {
        const mapped = friendlyError(data.error, t("importFailed"), te);
        if (data.error !== mapped.message) console.warn("[import]", data.error);
        setResult({
          ...data,
          error: mapped.message,
          errorDetail:
            mapped.detail && mapped.detail !== mapped.message
              ? mapped.detail
              : undefined,
        });
        return;
      }
      setResult(data);
    } catch (e) {
      const mapped = friendlyError(e, t("networkError"), te);
      console.warn("[import]", e);
      setResult({
        error: mapped.message,
        errorDetail:
          mapped.detail && mapped.detail !== mapped.message
            ? mapped.detail
            : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  const draft = result?.draft;
  const issues = result?.issues ?? [];
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  return (
    <div className="min-w-0 space-y-8">
      <section className="card-outline min-w-0 overflow-hidden p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["single", t("modeSingle")],
              ["batch", t("modeBatch")],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                mode === key
                  ? "bg-wewin-navy text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <h2 className="text-lg font-semibold text-zinc-900">{t("uploadTitle")}</h2>
        <p className="mt-1 text-sm text-zinc-600">
          {mode === "single" ? t("modeSingleHint") : t("modeBatchHint")}
        </p>

        {mode === "single" ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="block">
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">
                  {t("fileTest")}
                </span>
                <input
                  type="file"
                  accept=".docx,.md,.txt"
                  className="mt-1 block w-full cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:border-zinc-400"
                  onChange={(e) =>
                    setContentFile(e.target.files?.[0] ?? null)
                  }
                />
              </label>
              <a
                href="/templates/sample-de.zip"
                download="sample-de.zip"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-wewin-navy bg-white px-3 py-2.5 text-sm font-semibold text-wewin-navy hover:bg-wewin-navy/5"
              >
                <Download className="h-4 w-4 shrink-0" aria-hidden />
                {t("downloadSamples")}
              </a>
            </div>

            <div className="block">
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">
                  {t("fileKeys")}
                </span>
                <input
                  type="file"
                  accept=".docx,.md,.txt"
                  className="mt-1 block w-full cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:border-zinc-400"
                  onChange={(e) => setKeysFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <a
                href="/templates/sample-keys.docx"
                download="sample-keys.docx"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-wewin-navy bg-white px-3 py-2.5 text-sm font-semibold text-wewin-navy hover:bg-wewin-navy/5"
              >
                <Download className="h-4 w-4 shrink-0" aria-hidden />
                {t("downloadKeysSample")}
              </a>
            </div>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-zinc-700">
                {t("fileAudio")}
              </span>
              <input
                type="file"
                accept=".mp3,.m4a,.wav,.ogg"
                className="mt-1 block w-full cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:border-zinc-400"
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">
                {t("zipLabel")}
              </span>
              <input
                type="file"
                accept=".zip"
                className="mt-1 block w-full cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:border-zinc-400"
                onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">
                {t("orMulti")}
              </span>
              <input
                type="file"
                multiple
                accept=".docx,.md,.txt,.mp3,.m4a,.wav,.ogg,.zip"
                className="mt-1 block w-full cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:border-zinc-400"
                onChange={(e) => setBatchFiles(e.target.files)}
              />
            </label>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {mode === "single" && (
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">{tc("skill")}</span>
              <select
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
              >
                {SKILL_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value ? ts(value) : t("skillAuto")}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-zinc-700">
              {t("titleOptional")}
            </span>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Castle & Environment - Test 5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="mt-1 text-xs text-zinc-500">
              {t("slugHint")}{" "}
              <code className="rounded bg-zinc-100 px-1">
                castle-environment-test-5
              </code>
            </p>
          </label>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
          />
          {t("allowPartial")}
        </label>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => submit("preview")}
            className="rounded-lg bg-wewin-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-wewin-navy-hover disabled:opacity-50"
          >
            {loading ? t("processing") : t("preview")}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => submit("persist")}
            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            {t("saveDb")}
          </button>
        </div>
      </section>

      {result?.error && (
        <FriendlyErrorAlert
          message={result.error}
          detail={result.errorDetail}
        />
      )}

      {result?.persist && "testId" in result.persist && result.persist.testId && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {t("saved", { id: result.persist.testId })}
        </div>
      )}

      {result?.saved && result.saved.length > 0 && (
        <div className="rounded-lg border border-wewin-accent-blue bg-wewin-accent-blue-bg px-4 py-3 text-sm text-wewin-navy">
          {t("batchSaved", { n: result.saved.length })}
          <ul className="mt-2 list-inside list-disc">
            {result.saved.map((s) => (
              <li key={s.slug}>
                <a href={s.practiceUrl} className="font-medium underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result?.practiceUrl && !result.batch && (
        <div className="rounded-lg border border-wewin-accent-blue bg-wewin-accent-blue-bg px-4 py-3 text-sm text-wewin-navy">
          <a href={result.practiceUrl} className="font-semibold underline">
            {t("openPractice")}
          </a>
          {draft?.audioFiles?.length ? (
            <span className="mt-1 block text-xs">
              {tc("audio")}: {draft.audioFiles.join(", ")}
            </span>
          ) : null}
        </div>
      )}

      {issues.length > 0 && (
        <section className="card-outline p-5 sm:p-6">
          <h3 className="font-semibold text-zinc-900">
            {t("issues", { errors: errors.length, warnings: warnings.length })}
          </h3>
          <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto break-words text-sm">
            {issues.map((issue, i) => {
              const codeHint =
                issue.code === "REDUNDANT_GAP_STEMS_CLEARED"
                  ? t(
                      "issueRedundantGapStems",
                      "Cleared redundant gap stems (notes already show blanks).",
                    )
                  : issue.code === "DUPLICATE_GAP_STEMS"
                    ? t(
                        "issueDuplicateGapStems",
                        "Near-duplicate gap stems detected — check notes/table extract.",
                      )
                    : null;
              return (
              <li
                key={i}
                className={
                  issue.level === "error" ? "text-red-700" : "text-amber-700"
                }
              >
                [{issue.level}] {issue.code}: {issue.message}
                {codeHint ? (
                  <span className="mt-0.5 block text-xs text-amber-800/80">
                    {codeHint}
                  </span>
                ) : null}
              </li>
              );
            })}
          </ul>
        </section>
      )}

      {result?.items && result.items.length > 0 && (
        <section className="card-outline p-5 sm:p-6">
          <h3 className="font-semibold text-zinc-900">{t("batchPreview")}</h3>
          <div className="mt-4 space-y-4">
            {result.items.map((item) => (
              <div
                key={item.sourceName}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
              >
                <h4 className="break-words font-medium text-zinc-900">
                  {item.sourceName}
                  {item.draft ? (
                    <span className="ml-2 break-all text-sm font-normal text-zinc-500">
                      → {item.draft.slug} · {item.draft.parts.length} {t("parts")} ·{" "}
                      {item.draft.parts.reduce(
                        (s, p) => s + p.questions.length,
                        0,
                      )}{" "}
                      {tc("questionsLabel")}
                    </span>
                  ) : (
                    <span className="ml-2 text-sm text-red-600">{t("parseFail")}</span>
                  )}
                </h4>
                {item.audioAttached?.length ? (
                  <p className="mt-1 break-all text-xs text-zinc-500">
                    {tc("audio")}: {item.audioAttached.join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {draft && !result?.batch && (
        <section className="card-outline p-5 sm:p-6">
          <h3 className="font-semibold text-zinc-900">{t("previewLabel")}</h3>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">{tc("testLabel")}</dt>
              <dd className="break-words font-medium">{draft.title}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Slug</dt>
              <dd className="break-all font-mono">{draft.slug}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{tc("skill")}</dt>
              <dd>{ts(draft.skill, draft.skill)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t("parts")}</dt>
              <dd>{draft.parts.length}</dd>
            </div>
            {draft.audioFiles?.length ? (
              <div className="sm:col-span-2">
                <dt className="text-zinc-500">{tc("audio")}</dt>
                <dd className="break-all font-mono text-xs">
                  {draft.audioFiles.join(", ")}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-6 space-y-4">
            {draft.parts.map((part) => (
              <div
                key={part.order}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
              >
                <h4 className="font-medium text-zinc-900">
                  [{part.order}] {part.title} — {part.questions.length}{" "}
                  {tc("questionsLabel")}
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                  {part.questions.map((q) => (
                    <li key={q.number} className="break-words text-xs sm:text-sm">
                      Q{q.number}{" "}
                      <span className="text-zinc-500">
                        ({questionTypeLabel(q.type, tqt)})
                      </span>{" "}
                      {q.correctAnswer != null ? (
                        <span className="break-all font-mono text-green-700">
                          → {JSON.stringify(q.correctAnswer)}
                        </span>
                      ) : (
                        <span className="text-red-600">{t("missingKeys")}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
