/**
 * Import the center placement paper (Listening, Reading, Writing)
 * from `DE-IELTS/IELTS - At center` as examType PLACEMENT.
 *
 *   npx tsx scripts/import-placement-at-center.ts
 */

import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { parseTestFromFiles } from "../src/lib/import/pipeline";
import type { ParsedTestDraft, QuestionDraft } from "../src/lib/import/schemas";

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "DE-IELTS", "IELTS - At center");
const KEYS = path.join(SRC, "Placement keys.docx");

const LISTENING_ANSWERS: Record<number, string | string[]> = {
  1: "Fordyce",
  2: "07840051963",
  3: "Nurse",
  4: "Primary",
  5: "South",
  6: "Station",
  7: "Park",
  8: "House",
  9: "3",
  10: "Office",
  11: "C",
  12: "B",
  13: "A",
  14: "B",
  15: "A",
  16: "B",
  17: "C",
  18: "D",
  19: "C",
  20: "E",
  21: "A",
  22: "A",
  23: "C",
  24: "B",
  25: "A",
  26: "C",
  27: "D",
  28: "G",
  29: "E",
  30: "A",
  31: "Commercial",
  32: "Knowledge",
  33: "Lines",
  34: "Photography",
  35: "Advertise",
  36: "Foot",
  37: "Objects",
  38: "Newspapers",
  39: "Packaging",
  40: ["mathematics", "math", "maths"],
};

const READING_ANSWERS: Record<number, string> = {
  1: "TRUE",
  2: "NOT GIVEN",
  3: "FALSE",
  4: "TRUE",
  5: "TRUE",
  6: "NOT GIVEN",
  7: "FALSE",
  8: "strips",
  9: "sheep",
  10: "stretched",
  11: "bark",
  12: "Samarkand",
  13: "stone",
  14: "E",
  15: "I",
  16: "A",
  17: "G",
  18: "C",
  19: "F",
  20: "A",
  21: "E",
  22: "A",
  23: "B",
  24: "Sheltered",
  25: "Penguins",
  26: "Permit",
  27: "v",
  28: "iv",
  29: "vii",
  30: "ii",
  31: "viii",
  32: "vi",
  33: "iii",
  34: "B",
  35: "A",
  36: "C",
  37: "B",
  38: "Food",
  39: "Children",
  40: "Edible",
};

const STEP_OPTIONS = [
  { label: "A", text: "text handouts" },
  { label: "B", text: "questions" },
  { label: "C", text: "an outline" },
  { label: "D", text: "an introduction" },
  { label: "E", text: "statement" },
  { label: "F", text: "explain" },
  { label: "G", text: "research" },
];

const STEP_STEMS: Record<number, string> = {
  27: "Step 1. Write ______",
  28: "Step 2. ______ further on the topic",
  29: "Step 3. Put a ______ for every picture and support it",
  30: "Step 5. Write ______",
};

const CLASSIFY_OPTIONS = [
  { label: "A", text: "the first study" },
  { label: "B", text: "the second study" },
  { label: "C", text: "the third study" },
];

function findQuestion(draft: ParsedTestDraft, number: number): QuestionDraft {
  for (const part of draft.parts) {
    const q = part.questions.find((row) => row.number === number);
    if (q) return q;
  }
  throw new Error(`${draft.slug}: missing Q${number}`);
}

function applyAnswers(
  draft: ParsedTestDraft,
  answers: Record<number, string | string[]>,
) {
  for (const [raw, value] of Object.entries(answers)) {
    const q = findQuestion(draft, Number(raw));
    if (Array.isArray(value)) {
      q.correctAnswer = value[0];
      q.acceptableAnswers = value;
    } else {
      q.correctAnswer = value;
    }
  }
}

/**
 * Sentence completion like "37 More ______ will…" does not match the
 * inline-blank pattern (number must sit immediately before the gap).
 * Move the question number next to the gap so the input renders in the sentence.
 */
function placeSentenceBlankNumbers(content: string, numbers: number[]): string {
  let next = content;
  for (const n of numbers) {
    const re = new RegExp(
      `^${n}\\s+(.+?)\\s+((?:[.…_…]|\\.){2,}|_{2,})`,
      "m",
    );
    next = next.replace(re, `$1 ${n} $2`);
  }
  return next;
}

