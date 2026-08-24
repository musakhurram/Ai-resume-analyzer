// Vercel serverless entry point.
//
// Vercel doesn't run `server.js` (that's for local dev / a persistent host
// like Render). Instead, anything exported from a file under /api becomes
// its own serverless function. This file re-uses the exact same Express
// `app` from src/app.js — no route/controller code duplicated or
// rewritten — and just adds the one thing serverless needs that a
// long-running process gets for free: making sure the DB connection is
// ready before Express handles the request.
require("dotenv").config();

const app = require("../src/app");
const connectToDB = require("../src/config/database");

module.exports = async (req, res) => {
  try {
    // No-ops after the first call on a warm container — see the caching
    // logic in src/config/database.js.
    await connectToDB();
  } catch (err) {
    console.error("Database connection failed:", err.message);
    return res.status(503).json({
      message: "Service temporarily unavailable — database connection failed",
    });
  }

  return app(req, res);
};
