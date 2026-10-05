require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");

const enquiryRoutes = require("./routes/enquiries");
const adminRoutes = require("./routes/admin");

const { PORT = 5000, MONGODB_URI, ADMIN_PASSWORD, JWT_SECRET } = process.env;

for (const [key, value] of Object.entries({ MONGODB_URI, ADMIN_PASSWORD, JWT_SECRET })) {
  if (!value) {
    console.error(`Missing ${key}. Copy server/.env.example to server/.env and fill it in.`);
    process.exit(1);
  }
}

const app = express();
app.use(express.json({ limit: "10kb" }));

app.use("/api/enquiries", enquiryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", (req, res) => res.status(404).json({ message: "Not found." }));

// In production the server also serves the built React app.
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
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

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  });
