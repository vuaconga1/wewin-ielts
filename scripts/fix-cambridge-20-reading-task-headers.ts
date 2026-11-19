/**
 * Cambridge 20 Reading imports stored passage-only section.content, so the
 * practice UI could not parse "Questions N–M" group headers / instructions.
 * Append cleaned task chrome (from docs/cambridge_20_split) for Tests 23–26.
 *
 * Dry-run:
 *   npx tsx scripts/fix-cambridge-20-reading-task-headers.ts
 * Apply JSON + DB:
 *   npx tsx scripts/fix-cambridge-20-reading-task-headers.ts --apply
 */
import path from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { config } from "dotenv";
config({ path: path.resolve(".env") });

import { prisma } from "../src/lib/prisma";
import {
  parseReadingQuestionGroups,
  splitReadingPassageAndTasks,
} from "../src/lib/practice/reading-content";

const APPLY = process.argv.includes("--apply");

type PartTasks = Record<0 | 1 | 2, string>;

const TASKS: Record<string, PartTasks> = {
  "test-23-reading": {
    0: `Questions 1-6
Do the following statements agree with the information given in Reading Passage 1?
In boxes 1-6 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

1 There are other parrots that share the kākāpō's inability to fly.
2 Adult kākāpō produce chicks every year.
3 Adult male kākāpō bring food back to nesting females.
4 The Polynesian rat was a greater threat to the kākāpō than Polynesian settlers.
5 Kākāpō were transferred from Rakiura Island to other locations because they were at risk from feral cats.
6 One Recovery Plan initiative that helped increase the kākāpō population size was caring for struggling young birds.

Questions 7-13
Complete the notes below.
Choose ONE WORD AND/OR A NUMBER from the passage for each answer.

New Zealand's kākāpō

A type of parrot:
● diet consists of fern fronds, various parts of a tree and 7 ...............
● nests are created in 8 ............... where eggs are laid.

Arrival of Polynesian settlers
● the 9 ............... of the kākāpō were used to make clothes.

Arrival of European colonisers
● 10 ............... were an animal which they introduced that ate the kākāpō's food sources.

Protecting kākāpō
● Richard Henry, a conservationist, tried to protect the kākāpō.
● a definite sighting of female kākāpō on Rakiura Island was reported in the year 11 ...............
● the Recovery Plan included an increase in 12 ...............
● a current goal of the Recovery Plan is to maintain the involvement of 13 ............... in kākāpō protection.`,

    1: `Questions 14-18
Reading Passage 2 has seven sections, A-G.
Which section contains the following information?
NB You may use any letter more than once.

14 reference to the research problems that arise from there being only a few surviving large elms
15 details of a difference of opinion about the value of reintroducing elms to Britain
16 reference to how Dutch elm disease was brought into Britain
17 a description of the conditions that have enabled a location in Britain to escape Dutch elm disease
18 reference to the stage at which young elms become vulnerable to Dutch elm disease

Questions 19-23
Look at the following statements (Questions 19-23) and the list of people below.
Match each statement with the correct person, A, B or C.
NB You may use any letter more than once.

19 If a tree gets infected with Dutch elm disease, the damage rapidly becomes visible.
20 It may be better to wait and see if the mature elms that have survived continue to flourish.
21 There must be an explanation for the survival of some mature elms.
22 We need to be aware that insects carrying Dutch elm disease are not very far away.
23 You understand the motivation for planting elms that show resistance.

List of People
A Matt Elliot
B Karen Russell
C Peter Bourne

Questions 24-26
Complete the summary below.
Choose ONE WORD ONLY from the passage for each answer.

Uses of a popular tree

For hundreds of years, the only tree that was more popular in Britain than elm was 24 ............... Starting in the Bronze Age, many tools were made from elm and people also used it to make weapons. In the 18th century, it was grown to provide wood for boxes and 25 ............... Due to its strength, elm was often used for mining equipment and the Cutty Sark's 26 ............... was also constructed from elm.`,

    2: `Questions 27-30
Choose the correct letter, A, B, C or D.

27 In the first paragraph, the writer introduces the topic of the text by
28 What point does the writer make about firefighters in the second paragraph?
29 In the third paragraph, the writer outlines the firefighters' study by
30 According to the writer, the evolutionary response to stress

Questions 31-35
Complete each sentence with the correct ending, A-G, below.

A made them feel optimistic.
B took relatively little notice of bad news.
C responded to negative and positive information in the same way.
D were feeling under stress.
E put them in a stressful situation.
F behaved in a similar manner, regardless of the circumstances.
G thought it more likely that they would experience something bad.

31 At times when they were relaxed, the firefighters usually ...............
32 The researchers noted that when the firefighters were stressed, they ...............
33 In the laboratory experiment, the students ...............
34 The researchers' preparation of the students ...............
35 In both experiments, negative information was processed better when the subjects ...............

Questions 36-40
Do the following statements agree with the claims of the writer in Reading Passage 3?
YES if the statement agrees with the claims of the writer
NO if the statement contradicts the claims of the writer
NOT GIVEN if it is impossible to say what the writer thinks about this

36 The tone of the content we post on social media tends to reflect the nature of the posts in our feeds.
37 Phones have a greater impact on our stress levels than other electronic media devices.
38 The more we read about a stressful public event on social media, the less able we are to take effective action.
39 Stress created by social media posts can lead us to take unnecessary precautions.
40 Our tendency to be affected by other people's moods can be used in a positive way.`,
  },

  "test-24-reading": {
    0: `Questions 1-6
Complete the notes below.
Choose ONE WORD AND/OR A NUMBER from the passage for each answer.

Manatees

Appearance
● look similar to dugongs, but with a differently shaped 1 ...............

Movement
● have fewer neck bones than most mammals
● need to use their 2 ............... to help to turn their bodies around in order to look sideways
● sense vibrations in the water by means of 3 ............... on their skin

Feeding
● eat mainly aquatic vegetation, such as 4 ...............
● grasp and pull up plants with their 5 ...............

Breathing
● come to the surface for air every 2-4 minutes when awake and every 15-20 while sleeping
● may regulate the 6 ............... of their bodies by using muscles of diaphragm to store air internally

Questions 7-13
Do the following statements agree with the information given in Reading Passage 1?
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

7 West Indian manatees can be found in a variety of different aquatic habitats.
8 The Florida manatee lives in warmer waters than the Antillean manatee.
9 The African manatee's range is limited to coastal waters between the West African countries of Mauritania and Angola.
10 The extent of the loss of Amazonian manatees in the mid-twentieth century was only revealed many years later.
11 It is predicted that West Indian manatee populations will fall in the coming decades.
12 The risk to manatees from entanglement and plastic consumption increased significantly in the period 2009-2020.
13 There is some legislation in place which aims to reduce the likelihood of boat strikes on manatees in Florida.`,

    1: `Questions 14-16
Reading Passage 2 has six paragraphs, A-F.
Which paragraph contains the following information?
NB You may use any letter more than once.

14 mention of false assumptions about why people procrastinate
15 reference to the realisation that others also procrastinate
16 neurological evidence of a link between procrastination and emotion

Questions 17-22
Complete the summary below.
Choose ONE WORD ONLY from the passage for each answer.

What makes us procrastinate?

Many people think that procrastination is the result of 17 ...............
Others believe it to be the result of an inability to organise time efficiently.

But scientific studies suggest that procrastination is actually due to poor mood management. The tasks we are most likely to put off are those that could damage our self-esteem or cause us to feel 18 ............... when we think about them. Research comparing chronic procrastinators with other people even found differences in the brain regions associated with regulating emotions and identifying 19 ...............

Emotionally loaded and difficult tasks often cause us to procrastinate. Getting ready to take 20 ............... might be a typical example of one such task.

People who are likely to procrastinate tend to be either 21 ............... or those with low self-esteem.

Procrastination is only a short-term measure for managing emotions. It's often followed by a feeling of 22 ............... which worsens our mood and leads to more procrastination.

Questions 23 and 24
Choose TWO letters, A-E.
Which TWO comparisons between employees who often procrastinate and those who do not are mentioned in the text?

Questions 25 and 26
Choose TWO letters, A-E.
Which TWO recommendations for getting out of a cycle of procrastination does the writer give?`,

    2: `Questions 27-32
Do the following statements agree with the claims of the writer in Reading Passage 3?
YES if the statement agrees with the claims of the writer
NO if the statement contradicts the claims of the writer
NOT GIVEN if it is impossible to say what the writer thinks about this

27 When DeJesus first used ABS, he shared decision-making about strikes with it.
28 MLB considered it necessary to amend the size of the strike zone when criticisms were received from players.
29 MLB is keen to justify the money spent on improving the accuracy of ABS's calculations.
30 The hundred-mile-an-hour fastball led to a more exciting style of play.
31 The differing proposals for alterations to the baseball bat led to fierce debate on Sword's team.
32 ABS makes changes to the shape of the strike zone feasible.

Questions 33-37
Complete the summary using the list of phrases, A-H, below.

Calls by the umpire

Even after ABS was developed, MLB still wanted human umpires to shout out decisions as they had in their 33 ............... The umpire's job had, at one time, required a 34 ............... about whether a ball was a strike. A ball is considered a strike when the batter does not hit it and it crosses through a 35 ............... extending approximately from the batter's knee to his chest.

In the past, 36 ............... over strike calls were not uncommon, but today everyone accepts the complete ban on pushing or shoving the umpire. One difference, however, is that during the first game DeJesus used ABS, strike calls were met with 37 ...............

List of phrases
A pitch boundary
B numerous disputes
C team tactics
D subjective assessment
E widespread approval
F former roles
G total silence
H perceived area

Questions 38-40
Choose the correct letter, A, B, C or D.

38 What does the writer suggest about ABS in the fifth paragraph?
39 Morgan Sword says that the introduction of ABS
40 Why does the writer include the views of Noë and Russo?`,
  },

  "test-25-reading": {
    0: `Questions 1-7
Complete the notes below.
Choose ONE WORD ONLY from the passage for each answer.

The history of frozen food

2,000 years ago, South America
● People conserved the nutritional value of 1 ..............., using a method of freezing then drying.

1851, USA
● 2 ............... was kept cool by ice during transportation in specially adapted trains.

1880, Australia
● Two kinds of 3 ............... were the first frozen food shipped to England.

1917 onwards, USA
● Clarence Birdseye introduced innovations including:
- quick-freezing methods, so that 4 ............... did not spoil the food.
- packaging products with 5 ..............., so the product was visible.

Early 1940s, USA
● Frozen food became popular because of a shortage of 6 ...............

1950s, USA
● A large number of homes now had a 7 ...............

Questions 8-13
Do the following statements agree with the information given in Reading Passage 1?
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

8 The ice transportation business made some Boston ship owners very wealthy in the early 1800s.
9 A disadvantage of the freezing process invented in Australia was that it affected the taste of food.
10 Clarence Birdseye travelled to Labrador in order to learn how the Inuit people froze fish.
11 Swanson Foods invested a great deal of money in the promotion of the TV Dinner.
12 Swanson Foods developed a new style of container for the launch of the TV Dinner.
13 The US frozen food industry is currently the largest in the world.`,

    1: `Questions 14-19
Reading Passage 2 has six sections, A-F.
Choose the correct heading for each section from the list of headings below.
Write the correct number, i-vii, in boxes 14-19 on your answer sheet.

List of Headings
i Tried and tested solutions
ii Cooperation beneath the waves
iii Working to lessen the problems
iv Disagreement about the accuracy of a certain phrase
v Two clear educational goals
vi Promoting hope
vii A warning of further trouble ahead

14 Section A
15 Section B
16 Section C
17 Section D
18 Section E
19 Section F

Questions 20 and 21
Choose TWO letters, A-E.
Which TWO of these causes of damage to coral reefs are mentioned by the writer of the text?

Questions 22 and 23
Choose TWO letters, A-E.
Which TWO of the following statements are true of the researchers at London Zoo?

Questions 24-26
Complete the sentences below.
Choose ONE WORD ONLY from the passage for each answer.

24 Corals have a number of 24 ............... which they use to collect their food.
25 Algae gain 25 ............... from being inside the coral.
26 Increases in the warmth of the sea water can remove the 26 ............... from coral.`,

    2: `Questions 27-33
Look at the following statements (Questions 27-33) and the list of experts below.
Match each statement with the correct expert, A, B or C.
NB You may use any letter more than once.

27 For our own safety, humans will need to restrict the abilities of robots.
28 The risk of robots harming us is less serious than humans believe it to be.
29 It will take many decades for robot intelligence to be as imaginative as human intelligence.
30 We may have to start considering whether we are treating robots fairly.
31 Robots are probably of more help to us on Earth than in space.
32 The ideas in high-quality science fiction may prove to be just as accurate as those found in the work of mediocre scientists.
33 There are those who look forward to robots developing greater intelligence.

List of Experts
A Martin Rees
B Daniel Wolpert
C Kathleen Richardson

Questions 34-36
Complete each sentence with the correct ending, A-D, below.

A robots to explore outer space.
B advances made in machine intelligence so far.
C changes made to other planets for our own benefit.
D the harm already done by artificial intelligence

34 Richardson and Rees express similar views regarding the ethical aspect of ...............
35 Rees and Wolpert share an opinion about the extent of ...............
36 Wolpert disagrees with Richardson on the question of ...............

Questions 37-40
Choose the correct letter, A, B, C or D.

37 What point does Richardson make about fear of machines?
38 What potential advance does Rees see as a cause for concern?
39 What does Wolpert emphasise in his response to the question about science fiction?
40 What is the writer's purpose in the final paragraph?`,
  },

  "test-26-reading": {
    0: `Questions 1–7
Complete the notes below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 1–7 on your answer sheet.

The life and work of Georgia O'Keeffe

● studied art, then worked as a 1 ............... in various places in the USA
● created drawings using 2 ............... which were exhibited in New York City
● moved to New York and became famous for her paintings of the city's 3 ...............
● produced a series of innovative close-up paintings of 4 ...............
● collected sun-bleached 5 ............... from the desert
● was inspired by the stark New Mexico 6 ...............
● captured the dramatic forms of desert 7 ............... and mountains

Questions 8–13
Do the following statements agree with the information given in Reading Passage 1?
In boxes 8–13 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

8 Georgia O'Keeffe's style was greatly influenced by the changing fashions in art over the seven decades of her career.
9 When O'Keeffe finished high school, she had already made her mind up about the profession she wanted to follow.
10 Stieglitz asked O'Keeffe's permission before displaying her charcoal drawings in his gallery.
11 The scale of O'Keeffe's flower paintings was intended to make people look at nature with greater attention.
12 O'Keeffe preferred the weather in New Mexico to the weather in New York.
13 O'Keeffe's late paintings of clouds were painted from photographs taken on plane flights.`,

    1: `Questions 14-17
Reading Passage 2 has six paragraphs, A-F.
Which paragraph contains the following information?
Write the correct letter, A-F, in boxes 14-17 on your answer sheet.

14 how a type of plant functions as a natural protection for coastlines
15 a prediction about how long it could take to stop noticing the effects of climate change
16 a reference to the fact that a solution is particularly cost-effective
17 a mention of a technology used to locate areas most in need of intervention

Questions 18-22
Complete the sentences below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 18-22 on your answer sheet.

18 The stormwater-management programme in Miami Beach has involved the installation of efficient 18 ...............
19 The construction of 19 ............... was the first stage of a project to ensure the success of mangroves in Indonesia.
20 As a response to rising floodwaters in the Mekong Delta, a not-for-profit organisation has been building houses that can 20 ...............
21 Rising sea levels in Bangladesh have made it necessary to introduce various 21 ............... that are suitable for areas of high salt content.
22 A project in LA has increased the number of 22 ............... on the city's streets.

Questions 23-26
Look at the following statements (Questions 23-26) and the list of people below.
Match each statement with the correct person, A-E.
Write the correct letter, A-E, in boxes 23-26 on your answer sheet.

23 It is essential to adopt strategies which involve and help residents of the region.
24 Interventions which reduce heat are absolutely vital for our survival in this location.
25 More work will need to be done in future decades to deal with the impact of rising water levels.
26 The number of locations requiring action to adapt to flooding has grown in recent years.

List of People
A Yanira Pineda
B Susanna Tol
C Elizabeth English
D Jeff Goodell
E Greg Spotts`,

    2: `Questions 27-31
Reading Passage 3 has seven paragraphs, A-G.
Which paragraph contains the following information?
Write the correct letter, A-G, in boxes 27-31 on your answer sheet.
NB You may use any letter more than once.

27 an example of how one predator has been protected by the introduction of livestock guard dogs
28 an optimistic suggestion about the possible positive developments in the use of livestock guard dogs
29 a description of how the methods used by livestock guard dogs help to keep predators away
30 claims by different academics that the use of livestock guard dogs is a successful way of protecting farmers' herds
31 a reference to how livestock guard dogs gain their skills

Questions 32-36
Look at the following statements (Questions 32-36) and the list of people below.
Match each statement with the correct person, A-E.
Write the correct letter, A-E, in boxes 32-36 on your answer sheet.
NB You may use any letter more than once.

32 The use of guard dogs may save the lives of both livestock and wild animals.
33 Claims of a change in behaviour from those using livestock guard dogs may not be totally accurate.
34 There may be negative results if the use of livestock guard dogs is not sufficiently widespread.
35 Livestock guard dogs are the best way of protecting farm animals, as long as the dogs are appropriately handled.
36 Teaching a livestock guard dog how to do its work needs a different focus from teaching a house guard dog.

List of People
A Dan Macon
B Silvia Ribeiro
C Linda van Bommel
D Julie Young
E Bethany Smith

Questions 37-40
Complete the summary below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 37-40 on your answer sheet.

Unintended ecological effects of using guard dogs

In Namibia, livestock guard dogs have been used to protect domestic animals from attacks by cheetahs.

This has led to a rise in the deaths of other predators, particularly 37 ............... In addition, it has been suggested that the dogs could have 38 ..............., which may affect other species, and that they may reduce the amount of 39 ............... available to certain wild animals.

On the other hand, these dogs may help birds by protecting their nests. These might otherwise be threatened by predators such as 40 ...............`,
  },
};

