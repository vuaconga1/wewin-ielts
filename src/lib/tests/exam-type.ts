export const EXAM_TYPES = ["ACADEMIC", "GENERAL"] as const;

export type ExamType = (typeof EXAM_TYPES)[number];

export type ExamTypeModule = "academic" | "general";

const MODULE_BY_TYPE: Record<ExamType, ExamTypeModule> = {
  ACADEMIC: "academic",
  GENERAL: "general",
};

const TYPE_BY_MODULE: Record<ExamTypeModule, ExamType> = {
  academic: "ACADEMIC",
  general: "GENERAL",
};

export function normalizeExamType(value?: string | null): ExamType {
  const upper = value?.trim().toUpperCase();
  if (upper === "GENERAL") return "GENERAL";
  return "ACADEMIC";
}

export function examTypeFromModule(module: string): ExamType | null {
  const key = module.trim().toLowerCase();
  if (key === "academic" || key === "general") {
    return TYPE_BY_MODULE[key];
  }
  return null;
}

export function examTypeModulePath(examType?: string | null): string {
  const type = normalizeExamType(examType);
  return `/tests/${MODULE_BY_TYPE[type]}`;
}

export function isExamTypeModulePath(pathname: string): boolean {
  return pathname === "/tests/academic" || pathname === "/tests/general";
}
