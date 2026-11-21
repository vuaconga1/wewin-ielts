/**
 * Rebuild Test 16.C21.02 Reading questions and passages from Cambridge 21 OCR.
 * Prior import invented several stems while keeping answer-key letters/words.
 *
 * Ground truth:
 * - docs/cambridge_21_split/pdf_extract/test2_reading.txt
 * - docs/cambridge_21_split/pdf_extract/answer_keys.txt (TEST 2 READING)
 * Table rows for Questions 1–5 were column-scrambled in the text extract;
 * wording follows the page 41 render of that same extract.
 *
 * Usage: npx tsx scripts/fix-c21-test2-reading-questions.ts
 * Does not write to the database.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const FILE = path.resolve("data/tests/test-16-reading.json");

const TFNG = [
  { label: "TRUE", text: "TRUE" },
  { label: "FALSE", text: "FALSE" },
  { label: "NOT GIVEN", text: "NOT GIVEN" },
];

const YNNG = [
  { label: "YES", text: "YES" },
  { label: "NO", text: "NO" },
  { label: "NOT GIVEN", text: "NOT GIVEN" },
];

const PARAS_AG = ["A", "B", "C", "D", "E", "F", "G"].map((label) => ({
  label,
  text: `Paragraph ${label}`,
}));

const AI_WORDS = [
  { label: "A", text: "reliability" },
  { label: "B", text: "funding" },
  { label: "C", text: "skills" },
  { label: "D", text: "prejudices" },
  { label: "E", text: "computers" },
  { label: "F", text: "equality" },
  { label: "G", text: "framework" },
  { label: "H", text: "confidentiality" },
  { label: "I", text: "approval" },
];

const GOLD_OPTIONS = [
  { label: "A", text: "Not everyone in Mapungubwe used gold as a form of payment." },
  { label: "B", text: "Items of gold were placed close to where Mapungubwe kings were buried." },
  { label: "C", text: "The most valuable item discovered in Mapungubwe was a sceptre made of gold." },
  { label: "D", text: "The way gold was decorated in Mapungubwe was also practised in another kingdom." },
  { label: "E", text: "Working with gold was a respected occupation in the Mapungubwe community." },
];

type Option = { label: string; text: string };

function gap(
  number: number,
  order: number,
  stem: string,
  correctAnswer: string,
  acceptableAnswers?: string[],
) {
  return {
    number,
    order,
    type: "GAP_FILL" as const,
    content: { stem, blank: true },
    correctAnswer,
    ...(acceptableAnswers ? { acceptableAnswers } : {}),
  };
}

function tfng(number: number, order: number, stem: string, correctAnswer: string) {
  return {
    number,
    order,
    type: "TRUE_FALSE_NG" as const,
    content: { stem, options: TFNG },
    correctAnswer,
  };
}

function ynng(number: number, order: number, stem: string, correctAnswer: string) {
  return {
    number,
    order,
    type: "TRUE_FALSE_NG" as const,
    content: { stem, options: YNNG },
    correctAnswer,
  };
}

function matching(
  number: number,
  order: number,
  stem: string,
  options: Option[],
  correctAnswer: string,
) {
  return {
    number,
    order,
    type: "MATCHING" as const,
    content: { stem, options },
    correctAnswer,
  };
}

function mcq(
  number: number,
  order: number,
  stem: string,
  options: Option[],
  correctAnswer: string,
) {
  return {
    number,
    order,
    type: "MULTIPLE_CHOICE" as const,
    content: { stem, options },
    correctAnswer,
  };
}

function chooseTwo(
  start: number,
  order: number,
  stem: string,
  options: Option[],
  answers: [string, string],
) {
  return [
    {
      number: start,
      order,
      type: "MULTIPLE_CHOICE" as const,
      content: {
        stem,
        options,
        selectCount: 2,
        covers: [start, start + 1],
      },
      correctAnswer: answers[0],
      acceptableAnswers: [...answers],
    },
    {
      number: start + 1,
      order: order + 1,
      type: "MULTIPLE_CHOICE" as const,
      content: { stem: "", pairedFrom: start },
      correctAnswer: answers[1],
      acceptableAnswers: [...answers],
    },
  ];
}

const PASSAGE_1 = `You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.

Do animals dream?

Studies using electrodes attached to the heads of sleepers have shown that when we sleep, we do so in two ways that alternate throughout the night. The first is rapid eye movement (REM) or active sleep. During this stage our eyes move, even though our eyelids are closed. Our muscles also twitch slightly, though they are largely paralysed so we don't hurt ourselves. In contrast, we also engage in non-REM sleep, during which we barely move at all. Most dream states, and certainly those with the most vivid dreams, happen during REM sleep.

There's some evidence that other mammals may also dream. For example, researchers compared the brain patterns of rats running through a maze when awake with their brain patterns during REM sleep. They found the patterns were very similar and concluded that the sleeping rats were dreaming about going through the maze.

But finding evidence of dreaming in non-mammals has proved more difficult. Their brains are very different from those of humans, and it can often be difficult to record their activity while they are sleeping. Recently, however, researchers succeeded in recording brain activity in sleeping pigeons. As in mammals, the recordings revealed both REM and non-REM sleep. Intriguingly, REM sleep activity was high in brain regions involved in processing visual information, especially images related to physical activities such as flying, which suggests that this may possibly be what the pigeons were dreaming about.

That said, dreaming and REM sleep are unlikely to be universal in the animal kingdom. For example, sponges don't have brains, so they lack the machinery for dreaming. There are also some animals with unusual sleep patterns. These include whales and dolphins, which do not shut down their entire brain when they sleep, but only half of it, keeping the rest awake. They also show no sign of REM sleep, suggesting that they may only experience non-REM dreams, which are less vivid. This is surprising because we tend to think of whales and dolphins as having complex inner lives. It's thought that they don't experience REM sleep because during REM sleep animals are more vulnerable to extremes of temperature.

Nevertheless, in many cases REM sleep does seem to have benefits. Growing evidence from birds and mammals suggests that REM sleep and dreaming are important for forming memories and learning. It is believed that when events are replayed in dreams, this helps to integrate memories into longer-term storage. As soon as animals evolved moderately complex lifestyles, they would have needed to dream in order to manage these lifestyles.

However, we still don't understand how this outward behaviour relates to internal experience. It seems impossible to know what it is like to be a rat or a pigeon, let alone imagine their dreamscapes. We are quick to interpret the twitching limbs and quiet barks of sleeping dogs, but the truth is that we don't know if there is an internal experience of chasing rabbits that comes along with that.

Another non-human dreamer offers insight here. In 2019, while making a documentary, David Scheel of Alaska Pacific University in the USA housed an octopus named Heidi in a tank in his living room. At one point, in the middle of the night, Heidi seemed to dream: her limbs and head moved, and her skin rapidly changed colour, as though she was pursuing a crab.

Similarly, a report recently emerged of a sleeping octopus apparently having a nightmare. Costello, as the octopus was called, thrashed around, extended his mantle as if trying to make himself look bigger, and squirted ink as though he were being attacked by a predator. The nightmare study is intriguing, says Scheel, but is only based on one animal. He argues that as well as outward behaviour, brain imaging is needed to show that the octopuses are replaying sequences of activities from their waking lives in dreams.

The trouble is that we will never be able to experience any animal's dreams. That goes for other humans' dreams too. But we can try to imagine what these dreamscapes are like by meeting animals on their own terms. For example, vision is the dominant sense for many humans, and so our dreams are heavily visual too. Dogs primarily navigate the world using smell while spiders rely much more on vibrations.

It is likely that dreaming has served multiple purposes since the first complex animals evolved. And if this is the case, it is possible that better understanding of these purposes might shed light on the true purpose of our own dreams.

Questions 1–5
Complete the table below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 1–5 on your answer sheet.

Research into sleep and dreaming

Humans
Research findings
• humans experience REM sleep and non-REM sleep
• in REM sleep, the eyes and muscles move

1 ................
Research findings
• similar brain patterns were observed when active and sleeping
Comment
indicative of dreaming

Pigeons
Research findings
• when sleeping, pigeons displayed activity in parts of the brain that deal with 2 ................ input
Comment
may have been dreaming of flying

Whales and dolphins
Research findings
• still have 3 ................ their brain awake when they sleep
• don't experience REM sleep, as this could affect their sensitivity to 4 ................
Comment
their dreams are probably not very 5 ................

Questions 6–13
Do the following statements agree with the information given in Reading Passage 1?
In boxes 6–13 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

6 Dreaming about past experiences helps us to create lasting memories of them.
7 It is now possible to tell what type of dream a dog is having.
8 David Scheel's documentary was influential on other research into the sleeping patterns of octopuses.
9 While it was asleep, the octopus called Costello reacted as if it was hunting.
10 Scheel believes more research into octopuses' dreams should be carried out.
11 We may soon be able to share the dreams of other human beings.
12 Hearing may be an important part of the dreams of some animals.
13 Interest in the reasons why humans dream has increased greatly in recent times.`;

const PASSAGE_2 = `You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.

Mapungubwe
Located in southern Africa just below the Limpopo River, the kingdom of Mapungubwe, flourished between the 11th and 13th century CE

A Mapungubwe, which was one of the first states in southern Africa, was formed by Bantu-speaking peoples who were farmers. The area controlled by the rulers of Mapungubwe had at its heart a large sandstone plateau, which was easily defended due to its inaccessibility. As with other kingdoms in the region of southern Africa, cattle herding and other types of farming brought plenty of food and a surplus that could be traded for needed goods. Archaeology has revealed extensive layers of bones and manure, which indicate that from the 9th century CE there were large cattle herds, the traditional source of political power in southern African communities. The archaeological record for the 10th century shows a marked increase in the number of domesticated cattle in the area as well as cotton cultivation and weaving, as indicated by abundant finds of spindle whorls.

B The total population of Mapungubwe at its peak in the mid-13th century was around 5,000 people. The chief or king of Mapungubwe was likely the wealthiest individual in the society, and would have owned more cattle and precious materials than anyone else. The king and his advisers dwelt in a stone enclosure composed of stone walls and housing built on the highest level of the community's territory, a natural sandstone hill which is some 30 metres high and 100 metres in length. Occupation on the hill dates from the 11th century and the entire complex was surrounded by a wooden palisade*, as indicated by postholes made in the rock. The rest of the community lived in mud and thatch housing spread out below the hill, although there is one stone structure here. This settlement, known as Babandyanalo, covers around 5 hectares (12.3 acres) and predates the hilltop structures.

* palisade: typically a row of closely placed, high vertical wooden or iron posts used as a means of defence

C The kings of Mapungubwe were buried at the top of the hill site in a demarcated area away from the dwellings, while other members of the community were buried at the surrounding valley level. A wooden staircase connected the two levels, the sockets for the steps being clearly visible in the sandstone cliff face. There were some grander residences dotted around the outskirts of Babandyanalo, and these probably belonged to male relatives of the king. There are many other smaller but still impressive sites across the Mapungubwe plateau, which are located anywhere from 15 to 100 kilometres from the major hill site. Containing stone residences and walls, they likely belonged to local chiefs who acted as servants to the king.

D The Mapungubwe plateau has a very high number of carnivore animal remains and ivory splinters, suggesting that the skins of these large animals and ivory elephant tusks were accumulated, probably for trade with coastal areas reached by the Limpopo River. The presence of glass beads, almost certainly from India, indicate there was trade of some sort with other states on the coast who, in turn, traded with merchants travelling from India by sea. Mapungubwe also benefitted from locally-sourced copper and the gold trade as it passed from the kingdom of Great Zimbabwe (12-15th century), situated to the north of Mapungubwe, to the coastal city of Kosala. It is likely that trade links led to a strengthening of political authority in order to control and even monopolise these lucrative interregional connections.

E Archaeological discoveries reveal that pottery was produced on a scale large enough to suggest the presence of professional potters, and is another indicator of the prosperity of Mapungubwe society. Archaeological finds include spherical vessels with short necks, beakers, and bowls, many of which have decorative stamps. There are also ceramic discs, and whistles. In addition, cattle, sheep, and goat figurines, and small figures of highly stylised humans with elongated bodies and short limbs have been found. The figures may have been used in ceremonies as offerings to ancestors, but their precise function is not known. Other discoveries include small jewellery items made from locally sourced copper.

F Beautifully decorated artefacts made of gold have also been found at Mapungubwe. A type of decoration, found nowhere else except Great Zimbabwe, involved the crafting of gold into small rectangular sheets and carving geometrical patterns into it. These sheets were then used to cover wooden objects (which have not survived) using small tacks, also made of gold. One such object that has been discovered may have been a sceptre, while additional evidence of local gold-working is a rhinoceros figurine made from small hammered sheets, and thousands of small gold beads. These objects were all found at the royal burial site and date to c. 1150. They are the first known indicators that gold had an intrinsic value of its own (as opposed to that of a currency) in southern Africa.

G The kingdom of Mapungubwe was already in decline by the late 13th century, probably because overpopulation placed too much stress on local resources, a situation that may have been brought to a crisis point by a series of droughts. Trade routes may also have shifted northwards. Certainly, the areas that now prospered were to the north, such as Great Zimbabwe.

Questions 14–19
Reading Passage 2 has seven paragraphs, A–G.
Which paragraph contains the following information?
Write the correct letter, A–G, in boxes 14–19 on your answer sheet.

14 a mention of the uncertainty regarding the purpose of certain objects
15 the likelihood that a climatic factor increased the problems Mapungubwe faced
16 a mention of the location where members of the king's family are thought to have lived
17 a reference to people who brought goods by ship
18 an estimate of the size to which the Mapungubwe community grew
19 a mention of agricultural produce being exchanged for other items

Questions 20 and 21
Choose TWO letters, A–E.
Write the correct letters in boxes 20 and 21 on your answer sheet.

The archaeological record reveals information about gold and the kingdom of Mapungubwe. Which TWO pieces of information are mentioned by the writer?
A Not everyone in Mapungubwe used gold as a form of payment.
B Items of gold were placed close to where Mapungubwe kings were buried.
C The most valuable item discovered in Mapungubwe was a sceptre made of gold.
D The way gold was decorated in Mapungubwe was also practised in another kingdom.
E Working with gold was a respected occupation in the Mapungubwe community.

Questions 22–26
Complete the summary below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 22–26 on your answer sheet.

Archaeological discoveries
The Mapungubwe community's 22 ................ is indicated by the amount of professionally made pottery discovered at the site. Many of these objects, such as beakers and bowls, are highly decorated and have been marked with stamps. Other finds include round ceramic objects, 23 ................ and figures of various animals, as well as models of people with stretched 24 ................. It is possible that these had a role in ceremonies to honour 25 ................. In addition, pieces of 26 ................ made from a local metal have been found at the site.`;

const PASSAGE_3 = `You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.

Artificial Intelligence

In many countries in the West, hysteria about the future of artificial intelligence (AI) is everywhere. There seems to be no shortage of sensationalist news about how AI could cure diseases, accelerate human innovation and improve human creativity. Just looking at the media headlines, you might think that we are already living in a future where AI has infiltrated every aspect of society.

While it is undeniable that AI has opened up a wealth of promising opportunities, it has also led to the emergence of a mindset that can be best described as 'AI solutionism'. This is the philosophy that, given enough data, machine learning algorithms can solve all of humanity's problems. But, in fact, instead of supporting AI progress, this mindset actually jeopardises the value of machine intelligence by disregarding important AI safety principles and setting unrealistic expectations about what AI can really do for humanity.

In only a few years, AI solutionism has made its way from the technology evangelists' mouths in Silicon Valley in California to the minds of government officials and policymakers around the world. The pendulum has swung from the dystopian notion that AI will destroy humanity to the utopian belief that our algorithmic saviour is here.

We are now seeing governments pledge support to national AI initiatives and compete in a technological race to dominate the burgeoning machine-learning sector. While many politicians proclaim the transformative effects of the coming 'AI revolution', they fail to realise the complexity around deploying advanced machine learning systems in the real world.

One of the most promising varieties of AI technologies are neural networks. This form of machine learning is loosely modelled on the neuronal structure of the human brain, but on a much smaller scale. But what many politicians do not understand is that simply adding a neural network to a problem will not automatically mean that you'll find a solution. Similarly, adding a neural network to a system of government does not mean it will be instantaneously more inclusive or fair.

AI systems need a lot of data to function, but the public sector typically does not have the appropriate data infrastructure to support advanced machine learning. Most of the data remains stored in offline archives. The few digitised sources of data that exist tend to be buried in bureaucracy. More often than not, data is spread across different government departments that each require special permissions to be accessed. Above all, the public sector typically lacks the human talent with the right technological capabilities to fully reap the benefits of machine intelligence.

For these reasons, the sensationalism over AI has attracted many critics. Stuart Russell, a professor of computer science at the University of California, Berkeley, has long advocated a more sensible and realistic approach that focuses on simple everyday applications of AI instead of the hypothetical takeover by super-intelligent robots. Similarly, Rodney Brooks, professor of robotics at Massachusetts Institute of Technology, writes that 'almost all innovations in robotics and AI take far, far, longer to be really widely deployed than people in the field and outside the field imagine'.

One of the many difficulties in deploying machine learning systems is that AI is extremely susceptible to adversarial attacks. This means that a malicious AI can target another AI to make it behave in a certain way, such as forcing it to make wrong predictions. Many researchers have warned against the rolling out of AI without appropriate security standards and defence mechanisms. Still, AI security remains an often overlooked topic when machine learning systems are installed.

If we are to reap the benefits and minimise the potential harms of AI, we must start thinking about how machine learning can be meaningfully applied to specific areas of government, business and society. This means we need to have a discussion about AI ethics and the distrust that many people have towards machine learning.

Most importantly, we need to be aware of the limitations of AI and where people still need to take the lead. Instead of painting an unrealistic picture of the power of AI, it is important to take a step back and separate the actual technological capabilities of AI from fantasy.

The medical profession has also recognised the drawbacks to AI. The IBM Watson for Oncology programme was a piece of AI that was meant to help doctors treat cancer. Even though it was developed to deliver the best recommendations, human experts found it hard to trust the machine. As a result, the AI programme was abandoned in most hospitals where it was trialled.

Similar difficulties arose in the legal domain when algorithms were used in courts in the US to sentence criminals. An algorithm calculated risk assessment scores and advised judges on the sentencing. The system was found to amplify structural racial discrimination and was later abandoned.

There are some crucial lessons here for everyone aiming to boost investments in national AI programmes. These examples demonstrate that there is no AI solution for everything. Using AI simply for the sake of AI may not always be productive or useful, and not every issue is best addressed by applying machine intelligence to it. All solutions come with a cost and not everything that can be automated should be.

Questions 27–29
Choose the correct letter, A, B, C or D.
Write the correct letter in boxes 27–29 on your answer sheet.

27 What is the writer doing in the first paragraph?
A predicting the future impact of AI
B describing a public perception of AI
C outlining some possible benefits of AI
D highlighting the breadth of the influence of AI

28 When discussing AI solutionism in the second paragraph, the writer
A points out a risk involved.
B specifies its probable origins.
C mentions its chief supporters.
D weighs up some pros and cons.

29 In the fourth paragraph, the writer suggests that many politicians may
A have failed to appreciate the true potential of AI initiatives.
B have misunderstood the function of the machine-learning sector.
C be unaware of the challenges of implementing national AI initiatives.
D be too keen to enter the race to dominate the machine-learning sector.

Questions 30–35
Complete the summary using the list of words, A–I, below.
Write the correct letter, A–I, in boxes 30–35 on your answer sheet.

AI in government, medicine and the law
Neural networks are a promising area of AI technology for governments. However, many politicians overestimate their capabilities, believing that the mere addition of a neural network will produce solutions and promote 30 .................
Most public sector organisations have not set up the necessary 31 ................ to manage the huge amount of data required to enable AI to function. Complex bureaucracy is another issue, as each person involved needs 32 ................ to access the relevant data, which is often spread across different departments. But the main problem is that few public sector employees have the 33 ................ to take full advantage of machine intelligence.
The medical profession experimented with an AI programme, but their experts had little faith in its 34 ................, and the programme was abandoned. US courts also abandoned the use of algorithms when it was found that these reflected and magnified the existing 35 ................ within the legal profession.

A reliability
B funding
C skills
D prejudices
E computers
F equality
G framework
H confidentiality
I approval

Questions 36–39
Do the following statements agree with the claims of the writer in Reading Passage 3?
In boxes 36–39 on your answer sheet, write
YES if the statement agrees with the claims of the writer
NO if the statement contradicts the claims of the writer
NOT GIVEN if it is impossible to say what the writer thinks about this

36 Stuart Russell's proposals regarding the use of AI are impractical.
37 Rodney Brooks' view has attracted unfair criticism from supporters of AI.
38 Nowadays, the need to protect AI systems is always taken into account when they are set up.
39 In order to benefit from AI and minimise the harms, we have to explore people's concerns about its use.

Question 40
Choose the correct letter, A, B, C or D.
Write the correct letter in box 40 on your answer sheet.

40 What would be a suitable subtitle for Reading Passage 3?
A How to make the most of what AI has to offer
B Why AI may not be the answer to our problems
C Why governments should not invest in AI systems
D How AI could improve the efficiency of the public sector`;

/** Cambridge TEST 2 READING key. Q20–21 either order. Q26 either spelling. */
const EXPECTED = [
  "rats",
  "visual",
  "half",
  "temperature",
  "vivid",
  "TRUE",
  "FALSE",
  "NOT GIVEN",
  "FALSE",
  "TRUE",
  "FALSE",
  "NOT GIVEN",
  "NOT GIVEN",
  "E",
  "G",
  "C",
  "D",
  "B",
  "A",
  "B",
  "D",
  "prosperity",
  "whistles",
  "bodies",
  "ancestors",
  "jewellery",
  "B",
  "A",
  "C",
  "F",
  "G",
  "I",
  "C",
  "A",
  "D",
  "NO",
  "NOT GIVEN",
  "NO",
  "YES",
  "B",
];

