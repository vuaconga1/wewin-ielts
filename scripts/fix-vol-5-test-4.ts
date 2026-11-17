import { prisma } from "../src/lib/prisma";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  console.log("Fixing real-ielts-vol-5-test-4-reading...");

  const test = await prisma.test.findFirst({
    where: { slug: "real-ielts-vol-5-test-4-reading" },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            orderBy: { number: "asc" },
            include: { answerKey: true },
          },
        },
      },
    },
  });

  if (!test) {
    throw new Error("real-ielts-vol-5-test-4-reading not found in DB");
  }

  const p3 = test.sections[2];
  if (!p3) {
    throw new Error("Passage 3 not found");
  }

  // 1. Fix Q27-32 variants (MATCHING_INFORMATION instead of MATCHING_SENTENCE_ENDINGS)
  for (const q of p3.questions) {
    if (q.number >= 27 && q.number <= 32) {
      const content = q.content as Record<string, unknown>;
      content.variant = "MATCHING_INFORMATION";
      await prisma.question.update({
        where: { id: q.id },
        data: { content: content as any },
      });
      console.log(`Updated Q${q.number} variant to MATCHING_INFORMATION`);
    }
  }

  // 2. Fix Q38-40 options, stems, and variants
  const correctOptions = [
    { label: "A", text: "gravitational pull" },
    { label: "B", text: "ice" },
    { label: "C", text: "solid core" },
    { label: "D", text: "ultraviolet light" },
    { label: "E", "text": "Milky Way" },
    { label: "F", "text": "disk" },
  ];

  const stemsByNumber: Record<number, string> = {
    38: "A hard centre becomes larger and this produces enough gravity to draw gas from the 38 ................ around it.",
    39: "Stars can break up the outer gaseous parts which surround objects in the sky because the attraction of the 39 ................ from stars is very powerful.",
    40: "Heat caused by 40 ................ can also destroy the material surrounding the objects in a relatively short time.",
  };

  for (const q of p3.questions) {
    if (q.number >= 38 && q.number <= 40) {
      const content = q.content as Record<string, unknown>;
      content.options = correctOptions;
      content.stem = stemsByNumber[q.number];
      content.variant = "MATCHING_INFORMATION";
      await prisma.question.update({
        where: { id: q.id },
        data: { content: content as any },
      });
      console.log(`Updated Q${q.number} options, stem, and variant`);
    }
  }

  // 3. Fix test-12-reading typos if present
  const t12 = await prisma.test.findFirst({
    where: { slug: "test-12-reading" },
    include: {
      sections: {
        include: {
          questions: true,
        },
      },
    },
  });

  if (t12) {
    for (const s of t12.sections) {
      for (const q of s.questions) {
        const c = q.content as Record<string, unknown>;
        let changed = false;
        if (typeof c.stem === "string" && c.stem.includes("LCIO Mayer")) {
          c.stem = c.stem.replace("LCIO Mayer", "Lucio Mayer");
          changed = true;
        }
        if (typeof c.stem === "string" && c.stem.includes("Ran Clarke")) {
          c.stem = c.stem.replace("Ran Clarke", "Ron Clarke");
          changed = true;
        }
        if (changed) {
          await prisma.question.update({
            where: { id: q.id },
            data: { content: c as any },
          });
          console.log(`Fixed typo in test-12-reading Q${q.number}`);
        }
      }
    }
  }

  // 4. Update data/tests/test-12-reading.json
  const t12JsonPath = path.join(process.cwd(), "data/tests/test-12-reading.json");
  try {
    let t12Json = await readFile(t12JsonPath, "utf-8");
    if (t12Json.includes("LCIO Mayer") || t12Json.includes("Ran Clarke")) {
      t12Json = t12Json.replace(/LCIO Mayer/g, "Lucio Mayer");
      t12Json = t12Json.replace(/Ran Clarke/g, "Ron Clarke");
      await writeFile(t12JsonPath, t12Json, "utf-8");
      console.log("Updated data/tests/test-12-reading.json typos");
    }
  } catch (err) {
    console.warn("Could not update test-12-reading.json:", err);
  }

  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
