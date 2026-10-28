/** Homework progress rules (pure — shared by teacher progress, CSV export and the learner popup). */

import { estimateBand } from "@/lib/scoring";

export type HomeworkSkill = "LISTENING" | "READING" | "WRITING" | "SPEAKING";

export type HomeworkAssignmentRef = {
  id: string;
  testId: string;
  skill: HomeworkSkill;
  sectionOrders: number[];
  questionCount: number;
  deadlineAt: Date;
  createdAt: Date;
};

export type HomeworkAttempt = {
  id: string;
  userId: string;
  testId: string;
  sectionOrders: number[];
  finishedAt: Date;
  correct: number | null;
  total: number | null;
  /** AI examiner band (Writing / Speaking) */
  aiBand: number | null;
  /** "Redo wrong answers" attempts only cover a subset of questions */
  partial: boolean;
  /** Speaking only: IELTS parts practised (null = whole test) */
  speakingPartKinds: number[] | null;
};

export type HomeworkProgress =
  | { status: "pending"; attemptCount: 0 }
  | {
      status: "done";
      attemptCount: number;
      bestAttemptId: string;
      correct: number | null;
      total: number | null;
      band: number | null;
      submittedAt: Date;
      isLate: boolean;
    };

/**
 * An attempt counts when it was submitted after the homework was assigned, on the
 * same test, and covers every assigned part (a full mock covers any part).
 */
export function attemptMatchesAssignment(
  attempt: HomeworkAttempt,
  assignment: HomeworkAssignmentRef,
): boolean {
  if (attempt.testId !== assignment.testId) return false;
  if (attempt.partial) return false;
  if (attempt.finishedAt.getTime() < assignment.createdAt.getTime()) return false;
  if (assignment.skill === "SPEAKING" && attempt.speakingPartKinds) {
    if (![1, 2, 3].every((kind) => attempt.speakingPartKinds!.includes(kind))) return false;
  }
  const covered = new Set(attempt.sectionOrders);
  return assignment.sectionOrders.every((order) => covered.has(order));
}

function isAiSkill(skill: HomeworkSkill) {
  return skill === "WRITING" || skill === "SPEAKING";
}

/** Best score wins; submission time is the FIRST matching submit (late re-tries keep the on-time flag). */
export function computeHomeworkProgress(
  assignment: HomeworkAssignmentRef,
  attempts: HomeworkAttempt[],
): HomeworkProgress {
  const matches = attempts
    .filter((attempt) => attemptMatchesAssignment(attempt, assignment))
    .sort((a, b) => a.finishedAt.getTime() - b.finishedAt.getTime());
  if (!matches.length) return { status: "pending", attemptCount: 0 };

  const ai = isAiSkill(assignment.skill);
  const scoreOf = (attempt: HomeworkAttempt) =>
    ai ? (attempt.aiBand ?? -1) : (attempt.correct ?? -1);
  let best = matches[0];
  for (const attempt of matches) {
    if (scoreOf(attempt) > scoreOf(best)) best = attempt;
  }

  const total = best.total && best.total > 0 ? best.total : assignment.questionCount || null;
  const band = ai
    ? best.aiBand
    : best.correct !== null && total
      ? estimateBand(best.correct, total)
      : null;
  const submittedAt = matches[0].finishedAt;
  return {
    status: "done",
    attemptCount: matches.length,
    bestAttemptId: best.id,
    correct: ai ? null : best.correct,
    total: ai ? null : total,
    band,
    submittedAt,
    isLate: submittedAt.getTime() > assignment.deadlineAt.getTime(),
  };
}

/** RFC 4180 cell; formula-looking cells get a leading quote so Excel/Sheets never evaluate them. */
export function csvCell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvCell).join(",");
}
