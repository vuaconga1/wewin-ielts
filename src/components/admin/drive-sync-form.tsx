"use client";

import { useEffect, useState } from "react";
import type { ImportIssue } from "@/lib/import/schemas";
import { friendlyError } from "@/lib/ui/friendly-error";
import { FriendlyErrorAlert } from "@/components/ui/friendly-error-alert";
import { useTranslations } from "@/i18n/provider";

type DriveStatus = {
  configured: boolean;
  defaultFolderId: string;
  message?: string;
};

type SyncItem = {
  sourceName: string;
  slug?: string;
  title?: string;
  skill?: string;
  practiceUrl?: string;
  status: "new" | "updated" | "error" | "skipped";
  issues: ImportIssue[];
  audioAttached?: string[];
};

type SyncFolder = {
  folderId: string;
  folderName: string;
  status: "ok" | "error" | "skipped";
  error?: string;
  items: SyncItem[];
  saved: {
    slug: string;
    practiceUrl: string;
    title: string;
    status: "new" | "updated";
  }[];
};

type SyncResponse = {
  ok?: boolean;
  error?: string;
  errorDetail?: string;
  configured?: boolean;
  mode?: "audioOnly" | string;
  rootFolderId?: string;
  rootFolderName?: string;
  folders?: SyncFolder[];
  newCount?: number;
  updatedCount?: number;
  errorCount?: number;
  skippedCount?: number;
  issues?: ImportIssue[];
  found?: number;
  downloaded?: number;
  skippedExisting?: number;
  failed?: number;
  attachedTests?: { slug: string; audioFiles: string[]; count: number }[];
  orphaned?: { name: string; folderPath: string; relativeUrl?: string }[];
};

