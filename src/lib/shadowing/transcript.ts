/** "A:", "Man:", "Sales Associate:", "Young Man:" at the start of a transcript line. */
const SPEAKER = /^([A-Z][A-Za-z.'’]*(?: [A-Z][A-Za-z.'’]*){0,2}):\s+/;

export type TranscriptLine = { speaker: string | null; text: string };

function splitSentences(t: string): string[] {
  const matches = t.match(/[^.!?]+(?:[.!?]+["'”’]?|$)/g);
  if (!matches) return [t.trim()];
  return matches.map((s) => s.trim()).filter(Boolean);
}

/** Splits a reading transcript into sentence-level lines, separating the speaker label of dialogue turns. */
export function transcriptLines(transcript: string): TranscriptLine[] {
  const rawLines = transcript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const result: TranscriptLine[] = [];

  for (const rawLine of rawLines) {
    const m = SPEAKER.exec(rawLine);
    const speaker = m ? m[1] : null;
    const body = m ? rawLine.slice(m[0].length) : rawLine;

    const sentences = splitSentences(body);
    if (sentences.length === 0 && body) {
      result.push({ speaker, text: body });
    } else {
      sentences.forEach((sentence, idx) => {
        result.push({
          speaker: idx === 0 ? speaker : null,
          text: sentence,
        });
      });
    }
  }

  return result;
}

/** The words a learner actually says: speaker labels are shown for reading but never spoken. */
export function spokenText(transcript: string): string {
  return transcriptLines(transcript)
    .map((l) => l.text)
    .join(" ");
}
