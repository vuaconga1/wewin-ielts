/**
 * Generate Cambridge 21 Writing test JSON files (Test 15 to Test 18).
 * Usage: npx tsx scripts/create_c21_writing_tests.ts
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

interface WritingTestConfig {
  testNumber: number;
  bookTestNumber: number;
  slug: string;
  title: string;
  task1: {
    stem: string;
    imageUrl: string;
  };
  task2: {
    stem: string;
  };
}

const TESTS: WritingTestConfig[] = [
  {
    testNumber: 15,
    bookTestNumber: 1,
    slug: "test-15-writing",
    title: "Test 15.C21.01 - Writing",
    task1: {
      stem: `You should spend about 20 minutes on this task.

The graph below gives information about the number of jobs in four sectors of the economy in the US between 1960 and 2020.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
      imageUrl: "/uploads/writing/test-15-writing-task1.png",
    },
    task2: {
      stem: `You should spend about 40 minutes on this task.

Write about the following topic:

The best way to provide enough homes in large cities is to build tall apartment blocks.

To what extent do you agree or disagree with this statement?

Give reasons for your answer and include any relevant examples from your own knowledge or experience.

Write at least 250 words.`,
    },
  },
  {
    testNumber: 16,
    bookTestNumber: 2,
    slug: "test-16-writing",
    title: "Test 16.C21.02 - Writing",
    task1: {
      stem: `You should spend about 20 minutes on this task.

The plans below show a college cafe before it was redesigned and how it looks now.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
      imageUrl: "/uploads/writing/test-16-writing-task1.png",
    },
    task2: {
      stem: `You should spend about 40 minutes on this task.

Write about the following topic:

Some people say that in the digital age, theatres and cinemas are no longer important as people can watch all the entertainment they want online. Others argue that theatres and cinemas are still important both economically and culturally.

Discuss both these views and give your own opinion.

Give reasons for your answer and include any relevant examples from your own knowledge or experience.

Write at least 250 words.`,
    },
  },
  {
    testNumber: 17,
    bookTestNumber: 3,
    slug: "test-17-writing",
    title: "Test 17.C21.03 - Writing",
    task1: {
      stem: `You should spend about 20 minutes on this task.

The diagram below shows how one type of desert, known as a rain-shadow desert, is formed.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
      imageUrl: "/uploads/writing/test-17-writing-task1.png",
    },
    task2: {
      stem: `You should spend about 40 minutes on this task.

Write about the following topic:

All university undergraduate courses should include a period of time spent studying abroad or doing a work placement.

Do you think the advantages of this would outweigh the disadvantages?

Give reasons for your answer and include any relevant examples from your own knowledge or experience.

Write at least 250 words.`,
    },
  },
  {
    testNumber: 18,
    bookTestNumber: 4,
    slug: "test-18-writing",
    title: "Test 18.C21.04 - Writing",
    task1: {
      stem: `You should spend about 20 minutes on this task.

The chart and table below show the results of a survey of library users at a university.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
      imageUrl: "/uploads/writing/test-18-writing-task1.png",
    },
    task2: {
      stem: `You should spend about 40 minutes on this task.

Write about the following topic:

Some people argue that primary schools focus too much on formal learning.

To what extent do you agree with this opinion?

How important do you think it is for children to play as well as learn in the primary school classroom?

Give reasons for your answer and include any relevant examples from your own knowledge or experience.

Write at least 250 words.`,
    },
  },
];

function buildWritingTest(t: WritingTestConfig) {
  return {
    title: t.title,
    slug: t.slug,
    skill: "WRITING",
    examType: "ACADEMIC",
    timeLimitMinutes: 60,
    tags: ["#IELTS Academic", "#Writing"],
    parts: [
      {
        title: "Task 1",
        order: 0,
        content: t.task1.stem,
        meta: {
          preamble: `IELTS ACADEMIC WRITING PRACTICE TEST ${t.testNumber}\n\nTIME ALLOWED: 60 minutes\nINSTRUCTIONS TO CANDIDATES: You must answer both Task 1 and Task 2.`,
          imageUrl: t.task1.imageUrl,
        },
        questions: [
          {
            number: 1,
            order: 0,
            type: "ESSAY",
            content: {
              stem: t.task1.stem,
              minWords: 150,
              imageUrl: t.task1.imageUrl,
            },
            mediaUrl: t.task1.imageUrl,
          },
        ],
      },
      {
        title: "Task 2",
        order: 1,
        content: t.task2.stem,
        meta: {},
        questions: [
          {
            number: 2,
            order: 0,
            type: "ESSAY",
            content: {
              stem: t.task2.stem,
              minWords: 250,
            },
          },
        ],
      },
    ],
    savedAt: new Date().toISOString(),
  };
}

for (const t of TESTS) {
  const filePath = path.resolve(`data/tests/${t.slug}.json`);
  const data = buildWritingTest(t);
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Created ${filePath}`);
}
