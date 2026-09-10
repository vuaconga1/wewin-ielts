import FS from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dest = path.join(__dirname, "..", "public", "templates");

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function para(text, bold = false) {
  const t = escapeXml(text);
  const rPr = bold ? "<w:rPr><w:b/></w:rPr>" : "";
  return `<w:p><w:r>${rPr}<w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
}

/** Real Word table cell (4-col STT | Đáp án layout). */
function cell(text, bold = false) {
  const t = escapeXml(text);
  const rPr = bold ? "<w:rPr><w:b/></w:rPr>" : "";
  return (
    `<w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/></w:tcPr>` +
    `<w:p><w:r>${rPr}<w:t xml:space="preserve">${t}</w:t></w:r></w:p></w:tc>`
  );
}

function tableRow(cells, bold = false) {
  return `<w:tr>${cells.map((c) => cell(c, bold)).join("")}</w:tr>`;
}

function table(rows) {
  return (
    `<w:tbl>` +
    `<w:tblPr><w:tblW w:w="0" w:type="auto"/>` +
    `<w:tblBorders>` +
    `<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>` +
    `<w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>` +
    `<w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>` +
    `<w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>` +
    `<w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>` +
    `<w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>` +
    `</w:tblBorders></w:tblPr>` +
    `<w:tblGrid>` +
    `<w:gridCol w:w="2200"/><w:gridCol w:w="2200"/>` +
    `<w:gridCol w:w="2200"/><w:gridCol w:w="2200"/>` +
    `</w:tblGrid>` +
    `${rows.join("")}</w:tbl>`
  );
}

const listening = [
  ["1", "Bittens", "21", "A"],
  ["2", "group", "22", "A"],
  ["3", "23", "23", "C"],
  ["4", "12.50", "24", "C"],
  ["5", "back", "25", "B"],
  ["6", "wheelchair", "26", "B"],
  ["7", "lift", "27", "D"],
  ["8", "library", "28", "A"],
  ["9", "vegetarian", "29", "F"],
  ["10", "pizza", "30", "G"],
  ["11", "C", "31", "company"],
  ["12", "A", "32", "original"],
  ["13", "B", "33", "description"],
  ["14", "A", "34", "engineering"],
  ["15", "B", "35", "communication"],
  ["16", "B", "36", "language"],
  ["17", "A", "37", "salary"],
  ["18", "C", "38", "lonley"],
  ["19", "B", "39", "industrial"],
  ["20", "C", "40", "government"],
];

const reading = [
  ["1", "F", "21", "D"],
  ["2", "NGV", "22", "B"],
  ["3", "T", "23", "one-sixth"],
  ["4", "F", "24", "16th century"],
  ["5", "F", "25", "Mercator"],
  ["6", "T", "26", "John Gould"],
  ["7", "1906", "27", "K"],
  ["8", "Australia", "28", "H"],
  ["9", "family", "29", "D"],
  ["10", "bankruptcy", "30", "J"],
  ["11", "writers", "31", "E"],
  ["12", "reputation", "32", "B"],
  ["13", "husband", "33", "B"],
  ["14", "I", "34", "C"],
  ["15", "F", "35", "D"],
  ["16", "G", "36", "C"],
  ["17", "D", "37", "B"],
  ["18", "C", "38", "YES"],
  ["19", "H", "39", "NGV"],
  ["20", "C", "40", "YES"],
];

const body = [];
body.push(para("Castle & Environment — Sample Keys", true));
body.push(para(""));
body.push(para("Listening", true));
body.push(para("Test 5"));
body.push(
  table([
    tableRow(["STT", "Đáp án", "STT", "Đáp án"], true),
    ...listening.map((r) => tableRow(r)),
  ]),
);
body.push(para(""));
body.push(para("Reading", true));
body.push(para("Test 5"));
body.push(
  table([
    tableRow(["STT", "Đáp án", "STT", "Đáp án"], true),
    ...reading.map((r) => tableRow(r)),
  ]),
);
const documentXml =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  `<w:body>${body.join("")}</w:body></w:document>`;

const contentTypes =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  "</Types>";

const rels =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  "</Relationships>";

const docRels =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';

const keysZip = new JSZip();
keysZip.file("[Content_Types].xml", contentTypes);
keysZip.folder("_rels").file(".rels", rels);
keysZip.folder("word").file("document.xml", documentXml);
keysZip.folder("word").folder("_rels").file("document.xml.rels", docRels);

const keysBuf = await keysZip.generateAsync({
  type: "nodebuffer",
  compression: "DEFLATE",
});
FS.writeFileSync(path.join(dest, "sample-keys.docx"), keysBuf);
console.log("Wrote sample-keys.docx", keysBuf.length);

const deZip = new JSZip();
deZip.file(
  "sample-listening.docx",
  FS.readFileSync(path.join(dest, "sample-listening.docx")),
);
deZip.file(
  "sample-reading.docx",
  FS.readFileSync(path.join(dest, "sample-reading.docx")),
);
deZip.file(
  "sample-writing.docx",
  FS.readFileSync(path.join(dest, "sample-writing.docx")),
);
const deBuf = await deZip.generateAsync({
  type: "nodebuffer",
  compression: "DEFLATE",
});
FS.writeFileSync(path.join(dest, "sample-de.zip"), deBuf);
console.log("Wrote sample-de.zip", deBuf.length);

const check = await JSZip.loadAsync(keysBuf);
const xml = await check.file("word/document.xml").async("string");
const text = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
console.log("Keys text sample:", text.slice(0, 220));
console.log("Has Word tables (<w:tbl>):", xml.includes("<w:tbl>"));
console.log("Has Bittens:", text.includes("Bittens"));
console.log("Has Mercator:", text.includes("Mercator"));
