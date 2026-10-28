
const express = require("express");
const db = require("../config/db");
const {
  authenticate,
  requireRole,
  requireSameOrigin,
} = require("../auth/middleware");

const router = express.Router();

router.use(authenticate, requireRole("instructor"));

function validCourse(body) {
  return (
    typeof body.course_name === "string" &&
    body.course_name.trim().length > 0 &&
    body.course_name.trim().length <= 100 &&
    ["Beginner", "Intermediate", "Advanced"].includes(body.level) &&
    typeof body.duration === "string" &&
    body.duration.trim().length > 0 &&
    body.duration.length <= 50 &&
    Number.isFinite(Number(body.price)) &&
    Number(body.price) >= 0 &&
    typeof body.category_id === "string" &&
    body.category_id.trim().length > 0
  );
}

// List only this instructor's courses
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT c.*, cat.category_name
       FROM course c
       LEFT JOIN category cat
         ON cat.category_id = c.category_id
       WHERE c.instructor_id = ?
       ORDER BY c.course_name`,
      [req.user.instructor_id]
    );

    return res.json(rows);
  } catch (error) {
    next(error);
  }
});

// Create a course owned by the signed-in instructor
router.post("/", requireSameOrigin, async (req, res, next) => {
  try {
    const body = req.body || {};
    const courseId = body.course_id;

    if (
      typeof courseId !== "string" ||
      !/^[A-Za-z0-9_-]{1,10}$/.test(courseId) ||
      !validCourse(body)
    ) {
      return res.status(400).json({
        error: "Enter valid course details",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO course
       (course_id, course_name, level, duration,
        price, instructor_id, category_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        courseId,
        body.course_name.trim(),
        body.level,
        body.duration.trim(),
        Number(body.price),
        req.user.instructor_id,
        body.category_id,
      ]
    );

    return res.status(201).json({
      message: "Course created successfully",
      course_id: courseId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Course ID already exists",
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "Invalid instructor profile or category",
      });
    }

    next(error);
  }
});

// Edit only a course owned by this instructor
router.put(
  "/:courseId",
  requireSameOrigin,
  async (req, res, next) => {
    try {
      const body = req.body || {};

      if (!validCourse(body)) {
        return res.status(400).json({
          error: "Enter valid course details",
        });
      }

      const [result] = await db.execute(
        `UPDATE course
         SET course_name = ?,
             level = ?,
             duration = ?,
             price = ?,
             category_id = ?
         WHERE course_id = ?
           AND instructor_id = ?`,
        [
          body.course_name.trim(),
          body.level,
          body.duration.trim(),
          Number(body.price),
          body.category_id,
          req.params.courseId,
          req.user.instructor_id,
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: "Course not found or not assigned to you",
        });
      }

      return res.json({
        message: "Course updated successfully",
      });
    } catch (error) {
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          error: "Invalid course category",
        });
      }

      next(error);
    }
  }
);

module.exports = router;
