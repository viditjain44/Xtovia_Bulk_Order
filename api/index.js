// Vercel runs the Express app as a serverless function for every /api request.
const { app } = require("../server/src/app");

module.exports = app;
