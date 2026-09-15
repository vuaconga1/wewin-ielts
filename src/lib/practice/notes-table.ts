/**
 * Detect / rebuild IELTS "complete the table" notes into a real table model
 * so Listening/Reading can render columns instead of a flat bullet dump.
 */

export type NotesTable = {
  title?: string;
  headers: string[];
  rows: string[][];
};

const MD_TABLE_SEP = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/;

/**
 * Parse a GitHub-style markdown table (cells may contain `<br>` for line breaks).
 */
export function parseMarkdownTable(text: string): NotesTable | null {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  let start = lines.findIndex((l) => l.includes("|"));
  if (start < 0) return null;

  // Optional italic/plain title line immediately above the table
  let title: string | undefined;
  if (start > 0) {
    const maybeTitle = lines[start - 1]!;
    if (!maybeTitle.includes("|")) title = maybeTitle.replace(/^\*+|\*+$/g, "").trim();
  }

  const headerLine = lines[start]!;
  const sepLine = lines[start + 1];
  if (!sepLine || !MD_TABLE_SEP.test(sepLine.replace(/\s+/g, ""))) {
    // allow loose sep
    if (!sepLine || !/-{3,}/.test(sepLine) || !sepLine.includes("|")) return null;
  }

  const headers = splitMdRow(headerLine);
  if (headers.length < 2) return null;

  const rows: string[][] = [];
  for (let i = start + 2; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.includes("|")) break;
    const cells = splitMdRow(line);
    if (cells.length === 1 && !cells[0]) continue;
    // Pad / trim to header width
    while (cells.length < headers.length) cells.push("");
    rows.push(cells.slice(0, headers.length));
  }

  if (!rows.length) return null;
  return { title, headers, rows };
}

function splitMdRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

/**
 * Rebuild the common Listening Section 4 supermarket-layout table from the
 * flattened mammoth text (headers + row labels + mixed bullets).
 */
export function rebuildLayoutDescriptionTable(notes: string): NotesTable | null {
  const text = notes.replace(/\r\n/g, "\n").trim();
  if (!/Layout/i.test(text) || !/Description/i.test(text)) return null;
  if (!/Advantages/i.test(text) || !/Disadvantages/i.test(text)) return null;

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const headerIdx = lines.findIndex(
    (l, i) =>
      /^Layout$/i.test(l) &&
      /^Description$/i.test(lines[i + 1] ?? "") &&
      /^Advantages$/i.test(lines[i + 2] ?? "") &&
      /^Disadvantages$/i.test(lines[i + 3] ?? ""),
  );
  if (headerIdx < 0) return null;

  const title =
    headerIdx > 0
      ? lines[headerIdx - 1]!.replace(/^\*+|\*+$/g, "").trim()
      : undefined;

  const body = lines.slice(headerIdx + 4);
  const rowStarts = ["Grid", "Free form", "Boutique"];
  const indexes: number[] = [];
  for (let i = 0; i < body.length; i++) {
    if (rowStarts.some((r) => body[i]!.toLowerCase() === r.toLowerCase())) {
      indexes.push(i);
    }
  }
  if (indexes.length < 2) return null;

  const rows: string[][] = [];
  for (let r = 0; r < indexes.length; r++) {
    const start = indexes[r]!;
    const end = r + 1 < indexes.length ? indexes[r + 1]! : body.length;
    const chunk = body.slice(start, end);
    const layout = chunk[0]!;
    const rest = chunk.slice(1);
    const { description, advantages, disadvantages } = splitRowCells(rest);
    rows.push([layout, description, advantages, disadvantages]);
  }

  return {
    title,
    headers: ["Layout", "Description", "Advantages", "Disadvantages"],
    rows,
  };
}

/**
 * Split flat row lines into Description / Advantages / Disadvantages cells.
 * Uses blank numbers + bullet markers like the Cambridge Word table.
 */
