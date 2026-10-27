const test = require("node:test");
const assert = require("node:assert/strict");
const { validateCourse } = require("../src/validation/courseValidation");
const { validateEnrollment } = require("../src/validation/enrollmentValidation");

const validCourse = {
  course_id: "CRS007",
  course_name: "  Web Development ",
  level: "Beginner",
  duration: "8 Weeks",
  price: "12500.50",
  instructor_id: "INS001",
  category_id: "CAT001",
};

test("course creation normalizes whitespace and numeric price", () => {
  const result = validateCourse(validCourse, { creating: true });
  assert.equal(result.error, undefined);
  assert.equal(result.value.course_name, "Web Development");
  assert.equal(result.value.price, 12500.5);
});

test("course update does not require a body course ID", () => {
  const { course_id, ...update } = validCourse;
  const result = validateCourse(update);
  assert.equal(result.error, undefined);
  assert.equal("course_id" in result.value, false);
});

for (const [label, overrides] of [
  ["blank course name", { course_name: "   " }],
  ["overlong course ID", { course_id: "COURSE-TOO-LONG" }],
  ["invalid level", { level: "Expert" }],
  ["negative price", { price: "-1" }],
  ["more than two price decimals", { price: "12.345" }],
  ["missing category", { category_id: " " }],
]) {
  test(`rejects ${label}`, () => {
    assert.ok(validateCourse({ ...validCourse, ...overrides }, { creating: true }).error);
  });
}

test("enrollment accepts trimmed IDs", () => {
  assert.deepEqual(validateEnrollment({ student_id: " STU001 ", course_id: " CRS001 " }).value,
    { student_id: "STU001", course_id: "CRS001" });
});

test("enrollment rejects missing and overlong IDs", () => {
  assert.ok(validateEnrollment({ student_id: "", course_id: "CRS001" }).error);
  assert.ok(validateEnrollment({ student_id: "STUDENT-TOO-LONG", course_id: "CRS001" }).error);
});
