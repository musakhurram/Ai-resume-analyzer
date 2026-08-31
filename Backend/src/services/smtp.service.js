const nodemailer = require("nodemailer");
const env = require("../config/env");
let transporter = null;

function smtpEnabled() { return String(env.SMTP_ENABLED).toLowerCase() === "true"; }
function requireSmtpConfig() {
  const missing = ["SMTP_USER", "SMTP_PASSWORD"].filter((key) => !env[key]);
  if (missing.length) throw new Error(`SMTP is enabled but missing: ${missing.join(", ")}`);
}
function getTransporter() {
  if (!smtpEnabled()) return null;
  requireSmtpConfig();
  if (!transporter) transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    requireTLS: env.SMTP_PORT === 587,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
  return transporter;
}
async function verifySmtpConnection() {
  if (!smtpEnabled()) return { enabled: false, verified: false };
  await getTransporter().verify();
  return { enabled: true, verified: true };
}
function safe(value) { return String(value || "").replace(/[\r\n<>]/g, " ").trim(); }
async function sendEmail({ to, subject, text, html, attachments }) {
  if (!smtpEnabled()) throw new Error("SMTP is not enabled.");
  const recipient = safe(to);
  if (!recipient) throw new Error("Email recipient is required.");
  const info = await getTransporter().sendMail({ from: env.SMTP_FROM || env.SMTP_USER, to: recipient, subject: safe(subject) || "AI Resume Analyzer", text, html, attachments });
  const accepted = Array.isArray(info.accepted) ? info.accepted : [];
  if (!accepted.some((a) => String(a).toLowerCase() === recipient.toLowerCase())) throw new Error(`SMTP did not accept recipient ${recipient}.`);
  console.log(`Email accepted by Gmail for ${recipient}. Message ID: ${info.messageId}`);
  return { accepted: true, messageId: info.messageId, acceptedRecipients: accepted, rejectedRecipients: info.rejected || [], response: info.response };
}
async function sendWelcomeEmail({ to, username }) {
  const name = safe(username) || "there";
  return sendEmail({ to, subject: "Welcome to AI Resume Analyzer", text: `Hi ${name},\n\nYour account has been created successfully. You can now analyze and improve your resumes.\n\nThanks,\nAI Resume Analyzer`, html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Welcome to AI Resume Analyzer</h2><p>Hi ${name},</p><p>Your account has been created successfully. You can now analyze and improve your resumes.</p><p>Thanks,<br>AI Resume Analyzer</p></div>` });
}
async function sendVerificationEmail({ to, username, verificationUrl }) {
  const name = safe(username) || "there";
  return sendEmail({ to, subject: "Verify your AI Resume Analyzer email", text: `Hi ${name},\n\nVerify your email: ${verificationUrl}\n\nThis link expires in 30 minutes.`, html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Verify your email</h2><p>Hi ${name},</p><p><a href="${verificationUrl}">Verify my email</a></p><p>This link expires in 30 minutes.</p></div>` });
}
async function sendPasswordResetEmail({ to, username, resetUrl }) {
  const name = safe(username) || "there";
  return sendEmail({ to, subject: "Reset your AI Resume Analyzer password", text: `Hi ${name},\n\nReset your password here: ${resetUrl}\n\nThis link expires in 15 minutes.`, html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Password reset</h2><p>Hi ${name},</p><p><a href="${resetUrl}">Reset my password</a></p><p>This link expires in 15 minutes.</p></div>` });
}
async function sendSecurityAlertEmail({ to, username, event }) {
  const name = safe(username) || "there";
  const action = safe(event);
  return sendEmail({ to, subject: "Security alert — AI Resume Analyzer", text: `Hi ${name},\n\nSecurity activity was detected: ${action}\n\nIf this wasn't you, reset your password.`, html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Security alert</h2><p>Hi ${name},</p><p>Security activity was detected:</p><p><strong>${action}</strong></p><p>If this wasn't you, reset your password.</p></div>` });
}
module.exports = { sendEmail, sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail, sendSecurityAlertEmail, verifySmtpConnection, smtpEnabled };
