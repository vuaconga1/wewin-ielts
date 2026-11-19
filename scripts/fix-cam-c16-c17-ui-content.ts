/**
 * Fix Cambridge C16.03–04 (test 37–38) scrambled part.content and
 * C17.03–04 (test 41–42) reading missing Questions task chrome.
 *
 * Dry-run:
 *   npx tsx scripts/fix-cam-c16-c17-ui-content.ts
 * Apply JSON + DB:
 *   npx tsx scripts/fix-cam-c16-c17-ui-content.ts --apply
 */
import path from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { config } from "dotenv";
config({ path: path.resolve(".env") });

import { prisma } from "../src/lib/prisma";
import {
  parseReadingQuestionGroups,
  repairImportedText,
  splitReadingPassageAndTasks,
} from "../src/lib/practice/reading-content";

const APPLY = process.argv.includes("--apply");

type Q = {
  number: number;
  type: string;
  content?: { stem?: string; options?: { label: string; text: string }[] };
};
type Part = { title: string; order: number; content?: string; questions: Q[] };
type Draft = {
  slug: string;
  skill: string;
  title: string;
  parts: Part[];
  savedAt?: string;
};

function load(slug: string): Draft {
  return JSON.parse(readFileSync(`data/tests/${slug}.json`, "utf8"));
}

function save(draft: Draft) {
  draft.savedAt = new Date().toISOString();
  writeFileSync(
    `data/tests/${draft.slug}.json`,
    `${JSON.stringify(draft, null, 2)}\n`,
    "utf8",
  );
}

function sliceBy(
  text: string,
  startRe: RegExp,
  endRe: RegExp | null,
): string {
  const start = text.search(startRe);
  if (start < 0) return "";
  const from = text.slice(start);
  if (!endRe) return from.trim();
  const endRel = from.search(endRe);
  if (endRel <= 0) return from.trim();
  return from.slice(0, endRel).trim();
}

function verifyPart(skill: string, part: Part) {
  const tasks =
    skill === "READING"
      ? splitReadingPassageAndTasks(part.content ?? "").tasks
      : repairImportedText(part.content ?? "");
  const groups = parseReadingQuestionGroups(tasks, part.questions);
  const covered = new Set<number>();
  for (const g of groups) {
    for (let n = g.start; n <= g.end; n += 1) covered.add(n);
  }
  const ungrouped = part.questions
    .map((q) => q.number)
    .filter((n) => !covered.has(n));
  return { groups, ungrouped, tasksLen: tasks.length };
}

/** Rebuild C16 listening parts that were shifted by one (Speaking junk in P1). */
function fixC16Listening(slug: "test-37-listening" | "test-38-listening") {
  const listening = load(slug);
  const readingSlug = slug.replace("-listening", "-reading");
  const reading = load(readingSlug);

  const bundle = [
    ...listening.parts.map((p) => p.content ?? ""),
    ...reading.parts.map((p) => p.content ?? ""),
  ].join("\n\n");

  const l1 = sliceBy(
    bundle,
    /PART\s*1\s+Questions?\s+1\s*[-–—]\s*10\b/i,
    /PART\s*2\s+Questions?\s+11\s*[-–—]\s*20\b/i,
  );
  const l2 = sliceBy(
    bundle,
    /PART\s*2\s+Questions?\s+11\s*[-–—]\s*20\b/i,
    /PART\s*3\s+Questions?\s+21\s*[-–—]\s*30\b/i,
  );
  const l3 = sliceBy(
    bundle,
    /PART\s*3\s+Questions?\s+21\s*[-–—]\s*30\b/i,
    /PART\s*4\s+Questions?\s+31\s*[-–—]\s*40\b/i,
  );
  const l4 = sliceBy(
    bundle,
    /PART\s*4\s+Questions?\s+31\s*[-–—]\s*40\b/i,
    /(?:Roman shipbuilding|Roman tunnels|Passage 1 below)/i,
  );

  if (!l1 || !l2 || !l3 || !l4) {
    throw new Error(
      `${slug}: failed to split listening parts (lens ${[l1, l2, l3, l4].map((s) => s.length)})`,
    );
  }

  // Preserve map image markdown if present in original part 2.
  let part2 = l2;
  if (slug === "test-38-listening" && !/test-38-map\.png/.test(part2)) {
    const map = listening.parts
      .map((p) => p.content ?? "")
      .find((c) => /test-38-map\.png/.test(c));
    if (map) {
      const img = map.match(/!\[[^\]]*\]\([^)]*test-38-map\.png\)/)?.[0];
      if (img && /Questions?\s+15/i.test(part2)) {
        part2 = part2.replace(
          /(Questions?\s+15[\s\S]*?Label the map below\.)/i,
          `$1\n\n${img}\n`,
        );
      }
    }
  }

  listening.parts[0]!.content = l1;
  listening.parts[1]!.content = part2;
  listening.parts[2]!.content = l3;
  listening.parts[3]!.content = l4;
  return listening;
}