function splitRowCells(lines: string[]): {
  description: string;
  advantages: string;
  disadvantages: string;
} {
  const desc: string[] = [];
  const bullets: string[] = [];
  for (const line of lines) {
    if (/^[-•·]\s*/.test(line)) bullets.push(line.replace(/^[-•·]\s*/, "- "));
    else desc.push(line);
  }

  if (bullets.length === 0) {
    return {
      description: desc.join("<br>"),
      advantages: "",
      disadvantages: "",
    };
  }

  // Prefer split by blank number bands when present
  const withBlank = bullets.map((b) => ({
    text: b,
    n: firstBlankNumber(b),
  }));

  // Known Cambridge placement: lower blank # in a row → advantages side first
  const blankNums = withBlank.map((b) => b.n).filter((n): n is number => n != null);
  if (blankNums.length >= 2) {
    const mid = Math.min(...blankNums) + 0.5;
    // First blank → still in advantages (with preceding non-blank adv bullets)
    // For Grid: 31 adv, 32 dis. Free form: 34 adv, 35 dis. Boutique: only 36 adv.
  }

  // Structural split used by Word table for this item:
  // - bullets belonging with the first blank number (and earlier) = advantages
  // - remaining = disadvantages
  if (blankNums.length >= 1) {
    const firstBlank = Math.min(...blankNums);
    const adv: string[] = [];
    const dis: string[] = [];
    let seenFirstBlank = false;
    let passedAdvBlank = false;
    for (const b of withBlank) {
      if (b.n === firstBlank) {
        seenFirstBlank = true;
        adv.push(b.text);
        passedAdvBlank = true;
        continue;
      }
      if (!seenFirstBlank && b.n == null) {
        adv.push(b.text);
        continue;
      }
      if (passedAdvBlank && b.n == null && adv.length && !dis.length) {
        // Boutique: "creates attractive image" after 36, still advantages
        // Heuristic: if no second blank yet and text looks positive, keep in adv
        if (/attractive|efficient|control|create|separat/i.test(b.text)) {
          adv.push(b.text);
          continue;
        }
      }
      dis.push(b.text);
    }
    // If everything landed in adv but we have a second blank, resplit
    if (dis.length === 0 && blankNums.length >= 2) {
      const second = blankNums.find((n) => n !== firstBlank)!;
      const adv2: string[] = [];
      const dis2: string[] = [];
      let hitSecond = false;
      for (const b of withBlank) {
        if (b.n === second) hitSecond = true;
        (hitSecond ? dis2 : adv2).push(b.text);
      }
      return {
        description: desc.join("<br>"),
        advantages: adv2.join("<br>"),
        disadvantages: dis2.join("<br>"),
      };
    }
    return {
      description: desc.join("<br>"),
      advantages: adv.join("<br>"),
      disadvantages: dis.join("<br>"),
    };
  }

  // No blanks in bullets: half / half
  const mid = Math.ceil(bullets.length / 2);
  return {
    description: desc.join("<br>"),
    advantages: bullets.slice(0, mid).join("<br>"),
    disadvantages: bullets.slice(mid).join("<br>"),
  };
}

function firstBlankNumber(line: string): number | null {
  const m = line.match(
    /(\d{1,2})\s*(?:[$€£]\s*)?(?:(?:[.…_…]|\.){2,}|_{2,}|\u2026+)/u,
  );
  return m ? Number(m[1]) : null;
}

/** Try markdown first, then flat Layout/Description reconstruction. */
export function detectNotesTable(notes: string): NotesTable | null {
  const md = parseMarkdownTable(notes);
  if (md) return md;
  return rebuildLayoutDescriptionTable(notes);
}

function cellHtmlToPlain(cellHtml: string): string {
  return cellHtml
    .replace(/<\/li>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "")
    .replace(/<\/p>\s*<p>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const ROMAN_LOWER = [
  "i",
  "ii",
  "iii",
  "iv",
  "v",
  "vi",
  "vii",
  "viii",
  "ix",
  "x",
  "xi",
  "xii",
  "xiii",
  "xiv",
  "xv",
];

/**
 * Single-cell Word tables often wrap "List of Headings" / option banks.
 * Preserve them as labeled lines (roman numerals for heading lists).
 */
function formatBankTableCell(text: string): string {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return "";

  const titleIdx = lines.findIndex((l) =>
    /list of headings|list of (sub-)?famil/i.test(l),
  );
  const title = titleIdx >= 0 ? lines[titleIdx]! : null;
  const items = lines.filter((_, i) => i !== titleIdx);

  if (title && /list of headings/i.test(title)) {
    const alreadyLabeled = items.every((l) =>
      /^(?:[ivxlcdm]+|\d+)\s*[.)]/i.test(l),
    );
    if (alreadyLabeled) {
      return [title, ...items].join("\n");
    }
    return [
      title,
      ...items.map((item, i) => `${ROMAN_LOWER[i] ?? i + 1}. ${item}`),
    ].join("\n");
  }

  if (title) return [title, ...items].join("\n");
  return lines.join("\n");
}

/** Convert HTML <table> (mammoth) to markdown with <br> inside cells. */
export function htmlTableToMarkdown(tableHtml: string): string {
  const rowRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows: string[][] = [];
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(tableHtml)) !== null) {
    const cells: string[] = [];
    const cellRe = /<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRe.exec(rowMatch[1]!)) !== null) {
      const raw = cellHtmlToPlain(cellMatch[1]!);
      // Multi-line bank cells keep newlines; grid cells stay single-line
      const cell = raw.includes("\n")
        ? raw
        : raw.replace(/\s+/g, " ").trim();
      cells.push(cell);
    }
    if (cells.some((c) => c)) rows.push(cells);
  }

  // List-of-headings / option bank wrapped in a 1×1 table
  if (
    rows.length === 1 &&
    rows[0]!.length === 1 &&
    /list of headings|list of (sub-)?famil|\n/i.test(rows[0]![0]!)
  ) {
    return formatBankTableCell(rows[0]![0]!);
  }

  if (rows.length < 2) {
    // Still emit single-row content rather than wiping it
    if (rows.length === 1) {
      const cells = rows[0]!;
      if (cells.length === 1) return formatBankTableCell(cells[0]!);
      return cells.map((c) => c.replace(/\n/g, "<br>")).join(" | ");
    }
    return "";
  }
  const width = Math.max(...rows.map((r) => r.length));
  const norm = rows.map((r) => {
    const copy = [...r];
    while (copy.length < width) copy.push("");
    return copy.map((c) => c.replace(/\n/g, "<br>"));
  });
  const header = norm[0]!;
  const sep = header.map(() => "---");
  const lines = [
    `| ${header.join(" | ")} |`,
    `| ${sep.join(" | ")} |`,
    ...norm.slice(1).map((r) => `| ${r.join(" | ")} |`),
  ];
  return lines.join("\n");
}

