/**
 * Canonicalizes English number words to digits so "twenty-five", "twenty five"
 * and "25" (or "twenty-first" and "21st") compare equal. Applied to both the key
 * and the learner answer, so the conversion only needs to be consistent.
 */

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

const SCALES: Record<string, number> = { hundred: 100, thousand: 1000, million: 1_000_000 };

const ORDINAL_UNITS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9,
  tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15,
  sixteenth: 16, seventeenth: 17, eighteenth: 18, nineteenth: 19,
};

const ORDINAL_TENS: Record<string, number> = {
  twentieth: 20, thirtieth: 30, fortieth: 40, fiftieth: 50, sixtieth: 60, seventieth: 70,
  eightieth: 80, ninetieth: 90,
};

const ORDINAL_SCALES: Record<string, number> = {
  hundredth: 100, thousandth: 1000, millionth: 1_000_000,
};

function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  return ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
}

function isNumberWord(w: string): boolean {
  return (
    w in UNITS || w in TENS || w in SCALES ||
    w in ORDINAL_UNITS || w in ORDINAL_TENS || w in ORDINAL_SCALES
  );
}

const SEPARATOR = /^(?:\s+|-)$/;

/** Replaces runs of number words in lowercase text; other words and spacing are kept. */
export function canonicalizeNumberWords(text: string): string {
  if (!text || !/[a-z]/.test(text)) return text;
  const parts = text.split(/(\s+|-)/).filter((p) => p !== "");
  const out: string[] = [];
  let total = 0;
  let group = 0;
  let last: "unit" | "tens" | "scale" | null = null;
  let runStart = -1;
  let runEnd = -1;

  const flush = (suffix = "") => {
    if (last === null) return;
    out.splice(runStart, runEnd - runStart, `${total + group}${suffix}`);
    total = 0;
    group = 0;
    last = null;
  };

  const startOrContinue = (fits: boolean) => {
    if (!fits) flush();
    if (last === null) runStart = out.length;
  };

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (SEPARATOR.test(p)) {
      out.push(p);
      continue;
    }
    const next = parts.slice(i + 1).find((x) => !SEPARATOR.test(x));
    if (p === "and" && last === "scale" && next && isNumberWord(next)) {
      out.push(p);
      continue;
    }
    if ((p === "a" || p === "an") && last === null && next && next in SCALES) {
      runStart = out.length;
      out.push(p);
      runEnd = out.length;
      last = "unit";
      continue;
    }

    const unit = UNITS[p] ?? ORDINAL_UNITS[p];
    const tens = TENS[p] ?? ORDINAL_TENS[p];
    const scale = SCALES[p] ?? ORDINAL_SCALES[p];
    const ordinal = p in ORDINAL_UNITS || p in ORDINAL_TENS || p in ORDINAL_SCALES;

    if (unit !== undefined) {
      startOrContinue(last === null || last === "scale" || (last === "tens" && unit > 0 && unit < 10));
      group += unit;
      last = "unit";
    } else if (tens !== undefined) {
      startOrContinue(last === null || last === "scale");
      group += tens;
      last = "tens";
    } else if (scale !== undefined && last !== null) {
      if (scale === 100) group = (group || 1) * 100;
      else {
        total += (group || 1) * scale;
        group = 0;
      }
      last = "scale";
    } else {
      flush();
      out.push(p);
      continue;
    }
    out.push(p);
    runEnd = out.length;
    if (ordinal) flush(ordinalSuffix(total + group));
  }
  flush();
  return out.join("");
}