export function DriveSyncForm() {
  const { t } = useTranslations("driveSync");
  const { t: ti } = useTranslations("importForm");
  const { t: tStatus } = useTranslations("syncItemStatus");
  const te = useTranslations("errors").t;
  const [status, setStatus] = useState<DriveStatus | null>(null);
  const [folderInput, setFolderInput] = useState("");
  const [persist, setPersist] = useState(false);
  const [force, setForce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/drive/sync");
        const data = (await res.json()) as DriveStatus & { error?: string };
        if (cancelled) return;
        if (typeof data.error === "string" && data.configured !== true) {
          const mapped = friendlyError(
            data.error,
            t("notConfiguredError"),
            te,
          );
          setStatus({
            configured: false,
            defaultFolderId: data.defaultFolderId ?? "",
            message: mapped.detail ?? mapped.message,
          });
          return;
        }
        setStatus({
          configured: Boolean(data.configured),
          defaultFolderId: data.defaultFolderId ?? "",
          message: data.message,
        });
        if (data.defaultFolderId) {
          setFolderInput((prev) => prev || data.defaultFolderId);
        }
      } catch (e) {
        if (!cancelled) {
          const mapped = friendlyError(
            e,
            t("configCheckFailed"),
            te,
          );
          setStatus({
            configured: false,
            defaultFolderId: "",
            message: mapped.message,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t, te]);

  async function sync(audioOnly = false) {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId: folderInput.trim() || undefined,
          persist,
          force,
          audioOnly: audioOnly || undefined,
        }),
      });
      const data = (await res.json()) as SyncResponse;
      if (data.error) {
        const mapped = friendlyError(
          data.error,
          t("syncFailed"),
          te,
        );
        if (data.error !== mapped.message) console.warn("[drive/sync]", data.error);
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
      console.warn("[drive/sync]", e);
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

  const issues = result?.issues ?? [];
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  return (
    <section className="card-outline p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-900">
        {t("title")}
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        {t("body")}
      </p>

      {status && !status.configured && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">
            {t("notConfigured")}
          </p>
          {status.message ? (
            <p className="mt-1 text-xs text-amber-800/90">{status.message}</p>
          ) : null}
        </div>
      )}

      {status?.configured && (
        <p className="mt-3 text-xs text-green-700">
          {t("credentialsOk")}
          {status.defaultFolderId
            ? ` · default folder: ${status.defaultFolderId}`
            : ""}
        </p>
      )}

      <label className="mt-6 block">
        <span className="text-sm font-medium text-zinc-700">
          {t("folderLabel")}
        </span>
        <input
          type="text"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono"
          placeholder="https://drive.google.com/drive/folders/FOLDER_ID"
          value={folderInput}
          onChange={(e) => setFolderInput(e.target.value)}
        />
        <span className="mt-1 block text-xs text-zinc-500">
          {t("folderHint")}
        </span>
      </label>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-600">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={persist}
            onChange={(e) => setPersist(e.target.checked)}
          />
          {t("saveAfter")}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
          />
          {t("allowPartial")}
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading || !folderInput.trim()}
          onClick={() => sync(false)}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? t("syncing") : t("sync")}
        </button>
        <button
          type="button"
          disabled={loading || !folderInput.trim()}
          onClick={() => sync(true)}
          className="rounded-lg border border-wewin-navy px-5 py-2.5 text-sm font-medium text-wewin-navy hover:bg-wewin-accent-blue-bg disabled:opacity-50"
        >
          {loading ? t("syncingAudio") : t("syncAudio")}
        </button>
      </div>

      {loading && (
        <p className="mt-4 text-sm text-zinc-600">
          {t("loadingFiles")}
        </p>
      )}

      {result?.error && (
        <div className="mt-4">
          <FriendlyErrorAlert
            message={result.error}
            detail={result.errorDetail}
          />
        </div>
      )}

      {result &&
        !result.error &&
        result.mode !== "audioOnly" &&
        (result.folders?.length ?? 0) === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-wewin-accent-blue bg-white px-4 py-8 text-center text-sm text-zinc-600">
          <p className="font-medium text-zinc-800">{t("emptyFolders")}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {t("emptyHint")}
          </p>
        </div>
      )}

      {result && !result.error && result.mode === "audioOnly" && (
        <div className="mt-4 rounded-lg border border-wewin-accent-blue bg-wewin-accent-blue-bg px-4 py-3 text-sm text-wewin-navy">
          <p>
            Folder:{" "}
            <strong>
              {result.rootFolderName} ({result.rootFolderId})
            </strong>
          </p>
          <p className="mt-1">
            {t("audioFound")}: <strong>{result.found ?? 0}</strong>
            {" · "}
            {t("audioDownloaded")}: <strong>{result.downloaded ?? 0}</strong>
            {" · "}
            {t("audioSkipped")}: <strong>{result.skippedExisting ?? 0}</strong>
            {" · "}
            {t("audioFailed")}: <strong>{result.failed ?? 0}</strong>
          </p>
          {result.attachedTests?.length ? (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
              <li className="font-medium">{t("audioAttached")}</li>
              {result.attachedTests.map((a) => (
                <li key={a.slug}>
                  {a.slug}: {a.count}
                </li>
              ))}
            </ul>
          ) : null}
          {(result.orphaned?.length ?? 0) > 0 ? (
            <p className="mt-2 text-xs text-amber-800">
              {t("audioOrphaned")}: {result.orphaned?.length}
            </p>
          ) : null}
        </div>
      )}

      {result && !result.error && result.mode !== "audioOnly" && (
        <div className="mt-4 rounded-lg border border-wewin-accent-blue bg-wewin-accent-blue-bg px-4 py-3 text-sm text-wewin-navy">
          <p>
            Folder:{" "}
            <strong>
              {result.rootFolderName} ({result.rootFolderId})
            </strong>
          </p>
          <p className="mt-1">
            {t("new")}: <strong>{result.newCount ?? 0}</strong>
            {" · "}
            {t("updated")}: <strong>{result.updatedCount ?? 0}</strong>
            {" · "}
            {t("errors")}: <strong>{result.errorCount ?? 0}</strong>
            {" · "}
            {t("skipped")}: <strong>{result.skippedCount ?? 0}</strong>
          </p>
        </div>
      )}

      {issues.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            {ti("issues", { errors: errors.length, warnings: warnings.length })}
          </h3>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs sm:text-sm">
            {issues.slice(0, 80).map((issue, i) => (
              <li
                key={i}
                className={
                  issue.level === "error" ? "text-red-700" : "text-amber-700"
                }
              >
                [{issue.level}] {issue.code}: {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result?.folders && result.folders.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-zinc-900">{t("folderResults")}</h3>
          {result.folders.map((folder) => (
            <div
              key={folder.folderId}
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
            >
              <h4 className="font-medium text-zinc-900">
                {folder.folderName}{" "}
                <span className="text-xs font-normal text-zinc-500">
                  ({tStatus(folder.status, folder.status)})
                </span>
              </h4>
              {folder.error ? (
                <p className="mt-1 text-sm text-amber-800">{folder.error}</p>
              ) : null}
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {folder.items.map((item) => (
                  <li key={`${folder.folderId}-${item.sourceName}`}>
                    <span
                      className={
                        item.status === "error"
                          ? "text-red-700"
                          : item.status === "new"
                            ? "text-green-700"
                            : item.status === "updated"
                              ? "text-wewin-navy"
                              : "text-zinc-500"
                      }
                    >
                      [{tStatus(item.status, item.status)}]
                    </span>{" "}
                    {item.sourceName}
                    {item.practiceUrl ? (
                      <>
                        {" → "}
                        <a
                          href={item.practiceUrl}
                          className="underline"
                        >
                          {item.slug}
                        </a>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
