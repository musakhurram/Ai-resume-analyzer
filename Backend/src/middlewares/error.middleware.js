const env = require("../config/env");

function notFoundHandler(req, res) {
  res.status(404).json({ message: "Route not found" });
}

// Centralized error handler — keeps stack traces out of API responses in
// production and normalizes common error shapes (Mongo, Multer, JWT).
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  // Multer errors (file too large, unexpected field, etc.)
  if (err.name === "MulterError") {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || { field: 1 })[0];
    return res.status(409).json({ message: `That ${field} is already in use` });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ message });
  }

  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    message: status === 500 ? "Internal server error" : err.message,
    ...(env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

module.exports = { notFoundHandler, errorHandler };
