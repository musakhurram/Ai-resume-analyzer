// Local dev / persistent-host entry point (Render, Railway, a VPS, etc.).
// Vercel does NOT run this file — it calls api/index.js instead, which
// wraps the same Express app in a serverless-compatible handler. Keep
// this file for everywhere else you might run the server.
require("dotenv").config();
const env = require("./src/config/env");
const app = require("./src/app");
const connectToDB = require("./src/config/database");

connectToDB().catch(() => {
  // connectToDB() already logs the error. On a persistent server, an API
  // that can't reach its database shouldn't stay up pretending to be
  // healthy, so exit here and let the process manager restart it.
  process.exit(1);
});

const server = app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT} [${env.NODE_ENV}]`);
});

// Prevent silent crashes in production — log and exit so the process
// manager (Docker/Render/PM2/etc.) can restart cleanly.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => process.exit(0));
});
