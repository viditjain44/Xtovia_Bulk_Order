const { app, connectDB, missingConfig } = require("./app");

const missing = missingConfig();
if (missing.length) {
  console.error(
    `Missing ${missing.join(", ")}. Copy server/.env.example to server/.env and fill it in.`
  );
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  });
