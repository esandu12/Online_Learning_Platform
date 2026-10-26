require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const courseRoutes = require("./routes/courseRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Test database connection
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");

    res.json({
      status: "success",
      message: "MySQL connected successfully",
    });
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

 
const PORT = process.env.PORT || 5001;


app.use("/api/courses", courseRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});