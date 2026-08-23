require("dotenv").config();
const env = require("./src/config/env");
const app = require("./src/app");
const connectToDB = require("./src/config/database");

connectToDB();

const server = app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT} [${env.NODE_ENV}]`);
});

// Prevent silent crashes in production — log and exit so the process
// manager (Docker/Render/PM2/etc.) can restart cleanly.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => process.exit(0));
});