function passageOnly(content: string): string {
  const { passage } = splitReadingPassageAndTasks(content);
  return passage.trim();
}

function withTasks(content: string, tasks: string): string {
  return `${passageOnly(content)}\n\n${tasks.trim()}`;
}

function verify(
  slug: string,
  parts: Array<{
    title: string;
    order: number;
    content: string;
    questions: Array<{ number: number; type: string; content: unknown }>;
  }>,
) {
  for (const part of parts) {
    const { tasks } = splitReadingPassageAndTasks(part.content);
    const groups = parseReadingQuestionGroups(
      tasks,
      part.questions.map((q) => ({
        number: q.number,
        type: q.type,
        content: (q.content ?? {}) as {
          stem?: string;
          options?: { label: string; text: string }[];
        },
      })),
    );
    const weak = groups.filter((g) => !g.header || g.instructions.length === 0);
    const covered = new Set<number>();
    for (const g of groups) {
      for (let n = g.start; n <= g.end; n += 1) covered.add(n);
    }
    const ungrouped = part.questions
      .map((q) => q.number)
      .filter((n) => !covered.has(n));
    console.log(
      `  ${part.title}: groups=${groups.length} headers=[${groups
        .map((g) => g.header)
        .join(" | ")}] ungrouped=${ungrouped.join(",") || "-"}`,
    );
    if (weak.length || ungrouped.length) {
      throw new Error(
        `${slug} ${part.title}: weak=${weak.length} ungrouped=${ungrouped.join(",")}`,
      );
    }
  }
}

