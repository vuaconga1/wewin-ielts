import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { ImportIssue, ParsedTestDraft } from "./schemas";
import { canUsePrisma } from "@/lib/db";

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

          for (const q of part.questions) {
            const question = await tx.question.create({
              data: {
                sectionId: section.id,
                order: q.order,
                number: q.number,
                type: q.type,
                content: q.content as Prisma.InputJsonValue,
              },
            });

            if (q.correctAnswer !== undefined && q.correctAnswer !== null) {
              await tx.answerKey.create({
                data: {
                  questionId: question.id,
                  correctAnswer: q.correctAnswer as object,
                  acceptableAnswers: q.acceptableAnswers ?? undefined,
                  explanation: q.explanation,
                },
              });
            }
          }
        }

        if (draft.audioFiles?.length) {
          for (const filePath of draft.audioFiles) {
            await tx.mediaAsset.create({
              data: {
                testId: upserted.id,
                type: "AUDIO",
                path: filePath,
                label: filePath.split(/[/\\]/).pop(),
              },
            });
          }
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
