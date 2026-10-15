import { compareTestsAscending } from "../src/lib/tests/test-sort";

const rows = [
  { title: "Test 14 - Listening", skill: "LISTENING" },
  { title: "Test 3 - Listening", skill: "LISTENING" },
  { title: "Test 1 - Writing", skill: "WRITING" },
  { title: "Test 10 - Listening", skill: "LISTENING" },
  { title: "Test 1 - Listening", skill: "LISTENING" },
  { title: "Test 1 - Reading", skill: "READING" },
].sort(compareTestsAscending);

const actual = rows.map((row) => `${row.title}:${row.skill}`).join("|");
const expected = [
  "Test 1 - Listening:LISTENING",
  "Test 1 - Reading:READING",
  "Test 1 - Writing:WRITING",
  "Test 3 - Listening:LISTENING",
  "Test 10 - Listening:LISTENING",
  "Test 14 - Listening:LISTENING",
].join("|");
if (actual !== expected) throw new Error(`Unexpected test order: ${actual}`);
console.log("test catalog natural sort: ok");