/** Rebuild C16 reading: strip leaked listening P4, stitch question blocks to passages. */
function fixC16Reading(slug: "test-37-reading" | "test-38-reading") {
  const reading = load(slug);
  const all = reading.parts.map((p) => p.content ?? "").join("\n\n");

  const passageStart =
    slug === "test-37-reading"
      ? /Roman shipbuilding and navigation/i
      : /Roman tunnels/i;
  const p2Title =
    slug === "test-37-reading"
      ? /Climate change reveals ancient artefacts/i
      : /(?:Why companies should embrace|Passage 2 below)/i;
  // For test-38 P2 title from markers was unclear — use Questions 14-17 area.
  // Better: find second substantial passage after Q13 block.

  let r1: string;
  let r2: string;
  let r3: string;

  if (slug === "test-37-reading") {
    const fromRoman = all.search(passageStart);
    if (fromRoman < 0) throw new Error("test-37-reading: Roman passage missing");
    const body = all.slice(fromRoman);
    const p2At = body.search(/Climate change reveals ancient artefacts/i);
    const p3At = body.search(
      /(?:Wigge explains|thermometer molecule|Phytochromes|Plant biologists)/i,
    );
    // Fallback: Questions 27-32 often opens P3 tasks after P3 passage
    const p3Tasks = body.search(/Questions?\s+27\s*[-–—]\s*32\b/i);
    // Find passage 3 title area before Q27
    let p3PassageAt = body.search(
      /(?:The crop that turns up the heat|Reading Passage 3|Passage 3 below)/i,
    );
    if (p3PassageAt < 0) {
      // Walk backward from Q27 for a blank line + title
      p3PassageAt = Math.max(0, p3Tasks - 2500);
    }

    if (p2At < 0) throw new Error("test-37-reading: P2 passage missing");

    // P1: Roman passage + Q1-5 + Q6-13 (notes) until P2 passage
    r1 = body.slice(0, p2At).trim();
    // Ensure Q6-13 are included (they may sit after p2At in original scramble — already before Climate)
    if (!/Questions?\s+6\s*[-–—]\s*13/i.test(r1)) {
      const q6 = all.search(/Questions?\s+6\s*[-–—]\s*13\b/i);
      const q14 = all.search(/Questions?\s+14\s*[-–—]\s*19\b/i);
      if (q6 >= 0 && q14 > q6) {
        r1 = `${r1}\n\n${all.slice(q6, q14).trim()}`;
      }
    }

    // P2: Climate passage through Q26 (choose TWO), until P3 passage
    const p3Cut = p3PassageAt > p2At ? p3PassageAt : p3Tasks;
    r2 = body.slice(p2At, p3Cut).trim();
    if (!/Questions?\s+23/i.test(r2)) {
      const q23 = all.search(/Questions?\s+23\s+and\s+24\b/i);
      const q27 = all.search(/Questions?\s+27\s*[-–—]\s*32\b/i);
      if (q23 >= 0 && q27 > q23) {
        r2 = `${r2}\n\n${all.slice(q23, q27).trim()}`;
      }
    }

    r3 = body.slice(p3Cut).trim();
    // Drop any trailing listening junk
    r3 = r3.replace(/^PART\s*4[\s\S]*?(?=[A-Z])/i, "").trim();
  } else {
    // test-38-reading
    const fromRoman = all.search(passageStart);
    if (fromRoman < 0) throw new Error("test-38-reading: Roman tunnels missing");
    const body = all.slice(fromRoman);

    // P1 tasks: Questions 1-6 diagrams + 7-10 TF + 11-13 SAQ
    // P2 starts around Questions 14-17 matching / a new passage
    const q14 = body.search(/Questions?\s+14\s*[-–—]\s*17\b/i);
    const q18 = body.search(/Questions?\s+18\s*[-–—]\s*22\b/i);
    const q27 = body.search(/Questions?\s+27\s*[-–—]\s*32\b/i);

    // Find P2 passage: often "Passage 2 below" or a title before Q14
    let p2Pass = body.search(/Passage 2 below/i);
    if (p2Pass < 0) {
      // After Q13 block ends, next title
      p2Pass = body.search(
        /\n\n([A-Z][^\n]{10,80})\n\nA\s/i,
      );
    }
    // Safer cut: include everything from Roman until Q14 as P1 (passage+tasks 1-13)
    // Then from a passage before Q14... Actually Q7-13 are in "P2" content currently.
    // Structure from markers:
    // P1 content: listening leak + Roman + Q1-6
    // P2 content: Q7-13 + Q11-13 + passage? + Q14-17
    // P3: Q18-22 + Q23-26 + Q27-32 + Q33-35

    r1 = body.slice(0, q14 > 0 ? q14 : body.length).trim();
    // Pull Q7-13 into r1 if missing
    if (!/Questions?\s+7\s*[-–—]\s*10/i.test(r1)) {
      const q7 = all.search(/Questions?\s+7\s*[-–—]\s*10\b/i);
      if (q7 >= 0 && q14 > 0) {
        const absQ14 = fromRoman + q14;
        r1 = `${r1}\n\n${all.slice(q7, absQ14).trim()}`;
      }
    }

    // P2: from Q14 until Q27 (includes Q18-26 which are still P2 in book? 
    // Book: P2 is Q14-26. P3 is Q27-40.
    // So r2 = Q14 through before Q27, but need P2 passage text.
    // Passage for P2 may sit between Q13 and Q14 in scrambled file.
    const absQ14 = fromRoman + q14;
    const absQ27 = fromRoman + q27;
    // Look backward from Q14 for passage title (not a Questions line)
    let pass2Start = absQ14;
    const before = all.slice(Math.max(0, absQ14 - 4000), absQ14);
    const pass2Title = before.search(
      /\n\n((?:Why |How |The |A new |Reading|Scientists|Companies)[^\n]{5,90})\n\n/i,
    );
    if (pass2Title >= 0) {
      pass2Start = Math.max(0, absQ14 - 4000) + pass2Title;
    }
    r2 = all.slice(pass2Start, absQ27).trim();

    r3 = all.slice(absQ27).trim();
    // Prepend P3 passage if it sits just before Q27
    const before27 = all.slice(Math.max(0, absQ27 - 5000), absQ27);
    const p3Title = before27.search(
      /\n\n((?:Reading|Is |Are |Can |The |Blindfold|Memory|Gareyev)[^\n]{5,90})\n\n/i,
    );
    if (p3Title >= 0 && !/^Questions/i.test(r3)) {
      const absP3 = Math.max(0, absQ27 - 5000) + p3Title;
      if (absP3 < absQ27) {
        r3 = `${all.slice(absP3, absQ27).trim()}\n\n${r3}`;
      }
    }
  }

  reading.parts[0]!.content = r1;
  reading.parts[1]!.content = r2;
  reading.parts[2]!.content = r3;
  return reading;
}

