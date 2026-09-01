const atsReportModel = require("../models/atsReport.model");
const userModel = require("../models/user.model");
const { generateAtsPdfBufferSafe: generateAtsPdfBuffer } = require("../services/atsPdf.safe.service");
const { sendGmailMessage } = require("../services/gmailOAuth.service");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getAuthenticatedUserId(req) {
  return req.user?.id || req.user?._id || undefined;
}

function safeFileName(name) {
  return String(name || "ATS-Resume").replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
}

function safeHeader(value) {
  return String(value || "").replace(/[\r\n]/g, " ").trim();
}

async function sendAtsEmailController(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication is required to send a resume." });

    const { id, senderEmail, recipient, subject, message = "", attachment = "optimized" } = req.body || {};
    const to = String(recipient || "").trim();
    if (!id) return res.status(400).json({ message: "Resume report ID is required." });
    if (!EMAIL_RE.test(to) || to.length > 254) return res.status(400).json({ message: "Please enter a valid target email address." });

    // gmailOAuthRefreshToken is select:false in the schema, so explicitly use
    // '+' here. Without it Mongoose can omit the refresh token from this query.
    const user = await userModel.findById(userId).select("email gmailOAuthEmail gmailOAuthConnectedAt +gmailOAuthRefreshToken");
    if (!user) return res.status(404).json({ message: "User account not found." });

    const accountEmail = String(user.email || "").trim().toLowerCase();
    const requestedSender = String(senderEmail || accountEmail).trim().toLowerCase();
    if (!EMAIL_RE.test(requestedSender) || requestedSender.length > 254) return res.status(400).json({ message: "Please provide a valid sender email address." });
    if (requestedSender !== accountEmail) return res.status(403).json({ message: "The sender email must match your logged-in account." });

    const connectedEmail = String(user.gmailOAuthEmail || "").trim().toLowerCase();
    if (!user.gmailOAuthRefreshToken || connectedEmail !== accountEmail) {
      return res.status(409).json({ message: "Connect Gmail before sending. Use the same Google account as your Resume Analyzer account.", code: "GMAIL_NOT_CONNECTED" });
    }

    const cleanSubject = safeHeader(subject);
    if (!cleanSubject || cleanSubject.length > 150) return res.status(400).json({ message: "Please provide an email subject (maximum 150 characters)." });
    const cleanMessage = String(message || "").trim();
    if (cleanMessage.length > 5000) return res.status(400).json({ message: "Email message is too long (maximum 5000 characters)." });
    if (!["optimized", "original"].includes(attachment)) return res.status(400).json({ message: "Invalid resume attachment type." });

    const report = await atsReportModel.findById(id).select("user revisedResume originalPdf resumeFileName");
    if (!report) return res.status(404).json({ message: "Resume report not found." });
    if (String(report.user) !== String(userId)) return res.status(403).json({ message: "You do not have access to this ATS report." });

    let pdfBuffer;
    let fileName;
    if (attachment === "original") {
      if (!report.originalPdf || !Buffer.isBuffer(report.originalPdf) || report.originalPdf.length === 0) return res.status(404).json({ message: "The original uploaded PDF is not available." });
      pdfBuffer = report.originalPdf;
      fileName = `${safeFileName(report.resumeFileName || "Original-Resume")}.pdf`;
    } else {
      if (!report.revisedResume) return res.status(409).json({ message: "Generate the AI-revised resume before sending the optimized PDF." });
      pdfBuffer = await generateAtsPdfBuffer(report.revisedResume, String(report._id));
      fileName = `${safeFileName(report.revisedResume.contact?.fullName || "ATS-Optimized-Resume")}_ATS_Optimized.pdf`;
    }
    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) return res.status(500).json({ message: "Unable to prepare the resume PDF." });
    if (pdfBuffer.length > 10 * 1024 * 1024) return res.status(413).json({ message: "The resume PDF is too large to send by email." });

    try {
      const result = await sendGmailMessage({
        refreshToken: user.gmailOAuthRefreshToken,
        from: accountEmail,
        to,
        subject: cleanSubject,
        text: cleanMessage || "Please find my resume attached.",
        attachment: { filename: fileName, content: pdfBuffer, contentType: "application/pdf" },
      });

      return res.status(200).json({ message: "Resume sent from your Gmail account.", sender: result.senderEmail || accountEmail, recipient: to, attachment: attachment === "original" ? "original" : "optimized", messageId: result.messageId, threadId: result.threadId });
    } catch (error) {
      if (error?.code === "GMAIL_REFRESH_TOKEN_REVOKED" || error?.code === "GMAIL_TOKEN_INVALID" || error?.code === "GMAIL_REFRESH_TOKEN_MISSING") {
        user.gmailOAuthRefreshToken = null;
        user.gmailOAuthEmail = null;
        user.gmailOAuthConnectedAt = null;
        await user.save();
        return res.status(409).json({ message: "Your Gmail authorization is no longer valid. Please reconnect Gmail and try again.", code: "GMAIL_RECONNECT_REQUIRED" });
      }

      if (error?.code === "GMAIL_SENDER_MISMATCH") {
        return res.status(409).json({ message: "The connected Gmail account does not match your Resume Analyzer account. Reconnect Gmail using the same Google account you use here.", code: "GMAIL_SENDER_MISMATCH" });
      }

      // Do not destroy a valid refresh token merely because Gmail returned a
      // generic 403. Insufficient scope, API configuration, or account policy
      // errors are not proof that the refresh token is revoked.
      if (error?.code === 401 || error?.response?.status === 401) {
        return res.status(409).json({ message: "Gmail rejected the current authorization. Please reconnect Gmail and try again.", code: "GMAIL_RECONNECT_REQUIRED" });
      }

      if (error?.code === 403 || error?.response?.status === 403) {
        const googleMessage = error?.response?.data?.error?.message;
        return res.status(403).json({ message: googleMessage || "Gmail rejected the request. Check that Gmail sending permission is enabled for this Google account.", code: "GMAIL_PERMISSION_ERROR" });
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
}

module.exports = { sendAtsEmailController };
