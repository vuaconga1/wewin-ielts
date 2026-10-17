/**
 * Import Castle & Environment Mock test 1 as three General Training papers.
 *
 * Reading Q1–6 answers come from "Mocktest 1 - Complete Advertisements.docx"
 * (the ads in that file). KEYS (1).docx still has an older A–E key that does
 * not match those advertisements.
 *
 *   npx tsx scripts/import-general-mocktest-1.ts
 */

import "dotenv/config";
import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { ParsedTestDraft, QuestionDraft } from "../src/lib/import/schemas";
import { normalizePublishedMockDraft } from "../src/lib/import/normalize-mock-tests";

const ROOT = path.resolve(__dirname, "..");
const SRC = path.resolve(
  "e:/Wewin/Wewin-Education-main/anh_wewin/flyer/unit 7/Castle & Environment",
);

const HALLS = [
  { label: "A", text: "Gwyn House" },
  { label: "B", text: "Plas Hall" },
  { label: "C", text: "Rath Place" },
  { label: "D", text: "Kingston House" },
  { label: "E", text: "Mary's Lodge" },
];

function box(text: string): string {
  return `[[box]]\n${text.trim()}\n[[/box]]`;
}

function section(title: string): string {
  return `[[section]]${title}[[/section]]`;
}

function gap(
  number: number,
  order: number,
  correctAnswer: string,
  acceptableAnswers: string[],
): QuestionDraft {
  return {
    number,
    order,
    type: "GAP_FILL",
    content: { stem: "", blank: true },
    correctAnswer,
    acceptableAnswers,
  };
}

function readingPassage(): string {
  const ads = [
    section("Questions 1–6"),
    box(`Example: You are a first year girl who is worried about her safety.
Answer: D`),
    box(`A  GWYN HOUSE
For male first-year students. Single study bedrooms are available. The hall is a five-minute walk from the University and has laundry facilities on every floor. Shared bathrooms; meals are not provided.`),
    box(`B  PLAS HALL
For male second-year students and above. All rooms are single rooms, with a shared kitchen on each floor so residents can cook their own meals. The hall is close to the University, on the Hawley Site.`),
    box(`C  RATH PLACE
A friendly hall for first-year students. Residents share bedrooms with one other student. Rooms are arranged by gender, so female students share with female students and male students share with male students. The University is a short walk away.`),
    box(`D  KINGSTON HOUSE
Mainly for first-year women. Full evening meals are provided in the dining room, and residents may also use the communal kitchen when they want to prepare a snack or cook for themselves. Located near the University.`),
    box(`E  MARY'S LODGE
This hall is situated on a hill overlooking the University and the town. It is self-catering accommodation and offers single rooms with shared bathrooms and kitchens. There are no buses, but it is very close to the town centre, so walking there is no problem; it takes a good 25 minutes to walk to the University.`),
    section("Questions 7–10"),
    box(`The Cleanex Washing Machine
Instructions for Using your Washer

Preparing Your Laundry
Divide your laundry by fabric and colour fastness. Wash white and coloured items separately. Remember to empty any pockets, removing especially those small items like coins, paper, pins and badges that might jam the pump. Fasten or remove loose buttons and fasten zippers. Turn shirts inside out for better results.

Check Wash Labels
Garments and laundry generally have wash instruction labels inside the garment (which may tell you if they should be dry-cleaned, hand washed or machine washed) showing the wash temperature, how to iron etc... Important: fabrics should only be machine washed if their labels show the appropriate symbol.

Alternate Items
For best results we recommend you alternate small and large items and, when you load your washer, remember to spread them out. Never overload your washing machine.

Detergents and Fabric Softeners
Open the dispenser marked C by pulling it outwards. Fill with detergent and conditioner using the quantities indicated by the manufacturer on the packet according to the load you are washing, the water hardness and how soiled your laundry is. As you become more familiar with your washer, you will regulate the quantities according to your own personal experience.

In the detergent dispenser, there are 3 compartments. Compartment 1 is for prewash cycle detergent, compartment 2 is for wash cycle detergent and compartment 3 is for fabric softener. Never fill compartment 3 above the grid.

Use compartment 2 for liquid detergent, filling the compartment just before you start the washer. Remember that liquid detergent is ideal for wash cycles with temperatures up to 60°C and for the programmes with no prewash cycles.

Dispensers for liquid and powder detergents which are placed inside the drum of the washer, are sold on the market. To improve the effectiveness of the washing cycle, we recommend that you insert a detergent dispenser in the drum before loading.

Do not use hand washing detergents since these produce very heavy suds.
When using cold wash cycles, remember to reduce the detergent dosage.`),
    section("Questions 11 and 12"),
    box(`QUICK KILL
Bug Infestations????

If you are suffering from infestations of ants, wasps, hornets or any other creepy crawly that you want out of the house, here is the answer. Quick Kill is a low allergic, odourless insecticide. It has been developed with highly purified ingredients to provide the effectiveness that you need without the harsh smell. Quick Kill is deadly to all insects that you might find around you. Coming with a sample powder packet to test out, there is no better time to try out this new and effective answer to infestation.

[[price]]ONLY $4.99[[/price]]

Quick Kill - Now only the insects know that you have sprayed!`),
  ].join("\n\n");

  return `${ads}

Questions 1-6
Choose the hall (A-E) that best meets each student's requirements. A hall may be used more than once.
Answer the questions below by writing the letters of the appropriate advertisements in boxes 1-6 on your answer sheet.

Questions 7-10
Read the Instructions for Use leaflet about the Cleanex Washing Machine below.
Choose the appropriate letters A-D. Write your answers in boxes 7-10 on your answer sheet.

Questions 11 and 12
Now read the advertisement for Quick Kill below.
Complete the following statements with words taken from the Quick Kill advertisement.
Write NO MORE THAN THREE WORDS for each answer.

Nobody can tell when you have sprayed Quick Kill because it is 11 ________.
The price for Quick Kill includes a 12 ________.`;
}

