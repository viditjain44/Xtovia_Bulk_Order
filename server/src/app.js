
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const enquiryRoutes = require("./routes/enquiries");
const adminRoutes = require("./routes/admin");

function missingConfig() {
  return ["MONGODB_URI", "ADMIN_PASSWORD", "JWT_SECRET"].filter(
    (key) => !process.env[key]
  );
}

// Reuse the MongoDB connection across serverless invocations.
let connection = null;

function connectDB() {
  if (!connection) {
    connection = mongoose
      .connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      })
      .catch((error) => {
        connection = null;
        throw error;
      });
  }

  return connection;
}

const app = express();

// Configure proxy trust for Vercel.
if (process.env.VERCEL) {
  app.set("trust proxy", 1);
}

// CORS configuration.
const allowedOrigins = [
  "http://localhost:5173",
  "https://xtovia-bulk-order.vercel.app",
];

app.use(
  "/api",
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse incoming JSON requests.
app.use(express.json({ limit: "10kb" }));

// Check environment variables and connect to MongoDB for API requests.
app.use("/api", async (req, res, next) => {
  const missing = missingConfig();

  if (missing.length > 0) {
    console.error(
      `Missing environment variables: ${missing.join(", ")}`
    );

    return res.status(500).json({
      message: "The server is not configured yet.",
    });
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);

    return res.status(503).json({
      message:
        "We can't reach the database right now. Please try again.",
    });
  }
});

// Health-check route.
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Xtovia Bulk Order API is running",
  });
});

// API routes.
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/admin", adminRoutes);

// Handle unknown API endpoints.
app.use("/api", (req, res) => {
  res.status(404).json({
    message: "Not found.",
  });
});

// Serve the React frontend when running locally.
const clientDist = path.join(
  __dirname,
  "..",
  "..",
  "client",
  "dist"
);

if (!process.env.VERCEL && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Global error handler.
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Invalid request.",
    });
  }

  console.error(error);

  return res.status(500).json({
    message: "Something went wrong. Please try again.",
  });
});

// Export the Express app for Vercel.
module.exports = app;
module.exports.connectDB = connectDB;
module.exports.missingConfig = missingConfig;
