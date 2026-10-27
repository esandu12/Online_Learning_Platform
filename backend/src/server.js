
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

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

// Get all instructors
app.get("/api/instructors", async (req, res) => {
  try {
    const [instructors] = await db.query(
      `SELECT instructor_id, instructor_name
       FROM instructor
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

// Start Express server
app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `Server running at http://127.0.0.1:${PORT}`
  );
});
