import Link from "next/link";
import { BookOpen, Briefcase, ClipboardCheck } from "lucide-react";
import { getTranslations } from "@/i18n/server";

type Props = {
  academicCount: number;
  generalCount: number;
  placementCount: number;
};

export async function TestsModulePicker({
  academicCount,
  generalCount,
  placementCount,
}: Props) {
  const { t } = await getTranslations("tests");

  /** Ordered easiest → hardest; equal depth, one hue per module. */
  const modules = [
    {
      href: "/tests/placement",
      icon: ClipboardCheck,
      title: t("modulePlacement", "IELTS Placement Test"),
      desc: t(
        "modulePlacementDesc",
        "Đề xếp lớp cho Listening, Reading và Writing.",
      ),
      countLabel: t("moduleTestCount", { n: placementCount }, "{n} đề"),
      cta: t("moduleOpen", "Xem đề →"),
      level: t("levelEasy", "Cơ bản"),
      levelDots: 1,
      headerClass: "bg-gradient-to-br from-[#0f766e] to-[#073b38] text-white",
      titleClass: "text-white",
      countClass: "text-[#99f6e4]",
      iconBoxClass: "bg-white/15 text-[#99f6e4] ring-1 ring-white/25",
      chipClass: "bg-white/15 text-[#99f6e4] ring-1 ring-white/25",
      dotOn: "bg-[#99f6e4]",
      dotOff: "bg-white/20",
      bodyClass: "bg-gradient-to-b from-[#ecfdf9] to-white",
      descClass: "text-[#073b38]/80",
      ctaClass:
        "bg-[#0f766e] border-[#0f766e] text-white group-hover:bg-[#073b38] group-hover:border-[#073b38]",
      borderHoverClass: "hover:border-[#0f766e]",
    },
    {
      href: "/tests/general",
      icon: Briefcase,
      title: t("moduleGeneral", "IELTS General Training"),
      desc: t(
        "moduleGeneralDesc",
        "Đề General Training cho Listening, Reading, Writing và Speaking.",
      ),
      countLabel: t("moduleTestCount", { n: generalCount }, "{n} đề"),
      cta: t("moduleOpen", "Xem đề →"),
      level: t("levelMedium", "Trung cấp"),
      levelDots: 2,
      headerClass: "bg-gradient-to-br from-[#a16207] to-[#4f3104] text-white",
      titleClass: "text-white",
      countClass: "text-[#fde68a]",
      iconBoxClass: "bg-white/15 text-[#fde68a] ring-1 ring-white/25",
      chipClass: "bg-white/15 text-[#fde68a] ring-1 ring-white/25",
      dotOn: "bg-[#fde68a]",
      dotOff: "bg-white/20",
      bodyClass: "bg-gradient-to-b from-[#fef8e7] to-white",
      descClass: "text-[#4f3104]/80",
      ctaClass:
        "bg-[#a16207] border-[#a16207] text-white group-hover:bg-[#4f3104] group-hover:border-[#4f3104]",
      borderHoverClass: "hover:border-[#a16207]",
    },
    {
      href: "/tests/academic",
      icon: BookOpen,
      title: t("moduleAcademic", "IELTS Academic"),
      desc: t(
        "moduleAcademicDesc",
        "Đề Academic cho Listening, Reading, Writing và Speaking.",
      ),
      countLabel: t("moduleTestCount", { n: academicCount }, "{n} đề"),
      cta: t("moduleOpen", "Xem đề →"),
      level: t("levelHard", "Nâng cao"),
      levelDots: 3,
      headerClass: "bg-gradient-to-br from-[#1e40af] to-[#0b1a4a] text-white",
      titleClass: "text-white",
      countClass: "text-[#bfdbfe]",
      iconBoxClass: "bg-white/15 text-[#bfdbfe] ring-1 ring-white/25",
      chipClass: "bg-white/15 text-[#bfdbfe] ring-1 ring-white/25",
      dotOn: "bg-[#bfdbfe]",
      dotOff: "bg-white/20",
      bodyClass: "bg-gradient-to-b from-[#eef3ff] to-white",
      descClass: "text-[#0b1a4a]/80",
      ctaClass:
        "bg-[#1e40af] border-[#1e40af] text-white group-hover:bg-[#0b1a4a] group-hover:border-[#0b1a4a]",
      borderHoverClass: "hover:border-[#1e40af]",
    },
  ];

  return (
    <div data-tour="tests-modules" className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {modules.map((mod) => {
        const Icon = mod.icon;
        return (
          <Link
            key={mod.href}
            href={mod.href}
            className={`card-outline-hover group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all ${mod.borderHoverClass}`}
          >
            <div
              className={`flex items-center gap-3 px-4 py-3.5 sm:px-5 ${mod.headerClass}`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${mod.iconBoxClass}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className={`break-words text-base font-bold leading-tight sm:text-lg ${mod.titleClass}`}>
                  {mod.title}
                </h2>
                <p className={`text-xs font-medium ${mod.countClass}`}>{mod.countLabel}</p>
              </div>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${mod.chipClass}`}>
                  {mod.level}
                </span>
                <span className="flex gap-0.5" aria-hidden>
                  {[1, 2, 3].map((d) => (
                    <span
                      key={d}
                      className={`h-1.5 w-3 rounded-full ${d <= mod.levelDots ? mod.dotOn : mod.dotOff}`}
                    />
                  ))}
                </span>
              </span>
            </div>
            <div className={`flex flex-1 flex-col gap-3 px-4 py-4 sm:px-5 ${mod.bodyClass}`}>
              <p className={`text-sm leading-snug break-words ${mod.descClass}`}>
                {mod.desc}
              </p>
              <span
                className={`mt-auto inline-flex w-fit items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${mod.ctaClass}`}
              >
                {mod.cta}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
