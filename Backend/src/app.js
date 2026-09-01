// MUST run before any other require in this chain. The interview routes
// pull in pdf-parse, which references DOMMatrix in Node.
if (typeof globalThis.DOMMatrix === "undefined") {
  globalThis.DOMMatrix = require("dommatrix");
}

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const stripe = require("stripe");
const compression = require("compression");
const morgan = require("morgan");
const env = require("./config/env");
const sanitizeInput = require("./middlewares/sanitize.middleware");
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");
const { generalLimiter } = require("./middlewares/rateLimit.middleware");
const { stripeWebhookController } = require("./controllers/stripe.controller");

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(compression());

// CLIENT_URL is the source of truth. Keep the current production frontend
// domains here as a safe fallback so an outdated/missing CLIENT_URL cannot
// break every authenticated request with a 500 CORS error.
const configuredOrigins = String(env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);
const productionFrontendOrigins = [
  "https://ai-resume-analyzer-lemon-three.vercel.app",
  "https://ai-resume-analyzer-musa-ba96.vercel.app",
  "https://ai-resume-analyzer-git-main-musa-ba96.vercel.app",
];
const allowedOrigins = new Set([...configuredOrigins, ...productionFrontendOrigins]);

app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = String(origin || "").replace(/\/$/, "");
      if (!origin || allowedOrigins.has(normalizedOrigin)) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }),
);

// Stripe requires the exact raw request body for webhook signature verification.
// This route must be registered before express.json().
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookController);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(sanitizeInput);

if (env.NODE_ENV !== "production") app.use(morgan("dev"));
app.use(generalLimiter);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", env: env.NODE_ENV });
});

const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");
const atsRouter = require("./routes/atsAnalyze.routes");
const stripeRouter = require("./routes/stripe.routes");

app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/resume", atsRouter);
app.use("/api/stripe", stripeRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
