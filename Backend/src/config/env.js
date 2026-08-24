// Validates required environment variables once at boot so the app fails
// fast with a clear error instead of crashing unpredictably later (e.g. a
// jwt.sign() call throwing deep inside a request with an undefined secret).
//
// This throws rather than calling process.exit(): on a long-running server
// (Render/Railway/local) an uncaught throw at require-time still crashes
// the process the same way, but on Vercel's serverless runtime,
// process.exit() inside a function invocation can kill the whole
// container abruptly instead of returning a clean error response — so
// throwing is the version that behaves correctly on both.

const REQUIRED_IN_ALL_ENVS = ["MONGO_URI", "JWT_SECRET", "GOOGLE_GENAI_API_KEY"];

// Google Sign-In only works if this is set — warn but don't hard-crash dev
// setups that don't need it yet.
const RECOMMENDED = ["GOOGLE_CLIENT_ID"];

function loadEnv() {
  const missing = REQUIRED_IN_ALL_ENVS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}.\n` +
        "Set these in your platform's environment variable settings (or .env locally) before starting the server.",
    );
  }

  const missingRecommended = RECOMMENDED.filter((key) => !process.env[key]);
  if (missingRecommended.length > 0) {
    console.warn(
      `Warning: ${missingRecommended.join(", ")} not set — Google Sign-In will be disabled.`,
    );
  }

  if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "JWT_SECRET is too short for production use. Use at least 32 random characters.",
    );
  }

  return {
    PORT: Number(process.env.PORT) || 3000,
    NODE_ENV: process.env.NODE_ENV || "development",
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ,
    CLIENT_URL: process.env.CLIENT_URL ,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  };
}

module.exports = loadEnv();