function defaultInstructions(type: string): string[] {
  switch (type) {
    case "TRUE_FALSE_NG":
      return [
        "Do the following statements agree with the information given in the passage?",
        "TRUE if the statement agrees with the information",
        "FALSE if the statement contradicts the information",
        "NOT GIVEN if there is no information on this",
      ];
    case "MATCHING":
      return ["Match each item with the correct option."];
    case "MULTIPLE_CHOICE":
      return ["Choose the correct letter, A, B, C or D."];
    case "GAP_FILL":
    case "NOTE_COMPLETION":
    case "SUMMARY_COMPLETION":
    case "SENTENCE_COMPLETION":
    case "FORM_COMPLETION":
    case "TABLE_COMPLETION":
      return [
        "Complete the notes/summary below.",
        "Choose ONE WORD ONLY from the passage for each answer.",
      ];
    default:
      return ["Answer the questions below."];
  }
}

function buildTaskBlock(
  qs: Q[],
  run: { start: number; end: number; type: string },
): string {
  const header =
    run.start === run.end
      ? `Questions ${run.start}`
      : `Questions ${run.start}-${run.end}`;
  const instr = defaultInstructions(run.type).join("\n");
  const stems = qs
    .filter((q) => q.number >= run.start && q.number <= run.end)
    .map((q) => {
      const stem = (q.content?.stem ?? "").trim();
      return stem ? `${q.number} ${stem}` : `${q.number}`;
    })
    .join("\n");
  return `${header}\n${instr}\n\n${stems}`.trim();
}

function typeRuns(qs: Q[], onlyNumbers?: Set<number>) {
  const list = [...qs]
    .filter((q) => !onlyNumbers || onlyNumbers.has(q.number))
    .sort((a, b) => a.number - b.number);
  const runs: { start: number; end: number; type: string }[] = [];
  for (const q of list) {
    const last = runs[runs.length - 1];
    if (last && last.type === q.type && last.end + 1 === q.number) {
      last.end = q.number;
    } else {
      runs.push({ start: q.number, end: q.number, type: q.type });
    }
  }
  return runs;
}