function listeningPart1(): string {
  return `Questions 1-7
Complete the notes below.
Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.

Holiday on Jackson Island

| Place | Anna's accommodation | Things Anna did | Anna's recommendation |
| --- | --- | --- | --- |
| Camford | Example<br>with cousin | went shopping in the market | need to take 1 ________ |
| Newtown |  | bus tour | visit the 2 ________ |
| Golden Beach | in a 3 ________ | 4 ________ | Stay for at least 5 ________ |
| 6 ________ | in a motel | went 7 ________ | book some lessons in advance |

Questions 8-10
Complete the notes below.
Write ONE WORD ONLY for each answer.

More Advice
Try the 8 ________ at the cafe on the mountain.
Hire a 9 ________
Buy a 10 ________ before the holiday`;
}

function listeningPart2(): string {
  return `Questions 11-20
Write ONE WORD AND/OR A NUMBER for each answer.

${box(`Volunteer work application form: Grace Brown
Mobile phone number: 021 636 7189
Email address
graceb@ 11 ________ co.nz
Qualification
a diploma in 12 ________
Agreed work hours
from 13 ________ am to 2pm Monday to Friday
Volunteer work experience
a volunteer city 14 ________
a volunteer netball team 15 ________
at Rugby World Cup
Hobbies
likes to work in her 16 ________
enjoys flower arranging
plays the 17 ________
Type of work offered
working on a 18 ________ for a month
working in a community centre with elderly people
Why is she interested in volunteering?
wants to have more 19 ________
wants to help others
Where did she hear about the agency?
saw an advertisement at the 20 ________`)}`;
}

function writingStem(): string {
  return `You should spend about 20 minutes on this task.

You have been renting an apartment for six months, but the heating system has recently stopped working properly. Despite informing the property agency, no repair has been made.
Write a letter to the landlord. In your letter, explain:
What the problem with the heating system is and how long it has been going on
How this situation is impacting your daily living conditions
What steps you would like the landlord to take immediately

Write at least 150 words. You do NOT need to write any addresses.

Begin your letter as follows:
Dear Sir or Madam,`;
}

function mcq(
  number: number,
  order: number,
  stem: string,
  options: { label: string; text: string }[],
  correctAnswer: string,
): QuestionDraft {
  return {
    number,
    order,
    type: "MULTIPLE_CHOICE",
    content: { stem, options },
    correctAnswer,
  };
}

