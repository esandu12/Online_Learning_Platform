
const express = require("express");
const db = require("../config/db");

const {
  authenticate,
  requireRole,
  requireSameOrigin,
} = require("../auth/middleware");

const router = express.Router();

// All enrollment endpoints require student login.
router.use(authenticate, requireRole("student"));

// GET /api/enrollments/me
// Show courses belonging to the logged-in student.
router.get("/me", async (req, res, next) => {
  try {
    const studentId = req.user.student_id;

    if (!studentId) {
      return res.status(403).json({
        error: "Student profile not found for this account",
      });
    }

    const [rows] = await db.execute(
      `
      SELECT
        e.student_id,
        e.course_id,
        c.course_name,
        c.level,
        c.duration,
        c.price,
        i.instructor_name
      FROM enrollment e
      JOIN course c ON c.course_id = e.course_id
      LEFT JOIN instructor i
        ON i.instructor_id = c.instructor_id
      WHERE e.student_id = ?
      ORDER BY c.course_name
      `,
      [studentId]
    );

    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

// POST /api/enrollments
// Enroll the currently logged-in student.
router.post("/", requireSameOrigin, async (req, res, next) => {
  try {
    const studentId = req.user.student_id;
    const courseId = req.body?.course_id;

    if (!studentId) {
      return res.status(403).json({
        error: "Only student accounts can enroll",
      });
    }

    if (
      typeof courseId !== "string" ||
      !/^[A-Za-z0-9_-]{1,10}$/.test(courseId)
    ) {
      return res.status(400).json({
        error: "Valid course ID is required",
      });
    }

    const [courses] = await db.execute(
      "SELECT course_id FROM course WHERE course_id = ?",
      [courseId]
    );

    if (courses.length === 0) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    const [result] = await db.execute(
      `
      INSERT INTO enrollment
        (student_id, course_id, enrollment_date)
      VALUES (?, ?, CURDATE())
      `,
      [studentId, courseId]
    );

    return res.status(201).json({
      message: "Successfully enrolled in the course!",
      course_id: courseId,
      student_id: studentId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "You are already enrolled in this course",
      });
    }

    return next(error);
  }
});


router.delete(
  "/:courseId",
  requireSameOrigin,
  async (req, res, next) => {
    try {
      const studentId = req.user.student_id;
      const courseId = req.params.courseId;

      if (!studentId) {
        return res.status(403).json({
          error: "Student account required",
        });
      }

      const [result] = await db.execute(
        `DELETE FROM enrollment
         WHERE student_id = ? AND course_id = ?`,
        [studentId, courseId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: "You are not enrolled in this course",
        });
      }

      return res.json({
        message: "Successfully unenrolled",
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
