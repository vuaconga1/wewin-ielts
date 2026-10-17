/**
 * Cambridge IELTS 15 General Training — Tests 2–4.
 * Question papers are transcribed from the scanned book, not the explanation website.
 *
 *   npx tsx scripts/import-cambridge-15-general-tests-2-4.ts
 *   $env:IMPORT_TESTS="2"; npx tsx scripts/import-cambridge-15-general-tests-2-4.ts
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
const BLANK = "...............";

const option = (label: string, text: string) => ({ label, text });
const letters = (texts: string[]) => texts.map((text, i) => option(String.fromCharCode(65 + i), text));
const romans = (texts: string[]) =>
  texts.map((text, i) => option(["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"][i]!, text));

function gap(number: number, answer: string, accepted: string[] = [answer], type: QuestionDraft["type"] = "GAP_FILL", variant = "NOTE_COMPLETION"): QuestionDraft {
  return {
    number, order: number - 1, type,
    content: { stem: "", blank: true, variant },
    correctAnswer: answer, acceptableAnswers: accepted,
  };
}
function mcq(number: number, stem: string, choices: string[], answer: string): QuestionDraft {
  return {
    number, order: number - 1, type: "MULTIPLE_CHOICE",
    content: { stem, options: letters(choices), variant: "SINGLE_CHOICE" },
    correctAnswer: answer,
  };
}
function chooseTwo(start: number, stem: string, choices: string[], answers: [string, string]): QuestionDraft[] {
  const options = letters(choices);
  return [
    { number: start, order: start - 1, type: "MULTIPLE_CHOICE", correctAnswer: answers[0], content: { stem, options, selectCount: 2, covers: [start, start + 1], variant: "MULTI_SELECT" } },
    { number: start + 1, order: start, type: "MULTIPLE_CHOICE", correctAnswer: answers[1], content: { stem: "", pairedFrom: start } },
  ];
}
function matching(number: number, stem: string, choices: { label: string; text: string }[], answer: string, variant: string): QuestionDraft {
  return { number, order: number - 1, type: "MATCHING", content: { stem, options: choices, variant }, correctAnswer: answer };
}
function tfng(number: number, stem: string, answer: string): QuestionDraft {
  return {
    number, order: number - 1, type: "TRUE_FALSE_NG",
    content: { stem, options: [option("TRUE", "TRUE"), option("FALSE", "FALSE"), option("NOT GIVEN", "NOT GIVEN")], variant: "TRUE_FALSE_NOT_GIVEN" },
    correctAnswer: answer,
  };
}

function base(test: number, skill: ParsedTestDraft["skill"]): Omit<ParsedTestDraft, "parts"> {
  const label = skill[0] + skill.slice(1).toLowerCase();
  return {
    title: `Cambridge IELTS 15 General Training — Test ${test} ${label}`,
    slug: `cambridge-ielts-15-general-test-${test}-${skill.toLowerCase()}`,
    skill, examType: "GENERAL",
    tags: ["#IELTS General", `#${label}`, "#Cambridge 15", `#Test ${test}`],
    sourceFolder: SOURCE,
    description: `Cambridge IELTS 15 General Training, Test ${test} — ${label}.`,
  };
}

const MAP2 = "/uploads/images/cambridge-15-general/test-2-minster-park.jpg";

export function listening2(audio: string[]): ParsedTestDraft {
  const topics = letters(["poverty", "education", "Dickens’s travels", "entertainment", "crime and the law", "wealth", "medicine", "a woman’s life"]);
  const mapOptions = "ABCDEFGHI".split("").map((label) => option(label, label));
  const mapItem = (number: number, answer: string): QuestionDraft => ({
    number, order: number - 1, type: "MAP_LABELING",
    content: { stem: "", blank: true, variant: "MAP_LABELING", imageUrl: MAP2, options: mapOptions },
    mediaUrl: MAP2, correctAnswer: answer,
  });
  return {
    ...base(2, "LISTENING"), timeLimitMinutes: 40, audioFiles: audio,
    parts: [
      {
        title: "Section 1", order: 0, meta: { audioUrl: audio[0] },
        content: `Questions 1–4
Complete the table below.
Write ONE WORD ONLY for each answer.

Festival information

| Date | Type of event | Details |
| --- | --- | --- |
| 17th | a concert | performers from Canada |
| 18th | a ballet | company called 1 ${BLANK} |
| 19th–20th (afternoon) | a play | type of play: a comedy called Jemima has had a good 2 ${BLANK} |
| 20th (evening) | a 3 ${BLANK} show | show is called 4 ${BLANK} |

Questions 5–10
Complete the notes below.
Write ONE WORD ONLY for each answer.

[[box]]
[[ntitle]]Workshops[[/ntitle]]
[[b0]]Making 5 ${BLANK} food
[[b0]](children only) Making 6 ${BLANK}
[[b0]](adults only) Making toys from 7 ${BLANK} using various tools

Outdoor activities
[[b0]]Swimming in the 8 ${BLANK}
[[b0]]Walking in the woods, led by an expert on 9 ${BLANK}
See the festival organiser’s 10 ${BLANK} for more information
[[/box]]`,
        questions: [
          gap(1, "Eustatis", ["Eustatis"], "TABLE_COMPLETION", "TABLE_COMPLETION"),
          gap(2, "review", ["review"], "TABLE_COMPLETION", "TABLE_COMPLETION"),
          gap(3, "dance", ["dance"], "TABLE_COMPLETION", "TABLE_COMPLETION"),
          gap(4, "Chat", ["Chat"], "TABLE_COMPLETION", "TABLE_COMPLETION"),
          gap(5, "healthy"), gap(6, "posters"), gap(7, "wood"), gap(8, "lake"), gap(9, "insects"), gap(10, "blog"),
        ],
      },
      {
        title: "Section 2", order: 1, meta: { audioUrl: audio[1], imageUrl: MAP2 },
        content: `Questions 11–14
Choose the correct letter, A, B or C.

[[title]]Minster Park[[/title]]

Questions 15–20
Label the map below.
Write the correct letter, A–I, next to questions 15–20.

[[title]]Minster Park[[/title]]
15 statue of Diane Gosforth ${BLANK}
16 wooden sculptures ${BLANK}
17 playground ${BLANK}
18 maze ${BLANK}
19 tennis courts ${BLANK}
20 fitness area ${BLANK}`,
        questions: [
          mcq(11, "The park was originally established", ["as an amenity provided by the city council.", "as land belonging to a private house.", "as a shared area set up by the local community."], "C"),
          mcq(12, "Why is there a statue of Diane Gosforth in the park?", ["She was a resident who helped to lead a campaign.", "She was a council member responsible for giving the public access.", "She was a senior worker at the park for many years."], "A"),
          mcq(13, "During the First World War, the park was mainly used for", ["exercises by troops.", "growing vegetables.", "public meetings."], "B"),
          mcq(14, "When did the physical transformation of the park begin?", ["2013", "2015", "2016"], "C"),
          mapItem(15, "E"), mapItem(16, "C"), mapItem(17, "B"), mapItem(18, "A"), mapItem(19, "G"), mapItem(20, "D"),
        ],
      },
      {
        title: "Section 3", order: 2, meta: { audioUrl: audio[2] },
        content: `Questions 21 and 22
Choose TWO letters, A–E.

Questions 23 and 24
Choose TWO letters, A–E.

Questions 25–30
What topic do Cathy and Graham choose to illustrate with each novel?
Choose SIX answers from the box and write the correct letter, A–H, next to questions 25–30.

25 The Pickwick Papers
26 Oliver Twist
27 Nicholas Nickleby
28 Martin Chuzzlewit
29 Bleak House
30 Little Dorrit`,
        questions: [
          ...chooseTwo(21, "Which TWO groups of people is the display primarily intended for?", ["students from the English department", "residents of the local area", "the university’s teaching staff", "potential new students", "students from other departments"], ["B", "D"]),
          ...chooseTwo(23, "What are Cathy and Graham’s TWO reasons for choosing the novelist Charles Dickens?", ["His speeches inspired others to try to improve society.", "He used his publications to draw attention to social problems.", "His novels are well-known now.", "He was consulted on a number of social issues.", "His reputation has changed in recent times."], ["B", "C"]),
          ...["The Pickwick Papers", "Oliver Twist", "Nicholas Nickleby", "Martin Chuzzlewit", "Bleak House", "Little Dorrit"].map((stem, i) =>
            matching(25 + i, stem, topics, ["G", "B", "D", "C", "H", "F"][i]!, "MATCHING_FEATURES")),
        ],
      },
      {
        title: "Section 4", order: 3, meta: { audioUrl: audio[3] },
        content: `Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

[[box]]
[[ntitle]]Agricultural programme in Mozambique[[/ntitle]]
How the programme was organised
[[b0]]It focused on a dry and arid region in Chicualacuala district, near the Limpopo River.
[[b0]]People depended on the forest to provide charcoal as a source of income.
[[b0]]31 ${BLANK} was seen as the main priority to ensure the supply of water.
[[b0]]Most of the work organised by farmers’ associations was done by 32 ${BLANK}.
[[b0]]Fenced areas were created to keep animals away from crops.
[[b0]]The programme provided
– 33 ${BLANK} for the fences
– 34 ${BLANK} for suitable crops
– water pumps.
[[b0]]The farmers provided
– labour
– 35 ${BLANK} for the fences on their land.

Further developments
[[b0]]The marketing of produce was sometimes difficult due to lack of 36 ${BLANK}.
[[b0]]Training was therefore provided in methods of food 37 ${BLANK}.
[[b0]]Farmers made special places where 38 ${BLANK} could be kept.
[[b0]]Local people later suggested keeping 39 ${BLANK}.

Evaluation and lessons learned
[[b0]]Agricultural production increased, improving incomes and food security.
[[b0]]Enough time must be allowed, particularly for the 40 ${BLANK} phase of the programme.
[[/box]]`,
        questions: [
          gap(31, "irrigation"), gap(32, "women"),
          gap(33, "wire", ["wire", "wires"]), gap(34, "seed", ["seed", "seeds"]),
          gap(35, "posts"), gap(36, "transport"), gap(37, "preservation"),
          gap(38, "fish", ["fish", "fishes"]), gap(39, "bees"), gap(40, "design"),
        ],
      },
    ],
  };
}

export function listening3(audio: string[]): ParsedTestDraft {
  const hazel = letters([
    "She will definitely look for a suitable article.",
    "She may look for a suitable article.",
    "She definitely won't look for an article.",
  ]);
  return {
    ...base(3, "LISTENING"), timeLimitMinutes: 40, audioFiles: audio,
    parts: [
      {
        title: "Section 1", order: 0, meta: { audioUrl: audio[0] },
        content: `Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

[[box]]
[[ntitle]]Employment Agency: Possible Jobs[[/ntitle]]
First Job
Administrative assistant in a company that produces 1 ${BLANK} (North London)
Responsibilities
[[b0]]data entry
[[b0]]go to 2 ${BLANK} and take notes
[[b0]]general admin
[[b0]]management of 3 ${BLANK}
Requirements
[[b0]]good computer skills including spreadsheets
[[b0]]good interpersonal skills
[[b0]]attention to 4 ${BLANK}
Experience
[[b0]]need a minimum of 5 ${BLANK} of experience of teleconferencing

Second Job
Warehouse assistant in South London
Responsibilities
[[b0]]stock management
[[b0]]managing 6 ${BLANK}
Requirements
[[b0]]ability to work with numbers
[[b0]]good computer skills
[[b0]]very organised and 7 ${BLANK}
[[b0]]good communication skills
[[b0]]used to working in a 8 ${BLANK}
[[b0]]able to cope with items that are 9 ${BLANK}
Need experience of
[[b0]]driving in London
[[b0]]warehouse work
[[b0]]10 ${BLANK} service
[[/box]]`,
        questions: [
          gap(1, "furniture"), gap(2, "meetings"), gap(3, "diary"),
          gap(4, "detail", ["detail", "details"]),
          gap(5, "1 year", ["1 year", "one year"]),
          gap(6, "deliveries"), gap(7, "tidy"), gap(8, "team"), gap(9, "heavy"), gap(10, "customer"),
        ],
      },
      {
        title: "Section 2", order: 1, meta: { audioUrl: audio[1] },
        content: `Questions 11–16
Choose the correct letter, A, B or C.

[[title]]Street Play Scheme[[/title]]

Questions 17 and 18
Choose TWO letters, A–E.

Questions 19 and 20
Choose TWO letters, A–E.`,
        questions: [
          mcq(11, "When did the Street Play Scheme first take place?", ["two years ago", "three years ago", "six years ago"], "B"),
          mcq(12, "How often is Beechwood Road closed to traffic now?", ["once a week", "on Saturdays and Sundays", "once a month"], "A"),
          mcq(13, "Who is responsible for closing the road?", ["a council official", "the police", "local wardens"], "C"),
          mcq(14, "Residents who want to use their cars", ["have to park in another street.", "must drive very slowly.", "need permission from a warden."], "B"),
          mcq(15, "Alice says that Street Play Schemes are most needed in", ["wealthy areas.", "quiet suburban areas.", "areas with heavy traffic."], "C"),
          mcq(16, "What has been the reaction of residents who are not parents?", ["Many of them were unhappy at first.", "They like seeing children play in the street.", "They are surprised by the lack of noise."], "B"),
          ...chooseTwo(17, "Which TWO benefits for children does Alice think are the most important?", ["increased physical activity", "increased sense of independence", "opportunity to learn new games", "opportunity to be part of a community", "opportunity to make new friends"], ["B", "D"]),
          ...chooseTwo(19, "Which TWO results of the King Street experiment surprised Alice?", ["more shoppers", "improved safety", "less air pollution", "more relaxed atmosphere", "less noise pollution"], ["A", "E"]),
        ],
      },
      {
        title: "Section 3", order: 2, meta: { audioUrl: audio[2] },
        content: `Questions 21–26
Complete the notes below.
Write ONE WORD ONLY for each answer.

[[box]]
What Hazel should analyse about items in newspapers:
[[b0]]what 21 ${BLANK} the item is on
[[b0]]the 22 ${BLANK} of the item, including the headline
[[b0]]any 23 ${BLANK} accompanying the item
[[b0]]the 24 ${BLANK} of the item, e.g. what’s made prominent
[[b0]]the writer’s main 25 ${BLANK}
[[b0]]the 26 ${BLANK} the writer may make about the reader
[[/box]]

Questions 27–30
What does Hazel decide to do about each of the following types of articles?
Write the correct letter, A, B or C, next to questions 27–30.

27 national news item
28 editorial
29 human interest
30 arts`,
        questions: [
          gap(21, "page"), gap(22, "size"), gap(23, "graphic", ["graphic", "graphics"]),
          gap(24, "structure"), gap(25, "purpose"), gap(26, "assumption", ["assumption", "assumptions"]),
          matching(27, "national news item", hazel, "A", "MATCHING_FEATURES"),
          matching(28, "editorial", hazel, "C", "MATCHING_FEATURES"),
          matching(29, "human interest", hazel, "C", "MATCHING_FEATURES"),
          matching(30, "arts", hazel, "B", "MATCHING_FEATURES"),
        ],
      },
      {
        title: "Section 4", order: 3, meta: { audioUrl: audio[3] },
        content: `Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

[[box]]
[[ntitle]]Early history of keeping clean[[/ntitle]]
Prehistoric times:
[[b0]]water was used to wash off 31 ${BLANK}

Ancient Babylon:
[[b0]]soap-like material found in 32 ${BLANK} cylinders

Ancient Greece:
[[b0]]people cleaned themselves with sand and other substances
[[b0]]used a strigil – scraper made of 33 ${BLANK}
[[b0]]washed clothes in streams

Ancient Germany and Gaul:
[[b0]]used soap to colour their 34 ${BLANK}

Ancient Rome:
[[b0]]animal fat, ashes and clay mixed through action of rain, used for washing clothes
[[b0]]from about 312 BC, water carried to Roman 35 ${BLANK} by aqueducts

Europe in Middle Ages:
[[b0]]decline in bathing contributed to occurrence of 36 ${BLANK}
[[b0]]37 ${BLANK} began to be added to soap

Europe from 17th century:
[[b0]]1600s: cleanliness and bathing started becoming usual
[[b0]]1791: Leblanc invented a way of making soda ash from 38 ${BLANK}
[[b0]]early 1800s: Chevreul turned soapmaking into a 39 ${BLANK}
[[b0]]from 1800s, there was no longer a 40 ${BLANK} on soap
[[/box]]`,
        questions: [
          gap(31, "mud"), gap(32, "clay"), gap(33, "metal"), gap(34, "hair"),
          gap(35, "bath", ["bath", "baths"]), gap(36, "disease", ["disease", "diseases"]),
          gap(37, "perfume"), gap(38, "salt"), gap(39, "science"), gap(40, "tax"),
        ],
      },
    ],
  };
}

const reading2Section1 = `[[section]]Questions 1–6[[/section]]

[[title]]Harvey’s Storage[[/title]]

Harvey’s Storage is a well-established independent company. We are centrally located in the city and provide excellent facilities for all your storage requirements.

We provide safe and secure units for both long- and short-term storage dependent on your needs. Our rates are competitive and tailored to your specific requirements and your choice of storage unit. Heavy-duty locks and keys are provided to all of our customers and included in the prices listed. You can hire the unit with the storage capacity you need, for the period of time that the storage is required, in a sound and secure environment, monitored by CCTV. With 24-hour access, customers can deliver and collect items when it is convenient to do so, unrestricted by business or office hours. Tarmac roadways allow customers to park cars and lorries immediately outside their units, minimising the effort required to collect or drop items off.

Household storage Self-storage is ideal for families or individuals with either a short- or long-term need to store their belongings. Some of our clients are de-cluttering, or they may be getting their property decorated, or planning to go abroad for a time.

Student storage You may be travelling or going home to see family and friends in the vacation, or need time to find a place to stay. You may want to store all your books and personal items, or just a few boxes or a musical instrument. We offer no-nonsense competitive pricing with flexible hire periods and with no hidden extras. We can provide you with short- or long-term affordable hire in a safe and secure environment. You are responsible for organising transport but we can also recommend local van and driver hire companies.

Business storage Free up your expensive retail space with affordable self-storage. We have three different business storage centres to choose from so you can choose the location that is most convenient for you.

[[section]]Questions 7–14[[/section]]

[[title]]Local museums[[/title]]

A Whittlesey Museum
The museum is located in the Old Town Hall, which was originally built to house horse-drawn fire engines. It has eight rooms, and the exhibits cover topics such as archive photographs, costume, domestic life and local celebrities.

B Octavia Hill’s Birthplace House
Built in 1740, this is the birthplace of pioneer social reformer Octavia Hill, who was active in the late 19th and early 20th centuries in social housing and the arts, as well as in conservation issues. Visitors are taken on a guided tour and are then free to explore the gardens.

C Chatteris Museum
The old market town of Chatteris was largely rebuilt, after two serious fires in 1706 and 1864 destroyed many of the town’s ancient buildings. The museum’s exhibits illustrate traditional aspects of the life of local farmers as well as the railway boom of the 19th century. The museum has a touch-screen kiosk which contains over 9,000 historic photographs and texts, reproductions of which can be made on request.

D March and District Museum
Located in the middle of the market town of March, the museum is housed in a former school built in 1851. Its wide-ranging collections include reconstructions of an early 20th-century kitchen, sitting room and nursery. There is also an interesting display of historic cameras and radios, and a medal which was awarded to train driver Ben Gimbert for his bravery in preventing loss of life when a train full of explosives caught fire in 1944.

E Wisbech and Fenland Museum
This 19th-century gem holds collections from around the world including Ancient Egypt. Its library, which is open to the public on the first Saturday of each month, contains the manuscript of Great Expectations by the 19th-century novelist Charles Dickens, and the Research Room can be booked for researching local records.`;

const reading2Section2 = `[[title]]Workplace health and safety considerations for plumbers[[/title]]

Like many trades, plumbing can be a dangerous job. It is important to take all reasonably practicable measures to keep customers and yourself incident and injury free.

Biohazard waste
Plumbers regularly come into contact with biohazard waste. It’s the nature of the job, but that doesn’t mean you should be complacent about it. According to Safe Work Australia, communicable diseases from work-related exposures to biological hazards such as sewage have been estimated to cause 320,000 deaths across the globe each year. In addition to this, plumbers are regularly exposed to other biohazards such as mould, bacteria and algae. Don’t risk it – make sure appropriate protective clothing and equipment is used.

Confined spaces
Plumbers may spend much of their time working in confined spaces, where they are at risk from contaminants, including airborne gases, vapours and dusts, that may cause injury from fire or explosion. They may also be exposed to high concentrations of airborne contaminants that may be harmful to health. For example, one plumber was fined $220,000 after an employee suffered from carbon-monoxide poisoning. Another potential hazard for plumbers in confined spaces is that of drowning, if water sources are not adequately cut off.

The Safe Work Australia confined spaces code of practice outlines the necessary steps and precautions for avoiding illness and injury.

Electricity
The Master Plumbers’ Association calls electricity ‘plumbing’s hidden killer’. Metal pipes are often conductive and so gloves which provide insulation should form part of a plumber’s tool kit, as should a plumbing voltage monitor and a volt tester. Gloves should be checked prior to every use and replaced every 12 to 14 months. Electrical equipment like bridging conductors should be regularly checked, with appropriate tags on the equipment to verify its safety. The project should be stopped immediately if there is any sign of electricity, so that the power can be disconnected by a qualified electrician prior to continuing work.

[[title]]How to manage flexible working with your employees[[/title]]

There is no denying that flexible working has grown enormously in recent years. It does, however, require careful management.

When it comes to implementing flexible working one word is key: trust. All flexible workers should be trusted and given well-defined objectives from the start and their contribution should be assessed according to their output, as opposed to the time they spend on the job. It can be a big step to implement such a change in your business, so if you are slightly cautious then I recommend perhaps setting up an end-of-the-day review to see how much progress has been made. As all parties find their feet with the new set-up, this contact can slowly be reduced.

In my eyes, it is also vital that there is shared calendar access for everyone so that people can see where their colleagues are each day. This way if they need to catch up with someone they can plan when to do so. Technology now exists to enable employees to stay in touch with other members of staff and external partners. iMeet, for example, is a tool which allows all forms of collaboration for remote working, from video conferencing, live chat and file sharing to screen sharing. The new breed of worker is therefore fully equipped to work productively away from the office, and can still feel like they’re in the same room as others when necessary.

In my experience, employees are often more productive working at home and they can work the exact hours they want and do not have to cope with distraction caused by other employees. Being outside the confines of the office walls also appears to foster creativity. In addition, we find staff are more motivated as they have a better work–life balance. In terms of the business, we find this helps with top talent recruitment and staff retention, and a happy workforce is a more successful one.

Questions 15–20
Complete the table below.
Choose ONE WORD ONLY from the text for each answer.

| Type of danger | Examples | Risks involved | Necessary action |
| --- | --- | --- | --- |
| Biohazard | 15 ${BLANK}, mould, bacteria, algae | can lead to disease and death | use protective clothing and equipment |
| Confined spaces | contaminants e.g. gases, vapours and dusts | injury from fire or explosion | follow Safe Work code of practice |
| Confined spaces | high concentrations of harmful airborne contaminants e.g. carbon monoxide | 16 ${BLANK} | follow Safe Work code of practice |
| Confined spaces | water | 17 ${BLANK} | cut off water sources |
| Electricity | metal pipes which are conductive | death from electrocution | use insulated 18 ${BLANK} and appropriate equipment; ensure equipment has 19 ${BLANK} on to show it is safe; make sure electricity has been 20 ${BLANK} |

Questions 21–27
Complete the notes below.
Choose ONE WORD ONLY from the text for each answer.

[[box]]
[[ntitle]]Flexible working[[/ntitle]]
How to organise flexible working
[[b0]]trust your employees
[[b0]]provide them with clear 21 ${BLANK}
[[b0]]base measurements of performance on their output
[[b0]]initially, have a 22 ${BLANK} of progress each day
[[b0]]make sure a 23 ${BLANK} is accessible to give details of colleague locations
[[b0]]use a program such as iMeet to encourage different types of 24 ${BLANK} between workers

Benefits of flexibility
[[b0]]greater productivity
[[b0]]less 25 ${BLANK} from colleagues
[[b0]]increase in 26 ${BLANK}
[[b0]]more motivated staff
[[b0]]greater success for the company with staff recruitment and 27 ${BLANK}
[[/box]]`;

const reading2Section3 = `[[title]]Preventing the theft of turtle eggs[[/title]]

Conservationists and law enforcement have struggled to prevent wildlife trafficking. But could some plastic eggs and GPS trackers change the game?

A Humans have been eating sea turtle eggs (and killing adult turtles for meat) for millennia. However, as human populations exploded and as sea turtles began to confront additional threats such as intensive fishing, beach development and climate change, sea turtle populations declined precipitously. Today, all but one of the world’s seven species of sea turtles are considered threatened according to the IUCN Red List. And the one that’s not – the flatback turtle – is listed as data deficient, which means scientists simply don’t know how it’s doing.

B One major problem is that every year millions of sea turtle eggs are illegally taken by poachers for sale on the black market. The situation is particularly serious in Nicaragua, in Central America, which is home to four sea turtle species.

Kim Williams-Guillen, who works for conservation body Paso Pacifico, described the poaching of sea turtle nests on the beaches of Nicaragua as ‘uncontrolled, unregulated, extensive and contested’. Even the best-protected beaches are plundered to some extent and it’s not uncommon to see poachers digging up nests just meters from tourists watching sea turtles laying their clutch at night, she said. This poaching becomes particularly frenzied during the arribadas – mass laying events where thousands of turtles nest on the same beach for a single night in a biological strategy to overwhelm natural predators.

C ‘Even with armed guards, the numbers of poachers overwhelm military personnel by ten or twenty to one,’ Williams-Guillen said. ‘Although many poachers are locals with limited resources, during these arribadas there are influxes of gangs of poachers from larger cities outside local communities. These are not just local poor people without other options.’

But to protect the country’s sea turtles, Williams-Guillen said conservationists shouldn’t just depend on catching low-level operators. ‘If one poacher decides to stop, another one will just step into his place … we need to know more about the middlemen and people higher up in the distribution chain,’ she said.

D Paso Pacifico’s solution is the creation of high-tech sea turtle eggs: fake eggs convincingly crafted to look like the real thing, but which contain GPS tracking devices. These have the potential to reveal the destination markets for trafficked sea turtle eggs.

Making convincing sea turtle eggs is not easy, and Paso Pacifico is still working on perfecting a prototype. In particular, it’s proving quite problematic to create the right texture, since sea turtle eggs are not covered in a hard shell like those of birds, but are quite flexible.

So Paso Pacifico brought in Lauren Wilde, a special effects artist in the US, to create a convincing outer shell. First, Wilde had to get her hands on the real thing. Since it’s illegal to send sea turtle eggs over the border, Wilde is using land turtle eggs from California. ‘It was really eye opening and important for me to feel these eggs and how the shell bends a little,’ she said.

To get the GPS device inside the shell, Paso Pacifico is using 3D printers to make a plastic ball which will then have a GPS transmitter fitted inside. This will take the place of the embryo inside the shell. Lastly the fake shells will be sealed with silicone, waterproofing them.

E Sea turtles on average lay around 100 eggs in a nest, and once the fake eggs are finished they will be slipped in with the real ones. Williams-Guillen said it might even be possible to deliver fake eggs into nests while poachers are at work. Wary of tourists, poachers will often back off if strangers come near and then return when they have gone. ‘It would be pretty easy to drop an egg in the dark into a nest they have been digging up,’ she said.

Once the poacher picks up the fake egg along with the real ones, conservationists and law enforcement agents will be able to track them. Experts believe most of the stolen eggs eventually make their way out of Nicaragua, possibly to El Salvador or Guatemala. However, there is also growing concern that sea turtle eggs from Central America are actually heading to the USA, from where they are sold on to other countries around the world.

F To date, Paso Pacifico has yet to put a single fake egg in a nest. But Williams-Guillen said she isn’t too concerned that publicity for their scheme will result in poachers looking for the eggs. ‘The vast majority of the poaching is happening at night, so already it is hard to tell [the eggs] apart, and at this point, poachers and middlemen are not closely inspecting eggs, but rather shoving them into a sack as quickly as possible.’

Of course, poachers will eventually become aware of the prospect of fake eggs among the real ones – especially when customers try to bite into an egg and break their teeth on the GPS transmitter instead. So, Paso Pacifico plans to do a massive deployment of as many fakes as possible to gather a lot of data before poachers get wise.

Knowing where the eggs go will allow conservationists and law enforcement agents to focus their resources on the right places – whether it be through awareness-building campaigns or crackdowns on illegal sellers. And eventually Paso Pacifico hopes to share the technology with interested parties around the world.

Questions 28–33
The text has six sections, A–F.
Choose the correct heading for each section from the list of headings below.
Write the correct number, i–vii, in boxes 28–33 on your answer sheet.

List of Headings
i Developing an item that appears true to life
ii Extending the project to other endangered species
iii A short but intensive investigation with longer-term follow-up
iv Problems facing sea turtles at a global level
v Collection of eggs and their possible onward routes
vi Intensive and large-scale poaching in one location
vii Why catching the poachers may not solve the problem

28 Section A
29 Section B
30 Section C
31 Section D
32 Section E
33 Section F

Questions 34–37
Choose the correct letter, A, B, C or D.

Questions 38–40
Complete the summary below.
Choose ONE WORD ONLY from the text for each answer.

Making convincing sea turtle eggs

One difficulty in creating a fake sea turtle egg is to get the appropriate texture for the shell. Unlike a bird’s egg, a turtle’s egg has a shell which is 38 ${BLANK}. Lauren Wilde has studied eggs from Californian turtles that live on 39 ${BLANK} to create a realistic reproduction of the shell. A GPS device will then be placed inside a 40 ${BLANK} in the fake shell. Finally, silicone will be applied to the shell to make it waterproof.`;

export function reading2(): ParsedTestDraft {
  const museums = letters(["Whittlesey Museum", "Octavia Hill’s Birthplace House", "Chatteris Museum", "March and District Museum", "Wisbech and Fenland Museum"]);
  const headings = romans([
    "Developing an item that appears true to life",
    "Extending the project to other endangered species",
    "A short but intensive investigation with longer-term follow-up",
    "Problems facing sea turtles at a global level",
    "Collection of eggs and their possible onward routes",
    "Intensive and large-scale poaching in one location",
    "Why catching the poachers may not solve the problem",
  ]);
  return {
    ...base(2, "READING"), timeLimitMinutes: 60,
    parts: [
      {
        title: "Section 1", order: 0, content: reading2Section1,
        questions: [
          tfng(1, "There is an extra charge for locks and keys.", "FALSE"),
          tfng(2, "It is possible to arrange to share a storage unit with someone else.", "NOT GIVEN"),
          tfng(3, "You can pick up your property from the storage unit during the night-time.", "TRUE"),
          tfng(4, "You can drive your vehicle right next to your storage unit.", "TRUE"),
          tfng(5, "Students’ possessions can only be stored during vacation periods.", "FALSE"),
          tfng(6, "The storage company will collect and deliver students’ property.", "FALSE"),
          ...[
            "There are exhibits related to the history of agriculture in the region.",
            "Equipment for putting out fires used to be kept in this building.",
            "You can find information on the rise of one type of transport.",
            "There are things to see both inside and outside.",
            "It is possible to obtain copies of old pictures and documents.",
            "On certain days you can see an original work by a writer of fiction.",
            "Someone who was interested in environmental matters lived here for a time.",
            "This museum has an exhibit related to a heroic achievement.",
          ].map((stem, i) => matching(7 + i, stem, museums, ["C", "A", "C", "B", "C", "E", "B", "D"][i]!, "MATCHING_FEATURES")),
        ],
      },
      {
        title: "Section 2", order: 1, content: reading2Section2,
        questions: [
          gap(15, "sewage", ["sewage"], "TABLE_COMPLETION", "TABLE_COMPLETION"),
          gap(16, "poisoning", ["poisoning"], "TABLE_COMPLETION", "TABLE_COMPLETION"),
          gap(17, "drowning", ["drowning"], "TABLE_COMPLETION", "TABLE_COMPLETION"),
          gap(18, "gloves", ["gloves"], "TABLE_COMPLETION", "TABLE_COMPLETION"),
          gap(19, "tags", ["tags"], "TABLE_COMPLETION", "TABLE_COMPLETION"),
          gap(20, "disconnected", ["disconnected"], "TABLE_COMPLETION", "TABLE_COMPLETION"),
          gap(21, "objectives"), gap(22, "review"), gap(23, "calendar"), gap(24, "collaboration"),
          gap(25, "distraction"), gap(26, "creativity"), gap(27, "retention"),
        ],
      },
      {
        title: "Section 3", order: 2, content: reading2Section3,
        questions: [
          ...["Section A", "Section B", "Section C", "Section D", "Section E", "Section F"].map((stem, i) =>
            matching(28 + i, stem, headings, ["iv", "vi", "vii", "i", "v", "iii"][i]!, "MATCHING_HEADINGS")),
          mcq(34, "What does the writer suggest about the flatback turtle?", ["It could be as severely threatened as other turtles.", "It has been neglected by scientists in the past.", "It is in less danger than some other species.", "It should be removed from the IUCN Red List."], "A"),
          mcq(35, "Williams-Guillen says that the poaching of sea turtle eggs in Nicaragua", ["is mainly carried out by local people.", "may be encouraged by the presence of tourists.", "sometimes has a highly organised structure.", "can only be controlled by the use of armed guards."], "C"),
          mcq(36, "In Section E, Williams-Guillen says that one way to encourage poachers to take the fake eggs is to", ["make fake nests and put the eggs into them.", "put them in nests with just a few real eggs.", "distract the poachers after the fake eggs have been put in the nests.", "put them in nests that the poachers have started to dig up."], "D"),
          mcq(37, "It is planned to use a large number of fake eggs at the beginning because", ["some of the fake eggs may be missed by the poachers.", "it may not be possible to continue the project indefinitely.", "some eggs may be hidden in the sand.", "it may not be feasible to fund long-term research."], "B"),
          gap(38, "flexible", ["flexible"], "GAP_FILL", "SUMMARY_COMPLETION"),
          gap(39, "land", ["land"], "GAP_FILL", "SUMMARY_COMPLETION"),
          gap(40, "ball", ["ball"], "GAP_FILL", "SUMMARY_COMPLETION"),
        ],
      },
    ],
  };
}

export function writing2(): ParsedTestDraft {
  const task1 = `You should spend about 20 minutes on this task.

A museum near your home is looking for people to do part-time voluntary/unpaid work. You would like to do some voluntary/unpaid work at the museum.

Write a letter to the museum director to apply for the voluntary/unpaid work. In your letter
• explain why you want to do voluntary/unpaid work at the museum
• describe some skills and qualities you have that would be useful
• give details of when you would be available for work

Write at least 150 words.

You do NOT need to write any addresses.

Begin your letter as follows:
Dear Sir or Madam,`;
  const task2 = `You should spend about 40 minutes on this task.

Write about the following topic:

Nowadays many people complain that they have difficulties getting enough sleep.

What problems can lack of sleep cause?

What can be done about lack of sleep?

Give reasons for your answer and include any relevant examples from your own knowledge or experience.

Write at least 250 words.`;
  return {
    ...base(2, "WRITING"), timeLimitMinutes: 60,
    parts: [
      { title: "Writing Task 1", order: 0, content: task1, questions: [{ number: 1, order: 0, type: "ESSAY", content: { stem: task1, minWords: 150, variant: "WRITING_GENERAL_LETTER" } }] },
      { title: "Writing Task 2", order: 1, content: task2, questions: [{ number: 2, order: 1, type: "ESSAY", content: { stem: task2, minWords: 250, variant: "WRITING_ESSAY" } }] },
    ],
  };
}

export function speaking2(): ParsedTestDraft {
  let n = 1;
  const prompt = (stem: string, variant: string): QuestionDraft => ({ number: n, order: n++ - 1, type: "SPEAKING_PROMPT", content: { stem, variant } });
  return {
    ...base(2, "SPEAKING"), timeLimitMinutes: 14,
    parts: [
      { title: "Part 1", order: 0, content: "The examiner asks about yourself, your home, work or studies, and other familiar topics.", questions: [
        prompt("How many languages can you speak? [Why/Why not?]", "SPEAKING_PART_1"),
        prompt("How useful will English be to you in your future? [Why/Why not?]", "SPEAKING_PART_1"),
        prompt("What do you remember about learning languages at school? [Why/Why not?]", "SPEAKING_PART_1"),
        prompt("What do you think would be the hardest language for you to learn? [Why?]", "SPEAKING_PART_1"),
      ]},
      { title: "Part 2", order: 1, content: "You will have to talk about the topic for one to two minutes. You have one minute to think about what you are going to say.", questions: [
        prompt("Describe a website that you bought something from.\nYou should say:\n• what the website is\n• what you bought from this website\n• how satisfied you were with what you bought\nand explain what you liked or disliked about using this website.", "SPEAKING_PART_2"),
      ]},
      { title: "Part 3", order: 2, content: "Discussion topics: shopping online, and the culture of consumerism.", questions: [
        prompt("What kinds of things do people in your country often buy from online shops?", "SPEAKING_PART_3"),
        prompt("Why do you think online shopping has become so popular nowadays?", "SPEAKING_PART_3"),
        prompt("What are some possible disadvantages of buying things from online shops?", "SPEAKING_PART_3"),
        prompt("Why do many people today keep buying things which they do not need?", "SPEAKING_PART_3"),
        prompt("Do you believe the benefits of a consumer society outweigh the disadvantages?", "SPEAKING_PART_3"),
        prompt("How possible is it to avoid the culture of consumerism?", "SPEAKING_PART_3"),
      ]},
    ],
  };
}

const MAP4 = "/uploads/images/cambridge-15-general/test-4-croft-valley-park.jpg";

export function listening4(audio: string[]): ParsedTestDraft {
  const mapOptions = "ABCDEFGH".split("").map((label) => option(label, label));
  const mapItem = (number: number, answer: string): QuestionDraft => ({
    number, order: number - 1, type: "MAP_LABELING",
    content: { stem: "", blank: true, variant: "MAP_LABELING", imageUrl: MAP4, options: mapOptions },
    mediaUrl: MAP4, correctAnswer: answer,
  });
  const people = letters(["Annie", "Jack", "both Annie and Jack"]);
  return {
    ...base(4, "LISTENING"), timeLimitMinutes: 40, audioFiles: audio,
    parts: [
      {
        title: "Section 1", order: 0, meta: { audioUrl: audio[0] },
        content: `Questions 1–10
Complete the form below.
Write ONE WORD AND/OR A NUMBER for each answer.

[[box]]
[[ntitle]]Customer Satisfaction Survey[[/ntitle]]
Customer details
[[b0]]Occupation: 1 ${BLANK}
[[b0]]Reason for travel today: 2 ${BLANK}
Journey information
[[b0]]Name of station returning to: 3 ${BLANK}
[[b0]]Type of ticket purchased: Standard 4 ${BLANK} ticket
[[b0]]Cost of ticket: £ 5 ${BLANK}
[[b0]]Where ticket was bought: 6 ${BLANK}
Satisfaction with journey
[[b0]]Least satisfied with: the 7 ${BLANK} this morning.
Satisfaction with station facilities
[[b0]]Most satisfied with: how much 8 ${BLANK} was provided
[[b0]]Least satisfied with: lack of seats, particularly on the 9 ${BLANK}
[[b0]]Neither satisfied nor dissatisfied with: the 10 ${BLANK} available
[[/box]]`,
        questions: [
          gap(1, "journalist"), gap(2, "shopping"), gap(3, "Staunfirth"), gap(4, "return"),
          gap(5, "23.70", ["23.70", "23.7"]), gap(6, "online"), gap(7, "delay"),
          gap(8, "information"), gap(9, "platform", ["platform", "platforms"]), gap(10, "parking"),
        ],
      },
      {
        title: "Section 2", order: 1, meta: { audioUrl: audio[1], imageUrl: MAP4 },
        content: `Questions 11–16
Label the map below.
Write the correct letter, A–H, next to questions 11–16.

[[title]]Croft Valley Park[[/title]]
11 café ${BLANK}
12 toilets ${BLANK}
13 formal gardens ${BLANK}
14 outdoor gym ${BLANK}
15 skateboard ramp ${BLANK}
16 wild flowers ${BLANK}

Questions 17 and 18
Choose TWO letters, A–E.

Questions 19 and 20
Choose TWO letters, A–E.`,
        questions: [
          mapItem(11, "D"), mapItem(12, "C"), mapItem(13, "G"), mapItem(14, "H"), mapItem(15, "A"), mapItem(16, "E"),
          ...chooseTwo(17, "Which TWO statements does the speaker make about the adventure playground?", ["Children must be supervised.", "It costs more in winter.", "Some activities are only for younger children.", "No payment is required.", "It was recently expanded."], ["A", "D"]),
          ...chooseTwo(19, "Which TWO statements does the speaker make about the glass houses?", ["They are closed at weekends.", "Volunteers are needed to work there.", "They were badly damaged by fire.", "More money is needed to repair some of the glass.", "Visitors can see palm trees from tropical regions."], ["A", "C"]),
        ],
      },
      {
        title: "Section 3", order: 2, meta: { audioUrl: audio[2] },
        content: `Questions 21–24
Choose the correct letter, A, B or C.

[[title]]Presentation about refrigeration[[/title]]

Questions 25–30
Who is going to do research into each topic?
Write the correct letter, A, B or C, next to questions 25–30.

25 the goods that are refrigerated
26 the effects on health
27 the impact on food producers
28 the impact on cities
29 refrigerated transport
30 domestic fridges`,
        questions: [
          mcq(21, "What did Annie discover from reading about icehouses?", ["why they were first created", "how the ice was kept frozen", "where they were located"], "B"),
          mcq(22, "What point does Annie make about refrigeration in ancient Rome?", ["It became a commercial business.", "It used snow from nearby.", "It took a long time to become popular."], "A"),
          mcq(23, "In connection with modern refrigerators, both Annie and Jack are worried about", ["the complexity of the technology.", "the fact that some are disposed of irresponsibly.", "the large number that quickly break down."], "B"),
          mcq(24, "What do Jack and Annie agree regarding domestic fridges?", ["They are generally good value for money.", "There are plenty of useful variations.", "They are more useful than other domestic appliances."], "A"),
          ...["the goods that are refrigerated", "the effects on health", "the impact on food producers", "the impact on cities", "refrigerated transport", "domestic fridges"].map((stem, i) =>
            matching(25 + i, stem, people, ["A", "A", "B", "B", "A", "C"][i]!, "MATCHING_FEATURES")),
        ],
      },
      {
        title: "Section 4", order: 3, meta: { audioUrl: audio[3] },
        content: `Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

[[box]]
[[ntitle]]How the Industrial Revolution affected life in Britain[[/ntitle]]
19th century
[[b0]]For the first time, people’s possessions were used to measure Britain’s 31 ${BLANK}.
[[b0]]Developments in production of goods and in 32 ${BLANK} greatly changed lives.

MAIN AREAS OF CHANGE
Manufacturing
[[b0]]The Industrial Revolution would not have happened without the new types of 33 ${BLANK} that were used then.
[[b0]]The leading industry was 34 ${BLANK} (its products became widely available).
[[b0]]New 35 ${BLANK} made factories necessary and so more people moved into towns.

Transport
[[b0]]The railways took the place of canals.
[[b0]]Because of the new transport:
– greater access to 36 ${BLANK} made people more aware of what they could buy in shops.
– when shopping, people were not limited to buying 37 ${BLANK} goods.

Retailing
[[b0]]The first department stores were opened.
[[b0]]The displays of goods were more visible:
– inside stores because of better 38 ${BLANK}.
– outside stores, because 39 ${BLANK} were bigger.
[[b0]]40 ${BLANK} that was persuasive became much more common.
[[/box]]`,
        questions: [
          gap(31, "wealth"), gap(32, "technology"), gap(33, "power"),
          gap(34, "textile", ["textile", "textiles"]), gap(35, "machines"),
          gap(36, "newspapers"), gap(37, "local"), gap(38, "lighting"),
          gap(39, "windows"), gap(40, "Advertising", ["Advertising", "advertising"]),
        ],
      },
    ],
  };
}

async function audioFor(test: number): Promise<string[]> {
  const dir = path.join(ROOT, "public", "uploads", "audio", `cambridge-15-general-test-${test}`);
  await mkdir(dir, { recursive: true });
  const urls: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const name = `section-${i}.mp3`;
    const dest = path.join(dir, name);
    try { await stat(dest); } catch { await copyFile(path.join(AUDIO_SOURCE, `ielts15_test${test}_audio${i}.mp3`), dest); }
    urls.push(`/uploads/audio/cambridge-15-general-test-${test}/${name}`);
  }
  return urls;
}

async function uploadPublicFiles(urls: string[]) {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return;
  const client = new S3Client({ region: "auto", endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
  for (const url of urls) {
    const filePath = path.join(ROOT, "public", url.replace(/^\//, ""));
    const info = await stat(filePath);
    const contentType = url.endsWith(".mp3") ? "audio/mpeg" : "image/jpeg";
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: url.replace(/^\//, ""), Body: await readFile(filePath), ContentType: contentType, ContentLength: info.size, CacheControl: "public, max-age=60" }));
    console.log(`uploaded ${url}`);
  }
}

async function main() {
  const selected = (process.env.IMPORT_TESTS ?? "3,4").split(",").map((x) => Number(x.trim())).filter((n) => n === 2 || n === 3 || n === 4);
  if (!selected.length) throw new Error("IMPORT_TESTS must include 2, 3 or 4.");
  const { saveTestDraft } = await import("../src/lib/store/test-store");
  const { persistParsedTest } = await import("../src/lib/import/persist");
  for (const test of selected) {
    const audio = await audioFor(test);
    const drafts = test === 2
      ? [listening2(audio), reading2(), writing2(), speaking2()]
      : test === 3
        ? [listening3(audio)]
        : [listening4(audio)];
    const media = [...audio, ...(test === 2 ? [MAP2] : test === 4 ? [MAP4] : [])];
    await uploadPublicFiles(media);
    for (const raw of drafts) {
      const draft = applyQuestionLayoutVariants(raw);
      const issues = validateQuestionLayouts(draft);
      const errors = issues.filter((x) => x.level === "error");
      if (errors.length) throw new Error(`${draft.slug}: ${JSON.stringify(errors, null, 2)}`);
      await saveTestDraft(draft);
      const result = await persistParsedTest(draft, issues, { status: "PUBLISHED" });
      console.log(`${draft.slug}: ${draft.parts.reduce((n, p) => n + p.questions.length, 0)} questions; id=${result.testId}`);
    }
  }
}

if (!process.env.C15_LIBRARY_ONLY) {
  main().catch((error) => { console.error(error); process.exit(1); });
}
