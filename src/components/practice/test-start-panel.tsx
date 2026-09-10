"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { friendlyError } from "@/lib/ui/friendly-error";
import { FriendlyErrorAlert } from "@/components/ui/friendly-error-alert";
import { useTranslations } from "@/i18n/provider";

type Part = {
  title: string;
  order: number;
  questions: { number: number }[];
};

type Props = {
  slug: string;
  parts: Part[];
  defaultTimeLimit: number | null;
};

export function TestStartPanel({ slug, parts, defaultTimeLimit }: Props) {
  const router = useRouter();
  const { t } = useTranslations();
  const te = useTranslations("errors").t;
  const [tab, setTab] = useState<"practice" | "full">("practice");
  const [selected, setSelected] = useState<number[]>(parts.map((p) => p.order));
  const [timeLimit, setTimeLimit] = useState<string>(
    defaultTimeLimit ? String(defaultTimeLimit) : "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; detail?: string } | null>(
    null,
  );

  const totalQuestions = useMemo(() => {
    const orders = tab === "full" ? parts.map((p) => p.order) : selected;
    return parts
      .filter((p) => orders.includes(p.order))
      .reduce((sum, p) => sum + p.questions.length, 0);
  }, [tab, selected, parts]);

  function toggle(order: number) {
    setSelected((prev) =>
      prev.includes(order) ? prev.filter((o) => o !== order) : [...prev, order],
    );
  }

  function toggleAll() {
    if (selected.length === parts.length) setSelected([]);
    else setSelected(parts.map((p) => p.order));
  }

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          mode: tab === "full" ? "FULL" : "PRACTICE",
          sectionOrders: tab === "full" ? parts.map((p) => p.order) : selected,
          timeLimitMinutes: timeLimit === "" ? null : Number(timeLimit),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const mapped = friendlyError(
          data.error,
          t("startPanel.startFailed"),
          te,
        );
        if (data.error) console.warn("[practice/start]", data.error);
        setError(mapped);
        return;
      }
      router.push(data.redirect);
    } catch (e) {
      console.warn("[practice/start]", e);
      setError(friendlyError(e, t("startPanel.networkError"), te));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-outline overflow-hidden">
      <div className="flex border-b border-zinc-200">
        {(
          [
            ["practice", t("startPanel.practice")],
            ["full", t("startPanel.full")],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              tab === key
                ? "border-b-2 border-wewin-navy text-wewin-navy"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-5 p-5">
        {tab === "practice" ? (
          <>
            <div className="rounded-lg bg-wewin-accent-blue-bg px-4 py-3 text-sm text-wewin-navy">
              {t("startPanel.practiceHint")}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="min-w-0 text-sm font-semibold text-zinc-800">
                  {t("startPanel.selectParts")}
                </h3>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="shrink-0 text-xs text-wewin-navy hover:underline"
                >
                  {selected.length === parts.length
                    ? t("startPanel.deselectAll")
                    : t("startPanel.selectAll")}
                </button>
              </div>
              <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 p-3">
                {parts.map((part) => (
                  <li key={part.order}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={selected.includes(part.order)}
                        onChange={() => toggle(part.order)}
                      />
                      <span className="min-w-0 break-words">
                        {part.title}{" "}
                        <span className="text-zinc-500">
                          {t("startPanel.partQuestions", {
                            n: part.questions.length,
                          })}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-wewin-navy/15 bg-wewin-accent-blue-bg px-4 py-3 text-sm text-wewin-navy">
            {t("startPanel.fullHint", {
              parts: parts.length,
              questions: totalQuestions,
              minutes: defaultTimeLimit ?? 60,
            })}
          </div>
        )}

        <div>
          <label className="text-sm font-semibold text-zinc-800">
            {t("startPanel.timeLimit")}
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
          >
            <option value="">{t("startPanel.noLimit")}</option>
            {[15, 20, 30, 40, 60, 90].map((m) => (
              <option key={m} value={m}>
                {t("common.minutes", { n: m })}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500">{t("startPanel.timeHint")}</p>
        </div>

        {error ? (
          <FriendlyErrorAlert message={error.message} detail={error.detail} />
        ) : null}

        <button
          type="button"
          disabled={loading || (tab === "practice" && selected.length === 0)}
          onClick={start}
          className="w-full rounded-lg bg-wewin-navy py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-wewin-navy-hover disabled:opacity-50"
        >
          {loading
            ? t("startPanel.creating")
            : tab === "full"
              ? t("startPanel.startExam")
              : t("startPanel.startPractice", { n: totalQuestions })}
        </button>
      </div>
    </div>
  );
}
