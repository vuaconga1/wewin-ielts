import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";

async function main() {
  const shadowingDir = path.join(process.cwd(), "data", "shadowing");
  const dictationDir = path.join(process.cwd(), "data", "dictation");

  fs.mkdirSync(shadowingDir, { recursive: true });
  fs.mkdirSync(dictationDir, { recursive: true });

  const shadowing = await prisma.shadowingExercise.findMany();
  fs.writeFileSync(
    path.join(shadowingDir, "exercises.json"),
    JSON.stringify(shadowing, null, 2),
    "utf8"
  );
  console.log(`Synced ${shadowing.length} shadowing exercises.`);

  const dictation = await prisma.dictationExercise.findMany();
  fs.writeFileSync(
    path.join(dictationDir, "exercises.json"),
    JSON.stringify(dictation, null, 2),
    "utf8"
  );
  console.log(`Synced ${dictation.length} dictation exercises.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

