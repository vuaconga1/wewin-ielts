"use client";

import Link from "next/link";
import {
  BookOpen,
  Ear,
  Mic,
  PenLine,
  Play,
  Video,
} from "lucide-react";
import type { IeltsSkill } from "@/lib/dashboard-stats";
import { useTranslations } from "@/i18n/provider";

const SKILLS: {
  skill: IeltsSkill;
  path: string;
  icon: typeof Ear;
}[] = [
  { skill: "LISTENING", path: "/learn/listening", icon: Ear },
  { skill: "READING", path: "/learn/reading", icon: BookOpen },
  { skill: "WRITING", path: "/learn/writing", icon: PenLine },
  { skill: "SPEAKING", path: "/learn/speaking", icon: Mic },
];

type SkillRow = {
  skill: IeltsSkill;
  testCount: number;
};

type Props = {
  skills: SkillRow[];
};

export function HomeSkillsRow({ skills }: Props) {
  const { t } = useTranslations("home");
  const { t: tSkills } = useTranslations("skills");

  return (
    <section className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
        <Video className="h-4 w-4 shrink-0 text-wewin-navy" aria-hidden />
        <h2 className="text-sm font-semibold text-zinc-800">
          {t("skillsRowTitle", "Học qua video / Học 4 kỹ năng")}
        </h2>
        <div className="flex min-w-0 flex-wrap gap-1.5">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            {t("badgeFree", "Miễn phí")}
          </span>
          <span className="rounded-full bg-wewin-accent-blue-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-wewin-navy">
            {t("badgeVideo", "Video bài giảng")}
          </span>
        </div>
        <Link
          href="/learn"
          className="ml-auto text-xs font-medium text-wewin-navy hover:underline"
        >
          {t("viewAllSkills", "Tất cả kỹ năng >")}
        </Link>
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        {SKILLS.map(({ skill, path, icon: Icon }) => {
          const row = skills.find((s) => s.skill === skill);
          return (
            <Link
              key={skill}
              href={path}
              className="wewin-card-3d wewin-card-3d-hover group relative w-[min(220px,70vw)] shrink-0 overflow-hidden"
            >
              <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-wewin-navy to-wewin-navy-hover">
                <Icon className="h-10 w-10 text-white/90" aria-hidden />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-wewin-navy opacity-90 shadow-md">
                    <Play className="h-4 w-4 fill-wewin-navy" aria-hidden />
                  </span>
                </span>
              </div>
              <div className="space-y-1 p-3">
                <p className="truncate text-sm font-bold text-zinc-900">
                  {tSkills(skill)}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {tSkills(`vi.${skill}`)}
                  {row?.testCount
                    ? ` · ${t("testCount", { n: row.testCount }, "{n} đề")}`
                    : ""}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
