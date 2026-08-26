// MUST run before any other require in this chain. The interview routes
// pull in the "pdf-parse" package (for resume text extraction), which
// internally uses pdfjs-dist — and pdfjs-dist references the browser's
// DOMMatrix API even for plain text extraction with no rendering
// involved. Node has no such global, so without this polyfill, simply
// requiring pdf-parse throws "DOMMatrix is not defined" and crashes the
// whole app at startup (this is what caused the serverless function to
// crash with empty logs on Vercel — the throw happened during module
// loading, before any request was even handled).
if (typeof globalThis.DOMMatrix === "undefined") {
  globalThis.DOMMatrix = require("dommatrix");
}

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const env = require("./config/env");
const sanitizeInput = require("./middlewares/sanitize.middleware");
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");
const { generalLimiter } = require("./middlewares/rateLimit.middleware");

const app = express();

// Needed on platforms like Render/Railway/Heroku that sit behind a reverse
// proxy, so `secure` cookies and rate-limiting by IP work correctly.
app.set("trust proxy", 1);

app.use(helmet());
app.use(compression());

const allowedOrigins = env.CLIENT_URL.split(",").map((o) => o.trim());
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (curl, health checks) with no Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(sanitizeInput);

if (env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(generalLimiter);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", env: env.NODE_ENV });
});

/* Routes */
const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");
const atsRouter = require("./routes/atsAnalyze.routes");

app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/resume", atsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