function main() {
  const draft = JSON.parse(readFileSync(FILE, "utf8")) as {
    parts: Array<{
      title: string;
      order: number;
      content: string;
      meta: Record<string, unknown>;
      questions: unknown[];
    }>;
    savedAt?: string;
    [key: string]: unknown;
  };

  if (draft.parts.length < 3) {
    throw new Error(`Expected 3 reading parts, found ${draft.parts.length}`);
  }

  draft.parts[0] = {
    ...draft.parts[0],
    title: "Passage 1",
    order: 0,
    content: PASSAGE_1,
    meta: draft.parts[0]?.meta ?? {},
    questions: [
      gap(1, 0, "________ — similar brain patterns were observed when active and sleeping", "rats"),
      gap(2, 1, "when sleeping, pigeons displayed activity in parts of the brain that deal with ________ input", "visual"),
      gap(3, 2, "still have ________ their brain awake when they sleep", "half"),
      gap(4, 3, "don't experience REM sleep, as this could affect their sensitivity to ________", "temperature"),
      gap(5, 4, "their dreams are probably not very ________", "vivid"),
      tfng(6, 5, "Dreaming about past experiences helps us to create lasting memories of them.", "TRUE"),
      tfng(7, 6, "It is now possible to tell what type of dream a dog is having.", "FALSE"),
      tfng(8, 7, "David Scheel's documentary was influential on other research into the sleeping patterns of octopuses.", "NOT GIVEN"),
      tfng(9, 8, "While it was asleep, the octopus called Costello reacted as if it was hunting.", "FALSE"),
      tfng(10, 9, "Scheel believes more research into octopuses' dreams should be carried out.", "TRUE"),
      tfng(11, 10, "We may soon be able to share the dreams of other human beings.", "FALSE"),
      tfng(12, 11, "Hearing may be an important part of the dreams of some animals.", "NOT GIVEN"),
      tfng(13, 12, "Interest in the reasons why humans dream has increased greatly in recent times.", "NOT GIVEN"),
    ],
  };

  draft.parts[1] = {
    ...draft.parts[1],
    title: "Passage 2",
    order: 1,
    content: PASSAGE_2,
    meta: draft.parts[1]?.meta ?? {},
    questions: [
      matching(14, 0, "a mention of the uncertainty regarding the purpose of certain objects", PARAS_AG, "E"),
      matching(15, 1, "the likelihood that a climatic factor increased the problems Mapungubwe faced", PARAS_AG, "G"),
      matching(16, 2, "a mention of the location where members of the king's family are thought to have lived", PARAS_AG, "C"),
      matching(17, 3, "a reference to people who brought goods by ship", PARAS_AG, "D"),
      matching(18, 4, "an estimate of the size to which the Mapungubwe community grew", PARAS_AG, "B"),
      matching(19, 5, "a mention of agricultural produce being exchanged for other items", PARAS_AG, "A"),
      ...chooseTwo(
        20,
        6,
        "The archaeological record reveals information about gold and the kingdom of Mapungubwe. Which TWO pieces of information are mentioned by the writer?",
        GOLD_OPTIONS,
        ["B", "D"],
      ),
      gap(22, 8, "The Mapungubwe community's ________ is indicated by the amount of professionally made pottery discovered at the site", "prosperity"),
      gap(23, 9, "Other finds include round ceramic objects, ________ and figures of various animals", "whistles"),
      gap(24, 10, "models of people with stretched ________", "bodies"),
      gap(25, 11, "these had a role in ceremonies to honour ________", "ancestors"),
      gap(26, 12, "pieces of ________ made from a local metal have been found at the site", "jewellery", ["jewellery", "jewelry"]),
    ],
  };

  draft.parts[2] = {
    ...draft.parts[2],
    title: "Passage 3",
    order: 2,
    content: PASSAGE_3,
    meta: draft.parts[2]?.meta ?? {},
    questions: [
      mcq(
        27,
        0,
        "What is the writer doing in the first paragraph?",
        [
          { label: "A", text: "predicting the future impact of AI" },
          { label: "B", text: "describing a public perception of AI" },
          { label: "C", text: "outlining some possible benefits of AI" },
          { label: "D", text: "highlighting the breadth of the influence of AI" },
        ],
        "B",
      ),
      mcq(
        28,
        1,
        "When discussing AI solutionism in the second paragraph, the writer",
        [
          { label: "A", text: "points out a risk involved." },
          { label: "B", text: "specifies its probable origins." },
          { label: "C", text: "mentions its chief supporters." },
          { label: "D", text: "weighs up some pros and cons." },
        ],
        "A",
      ),
      mcq(
        29,
        2,
        "In the fourth paragraph, the writer suggests that many politicians may",
        [
          { label: "A", text: "have failed to appreciate the true potential of AI initiatives." },
          { label: "B", text: "have misunderstood the function of the machine-learning sector." },
          { label: "C", text: "be unaware of the challenges of implementing national AI initiatives." },
          { label: "D", text: "be too keen to enter the race to dominate the machine-learning sector." },
        ],
        "C",
      ),
      matching(30, 3, "the mere addition of a neural network will produce solutions and promote ________", AI_WORDS, "F"),
      matching(31, 4, "have not set up the necessary ________ to manage the huge amount of data required to enable AI to function", AI_WORDS, "G"),
      matching(32, 5, "each person involved needs ________ to access the relevant data", AI_WORDS, "I"),
      matching(33, 6, "few public sector employees have the ________ to take full advantage of machine intelligence", AI_WORDS, "C"),
      matching(34, 7, "their experts had little faith in its ________, and the programme was abandoned", AI_WORDS, "A"),
      matching(35, 8, "these reflected and magnified the existing ________ within the legal profession", AI_WORDS, "D"),
      ynng(36, 9, "Stuart Russell's proposals regarding the use of AI are impractical.", "NO"),
      ynng(37, 10, "Rodney Brooks' view has attracted unfair criticism from supporters of AI.", "NOT GIVEN"),
      ynng(38, 11, "Nowadays, the need to protect AI systems is always taken into account when they are set up.", "NO"),
      ynng(39, 12, "In order to benefit from AI and minimise the harms, we have to explore people's concerns about its use.", "YES"),
      mcq(
        40,
        13,
        "What would be a suitable subtitle for Reading Passage 3?",
        [
          { label: "A", text: "How to make the most of what AI has to offer" },
          { label: "B", text: "Why AI may not be the answer to our problems" },
          { label: "C", text: "Why governments should not invest in AI systems" },
          { label: "D", text: "How AI could improve the efficiency of the public sector" },
        ],
        "B",
      ),
    ],
  };

  const questions = draft.parts.flatMap(
    (p) =>
      p.questions as Array<{
        number: number;
        type: string;
        correctAnswer: string;
        acceptableAnswers?: string[];
      }>,
  );
  if (questions.length !== 40) {
    throw new Error(`Expected 40 questions, found ${questions.length}`);
  }
  questions.forEach((q, i) => {
    if (q.number !== i + 1) throw new Error(`Question order gap at ${q.number}`);
    if (q.correctAnswer !== EXPECTED[i]) {
      throw new Error(`Q${q.number} key ${q.correctAnswer} !== ${EXPECTED[i]}`);
    }
  });

  draft.savedAt = new Date().toISOString();
  writeFileSync(FILE, `${JSON.stringify(draft, null, 2)}\n`, "utf8");

  const lines = questions.map((q) => {
    if (q.number === 20 || q.number === 21) return `${q.number}:${q.correctAnswer} (either order B/D)`;
    if (q.number === 26) return "26:jewellery / jewelry";
    return `${q.number}:${q.correctAnswer}`;
  });
  console.log(`Wrote ${FILE}`);
  console.log(`Questions: ${questions.length}`);
  console.log(lines.join("\n"));
}

main();
