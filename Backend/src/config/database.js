const mongoose = require("mongoose");
const env = require("./env");

mongoose.set("strictQuery", true);

// On a long-running server (Render/Railway/local) this connects once at
// boot. On Vercel, every request can hit a fresh serverless invocation —
// without caching, that would open a brand new MongoDB connection on
// every request and exhaust Atlas's connection limit within minutes.
// This module-level cache persists across invocations on a warm
// container, so connectToDB() becomes a no-op after the first call.
let connectionPromise = null;

async function connectToDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        // Serverless-friendly pool size — many short-lived function
        // instances can run concurrently, so keep each one's pool small
        // rather than the default of 100.
        maxPoolSize: 10,
      })
      .then((conn) => {
        console.log("Connected to database");
        return conn;
      })
      .catch((err) => {
        connectionPromise = null; // allow retry on the next request
        console.error("Database connection failed:", err.message);
        throw err;
      });
  }

  return connectionPromise;
}

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

module.exports = connectToDB;
