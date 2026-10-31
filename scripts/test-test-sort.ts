import { compareTestsAscending } from "../src/lib/tests/test-sort";

const rows = [
  { title: "Vol 2 Test 1 - Listening", slug: "real-ielts-vol-2-test-1-listening", skill: "LISTENING" },
  { title: "Test 14 - Listening", skill: "LISTENING" },
  { title: "Vol 1 Test 10 - Listening", slug: "real-ielts-vol-1-test-10-listening", skill: "LISTENING" },
  { title: "Test 3 - Listening", skill: "LISTENING" },
  { title: "Test 1 - Writing", skill: "WRITING" },
  { title: "Vol 1 Test 2 - Reading", slug: "real-ielts-vol-1-test-2-reading", skill: "READING" },
  { title: "Test 10 - Listening", skill: "LISTENING" },
  { title: "Test 1 - Listening", skill: "LISTENING" },
  { title: "Vol 1 Test 2 - Listening", slug: "real-ielts-vol-1-test-2-listening", skill: "LISTENING" },
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
  "Vol 1 Test 2 - Listening:LISTENING",
  "Vol 1 Test 2 - Reading:READING",
  "Vol 1 Test 10 - Listening:LISTENING",
  "Vol 2 Test 1 - Listening:LISTENING",
].join("|");
if (actual !== expected) throw new Error(`Unexpected test order: ${actual}`);
console.log("test catalog natural sort: ok");
