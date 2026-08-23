const PDFDocument = require("pdfkit");

const PALETTE = {
  ink: "#0f172a",
  muted: "#5b6472",
  accent: "#4f46e5",
  border: "#e4e8f0",
  low: "#15803d",
  medium: "#b45309",
  high: "#dc2626",
};

function severityColor(severity) {
  return PALETTE[severity] || PALETTE.muted;
}

function drawSectionTitle(doc, text) {
  doc.moveDown(1);
  doc
    .fillColor(PALETTE.accent)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(text.toUpperCase(), { characterSpacing: 0.6 });
  doc
    .moveTo(doc.x, doc.y + 4)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 4)
    .strokeColor(PALETTE.border)
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.8);
  doc.fillColor(PALETTE.ink);
}

function drawQA(doc, item, index) {
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(PALETTE.ink);
  doc.text(`${index + 1}. ${item.question}`, { paragraphGap: 2 });

  doc.font("Helvetica-Oblique").fontSize(9).fillColor(PALETTE.muted);
  doc.text(`Why it's asked: ${item.intention}`, { paragraphGap: 4 });

  doc.font("Helvetica").fontSize(9.5).fillColor(PALETTE.ink);
  doc.text(item.answer, { paragraphGap: 10 });
}

/**
 * Streams a PDF export of an interview report directly to the given
 * writable stream (typically the HTTP response).
 */
function renderInterviewReportPdf(report, stream) {
  const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
  doc.pipe(stream);

  // Header
  doc.font("Helvetica-Bold").fontSize(20).fillColor(PALETTE.ink);
  doc.text("Interview Readiness Report", { align: "left" });
  doc.font("Helvetica").fontSize(9.5).fillColor(PALETTE.muted);
  doc.text(`Generated ${new Date(report.createdAt || Date.now()).toLocaleString()}`);

  // Match score badge
  doc.moveDown(0.8);
  const score = typeof report.matchScore === "number" ? report.matchScore : 0;
  doc.font("Helvetica-Bold").fontSize(30).fillColor(PALETTE.accent);
  doc.text(`${score}`, { continued: true });
  doc.font("Helvetica").fontSize(12).fillColor(PALETTE.muted);
  doc.text(" / 100 match score");

  doc.moveDown(0.3);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(PALETTE.ink);
  doc.text("Job description");
  doc.font("Helvetica").fontSize(9.5).fillColor(PALETTE.muted);
  doc.text(report.jobDescription || "Not provided", { paragraphGap: 4 });

  // Skill gaps
  if (report.skillGaps?.length) {
    drawSectionTitle(doc, "Skill Gaps");
    report.skillGaps.forEach((gap) => {
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(severityColor(gap.severity));
      doc.text(`● ${gap.skill}`, { continued: true });
      doc.font("Helvetica").fillColor(PALETTE.muted);
      doc.text(`  —  ${gap.severity} priority`);
    });
  }

  // Technical questions
  if (report.technicalQuestions?.length) {
    drawSectionTitle(doc, "Technical Questions");
    report.technicalQuestions.forEach((q, i) => drawQA(doc, q, i));
  }

  // Behavioral questions
  if (report.behavioralQuestions?.length) {
    drawSectionTitle(doc, "Behavioral Questions");
    report.behavioralQuestions.forEach((q, i) => drawQA(doc, q, i));
  }

  // Preparation plan
  if (report.preparationPlan?.length) {
    drawSectionTitle(doc, "Preparation Plan");
    report.preparationPlan
      .slice()
      .sort((a, b) => a.day - b.day)
      .forEach((item) => {
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(PALETTE.accent);
        doc.text(`Day ${item.day} — ${item.focus}`, { paragraphGap: 2 });
        doc.font("Helvetica").fontSize(9.5).fillColor(PALETTE.ink);
        doc.text(item.tasks, { paragraphGap: 8 });
      });
  }

  // Footer page numbers
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(PALETTE.muted)
      .text(`Page ${i + 1} of ${range.count}`, doc.page.margins.left, doc.page.height - 30, {
        align: "center",
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      });
  }

  doc.end();
}

module.exports = { renderInterviewReportPdf };
