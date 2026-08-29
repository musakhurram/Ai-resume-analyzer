const PDFDocument = require("pdfkit");

function addWrapped(doc, text, options = {}) {
  const value = String(text ?? "").trim();
  if (!value) return;
  doc.text(value, options.x ?? doc.x, options.y ?? doc.y, {
    width: options.width,
    lineGap: options.lineGap ?? 2,
    paragraphGap: options.paragraphGap ?? 0,
  });
}

function ensureSpace(doc, needed = 40) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    return true;
  }
  return false;
}

function section(doc, title) {
  ensureSpace(doc, 42);
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#0F172A").text(String(title).toUpperCase());
  doc.moveDown(0.15);
  doc.moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor("#CBD3DF")
    .lineWidth(0.6)
    .stroke();
  doc.moveDown(0.28);
}

function itemHeader(doc, title, dates) {
  ensureSpace(doc, 28);
  const left = String(title || "").trim();
  const right = String(dates || "").trim();
  const x = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0F172A").text(left, x, doc.y, {
    width: right ? width - 105 : width,
    continued: false,
  });
  if (right) {
    const y = doc.y - doc.currentLineHeight();
    doc.font("Helvetica").fontSize(8.8).fillColor("#526074").text(right, x + width - 105, y, {
      width: 105,
      align: "right",
    });
  }
}

function generateAtsPdfBuffer(resume = {}, cacheKey = null) {
  // Deliberately use PDFKit here rather than requiring a local Chromium binary.
  // Vercel serverless functions do not guarantee a Chrome executable, while
  // PDFKit is a pure Node dependency and produces a real PDF synchronously
  // through a stream in every deployment environment.
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 42, bottom: 42, left: 48, right: 48 },
        info: { Title: resume?.contact?.fullName ? `${resume.contact.fullName} - ATS Resume` : "ATS Resume" },
      });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const contact = resume.contact || {};
      const navy = "#0F172A";
      const muted = "#526074";
      const text = "#243247";

      doc.font("Helvetica-Bold").fontSize(20).fillColor(navy).text(contact.fullName || "Candidate Name", { align: "center" });
      const contactLine = [contact.email, contact.phone, contact.location, contact.linkedin, contact.github, contact.website]
        .filter(Boolean)
        .map((v) => String(v).trim())
        .filter(Boolean)
        .join("  |  ");
      if (contactLine) {
        doc.moveDown(0.22).font("Helvetica").fontSize(8.5).fillColor(muted).text(contactLine, { align: "center", lineGap: 1 });
      }
      doc.moveDown(0.5)
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor(navy)
        .lineWidth(1)
        .stroke();
      doc.moveDown(0.45);

      if (resume.summary) {
        section(doc, "Professional Summary");
        doc.font("Helvetica").fontSize(9.65).fillColor(text);
        addWrapped(doc, resume.summary, { width: 516, lineGap: 2 });
        doc.moveDown(0.35);
      }

      if (Array.isArray(resume.skills) && resume.skills.length) {
        section(doc, "Technical Skills");
        resume.skills.forEach((skill) => {
          const items = Array.isArray(skill.items) ? skill.items.join(", ") : String(skill.items || "");
          if (!items.trim()) return;
          ensureSpace(doc, 20);
          doc.font("Helvetica-Bold").fontSize(9.5).fillColor(navy).text(`${skill.category || "Skills"}: `, { continued: true });
          doc.font("Helvetica").fillColor(muted).text(items);
        });
        doc.moveDown(0.3);
      }

      if (Array.isArray(resume.experience) && resume.experience.length) {
        section(doc, "Professional Experience");
        resume.experience.forEach((exp) => {
          itemHeader(doc, exp.company || "", exp.dates || "");
          if (exp.title) {
            doc.font("Helvetica-Bold").fontSize(9).fillColor(muted).text(exp.title);
          }
          if (exp.location) {
            doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(muted).text(exp.location);
          }
          if (Array.isArray(exp.bullets)) {
            exp.bullets.forEach((bullet) => {
              ensureSpace(doc, 24);
              doc.font("Helvetica").fontSize(9.45).fillColor(text);
              addWrapped(doc, `• ${bullet}`, { x: 58, width: 506, lineGap: 1.5 });
            });
          }
          doc.moveDown(0.35);
        });
      }

      if (Array.isArray(resume.education) && resume.education.length) {
        section(doc, "Education");
        resume.education.forEach((edu) => {
          itemHeader(doc, edu.degree || "", edu.dates || "");
          if (edu.institution) doc.font("Helvetica").fontSize(9).fillColor(muted).text(`— ${edu.institution}`);
          if (edu.details) {
            doc.font("Helvetica").fontSize(9.05).fillColor(text);
            addWrapped(doc, edu.details, { width: 516, lineGap: 1.5 });
          }
          doc.moveDown(0.3);
        });
      }

      if (Array.isArray(resume.projects) && resume.projects.length) {
        section(doc, "Key Projects");
        resume.projects.forEach((project) => {
          itemHeader(doc, project.name || "", project.dates || "");
          if (project.role) doc.font("Helvetica").fontSize(9).fillColor(muted).text(project.role);
          if (Array.isArray(project.bullets)) {
            project.bullets.forEach((bullet) => {
              ensureSpace(doc, 24);
              doc.font("Helvetica").fontSize(9.45).fillColor(text);
              addWrapped(doc, `• ${bullet}`, { x: 58, width: 506, lineGap: 1.5 });
            });
          }
          doc.moveDown(0.3);
        });
      }

      if (Array.isArray(resume.certifications) && resume.certifications.length) {
        section(doc, "Certifications");
        resume.certifications.forEach((cert) => {
          const line = [cert.name, cert.issuer, cert.date].filter(Boolean).join(" — ");
          doc.font("Helvetica").fontSize(9.2).fillColor(text);
          addWrapped(doc, line, { width: 516, lineGap: 1.5 });
          doc.moveDown(0.2);
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateAtsPdfBuffer };
