const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const env = require("../config/env");

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

function getOAuthClient() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET || !env.GOOGLE_OAUTH_REDIRECT_URI) {
    const error = new Error("Google Gmail OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET and GOOGLE_OAUTH_REDIRECT_URI.");
    error.code = "GMAIL_OAUTH_NOT_CONFIGURED";
    throw error;
  }
  return new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_OAUTH_CLIENT_SECRET, env.GOOGLE_OAUTH_REDIRECT_URI);
}

function getEncryptionKey() { return crypto.createHash("sha256").update(env.JWT_SECRET).digest(); }

function encryptRefreshToken(token) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(token), "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptRefreshToken(value) {
  const [ivPart, tagPart, dataPart] = String(value || "").split(".");
  if (!ivPart || !tagPart || !dataPart) {
    const error = new Error("Invalid stored Gmail OAuth token.");
    error.code = "GMAIL_TOKEN_INVALID";
    throw error;
  }
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(dataPart, "base64url")), decipher.final()]).toString("utf8");
  } catch (cause) {
    const error = new Error("The stored Gmail connection is no longer valid.");
    error.code = "GMAIL_TOKEN_INVALID";
    error.cause = cause;
    throw error;
  }
}

function buildAuthorizationUrl(state) {
  return getOAuthClient().generateAuthUrl({ access_type: "offline", prompt: "consent", include_granted_scopes: true, scope: [GMAIL_SEND_SCOPE, "openid", "email"], state });
}

async function exchangeCode(code) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    const error = new Error("Google did not return a refresh token. Reconnect Gmail and grant the requested permission again.");
    error.code = "GMAIL_REFRESH_TOKEN_MISSING";
    throw error;
  }
  const response = await fetch(GOOGLE_USERINFO_URL, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  if (!response.ok) throw new Error("Unable to determine the Google account email.");
  const profile = await response.json();
  if (!profile?.email) throw new Error("Unable to determine the Google account email.");
  return { email: profile.email.toLowerCase(), refreshToken: tokens.refresh_token };
}

async function getAccessToken(refreshToken) {
  const decryptedRefreshToken = decryptRefreshToken(refreshToken);
  const client = getOAuthClient();
  client.setCredentials({ refresh_token: decryptedRefreshToken });
  try {
    const { credentials } = await client.refreshAccessToken();
    const token = credentials?.access_token;
    if (!token) {
      const error = new Error("Google did not return a Gmail access token.");
      error.code = "GMAIL_REFRESH_TOKEN_REVOKED";
      throw error;
    }
    return { accessToken: token, refreshToken: credentials.refresh_token || decryptedRefreshToken };
  } catch (cause) {
    const googleError = cause?.response?.data || cause?.response?.body || {};
    const googleCode = googleError?.error || cause?.code;
    const message = String(googleError?.error_description || cause?.message || "").toLowerCase();
    if (googleCode === "invalid_grant" || message.includes("invalid_grant") || message.includes("token has been expired or revoked")) {
      const error = new Error("Your Gmail authorization has expired or was revoked.");
      error.code = "GMAIL_REFRESH_TOKEN_REVOKED";
      error.cause = cause;
      throw error;
    }
    throw cause;
  }
}

async function getGmailAccountEmail(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.email) {
    const error = new Error("Unable to verify the connected Gmail account.");
    error.code = response.status || 401;
    error.response = { status: response.status || 401, data };
    throw error;
  }
  return String(data.email).trim().toLowerCase();
}

function buildRawMessage({ from, to, subject, text, attachment }) {
  const boundary = `=_ResumeAnalyzer_${crypto.randomBytes(12).toString("hex")}`;
  const safe = (value) => String(value || "").replace(/[\r\n]/g, " ");
  const encodedAttachment = Buffer.isBuffer(attachment.content) ? attachment.content.toString("base64") : Buffer.from(attachment.content).toString("base64");
  const lines = [
    `From: ${safe(from)}`,
    `To: ${safe(to)}`,
    `Subject: ${safe(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    String(text || "Please find my resume attached."),
    "",
    `--${boundary}`,
    `Content-Type: ${safe(attachment.contentType || "application/pdf")}; name="${safe(attachment.filename)}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${safe(attachment.filename)}"`,
    "",
  ];
  for (let i = 0; i < encodedAttachment.length; i += 76) lines.push(encodedAttachment.slice(i, i + 76));
  lines.push("", `--${boundary}--`);
  return Buffer.from(lines.join("\r\n"), "utf8").toString("base64url");
}

async function sendWithAccessToken(accessToken, raw) {
  const response = await fetch(GMAIL_SEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function sendGmailMessage({ refreshToken, from, to, subject, text, attachment }) {
  const tokenResult = await getAccessToken(refreshToken);
  const gmailAccountEmail = await getGmailAccountEmail(tokenResult.accessToken);
  const requestedFrom = String(from || "").trim().toLowerCase();
  if (requestedFrom && requestedFrom !== gmailAccountEmail) {
    const error = new Error("The connected Gmail account does not match the selected sender email.");
    error.code = "GMAIL_SENDER_MISMATCH";
    error.statusCode = 409;
    throw error;
  }

  const raw = buildRawMessage({ from: gmailAccountEmail, to, subject, text, attachment });
  let { response, data } = await sendWithAccessToken(tokenResult.accessToken, raw);
  if (response.status === 401) ({ response, data } = await sendWithAccessToken((await getAccessToken(refreshToken)).accessToken, raw));

  if (!response.ok) {
    const error = new Error(data?.error?.message || "Gmail rejected the message.");
    error.code = response.status;
    error.response = { status: response.status, data };
    throw error;
  }
  return { messageId: data.id, threadId: data.threadId, senderEmail: gmailAccountEmail };
}

module.exports = { GMAIL_SEND_SCOPE, buildAuthorizationUrl, exchangeCode, encryptRefreshToken, sendGmailMessage };
