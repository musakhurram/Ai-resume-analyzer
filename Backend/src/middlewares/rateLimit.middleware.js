const rateLimit = require("express-rate-limit");

// Generous general limiter — protects against basic abuse/scraping.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter limiter for login/register/google — slows down brute-force and
// credential-stuffing attempts without blocking normal usage.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

// Strict limiter for AI report generation — each request costs real money
// against the Gemini API, so this is the most important one to cap.
const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "You've reached the hourly limit for generating reports. Please try again later.",
  },
});

module.exports = { generalLimiter, authLimiter, aiGenerationLimiter };
