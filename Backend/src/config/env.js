// Validates required environment variables once at boot so the app fails
// fast with a clear error instead of crashing unpredictably later (e.g. a
// jwt.sign() call throwing deep inside a request with an undefined secret).

const REQUIRED_IN_ALL_ENVS = ["MONGO_URI", "JWT_SECRET", "GOOGLE_GENAI_API_KEY"];

// Google Sign-In only works if this is set — warn but don't hard-crash dev
// setups that don't need it yet.
const RECOMMENDED = ["GOOGLE_CLIENT_ID"];

function loadEnv() {
  const missing = REQUIRED_IN_ALL_ENVS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variable(s): ${missing.join(", ")}.\n` +
        "Copy .env.example to .env and fill in real values before starting the server.",
    );
    process.exit(1);
  }

  const missingRecommended = RECOMMENDED.filter((key) => !process.env[key]);
  if (missingRecommended.length > 0) {
    console.warn(
      `Warning: ${missingRecommended.join(", ")} not set — Google Sign-In will be disabled.`,
    );
  }

  if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32) {
    console.error(
      "JWT_SECRET is too short for production use. Use at least 32 random characters.",
    );
    process.exit(1);
  }

  return {
    PORT: Number(process.env.PORT) || 3000,
    NODE_ENV: process.env.NODE_ENV || "development",
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || null,
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  };
}

module.exports = loadEnv();