function buildDrafts(audioUrls: string[]): ParsedTestDraft[] {
  const readingQuestions: QuestionDraft[] = [
    {
      number: 1,
      order: 0,
      type: "MATCHING",
      content: {
        stem: "You are a male first year student who wants a single room, close to the University and with laundry services in the Hall.",
        options: HALLS,
      },
      correctAnswer: "A",
    },
    {
      number: 2,
      order: 1,
      type: "MATCHING",
      content: {
        stem: "You are a male, second year student who wants a single room and to cook your own meals. You want to be close to the University.",
        options: HALLS,
      },
      correctAnswer: "B",
    },
    {
      number: 3,
      order: 2,
      type: "MATCHING",
      content: {
        stem: "You are a first year girl who wants to share with another girl.",
        options: HALLS,
      },
      correctAnswer: "C",
    },
    {
      number: 4,
      order: 3,
      type: "MATCHING",
      content: {
        stem: "You are a first year girl who wants meals provided but you want to be able to cook sometimes too.",
        options: HALLS,
      },
      correctAnswer: "D",
    },
    {
      number: 5,
      order: 4,
      type: "MATCHING",
      content: {
        stem: "You are a male student who would like to share with another student for your first year.",
        options: HALLS,
      },
      correctAnswer: "C",
    },
    {
      number: 6,
      order: 5,
      type: "MATCHING",
      content: {
        stem: "You are a student with a late night job in the town centre so you want to live close to the town centre.",
        options: HALLS,
      },
      correctAnswer: "E",
    },
    mcq(
      7,
      6,
      "You must remove small items from the pockets or clothing or\u22ef",
      [
        { label: "A", text: "they could be lost." },
        { label: "B", text: "they could affect the colours of the wash." },
        { label: "C", text: "they could break the action of the washing machine pump." },
        { label: "D", text: "they could make holes in the clothing." },
      ],
      "C",
    ),
    mcq(
      8,
      7,
      "The washing label on a fabric garment will indicate machine washing by\u22ef",
      [
        { label: "A", text: "writing on it." },
        { label: "B", text: "displaying a particular symbol on it." },
        { label: "C", text: "being of a particular colour." },
        { label: "D", text: "being inside the garment." },
      ],
      "B",
    ),
    mcq(
      9,
      8,
      "When you have used the washing machine for a long time, you will know how much detergent to use because of\u22ef",
      [
        { label: "A", text: "your experience." },
        { label: "B", text: "the manufacturers indications." },
        { label: "C", text: "the hardness of the water." },
        { label: "D", text: "how dirty your laundry is." },
      ],
      "A",
    ),
    mcq(
      10,
      9,
      "The best way to use detergent is to\u22ef",
      [
        { label: "A", text: "never overload the machine." },
        { label: "B", text: "use with temperatures up to 60°C." },
        { label: "C", text: "use a prewash cycle." },
        { label: "D", text: "put it in a dispenser in the drum before putting the laundry in." },
      ],
      "D",
    ),
    gap(11, 10, "odourless", ["odourless", "odorless", "odourless insecticide"]),
    gap(12, 11, "sample powder packet", [
      "sample powder packet",
      "a sample powder packet",
    ]),
  ];

  const listening1: QuestionDraft[] = [
    gap(1, 0, "cash", ["cash"]),
    gap(2, 1, "museum", ["museum", "the museum"]),
    gap(3, 2, "caravan", ["caravan", "a caravan"]),
    gap(4, 3, "sailing", ["sailing"]),
    gap(5, 4, "four days", ["four days", "4 days", "four day"]),
    gap(6, 5, "white mountain", ["white mountain", "the white mountain"]),
    gap(7, 6, "snowboarding", ["snowboarding", "snow boarding"]),
    gap(8, 7, "cakes", ["cakes", "cake"]),
    gap(9, 8, "car", ["car", "a car"]),
    gap(10, 9, "map", ["map", "maps", "a map"]),
  ];

  const listening2: QuestionDraft[] = [
    gap(11, 0, "travel", ["travel"]),
    gap(12, 1, "teaching", ["teaching"]),
    gap(13, 2, "9.15", ["9.15", "9.15 am", "9:15", "9:15 am", "9.15am", "9:15am"]),
    gap(14, 3, "guide", ["guide", "a guide"]),
    gap(15, 4, "coach", ["coach"]),
    gap(16, 5, "garden", ["garden", "her garden"]),
    gap(17, 6, "guitar", ["guitar", "the guitar"]),
    gap(18, 7, "farm", ["farm", "a farm"]),
    gap(19, 8, "friends", ["friends"]),
    gap(20, 9, "supermarket", ["supermarket", "the supermarket"]),
  ];

  return [
    {
      title: "IELTS General Training — Listening (Mock test 1)",
      slug: "general-listening-mocktest-1",
      skill: "LISTENING",
      examType: "GENERAL",
      timeLimitMinutes: 20,
      tags: ["#IELTS General", "#Listening"],
      sourceFolder: SRC,
      parts: [
        {
          title: "Part 1",
          order: 0,
          content: listeningPart1(),
          meta: { audioUrl: audioUrls[0] },
          questions: listening1,
        },
        {
          title: "Part 2",
          order: 1,
          content: listeningPart2(),
          meta: { audioUrl: audioUrls[1] },
          questions: listening2,
        },
      ],
      audioFiles: audioUrls,
    },
    {
      title: "IELTS General Training — Reading (Mock test 1)",
      slug: "general-reading-mocktest-1",
      skill: "READING",
      examType: "GENERAL",
      timeLimitMinutes: 20,
      tags: ["#IELTS General", "#Reading"],
      sourceFolder: SRC,
      parts: [
        {
          title: "Reading",
          order: 0,
          content: readingPassage(),
          questions: readingQuestions,
        },
      ],
    },
    {
      title: "IELTS General Training — Writing (Mock test 1)",
      slug: "general-writing-mocktest-1",
      skill: "WRITING",
      examType: "GENERAL",
      timeLimitMinutes: 20,
      tags: ["#IELTS General", "#Writing"],
      sourceFolder: SRC,
      parts: [
        {
          title: "Writing",
          order: 0,
          content: writingStem(),
          questions: [
            {
              number: 1,
              order: 0,
              type: "ESSAY",
              content: { stem: writingStem(), minWords: 150 },
            },
          ],
        },
      ],
    },
  ];
}

async function copyAudio(): Promise<string[]> {
  const destDir = path.join(ROOT, "public", "uploads", "audio");
  await mkdir(destDir, { recursive: true });
  const files: [string, string][] = [
    ["Part 1.mp3", "general-mocktest-1-section-1.mp3"],
    ["Part 2.mp3", "general-mocktest-1-section-2.mp3"],
  ];
  const urls: string[] = [];
  for (const [srcName, destName] of files) {
    const dest = path.join(destDir, destName);
    await copyFile(path.join(SRC, srcName), dest);
    urls.push(`/uploads/audio/${destName}`);
  }
  return urls;
}

async function uploadAudio(urls: string[]) {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Missing R2 credentials in .env");
  }
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  for (const url of urls) {
    const filePath = path.join(ROOT, "public", url.replace(/^\//, ""));
    const key = url.replace(/^\//, "");
    const body = await readFile(filePath);
    const info = await stat(filePath);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "audio/mpeg",
        ContentLength: info.size,
      }),
    );
    console.log(`uploaded ${key} (${info.size} bytes)`);
  }
}

async function main() {
  const audioUrls = await copyAudio();
  if (!process.argv.includes("--skip-upload")) {
    await uploadAudio(audioUrls);
  }
  const drafts = buildDrafts(audioUrls).map(normalizePublishedMockDraft);
  const { saveTestDraft } = await import("../src/lib/store/test-store");
  const { persistParsedTest } = await import("../src/lib/import/persist");

  for (const draft of drafts) {
    const count = draft.parts.reduce((sum, part) => sum + part.questions.length, 0);
    await saveTestDraft(draft);
    const result = await persistParsedTest(draft, [], { status: "PUBLISHED" });
    console.log(`${draft.slug}: ${count} questions, testId=${result.testId}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
