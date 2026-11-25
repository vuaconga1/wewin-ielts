import assert from "node:assert/strict";
import { isAllowedReturnTo } from "../src/lib/auth/sso-return-to";

process.env.WEWIN_HUB_ALLOWED_RETURN_ORIGINS =
  "https://wewin.edu.vn,https://exam.wewin.edu.vn,https://admin.wewin.edu.vn,.wewin.edu.vn";

const prod = { nodeEnv: "production" } as const;
const dev = { nodeEnv: "development" } as const;

assert.equal(isAllowedReturnTo("https://wewin.edu.vn/admin", prod), true);
assert.equal(
  isAllowedReturnTo("https://wewin.edu.vn/admin/placement", prod),
  true,
);
assert.equal(isAllowedReturnTo("https://exam.wewin.edu.vn/", prod), true);
assert.equal(isAllowedReturnTo("https://admin.wewin.edu.vn/", prod), true);
assert.equal(isAllowedReturnTo("https://ielts.wewin.edu.vn/admin", prod), true);
assert.equal(isAllowedReturnTo("https://evil.com/", prod), false);
assert.equal(isAllowedReturnTo("https://wewin.edu.vn.evil.com/", prod), false);
assert.equal(isAllowedReturnTo("/relative", prod), false);
assert.equal(isAllowedReturnTo("javascript:alert(1)", prod), false);
assert.equal(isAllowedReturnTo("http://wewin.edu.vn/admin", prod), false);

assert.equal(isAllowedReturnTo("http://localhost:3000/admin", dev), true);

delete process.env.WEWIN_HUB_ALLOWED_RETURN_ORIGINS;
assert.equal(isAllowedReturnTo("https://admin.wewin.edu.vn/placement", prod), true);

console.log("sso-return-to: ok");
