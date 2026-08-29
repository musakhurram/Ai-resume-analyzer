const PDFDocument = require("pdfkit");

function normalizeResumeData(input) {
  if (!input) return {};
  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch (_) {
      return { summary: input };
    }
  }
  return typeof input === "object" ? input : {};
}

function addWrapped(doc, text, options = {}) {
  const value = String(text ?? "").trim();
  if (!value) return;
  doc.text(value, options.x ?? doc.x, options.y ?? doc.y, {
    width: options.width,
    lineGap: options.lineGap ?? 0.5,
    paragraphGap: options.paragraphGap ?? 0,
  });
}

function compactEstimate(resume = {}) {
  const contact = resume.contact || {};
  const textParts = [resume.summary];
  (Array.isArray(resume.skills) ? resume.skills : []).forEach((s) => {
    textParts.push(s?.category, Array.isArray(s?.items) ? s.items.join(", ") : s?.items);
  });
  (Array.isArray(resume.experience) ? resume.experience : []).forEach((e) => {
    textParts.push(e?.company, e?.title, e?.location, e?.dates);
    if (Array.isArray(e?.bullets)) {
      textParts.push(...e.bullets);
    } else if (e?.bullets) {
      textParts.push(String(e.bullets));
    }
  });
  (Array.isArray(resume.education) ? resume.education : []).forEach((e) => {
    textParts.push(e?.degree, e?.institution, e?.dates, e?.details);
  });
  (Array.isArray(resume.projects) ? resume.projects : []).forEach((p) => {
    textParts.push(p?.name, p?.role, p?.dates);
    if (Array.isArray(p?.bullets)) {
      textParts.push(...p.bullets);
    } else if (p?.bullets) {
      textParts.push(String(p.bullets));
    }
  });
  (Array.isArray(resume.certifications) ? resume.certifications : []).forEach((c) => {
    textParts.push(c?.name, c?.issuer, c?.date);
  });
  textParts.push(contact.fullName, contact.email, contact.phone, contact.location, contact.linkedin, contact.github, contact.website);
  const chars = textParts.filter(Boolean).reduce((n, value) => n + String(value).length, 0);
  const sections = [
    resume.summary,
    Array.isArray(resume.skills) && resume.skills.length,
    Array.isArray(resume.experience) && resume.experience.length,
    Array.isArray(resume.education) && resume.education.length,
    Array.isArray(resume.projects) && resume.projects.length,
    Array.isArray(resume.certifications) && resume.certifications.length,
  ].filter(Boolean).length;
  const estimatedLines = Math.ceil(chars / 92) + sections * 2 + 7;
  const estimatedHeight = 72 + estimatedLines * 10.2;
  return Math.min(1, Math.max(0.76, 680 / estimatedHeight));
}

function section(doc, title) {
  doc.font("Helvetica-Bold").fontSize(9.2).fillColor("#0F172A").text(String(title).toUpperCase());
  doc.moveDown(0.08);
  doc.moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor("#CBD3DF")
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(0.16);
}

function itemHeader(doc, title, dates) {
  const left = String(title || "").trim();
  const right = String(dates || "").trim();
  const x = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.font("Helvetica-Bold").fontSize(8.7).fillColor("#0F172A").text(left, x, doc.y, {
    width: right ? width - 100 : width,
  });
  if (right) {
    const y = doc.y - doc.currentLineHeight();
    doc.font("Helvetica").fontSize(7.8).fillColor("#526074").text(right, x + width - 100, y, {
      width: 100,
      align: "right",
    });
  }
}