/**
 * Convert Listening MCQ nested &lt;ol&gt; (stem + A/B/C options) into
 * numbered plain text the question parser already understands.
 * Innermost lists first. Tables are protected (heading banks live there).
 */
function convertMcqOrderedLists(html: string): string {
  const tables: string[] = [];
  let out = html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (table) => {
    tables.push(table);
    return `\n<!--TABLE_PLACEHOLDER_${tables.length - 1}-->\n`;
  });

  let guard = 0;
  while (guard++ < 20) {
    const next = out.replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (full, inner) => {
      if (/<ol\b/i.test(inner)) return full; // wait for innermost
      const items: string[] = [];
      const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
      let m: RegExpExecArray | null;
      while ((m = liRe.exec(inner)) !== null) {
        const plain = cellHtmlToPlain(m[1]!);
        if (plain) items.push(plain);
      }
      if (items.length < 2) {
        return items.map((t) => `${t}\n`).join("");
      }

      // Heading / word banks: many long lines, no question marks
      if (
        items.length >= 5 &&
        !items.some((t) => /\?/.test(t)) &&
        items.filter((t) => t.length >= 24).length >= Math.ceil(items.length * 0.6)
      ) {
        return "\n" + items.join("\n") + "\n";
      }

      // Pure short option list (nested under a stem <li>)
      if (
        items.length >= 2 &&
        items.length <= 5 &&
        items.every((t) => t.length < 90 && !/\?/.test(t) && !/^\d+[.)]/.test(t))
      ) {
        // Matching prompts with teacher letters: "On the Water D" — keep plain
        if (
          items.filter((t) => /\s+[A-F]\s*$/.test(t.trim())).length >=
          Math.ceil(items.length * 0.5)
        ) {
          return "\n" + items.join("\n") + "\n";
        }
        const labels = "ABCDEFGH";
        return (
          "\n" + items.map((o, i) => `${labels[i]}. ${o}`).join("\n") + "\n"
        );
      }

      // Flat / mixed list: walk sequentially — stem(?) + following short opts
      const lines: string[] = [];
      let i = 0;
      const labels = "ABCDE";
      while (i < items.length) {
        const item = items[i]!;
        if (/\nA\.\s/.test(item) && /\nB\.\s/.test(item)) {
          lines.push(item);
          i += 1;
          continue;
        }
        lines.push(item);
        i += 1;
        if (!/\?/.test(item)) continue;
        let oi = 0;
        while (
          i < items.length &&
          oi < 5 &&
          !/\?/.test(items[i]!) &&
          !/\nA\.\s/.test(items[i]!) &&
          items[i]!.length < 100
        ) {
          lines.push(`${labels[oi++]}. ${items[i]!}`);
          i += 1;
        }
      }
      return "\n" + lines.join("\n") + "\n";
    });
    if (next === out) break;
    out = next;
  }

  out = out.replace(/<!--TABLE_PLACEHOLDER_(\d+)-->/g, (_, n) => tables[Number(n)]!);
  return out;
}

/**
 * Replace each HTML table in a mammoth HTML document with a markdown table,
 * then strip remaining tags → content text that keeps table structure.
 */
export function htmlContentToTextWithMarkdownTables(html: string): string {
  if (!html) return "";
  let out = convertMcqOrderedLists(html);
  out = out.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (table) => {
    const md = htmlTableToMarkdown(table);
    return md ? `\n\n${md}\n\n` : "\n\n";
  });
  // Drop embedded images from text stream (handled separately via extract)
  out = out.replace(/<img\b[^>]*>/gi, "\n");
  out = out
    // Word form/notes lists: preserve one item per line (mammoth uses <ul>/<ol>/<li>)
    .replace(/<\/li>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "")
    .replace(/<\/(?:ul|ol)>/gi, "\n")
    .replace(/<(?:ul|ol)\b[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"');
  return out.replace(/\n{3,}/g, "\n\n").trim();
}
