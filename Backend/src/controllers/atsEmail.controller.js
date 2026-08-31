const nodemailer = require("nodemailer");
const env = require("../config/env");
const atsReportModel = require("../models/atsReport.model");
const {
  generateAtsPdfBufferSafe: generateAtsPdfBuffer,
} = require("../services/atsPdf.safe.service");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let transporter;

function getTransporter() {
  if (String(env.SMTP_ENABLED).toLowerCase() !== "true") {
    throw new Error("Email sending is not enabled on the server.");
  }
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    throw new Error("SMTP email configuration is incomplete.");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: Number(env.SMTP_PORT) === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

function getAuthenticatedUserId(req) {
  return req.user?.id || req.user?._id || undefined;
}

function safeFileName(name) {
  return String(name || "ATS-Resume")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 100);
}

async function sendAtsEmailController(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication is required to send a resume." });
    }

    const { id, recipient, subject, message = "", attachment = "optimized" } = req.body || {};
    const to = String(recipient || "").trim();

    if (!id) return res.status(400).json({ message: "Resume report ID is required." });
    if (!EMAIL_RE.test(to) || to.length > 254) {
      return res.status(400).json({ message: "Please enter a valid target email address." });
    }

    const cleanSubject = String(subject || "").trim();
    if (!cleanSubject || cleanSubject.length > 150) {
      return res.status(400).json({ message: "Please provide an email subject (maximum 150 characters)." });
    }

    const cleanMessage = String(message || "").trim();
    if (cleanMessage.length > 5000) {
      return res.status(400).json({ message: "Email message is too long (maximum 5000 characters)." });
    }

    if (!["optimized", "original"].includes(attachment)) {
      return res.status(400).json({ message: "Invalid resume attachment type." });
    }

    const report = await atsReportModel.findById(id).select(
      "user revisedResume originalPdf resumeFileName"
    );
    if (!report) return res.status(404).json({ message: "Resume report not found." });
    if (String(report.user) !== String(userId)) {
      return res.status(403).json({ message: "You do not have access to this ATS report." });
    }

    let pdfBuffer;
    let fileName;

    if (attachment === "original") {
      if (!report.originalPdf || !Buffer.isBuffer(report.originalPdf) || report.originalPdf.length === 0) {
        return res.status(404).json({ message: "The original uploaded PDF is not available." });
      }
      pdfBuffer = report.originalPdf;
      fileName = `${safeFileName(report.resumeFileName || "Original-Resume")}.pdf`;
    } else {
      if (!report.revisedResume) {
        return res.status(409).json({
          message: "Generate the AI-revised resume before sending the optimized PDF.",
        });
      }
      pdfBuffer = await generateAtsPdfBuffer(report.revisedResume, String(report._id));
      fileName = `${safeFileName(report.revisedResume.contact?.fullName || "ATS-Optimized-Resume")}_ATS_Optimized.pdf`;
    }

    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      return res.status(500).json({ message: "Unable to prepare the resume PDF." });
    }
    if (pdfBuffer.length > 10 * 1024 * 1024) {
      return res.status(413).json({ message: "The resume PDF is too large to send by email." });
    }

    const mailer = getTransporter();
    await mailer.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: cleanSubject,
      text: cleanMessage || "Please find my resume attached.",
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return res.status(200).json({
      message: "Resume email sent successfully.",
      recipient: to,
      attachment: attachment === "original" ? "original" : "optimized",
    });
  } catch (error) {
    if (error?.code === "EAUTH" || error?.responseCode === 535) {
      error.statusCode = 502;
      error.message = "SMTP authentication failed. Check the email account and App Password configured on the server.";
    }
    next(error);
  }
}

module.exports = { sendAtsEmailController };