async function main() {
  for (const [slug, partTasks] of Object.entries(TASKS)) {
    const file = path.join("data/tests", `${slug}.json`);
    const data = JSON.parse(readFileSync(file, "utf8")) as {
      parts: Array<{
        title: string;
        order: number;
        content: string;
        questions: Array<{ number: number; type: string; content: unknown }>;
      }>;
      savedAt?: string;
    };

    let changed = false;
    for (const part of data.parts) {
      const order = part.order as 0 | 1 | 2;
      const tasks = partTasks[order];
      if (!tasks) continue;
      const next = withTasks(part.content, tasks);
      if (next !== part.content) {
        part.content = next;
        changed = true;
      }
    }
    if (changed) {
      data.savedAt = new Date().toISOString();
      if (APPLY) {
        writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
      }
      console.log(`${slug}: ${APPLY ? "wrote JSON" : "would write JSON"}`);
    } else {
      console.log(`${slug}: JSON already has task blocks`);
    }

    verify(slug, data.parts);

    if (APPLY) {
      const test = await prisma.test.findFirst({
        where: { slug },
        select: {
          id: true,
          sections: { select: { id: true, order: true, content: true } },
        },
      });
      if (!test) {
        console.warn(`  DB: ${slug} not found, skip`);
        continue;
      }
      for (const section of test.sections) {
        const order = section.order as 0 | 1 | 2;
        const tasks = partTasks[order];
        if (!tasks) continue;
        const part = data.parts.find((p) => p.order === section.order);
        if (!part) continue;
        if (section.content === part.content) continue;
        await prisma.testSection.update({
          where: { id: section.id },
          data: { content: part.content },
        });
        console.log(`  DB updated section order=${section.order}`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
