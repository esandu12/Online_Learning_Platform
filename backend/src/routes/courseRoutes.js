const express = require("express");
const router = express.Router();
const db = require("../config/db");

// CREATE a course
router.post("/", async (req, res) => {
  try {
    const {
      course_id, course_name, level,
      duration, price, instructor_id, category_id
    } = req.body;

    if (!course_id || !course_name || !instructor_id || !category_id ||
        !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: "Invalid course details" });
    }

    await db.execute(
      `INSERT INTO course
       (course_id, course_name, level, duration, price, instructor_id, category_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [course_id, course_name, level || null, duration || null,
       price, instructor_id, category_id]
    );

    res.status(201).json({ message: "Course created" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Course ID already exists" });
    }
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "Invalid instructor or category" });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to create course" });
  }
});

// READ all courses
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.*, i.instructor_name, cat.category_name
      FROM course c
      LEFT JOIN instructor i ON c.instructor_id = i.instructor_id
      LEFT JOIN category cat ON c.category_id = cat.category_id
      ORDER BY c.course_name
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to read courses" });
  }
});


router.get("/:id/details", async (req, res) => {
  try {
    const courseId = req.params.id;

    // Get course with instructor and category
    const [courses] = await db.execute(
      `SELECT
         c.*,
         i.instructor_name,
         i.specialization,
         cat.category_name
       FROM course c
       LEFT JOIN instructor i
         ON c.instructor_id = i.instructor_id
       LEFT JOIN category cat
         ON c.category_id = cat.category_id
       WHERE c.course_id = ?`,
      [courseId]
    );

    if (courses.length === 0) {
      return res.status(404).json({
        error: "Course not found"
      });
    }

    // Get lessons
    const [lessons] = await db.execute(
      `SELECT lesson_id, lesson_title,
              lesson_duration, lesson_url
       FROM lesson
       WHERE course_id = ?
       ORDER BY lesson_id`,
      [courseId]
    );

    // Get assignments
    const [assignments] = await db.execute(
      `SELECT assignment_id, assignment_title,
              deadline, marks
       FROM assignment
       WHERE course_id = ?
       ORDER BY deadline`,
      [courseId]
    );

    // Get quizzes
    const [quizzes] = await db.execute(
      `SELECT quiz_id, total_marks, duration, quiz_date
       FROM quiz
       WHERE course_id = ?
       ORDER BY quiz_date`,
      [courseId]
    );

    res.json({
      course: courses[0],
      lessons,
      assignments,
      quizzes
    });
  } catch (error) {
    console.error("Course details error:", error.message);
    res.status(500).json({
      error: "Failed to load course details"
    });
  }
});


// READ one course
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM course WHERE course_id = ?",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Course not found" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to read course" });
  }
});

// UPDATE course
router.put("/:id", async (req, res) => {
  try {
    const { course_name, level, duration, price, instructor_id, category_id } = req.body;

    if (!course_name || !instructor_id || !category_id ||
        !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: "Invalid course details" });
    }

    const [result] = await db.execute(
      `UPDATE course
       SET course_name=?, level=?, duration=?, price=?,
           instructor_id=?, category_id=?
       WHERE course_id=?`,
      [course_name, level || null, duration || null,
       price, instructor_id, category_id, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json({ message: "Course updated" });
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "Invalid instructor or category" });
    }
    res.status(500).json({ error: "Failed to update course" });
  }
});

// DELETE course safely
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM course WHERE course_id = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json({ message: "Course deleted" });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        error: "Cannot delete a course with related records"
      });
    }
    res.status(500).json({ error: "Failed to delete course" });
  }
});

module.exports = router;