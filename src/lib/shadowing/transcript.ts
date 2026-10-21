/** "A:", "Man:", "Sales Associate:", "Young Man:" at the start of a transcript line. */
const SPEAKER = /^([A-Z][A-Za-z.'’]*(?: [A-Z][A-Za-z.'’]*){0,2}):\s+/;

export type TranscriptLine = { speaker: string | null; text: string };

/** Splits a reading transcript into lines, separating the speaker label of dialogue turns. */
export function transcriptLines(transcript: string): TranscriptLine[] {
  return transcript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = SPEAKER.exec(line);
      return m ? { speaker: m[1], text: line.slice(m[0].length) } : { speaker: null, text: line };
    });
}

/** The words a learner actually says: speaker labels are shown for reading but never spoken. */
export function spokenText(transcript: string): string {
  return transcriptLines(transcript)
    .map((l) => l.text)
    .join(" ");
}
