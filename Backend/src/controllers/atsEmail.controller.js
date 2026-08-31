const atsReportModel = require("../models/atsReport.model");
const userModel = require("../models/user.model");
const {
  generateAtsPdfBufferSafe: generateAtsPdfBuffer,
} = require("../services/atsPdf.safe.service");
const { sendEmail } = require("../services/smtp.service");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getAuthenticatedUserId(req) {
  return req.user?.id || req.user?._id || undefined;
}

function safeFileName(name) {
  return String(name || "ATS-Resume")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 100);
}

function safeHeader(value) {
  return String(value || "").replace(/[\r\n]/g, " ").trim();
}

async function sendAtsEmailController(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication is required to send a resume." });
    }

    const { id, senderEmail, recipient, subject, message = "", attachment = "optimized" } = req.body || {};
    const to = String(recipient || "").trim();

    if (!id) return res.status(400).json({ message: "Resume report ID is required." });
    if (!EMAIL_RE.test(to) || to.length > 254) {
      return res.status(400).json({ message: "Please enter a valid target email address." });
    }

    const user = await userModel.findById(userId).select("email");
    if (!user) return res.status(404).json({ message: "User account not found." });
    const accountEmail = String(user.email || "").trim().toLowerCase();
    const requestedSender = String(senderEmail || accountEmail).trim().toLowerCase();

    if (!EMAIL_RE.test(requestedSender) || requestedSender.length > 254) {
      return res.status(400).json({ message: "Please provide a valid sender email address." });
    }
    if (requestedSender !== accountEmail) {
      return res.status(403).json({ message: "The sender email must match the email address on your logged-in account." });
    }

    const cleanSubject = safeHeader(subject);
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

    const result = await sendEmail({
      to,
      replyTo: requestedSender,
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
      sender: requestedSender,
      recipient: to,
      attachment: attachment === "original" ? "original" : "optimized",
      messageId: result.messageId,
      accepted: result.accepted,
    });
  } catch (error) {
    if (error?.code === "EAUTH" || error?.responseCode === 535) {
      error.statusCode = 502;
      error.message = "SMTP authentication failed. Check SMTP_USER and use a Google App Password for SMTP_PASSWORD.";
    }
    if (error?.code === "ETIMEDOUT" || error?.code === "ECONNECTION" || error?.code === "ESOCKET") {
      error.statusCode = 502;
      error.message = "The email server could not be reached. Check the SMTP host, port and TLS settings in the backend environment.";
    }
    next(error);
  }
}

module.exports = { sendAtsEmailController };
