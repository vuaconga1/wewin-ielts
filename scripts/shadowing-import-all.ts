/**
 * Batch import 30 TED talks from c:\Users\PC\Downloads\30 link.txt
 *
 * Usage:
 *   npx tsx scripts/shadowing-import-all.ts
 *   options: --dry-run
 *            --only <index or slug>
 *            --from <index>
 */

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const SOURCE_FILE = "c:\\Users\\PC\\Downloads\\30 link.txt";

type TalkItem = {
  index: number;
  category: string;
  rawTitle: string;
  cleanTitle: string;
  slug: string;
  url: string;
  level: "B1" | "B2";
};

// Hand-curated clean slugs and titles for the 30 talks
const TALK_METADATA: Record<string, { slug: string; cleanTitle: string; level: "B1" | "B2" }> = {
  "https://www.youtube.com/watch?v=UyyjU8fzEYU": {
    slug: "my-stroke-of-insight",
    cleanTitle: "My stroke of insight – Jill Bolte Taylor",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=hVimVzgtD6w": {
    slug: "the-best-stats-youve-ever-seen",
    cleanTitle: "The best stats you’ve ever seen – Hans Rosling",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=Vx2RcUQNh6Q": {
    slug: "is-our-universe-the-only-universe",
    cleanTitle: "Is our universe the only universe? – Brian Greene",
    level: "B2",
  },
  "https://www.youtube.com/watch?v=4q1dgn_C0AU": {
    slug: "the-surprising-science-of-happiness",
    cleanTitle: "The surprising science of happiness – Dan Gilbert",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=KXWurAmtf78": {
    slug: "how-bacteria-talk",
    cleanTitle: "How bacteria “talk” – Bonnie Bassler",
    level: "B2",
  },
  "https://www.youtube.com/watch?v=xjBIsp8mS-c": {
    slug: "questioning-the-universe",
    cleanTitle: "Questioning the universe – Stephen Hawking",
    level: "B2",
  },
  "https://www.youtube.com/watch?v=yqc9zX04DXs": {
    slug: "the-history-of-our-world-in-18-minutes",
    cleanTitle: "The history of our world in 18 minutes – David Christian",
    level: "B2",
  },
  "https://www.youtube.com/watch?v=RKK7wGAYP6k": {
    slug: "how-language-shapes-the-way-we-think",
    cleanTitle: "How language shapes the way we think – Lera Boroditsky",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=_7_XH1CBzGw": {
    slug: "what-is-so-special-about-the-human-brain",
    cleanTitle: "What is so special about the human brain? – Suzana Herculano-Houzel",
    level: "B2",
  },
  "https://www.youtube.com/watch?v=TdBAHexVYzc": {
    slug: "how-crispr-lets-us-edit-our-dna",
    cleanTitle: "How CRISPR lets us edit our DNA – Jennifer Doudna",
    level: "B2",
  },
  "https://www.youtube.com/watch?v=40riCqvRoMs": {
    slug: "how-were-teaching-computers-to-understand-pictures",
    cleanTitle: "How we’re teaching computers to understand pictures – Fei-Fei Li",
    level: "B2",
  },
  "https://www.youtube.com/watch?v=8nt3edWLgIg": {
    slug: "can-we-build-ai-without-losing-control",
    cleanTitle: "Can we build AI without losing control over it? – Sam Harris",
    level: "B2",
  },
  "https://www.youtube.com/watch?v=MnT1xgZgkpk": {
    slug: "what-happens-when-computers-get-smarter-than-us",
    cleanTitle: "What happens when our computers get smarter than we are? – Nick Bostrom",
    level: "B2",
  },
  "https://www.youtube.com/watch?v=zIwLWfaAg-8": {
    slug: "the-future-were-building-and-boring",
    cleanTitle: "The future we’re building, and boring – Elon Musk",
    level: "B2",
  },
  "https://www.youtube.com/watch?v=C74amJRp730": {
    slug: "how-tech-companies-control-billions-of-minds",
    cleanTitle: "How a handful of tech companies control billions of minds – Tristan Harris",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=YrtANPtnhyg": {
    slug: "thrilling-potential-of-sixthsense-technology",
    cleanTitle: "The thrilling potential of SixthSense technology – Pranav Mistry",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=crjU5hu2fag": {
    slug: "how-i-harnessed-the-wind",
    cleanTitle: "How I harnessed the wind – William Kamkwamba",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=t4kyRyKyOpo": {
    slug: "computers-that-can-learn",
    cleanTitle: "The wonderful and terrifying implications of computers that can learn – Jeremy Howard",
    level: "B2",
  },
  "https://www.youtube.com/watch?v=tiwVMrTLUWg": {
    slug: "how-a-driverless-car-sees-the-road",
    cleanTitle: "How a driverless car sees the road – Chris Urmson",
    level: "B2",
  },
  "https://www.youtube.com/watch?v=IjbTiRbeNpM": {
    slug: "how-ai-can-bring-second-industrial-revolution",
    cleanTitle: "How AI can bring on a second Industrial Revolution – Kevin Kelly",
    level: "B2",
  },
  "https://www.youtube.com/watch?v=qp0HIF3SfI4": {
    slug: "how-great-leaders-inspire-action",
    cleanTitle: "How great leaders inspire action – Simon Sinek",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=Ks-_Mh1QhMc": {
    slug: "your-body-language-may-shape-who-you-are",
    cleanTitle: "Your body language may shape who you are – Amy Cuddy",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=arj7oStGLkU": {
    slug: "inside-the-mind-of-a-master-procrastinator",
    cleanTitle: "Inside the mind of a master procrastinator – Tim Urban",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=eIho2S0ZahI": {
    slug: "how-to-speak-so-that-people-want-to-listen",
    cleanTitle: "How to speak so that people want to listen – Julian Treasure",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=iCvmsMzlF7o": {
    slug: "the-power-of-vulnerability",
    cleanTitle: "The power of vulnerability – Brené Brown",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=H14bBuluwB8": {
    slug: "grit-the-power-of-passion-and-perseverance",
    cleanTitle: "Grit: the power of passion and perseverance – Angela Lee Duckworth",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=_X0mgOOSpLU": {
    slug: "the-power-of-believing-you-can-improve",
    cleanTitle: "The power of believing that you can improve – Carol Dweck",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=H6n3iNh4XLI": {
    slug: "10-ways-to-have-a-better-conversation",
    cleanTitle: "10 ways to have a better conversation – Celeste Headlee",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=-FOCpMAww28": {
    slug: "teds-secret-to-great-public-speaking",
    cleanTitle: "TED’s secret to great public speaking – Chris Anderson",
    level: "B1",
  },
  "https://www.youtube.com/watch?v=iG9CE55wbtY": {
    slug: "do-schools-kill-creativity",
    cleanTitle: "Do schools kill creativity? – Sir Ken Robinson",
    level: "B1",
  },
};

function parseTalks(): TalkItem[] {
  if (!existsSync(SOURCE_FILE)) {
    throw new Error(`Source file not found at ${SOURCE_FILE}`);
  }
  const content = readFileSync(SOURCE_FILE, "utf8");
  const rawLines = content.split("\n").map((l) => l.trim()).filter(Boolean);

  let currentCategory = "General";
  const items: TalkItem[] = [];
  let index = 1;

  for (const line of rawLines) {
    if (["Khoa học", "Kỹ thuật và công nghệ", "Kỹ năng"].includes(line)) {
      currentCategory = line;
      continue;
    }
    const match = line.match(/^(.*?)(https?:\/\/.*)$/);
    if (!match) continue;

    const rawTitle = match[1].trim();
    const url = match[2].trim();
    const meta = TALK_METADATA[url] ?? {
      slug: rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40),
      cleanTitle: rawTitle,
      level: "B1" as const,
    };

    items.push({
      index: index++,
      category: currentCategory,
      rawTitle,
      cleanTitle: meta.cleanTitle,
      slug: meta.slug,
      url,
      level: meta.level,
    });
  }

  return items;
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const has = (flag: string) => process.argv.includes(flag);

async function checkExistsWithVideo(slug: string, cleanTitle: string): Promise<boolean> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const item = await prisma.shadowingExercise.findUnique({
        where: { slug },
        select: { title: true, videoUrl: true },
      });
      if (item?.videoUrl) {
        if (item.title !== cleanTitle) {
          await prisma.shadowingExercise.update({
            where: { slug },
            data: { title: cleanTitle },
          });
        }
        return true;
      }
      return false;
    } catch (err) {
      console.warn(`[WARN] DB check attempt ${attempt} failed for "${slug}":`, (err as Error)?.message ?? err);
      await prisma.$disconnect().catch(() => {});
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  return false;
}

