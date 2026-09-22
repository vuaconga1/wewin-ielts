"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/i18n/provider";

export type CatalogTest = {
  slug: string;
  title: string;
  skill: string;
  examType?: string;
  timeLimitMinutes?: number | null;
  tags?: string[];
  partsCount: number;
  questionCount: number;
  hasAudio?: boolean;
  savedAt?: string;
};

const SKILLS = ["ALL", "LISTENING", "READING", "WRITING", "SPEAKING"] as const;
const PAGE_SIZE = 12;

const SKILL_COLOR: Record<string, string> = {
  LISTENING: "bg-wewin-accent-blue-bg text-wewin-navy",
  READING: "bg-wewin-bg text-wewin-navy ring-1 ring-wewin-navy/15",
  WRITING: "bg-white text-wewin-navy ring-1 ring-wewin-navy/25",
  SPEAKING: "bg-wewin-navy/10 text-wewin-navy",
};

function parseSkill(value?: string): (typeof SKILLS)[number] {
  const upper = value?.trim().toUpperCase();
  if (upper && (SKILLS as readonly string[]).includes(upper)) {
    return upper as (typeof SKILLS)[number];
  }
  return "ALL";
}

function parsePage(value: string | null): number {
  const n = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Compact page list: 1 … window … last */
function pageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) out.push("ellipsis");
    out.push(sorted[i]!);
  }
  return out;
}

