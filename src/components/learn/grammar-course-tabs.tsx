import Link from "next/link";
import { Lock } from "lucide-react";
import { learnVocabGrammarTrackHref } from "@/lib/learn/hrefs";
import { GRAMMAR_COURSES, type GrammarCourse } from "@/lib/learn/vocab-grammar-types";

type Props = {
  active: GrammarCourse;
  labels: Record<GrammarCourse, string>;
  locked: Partial<Record<GrammarCourse, boolean>>;
  lockedLabel: string;
};

export function GrammarCourseTabs({ active, labels, locked, lockedLabel }: Props) {
  return (
    <nav
      role="tablist"
      className="flex min-w-0 gap-2 overflow-x-auto overflow-y-hidden border-b border-zinc-200"
    >
      {GRAMMAR_COURSES.map((course) => {
        const isActive = course === active;
        return (
          <Link
            key={course}
            role="tab"
            aria-selected={isActive}
            href={learnVocabGrammarTrackHref("grammar", course)}
            className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "border-wewin-navy text-wewin-navy"
                : "border-transparent text-zinc-500 hover:text-wewin-navy"
            }`}
          >
            {locked[course] ? (
              <Lock className="h-3.5 w-3.5" aria-label={lockedLabel} />
            ) : null}
            {labels[course]}
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
