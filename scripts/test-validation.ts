/**
 * Quick regression for shared auth/user validators.
 * Run: npx tsx scripts/test-validation.ts
 */

import {
  createAdminUserBodySchema,
  loginBodySchema,
  registerBodySchema,
  requiredEmailSchema,
  firstIssue,
  validationSuggestion,
} from "../src/lib/validation";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const typo = requiredEmailSchema.safeParse("phuonghohhls1@gmai.com");
assert(!typo.success, "should reject gmai.com");
assert(firstIssue(typo.error!).code === "EMAIL_DOMAIN_TYPO", "typo code");
assert(validationSuggestion(typo.error!) === "gmail.com", "typo suggestion");

const okEmail = requiredEmailSchema.safeParse("ok@gmail.com");
assert(okEmail.success, "gmail ok");

const weak = registerBodySchema.safeParse({
  email: "ok@gmail.com",
  password: "abcdef",
});
assert(!weak.success, "weak password");

const reg = registerBodySchema.safeParse({
  email: "ok@gmail.com",
  password: "abcdefg1",
});
assert(reg.success, "register ok");

const loginTypo = loginBodySchema.safeParse({
  email: "x@gmial.com",
  password: "anything",
});
assert(!loginTypo.success, "login rejects email typo");

const loginUser = loginBodySchema.safeParse({
  email: "admin",
  password: "x",
});
assert(loginUser.success, "username login ok");

const adminNoEmail = createAdminUserBodySchema.safeParse({
  username: "huynhnhung",
  password: "pass1234",
});
assert(adminNoEmail.success && adminNoEmail.data.email === null, "admin optional email");

const adminTypo = createAdminUserBodySchema.safeParse({
  username: "phuong",
  password: "pass1234",
  email: "phuong@gmai.com",
});
assert(!adminTypo.success, "admin rejects typo email");

console.log("validation ok");
