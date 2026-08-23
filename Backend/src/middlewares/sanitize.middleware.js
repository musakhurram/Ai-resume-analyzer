// Strips keys starting with "$" or containing "." from request bodies and
// params, which is how NoSQL-injection payloads (e.g. { $gt: "" }) are
// smuggled into Mongo queries built from user input.
//
// We deliberately don't use the `express-mongo-sanitize` package here: it
// tries to reassign `req.query`, which Express 5 exposes as a getter-only
// property, and throws on every request. This does the same job for the
// request pieces this app actually trusts (body/params) without touching
// `req.query`.

function stripBadKeys(value) {
  if (Array.isArray(value)) {
    return value.map(stripBadKeys);
  }

  if (value && typeof value === "object" && !(value instanceof Buffer)) {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith("$") || key.includes(".")) continue;
      clean[key] = stripBadKeys(val);
    }
    return clean;
  }

  return value;
}

function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = stripBadKeys(req.body);
  }
  if (req.params && typeof req.params === "object") {
    req.params = stripBadKeys(req.params);
  }
  next();
}

module.exports = sanitizeInput;
