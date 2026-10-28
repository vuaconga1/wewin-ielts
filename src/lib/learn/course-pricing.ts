import type { GrammarCourse } from "@/lib/learn/vocab-grammar-types";

/** Retail price (VND) of restricted courses; courses without an entry are not sold online. */
const COURSE_PRICES_VND: Partial<Record<GrammarCourse, number>> = {
  "ielts-3-4": 2_000_000,
  "ielts-4-5": 2_250_000,
  "ielts-5-6": 2_500_000,
};

export function coursePriceVnd(course: GrammarCourse): number | null {
  return COURSE_PRICES_VND[course] ?? null;
}

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}
