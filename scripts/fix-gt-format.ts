/**
 * Phase 4: normalize Cambridge General Training format data (A12/A13, E1-E15).
 * Dry-run by default; pass --apply to write one transaction. Existing IDs and
 * attempt data are preserved. Speaking keeps the original first question ID.
 */
import "dotenv/config";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import {
  normalizeGeneralWritingTask,
  normalizeSpeakingPart2Stem,
  parseSpeakingPartQuestions,
  type SpeakingPartKind,
} from "../src/lib/import/normalize-writing-speaking";

type JsonObject = Record<string, unknown>;
type SectionPatch = {
  title?: string;
  content?: string | null;
  questionCount?: number;
  meta?: JsonObject;
};
type QuestionPatch = {
  number?: number;
  order?: number;
  type?: "GAP_FILL" | "MULTIPLE_CHOICE" | "TRUE_FALSE_NG" | "MATCHING" | "SHORT_ANSWER" | "TABLE_COMPLETION" | "MAP_LABELING" | "ESSAY" | "SPEAKING_PROMPT";
  content?: JsonObject;
};

const APPLY = process.argv.includes("--apply");
const PAGE_REF = /(?:,\s*)?\b(?:on\s+)?pages?\s+\d+(?:\s*(?:and|[-–—])\s*\d+)?/gi;
const GAP = "...............";

function jsonObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as JsonObject) }
    : {};
}

function replacePageRefs(text: string): { text: string; count: number } {
  const count = (text.match(PAGE_REF) ?? []).length;
  return {
    count,
    text: text
      .replace(PAGE_REF, "")
      .replace(/[ \t]+([?.!,])/g, "$1")
      .replace(/[ \t]{2,}/g, " ")
      .trim(),
  };
}

function replaceDeep(value: unknown, replacements: ReadonlyArray<readonly [string, string]>): unknown {
  if (typeof value === "string") {
    return replacements.reduce((text, [from, to]) => text.replaceAll(from, to), value);
  }
  if (Array.isArray(value)) return value.map((item) => replaceDeep(item, replacements));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as JsonObject).map(([key, item]) => [key, replaceDeep(item, replacements)]),
    );
  }
  return value;
}

function normalizeSalutation(text: string): string {
  return text.replace(/Dear\s+(?:\.{2,}|…+)\s*,/g, "Dear ……………,");
}

function ensureNotesBox(content: string, title: string): string {
  if (content.includes("[[box]]") && content.includes("[[ntitle]]")) return content;
  const separated = content.replace(`${title}Example:`, `${title}\nExample:`)
    .replace(`${title}Many `, `${title}\nMany `)
    .replace(`${title}Conflict `, `${title}\nConflict `)
    .replace(`${title}It `, `${title}\nIt `);
  const titleAt = separated.indexOf(title);
  if (titleAt < 0) throw new Error(`E3 title not found: ${title}`);
  const head = separated.slice(0, titleAt).trimEnd();
  const body = separated.slice(titleAt + title.length).trim();
  const marked = body
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("[[")) return line;
      return /\b\d{1,2}\s*\.{3,}/.test(trimmed) ? `[[b0]]${trimmed}` : trimmed;
    })
    .join("\n");
  return `${head}\n\n[[box]]\n[[ntitle]]${title}[[/ntitle]]\n${marked}\n[[/box]]`;
}

const C16_T2_TABLE = `Questions 1–10

Complete the table below.

Write ONE WORD AND/OR A NUMBER for each answer.

Copying photos to digital format
| Section | Details |
| --- | --- |
| Name of company | Picturerep |
| Requirements | Maximum size of photos is 30 cm, minimum size 4 cm.<br>Photos must not be in a 1 ${GAP} or an album. |
| Cost | The cost for 360 photos is £ 2 ${GAP} (including one disk).<br>Before the completed order is sent, 3 ${GAP} is required. |
| Services included in the price | Photos can be placed in a folder, e.g. with the name 4 ${GAP} .<br>The 5 ${GAP} and contrast can be improved if necessary.<br>Photos which are very fragile will be scanned by 6 ${GAP} . |
| Special restore service (costs extra) | It may be possible to remove an object from a photo, or change the 7 ${GAP} .<br>A photo which is not correctly in 8 ${GAP} cannot be fixed. |
| Other information | Orders are completed within 9 ${GAP} .<br>Send the photos in a box (not 10 ${GAP} ). |`;

