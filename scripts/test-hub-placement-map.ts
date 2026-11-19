import assert from "node:assert/strict";
import {
  resolveHubBranch,
  scorePercent,
} from "../src/lib/hub/placement-attempts-pure";

assert.equal(scorePercent(8, 10), 80);
assert.equal(scorePercent(null, 10), null);
assert.equal(scorePercent(3, 0), null);

process.env.WEWIN_SITE_BRANCH = "XVNT";
assert.equal(resolveHubBranch(), "XVNT");
process.env.WEWIN_SITE_BRANCH = "ntl";
assert.equal(resolveHubBranch(), "NTL");
delete process.env.WEWIN_SITE_BRANCH;
assert.equal(resolveHubBranch(), "NTL");

console.log("hub-placement-map: ok");
