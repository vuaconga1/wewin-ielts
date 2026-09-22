/**
 * Strip teacher-filled answers / markup from Listening notes so students
 * see blanks only (Test 1 Listening often ships with answers typed into dots).
 *
 * Uses bounded, linear-time scans — unbounded blank-mark quantifiers caused
 * catastrophic backtracking on long empty IELTS blanks (e.g. Test 2 Section 3).
 */

const ELLIPSIS = "\u2026"; // …
const MID_ELLIPSIS = "\u22EF"; // ⋯
const ONE_DOT_LEADER = "\u2024"; // ․

function isBlankChar(ch: string | undefined): boolean {
  if (!ch) return false;
  return (
    ch === "." ||
    ch === "_" ||
    ch === ELLIPSIS ||
    ch === MID_ELLIPSIS ||
    ch === ONE_DOT_LEADER
  );
}

/** Length of blank-mark run at `i` (0 if none). */
function blankRunLen(s: string, i: number): number {
  let n = 0;
  while (i + n < s.length && isBlankChar(s[i + n])) n += 1;
  return n;
}

/**
 * Teacher-filled: `1 ......database..............` → `1 ........`
 * Require trailing blank marks so sentence tails stay intact.
 */
function stripFilledBlanksLinear(text: string): {
  text: string;
  stripped: number;
} {
  let stripped = 0;
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (
      /[1-9]/.test(ch) &&
      (i === 0 || !/[0-9]/.test(text[i - 1]!))
    ) {
      const numStart = i;
      let j = i + 1;
      if (j < text.length && /[0-9]/.test(text[j]!)) j += 1;
      const num = text.slice(numStart, j);
      const nVal = Number(num);
      if (num.length <= 2 && nVal >= 1 && nVal <= 40) {
        let k = j;
        while (k < text.length && /[^\S\n]/.test(text[k]!)) k += 1;
        let currency = "";
        if (k < text.length && /[$£€]/.test(text[k]!)) {
          currency = text[k]!;
          k += 1;
          while (k < text.length && /[^\S\n]/.test(text[k]!)) k += 1;
        }
        const leadBlank = blankRunLen(text, k);
        if (leadBlank >= 2) {
          let m = k + leadBlank;
          while (m < text.length && /[^\S\n]/.test(text[m]!)) m += 1;
          const ansStart = m;
          if (m < text.length && /[A-Za-z0-9]/.test(text[m]!)) {
            m += 1;
            while (
              m < text.length &&
              /[A-Za-z0-9/'%|-]/.test(text[m]!) &&
              blankRunLen(text, m) < 2
            ) {
              m += 1;
            }
            // optional second word starting with a letter
            let m2 = m;
            while (m2 < text.length && /[^\S\n]/.test(text[m2]!)) m2 += 1;
            if (
              m2 < text.length &&
              /[A-Za-z]/.test(text[m2]!) &&
              blankRunLen(text, m2) < 2
            ) {
              let m3 = m2 + 1;
              while (
                m3 < text.length &&
                /[A-Za-z0-9/'%|-]/.test(text[m3]!) &&
                blankRunLen(text, m3) < 2
              ) {
                m3 += 1;
              }
              let t2 = m3;
              while (t2 < text.length && /[^\S\n]/.test(text[t2]!)) t2 += 1;
              if (blankRunLen(text, t2) >= 2) m = m3;
            }
            let t = m;
            while (t < text.length && /[^\S\n]/.test(text[t]!)) t += 1;
            // Skip teacher parentheticals: (CORRECTED), (GARDEN), …
            if (text[t] === "(") {
              const close = text.indexOf(")", t + 1);
              if (close > t && close - t < 48) {
                t = close + 1;
                while (t < text.length && /[^\S\n]/.test(text[t]!)) t += 1;
              }
            }
            const trail = blankRunLen(text, t);
            if (trail >= 2 && m > ansStart) {
              const cur = currency ? `${currency} ` : "";
              out.push(`${num} ${cur}........`);
              i = t + trail;
              stripped += 1;
              continue;
            }
          }
        }
      }
    }
    out.push(ch);
    i += 1;
  }
  return { text: out.join(""), stripped };
}

function stripFilledLetterBlanksLinear(text: string): {
  text: string;
  stripped: number;
} {
  let stripped = 0;
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const lead = blankRunLen(text, i);
    if (lead >= 2) {
      let j = i + lead;
      while (j < text.length && /[^\S\n]/.test(text[j]!)) j += 1;
      const letter = text[j];
      if (
        letter &&
        /[A-I]/.test(letter) &&
        (j + 1 >= text.length || /[\s.\n]/.test(text[j + 1]!))
      ) {
        let k = j + 1;
        while (k < text.length && /[^\S\n]/.test(text[k]!)) k += 1;
        const trail = blankRunLen(text, k);
        if (trail >= 2) {
          out.push("........");
          i = k + trail;
          stripped += 1;
          continue;
        }
      }
    }
    out.push(text[i]!);
    i += 1;
  }
  return { text: out.join(""), stripped };
}

