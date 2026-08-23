const mongoose = require("mongoose");
const env = require("./env");

mongoose.set("strictQuery", true);

async function connectToDB() {
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("Connected to database");
  } catch (err) {
    console.error("Database connection failed:", err.message);
    // Fail fast — an API that can't reach its database should not stay up
    // pretending to be healthy.
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

module.exports = connectToDB;
