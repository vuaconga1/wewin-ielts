import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { ImportIssue, ParsedTestDraft } from "./schemas";
import { canUsePrisma } from "@/lib/db";
import { normalizeTestMapLabelLayouts } from "@/lib/questions/map-label-layout";
import { invalidateTestCatalogCache } from "@/lib/store/test-store";

function newRowId(): string {
  return `c${randomBytes(12).toString("hex")}`;
}

export type PersistOptions = {
  /** Persist even if there are error-level issues (not recommended) */
  force?: boolean;
  adminId?: string;
  status?: "DRAFT" | "PUBLISHED";
};

export type PersistResult = {
  testId: string | null;
  importJobId: string;
  issues: ImportIssue[];
  /** true when saved to MySQL; false if caller should rely on local JSON only */
  usedDatabase: boolean;
};

/**
 * Save a validated draft into MySQL:
 * Test → TestSection (parts) → Question → AnswerKey
 *
 * Falls back: if MySQL unavailable, throw — API route already saved local JSON.
 */
export async function persistParsedTest(
  draft: ParsedTestDraft,
  issues: ImportIssue[],
  options: PersistOptions = {},
): Promise<PersistResult> {
  if (!(await canUsePrisma())) {
    throw new Error(
      "Database không khả dụng. Draft đã lưu local (data/tests/). Cấu hình DATABASE_URL (Neon) rồi thử lại.",
    );
  }

  draft = normalizeTestMapLabelLayouts(draft);

  const fatal = issues.filter((i) => i.level === "error");
  if (fatal.length && !options.force) {
    const job = await prisma.importJob.create({
      data: {
        adminId: options.adminId,
        status: "FAILED",
        payload: draft as object,
        errors: fatal,
        sourceFiles: draft.sourceFolder
          ? { sourceFolder: draft.sourceFolder }
          : undefined,
      },
    });
    return { testId: null, importJobId: job.id, issues, usedDatabase: true };
  }

  const job = await prisma.importJob.create({
    data: {
      adminId: options.adminId,
      status: "PARSING",
      payload: draft as object,
      errors: issues.length ? issues : undefined,
    },
  });

  try {
    const test = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.test.findUnique({
          where: { slug: draft.slug },
        });
        if (existing) {
          await tx.testSection.deleteMany({ where: { testId: existing.id } });
          await tx.mediaAsset.deleteMany({ where: { testId: existing.id } });
        }

        const upserted = existing
          ? await tx.test.update({
              where: { id: existing.id },
              data: {
                title: draft.title,
                skill: draft.skill,
                examType: draft.examType,
                timeLimitMinutes: draft.timeLimitMinutes,
                tags: draft.tags ?? [],
                status: options.status ?? "DRAFT",
                sourceFolder: draft.sourceFolder,
                description: draft.description,
              },
            })
          : await tx.test.create({
              data: {
                title: draft.title,
                slug: draft.slug,
                skill: draft.skill,
                examType: draft.examType,
                timeLimitMinutes: draft.timeLimitMinutes,
                tags: draft.tags ?? [],
                status: options.status ?? "DRAFT",
                sourceFolder: draft.sourceFolder,
                description: draft.description,
              },
            });

        for (const part of draft.parts) {
          const section = await tx.testSection.create({
            data: {
              testId: upserted.id,
              title: part.title,
              order: part.order,
              questionCount: part.questions.length,
              content: part.content,
              meta: (part.meta ?? undefined) as Prisma.InputJsonValue | undefined,
            },
          });

          if (part.questions.length) {
            const questionRows = part.questions.map((q) => ({
              id: newRowId(),
              sectionId: section.id,
              order: q.order,
              number: q.number,
              type: q.type,
              content: q.content as Prisma.InputJsonValue,
              mediaUrl: q.mediaUrl,
              draft: q,
            }));
            await tx.question.createMany({
              data: questionRows.map(({ draft: _draft, ...row }) => row),
            });
            const answerRows = questionRows
              .filter(
                (row) =>
                  row.draft.correctAnswer !== undefined &&
                  row.draft.correctAnswer !== null,
              )
              .map((row) => ({
                id: newRowId(),
                questionId: row.id,
                correctAnswer: row.draft.correctAnswer as object,
                acceptableAnswers: row.draft.acceptableAnswers ?? undefined,
                explanation: row.draft.explanation,
              }));
            if (answerRows.length) {
              await tx.answerKey.createMany({ data: answerRows });
            }
          }
        }

        if (draft.audioFiles?.length) {
          await tx.mediaAsset.createMany({
            data: draft.audioFiles.map((filePath) => ({
              id: newRowId(),
              testId: upserted.id,
              type: "AUDIO" as const,
              path: filePath,
              label: filePath.split(/[/\\]/).pop(),
            })),
          });
        }

        return upserted;
      },
      // Large listening/reading papers exceed the default 5s interactive timeout.
      { maxWait: 15_000, timeout: 120_000 },
    );

    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: "PERSISTED",
        testId: test.id,
        errors: issues.length ? issues : undefined,
      },
    });

    invalidateTestCatalogCache();

    return {
      testId: test.id,
      importJobId: job.id,
      issues,
      usedDatabase: true,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errors: [...issues, { level: "error", code: "PERSIST_FAILED", message }],
      },
    });
    throw e;
  }
}
