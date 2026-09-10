import {
  detectSkillFromFilename,
  defaultTimeLimit,
  slugify,
  titleFromFilename,
  type Skill,
} from "./detect-skill";
import {
  extractFileWithMeta,
  extractTextFromFile,
  extractTextFromUpload,
  extractUploadWithMeta,
  normalizeExtractedText,
  type DocxExtractMeta,
} from "./docx";
import { mergeKeysIntoQuestions, parseKeysDocument } from "./parse-keys";
import {
  parseQuestionsFromPartBody,
  parseSpeakingTopicAsQuestion,
  parseWritingTaskAsQuestion,
} from "./parse-questions";
import { sanitizePartGapStems } from "@/lib/questions/gap-stems";
import {
  ParsedTestDraftSchema,
  type ImportIssue,
  type ImportParseResult,
  type PartDraft,
  type ParsedTestDraft,
} from "./schemas";
import { splitIntoParts } from "./split-parts";

export type ParseTestInput = {
  contentPath: string;
  keysPath?: string;
  skill?: Skill;
  title?: string;
  slug?: string;
  sourceFolder?: string;
  examType?: "ACADEMIC" | "GENERAL";
  timeLimitMinutes?: number;
  tags?: string[];
  audioFiles?: string[];
};

export type ParseTestUploadInput = {
  contentBuffer: Buffer;
  contentFilename: string;
  keysBuffer?: Buffer;
  keysFilename?: string;
  skill?: Skill;
  title?: string;
  slug?: string;
  sourceFolder?: string;
  driveFolderId?: string;
  driveFileIds?: Record<string, string>;
  examType?: "ACADEMIC" | "GENERAL";
  timeLimitMinutes?: number;
  tags?: string[];
  audioFiles?: string[];
};

export async function parseTestFromFiles(
  input: ParseTestInput,
): Promise<ImportParseResult> {
  const skill =
    input.skill ?? detectSkillFromFilename(input.contentPath) ?? undefined;

  let rawText: string;
  try {
    rawText = normalizeExtractedText(
      await extractTextFromFile(input.contentPath),
    );
  } catch (e) {
    return {
      draft: null,
      issues: [
        {
          level: "error",
          code: "READ_CONTENT_FAILED",
          message: e instanceof Error ? e.message : String(e),
        },
      ],
    };
  }

  let keysText: string | undefined;
  let keysMeta: DocxExtractMeta | undefined;
  if (input.keysPath) {
    try {
      keysMeta = await extractFileWithMeta(input.keysPath, {
        includeTables: true,
      });
      keysText = normalizeExtractedText(keysMeta.text);
    } catch (e) {
      return {
        draft: null,
        issues: [
          {
            level: "error",
            code: "READ_KEYS_FAILED",
            message: e instanceof Error ? e.message : String(e),
          },
        ],
      };
    }
  }

  return buildParseResult({
    rawText,
    keysText,
    keysMeta,
    skill,
    contentFilename: input.contentPath,
    title: input.title,
    slug: input.slug,
    sourceFolder: input.sourceFolder,
    examType: input.examType,
    timeLimitMinutes: input.timeLimitMinutes,
    tags: input.tags,
    audioFiles: input.audioFiles,
  });
}

export async function parseTestFromUpload(
  input: ParseTestUploadInput,
): Promise<ImportParseResult> {
  const skill =
    input.skill ??
    detectSkillFromFilename(input.contentFilename) ??
    undefined;

  let rawText: string;
  try {
    rawText = normalizeExtractedText(
      await extractTextFromUpload(input.contentBuffer, input.contentFilename),
    );
  } catch (e) {
    return {
      draft: null,
      issues: [
        {
          level: "error",
          code: "READ_CONTENT_FAILED",
          message: e instanceof Error ? e.message : String(e),
        },
      ],
    };
  }

  let keysText: string | undefined;
  let keysMeta: DocxExtractMeta | undefined;
  if (input.keysBuffer && input.keysFilename) {
    try {
      keysMeta = await extractUploadWithMeta(
        input.keysBuffer,
        input.keysFilename,
        { includeTables: true },
      );
      keysText = normalizeExtractedText(keysMeta.text);
    } catch (e) {
      return {
        draft: null,
        issues: [
          {
            level: "error",
            code: "READ_KEYS_FAILED",
            message: e instanceof Error ? e.message : String(e),
          },
        ],
      };
    }
  }

  return buildParseResult({
    rawText,
    keysText,
    keysMeta,
    skill,
    contentFilename: input.contentFilename,
    title: input.title,
    slug: input.slug,
    sourceFolder: input.sourceFolder,
    driveFolderId: input.driveFolderId,
    driveFileIds: input.driveFileIds,
    examType: input.examType,
    timeLimitMinutes: input.timeLimitMinutes,
    tags: input.tags,
    audioFiles: input.audioFiles,
  });
}

