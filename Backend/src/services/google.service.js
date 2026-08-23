const { OAuth2Client } = require("google-auth-library");
const env = require("../config/env");

const client = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

/**
 * Verifies a Google ID token (sent from the frontend's Google Identity
 * Services button) and returns the verified payload.
 * Throws if Google Sign-In isn't configured or the token is invalid.
 */
async function verifyGoogleIdToken(idToken) {
  if (!client) {
    const err = new Error("Google Sign-In is not configured on this server");
    err.status = 501;
    throw err;
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    const err = new Error("Invalid Google token");
    err.status = 401;
    throw err;
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified,
    name: payload.name,
    picture: payload.picture,
  };
}

module.exports = { verifyGoogleIdToken };
