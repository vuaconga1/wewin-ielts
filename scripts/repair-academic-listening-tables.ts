import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import type { StructuredTableLayout } from "../src/lib/import/schemas";

const slug = "test-13-listening";
const layouts: Record<number, StructuredTableLayout> = {
  21: {
    rows: [
      { cells: [
        { text: "Subject", header: true },
        { text: "Textbook Used", header: true },
        { text: "Criticism of this book", header: true },
      ] },
      { cells: [
        { text: "Social History" }, { text: "21 ..............." }, { text: "It is 22 ..............." },
      ] },
      { cells: [
        { text: "Cultural Studies" }, { text: "23 ..............." }, { text: "It 24 ..............." },
      ] },
      { cells: [
        { text: "25 ..............." }, { text: "Government in Action" }, { text: "It is 26 ..............." },
      ] },
    ],
  },
  36: {
    rows: [
      { cells: [
        { text: "Possible Solution", header: true },
        { text: "Important Factor", header: true },
        { text: "Examples", header: true },
      ] },
      { cells: [
        { text: "tourism" },
        { text: "Locals must 36 ..............." },
        { text: "The Daylesford area uses its 37 ..............." },
      ] },
      { cells: [
        { text: "using the 38 ..............." },
        { text: "- is 39 ............... by its distinctive product<br>- must market the idea effectively" },
        { text: "Shepparton is known for its 40 ..............." },
      ] },
    ],
  },
};

async function main() {
  const file = path.resolve("data/tests/test-13-listening.json");
  const draft = JSON.parse(await readFile(file, "utf8"));
  for (const part of draft.parts) {
    for (const question of part.questions) {
      const layout = layouts[question.number];
      if (layout) question.content = { ...question.content, variant: "TABLE_COMPLETION", tableLayout: layout };
    }
  }
  await writeFile(file, JSON.stringify(draft, null, 2) + "\n", "utf8");

  const test = await prisma.test.findUnique({ where: { slug }, include: { sections: { include: { questions: true } } } });
  if (!test) throw new Error(`${slug} not found`);
  for (const section of test.sections) {
    for (const question of section.questions) {
      const layout = layouts[question.number];
      if (!layout) continue;
      const current = question.content && typeof question.content === "object" && !Array.isArray(question.content) ? question.content : {};
      await prisma.question.update({ where: { id: question.id }, data: { content: { ...current, variant: "TABLE_COMPLETION", tableLayout: layout } } });
    }
  }
  console.log("Repaired Test 13 Listening tables: Q21-26 and Q36-40");
  await prisma.$disconnect();
}

main().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });