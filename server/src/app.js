require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const enquiryRoutes = require("./routes/enquiries");
const adminRoutes = require("./routes/admin");

function missingConfig() {
  return ["MONGODB_URI", "ADMIN_PASSWORD", "JWT_SECRET"].filter((key) => !process.env[key]);
}

// Reused across requests so serverless hosts don't open a new connection each time.
let connection = null;
function connectDB() {
  if (!connection) {
    connection = mongoose
      .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .catch((error) => {
        connection = null;
        throw error;
      });
  }
  return connection;
}

const app = express();

// Behind Vercel's proxy the visitor's address arrives in X-Forwarded-For.
if (process.env.VERCEL) app.set("trust proxy", 1);

// Only needed when the frontend is hosted on a different domain from this API.
// Accepts one URL or several separated by commas.
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
if (allowedOrigins.length) app.use("/api", cors({ origin: allowedOrigins }));

app.use(express.json({ limit: "10kb" }));

app.use("/api", async (req, res, next) => {
  const missing = missingConfig();
  if (missing.length) {
    console.error(`Missing environment variables: ${missing.join(", ")}`);
    return res.status(500).json({ message: "The server is not configured yet." });
  }
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    res.status(503).json({ message: "We can't reach the database right now. Please try again." });
  }
});

app.use("/api/enquiries", enquiryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", (req, res) => res.status(404).json({ message: "Not found." }));

// When run as a normal Node server, it also serves the built React app.
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (!process.env.VERCEL && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid request." });
  }
  console.error(error);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

module.exports = { app, connectDB, missingConfig };
