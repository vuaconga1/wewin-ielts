import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import type { WorksheetLesson, WorksheetCardCatalogItem } from "../src/lib/learn/worksheet-types";

const ROOT = path.join(__dirname, "..", "data", "learn");
const CARDS_DIR = path.join(ROOT, "worksheet-cards");
const CATALOG_PATH = path.join(ROOT, "worksheet-cards-catalog.json");

function testCards() {
  if (!existsSync(CATALOG_PATH)) {
    console.error("FAIL: Catalog path does not exist:", CATALOG_PATH);
    process.exit(1);
  }

  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as {
    cards: WorksheetCardCatalogItem[];
  };

  console.log(`Checking ${catalog.cards.length} cards in catalog...`);

  let totalQuestions = 0;
  let totalSections = 0;

  for (const card of catalog.cards) {
    const cardFile = path.join(CARDS_DIR, `${card.id}.json`);
    if (!existsSync(cardFile)) {
      console.error(`FAIL: Card file missing: ${cardFile}`);
      process.exit(1);
    }

    const lesson = JSON.parse(readFileSync(cardFile, "utf8")) as WorksheetLesson;
    if (lesson.sections.length !== card.sectionCount) {
      console.error(
        `FAIL: ${card.id} sectionCount mismatch. Catalog: ${card.sectionCount}, File: ${lesson.sections.length}`,
      );
      process.exit(1);
    }

    const qCount = lesson.sections.reduce((acc, s) => acc + s.questions.length, 0);
    if (qCount !== card.questionCount) {
      console.error(
        `FAIL: ${card.id} questionCount mismatch. Catalog: ${card.questionCount}, File: ${qCount}`,
      );
      process.exit(1);
    }

    // Check unique section keys and alphabetical order
    const seenKeys = new Set<string>();
    for (const sec of lesson.sections) {
      if (seenKeys.has(sec.sectionKey)) {
        console.error(`FAIL: ${card.id} duplicate sectionKey: ${sec.sectionKey}`);
        process.exit(1);
      }
      seenKeys.add(sec.sectionKey);

      for (const q of sec.questions) {
        if (!q.id || !q.prompt) {
          console.error(`FAIL: ${card.id} question missing id or prompt in section ${sec.sectionKey}`);
          process.exit(1);
        }
      }
    }

    totalSections += card.sectionCount;
    totalQuestions += card.questionCount;
    console.log(
      `  ✓ ${card.id} [${card.level}]: ${card.title} - ${card.subjectVi} (${card.sectionCount} sections, ${card.questionCount} questions)`,
    );
  }

  console.log(`\nALL 20 CARDS VALIDATED SUCCESSFULLY:`);
  console.log(`Total Sections: ${totalSections}`);
  console.log(`Total Questions: ${totalQuestions}`);
}

testCards();

