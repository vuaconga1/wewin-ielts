import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";

async function main() {
  const p =
    "e:/Wewin/Wewin-Education-main/anh_wewin/flyer/unit 7/Castle & Environment/Keyss.docx";
  const buf = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(buf);
  const media = Object.keys(zip.files).filter((f) =>
    f.startsWith("word/media/"),
  );
  console.log("media files:", media);
  const outDir = "tmp/real-samples/keys-media";
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of media) {
    const data = await zip.files[f]!.async("nodebuffer");
    const out = path.join(outDir, path.basename(f));
    fs.writeFileSync(out, data);
    console.log("wrote", out, data.length);
  }
}

main();