function fixListeningSteps(draft: ParsedTestDraft) {
  for (const number of [27, 28, 29, 30]) {
    const q = findQuestion(draft, number);
    q.type = "MULTIPLE_CHOICE";
    q.content = {
      stem: STEP_STEMS[number],
      options: STEP_OPTIONS,
    };
  }
}

function fixReadingClassifyAndSummary(draft: ParsedTestDraft) {
  for (const number of [34, 35, 36, 37]) {
    const q = findQuestion(draft, number);
    q.type = "MATCHING";
    q.content = { stem: "", options: CLASSIFY_OPTIONS };
  }
  for (const number of [38, 39, 40]) {
    const q = findQuestion(draft, number);
    q.type = "GAP_FILL";
    q.content = { stem: "", blank: true };
  }
}

async function copyListeningAudio(): Promise<string[]> {
  const destDir = path.join(ROOT, "public", "uploads", "audio");
  await mkdir(destDir, { recursive: true });
  const files: [string, string][] = [
    ["P1 (1).MP3", "placement-listening-section-1.mp3"],
    ["P2 (1).mp3", "placement-listening-section-2.mp3"],
    ["P3 (1).mp3", "placement-listening-section-3.mp3"],
    ["P4 (1).mp3", "placement-listening-section-4.mp3"],
  ];
  const urls: string[] = [];
  for (const [srcName, destName] of files) {
    await copyFile(path.join(SRC, srcName), path.join(destDir, destName));
    urls.push(`/uploads/audio/${destName}`);
  }
  return urls;
}

async function main() {
  const audioUrls = await copyListeningAudio();

  const jobs = [
    {
      file: "Placement test _ Listening.docx",
      skill: "LISTENING" as const,
      slug: "placement-listening",
      title: "IELTS Placement Test — Listening",
      audio: true,
    },
    {
      file: "Placement test _ Reading.docx",
      skill: "READING" as const,
      slug: "placement-reading",
      title: "IELTS Placement Test — Reading",
      audio: false,
    },
    {
      file: "Placement test _ Writing.docx",
      skill: "WRITING" as const,
      slug: "placement-writing",
      title: "IELTS Placement Test — Writing",
      audio: false,
    },
  ];

  const { saveTestDraft } = await import("../src/lib/store/test-store");
  const { persistParsedTest } = await import("../src/lib/import/persist");

  for (const job of jobs) {
    const { draft, issues } = await parseTestFromFiles({
      contentPath: path.join(SRC, job.file),
      keysPath: job.skill === "WRITING" ? undefined : KEYS,
      skill: job.skill,
      title: job.title,
      slug: job.slug,
      sourceFolder: SRC,
      examType: "PLACEMENT",
      tags: ["#IELTS Placement", `#${job.skill[0]}${job.skill.slice(1).toLowerCase()}`],
      audioFiles: job.audio ? audioUrls : undefined,
    });

    if (!draft) {
      console.error(job.slug, issues);
      throw new Error(`Parse failed: ${job.slug}`);
    }

    if (job.skill === "LISTENING") {
      fixListeningSteps(draft);
      const section4 = draft.parts.find((part) => part.order === 3);
      if (section4?.content) {
        section4.content = placeSentenceBlankNumbers(section4.content, [37, 39]);
      }
      applyAnswers(draft, LISTENING_ANSWERS);
      draft.parts.forEach((part, index) => {
        const url = audioUrls[index];
        if (!url) return;
        part.meta = { ...(part.meta ?? {}), audioUrl: url };
      });
    } else if (job.skill === "READING") {
      fixReadingClassifyAndSummary(draft);
      applyAnswers(draft, READING_ANSWERS);
    }

    const missing = draft.parts
      .flatMap((part) => part.questions)
      .filter(
        (q) =>
          q.type !== "ESSAY" &&
          q.type !== "SPEAKING_PROMPT" &&
          (q.correctAnswer === undefined || q.correctAnswer === null || q.correctAnswer === ""),
      )
      .map((q) => q.number);

    if (missing.length) {
      throw new Error(`${job.slug} still missing answers: ${missing.join(", ")}`);
    }

    const keptIssues = issues.filter((issue) => issue.code !== "MISSING_ANSWER");
    await saveTestDraft(draft);
    const result = await persistParsedTest(draft, keptIssues, {
      status: "PUBLISHED",
      force: keptIssues.some((issue) => issue.level === "error"),
    });
    const count = draft.parts.reduce((sum, part) => sum + part.questions.length, 0);
    console.log(
      `${job.slug}: ${count} questions, testId=${result.testId}, issues=${keptIssues.length}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
