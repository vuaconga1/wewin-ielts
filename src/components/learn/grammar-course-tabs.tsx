import Link from "next/link";
import { Lock } from "lucide-react";
import { learnVocabGrammarTrackHref } from "@/lib/learn/hrefs";
import { GRAMMAR_COURSES, type GrammarCourse } from "@/lib/learn/vocab-grammar-types";

type Props = {
  active: GrammarCourse;
  labels: Record<GrammarCourse, string>;
  locked: Partial<Record<GrammarCourse, boolean>>;
  lockedLabel: string;
  /** Small highlight chip per course, e.g. "Mới". */
  badges?: Partial<Record<GrammarCourse, string>>;
};

export function GrammarCourseTabs({ active, labels, locked, lockedLabel, badges }: Props) {
  return (
    <nav
      role="tablist"
      className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible"
    >
      {GRAMMAR_COURSES.map((course) => {
        const isActive = course === active;
        const badge = badges?.[course];
        return (
          <Link
            key={course}
            role="tab"
            aria-selected={isActive}
            href={learnVocabGrammarTrackHref("grammar", course)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold transition sm:text-base ${
              isActive
                ? "border-wewin-navy bg-wewin-navy text-white shadow-md"
                : "border-wewin-navy/20 bg-wewin-accent-blue-bg text-wewin-navy hover:border-wewin-navy hover:shadow-sm"
            }`}
          >
            {locked[course] ? (
              <Lock className="h-4 w-4 shrink-0" aria-label={lockedLabel} />
            ) : null}
            <span className="whitespace-nowrap">{labels[course]}</span>
            {badge ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase leading-none tracking-wide ${
                  isActive ? "bg-white text-wewin-navy" : "bg-wewin-navy text-white"
                }`}
              >
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

type LockedProps = {
  title: string;
  description: string;
  cta?: { href: string; label: string };
};

export function GrammarCourseLocked({ title, description, cta }: LockedProps) {
  return (
    <div className="card-outline px-6 py-14 text-center">
      <Lock className="mx-auto h-10 w-10 text-zinc-400" />
      <h2 className="mt-4 break-words text-lg font-bold text-zinc-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md break-words text-sm text-zinc-600">{description}</p>
      {cta ? (
        <Link
          href={cta.href}
          className="mt-6 inline-flex rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