async function main() {
  const talks = parseTalks();
  console.log(`Loaded ${talks.length} talks from "${SOURCE_FILE}".\n`);

  const dryRun = has("--dry-run");
  const onlyArg = arg("--only");
  const fromArg = Number(arg("--from") ?? "1");

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const talk of talks) {
    if (talk.index < fromArg) continue;
    if (onlyArg && onlyArg !== String(talk.index) && onlyArg !== talk.slug) continue;

    const prefix = `[${talk.index}/${talks.length}]`;
    console.log(`\n================================================================`);
    console.log(`${prefix} ${talk.cleanTitle}`);
    console.log(`Category: ${talk.category} | Level: ${talk.level} | Slug: ${talk.slug}`);
    console.log(`URL: ${talk.url}`);
    console.log(`================================================================`);

    try {
      // Check if already in DB (with auto-reconnect, disconnect, and title sync)
      const hasVideo = await checkExistsWithVideo(talk.slug, talk.cleanTitle);
      await prisma.$disconnect().catch(() => {});

      if (hasVideo) {
        console.log(`✓ Already exists in DB with video (${talk.slug}). Skipping.\n`);
        skipCount++;
        continue;
      }

      if (dryRun) {
        console.log(`[DRY-RUN] Would import ${talk.slug}`);
        successCount++;
        continue;
      }

      // Call scripts/shadowing-import-video.ts (omitting --title to let YouTube metadata provide clean string, then syncing talk.cleanTitle in DB)
      const start = Date.now();
      const res = spawnSync(
        "npx",
        [
          "tsx",
          path.join("scripts", "shadowing-import-video.ts"),
          "--url",
          talk.url,
          "--slug",
          talk.slug,
          "--level",
          talk.level,
          "--model",
          "base.en",
          "--publish",
        ],
        {
          stdio: "inherit",
          shell: process.platform === "win32",
          env: { ...process.env, PYTHONIOENCODING: "utf-8" },
        },
      );

      const elapsed = Math.round((Date.now() - start) / 1000);
      if (res.status === 0) {
        // Update DB with the formatted cleanTitle
        try {
          await prisma.shadowingExercise.update({
            where: { slug: talk.slug },
            data: { title: talk.cleanTitle },
          });
        } catch {}
        console.log(`\n✓ SUCCESS: Imported "${talk.slug}" in ${elapsed}s.`);
        successCount++;
      } else {
        console.error(`\n✗ FAILED: Import failed for "${talk.slug}" (exit code ${res.status}). Continuing...`);
        failCount++;
      }
      // Brief sleep between videos to prevent YouTube rate-limiting
      await new Promise((r) => setTimeout(r, 3000));
    } catch (loopErr) {
      console.error(`\n✗ Error processing "${talk.slug}":`, loopErr);
      failCount++;
    } finally {
      await prisma.$disconnect().catch(() => {});
    }
  }

  console.log(`\n================================================================`);
  console.log(`BATCH IMPORT SUMMARY:`);
  console.log(`- Total: ${talks.length}`);
  console.log(`- Succeeded: ${successCount}`);
  console.log(`- Skipped (already imported): ${skipCount}`);
  console.log(`- Failed: ${failCount}`);
  console.log(`================================================================\n`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect().catch(() => {}));

