import mammoth from "mammoth";
import JSZip from "jszip";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { htmlContentToTextWithMarkdownTables } from "@/lib/practice/notes-table";

export type DocxExtractMeta = {
  text: string;
  /** Number of embedded images under word/media/ */
  imageCount: number;
  /**
   * True when the docx has images but almost no extractable text
   * (typical screenshot-only answer keys).
   */
  looksImageOnly: boolean;
};

export async function extractTextFromUpload(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const meta = await extractUploadWithMeta(buffer, filename);
  return meta.text;
}

export async function extractUploadWithMeta(
  buffer: Buffer,
  filename: string,
  options: { includeTables?: boolean; preserveContentTables?: boolean } = {},
): Promise<DocxExtractMeta> {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".docx") {
    return extractDocxWithMeta(buffer, options);
  }
  if (ext === ".md" || ext === ".txt") {
    const text = buffer.toString("utf8");
    return { text, imageCount: 0, looksImageOnly: false };
  }
  throw new Error(`Unsupported file type: ${ext}`);
}

export async function extractTextFromFile(filePath: string): Promise<string> {
  const meta = await extractFileWithMeta(filePath);
  return meta.text;
}

export async function extractFileWithMeta(
  filePath: string,
  options: { includeTables?: boolean; preserveContentTables?: boolean } = {},
): Promise<DocxExtractMeta> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".docx") {
    const buffer = await readFile(filePath);
    return extractDocxWithMeta(buffer, options);
  }
  if (ext === ".md" || ext === ".txt") {
    const text = await readFile(filePath, "utf8");
    return { text, imageCount: 0, looksImageOnly: false };
  }
  throw new Error(`Unsupported file type: ${ext} (${filePath})`);
}

export async function extractTextFromDocx(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  return extractTextFromDocxBuffer(buffer);
}

export async function extractTextFromDocxBuffer(
  buffer: Buffer,
): Promise<string> {
  const meta = await extractDocxWithMeta(buffer);
  return meta.text;
}

/**
 * Extract docx text.
 * - `includeTables` (keys): append TSV rows for key parsers
 * - `preserveContentTables` (Listening/Reading body): keep Word tables as
 *   markdown so the practice UI can render real columns
 */
export async function extractDocxWithMeta(
  buffer: Buffer,
  options: { includeTables?: boolean; preserveContentTables?: boolean } = {},
): Promise<DocxExtractMeta> {
  const includeTables = options.includeTables ?? false;
  const preserveContentTables = options.preserveContentTables ?? false;

  const rawResult = await mammoth.extractRawText({ buffer });
  let text = rawResult.value.replace(/\r\n/g, "\n").trim();

  if (includeTables || preserveContentTables) {
    try {
      const htmlResult = await mammoth.convertToHtml({ buffer });
      if (preserveContentTables) {
        text = htmlContentToTextWithMarkdownTables(htmlResult.value);
      } else if (includeTables) {
        const tableText = htmlTablesToTsv(htmlResult.value);
        if (tableText) {
          text = [text, tableText].filter(Boolean).join("\n\n").trim();
        }
      }
    } catch {
      // Keep raw text if HTML conversion fails
    }
  }

  const imageCount = await countDocxImages(buffer);
  const significant = text
    .replace(/\b(listening|reading|writing|speaking)\b/gi, "")
    .replace(/[^\p{L}\p{N}]+/gu, "");
  const looksImageOnly = imageCount > 0 && significant.length < 40;

  return { text, imageCount, looksImageOnly };
}

async function countDocxImages(buffer: Buffer): Promise<number> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    return Object.keys(zip.files).filter((f) =>
      /^word\/media\/.+\.(png|jpe?g|gif|bmp|emf|wmf|tiff?)$/i.test(f),
    ).length;
  } catch {
    return 0;
  }
}

/** Flatten HTML tables from mammoth into TSV-ish lines for key parsers. */
export function htmlTablesToTsv(html: string): string {
  if (!html || !/<table/i.test(html)) return "";

  const rows: string[] = [];
  const tableRe = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRe.exec(html)) !== null) {
    const tableHtml = tableMatch[1]!;
    const rowRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRe.exec(tableHtml)) !== null) {
      const cells: string[] = [];
      const cellRe = /<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi;
      let cellMatch: RegExpExecArray | null;
      while ((cellMatch = cellRe.exec(rowMatch[1]!)) !== null) {
        const cell = cellMatch[1]!
          .replace(/<br\s*\/?>/gi, " ")
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/gi, " ")
          .replace(/&amp;/gi, "&")
          .replace(/&lt;/gi, "<")
          .replace(/&gt;/gi, ">")
          .replace(/\s+/g, " ")
          .trim();
        cells.push(cell);
      }
      if (cells.some((c) => c)) {
        rows.push(cells.join("\t"));
      }
    }
  }

  return rows.join("\n").trim();
}

/**
 * Convert mammoth plain text into markdown-friendlier form:
 * keep blank lines; headings are expected to already be in source as "PART:" etc.
 * Also restore paragraph breaks when Word list/label lines were concatenated.
 */
export function normalizeExtractedText(text: string): string {
  let out = text.replace(/\r\n/g, "\n").replace(/\t+/g, " ");

  // Section / question headers stuck to previous sentence (form lists → one line)
  // Match "LISTENING SECTION N" as one unit — do not split LISTENING|SECTION.
  out = out.replace(
    /([^\n])(?=LISTENING\s+SECTION\s+\d+\b)/gi,
    "$1\n\n",
  );
  out = out.replace(
    /([^\n])(?<!LISTENING\s)(?<!LISTENING)(?=SECTION\s+\d+\b)/gi,
    "$1\n\n",
  );
  out = out.replace(
    // Case-sensitive: avoid splitting mid-sentence "next to questions 37-40"
    /([^\n])(?=Questions?\s+\d+(?:\s*[-–—]\s*\d+|\s+and\s+\d+)?\b)/g,
    "$1\n\n",
  );

  // Common Listening form / notes labels glued after prior field values
  out = out.replace(
    /([^\n])(?=(?:Email address|Current address|New Zealand Employer|Occupation|Rental start date|Preferred property type|first preference|second preference|Bedrooms|Furnishings|Maximum rent|Preferred location|Other requirements|Phone number)\s*:)/gi,
    "$1\n",
  );
  // Sub-bullets under "Other requirements" / similar
  out = out.replace(/([^\n])(?=(?:must have|would like)\s+\d{1,2}\s)/gi, "$1\n");

  return out.replace(/\n{3,}/g, "\n\n").trim();
}