type BuildInput = {
  rawText: string;
  keysText?: string;
  keysMeta?: DocxExtractMeta;
  skill?: Skill;
  contentFilename: string;
  title?: string;
  slug?: string;
  sourceFolder?: string;
  driveFolderId?: string;
  driveFileIds?: Record<string, string>;
  examType?: "ACADEMIC" | "GENERAL";
  timeLimitMinutes?: number;
  tags?: string[];
  audioFiles?: string[];
};

function buildParseResult(input: BuildInput): ImportParseResult {
  const issues: ImportIssue[] = [];

  const skill =
    input.skill ?? detectSkillFromFilename(input.contentFilename) ?? null;
  if (!skill) {
    issues.push({
      level: "error",
      code: "SKILL_UNKNOWN",
      message:
        "Không nhận diện được skill từ tên file. Chọn LISTENING / READING / WRITING / SPEAKING.",
    });
    return { draft: null, issues };
  }

  let keysMap = parseKeysDocument("");
  if (input.keysText !== undefined) {
    keysMap = parseKeysDocument(input.keysText, { skill });
    if (keysMap.size === 0) {
      if (input.keysMeta?.looksImageOnly) {
        issues.push({
          level: "error",
          code: "KEYS_IMAGE_ONLY",
          message:
            `File keys gần như không có chữ (chỉ ~${input.keysMeta.imageCount} ảnh screenshot). ` +
            "Parser không đọc chữ trong ảnh — hãy dùng keys dạng text/bảng Word/Sheet " +
            "(xem docs/IMPORT_GUIDE.md → Keys).",
        });
      } else {
        issues.push({
          level: "warning",
          code: "KEYS_EMPTY",
          message:
            "File keys không parse được dòng đáp án nào. " +
            "Kiểm tra format `1. answer` / `Q1: answer` / bảng STT|Đáp án.",
        });
      }
    } else if (
      input.keysMeta &&
      input.keysMeta.imageCount > 0 &&
      keysMap.size < 10
    ) {
      issues.push({
        level: "warning",
        code: "KEYS_PARTIAL_IMAGES",
        message:
          `Keys chỉ parse được ${keysMap.size} đáp án nhưng file có ${input.keysMeta.imageCount} ảnh — ` +
          "có thể còn đáp án nằm trong screenshot. Nên chuyển toàn bộ keys sang text.",
      });
    }
  }

  const rawParts = splitIntoParts(input.rawText);
  if (rawParts.length === 1 && rawParts[0]!.title === "Full test") {
    issues.push({
      level: "warning",
      code: "PART_FALLBACK",
      message:
        'Không tìm thấy SECTION/PASSAGE — gộp thành 1 part "Full test".',
    });
  }

  const parts: PartDraft[] = rawParts.map((rp) => {
    let questions = parseQuestionsFromPartBody(rp.body);

    if (skill === "WRITING" && questions.length === 0 && rp.body.trim()) {
      const taskNum = /\bTask\s*([12])\b/i.exec(rp.title)?.[1];
      questions = [
        parseWritingTaskAsQuestion(
          rp.body,
          taskNum ? Number(taskNum) : rp.order + 1,
        ),
      ];
    }

    if (skill === "SPEAKING" && questions.length === 0 && rp.body.trim()) {
      questions = [
        parseSpeakingTopicAsQuestion(rp.body, rp.order + 1),
      ];
    }

    // Defense in depth: clear sliding-window gap stems when notes already
    // have numbered blanks in part.content (also covers legacy extractors).
    if (skill === "LISTENING" || skill === "READING") {
      const sanitized = sanitizePartGapStems(
        rp.title,
        rp.order,
        rp.body,
        questions,
      );
      questions = sanitized.questions;
      issues.push(...sanitized.issues);
    }

    if (skill === "WRITING") {
      questions = questions.map((q) => {
        if (q.type === "ESSAY") return q;
        const opts = (q.content as { options?: unknown[] }).options;
        if (opts && opts.length >= 2) return q;
        const taskNum = /\bTask\s*([12])\b/i.exec(rp.title)?.[1];
        const n = taskNum ? Number(taskNum) : q.number;
        return {
          ...q,
          type: "ESSAY" as const,
          content: {
            ...q.content,
            minWords:
              (q.content as { minWords?: number }).minWords ??
              (n === 1 ? 150 : 250),
          },
        };
      });
    }

    if (skill === "SPEAKING") {
      questions = questions.map((q) => {
        if (q.type === "SPEAKING_PROMPT") return q;
        const opts = (q.content as { options?: unknown[] }).options;
        if (opts && opts.length >= 2) return q;
        return { ...q, type: "SPEAKING_PROMPT" as const };
      });
    }

    questions = mergeKeysIntoQuestions(questions, keysMap);

    if (questions.length === 0) {
      issues.push({
        level: "warning",
        code: "PART_NO_QUESTIONS",
        message: `Part "${rp.title}" không có câu hỏi.`,
        partOrder: rp.order,
      });
    } else {
      const synthetic = questions.filter(
        (q) => (q.content as { synthetic?: boolean }).synthetic,
      );
      if (synthetic.length > 0) {
        issues.push({
          level: "warning",
          code: "PART_SYNTHETIC_QUESTIONS",
          message:
            `Part "${rp.title}": ${synthetic.length} câu được tạo từ header ` +
            `"Questions N–M" vì thiếu nội dung/chỗ trống trong text ` +
            `(thường do diagram/map nằm trong ảnh). Kiểm tra lại đề.`,
          partOrder: rp.order,
        });
      }
    }

    for (const q of questions) {
      if (q.correctAnswer === undefined || q.correctAnswer === null) {
        if (skill === "LISTENING" || skill === "READING") {
          issues.push({
            level: "error",
            code: "MISSING_ANSWER",
            message: `Q${q.number} (part "${rp.title}") thiếu đáp án.`,
            partOrder: rp.order,
            questionNumber: q.number,
          });
        }
      }
    }

    return {
      title: rp.title,
      order: rp.order,
      content: rp.body,
      meta: rp.meta,
      questions,
    };
  });

  const title = input.title ?? titleFromFilename(input.contentFilename);
  const slug = input.slug ?? slugify(title);

  const candidate: ParsedTestDraft = {
    title,
    slug,
    skill,
    examType: input.examType ?? "ACADEMIC",
    timeLimitMinutes: input.timeLimitMinutes ?? defaultTimeLimit(skill),
    tags: input.tags ?? defaultTags(skill),
    sourceFolder: input.sourceFolder,
    driveFolderId: input.driveFolderId,
    driveFileIds: input.driveFileIds,
    parts,
    audioFiles: input.audioFiles,
  };

  const validated = ParsedTestDraftSchema.safeParse(candidate);
  if (!validated.success) {
    for (const issue of validated.error.issues) {
      issues.push({
        level: "error",
        code: "ZOD_VALIDATION",
        message: `${issue.path.join(".")}: ${issue.message}`,
      });
    }
    return { draft: null, issues };
  }

  return { draft: validated.data, issues };
}

function defaultTags(skill: Skill): string[] {
  return [
    "#IELTS Academic",
    `#${skill.charAt(0)}${skill.slice(1).toLowerCase()}`,
  ];
}

export type { ParsedTestDraft, ImportIssue, PartDraft };