/** Collapse long blank runs after a question number to a canonical blank. */
function normalizeNumberedBlanks(text: string): string {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (
      /[1-9]/.test(ch) &&
      (i === 0 || !/[0-9]/.test(text[i - 1]!))
    ) {
      const numStart = i;
      let j = i + 1;
      if (j < text.length && /[0-9]/.test(text[j]!)) j += 1;
      const num = text.slice(numStart, j);
      const nVal = Number(num);
      if (num.length <= 2 && nVal >= 1 && nVal <= 40) {
        let k = j;
        while (k < text.length && /[^\S\n]/.test(text[k]!)) k += 1;
        let currency = "";
        if (k < text.length && /[$£€]/.test(text[k]!)) {
          currency = text[k]!;
          k += 1;
          while (k < text.length && /[^\S\n]/.test(text[k]!)) k += 1;
        }
        const run = blankRunLen(text, k);
        if (run >= 3) {
          const cur = currency ? `${currency} ` : "";
          const after = text[k + run];
          const pad =
            after && /[A-Za-z0-9(]/.test(after) && !/\s/.test(after)
              ? " "
              : "";
          out.push(`${num} ${cur}........${pad}`);
          i = k + run;
          continue;
        }
      }
    }
    // `........word` → `........ word`
    const run = blankRunLen(text, i);
    if (run >= 3) {
      const after = text[i + run];
      if (after && /[A-Za-z(]/.test(after)) {
        out.push("........ ");
        i = i + run;
        continue;
      }
    }
    out.push(ch);
    i += 1;
  }
  return out.join("");
}

/**
 * After partial strip: `........ SATURDAY........` / `........ …........`
 * → canonical blank. Bounded linear scan (no nested quantifiers).
 */
function stripResidualAnswerBetweenBlanks(text: string): {
  text: string;
  stripped: number;
} {
  let stripped = 0;
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const lead = blankRunLen(text, i);
    if (lead >= 3) {
      let j = i + lead;
      while (j < text.length && /[^\S\n]/.test(text[j]!)) j += 1;
      // unicode ellipsis alone between blanks
      if (
        text[j] === ELLIPSIS ||
        text[j] === MID_ELLIPSIS ||
        text[j] === ONE_DOT_LEADER
      ) {
        let k = j + 1;
        while (k < text.length && /[^\S\n]/.test(text[k]!)) k += 1;
        const trail = blankRunLen(text, k);
        if (trail >= 2) {
          out.push("........");
          i = k + trail;
          stripped += 1;
          continue;
        }
      }
      // word/number answer between blanks (max 40 chars)
      if (j < text.length && /[A-Za-z0-9]/.test(text[j]!)) {
        let k = j + 1;
        let chars = 1;
        while (
          k < text.length &&
          chars < 40 &&
          /[A-Za-z0-9/'%|-]/.test(text[k]!) &&
          blankRunLen(text, k) < 2
        ) {
          k += 1;
          chars += 1;
        }
        // optional second word
        let k2 = k;
        while (k2 < text.length && /[^\S\n]/.test(text[k2]!)) k2 += 1;
        if (
          k2 < text.length &&
          /[A-Za-z]/.test(text[k2]!) &&
          chars < 40 &&
          blankRunLen(text, k2) < 2
        ) {
          let k3 = k2 + 1;
          while (
            k3 < text.length &&
            chars < 40 &&
            /[A-Za-z0-9/'%|-]/.test(text[k3]!) &&
            blankRunLen(text, k3) < 2
          ) {
            k3 += 1;
            chars += 1;
          }
          k = k3;
        }
        let t = k;
        while (t < text.length && /[^\S\n]/.test(text[t]!)) t += 1;
        // skip (CORRECTED) / (GARDEN) teacher notes
        if (text[t] === "(") {
          const close = text.indexOf(")", t + 1);
          if (close > t && close - t < 48) {
            t = close + 1;
            while (t < text.length && /[^\S\n]/.test(text[t]!)) t += 1;
          }
        }
        const trail = blankRunLen(text, t);
        if (trail >= 2) {
          out.push("........");
          i = t + trail;
          stripped += 1;
          continue;
        }
      }
    }
    out.push(text[i]!);
    i += 1;
  }
  return { text: out.join(""), stripped };
}

export function stripFilledListeningAnswers(text: string): {
  text: string;
  stripped: number;
} {
  if (!text?.trim()) return { text: text ?? "", stripped: 0 };
  let stripped = 0;

  // Strip teacher `= …` notes before blanks. Keep a trailing preposition when
  // it belongs to the printed stem (`= free for 7……advice` → keep ` for`).
  let out = text.replace(
    /\s*=\s*[A-Za-z][A-Za-z0-9\s.,'-]{0,35}?(?=\s+(?:for|to|of|in|at|on|with)\s+\d|\s+\d|$)/gi,
    () => {
      stripped += 1;
      return "";
    },
  );

  out = out.replace(/\(\s*x\s*\d+\s*\)\s*/gi, () => {
    stripped += 1;
    return "";
  });
  out = out.replace(/\bsửa\s+lần\s+\d+\b/gi, () => {
    stripped += 1;
    return "";
  });
  out = out.replace(
    /\bWORDS?\s+LIMIT\b|\bFINAL\s+DECISION\b|\bwasn'?t\s+crowded\b|\bshow\s+emotions\s*—?>?\s*plant\b|\(\s*trees\s*\)/gi,
    () => {
      stripped += 1;
      return "";
    },
  );
  // Teacher markup common in WEWIN papers (Test 3 Listening)
  out = out.replace(/\(\s*CORRECTED\s*\)/gi, () => {
    stripped += 1;
    return "";
  });
  out = out.replace(/\(\s*corrected[_a-z]*\s*\)/gi, () => {
    stripped += 1;
    return "";
  });
  out = out.replace(/\s*—?>\s*[^\n|]{0,60}/g, () => {
    stripped += 1;
    return "";
  });
  out = out.replace(/\s*→\s*[^\n|]{0,60}/g, () => {
    stripped += 1;
    return "";
  });

  const filled = stripFilledBlanksLinear(out);
  out = filled.text;
  stripped += filled.stripped;

  const residual = stripResidualAnswerBetweenBlanks(out);
  out = residual.text;
  stripped += residual.stripped;

  const letters = stripFilledLetterBlanksLinear(out);
  out = letters.text;
  stripped += letters.stripped;

  // Matching labels with teacher letter filled in: "On the Water D" / "Faces A"
  // Only rewrite short label lines (avoid scanning long instruction paragraphs).
  out = out
    .split("\n")
    .map((line) => {
      if (line.length > 60) return line;
      const m =
        /^(?:[A-F]\.\s*)?([A-Za-z][A-Za-z0-9 &'/-]{2,40}?)\s+([A-F])\s*$/.exec(
          line,
        );
      if (!m) return line;
      stripped += 1;
      return m[1]!.trim();
    })
    .join("\n");

  out = normalizeNumberedBlanks(out);

  out = out
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  return { text: out.trim(), stripped };
}
