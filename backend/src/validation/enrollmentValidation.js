function validateEnrollment(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Student ID and Course ID are required" };
  }

  const studentId = typeof input.student_id === "string" ? input.student_id.trim() : "";
  const courseId = typeof input.course_id === "string" ? input.course_id.trim() : "";
  if (!studentId || !courseId || studentId.length > 10 || courseId.length > 10) {
    return { error: "Valid student ID and course ID are required" };
  }
  return { value: { student_id: studentId, course_id: courseId } };
}

module.exports = { validateEnrollment };
