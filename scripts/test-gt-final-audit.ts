import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

type AuditIssue = {
  slug: string;
  cat: "AUDIO" | "COUNT" | "PASSAGE" | "SPEAKING" | string;
  msg: string;
};

type AuditReport = {
  issues: AuditIssue[];
  urlStats: { total: number; ok: number };
};

const reportPath = path.resolve(".tmp-import/audit-gt/issues.json");
assert.ok(fs.existsSync(reportPath), "Missing audit report: " + reportPath);

const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as AuditReport;

const intentionallyAudioFree =
  /^cambridge-ielts-(11|12|18)-general-test-\d+-listening$/;
const canonicalSpeaking =
  /^cambridge-ielts-(11|12|13|14|15|16|17|18)-general-test-\d+-speaking$/;
const intentionallyShortMocks = new Set([
  "general-listening-mocktest-1",
  "general-reading-grade-8",
  "general-reading-mocktest-1",
  "general-writing-mocktest-1",
]);

function isAcceptedProductDecision(issue: AuditIssue): boolean {
  if (issue.cat === "AUDIO" && intentionallyAudioFree.test(issue.slug)) return true;
  if (
    (issue.cat === "COUNT" || issue.cat === "SPEAKING") &&
    canonicalSpeaking.test(issue.slug)
  ) {
    return true;
  }
  return (
    (issue.cat === "COUNT" || issue.cat === "PASSAGE") &&
    intentionallyShortMocks.has(issue.slug)
  );
}

const actionable = report.issues.filter(
  (issue) => !isAcceptedProductDecision(issue),
);

assert.deepEqual(
  actionable,
  [],
  "Actionable GT audit issues remain:\n" + JSON.stringify(actionable, null, 2),
);
assert.equal(report.urlStats.total, 82, "Unexpected audited media URL count");
assert.equal(report.urlStats.ok, report.urlStats.total, "Some media URLs failed");

console.log(
  "GT final audit passed: 0 actionable issues; " +
    report.issues.length +
    " accepted policy/legacy-heuristic findings; " +
    report.urlStats.ok +
    "/" +
    report.urlStats.total +
    " media URLs OK.",
);
