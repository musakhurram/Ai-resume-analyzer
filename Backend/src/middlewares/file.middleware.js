const multer = require("multer");

// Restrict uploads to PDF only (by mimetype AND extension) and cap size —
// unrestricted uploads are a common vector for abuse/storage exhaustion.
function fileFilter(req, file, cb) {
  const isPdfMime = file.mimetype === "application/pdf";
  const isPdfExt = file.originalname?.toLowerCase().endsWith(".pdf");

  if (isPdfMime && isPdfExt) {
    return cb(null, true);
  }
  const err = new Error("Only PDF files are allowed");
  err.status = 400;
  return cb(err);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB
  },
  fileFilter,
});

module.exports = upload;
