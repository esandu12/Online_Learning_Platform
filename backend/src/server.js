
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const authRoutes = require("./routes/authRoutes");
const instructorCourseRoutes = require("./routes/instructorCourseRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use("/api/instructor/courses", instructorCourseRoutes);

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Online Learning Platform API",
    status: "Running"
  });
});

// Database health check
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");

    res.json({
      status: "success",
      message: "MySQL connected successfully"
    });
  } catch (error) {
    console.error("Database error:", error.message);

    res.status(500).json({
      status: "error",
      message: "Database connection failed"
    });
  }
});

// Course CRUD routes
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/auth", authRoutes);

// Get all instructors
app.get("/api/instructors", async (req, res) => {
  try {
    const [instructors] = await db.query(
      `SELECT i.instructor_id, i.instructor_name
       FROM instructor i
       WHERE NOT EXISTS (
         SELECT 1 FROM auth_user u WHERE u.instructor_id=i.instructor_id
       ) OR EXISTS (
         SELECT 1 FROM auth_user u WHERE u.instructor_id=i.instructor_id AND u.status='active'
       )
       ORDER BY instructor_name`
    );

    res.json(instructors);
  } catch (error) {
    console.error("Instructor error:", error.message);

    res.status(500).json({
      error: "Failed to retrieve instructors"
    });
  }
});

// Get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const [categories] = await db.query(
      `SELECT category_id, category_name
       FROM category
       ORDER BY category_name`
    );

    res.json(categories);
  } catch (error) {
    console.error("Category error:", error.message);

    res.status(500).json({
      error: "Failed to retrieve categories"
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ error: "Request body must contain valid JSON" });
  }
  console.error("Unhandled API error:", error.message);
  res.status(500).json({ error: "Unexpected server error" });
});

// Start Express server
if (require.main === module) {
  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running at http://127.0.0.1:${PORT}`);
  });
}

module.exports = app;
