/**
 * Normalization for British vs American English spelling variations.
 *
 * In IELTS and English learning, both spelling conventions are accepted.
 * This module canonicalizes words to standard American English so that
 * user submissions and answer keys match seamlessly regardless of dialect.
 */

// 1. Root-based -our -> -or replacement
// colou?r, favou?r, flavou?r, honou?r, humou?r, neighbou?r, behaviou?r,
// labou?r, harbou?r, rumou?r, glamou?r, armou?r, odou?r, vigou?r, splendou?r,
// saviou?r, parlou?r, candou?r, ardou?r, demeanou?r, enamou?r, rancou?r,
// clamou?r, rigou?r, tumou?r, valou?r, fervou?r
const OUR_PATTERN =
  /\b(col|fav|flav|hon|hum|neighb|behavi|lab|harb|rum|glam|arm|od|vig|splend|savi|parl|cand|ard|demean|enam|ranc|clam|rig|tum|val|ferv)our/gi;

// 2. Root-based -re -> -er replacement
const RE_PATTERNS: [RegExp, string][] = [
  [/\b(cent|theat)re\b/gi, "$1er"],
  [/\b(cent|theat)res\b/gi, "$1ers"],
  [/\b(cent)red\b/gi, "$1ered"],
  [/\b(cent)ring\b/gi, "$1ering"],
  [/\b((?:kilo|centi|milli|micro|nano)?met)re\b/gi, "$1er"],
  [/\b((?:kilo|centi|milli|micro|nano)?met)res\b/gi, "$1ers"],
  [/\b((?:milli)?lit)re\b/gi, "$1er"],
  [/\b((?:milli)?lit)res\b/gi, "$1ers"],
  [/\b(fib|calib|somb|spect|lust|sab|och)re\b/gi, "$1er"],
  [/\b(fib|calib|somb|spect|lust|sab|och)res\b/gi, "$1ers"],
  [/\bmeagre\b/gi, "meager"],
  [/\bsepulchre\b/gi, "sepulcher"],
];

// 3. -ise / -isation -> -ize / -ization
// Words ending in -ise in both dialects that must NOT be converted:
const NON_CONVERTIBLE_ISE = new Set([
  "advise",
  "adviser",
  "advisers",
  "advises",
  "advised",
  "advising",
  "arise",
  "arises",
  "arising",
  "chastise",
  "chastises",
  "chastised",
  "chastising",
  "circumcise",
  "circumcises",
  "circumcised",
  "circumcising",
  "comprise",
  "comprises",
  "comprised",
  "comprising",
  "compromise",
  "compromises",
  "compromised",
  "compromising",
  "demise",
  "despise",
  "despises",
  "despised",
  "despising",
  "devise",
  "devises",
  "devised",
  "devising",
  "disguise",
  "disguises",
  "disguised",
  "disguising",
  "enterprise",
  "enterprises",
  "exercise",
  "exercises",
  "exercised",
  "exercising",
  "expertise",
  "franchise",
  "franchises",
  "franchised",
  "franchising",
  "improvise",
  "improvises",
  "improvised",
  "improvising",
  "merchandise",
  "premise",
  "premises",
  "promise",
  "promises",
  "promised",
  "promising",
  "revise",
  "revises",
  "revised",
  "revising",
  "rise",
  "rises",
  "rising",
  "supervise",
  "supervises",
  "supervised",
  "supervising",
  "supervisor",
  "supervisors",
  "surmise",
  "surmises",
  "surmised",
  "surmising",
  "surprise",
  "surprises",
  "surprised",
  "surprising",
  "praise",
  "praises",
  "praised",
  "praising",
  "otherwise",
  "likewise",
  "clockwise",
  "counterclockwise",
  "lengthwise",
  "streetwise",
]);

const ISE_PATTERN = /\b([a-z]{3,})is(e|ed|ing|es|er|ers|ation|ations|able)\b/gi;

// 4. Exact word mappings
const WORD_MAPPINGS: Record<string, string> = {
  practise: "practice",
  practised: "practiced",
  practising: "practicing",
  programme: "program",
  programmes: "programs",
  dialogue: "dialog",
  dialogues: "dialogs",
  catalogue: "catalog",
  catalogues: "catalogs",
  catalogued: "cataloged",
  cataloguing: "cataloging",
  analogue: "analog",
  analogues: "analogs",
  monologue: "monolog",
  monologues: "monologs",
  travelling: "traveling",
  travelled: "traveled",
  traveller: "traveler",
  travellers: "travelers",
  cancelling: "canceling",
  cancelled: "canceled",
  cancellation: "cancelation",
  cancellations: "cancelations",
  modelling: "modeling",
  modelled: "modeled",
  modeller: "modeler",
  modellers: "modelers",
  labelling: "labeling",
  labelled: "labeled",
  signalling: "signaling",
  signalled: "signaled",
  fuelling: "fueling",
  fuelled: "fueled",
  jewellery: "jewelry",
  counsellor: "counselor",
  counsellors: "counselors",
  grey: "gray",
  greys: "grays",
  defence: "defense",
  defences: "defenses",
  defenceless: "defenseless",
  offence: "offense",
  offences: "offenses",
  licence: "license",
  licences: "licenses",
  cheque: "check",
  cheques: "checks",
  aeroplane: "airplane",
  aeroplanes: "airplanes",
  cosy: "cozy",
  cosier: "cozier",
  cosiest: "coziest",
  cosily: "cozily",
  pyjamas: "pajamas",
  aluminium: "aluminum",
  speciality: "specialty",
  specialities: "specialties",
  ageing: "aging",
  judgement: "judgment",
  judgements: "judgments",
  acknowledgement: "acknowledgment",
  acknowledgements: "acknowledgments",
  skilful: "skillful",
  skilfully: "skillfully",
  wilful: "willful",
  wilfully: "willfully",
  fulfil: "fulfill",
  fulfils: "fulfills",
  fulfilment: "fulfillment",
  enrol: "enroll",
  enrols: "enrolls",
  enrolment: "enrollment",
  instal: "install",
  instalment: "installment",
  instalments: "installments",
  mould: "mold",
  moulds: "molds",
  mouldy: "moldy",
  tyre: "tire",
  tyres: "tires",
  plough: "plow",
  ploughs: "plows",
  whisky: "whiskey",
};

/**
 * Transforms text by canonicalizing British spellings to American conventions.
 * If text already uses American conventions or is identical in both, it is preserved.
 */
export function canonicalizeSpelling(text: string): string {
  if (!text) return text;

  // 1. Direct word mappings
  let result = text.replace(/\b[a-z]+\b/gi, (word) => {
    const lower = word.toLowerCase();
    const mapped = WORD_MAPPINGS[lower];
    if (mapped) return mapped;
    return word;
  });

  // 2. -our -> -or
  result = result.replace(OUR_PATTERN, "$1or");

  // 3. -re -> -er
  for (const [pattern, replacement] of RE_PATTERNS) {
    result = result.replace(pattern, replacement);
  }

  // 4. -ise -> -ize (respecting non-convertible words like exercise, surprise, promise)
  result = result.replace(ISE_PATTERN, (match, stem, suffix) => {
    const lowerMatch = match.toLowerCase();
    if (NON_CONVERTIBLE_ISE.has(lowerMatch)) return match;
    return `${stem}iz${suffix}`;
  });

  return result;
}
