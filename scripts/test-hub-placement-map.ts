import assert from "node:assert/strict";
import {
  resolveHubBranch,
  scorePercent,
  siteOrigin,
} from "../src/lib/hub/placement-attempts-pure";
import {
  mintCambridgeSsoToken,
  verifyCambridgeSsoToken,
} from "../src/lib/hub/cambridge-sso-token";

assert.equal(scorePercent(8, 10), 80);
assert.equal(scorePercent(null, 10), null);
assert.equal(scorePercent(3, 0), null);

process.env.WEWIN_SITE_BRANCH = "XVNT";
assert.equal(resolveHubBranch(), "XVNT");
process.env.WEWIN_SITE_BRANCH = "ntl";
assert.equal(resolveHubBranch(), "NTL");
delete process.env.WEWIN_SITE_BRANCH;
assert.equal(resolveHubBranch(), "NTL");

delete process.env.NEXT_PUBLIC_SITE_URL;
delete process.env.VERCEL_URL;
assert.equal(siteOrigin(), "https://ielts.wewin.edu.vn");
process.env.VERCEL_URL = "wewin-ielts-preview.vercel.app";
assert.equal(siteOrigin(), "https://ielts.wewin.edu.vn");
process.env.NEXT_PUBLIC_SITE_URL = "https://ielts.wewin.edu.vn/";
assert.equal(siteOrigin(), "https://ielts.wewin.edu.vn");
delete process.env.NEXT_PUBLIC_SITE_URL;
delete process.env.VERCEL_URL;

const secret = "hub-secret-key-16+chars";
const attempt = "11111111-2222-3333-4444-555555555555";
const token = mintCambridgeSsoToken(attempt, secret);
assert.equal(verifyCambridgeSsoToken(token, attempt, secret), true);
assert.equal(verifyCambridgeSsoToken(token, "other-attempt-id", secret), false);
assert.equal(verifyCambridgeSsoToken(token, attempt, "wrong-secret-key!!"), false);
assert.equal(
  verifyCambridgeSsoToken(token, attempt, secret, Date.now() + 120_000),
  false,
);

console.log("hub-placement-map: ok");
