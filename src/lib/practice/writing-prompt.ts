/**
 * Split IELTS writing prompt text into display blocks.
 * Does not translate content — only UI structure.
 */

export type WritingPromptBlocks = {
  timeLine?: string;
  /** Lines shown above the diagram (often “The diagram/chart below…”) */
  beforeImage: string[];
  /** Lines shown below the diagram (overview / discuss instructions) */
  afterImage: string[];
  wordLine?: string;
  /** @deprecated use beforeImage + afterImage */
  promptLines: string[];
};

const IMAGE_CUE =
  /\b(diagram|chart|graph|map|table|figure|picture|image)\s+below\b/i;

export function splitWritingPrompt(stem: string): WritingPromptBlocks {
  const lines = stem
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let timeLine: string | undefined;
  let wordLine: string | undefined;
  const body: string[] = [];

  for (const line of lines) {
    if (/^you should spend about\b/i.test(line)) {
      timeLine = line;
      continue;
    }
    if (/^write at least\b/i.test(line)) {
      wordLine = line;
      continue;
    }
    body.push(line);
  }

  const cueIdx = body.findIndex((line) => IMAGE_CUE.test(line));
  const beforeImage =
    cueIdx >= 0 ? body.slice(0, cueIdx + 1) : body.length ? [body[0]!] : [];
  const afterImage =
    cueIdx >= 0 ? body.slice(cueIdx + 1) : body.slice(1);

  return {
    timeLine,
    beforeImage,
    afterImage,
    wordLine,
    promptLines: body,
  };
}
