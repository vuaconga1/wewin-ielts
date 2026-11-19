import assert from "node:assert/strict";
import { isAllowedReturnTo } from "../src/lib/auth/sso-return-to";

process.env.NODE_ENV = "production";
process.env.WEWIN_HUB_ALLOWED_RETURN_ORIGINS =
  "https://wewin.edu.vn,https://exam.wewin.edu.vn";

assert.equal(isAllowedReturnTo("https://wewin.edu.vn/admin"), true);
assert.equal(isAllowedReturnTo("https://wewin.edu.vn/admin/placement"), true);
assert.equal(isAllowedReturnTo("https://exam.wewin.edu.vn/"), true);
assert.equal(isAllowedReturnTo("https://evil.com/"), false);
assert.equal(isAllowedReturnTo("https://wewin.edu.vn.evil.com/"), false);
assert.equal(isAllowedReturnTo("/relative"), false);
assert.equal(isAllowedReturnTo("javascript:alert(1)"), false);
assert.equal(isAllowedReturnTo("http://wewin.edu.vn/admin"), false);

process.env.NODE_ENV = "development";
assert.equal(isAllowedReturnTo("http://localhost:3000/admin"), true);

console.log("sso-return-to: ok");
