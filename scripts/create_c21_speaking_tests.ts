/**
 * Generate Cambridge 21 Speaking test JSON files (Test 15 to Test 18).
 * Usage: npx tsx scripts/create_c21_speaking_tests.ts
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

interface SpeakingTestConfig {
  testNumber: number;
  bookTestNumber: number;
  slug: string;
  title: string;
  description: string;
  part1: {
    topic: string;
    questions: string[];
  };
  part2: {
    stem: string;
  };
  part3: {
    topic1: string;
    questions1: string[];
    topic2: string;
    questions2: string[];
  };
}

const TESTS: SpeakingTestConfig[] = [
  {
    testNumber: 15,
    bookTestNumber: 1,
    slug: "test-15-speaking",
    title: "Test 15.C21.01 - Speaking",
    description: "IELTS Academic Speaking practice test 15 (Part 1 · Part 2 · Part 3).",
    part1: {
      topic: "Hairstyles",
      questions: [
        "Where do you go to get a haircut?",
        "Have you changed your hairstyle recently?",
        "Would you ever change the colour of your hair?",
        "Do you enjoy going to the hairdresser/barber?",
      ],
    },
    part2: {
      stem: `Describe a time when you used information for tourists, for example from a guidebook or online.

You should say:
• where you got this information
• what place this information was about
• what information you got
and explain whether this information was very helpful for you.`,
    },
    part3: {
      topic1: "Different types of holidays",
      questions1: [
        "What are the most popular kinds of holidays for people from your country to go on?",
        "Do you think most people prefer to have a holiday abroad rather than in their own country?",
        "Why do some people want to do absolutely nothing when they go away on holiday?",
      ],
      topic2: "Tourist attractions",
      questions2: [
        "What are the kinds of tourist attraction that visitors to your country like to see?",
        "Do you think tourist attractions such as museums should be free for local people to visit?",
        "What can make a tourist attraction disappointing for visitors?",
      ],
    },
  },
  {
    testNumber: 16,
    bookTestNumber: 2,
    slug: "test-16-speaking",
    title: "Test 16.C21.02 - Speaking",
    description: "IELTS Academic Speaking practice test 16 (Part 1 · Part 2 · Part 3).",
    part1: {
      topic: "Cities",
      questions: [
        "How well do you know the capital city of your country?",
        "Do you think cities are exciting places to live?",
        "Why do some people dislike living in a city?",
        "If you could visit any city in the world, where would you go?",
      ],
    },
    part2: {
      stem: `Describe a time when you read or heard something that you thought was not true.

You should say:
• where you read/heard this
• what you read/heard
• why you thought it was not true
and explain how you felt about reading/hearing this thing that you thought was not true.`,
    },
    part3: {
      topic1: "Honesty and children",
      questions1: [
        "Do you think children are more honest than adults?",
        "Why do adults tell children it's important to be honest?",
        "Do you think there are sometimes good reasons for adults not to tell children the truth?",
      ],
      topic2: "Honesty and advertising",
      questions2: [
        "Are there any claims in advertisements that are sometimes not true?",
        "Why do people still buy things even when they know advertisements aren't completely accurate?",
        "Do you think advertisements that are dishonest should be banned?",
      ],
    },
  },
  {
    testNumber: 17,
    bookTestNumber: 3,
    slug: "test-17-speaking",
    title: "Test 17.C21.03 - Speaking",
    description: "IELTS Academic Speaking practice test 17 (Part 1 · Part 2 · Part 3).",
    part1: {
      topic: "Spending and saving money",
      questions: [
        "When you go shopping, do you usually pay for things by cash or by card?",
        "Are you generally careful about how much money you spend?",
        "Have you ever spent money on something you didn't need?",
        "How important is it to you to save money for the future?",
      ],
    },
    part2: {
      stem: `Describe an interesting garden or park you have seen.

You should say:
• where this garden or park is
• how big it is
• what you saw in this garden/park
and explain why you think this garden/park is interesting.`,
    },
    part3: {
      topic1: "Homes and gardens",
      questions1: [
        "What are the advantages of having a home with a garden?",
        "How could people living in apartment blocks grow plants and vegetables?",
        "How interested are people in your country in TV shows and magazines about gardens?",
      ],
      topic2: "Gardening as a hobby",
      questions2: [
        "Do you think that gardening is a hobby mainly for older people?",
        "What are the benefits for people of gardening as a hobby?",
        "Will gardening be a more popular hobby in the future?",
      ],
    },
  },
  {
    testNumber: 18,
    bookTestNumber: 4,
    slug: "test-18-speaking",
    title: "Test 18.C21.04 - Speaking",
    description: "IELTS Academic Speaking practice test 18 (Part 1 · Part 2 · Part 3).",
    part1: {
      topic: "Bread",
      questions: [
        "When do you usually eat bread?",
        "How important is bread in your culture?",
        "Have you tried any kinds of bread from other countries?",
        "Would you be interested in learning how to make bread?",
      ],
    },
    part2: {
      stem: `Describe a person you know who is very competitive.

You should say:
• who this person is
• what this person is competitive about
• how successful this person is
and explain why you think this person is so competitive.`,
    },
    part3: {
      topic1: "Competitions",
      questions1: [
        "What kinds of competitions do people like to enter in your country?",
        "What do you think is the best kind of prize to win in a competition?",
        "Why do people like watching quiz shows and other competitions on TV?",
      ],
      topic2: "Being competitive in sports",
      questions2: [
        "How important is it to be very competitive at sport?",
        "Do you think sportspeople perform better when they play against competitors who are stronger than they are?",
        "Why do some people think that taking part in sport is more important than winning?",
      ],
    },
  },
];

function buildSpeakingTest(t: SpeakingTestConfig) {
  let qNum = 1;

  // Part 1 questions
  const p1Questions = t.part1.questions.map((stem, idx) => ({
    number: qNum++,
    order: idx,
    type: "SPEAKING_PROMPT" as const,
    content: {
      stem,
      topic: t.part1.topic,
      speakingPart: 1,
    },
  }));

  // Part 2 question
  const p2Questions = [
    {
      number: qNum++,
      order: 0,
      type: "SPEAKING_PROMPT" as const,
      content: {
        stem: t.part2.stem,
        speakingPart: 2,
      },
    },
  ];

  // Part 3 questions
  const p3Questions = [
    ...t.part3.questions1.map((stem, idx) => ({
      number: qNum++,
      order: idx,
      type: "SPEAKING_PROMPT" as const,
      content: {
        stem,
        topic: t.part3.topic1,
        speakingPart: 3,
      },
    })),
    ...t.part3.questions2.map((stem, idx) => ({
      number: qNum++,
      order: t.part3.questions1.length + idx,
      type: "SPEAKING_PROMPT" as const,
      content: {
        stem,
        topic: t.part3.topic2,
        speakingPart: 3,
      },
    })),
  ];

  return {
    title: t.title,
    slug: t.slug,
    skill: "SPEAKING",
    examType: "ACADEMIC",
    timeLimitMinutes: 15,
    tags: ["#IELTS Academic", "#Speaking"],
    description: t.description,
    parts: [
      {
        title: "Part 1",
        order: 0,
        questions: p1Questions,
      },
      {
        title: "Part 2",
        order: 1,
        questions: p2Questions,
      },
      {
        title: "Part 3",
        order: 2,
        questions: p3Questions,
      },
    ],
  };
}

for (const t of TESTS) {
  const filePath = path.resolve(`data/tests/${t.slug}.json`);
  const data = buildSpeakingTest(t);
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Created ${filePath}`);
}
