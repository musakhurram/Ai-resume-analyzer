const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter = null;

function smtpEnabled() {
  return String(env.SMTP_ENABLED).toLowerCase() === "true";
}

function requireSmtpConfig() {
  const required = ["SMTP_USER", "SMTP_PASSWORD"];
  const missing = required.filter((key) => !env[key]);

  if (missing.length) {
    throw new Error(`SMTP is enabled but missing: ${missing.join(", ")}`);
  }
}

function getTransporter() {
  if (!smtpEnabled()) return null;
  requireSmtpConfig();

  if (!transporter) {
    // Nodemailer manages Gmail's TLS connection, AUTH negotiation,
    // SMTP response parsing, message formatting, and connection cleanup.
    // App Password authentication is supported when 2-Step Verification
    // is enabled on the Gmail account.
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }

  return transporter;
}

async function verifySmtpConnection() {
  if (!smtpEnabled()) {
    return { enabled: false, verified: false };
  }

  const mailer = getTransporter();
  await mailer.verify();
  return { enabled: true, verified: true };
}

function escapeName(value) {
  return String(value || "").replace(/[\r\n]/g, " ").trim();
}

function buildFromAddress() {
  // SMTP_FROM is optional. If supplied, it can include a display name.
  // The actual mailbox defaults to the authenticated Gmail account.
  return env.SMTP_FROM || env.SMTP_USER;
}

async function sendEmail({ to, subject, text, html }) {
  if (!smtpEnabled()) {
    throw new Error(
      "SMTP is not enabled. Set SMTP_ENABLED=true and configure the Gmail SMTP environment variables.",
    );
  }

  const mailer = getTransporter();
  const recipient = escapeName(to);

  if (!recipient) {
    throw new Error("Email recipient is required.");
  }

  const info = await mailer.sendMail({
    from: buildFromAddress(),
    to: recipient,
    subject: String(subject || "AI Resume Analyzer"),
    text: text || undefined,
    html: html || undefined,
  });

  // Gmail/Nodemailer returns accepted/rejected recipients and a messageId.
  // Treat a recipient that wasn't accepted as a delivery failure instead of
  // reporting success merely because the SMTP connection was established.
  const accepted = Array.isArray(info.accepted) ? info.accepted : [];
  const rejected = Array.isArray(info.rejected) ? info.rejected : [];

  if (!accepted.some((address) => String(address).toLowerCase() === recipient.toLowerCase())) {
    throw new Error(
      `SMTP accepted no delivery recipient. Rejected: ${rejected.join(", ") || "unknown recipient"}`,
    );
  }

  console.log(`Email accepted by Gmail for ${recipient}. Message ID: ${info.messageId}`);

  return {
    accepted: true,
    messageId: info.messageId,
    acceptedRecipients: accepted,
    rejectedRecipients: rejected,
    response: info.response,
  };
}

async function sendWelcomeEmail({ to, username }) {
  const safeName = escapeName(username) || "there";

  return sendEmail({
    to,
    subject: "Welcome to AI Resume Analyzer",
    text: `Hi ${safeName},\n\nYour AI Resume Analyzer account has been created successfully. You can now analyze and improve your resumes.\n\nThanks,\nAI Resume Analyzer`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Welcome to AI Resume Analyzer</h2><p>Hi ${safeName},</p><p>Your account has been created successfully. You can now analyze and improve your resumes.</p><p>Thanks,<br>AI Resume Analyzer</p></div>`,
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  verifySmtpConnection,
  smtpEnabled,
};
