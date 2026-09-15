/**
 * Build public/templates/test-9-samples.zip from test-9-*.docx sources.
 * Source docx: copy from E:\Wewin\IELTS\Test 9\ (see docs/TEST-9-TEMPLATE.md).
 *
 *   node scripts/build-test-9-templates.mjs
 */
import FS from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dest = path.join(__dirname, "..", "public", "templates");

const files = [
  ["Listening 9.docx", "test-9-listening.docx"],
  ["Reading 9.docx", "test-9-reading.docx"],
  ["Writing 9.docx", "test-9-writing.docx"],
  ["Key 9.docx", "test-9-keys.docx"],
];

const zip = new JSZip();
for (const [zipName, srcName] of files) {
  const abs = path.join(dest, srcName);
  if (!FS.existsSync(abs)) {
    console.error(`Missing ${abs} — copy Test 9 docx into public/templates/ first.`);
    process.exit(1);
  }
  zip.file(zipName, FS.readFileSync(abs));
}

const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
FS.writeFileSync(path.join(dest, "test-9-samples.zip"), buf);
console.log("Wrote test-9-samples.zip", buf.length, "bytes");
