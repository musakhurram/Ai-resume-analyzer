const PDFDocument = require("pdfkit");
const { generateAtsPdfBuffer } = require("./atsPdf.service");

function addWrapped(doc, text, options = {}) {
  const value = String(text || "").trim();
  if (!value) return;
  doc.text(value, options.x ?? doc.x, options.y ?? doc.y, {
    width: options.width,
    continued: false,
    lineGap: options.lineGap ?? 2,
    paragraphGap: options.paragraphGap ?? 0,
  });
}

function generatePdfKitResume(resume = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 42, bottom: 42, left: 48, right: 48 },
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const contact = resume.contact || {};
    const navy = "#0F172A";
    const muted = "#526074";
    const rule = "#CBD3DF";

    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(navy)
      .text(contact.fullName || "Candidate Name", { align: "center" });
    const contactLine = [
      contact.email,
      contact.phone,
      contact.location,
      contact.linkedin,
      contact.github,
      contact.website,
    ]
      .filter(Boolean)
      .join("  |  ");
    if (contactLine)
      doc
        .moveDown(0.25)
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(muted)
        .text(contactLine, { align: "center", lineGap: 1 });
    doc
      .moveDown(0.5)
      .moveTo(48, doc.y)
      .lineTo(564, doc.y)
      .strokeColor(navy)
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.45);

    const section = (title) => {
      if (doc.y > 720) doc.addPage();
      doc
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .fillColor(navy)
        .text(title.toUpperCase());
      doc
        .moveDown(0.15)
        .moveTo(48, doc.y)
        .lineTo(564, doc.y)
        .strokeColor(rule)
        .lineWidth(0.6)
        .stroke();
      doc.moveDown(0.28);
    };

    if (resume.summary) {
      section("Professional Summary");
      addWrapped(doc, resume.summary, { width: 516, lineGap: 2 });
      doc.moveDown(0.35);
    }

    if (Array.isArray(resume.skills) && resume.skills.length) {
      section("Technical Skills");
      resume.skills.forEach((skill) => {
        const items = Array.isArray(skill.items)
          ? skill.items.join(", ")
          : skill.items || "";
        if (!items) return;
        doc
          .font("Helvetica-Bold")
          .fontSize(9.5)
          .fillColor(navy)
          .text(`${skill.category || "Skills"}: `, { continued: true });
        doc.font("Helvetica").fillColor(muted).text(items);
      });
      doc.moveDown(0.3);
    }

    if (Array.isArray(resume.experience) && resume.experience.length) {
      section("Professional Experience");
      resume.experience.forEach((exp) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(navy)
          .text(exp.company || "", { continued: !!exp.dates });
        if (exp.dates)
          doc
            .font("Helvetica")
            .fontSize(8.8)
            .fillColor(muted)
            .text(`  ${exp.dates}`, { align: "right" });
        if (exp.title)
          doc
            .font("Helvetica-Bold")
            .fontSize(9)
            .fillColor(muted)
            .text(exp.title);
        if (exp.location)
          doc
            .font("Helvetica-Oblique")
            .fontSize(8.5)
            .fillColor(muted)
            .text(exp.location);
        if (Array.isArray(exp.bullets))
          exp.bullets.forEach((bullet) =>
            addWrapped(doc, `• ${bullet}`, { x: 58, width: 506, lineGap: 1.5 }),
          );
        doc.moveDown(0.35);
      });
    }

    if (Array.isArray(resume.education) && resume.education.length) {
      section("Education");
      resume.education.forEach((edu) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(navy)
          .text(edu.degree || "", { continued: !!edu.institution });
        if (edu.institution)
          doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor(muted)
            .text(` — ${edu.institution}`);
        if (edu.dates)
          doc.font("Helvetica").fontSize(8.8).fillColor(muted).text(edu.dates);
        if (edu.details)
          addWrapped(doc, edu.details, { width: 516, lineGap: 1.5 });
        doc.moveDown(0.3);
      });
    }

    if (Array.isArray(resume.projects) && resume.projects.length) {
      section("Key Projects");
      resume.projects.forEach((project) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(navy)
          .text(project.name || "", { continued: !!project.role });
        if (project.role)
          doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor(muted)
            .text(` — ${project.role}`);
        if (project.dates)
          doc
            .font("Helvetica")
            .fontSize(8.8)
            .fillColor(muted)
            .text(project.dates);
        if (Array.isArray(project.bullets))
          project.bullets.forEach((bullet) =>
            addWrapped(doc, `• ${bullet}`, { x: 58, width: 506, lineGap: 1.5 }),
          );
        doc.moveDown(0.3);
      });
    }

    if (Array.isArray(resume.certifications) && resume.certifications.length) {
      section("Certifications");
      resume.certifications.forEach((cert) => {
        const line = [cert.name, cert.issuer, cert.date]
          .filter(Boolean)
          .join(" — ");
        addWrapped(doc, line, { width: 516, lineGap: 1.5 });
      });
    }

    doc.end();
  });
}

async function generateAtsPdfBufferSafe(resume, cacheKey = null) {
  try {
    return await generateAtsPdfBuffer(resume, cacheKey);
  } catch (error) {
    console.warn(
      "ATS Chromium PDF unavailable; using PDFKit fallback:",
      error?.message || error,
    );
    return generatePdfKitResume(resume);
  }
}

module.exports = { generateAtsPdfBufferSafe };
