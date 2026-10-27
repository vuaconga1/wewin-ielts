/**
 * Rename tests to neutral "Test n - Skill" titles (no source book names such as
 * "VOL 3" / "Cambridge IELTS 13 General Training"), strip source tags and
 * descriptions. Numbering is per exam type + skill. Slugs are unchanged so
 * existing attempts / links keep working.
 *
 * Usage:
 *   npx tsx scripts/rename-tests-neutral.ts --dry-run
 *   npx tsx scripts/rename-tests-neutral.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.resolve(".env") });

const SKILL_LABEL: Record<string, string> = {
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  SPEAKING: "Speaking",
};

const EXAM_TAG: Record<string, string> = {
  ACADEMIC: "#IELTS Academic",
  GENERAL: "#IELTS General",
};

type Row = {
  id: string;
  slug: string;
  title: string;
  skill: string;
  examType: string;
  tags: unknown;
  description: string | null;
};

type Plan = { row: Row; title: string; tags: string[]; description: string | null };

/** Lower rank = earlier number. Original WEWIN "test-N-skill" keep N. */
function sortKey(slug: string): [number, number, number] {
  let m = slug.match(/^test-(\d+)-/);
  if (m) return [0, Number(m[1]), 0];
  m = slug.match(/mocktest-(\d+)/);
  if (m) return [1, Number(m[1]), 0];
  if (slug.startsWith("general-reading-grade-8")) return [5, 0, 0];
  m = slug.match(/^real-ielts-vol-(\d+)-test-(\d+)-/);
  if (m) return [3, Number(m[1]), Number(m[2])];
  m = slug.match(/^cambridge-ielts-(\d+)-general-test-(\d+)-/);
  if (m) return [4, Number(m[1]), Number(m[2])];
  return [9, 0, 0];
}

function compareKeys(a: [number, number, number], b: [number, number, number]) {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

function isSourceDescription(d: string | null): boolean {
  return Boolean(d && /cambridge|real ielts|\bvol\b/i.test(d));
}

/** Same source test set across skills, e.g. "cambridge-ielts-15-general-test-2". */
function setKey(slug: string): string {
  return slug.replace(/-(listening|reading|writing|speaking)$/, "").replace(
    /^general-(listening|reading|writing)-mocktest-/,
    "general-mocktest-",
  );
}

/**
 * Number per exam type by test set, so Listening/Reading/Writing/Speaking from
 * the same set share n. Original WEWIN "test-N-skill" keep N.
 */
function buildPlan(rows: Row[]): Plan[] {
  const byExam = new Map<string, Row[]>();
  for (const r of rows) {
    if (!EXAM_TAG[r.examType]) continue;
    byExam.set(r.examType, [...(byExam.get(r.examType) ?? []), r]);
  }

  const plans: Plan[] = [];
  for (const list of byExam.values()) {
    const numberBySet = new Map<string, number>();
    const used = new Set<number>();
    for (const r of list) {
      const m = r.slug.match(/^test-(\d+)-/);
      if (m) {
        numberBySet.set(setKey(r.slug), Number(m[1]));
        used.add(Number(m[1]));
      }
    }
    const sets = [...new Set(list.map((r) => setKey(r.slug)))]
      .filter((k) => !numberBySet.has(k))
      .sort((a, b) => compareKeys(sortKey(`${a}-x`), sortKey(`${b}-x`)));
    let next = 1;
    for (const k of sets) {
      while (used.has(next)) next += 1;
      numberBySet.set(k, next);
      used.add(next);
    }

    for (const r of list) {
      const n = numberBySet.get(setKey(r.slug))!;
      const label = SKILL_LABEL[r.skill] ?? r.skill;
      plans.push({
        row: r,
        title: `Test ${n} - ${label}`,
        tags: [EXAM_TAG[r.examType]!, `#${label}`],
        description: isSourceDescription(r.description) ? null : r.description,
      });
    }
  }
  return plans;
}

async function updateJson(slug: string, plan: Plan, dryRun: boolean) {
  const file = path.resolve("data/tests", `${slug}.json`);
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    return false;
  }
  const json = JSON.parse(raw) as Record<string, unknown>;
  const upToDate =
    json.title === plan.title &&
    JSON.stringify(json.tags) === JSON.stringify(plan.tags) &&
    (json.description ?? null) === plan.description;
  if (upToDate) return false;
  json.title = plan.title;
  json.tags = plan.tags;
  if (plan.description === null) delete json.description;
  else json.description = plan.description;
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  let next = JSON.stringify(json, null, 2).replace(/\n/g, eol);
  if (/\r?\n$/.test(raw)) next += eol;
  if (next === raw) return false;
  if (!dryRun) await writeFile(file, next, "utf8");
  return true;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { prisma } = await import("../src/lib/prisma");

  const rows = (await prisma.test.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      skill: true,
      examType: true,
      tags: true,
      description: true,
    },
  })) as Row[];

  const plans = buildPlan(rows);
  const titles = new Set<string>();
  for (const p of plans) {
    const key = `${p.row.examType}:${p.title}`;
    if (titles.has(key)) throw new Error(`Duplicate title ${key}`);
    titles.add(key);
  }

  let changed = 0;
  let jsonUpdated = 0;
  for (const p of plans.sort((a, b) =>
    `${a.row.examType}${a.row.skill}`.localeCompare(`${b.row.examType}${b.row.skill}`) ||
    compareKeys(sortKey(a.row.slug), sortKey(b.row.slug)),
  )) {
    const sameTags = JSON.stringify(p.row.tags) === JSON.stringify(p.tags);
    const same =
      p.row.title === p.title && sameTags && p.row.description === p.description;
    if (!same) {
      changed += 1;
      console.log(`${p.row.examType.padEnd(8)} ${p.row.slug.padEnd(48)} "${p.row.title}" -> "${p.title}"`);
      if (!dryRun) {
        await prisma.test.update({
          where: { id: p.row.id },
          data: { title: p.title, tags: p.tags, description: p.description },
        });
      }
    }
    if (await updateJson(p.row.slug, p, dryRun)) jsonUpdated += 1;
  }

  console.log(
    `${dryRun ? "[dry-run] " : ""}DB rows changed: ${changed}/${plans.length}; JSON files ${dryRun ? "to update" : "updated"}: ${jsonUpdated}`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
