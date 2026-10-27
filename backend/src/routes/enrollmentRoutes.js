
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { validateEnrollment } = require("../validation/enrollmentValidation");

// GET - List students for enrollment selection
router.get("/students", async (req, res) => {
  try {
    const [students] = await db.execute(
      `SELECT student_id, first_name, last_name
       FROM student
       ORDER BY first_name, last_name`
    );

    res.json(students);
  } catch (error) {
    console.error("Student list error:", error.message);
    res.status(500).json({
      error: "Failed to retrieve students"
    });
  }
});

// GET - Courses enrolled by one student
router.get("/students/:studentId", async (req, res) => {
  try {
    const [enrollments] = await db.execute(
      `SELECT
         e.student_id,
         e.course_id,
         e.enrollment_date,
         c.course_name,
         c.level,
         c.duration,
         c.price
       FROM enrollment e
       JOIN course c
         ON e.course_id = c.course_id
       WHERE e.student_id = ?
       ORDER BY e.enrollment_date DESC`,
      [req.params.studentId]
    );

    res.json(enrollments);
  } catch (error) {
    console.error("Enrollment list error:", error.message);
    res.status(500).json({
      error: "Failed to retrieve enrollments"
    });
  }
});

// POST - Enroll student into course
router.post("/", async (req, res) => {
  const validation = validateEnrollment(req.body);
  if (validation.error) return res.status(400).json({ error: validation.error });
  const { student_id, course_id } = validation.value;

  try {
    await db.execute(
      `INSERT INTO enrollment
       (student_id, course_id, enrollment_date)
       VALUES (?, ?, CURDATE())`,
      [student_id, course_id]
    );

    res.status(201).json({
      message: "Student enrolled successfully"
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Student is already enrolled in this course"
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "Student ID or Course ID does not exist"
      });
    }

    console.error("Enrollment error:", error.message);

    res.status(500).json({
      error: "Failed to enroll student"
    });
  }
});

module.exports = router;
