import assert from "node:assert/strict";
import {
  computeHomeworkProgress,
  csvCell,
  type HomeworkAssignmentRef,
  type HomeworkAttempt,
} from "../src/lib/classroom/homework-core";

const d = (iso: string) => new Date(`${iso}+07:00`);

const reading: HomeworkAssignmentRef = {
  id: "a1",
  testId: "t1",
  skill: "READING",
  sectionOrders: [1, 2],
  questionCount: 26,
  createdAt: d("2026-10-20T08:00:00"),
  deadlineAt: d("2026-10-25T23:00:00"),
};

function attempt(id: string, finished: string, patch: Partial<HomeworkAttempt> = {}): HomeworkAttempt {
  return {
    id,
    userId: "u1",
    testId: "t1",
    sectionOrders: [1, 2],
    finishedAt: d(finished),
    correct: 10,
    total: 26,
    aiBand: null,
    partial: false,
    speakingPartKinds: null,
    ...patch,
  };
}

assert.equal(computeHomeworkProgress(reading, []).status, "pending");

// Before assignment, other test, missing part, redo-wrong subset: none count
assert.equal(
  computeHomeworkProgress(reading, [
    attempt("early", "2026-10-19T10:00:00"),
    attempt("other", "2026-10-21T10:00:00", { testId: "t2" }),
    attempt("part1", "2026-10-21T10:00:00", { sectionOrders: [1] }),
    attempt("redo", "2026-10-21T10:00:00", { partial: true }),
  ]).status,
  "pending",
);

// Best score wins, first submit decides lateness; a full mock covers the parts
const done = computeHomeworkProgress(reading, [
  attempt("first", "2026-10-24T10:00:00", { correct: 12 }),
  attempt("late-best", "2026-10-27T10:00:00", { correct: 20, sectionOrders: [1, 2, 3] }),
]);
assert.equal(done.status, "done");
if (done.status === "done") {
  assert.equal(done.bestAttemptId, "late-best");
  assert.equal(done.correct, 20);
  assert.equal(done.attemptCount, 2);
  assert.equal(done.isLate, false);
  assert.ok(done.band !== null && done.band > 0);
}

const lateOnly = computeHomeworkProgress(reading, [attempt("late", "2026-10-26T08:00:00")]);
assert.ok(lateOnly.status === "done" && lateOnly.isLate);

// Writing: score by AI band, unscored attempt still counts as done
const writing: HomeworkAssignmentRef = { ...reading, id: "w", skill: "WRITING", sectionOrders: [1] };
const w = computeHomeworkProgress(writing, [
  attempt("w1", "2026-10-21T10:00:00", { sectionOrders: [1], aiBand: null }),
  attempt("w2", "2026-10-22T10:00:00", { sectionOrders: [1], aiBand: 6.5 }),
]);
assert.ok(w.status === "done" && w.band === 6.5 && w.bestAttemptId === "w2" && w.correct === null);

// Speaking: practising only Part 1 does not complete a whole-test assignment
const speaking: HomeworkAssignmentRef = { ...reading, id: "s", skill: "SPEAKING", sectionOrders: [1] };
assert.equal(
  computeHomeworkProgress(speaking, [attempt("s1", "2026-10-21T10:00:00", { sectionOrders: [1], speakingPartKinds: [1] })]).status,
  "pending",
);

// CSV escaping + formula injection guard
assert.equal(csvCell("Nguyễn, Văn A"), '"Nguyễn, Văn A"');
assert.equal(csvCell('say "hi"'), '"say ""hi"""');
assert.equal(csvCell("=SUM(A1)"), "'=SUM(A1)");
assert.equal(csvCell(null), "");

console.log("homework progress: ok");