export function TestsCatalog({
  tests,
  initialSkill,
}: {
  tests: CatalogTest[];
  initialSkill?: string;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [skill, setSkill] = useState<(typeof SKILLS)[number]>(() =>
    parseSkill(initialSkill ?? searchParams.get("skill") ?? undefined),
  );
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");

  const tagSet = new Set<string>();
  for (const row of tests) {
    for (const x of row.tags ?? []) tagSet.add(x);
  }
  const allTags = [...tagSet].sort();

  const q = query.trim().toLowerCase();
  const filtered = tests.filter((row) => {
    if (skill !== "ALL" && row.skill !== skill) return false;
    if (tag && !(row.tags ?? []).includes(tag)) return false;
    if (!q) return true;
    const hay = `${row.title} ${row.slug} ${(row.tags ?? []).join(" ")}`.toLowerCase();
    return hay.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const requestedPage = parsePage(searchParams.get("page"));
  const page = Math.min(requestedPage, totalPages);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function writePageToUrl(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function goToPage(nextPage: number) {
    writePageToUrl(Math.min(Math.max(1, nextPage), totalPages));
  }

  // Reset to page 1 when filters change (skip mount so ?page= stays shareable)
  const filtersKey = `${skill}\0${query}\0${tag}`;
  const prevFiltersKey = useRef(filtersKey);
  useEffect(() => {
    if (prevFiltersKey.current === filtersKey) return;
    prevFiltersKey.current = filtersKey;
    writePageToUrl(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when filters change
  }, [filtersKey]);

  // Normalize out-of-range ?page= in the URL after filter shrink
  useEffect(() => {
    if (requestedPage > totalPages) writePageToUrl(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedPage, totalPages]);

  const showPagination = filtered.length > 0 && totalPages > 1;

  return (
    <div className="space-y-6">
      <div data-tour="tests-filters" className="card-outline p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder={t(
              "tests.searchPlaceholder",
              "Tìm đề theo tên, slug, tag…",
            )}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg"
          />
          <select
            className="w-full min-w-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:w-auto"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            <option value="">{t("tests.allTags", "Tất cả tag")}</option>
            {allTags.map((tagName) => (
              <option key={tagName} value={tagName}>
                {tagName}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-200 pt-3">
          {SKILLS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSkill(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                skill === s
                  ? "border-wewin-navy bg-wewin-navy text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {s === "ALL"
                ? t("tests.allSkills", "Tất cả")
                : t(`skills.${s}`, s)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          data-tour="tests-catalog"
          className="wewin-card-3d border-dashed border-wewin-accent-blue px-6 py-12 text-center"
        >
          <h2 className="text-lg font-semibold text-zinc-900">
            {t("tests.noMatchTitle", "Không tìm thấy đề phù hợp")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
            {t(
              "tests.noMatchDesc",
              "Thử đổi từ khóa, kỹ năng hoặc bỏ bộ lọc tag để xem thêm đề.",
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSkill("ALL");
              setTag("");
            }}
            className="mt-6 inline-flex rounded-lg bg-wewin-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
          >
            {t("tests.clearFilters", "Xóa bộ lọc")}
          </button>
        </div>
      ) : (
        <>
          <div data-tour="tests-catalog" className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-5">
            {pageItems.map((row) => (
              <article
                key={row.slug}
                className="card-outline-hover flex flex-col p-5"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded border border-transparent px-2 py-0.5 text-xs font-semibold ${
                      SKILL_COLOR[row.skill] ?? "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {t(`skills.${row.skill}`, row.skill)}
                  </span>
                  {row.examType === "GENERAL" ? (
                    <span className="rounded border border-wewin-navy/20 bg-wewin-accent-blue-bg px-2 py-0.5 text-xs font-medium text-wewin-navy">
                      {t("examTypes.GENERAL", "General")}
                    </span>
                  ) : row.examType === "ACADEMIC" ? (
                    <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-700">
                      {t("examTypes.ACADEMIC", "Academic")}
                    </span>
                  ) : null}
                  {row.hasAudio ? (
                    <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
                      {t("common.audio", "Audio")}
                    </span>
                  ) : null}
                </div>
                <h2 className="break-words text-lg font-semibold text-zinc-900">
                  {row.title}
                </h2>
                <p className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-600">
                  <span>
                    {row.timeLimitMinutes != null
                      ? t("common.minutes", { n: row.timeLimitMinutes })
                      : t("common.dash", "—")}
                  </span>
                  <span>
                    {t("common.partsQuestions", {
                      parts: row.partsCount,
                      questions: row.questionCount,
                    })}
                  </span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(row.tags ?? []).slice(0, 4).map((tagName) => (
                    <span key={tagName} className="text-xs text-wewin-navy">
                      {tagName}
                    </span>
                  ))}
                </div>
                <div className="mt-auto border-t border-zinc-200 pt-4">
                  <Link
                    href={`/tests/${row.slug}`}
                    prefetch={false}
                    className="inline-block rounded-lg border border-wewin-navy px-4 py-2 text-sm font-medium text-wewin-navy hover:bg-wewin-accent-blue-bg"
                  >
                    {t("tests.detailCta", "Chi tiết / Làm bài")}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {showPagination ? (
            <nav
              className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
              aria-label={t("tests.paginationLabel", "Phân trang danh sách đề")}
            >
              <p className="min-w-0 text-center text-sm text-zinc-600 sm:text-left">
                {t(
                  "tests.pageOf",
                  { page, total: totalPages },
                  "Trang {page} / {total}",
                )}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  className="rounded-lg border border-wewin-navy px-3 py-2 text-sm font-medium text-wewin-navy hover:bg-wewin-accent-blue-bg disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400 disabled:hover:bg-transparent"
                >
                  {t("tests.prevPage", "Trước")}
                </button>
                {pageNumbers(page, totalPages).map((item, idx) =>
                  item === "ellipsis" ? (
                    <span
                      key={`e-${idx}`}
                      className="px-1 text-sm text-zinc-400"
                      aria-hidden
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      aria-current={item === page ? "page" : undefined}
                      onClick={() => goToPage(item)}
                      className={`min-w-9 rounded-lg border px-3 py-2 text-sm font-medium ${
                        item === page
                          ? "border-wewin-navy bg-wewin-navy text-white"
                          : "border-zinc-200 bg-white text-wewin-navy hover:bg-wewin-accent-blue-bg"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                  className="rounded-lg border border-wewin-navy px-3 py-2 text-sm font-medium text-wewin-navy hover:bg-wewin-accent-blue-bg disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400 disabled:hover:bg-transparent"
                >
                  {t("tests.nextPage", "Sau")}
                </button>
              </div>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
