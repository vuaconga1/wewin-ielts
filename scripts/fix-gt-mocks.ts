/**
 * Phase 5: normalize the four published partial General Training mock papers.
 * Dry-run by default; pass --apply to update existing records in one transaction.
 * No missing questions or Writing Task 2 are invented.
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import type { ParsedTestDraft, QuestionDraft } from "../src/lib/import/schemas";
import {
  normalizePublishedMockDraft,
  PUBLISHED_MOCK_SLUGS,
} from "../src/lib/import/normalize-mock-tests";

const APPLY = process.argv.includes("--apply");
const expectedQuestionCounts = new Map([
  ["general-listening-mocktest-1", 20],
  ["general-reading-grade-8", 30],
  ["general-reading-mocktest-1", 12],
  ["general-writing-mocktest-1", 1],
]);

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

async function main() {
  const tests = await prisma.test.findMany({
    where: { slug: { in: [...PUBLISHED_MOCK_SLUGS] } },
    orderBy: { slug: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      skill: true,
      examType: true,
      timeLimitMinutes: true,
      tags: true,
      status: true,
      practiceCount: true,
      sourceFolder: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { attempts: true } },
      media: { orderBy: { path: "asc" } },
      sections: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          questionCount: true,
          content: true,
          meta: true,
          questions: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              sectionId: true,
              order: true,
              number: true,
              type: true,
              content: true,
              mediaUrl: true,
              answerKey: true,
              _count: { select: { attemptAnswers: true } },
            },
          },
        },
      },
    },
  });
  if (tests.length !== PUBLISHED_MOCK_SLUGS.length) {
    throw new Error(`Expected ${PUBLISHED_MOCK_SLUGS.length} mocks, found ${tests.length}`);
  }

  const problems: string[] = [];
  const sectionUpdates = new Map<string, { title?: string; content?: string | null }>();
  const questionUpdates = new Map<string, { type?: QuestionDraft["type"]; content?: Record<string, unknown> }>();
  const attempts = await prisma.attempt.findMany({
    where: { testId: { in: tests.map((test) => test.id) } },
    orderBy: { startedAt: "asc" },
    select: {
      id: true,
      testId: true,
      userId: true,
      mode: true,
      sectionIds: true,
      startedAt: true,
      finishedAt: true,
      scoreRaw: true,
      scoreBand: true,
      payload: true,
      answers: true,
    },
  });
  const attemptAnswerCount = attempts.reduce((sum, attempt) => sum + attempt.answers.length, 0);
  if (attemptAnswerCount !== 0) {
    problems.push(`Expected 0 attempt answers before structural normalization, found ${attemptAnswerCount}`);
  }

  for (const test of tests) {
    const questionCount = test.sections.reduce((sum, section) => sum + section.questions.length, 0);
    if (test.status !== "PUBLISHED") problems.push(`${test.slug}: status=${test.status}`);
    if (questionCount !== expectedQuestionCounts.get(test.slug)) {
      problems.push(`${test.slug}: question count ${questionCount}`);
    }

    const draft: ParsedTestDraft = {
      title: test.title,
      slug: test.slug,
      skill: test.skill,
      examType: test.examType,
      ...(test.timeLimitMinutes ? { timeLimitMinutes: test.timeLimitMinutes } : {}),
      ...(Array.isArray(test.tags) ? { tags: test.tags.filter((tag): tag is string => typeof tag === "string") } : {}),
      ...(test.sourceFolder ? { sourceFolder: test.sourceFolder } : {}),
      ...(test.description ? { description: test.description } : {}),
      parts: test.sections.map((section) => ({
        title: section.title,
        order: section.order,
        ...(section.content != null ? { content: section.content } : {}),
        ...(object(section.meta) ? { meta: object(section.meta) } : {}),
        questions: section.questions.map((question) => ({
          number: question.number,
          order: question.order,
          type: question.type,
          content: object(question.content),
          ...(question.mediaUrl ? { mediaUrl: question.mediaUrl } : {}),
          ...(question.answerKey ? {
            correctAnswer: question.answerKey.correctAnswer,
            ...(Array.isArray(question.answerKey.acceptableAnswers)
              ? { acceptableAnswers: question.answerKey.acceptableAnswers.filter((answer): answer is string => typeof answer === "string") }
              : {}),
            ...(question.answerKey.explanation ? { explanation: question.answerKey.explanation } : {}),
          } : {}),
        })),
      })),
    };
    const normalized = normalizePublishedMockDraft(draft);
    for (let sectionIndex = 0; sectionIndex < test.sections.length; sectionIndex += 1) {
      const before = test.sections[sectionIndex]!;
      const after = normalized.parts[sectionIndex]!;
      const patch: { title?: string; content?: string | null } = {};
      if (before.title !== after.title) patch.title = after.title;
      if ((before.content ?? "") !== (after.content ?? "")) patch.content = after.content ?? null;
      if (Object.keys(patch).length) sectionUpdates.set(before.id, patch);

      for (let questionIndex = 0; questionIndex < before.questions.length; questionIndex += 1) {
        const oldQuestion = before.questions[questionIndex]!;
        const newQuestion = after.questions[questionIndex]!;
        if (oldQuestion.id === undefined || oldQuestion.number !== newQuestion.number || oldQuestion.order !== newQuestion.order) {
          problems.push(`${test.slug}: Q${oldQuestion.number} identity/order mismatch`);
          continue;
        }
        const patchQuestion: { type?: QuestionDraft["type"]; content?: Record<string, unknown> } = {};
        if (oldQuestion.type !== newQuestion.type) patchQuestion.type = newQuestion.type;
        if (JSON.stringify(object(oldQuestion.content)) !== JSON.stringify(newQuestion.content)) {
          patchQuestion.content = newQuestion.content;
        }
        if (Object.keys(patchQuestion).length) questionUpdates.set(oldQuestion.id, patchQuestion);
      }
    }
  }

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log(`tests=${tests.length} attempts=${attempts.length} attemptAnswers=${attemptAnswerCount}`);
  console.log(`section updates=${sectionUpdates.size}, question updates=${questionUpdates.size}, creates=0, deletes=0`);
  if (problems.length) {
    for (const problem of problems) console.error(`PROBLEM ${problem}`);
    throw new Error(`Aborted: ${problems.length} validation problem(s)`);
  }
  if (!APPLY) return;

  await mkdir(".tmp-import/phase5", { recursive: true });
  const backupPath = path.join(
    ".tmp-import",
    "phase5",
    `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await writeFile(backupPath, JSON.stringify({ tests, attempts }, null, 2), "utf8");
  await prisma.$transaction(async (tx) => {
    for (const [id, data] of sectionUpdates) {
      await tx.testSection.update({ where: { id }, data });
    }
    for (const [id, data] of questionUpdates) {
      await tx.question.update({ where: { id }, data: data as never });
    }
  }, { maxWait: 20_000, timeout: 120_000 });
  console.log(`APPLIED in one transaction; backup=${backupPath}`);
}

main().finally(() => prisma.$disconnect());
