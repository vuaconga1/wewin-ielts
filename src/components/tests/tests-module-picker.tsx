import Link from "next/link";
import { BookOpen, Briefcase } from "lucide-react";
import { getTranslations } from "@/i18n/server";

type Props = {
  academicCount: number;
  generalCount: number;
};

export async function TestsModulePicker({
  academicCount,
  generalCount,
}: Props) {
  const { t } = await getTranslations("tests");

  const modules = [
    {
      href: "/tests/academic",
      icon: BookOpen,
      title: t("moduleAcademic", "IELTS Academic"),
      desc: t(
        "moduleAcademicDesc",
        "Đề Academic cho Listening, Reading, Writing và Speaking.",
      ),
      count: academicCount,
      countLabel: t("moduleTestCount", { n: academicCount }, "{n} đề"),
      cta: t("moduleOpen", "Xem đề →"),
    },
    {
      href: "/tests/general",
      icon: Briefcase,
      title: t("moduleGeneral", "IELTS General Training"),
      desc: t(
        "moduleGeneralDesc",
        "Đề General Training cho Listening, Reading, Writing và Speaking.",
      ),
      count: generalCount,
      countLabel: t("moduleTestCount", { n: generalCount }, "{n} đề"),
      cta: t("moduleOpen", "Xem đề →"),
    },
  ] as const;

  return (
    <div data-tour="tests-modules" className="grid gap-4 sm:grid-cols-2 sm:gap-6">
      {modules.map((mod) => {
        const Icon = mod.icon;
        return (
          <Link
            key={mod.href}
            href={mod.href}
            className="card-outline-hover group flex min-w-0 flex-col overflow-hidden border-zinc-300"
          >
            <div className="flex items-center gap-3 bg-wewin-navy px-4 py-3 text-white sm:px-5">
              <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold leading-tight sm:text-lg">
                  {mod.title}
                </h2>
                <p className="text-xs text-white/85">{mod.countLabel}</p>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 border-t border-zinc-200 px-4 py-4 sm:px-5">
              <p className="text-sm leading-snug break-words text-zinc-600">
                {mod.desc}
              </p>
              <span className="mt-auto inline-flex w-fit rounded-md bg-wewin-accent-blue-bg px-2.5 py-1 text-xs font-bold text-wewin-navy group-hover:bg-wewin-navy group-hover:text-white">
                {mod.cta}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