async function main() {
  const tests = await prisma.test.findMany({
    where: {
      examType: "GENERAL",
      OR: [11, 12, 13, 14, 15, 16, 17, 18].map((book) => ({
        slug: { startsWith: `cambridge-ielts-${book}-general-test-` },
      })),
    },
    orderBy: { slug: "asc" },
    select: {
      id: true, slug: true, skill: true, status: true,
      sections: {
        orderBy: { order: "asc" },
        select: {
          id: true, title: true, order: true, content: true, questionCount: true, meta: true,
          questions: {
            orderBy: { order: "asc" },
            select: { id: true, number: true, order: true, type: true, content: true },
          },
        },
      },
    },
  });

  const sectionPatches = new Map<string, SectionPatch>();
  const questionPatches = new Map<string, QuestionPatch>();
  const creates: Array<{ sectionId: string; number: number; order: number; content: JsonObject }> = [];
  const metrics = new Map<string, number>();
  const problems: string[] = [];
  const bump = (label: string, amount = 1) => metrics.set(label, (metrics.get(label) ?? 0) + amount);
  const patchSection = (id: string, patch: SectionPatch, label: string) => {
    sectionPatches.set(id, { ...sectionPatches.get(id), ...patch });
    bump(label);
  };
  const patchQuestion = (id: string, patch: QuestionPatch, label: string) => {
    questionPatches.set(id, { ...questionPatches.get(id), ...patch });
    bump(label);
  };

  const testBySlug = new Map(tests.map((test) => [test.slug, test]));
  const currentSectionContent = (section: (typeof tests)[number]["sections"][number]) =>
    sectionPatches.get(section.id)?.content ?? section.content ?? "";
  const currentQuestionContent = (question: (typeof tests)[number]["sections"][number]["questions"][number]) =>
    questionPatches.get(question.id)?.content ?? jsonObject(question.content);

  // E1: page references are paper-only chrome, not useful in CBT.
  for (const test of tests.filter((item) => item.skill === "READING" && !item.slug.includes("-15-"))) {
    for (const section of test.sections) {
      const result = replacePageRefs(currentSectionContent(section));
      if (result.count > 0) {
        patchSection(section.id, { content: result.text }, "E1 sections");
        bump("E1 page refs", result.count);
      }
    }
  }

  // E2 and E6: canonical variants.
  const variants: Array<[string, number, number, string, string]> = [
    ["cambridge-ielts-11-general-test-2-listening", 17, 20, "PLAN_LABELING", "E2"],
    ["cambridge-ielts-11-general-test-4-listening", 17, 20, "PLAN_LABELING", "E2"],
    ["cambridge-ielts-14-general-test-2-listening", 16, 20, "PLAN_LABELING", "E2"],
    ["cambridge-ielts-16-general-test-1-listening", 25, 30, "MATCHING_INFORMATION", "E6"],
    ["cambridge-ielts-17-general-test-1-reading", 1, 5, "MATCHING_INFORMATION", "E6"],
  ];
  for (const [slug, from, to, variant, label] of variants) {
    const test = testBySlug.get(slug);
    if (!test) { problems.push(`${label}: missing ${slug}`); continue; }
    for (const question of test.sections.flatMap((section) => section.questions).filter((q) => q.number >= from && q.number <= to)) {
      const content = currentQuestionContent(question);
      if (content.variant !== variant) patchQuestion(question.id, { content: { ...content, variant } }, label);
    }
  }

  // E3: restore bordered notes structures.
  const notesTargets: Array<[string, number, string]> = [
    ["cambridge-ielts-11-general-test-2-listening", 0, "Enquiry about joining Youth Council"],
    ["cambridge-ielts-12-general-test-5-listening", 3, "Four business values"],
    ["cambridge-ielts-12-general-test-6-listening", 3, "Conflict at work"],
    ["cambridge-ielts-14-general-test-3-listening", 2, "Background on school marching band"],
    ["cambridge-ielts-17-general-test-2-reading", 1, "Maintaining a safe environment for employees working on computers"],
  ];
  for (const [slug, order, title] of notesTargets) {
    const section = testBySlug.get(slug)?.sections.find((item) => item.order === order);
    if (!section) { problems.push(`E3: missing ${slug} section ${order}`); continue; }
    const before = currentSectionContent(section);
    const after = ensureNotesBox(before, title);
    if (after !== before) patchSection(section.id, { content: after }, "E3");
  }

  // E5: this source is a real two-column table, not a notes outline.
  const c16Table = testBySlug.get("cambridge-ielts-16-general-test-2-listening")?.sections.find((item) => item.order === 0);
  if (!c16Table) problems.push("E5: missing C16 T2-L section 1");
  else if (currentSectionContent(c16Table) !== C16_T2_TABLE) patchSection(c16Table.id, { content: C16_T2_TABLE }, "E5");

  // E7: Cambridge specifies ONE WORD ONLY.
  for (const [slug, order] of [
    ["cambridge-ielts-11-general-test-1-listening", 1],
    ["cambridge-ielts-18-general-test-4-reading", 1],
  ] as const) {
    const section = testBySlug.get(slug)?.sections.find((item) => item.order === order);
    if (!section) { problems.push(`E7: missing ${slug} section ${order}`); continue; }
    const before = currentSectionContent(section);
    const after = before.replace(/\bONE WORD(?! ONLY)\s+(?=from|for)/gi, "ONE WORD ONLY ");
    if (after !== before) patchSection(section.id, { content: after }, "E7");
  }

  // E8: terminology and completion layout in C11 T4 Reading.
  const c11t4r = testBySlug.get("cambridge-ielts-11-general-test-4-reading");
  if (!c11t4r) problems.push("E8: missing C11 T4-R");
  else {
    const headingSection = c11t4r.sections.find((item) => item.order === 2);
    if (!headingSection) problems.push("E8: missing C11 T4-R section 3");
    else {
      const before = currentSectionContent(headingSection);
      const after = before.replace(/\bParagraph ([A-F])\b/g, "Section $1");
      if (after !== before) patchSection(headingSection.id, { content: after }, "E8 headings");
      for (const question of headingSection.questions.filter((item) => item.number >= 28 && item.number <= 33)) {
        const content = currentQuestionContent(question);
        const stem = String(content.stem ?? "").replace(/^Paragraph ([A-F])$/, "Section $1");
        if (stem !== content.stem) patchQuestion(question.id, { content: { ...content, stem } }, "E8 headings");
      }
    }
    const steps = c11t4r.sections.find((item) => item.order === 1);
    if (!steps) problems.push("E8: missing C11 T4-R section 2");
    else for (const question of steps.questions.filter((item) => item.number >= 22 && item.number <= 27)) {
      const content = currentQuestionContent(question);
      if (content.variant !== "NOTE_COMPLETION") patchQuestion(question.id, { content: { ...content, variant: "NOTE_COMPLETION" } }, "E8 steps");
    }
  }

  // E9/E10/E14 were renderer findings; current Phase 1-2 data already contains the missing lines.
  const c11t2l = testBySlug.get("cambridge-ielts-11-general-test-2-listening")?.sections.find((item) => item.order === 1);
  if (!c11t2l || [11, 13, 15].some((n) => {
    const q = c11t2l.questions.find((item) => item.number === n);
    return !q || !Array.isArray(jsonObject(q.content).options) || jsonObject(q.content).covers === undefined;
  })) problems.push("E9: shared choice structure is incomplete");
  else bump("E9 verified");
  const c14t3r = testBySlug.get("cambridge-ielts-14-general-test-3-reading")?.sections.find((item) => item.order === 0);
  if (!c14t3r || !currentSectionContent(c14t3r).includes("Questions 8–14") || c14t3r.questions.filter((q) => q.number >= 8 && q.number <= 14 && String(jsonObject(q.content).stem ?? "").trim()).length !== 7) problems.push("E10: Q8–14 header/statements still incomplete");
  else bump("E10 verified");
  const c18t3r = testBySlug.get("cambridge-ielts-18-general-test-3-reading")?.sections.find((item) => item.order === 2);
  if (!c18t3r || !currentSectionContent(c18t3r).includes("Label the diagram below.")) problems.push("E14: diagram instruction missing");
  else bump("E14 verified");

  // A12, E11 and E12: canonical Task 1 prompt text.
  for (const test of tests.filter((item) => item.skill === "WRITING")) {
    const section = test.sections.find((item) => item.order === 0);
    const question = section?.questions[0];
    if (!section || !question) { problems.push(`Writing Task 1 missing: ${test.slug}`); continue; }
    const fixText = (value: string) => normalizeSalutation(
      normalizeGeneralWritingTask(
        test.slug === "cambridge-ielts-17-general-test-4-writing"
          ? value.replace(/Write a letter([\s\S]*?)In your email/g, "Write a letter$1In your letter")
          : value,
      ),
    );
    const sectionBefore = currentSectionContent(section);
    const sectionAfter = fixText(sectionBefore);
    if (sectionAfter !== sectionBefore) patchSection(section.id, { content: sectionAfter }, "A12/E11/E12");
    const content = currentQuestionContent(question);
    const stem = fixText(String(content.stem ?? ""));
    if (stem !== content.stem) patchQuestion(question.id, { content: { ...content, stem } }, "A12/E11/E12");
  }

  // E15: spelling confirmed against the project decision/source scan.
  const joinedWords: Array<[string, ReadonlyArray<readonly [string, string]>]> = [
    ["cambridge-ielts-12-general-test-6-reading", [["FuturePlus", "Future Plus"]]],
    ["cambridge-ielts-13-general-test-3-reading", [["SportWatch", "Sport Watch"]]],
    ["cambridge-ielts-14-general-test-4-reading", [["PostBus", "Post Bus"]]],
    ["cambridge-ielts-18-general-test-4-reading", [["KitchenAid", "Kitchen Aid"]]],
  ];
  for (const [slug, replacements] of joinedWords) {
    const test = testBySlug.get(slug);
    if (!test) { problems.push(`E15: missing ${slug}`); continue; }
    for (const section of test.sections) {
      const before = currentSectionContent(section);
      const after = replaceDeep(before, replacements) as string;
      if (after !== before) patchSection(section.id, { content: after }, "E15");
      for (const question of section.questions) {
        const content = currentQuestionContent(question);
        const next = replaceDeep(content, replacements) as JsonObject;
        if (JSON.stringify(next) !== JSON.stringify(content)) patchQuestion(question.id, { content: next }, "E15");
      }
    }
  }

  // A13: split the legacy aggregate prompt into 4/1/6 questions, preserving q1 IDs.
  for (const test of tests.filter((item) => item.skill === "SPEAKING" && !item.slug.includes("-15-"))) {
    const expected = [4, 1, 6];
    if (test.sections.map((section) => section.questions.length).join(",") === expected.join(",")) {
      const valid = test.sections.flatMap((section) => section.questions).every((question) => {
        const content = jsonObject(question.content);
        return [1, 2, 3].includes(Number(content.speakingPart)) && /^SPEAKING_PART_[123]$/.test(String(content.variant));
      });
      if (!valid) {
        problems.push(`A13: split but missing metadata ${test.slug}`);
      } else {
        for (const section of test.sections) {
          if (section.order !== 1) continue;
          for (const question of section.questions) {
            const content = currentQuestionContent(question);
            const stem = normalizeSpeakingPart2Stem(String(content.stem ?? ""));
            const next = { ...content, stem };
            if (JSON.stringify(next) !== JSON.stringify(content)) {
              patchQuestion(question.id, { content: next }, "A13 Part 2 cue card");
            }
          }
        }
      }
      continue;
    }
    let globalNumber = 0;
    for (const section of test.sections) {
      const part = (section.order + 1) as SpeakingPartKind;
      const parsed = parseSpeakingPartQuestions(section.content ?? "", part);
      if (section.questions.length !== 1 || parsed.length !== expected[section.order]) {
        problems.push(`A13: unexpected ${test.slug} Part ${part}: old=${section.questions.length}, parsed=${parsed.length}`);
        continue;
      }
      const first = section.questions[0]!;
      parsed.forEach((question, order) => {
        const number = ++globalNumber;
        const content = jsonObject(question.content);
        if (order === 0) {
          patchQuestion(first.id, { number, order, type: "SPEAKING_PROMPT", content }, "A13 updated");
        } else {
          creates.push({ sectionId: section.id, number, order, content });
          bump("A13 created");
        }
      });
      patchSection(section.id, { title: `Part ${part}`, questionCount: parsed.length }, "A13 sections");
    }
  }

  // Phase 7: C15 was imported by a separate source, so canonicalize its cue
  // cards in place while preserving every test/section/question ID.
  for (const test of tests.filter((item) => item.skill === "SPEAKING" && item.slug.includes("-15-"))) {
    for (const section of test.sections) {
      if (section.order !== 1) continue;
      for (const question of section.questions) {
        const content = currentQuestionContent(question);
        const stem = normalizeSpeakingPart2Stem(String(content.stem ?? ""));
        const next = {
          ...content,
          stem,
          speakingPart: 2,
          variant: "SPEAKING_PART_2",
        };
        if (JSON.stringify(next) !== JSON.stringify(content)) {
          patchQuestion(question.id, { content: next }, "Phase 7 C15 Part 2 cue card");
        }
      }
    }
  }

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  for (const [label, count] of [...metrics].sort(([a], [b]) => a.localeCompare(b))) console.log(`${label}: ${count}`);
  console.log(`section updates=${sectionPatches.size}, question updates=${questionPatches.size}, question creates=${creates.length}`);
  if (problems.length) {
    for (const problem of problems) console.error(`PROBLEM ${problem}`);
    throw new Error(`Aborted: ${problems.length} validation problem(s)`);
  }
  if (!APPLY) return;

  const backupPath = path.join(".tmp-import", "phase4", `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await writeFile(backupPath, JSON.stringify(tests, null, 2), "utf8");
  await prisma.$transaction(async (tx) => {
    for (const [id, data] of sectionPatches) {
      await tx.testSection.update({ where: { id }, data: data as never });
    }
    for (const [id, data] of questionPatches) {
      await tx.question.update({ where: { id }, data: data as never });
    }
    for (const question of creates) {
      await tx.question.create({
        data: { ...question, type: "SPEAKING_PROMPT", content: question.content as never },
      });
    }
  }, { maxWait: 20_000, timeout: 120_000 });
  console.log(`APPLIED in one transaction; backup=${backupPath}`);
}

main().finally(() => prisma.$disconnect());
