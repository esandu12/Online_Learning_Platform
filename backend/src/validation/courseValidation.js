const LEVELS = new Set(["Beginner", "Intermediate", "Advanced"]);

function text(value, maxLength, label, { required = false } = {}) {
  if (value == null || value === "") {
    if (required) return { error: `${label} is required` };
    return { value: null };
  }

  if (typeof value !== "string") return { error: `${label} must be text` };
  const normalized = value.trim();
  if (required && !normalized) return { error: `${label} is required` };
  if (normalized.length > maxLength) {
    return { error: `${label} must be ${maxLength} characters or fewer` };
  }
  return { value: normalized || null };
}

function validateCourse(input, { creating = false } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Course details must be an object" };
  }

  const courseId = creating ? text(input.course_id, 10, "Course ID", { required: true }) : { value: null };
  const courseName = text(input.course_name, 100, "Course name", { required: true });
  const instructorId = text(input.instructor_id, 10, "Instructor", { required: true });
  const categoryId = text(input.category_id, 10, "Category", { required: true });
  const duration = text(input.duration, 30, "Duration");
  const level = input.level == null || input.level === "" ? { value: null } : text(input.level, 30, "Level");

  for (const result of [courseId, courseName, instructorId, categoryId, duration, level]) {
    if (result.error) return result;
  }
  if (level.value && !LEVELS.has(level.value)) {
    return { error: "Level must be Beginner, Intermediate, or Advanced" };
  }

  const price = input.price;
  if (price === "" || price == null || !Number.isFinite(Number(price)) || Number(price) < 0 || Number(price) > 99999999.99) {
    return { error: "Price must be a number between 0 and 99,999,999.99" };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(String(price).trim())) {
    return { error: "Price can have at most two decimal places" };
  }

  return {
    value: {
      ...(creating ? { course_id: courseId.value } : {}),
      course_name: courseName.value,
      level: level.value,
      duration: duration.value,
      price: Number(price),
      instructor_id: instructorId.value,
      category_id: categoryId.value,
    },
  };
}

module.exports = { LEVELS, validateCourse };