function generateAtsPdfBuffer(rawResume = {}, cacheKey = null) {
  // PDFKit is used directly so this works in Vercel serverless without Chromium.
  // The generated ATS resume is intentionally constrained to ONE page. We use
  // a vertical-only scale when the content is dense so wrapping width stays
  // unchanged and the resume remains readable and ATS-friendly.
  return new Promise((resolve, reject) => {
    try {
      const resume = normalizeResumeData(rawResume);
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 30, bottom: 30, left: 40, right: 40 },
        info: { Title: resume?.contact?.fullName ? `${resume.contact.fullName} - ATS Resume` : "ATS Resume" },
      });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Scale only the vertical axis. This preserves the normal text wrapping
      // width while ensuring dense but valid CV content stays on one page.
      const verticalScale = compactEstimate(resume);
      doc.scale(1, verticalScale);

      const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const contact = resume.contact || {};
      const navy = "#0F172A";
      const muted = "#526074";
      const text = "#243247";

      doc.font("Helvetica-Bold").fontSize(18).fillColor(navy).text(contact.fullName || "Candidate Name", { align: "center", width: contentWidth });
      const contactLine = [contact.email, contact.phone, contact.location, contact.linkedin, contact.github, contact.website]
        .filter(Boolean).map((v) => String(v).trim()).filter(Boolean).join("  |  ");
      if (contactLine) {
        doc.moveDown(0.12).font("Helvetica").fontSize(7.7).fillColor(muted).text(contactLine, { align: "center", width: contentWidth, lineGap: 0 });
      }
      doc.moveDown(0.25).moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor(navy).lineWidth(0.8).stroke();
      doc.moveDown(0.22);

      if (resume.summary) {
        section(doc, "Professional Summary");
        doc.font("Helvetica").fontSize(8.45).fillColor(text);
        addWrapped(doc, resume.summary, { width: contentWidth, lineGap: 0.5 });
        doc.moveDown(0.16);
      }

      if (Array.isArray(resume.skills) && resume.skills.length) {
        section(doc, "Technical Skills");
        resume.skills.forEach((skill) => {
          const items = Array.isArray(skill.items) ? skill.items.join(", ") : String(skill.items || "");
          if (!items.trim()) return;
          doc.font("Helvetica-Bold").fontSize(8.2).fillColor(navy).text(`${skill.category || "Skills"}: `, { continued: true });
          doc.font("Helvetica").fillColor(muted).text(items, { lineGap: 0 });
        });
        doc.moveDown(0.14);
      }

      if (Array.isArray(resume.experience) && resume.experience.length) {
        section(doc, "Professional Experience");
        resume.experience.forEach((exp) => {
          itemHeader(doc, exp.company || "", exp.dates || "");
          if (exp.title) doc.font("Helvetica-Bold").fontSize(8.1).fillColor(muted).text(exp.title, { lineGap: 0 });
          if (exp.location) doc.font("Helvetica-Oblique").fontSize(7.7).fillColor(muted).text(exp.location, { lineGap: 0 });
          if (Array.isArray(exp.bullets)) {
            exp.bullets.forEach((bullet) => {
              doc.font("Helvetica").fontSize(8.15).fillColor(text);
              addWrapped(doc, `• ${bullet}`, { x: 49, width: contentWidth - 9, lineGap: 0.3 });
            });
          } else if (exp.bullets) {
            const lines = String(exp.bullets).split("\n").filter(Boolean);
            lines.forEach((b) => {
              doc.font("Helvetica").fontSize(8.15).fillColor(text);
              addWrapped(doc, `• ${b.replace(/^[•\s*-]+/, "")}`, { x: 49, width: contentWidth - 9, lineGap: 0.3 });
            });
          }
          doc.moveDown(0.12);
        });
      }

      if (Array.isArray(resume.education) && resume.education.length) {
        section(doc, "Education");
        resume.education.forEach((edu) => {
          itemHeader(doc, edu.degree || "", edu.dates || "");
          if (edu.institution) doc.font("Helvetica").fontSize(8.1).fillColor(muted).text(`— ${edu.institution}`, { lineGap: 0 });
          if (edu.details) {
            doc.font("Helvetica").fontSize(8.05).fillColor(text);
            addWrapped(doc, edu.details, { width: contentWidth, lineGap: 0.3 });
          }
          doc.moveDown(0.12);
        });
      }

      if (Array.isArray(resume.projects) && resume.projects.length) {
        section(doc, "Key Projects");
        resume.projects.forEach((project) => {
          itemHeader(doc, project.name || "", project.dates || "");
          if (project.role) doc.font("Helvetica").fontSize(8.1).fillColor(muted).text(project.role, { lineGap: 0 });
          if (Array.isArray(project.bullets)) {
            project.bullets.forEach((bullet) => {
              doc.font("Helvetica").fontSize(8.15).fillColor(text);
              addWrapped(doc, `• ${bullet}`, { x: 49, width: contentWidth - 9, lineGap: 0.3 });
            });
          } else if (project.bullets) {
            const lines = String(project.bullets).split("\n").filter(Boolean);
            lines.forEach((b) => {
              doc.font("Helvetica").fontSize(8.15).fillColor(text);
              addWrapped(doc, `• ${b.replace(/^[•\s*-]+/, "")}`, { x: 49, width: contentWidth - 9, lineGap: 0.3 });
            });
          }
          doc.moveDown(0.12);
        });
      }

      if (Array.isArray(resume.certifications) && resume.certifications.length) {
        section(doc, "Certifications");
        resume.certifications.forEach((cert) => {
          const line = [cert.name, cert.issuer, cert.date].filter(Boolean).join(" — ");
          doc.font("Helvetica").fontSize(8.1).fillColor(text);
          addWrapped(doc, line, { width: contentWidth, lineGap: 0.3 });
          doc.moveDown(0.08);
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateAtsPdfBuffer };
