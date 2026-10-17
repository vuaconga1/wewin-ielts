/**
 * Import Cambridge IELTS 15 General Training — Test 1 (all four skills).
 *
 * Usage:
 *   npx tsx scripts/import-cambridge-15-general-test-1.ts --skip-upload
 *   npx tsx scripts/import-cambridge-15-general-test-1.ts
 */
import "dotenv/config";
import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { ParsedTestDraft, QuestionDraft } from "../src/lib/import/schemas";
import { applyQuestionLayoutVariants, validateQuestionLayouts } from "../src/lib/questions/layout-variants";

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "DE-IELTS", "Demoi");
const AUDIO_SOURCE = path.join(SOURCE, "Cambridge IELTS 15 audio");

const option = (label: string, text: string) => ({ label, text });
const gap = (number: number, stem: string, answer: string, accepted: string[] = [answer]): QuestionDraft => ({
  number, order: number - 1, type: "GAP_FILL", content: { stem, blank: true },
  correctAnswer: answer, acceptableAnswers: accepted,
});
const mcq = (number: number, stem: string, choices: string[], answer: string): QuestionDraft => ({
  number, order: number - 1, type: "MULTIPLE_CHOICE",
  content: { stem, options: choices.map((text, i) => option(String.fromCharCode(65 + i), text)) },
  correctAnswer: answer,
});
const matching = (number: number, stem: string, choices: {label: string; text: string}[], answer: string): QuestionDraft => ({
  number, order: number - 1, type: "MATCHING", content: { stem, options: choices }, correctAnswer: answer,
});
const tfng = (number: number, stem: string, answer: string): QuestionDraft => ({
  number, order: number - 1, type: "TRUE_FALSE_NG", content: { stem, options: [option("TRUE", "TRUE"), option("FALSE", "FALSE"), option("NOT GIVEN", "NOT GIVEN")] }, correctAnswer: answer,
});

const listeningAnswers = [
  "Jamieson", "afternoon", "communication", "week", "10", "suit", "passport", "personality", "feedback", "time",
];

export function listeningDraft(audioUrls: string[]): ParsedTestDraft {
  const traits = ["outgoing", "selfish", "independent", "attention-seeking", "introverted", "co-operative", "caring", "competitive"]
    .map((text, i) => option(String.fromCharCode(65 + i), text));
  const sections = [
    {
      title: "Section 1", order: 0, meta: { audioUrl: audioUrls[0] },
      content: `Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

[[box]]
[[ntitle]]Bankside Recruitment Agency[[/ntitle]]
[[b0]]Address of agency: 497 Eastside, Docklands
[[b0]]Name of agent: Becky 1 ...............
[[b0]]Phone number: 07866 510333
[[b0]]Best to call her in the 2 ...............

Typical jobs
[[b0]]Clerical and admin roles, mainly in the finance industry
[[b0]]Must have good 3 ............... skills
[[b0]]Jobs are usually for at least one 4 ...............
[[b0]]Pay is usually £ 5 ............... per hour

Registration process
[[b0]]Wear a 6 ............... to the interview
[[b0]]Must bring your 7 ............... to the interview
[[b0]]They will ask questions about each applicant’s 8 ...............

Advantages of using an agency
[[b0]]The 9 ............... you receive at interview will benefit you
[[b0]]Will get access to vacancies which are not advertised
[[b0]]Less 10 ............... is involved in applying for jobs
[[/box]]`,
      questions: [
        "Name of agent: Becky ________", "Best to call her in the ________", "Must have good ________ skills",
        "Jobs are usually for at least one ________", "Pay is usually £ ________ per hour", "Wear a ________ to the interview",
        "Must bring your ________ to the interview", "They will ask questions about each applicant’s ________",
        "The ________ you receive at interview will benefit you", "Less ________ is involved in applying for jobs",
      ].map((stem, i) => gap(i + 1, stem, listeningAnswers[i]!, i === 4 ? ["10", "ten"] : [listeningAnswers[i]!])),
    },
    {
      title: "Section 2", order: 1, meta: { audioUrl: audioUrls[1] },
      content: `Questions 11–14
Choose the correct letter, A, B or C.

[[title]]Matthews Island Holidays[[/title]]

Questions 15–20
Complete the table below.
Write ONE WORD AND/OR A NUMBER for each answer.

| Day | Activity | Notes |
| --- | --- | --- |
| Day 1 | Arrive | Introduction by manager; hotel dining room has a view of the 15 ............... |
| Day 2 | Tynwald Exhibition and Peel | Tynwald may have been founded in 16 ............... not 979. |
| Day 3 | Trip to Snaefell | Travel by tram and train to the 17 ............... of Snaefell. |
| Day 4 | Free day | Company provides a 18 ............... for local transport and heritage sites. |
| Day 5 | Take the 19 ............... railway train | Coach to Castletown — former 20 ............... with an old castle. |
| Day 6 | Leave | Leave the island by ferry or plane. |`,
      questions: [
        mcq(11, "According to the speaker, the company…", ["has been in business for longer than most competitors.", "arranges holidays to more destinations than competitors.", "has more customers than competitors."], "A"),
        mcq(12, "Where can customers meet the tour manager before travelling to the Isle of Man?", ["Liverpool", "Heysham", "Luton"], "B"),
        mcq(13, "How many lunches are included in the price?", ["three", "four", "five"], "A"),
        mcq(14, "Customers have to pay extra for…", ["guaranteeing a larger room.", "booking at short notice.", "transferring to another date."], "C"),
        gap(15, "Day 1: Hotel dining room has a view of the ________", "river"),
        gap(16, "Day 2: Earliest surviving reference to Tynwald is from ________", "1422"),
        gap(17, "Day 3: Train to the ________ of Snaefell", "top"),
        gap(18, "Day 4: Company provides a ________ for local transport and heritage sites", "pass"),
        gap(19, "Day 5: Take the ________ railway train from Douglas to Port Erin", "steam"),
        gap(20, "Castletown — former ________ — has an old castle", "capital"),
      ],
    },
    {
      title: "Section 3", order: 2, meta: { audioUrl: audioUrls[2] },
      content: `Questions 21–30\nPersonality traits and position in the family`,
      questions: [
        matching(21, "the eldest child", traits, "G"), matching(22, "a middle child", traits, "F"),
        matching(23, "the youngest child", traits, "A"), matching(24, "a twin", traits, "E"),
        matching(25, "an only child", traits, "B"), matching(26, "a child with much older siblings", traits, "C"),
        mcq(27, "What do the speakers say about evidence relating to birth order and academic success?", ["There is conflicting evidence about whether oldest children perform best in intelligence tests.", "Birth order has less influence than socio-economic status.", "Some studies neglected important factors such as family size."], "C"),
        mcq(28, "What does Ruth find surprising about oldest children’s academic performance?", ["It is mainly thanks to their role as teachers for younger siblings.", "Their advantages lead to only slightly higher achievement.", "Extra parental attention at a young age makes little difference."], "A"),
        { ...mcq(29, "Which TWO experiences of sibling rivalry do the speakers agree were valuable?", ["learning to share", "learning to stand up for oneself", "learning to be a good loser", "learning to be tolerant", "learning to say sorry"], "B"), content: { ...mcq(29, "", [], "B").content, stem: "Which TWO experiences of sibling rivalry do the speakers agree were valuable?", options: ["learning to share", "learning to stand up for oneself", "learning to be a good loser", "learning to be tolerant", "learning to say sorry"].map((t,i)=>option(String.fromCharCode(65+i),t)), selectCount: 2, covers: [29,30] } },
        { number: 30, order: 29, type: "MULTIPLE_CHOICE" as const, content: { stem: "", pairedFrom: 29 }, correctAnswer: "D" },
      ],
    },
    {
      title: "Section 4", order: 3, meta: { audioUrl: audioUrls[3] },
      content: `Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

[[box]]
[[ntitle]]The Eucalyptus Tree in Australia[[/ntitle]]
Importance
[[b0]]it provides 31 ............... and food for a wide range of species
[[b0]]its leaves provide 32 ............... which is used to make a disinfectant

Reasons for present decline in number
A Diseases
[[b0]]Mundulla Yellows — lime used for making 33 ............... was absorbed
[[b0]]Bell-miner Associated Die-back — 34 ............... feed on eucalyptus leaves

B Bushfires
[[b0]]high-frequency bushfires result in the growth of 35 ...............
[[b0]]mid-frequency bushfires make more 36 ............... available and maintain the quality of the 37 ...............
[[b0]]low-frequency bushfires result in ‘38 ............... rainforest’, a 39 ............... ecosystem and ideal for the 40 ............... of the bell-miner
[[/box]]`,
      questions: [
        gap(31, "It provides ________ and food for many species", "shelter"),
        gap(32, "Its leaves provide ________ used to make a disinfectant", "oil"),
        gap(33, "Mundulla Yellows: lime used for making ________ was absorbed", "roads"),
        gap(34, "Bell-miner Associated Die-back: ________ feed on eucalyptus leaves", "insects"),
        gap(35, "High-frequency bushfires result in the growth of ________", "grass", ["grass", "grasses"]),
        gap(36, "Mid-frequency fires make more ________ available to the trees", "water"),
        gap(37, "Mid-frequency fires maintain the quality of the ________", "soil"),
        gap(38, "Low-frequency fires result in the growth of ‘________ rainforest’", "dry"),
        gap(39, "This is a ________ ecosystem", "simple"),
        gap(40, "It is an ideal environment for the ________ of the bell-miner", "nests", ["nests", "nest"]),
      ],
    },
  ];
  return { title: "Cambridge IELTS 15 General Training — Test 1 Listening", slug: "cambridge-ielts-15-general-test-1-listening", skill: "LISTENING", examType: "GENERAL", timeLimitMinutes: 40, tags: ["#IELTS General", "#Listening", "#Cambridge 15", "#Test 1"], sourceFolder: SOURCE, description: "Cambridge IELTS 15 General Training, Test 1 — Listening.", parts: sections, audioFiles: audioUrls };
}

const section1Text = `[[section]]Questions 1–6[[/section]]` + "\n\n" + `[[title]]Consumer Advice[[/title]]

If something you’ve ordered hasn’t arrived, contact the seller. It is their legal responsibility to make sure the item is delivered. If it was left somewhere you did not agree to, including with a neighbour without consent, the seller must resolve it. If the item does not arrive, you are entitled to a replacement or refund; you can request your money back after 30 days. Debit-card chargeback requests should be made within 120 days. Credit-card chargeback applies to items under £100; purchases from £100 to £30,000 may qualify for a section 75 claim. PayPal disputes must be reported through its resolution centre within 180 days.

[[section]]Questions 7–14[[/section]]

[[title]]Rice Cookers[[/title]]

A — Ezy Rice Cooker: 1.8 litre stainless-steel cooker with separate glass lid and cool lid handle. It cooks white rice well but spits with brown rice. Dirt catches around the lid rim; neither lid nor pot is dishwasher safe.

B — Family Rice Cooker: plastic exterior and locking flip-top lid that becomes a carrying handle. Its aluminium pot is difficult to clean and not dishwasher safe. It automatically changes temperature when rice is cooked to keep it warm.

C — Mini Rice Cooker: 0.3 litre cooker for one person. The non-stick aluminium pot is dishwasher safe. It has no side handles and can overflow with brown rice.

D — VPN Rice Cooker: painted-steel exterior, two side handles and steel inner pot. It includes a recipe booklet. Keep-warm must be selected manually and the handles are difficult to grip.

E — S16 Rice Cooker: simple to use and does not spit or boil over with brown rice. Its exterior remains cool, but it has no handles and no recipe book.`;

const section2Text = `[[section]]Questions 15–22[[/section]]\n\n[[title]]Safety when working on roofs[[/title]]

A fall from height is the most serious hazard in roof work. More than half of recorded falls are from under three metres, mostly from ladders and roofs, and residential building sites have the most injuries in construction. A hazard assessment must identify dangers before work begins and be repeated when conditions change. First consider eliminating the hazard at design or planning stage. If it cannot be eliminated, use edge protection such as scaffolding; otherwise use temporary work platforms. If prevention is impossible, minimise injury with safety nets or similar systems. Ladders should be used only for short-duration maintenance work. Users require training in ladder selection and safe use, and ladders need regular inspection.

[[section]]Questions 23–27[[/section]]

[[title]]Maternity allowance for working women[[/title]]

Maternity Allowance can be claimed after 26 weeks of pregnancy and payments start 11 weeks before the baby is due. Depending on eligibility, a claimant may receive £140.98 a week or 90% of average weekly earnings (whichever is lower) for 39 weeks, or £27 a week for 14 weeks. Employed, self-employed and recently unemployed women may qualify. A claim requires an MA1 form, a payslip or Certificate of Small Earnings Exemption as proof of income, and proof of the due date such as a doctor’s letter. Changes in circumstances, including returning to work, must be reported.`;

const section3Text = `The California Gold Rush of 1849

A — On 24 January 1848, carpenter James Wilson Marshall found flakes of gold in the American River while building a sawmill for John Sutter. Days later the Treaty of Guadalupe Hidalgo ended the Mexican-American War and transferred California to the United States. The territory then contained about 6,500 Californios, 700 foreigners and 150,000 Native Americans.

B — Marshall and Sutter tried to keep the discovery quiet, but news spread. Initial disbelief in San Francisco ended when shopkeeper Sam Brannan displayed a bottle of gold from Sutter’s Creek. By mid-June, three quarters of San Francisco’s male population had left for the mines.

C — Migrants first arrived from places accessible by boat. During 1849, thousands across the United States borrowed or spent their savings to travel to California. Wives left behind assumed new responsibilities, often successfully running farms and businesses. Towns with shops and services sprang up to serve the miners, and San Francisco became the central metropolis.

D — Panning placed river gravel and water in a shallow pan. Swirling allowed water and lighter material to spill away while heavier gold dust or nuggets settled at the bottom. Even a skilled miner could process only about fifty pans in a twelve-hour day.

E — A rocker was a sloping wooden box on a rocking mechanism. Earth, rock and water entered at the top; large rocks stayed in a sieve while gold fell to the bottom. It processed more material than a pan and needed no constant water supply, but failed to catch fine ‘flour’ gold. Miners added mercury to trap it, then heated the mercury so it vaporised and left the gold.

F — After 1850 surface gold largely disappeared. Mining was difficult and dangerous, and luck mattered as much as skill and hard work. Average earnings fell, industrial mining pushed independent miners into wage labour, and hydraulic mining damaged the landscape.

G — Gold production peaked in 1852 at about $81 million, then declined to around $45 million annually by 1857. Settlement continued, and California’s population reached 380,000 by the end of the decade.`;

export function readingDraft(): ParsedTestDraft {
  const cookers = ["Ezy Rice Cooker", "Family Rice Cooker", "Mini Rice Cooker", "VPN Rice Cooker", "S16 Rice Cooker"].map((t,i)=>option(String.fromCharCode(65+i),t));
  const sections = [
    { title: "Section 1", order: 0, content: section1Text, questions: [
      tfng(1, "You will receive a card telling you if an item has been left with a neighbour.", "NOT GIVEN"),
      tfng(2, "It may be quicker to get a refund than a replacement for a non-delivered item.", "NOT GIVEN"),
      tfng(3, "You are entitled to a refund if the item fails to arrive by a certain time.", "TRUE"),
      tfng(4, "There is a time limit when using chargeback for a debit-card payment.", "TRUE"),
      tfng(5, "You can use chargeback for a credit-card payment of more than £100.", "FALSE"),
      tfng(6, "PayPal’s online resolution centre has a good reputation for efficiency.", "NOT GIVEN"),
      ...["The side handles are hard to use.", "It cooks brown rice without making a mess.", "It automatically keeps cooked rice warm.", "Its removable top is difficult to clean thoroughly.", "A selection of recipes is included.", "It has a top handle for safe carrying.", "Its exterior does not get too hot.", "Its pot is dishwasher safe."].map((s,i)=>matching(i+7,s,cookers,["D","E","B","A","D","B","E","C"][i]!)),
    ]},
    { title: "Section 2", order: 1, content: section2Text, questions: [
      gap(15, "Over half of falls are from less than ________", "three metres", ["three metres", "3 metres"]),
      gap(16, "The majority of construction injuries occur on ________", "residential building sites"),
      gap(17, "________ the hazard at planning stage if possible", "eliminate"),
      gap(18, "Prevent a fall with scaffolding or ________", "temporary work platforms", ["temporary work platforms", "work platforms"]),
      gap(19, "Reduce injury by using ________", "safety nets"),
      gap(20, "Ladders should be used only for short-duration ________", "maintenance work", ["maintenance work", "work"]),
      gap(21, "Training should cover ladder ________ and use", "selection"), gap(22, "Regular ________ of ladders is required", "inspection"),
      gap(23, "The maximum weekly amount is £ ________", "140.98"), gap(24, "Being ________ for a time does not necessarily prevent eligibility", "unemployed"),
      gap(25, "Send a ________ or Small Earnings Exemption Certificate as income evidence", "payslip"),
      gap(26, "A ________ may prove the due date", "doctor’s letter", ["doctor's letter", "doctor’s letter"]), gap(27, "Changes in ________ must be reported", "circumstances"),
    ]},
    { title: "Section 3", order: 2, content: section3Text, questions: [
      mcq(28, "Why did Marshall’s discovery come at a good time for the US?", ["The war was ending and men needed work.", "His water-power expertise would help gold mining.", "California’s population was already rising quickly.", "The region was about to come under US control."], "D"),
      mcq(29, "What was the reaction in 1848 to news of the gold discovery?", ["The press convinced the public.", "Many San Francisco men left immediately.", "People needed physical evidence before believing it.", "Miners elsewhere in the US responded first."], "C"),
      mcq(30, "What resulted from thousands moving to California?", ["San Francisco could not cope.", "Most miners became wealthy.", "Some people left behind assumed unexpected roles.", "New towns quickly became good places to live."], "C"),
      mcq(31, "What does the writer say about pans and rockers?", ["Both required mercury.", "A rocker needed several miners.", "Pans were best for novices.", "Miners found a way around a design fault in one system."], "D"),
      ...["ways to make money other than mining", "gold often failed to compensate for the hard work", "an individual who convinced many that gold existed", "details of California’s pre-rush population", "shrinking revenue contrasted with increasing population"].map((s,i)=>matching(i+32,s,"ABCDEFG".split("").map(x=>option(x,`Section ${x}`)),["C","F","B","A","G"][i]!)),
      gap(37, "The basic method began by digging ________ from a river", "gravel"), gap(38, "There might even be gold ________", "nuggets"),
      gap(39, "Larger stones remained in the ________", "sieve"), gap(40, "________ was used to prevent fine gold washing away", "mercury"),
    ]},
  ];
  return { title: "Cambridge IELTS 15 General Training — Test 1 Reading", slug: "cambridge-ielts-15-general-test-1-reading", skill: "READING", examType: "GENERAL", timeLimitMinutes: 60, tags: ["#IELTS General", "#Reading", "#Cambridge 15", "#Test 1"], sourceFolder: SOURCE, description: "Cambridge IELTS 15 General Training, Test 1 — Reading.", parts: sections };
}

export function writingDraft(): ParsedTestDraft {
  const task1 = `You should spend about 20 minutes on this task.\n\nA friend of yours is thinking of going on a camping holiday for the first time this summer. He/She has asked for your advice.\n\nWrite a letter to your friend. In your letter:\n• explain why you think your friend would enjoy a camping holiday\n• describe some possible disadvantages\n• say whether you would like to go camping with your friend this summer\n\nWrite at least 150 words. You do NOT need to write any addresses.\n\nBegin your letter as follows:\nDear ……………,`;
  const task2 = `You should spend about 40 minutes on this task.\n\nWrite about the following topic:\n\nIn many countries today, crime novels and TV crime dramas are becoming more and more popular.\n\nWhy do you think these books and TV shows are popular? What is your opinion of crime fiction and TV crime dramas?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words.`;
  return { title: "Cambridge IELTS 15 General Training — Test 1 Writing", slug: "cambridge-ielts-15-general-test-1-writing", skill: "WRITING", examType: "GENERAL", timeLimitMinutes: 60, tags: ["#IELTS General", "#Writing", "#Cambridge 15", "#Test 1"], sourceFolder: SOURCE, description: "Cambridge IELTS 15 General Training, Test 1 — Writing.", parts: [
    { title: "Writing Task 1", order: 0, content: task1, questions: [{ number: 1, order: 0, type: "ESSAY", content: { stem: task1, minWords: 150, variant: "WRITING_GENERAL_LETTER" } }] },
    { title: "Writing Task 2", order: 1, content: task2, questions: [{ number: 2, order: 1, type: "ESSAY", content: { stem: task2, minWords: 250, variant: "WRITING_ESSAY" } }] },
  ]};
}

export function speakingDraft(): ParsedTestDraft {
  const prompt = (number: number, stem: string, variant: string): QuestionDraft => ({ number, order: number - 1, type: "SPEAKING_PROMPT", content: { stem, variant } });
  return { title: "Cambridge IELTS 15 General Training — Test 1 Speaking", slug: "cambridge-ielts-15-general-test-1-speaking", skill: "SPEAKING", examType: "GENERAL", timeLimitMinutes: 14, tags: ["#IELTS General", "#Speaking", "#Cambridge 15", "#Test 1"], sourceFolder: SOURCE, description: "Cambridge IELTS 15, Test 1 — Speaking.", parts: [
    { title: "Part 1 — Email", order: 0, content: "The examiner asks about yourself, your home, work or studies, and email.", questions: [prompt(1, "What kinds of emails do you receive about your work or studies?", "SPEAKING_PART_1"), prompt(2, "Do you prefer to email, phone or text your friends? Why?", "SPEAKING_PART_1"), prompt(3, "Do you reply to emails and messages as soon as you receive them? Why or why not?", "SPEAKING_PART_1"), prompt(4, "Are you happy to receive emails that advertise things? Why or why not?", "SPEAKING_PART_1")] },
    { title: "Part 2 — A hotel", order: 1, content: "You have one minute to prepare. Speak for one to two minutes.", questions: [prompt(5, "Describe a hotel that you know.\nYou should say:\n• where this hotel is\n• what this hotel looks like\n• what facilities this hotel has\nand explain whether you think this is a nice hotel to stay in.", "SPEAKING_PART_2")] },
    { title: "Part 3 — Hotels", order: 2, content: "Discussion topics: staying and working in hotels.", questions: [prompt(6, "What things are important when people choose a hotel?", "SPEAKING_PART_3"), prompt(7, "Why do some people not like staying in hotels?", "SPEAKING_PART_3"), prompt(8, "Do you think staying in a luxury hotel is a waste of money?", "SPEAKING_PART_3"), prompt(9, "Is working in a hotel a good career for life?", "SPEAKING_PART_3"), prompt(10, "How is working in a big hotel different from working in a small hotel?", "SPEAKING_PART_3"), prompt(11, "What skills are needed to be a successful hotel manager?", "SPEAKING_PART_3")] },
  ]};
}

async function prepareAudio(): Promise<string[]> {
  const destDir = path.join(ROOT, "public", "uploads", "audio", "cambridge-15-general-test-1");
  await mkdir(destDir, { recursive: true });
  const urls: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const name = `section-${i}.mp3`;
    await copyFile(path.join(AUDIO_SOURCE, `ielts15_test1_audio${i}.mp3`), path.join(destDir, name));
    urls.push(`/uploads/audio/cambridge-15-general-test-1/${name}`);
  }
  return urls;
}

async function uploadAudio(urls: string[]) {
  const accountId = process.env.R2_ACCOUNT_ID?.trim(); const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim(); const bucket = process.env.R2_BUCKET?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) throw new Error("Missing R2 credentials; use --skip-upload for local-only import.");
  const client = new S3Client({ region: "auto", endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
  for (const url of urls) {
    const filePath = path.join(ROOT, "public", url.replace(/^\//, "")); const info = await stat(filePath);
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: url.replace(/^\//, ""), Body: await readFile(filePath), ContentType: "audio/mpeg", ContentLength: info.size }));
  }
}

async function main() {
  const audioUrls = await prepareAudio();
  if (!process.argv.includes("--skip-upload")) await uploadAudio(audioUrls);
  const { saveTestDraft } = await import("../src/lib/store/test-store");
  const { persistParsedTest } = await import("../src/lib/import/persist");
  for (const raw of [listeningDraft(audioUrls), readingDraft(), writingDraft(), speakingDraft()]) {
    const draft = applyQuestionLayoutVariants(raw);
    const issues = validateQuestionLayouts(draft);
    const errors = issues.filter((x) => x.level === "error");
    if (errors.length) throw new Error(`${draft.slug}: ${JSON.stringify(errors)}`);
    await saveTestDraft(draft);
    const result = await persistParsedTest(draft, issues, { status: "DRAFT" });
    console.log(`${draft.slug}: ${draft.parts.reduce((n,p)=>n+p.questions.length,0)} questions, testId=${result.testId}`);
  }
}

if (!process.env.C15_LIBRARY_ONLY) {
  main().catch((error) => { console.error(error); process.exit(1); });
}
