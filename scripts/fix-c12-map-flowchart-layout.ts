/**
 * One-off fix: Cam 12 Listening layout bugs reported by learners.
 * - test-30 Section 2: Sheepmarket map must use MAP_LABELING + meta.imageUrl
 * - test-29 Section 3: tourism case-study flow-chart needs ↓ between stages
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve("data/tests");

function writeJson(file: string, data: unknown) {
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function fixTest30() {
  const file = path.join(ROOT, "test-30-listening.json");
  const draft = JSON.parse(readFileSync(file, "utf8")) as {
    parts: Array<{
      order: number;
      content: string;
      meta?: Record<string, unknown>;
      questions: Array<{
        number: number;
        type: string;
        mediaUrl?: string;
        content: Record<string, unknown>;
        correctAnswer?: string;
      }>;
    }>;
  };
  const s2 = draft.parts.find((p) => p.order === 1);
  if (!s2) throw new Error("test-30 Section 2 missing");

  const beforeMap = s2.content.split(/Questions\s+15[–-]/i)[0] ?? "";
  s2.content = `${beforeMap.trimEnd()}

Questions 15–20
Label the map below.
Write the correct letter, A–I, next to Questions 15–20.

Art and History in the Sheepmarket`;

  const mapImage = "/uploads/images/test-30-map.png";
  s2.meta = {
    ...(s2.meta ?? {}),
    audioUrl: (s2.meta?.audioUrl as string) || "/uploads/audio/test-30-section-2.mp3",
    imageUrl: mapImage,
    mediaUrl: mapImage,
  };

  const stems: Record<number, string> = {
    15: "The Reynolds House",
    16: "The Thumb",
    17: "The Museum",
    18: "The Contemporary Art Gallery",
    19: "The Warner Gallery",
    20: "Nucleus",
  };
  const options = ["A", "B", "C", "D", "E", "F", "G", "H", "I"].map((label) => ({
    label,
    text: `Location ${label}`,
  }));

  for (const q of s2.questions) {
    if (q.number < 15 || q.number > 20) continue;
    q.type = "MAP_LABELING";
    q.mediaUrl = mapImage;
    q.content = {
      stem: stems[q.number],
      options,
      imageUrl: mapImage,
      blank: true,
      variant: "MAP_LABELING",
    };
  }

  writeJson(file, draft);
  console.log("fixed", file);
}

function fixTest29() {
  const file = path.join(ROOT, "test-29-listening.json");
  const draft = JSON.parse(readFileSync(file, "utf8")) as {
    parts: Array<{
      order: number;
      content: string;
      questions: Array<{
        number: number;
        type: string;
        content: Record<string, unknown>;
        correctAnswer?: string;
      }>;
    }>;
  };
  const s3 = draft.parts.find((p) => p.order === 2);
  if (!s3) throw new Error("test-29 Section 3 missing");

  const q27 = s3.content.search(/Questions\s+27[–-]/i);
  if (q27 < 0) throw new Error("Questions 27–30 block missing");

  const flow = `Questions 21–26
Complete the flow-chart below.
Choose SIX answers from the box and write the correct letter, A–H, next to Questions 21–26.

A patterns
B names
C sources
D questions
E employees
F solutions
G headings
H officials

STAGES IN DOING A TOURISM CASE STUDY

RESEARCH
Locate and read relevant articles, noting key information and also 21 ...............
Identify a problem or need
Select interviewees – these may be site 22 ..............., visitors or city 23 ...............
Prepare and carry out interviews. If possible, collect statistics.
Check whether 24 ............... of interviewees can be used
↓
ANALYSIS
Select relevant information and try to identify 25 ...............
Decide on the best form of visuals
↓
WRITING THE CASE STUDY
Give some background before writing the main sections
Do NOT end with 26 ...............`;

  s3.content = `${flow}\n\n${s3.content.slice(q27)}`;

  const options = [
    { label: "A", text: "patterns" },
    { label: "B", text: "names" },
    { label: "C", text: "sources" },
    { label: "D", text: "questions" },
    { label: "E", text: "employees" },
    { label: "F", text: "solutions" },
    { label: "G", text: "headings" },
    { label: "H", text: "officials" },
  ];

  for (const q of s3.questions) {
    if (q.number < 21 || q.number > 26) continue;
    q.type = "MATCHING";
    q.content = {
      stem: "",
      options,
      variant: "FLOW_CHART_COMPLETION",
    };
  }

  writeJson(file, draft);
  console.log("fixed", file);
}

fixTest30();
fixTest29();