/** Append synthetic Questions headers for missing / incomplete task chrome. */
function ensureReadingTaskHeaders(draft: Draft) {
  for (const part of draft.parts) {
    const content = part.content ?? "";
    const { ungrouped } = verifyPart("READING", part);
    if (ungrouped.length === 0) {
      const { tasks } = splitReadingPassageAndTasks(content);
      if (tasks.trim()) continue;
    }

    const qs = [...part.questions].sort((a, b) => a.number - b.number);
    const only = ungrouped.length
      ? new Set(ungrouped)
      : undefined;
    const runs = typeRuns(qs, only);
    const blocks = runs.map((run) => buildTaskBlock(qs, run));

    if (only) {
      part.content = `${content.trim()}\n\n${blocks.join("\n\n")}`.trim();
    } else {
      const passage = splitReadingPassageAndTasks(content).passage || content;
      part.content = `${passage.trim()}\n\n${blocks.join("\n\n")}`.trim();
    }
  }
  return draft;
}

/** Keep passage, rewrite task section so Question groups ascend by number. */
function sortReadingTaskGroups(draft: Draft) {
  for (const part of draft.parts) {
    const content = part.content ?? "";
    const { passage, tasks } = splitReadingPassageAndTasks(content);
    if (!tasks.trim()) continue;
    const groups = parseReadingQuestionGroups(tasks, part.questions);
    if (groups.length < 2) continue;
    const starts = groups.map((g) => g.start);
    const ordered = starts.every((n, i) => i === 0 || n >= starts[i - 1]!);
    if (ordered) continue;

    const sorted = [...groups].sort((a, b) => a.start - b.start);
    const blocks = sorted.map((g) => {
      const instr = g.instructions.join("\n");
      const notes = g.notes?.trim() ?? "";
      const stems = part.questions
        .filter((q) => q.number >= g.start && q.number <= g.end)
        .map((q) => {
          const stem = (q.content?.stem ?? "").trim();
          const recovered = g.sentenceStems[q.number];
          const body = recovered || stem;
          return body ? `${q.number} ${body}` : String(q.number);
        })
        .join("\n");
      return [g.header, instr, notes, stems].filter(Boolean).join("\n\n").trim();
    });
    part.content = `${passage.trim()}\n\n${blocks.join("\n\n")}`.trim();
  }
  return draft;
}

async function syncDb(draft: Draft) {
  const test = await prisma.test.findFirst({
    where: { slug: draft.slug },
    select: {
      id: true,
      sections: { select: { id: true, order: true, content: true } },
    },
  });
  if (!test) {
    console.warn(`DB miss: ${draft.slug}`);
    return;
  }
  for (const section of test.sections) {
    const part = draft.parts.find((p) => p.order === section.order);
    if (!part || section.content === part.content) continue;
    await prisma.testSection.update({
      where: { id: section.id },
      data: { content: part.content ?? null },
    });
    console.log(`  DB ${draft.slug} section ${section.order} updated`);
  }
}

function report(draft: Draft) {
  console.log(`\n== ${draft.slug} ==`);
  for (const part of draft.parts) {
    const v = verifyPart(draft.skill, part);
    console.log(
      `  ${part.title}: groups=${v.groups.length} [${v.groups
        .map((g) => g.header)
        .join(" | ")}] ungrouped=${v.ungrouped.join(",") || "-"}`,
    );
    if (v.ungrouped.length) {
      throw new Error(`${draft.slug} ${part.title} still ungrouped: ${v.ungrouped}`);
    }
  }
}

async function main() {
  const out: Draft[] = [];

  out.push(fixC16Listening("test-37-listening"));
  out.push(fixC16Listening("test-38-listening"));
  out.push(
    sortReadingTaskGroups(
      ensureReadingTaskHeaders(fixC16Reading("test-37-reading")),
    ),
  );
  out.push(
    sortReadingTaskGroups(
      ensureReadingTaskHeaders(fixC16Reading("test-38-reading")),
    ),
  );

  for (const slug of ["test-41-reading", "test-42-reading"] as const) {
    out.push(ensureReadingTaskHeaders(load(slug)));
  }

  // Also normalize spaced PART headers in place for C17 listening JSON
  for (const slug of [
    "test-39-listening",
    "test-41-listening",
    "test-42-listening",
  ] as const) {
    const d = load(slug);
    for (const part of d.parts) {
      part.content = repairImportedText(part.content ?? "");
    }
    out.push(d);
  }

  for (const draft of out) {
    report(draft);
    if (APPLY) {
      save(draft);
      await syncDb(draft);
      console.log(`  wrote ${draft.slug}`);
    }
  }

  if (!APPLY) console.log("\nDry-run only. Pass --apply to write JSON + DB.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
