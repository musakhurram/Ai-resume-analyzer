const crypto = require("crypto");
const { google } = require("googleapis");
const env = require("../config/env");

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

function getOAuthClient() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET || !env.GOOGLE_OAUTH_REDIRECT_URI) {
    const error = new Error("Google Gmail OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET and GOOGLE_OAUTH_REDIRECT_URI.");
    error.code = "GMAIL_OAUTH_NOT_CONFIGURED";
    throw error;
  }
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_OAUTH_CLIENT_SECRET,
    env.GOOGLE_OAUTH_REDIRECT_URI,
  );
}

function getEncryptionKey() {
  return crypto.createHash("sha256").update(env.JWT_SECRET).digest();
}

function encryptRefreshToken(token) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(token), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptRefreshToken(value) {
  const [ivPart, tagPart, dataPart] = String(value || "").split(".");
  if (!ivPart || !tagPart || !dataPart) throw new Error("Invalid stored Gmail OAuth token.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataPart, "base64url")), decipher.final()]).toString("utf8");
}

function buildAuthorizationUrl(state) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: [GMAIL_SEND_SCOPE, "openid", "email"],
    state,
  });
}

async function exchangeCode(code) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    const error = new Error("Google did not return a refresh token. Please revoke the existing Gmail connection and try again.");
    error.code = "GMAIL_REFRESH_TOKEN_MISSING";
    throw error;
  }
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data: profile } = await oauth2.userinfo.get();
  if (!profile?.email) throw new Error("Unable to determine the Google account email.");
  return { email: profile.email.toLowerCase(), refreshToken: tokens.refresh_token };
}

async function sendGmailMessage({ refreshToken, from, to, subject, text, attachment }) {
  const client = getOAuthClient();
  client.setCredentials({ refresh_token: decryptRefreshToken(refreshToken) });
  const gmail = google.gmail({ version: "v1", auth: client });
  const boundary = `=_ResumeAnalyzer_${crypto.randomBytes(12).toString("hex")}`;
  const safe = (value) => String(value || "").replace(/[\r\n]/g, " ");
  const body = Buffer.isBuffer(attachment.content) ? attachment.content.toString("base64") : Buffer.from(attachment.content).toString("base64");
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
  for (let i = 0; i < body.length; i += 76) lines.push(body.slice(i, i + 76));
  lines.push("", `--${boundary}--`);
  const raw = Buffer.from(lines.join("\r\n"), "utf8").toString("base64url");
  const response = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  return { messageId: response.data.id, threadId: response.data.threadId };
}

module.exports = {
  GMAIL_SEND_SCOPE,
  getOAuthClient,
  buildAuthorizationUrl,
  exchangeCode,
  encryptRefreshToken,
  sendGmailMessage,
};
