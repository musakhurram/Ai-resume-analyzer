const tls = require("tls");
const env = require("../config/env");

function smtpEnabled() {
  return String(env.SMTP_ENABLED).toLowerCase() === "true";
}

function requireSmtpConfig() {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"];
  const missing = required.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`SMTP is enabled but missing: ${missing.join(", ")}`);
  }
}

function readResponse(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (/^\d{3} /.test(line)) {
          cleanup();
          const code = Number(line.slice(0, 3));
          if (code >= 400) reject(new Error(`SMTP ${code}: ${line.slice(4)}`));
          else resolve(code);
          return;
        }
      }
    };
    const onError = (err) => { cleanup(); reject(err); };
    const onClose = () => { cleanup(); reject(new Error("SMTP connection closed unexpectedly")); };
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
    };
    socket.on("data", onData);
    socket.once("error", onError);
    socket.once("close", onClose);
  });
}

async function command(socket, value, expected) {
  socket.write(`${value}\r\n`);
  const code = await readResponse(socket);
  if (expected && !expected.includes(code)) throw new Error(`Unexpected SMTP response: ${code}`);
  return code;
}

function escapeHeader(value) {
  return String(value || "").replace(/[\r\n]/g, " ").trim();
}

function encodeSubject(subject) {
  return `=?UTF-8?B?${Buffer.from(String(subject || "")).toString("base64")}?=`;
}

function htmlToText(html) {
  return String(html || "")
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

async function sendEmail({ to, subject, text, html }) {
  if (!smtpEnabled()) {
    throw new Error("SMTP is not enabled. Set SMTP_ENABLED=true and configure Gmail SMTP environment variables.");
  }
  requireSmtpConfig();

  const host = env.SMTP_HOST;
  const port = Number(env.SMTP_PORT) || 465;
  const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: true });

  try {
    await readResponse(socket);
    await command(socket, `EHLO ${env.SMTP_HELO || "ai-resume-analyzer"}`, [250]);
    await command(socket, "AUTH LOGIN", [334]);
    await command(socket, Buffer.from(env.SMTP_USER).toString("base64"), [334]);
    await command(socket, Buffer.from(env.SMTP_PASSWORD).toString("base64"), [235]);
    await command(socket, `MAIL FROM:<${escapeHeader(env.SMTP_FROM_EMAIL || env.SMTP_USER)}>`, [250]);
    await command(socket, `RCPT TO:<${escapeHeader(to)}>`, [250, 251]);

    const from = escapeHeader(env.SMTP_FROM || env.SMTP_USER);
    const plain = text || htmlToText(html);
    const bodyHtml = html || `<p>${String(plain).replace(/\n/g, "<br>")}</p>`;
    const message = [
      `From: ${from}`,
      `To: ${escapeHeader(to)}`,
      `Subject: ${encodeSubject(subject)}`,
      "MIME-Version: 1.0",
      "Content-Type: multipart/alternative; boundary=ai_resume_analyzer_boundary",
      "",
      "--ai_resume_analyzer_boundary",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      plain,
      "",
      "--ai_resume_analyzer_boundary",
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      bodyHtml,
      "",
      "--ai_resume_analyzer_boundary--",
      "",
      ".",
    ].join("\r\n").replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");

    await command(socket, "DATA", [354]);
    socket.write(`${message}\r\n`);
    await readResponse(socket);
    await command(socket, "QUIT", [221]);
    return { accepted: true };
  } finally {
    socket.end();
  }
}

async function sendWelcomeEmail({ to, username }) {
  const safeName = escapeHeader(username) || "there";
  return sendEmail({
    to,
    subject: "Welcome to AI Resume Analyzer",
    text: `Hi ${safeName},\n\nYour AI Resume Analyzer account has been created successfully. You can now analyze and improve your resumes.\n\nThanks,\nAI Resume Analyzer`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Welcome to AI Resume Analyzer</h2><p>Hi ${safeName},</p><p>Your account has been created successfully. You can now analyze and improve your resumes.</p><p>Thanks,<br>AI Resume Analyzer</p></div>`,
  });
}

module.exports = { sendEmail, sendWelcomeEmail, smtpEnabled };
