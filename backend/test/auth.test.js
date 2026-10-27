const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeEmail, validateEmail, validatePassword, validateBirthDate, hashPassword, verifyPassword,
  createSessionToken, hashSessionToken,
} = require("../src/auth/security");
const {
  canViewStudentEnrollments, requireRole, sessionCookie, clearSessionCookie, readCookie,
} = require("../src/auth/middleware");

test("email and password validation normalize email and enforce password length", () => {
  assert.equal(normalizeEmail("  Student@Example.com "), "student@example.com");
  assert.equal(validateEmail("student@example.com"), true);
  assert.equal(validateEmail("no-at-sign"), false);
  assert.equal(validateEmail(`${"a".repeat(90)}@example.com`), false);
  assert.equal(validatePassword("12345678901"), false);
  assert.equal(validatePassword("correct horse battery"), true);
  assert.equal(validateBirthDate("2020-02-29"), true);
  assert.equal(validateBirthDate("2021-02-29"), false);
  assert.equal(validateBirthDate("2999-01-01"), false);
});

test("passwords are stored as salted scrypt hashes and verified safely", async () => {
  const first = await hashPassword("correct horse battery");
  const second = await hashPassword("correct horse battery");
  assert.match(first, /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("correct horse battery", first), true);
  assert.equal(await verifyPassword("wrong password", first), false);
  assert.equal(await verifyPassword("wrong password", "not-a-hash"), false);
});

test("session tokens are random and only a hash is suitable for database storage", () => {
  const one = createSessionToken();
  const two = createSessionToken();
  assert.notEqual(one.token, two.token);
  assert.notEqual(one.token, one.hash);
  assert.equal(one.hash, hashSessionToken(one.token));
  assert.match(one.hash, /^[a-f0-9]{64}$/);
});

test("enrollment access is limited to the student or an administrator", () => {
  assert.equal(canViewStudentEnrollments({ role: "student", student_id: "STU123" }, "STU123"), true);
  assert.equal(canViewStudentEnrollments({ role: "student", student_id: "STU123" }, "STU999"), false);
  assert.equal(canViewStudentEnrollments({ role: "instructor", instructor_id: "INS123" }, "STU123"), false);
  assert.equal(canViewStudentEnrollments({ role: "admin" }, "STU123"), true);
});

test("role middleware denies anonymous and wrong-role requests", () => {
  function invoke(user) {
    let statusCode = 200;
    let payload;
    let nextCalled = false;
    const res = { status(code) { statusCode = code; return this; }, json(value) { payload = value; return this; } };
    requireRole("admin")({ user }, res, () => { nextCalled = true; });
    return { statusCode, payload, nextCalled };
  }
  assert.equal(invoke(null).statusCode, 401);
  assert.equal(invoke({ role: "student" }).statusCode, 403);
  assert.equal(invoke({ role: "admin" }).nextCalled, true);
});

test("session cookie is HttpOnly and cookie parser handles unrelated cookies", () => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const cookie = sessionCookie("abc123", 60);
  const cleared = clearSessionCookie();
  if (previousEnvironment === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousEnvironment;
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Secure/);
  assert.match(cleared, /Max-Age=0/);
  assert.equal(readCookie("other=value; olp_session=abc123", "olp_session"), "abc123");
  assert.equal(readCookie("other=value", "olp_session"), null);
});
