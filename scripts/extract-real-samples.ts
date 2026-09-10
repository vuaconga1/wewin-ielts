import { mkdir, writeFile } from "node:fs/promises";
import {
  extractTextFromFile,
  normalizeExtractedText,
} from "../src/lib/import/docx";

const files: [string, string][] = [
  [
    "keys",
    "e:/Wewin/Wewin-Education-main/anh_wewin/flyer/unit 7/Castle & Environment/Keyss.docx",
  ],
  [
    "listening",
    "e:/Wewin/Wewin-Education-main/anh_wewin/flyer/unit 7/Castle & Environment/Listening 5.docx",
  ],
  [
    "reading",
    "e:/Wewin/Wewin-Education-main/anh_wewin/flyer/unit 7/Castle & Environment/Reading 5.docx",
  ],
  [
    "writing",
    "e:/Wewin/Wewin-Education-main/anh_wewin/flyer/unit 7/Castle & Environment/WRITING 5 (1).docx",
  ],
];

async function main() {
  await mkdir("tmp/real-samples", { recursive: true });
  for (const [name, p] of files) {
    try {
      const text = normalizeExtractedText(await extractTextFromFile(p));
      await writeFile(`tmp/real-samples/${name}.txt`, text, "utf8");
      console.log(`=== ${name} len=${text.length} ===`);
      console.log(text.slice(0, 3000));
      console.log("\n----- END PREVIEW -----\n");
    } catch (e) {
      console.error(`FAIL ${name}:`, e);
    }
  }
}

main();
