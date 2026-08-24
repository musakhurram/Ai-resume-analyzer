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

// IMPORTANT: requiring app.js can throw synchronously (e.g. env.js throws
// if a required env var is missing). If that require lived at the top
// level of this module, the throw would happen during cold-start module
// loading — before the exported handler function even runs — which
// crashes the whole function with an opaque FUNCTION_INVOCATION_FAILED
// and, on some Vercel plans, no visible log for that failure. Loading it
// lazily inside the handler, wrapped in try/catch, turns that into a
// normal caught error we can log and return as a real response instead.
let app;
let connectToDB;
let loadError;

function loadDependencies() {
  if (app || loadError) return; // only attempt once per warm container
  try {
    app = require("../src/app");
    connectToDB = require("../src/config/database");
  } catch (err) {
    loadError = err;
  }
}

module.exports = async (req, res) => {
  loadDependencies();

  if (loadError) {
    console.error("Startup failed:", loadError.message);
    return res.status(500).json({
      message: "Server failed to start",
      // Safe to expose: these are our own thrown startup errors (missing
      // env vars, etc.), never a stack trace from user-triggered code.
      error: loadError.message,
    });
  }

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
