import assert from "node:assert/strict";
import {
  normalizeGeneralWritingTask,
  normalizeSpeakingPart2Stem,
  parseSpeakingPartQuestions,
} from "../src/lib/import/normalize-writing-speaking";

const writing = normalizeGeneralWritingTask(`You should spend about 20 minutes on this task.

Write a letter to a friend. In your letter

explain why the trip would be useful
describe where you would stay
say when you would like to travel

Write at least 150 words.`);
assert.match(writing, /In your letter:/);
assert.equal((writing.match(/^• /gm) ?? []).length, 3);
assert.equal(normalizeGeneralWritingTask(writing), writing, "writing normalization is idempotent");

const part1 = parseSpeakingPartQuestions(`The examiner asks you about familiar topics.

EXAMPLE
Neighbours
How often do you see your neighbours? [Why?]
Tell me about a neighbour you know well.
Do you think you are a good neighbour? [Why?]
Has a neighbour ever helped you? [Why/Why not?]`, 1);
assert.equal(part1.length, 4);
assert.ok(part1.every((question) => question.content.speakingPart === 1));
assert.ok(part1.every((question) => question.content.topic === "Neighbours"));

const part2 = parseSpeakingPartQuestions(`Describe a useful object in your home.
You should say:
what it is
how often you use it
who gave it to you
and explain why it is useful.
You will have to talk about the topic for one to two minutes. You have one minute to think about what you are going to say. You can make some notes to help you if you wish.`, 2);
assert.equal(part2.length, 1);
assert.match(String(part2[0]!.content.stem), /Describe a useful object/);
assert.match(String(part2[0]!.content.stem), /You should say:\n• what it is/);
assert.match(String(part2[0]!.content.stem), /\nand explain why it is useful\./);
assert.doesNotMatch(String(part2[0]!.content.stem), /one to two minutes/);
assert.equal(
  normalizeSpeakingPart2Stem(String(part2[0]!.content.stem)),
  part2[0]!.content.stem,
  "Part 2 normalization is idempotent",
);

const part3 = parseSpeakingPartQuestions(`Discussion topics:
Useful objects
Example questions:
Why do people keep old objects?
Which objects are most useful at work?
Do useful objects need to be expensive?
Consumer choices
Example questions:
Why do people buy new products?
How does advertising affect consumers?
Should products last longer?`, 3);
assert.equal(part3.length, 6);
assert.deepEqual(part3.map((q) => q.content.topic), [
  "Useful objects", "Useful objects", "Useful objects",
  "Consumer choices", "Consumer choices", "Consumer choices",
]);
assert.ok(part3.every((question) => question.content.variant === "SPEAKING_PART_3"));

console.log("writing/speaking import normalization: ok");
