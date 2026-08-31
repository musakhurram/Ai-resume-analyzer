// Validates required environment variables once at boot so the app fails fast.
const REQUIRED_IN_ALL_ENVS = ["MONGO_URI", "JWT_SECRET", "GOOGLE_GENAI_API_KEY"];
const RECOMMENDED = ["GOOGLE_CLIENT_ID"];

function loadEnv() {
  const missing = REQUIRED_IN_ALL_ENVS.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing required environment variable(s): ${missing.join(", ")}.`);
  const missingRecommended = RECOMMENDED.filter((key) => !process.env[key]);
  if (missingRecommended.length) console.warn(`Warning: ${missingRecommended.join(", ")} not set — Google Sign-In will be disabled.`);
  if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET is too short for production use. Use at least 32 random characters.");
  }
  return {
    PORT: Number(process.env.PORT) || 3000,
    NODE_ENV: process.env.NODE_ENV || "development",
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
    SMTP_ENABLED: process.env.SMTP_ENABLED || "false",
    SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
    SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
    SMTP_USER: process.env.SMTP_USER || "",
    // Google App Passwords are sometimes copied with spaces. Normalize them
    // so a pasted 16-character App Password works reliably on Vercel.
    SMTP_PASSWORD: String(process.env.SMTP_PASSWORD || "").replace(/\s/g, ""),
    SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER || "",
  };
}
module.exports = loadEnv();
