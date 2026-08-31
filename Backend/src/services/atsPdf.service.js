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

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function clean(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim();
}

function bullets(value) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  return clean(value)
    .split(/\r?\n/)
    .map((line) => line.replace(/^[•\-–—*\s]+/, "").trim())
    .filter(Boolean);
}

function estimateDensity(resume) {
  const parts = [resume.summary];
  asArray(resume.skills).forEach((s) => parts.push(s?.category, s?.items));
  asArray(resume.experience).forEach((e) => parts.push(e?.company, e?.title, e?.location, e?.dates, ...bullets(e?.bullets)));
  asArray(resume.education).forEach((e) => parts.push(e?.degree, e?.institution, e?.dates, e?.details));
  asArray(resume.projects).forEach((p) => parts.push(p?.name, p?.role, p?.dates, ...bullets(p?.bullets)));
  asArray(resume.certifications).forEach((c) => parts.push(c?.name, c?.issuer, c?.date));
  return parts.filter(Boolean).reduce((n, v) => n + clean(v).length, 0);
}

function typographyFor(resume) {
  const chars = estimateDensity(resume);
  if (chars > 10500) return { body: 7.5, meta: 7.2, title: 8.0, section: 8.8, name: 17 };
  if (chars > 8500) return { body: 7.8, meta: 7.4, title: 8.2, section: 9.0, name: 18 };
  if (chars > 6800) return { body: 8.0, meta: 7.6, title: 8.4, section: 9.2, name: 18.5 };
  return { body: 8.3, meta: 7.8, title: 8.7, section: 9.4, name: 19 };
}

function section(doc, title, styles) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y > bottom - 42) doc.addPage();
  doc.font("Helvetica-Bold").fontSize(styles.section).fillColor("#0F172A").text(clean(title).toUpperCase());
  doc.moveDown(0.08);
  doc.moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor("#CBD3DF")
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(0.18);
}

function writeBullet(doc, value, styles, width) {
  const text = clean(value);
  if (!text) return;
  doc.font("Helvetica").fontSize(styles.body).fillColor("#243247");
  doc.text(`• ${text}`, doc.page.margins.left + 9, doc.y, {
    width: width - 9,
    lineGap: 0.7,
    paragraphGap: 0,
  });
}

function writeEntryHeader(doc, left, right, styles) {
  const x = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const dateWidth = right ? Math.min(112, width * 0.25) : 0;
  const startY = doc.y;

  doc.font("Helvetica-Bold").fontSize(styles.title).fillColor("#0F172A").text(clean(left), x, startY, {
    width: width - dateWidth - (dateWidth ? 8 : 0),
    lineGap: 0,
  });

  if (right) {
    doc.font("Helvetica").fontSize(styles.meta).fillColor("#526074").text(clean(right), x + width - dateWidth, startY, {
      width: dateWidth,
      align: "right",
      lineGap: 0,
    });
  }
}

function writeContact(doc, contact, width) {
  const values = [contact.email, contact.phone, contact.location, contact.linkedin, contact.github, contact.website]
    .map(clean)
    .filter(Boolean);
  if (!values.length) return;
  doc.font("Helvetica").fontSize(7.6).fillColor("#526074");
  doc.text(values.join("  |  "), { align: "center", width, lineGap: 0.5 });
}

function generateAtsPdfBuffer(rawResume = {}, cacheKey = null) {
  // PDFKit keeps generation self-contained and reliable in Vercel serverless.
  // No Chromium/browser process is required.
  return new Promise((resolve, reject) => {
    try {
      const resume = normalizeResumeData(rawResume);
      const styles = typographyFor(resume);
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 30, bottom: 32, left: 40, right: 40 },
        info: {
          Title: resume?.contact?.fullName ? `${clean(resume.contact.fullName)} - Resume` : "ATS Resume",
          Author: "AI Resume Analyzer",
          Subject: "ATS-friendly resume",
          Keywords: "resume, ATS, job application",
        },
        bufferPages: true,
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const contact = resume.contact || {};

      // Clean, ATS-safe header. No tables, columns, icons, images or canvas.
      doc.font("Helvetica-Bold").fontSize(styles.name).fillColor("#0F172A")
        .text(clean(contact.fullName) || "Candidate Name", { align: "center", width, lineGap: 0 });
      doc.moveDown(0.12);
      writeContact(doc, contact, width);
      doc.moveDown(0.25);
      doc.moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor("#0F172A")
        .lineWidth(0.8)
        .stroke();
      doc.moveDown(0.24);

      if (clean(resume.summary)) {
        section(doc, "Professional Summary", styles);
        doc.font("Helvetica").fontSize(styles.body).fillColor("#243247")
          .text(clean(resume.summary), { width, lineGap: 0.8, paragraphGap: 0 });
        doc.moveDown(0.16);
      }

      if (asArray(resume.skills).length) {
        section(doc, "Technical Skills", styles);
        asArray(resume.skills).forEach((skill) => {
          const category = clean(skill?.category) || "Skills";
          const items = Array.isArray(skill?.items)
            ? skill.items.map(clean).filter(Boolean).join(", ")
            : clean(skill?.items);
          if (!items) return;
          doc.font("Helvetica-Bold").fontSize(styles.body).fillColor("#0F172A")
            .text(`${category}: `, { continued: true, lineGap: 0 });
          doc.font("Helvetica").fontSize(styles.body).fillColor("#526074")
            .text(items, { lineGap: 0.7 });
        });
        doc.moveDown(0.13);
      }

      if (asArray(resume.experience).length) {
        section(doc, "Professional Experience", styles);
        asArray(resume.experience).forEach((exp) => {
          writeEntryHeader(doc, exp?.company, exp?.dates, styles);
          if (clean(exp?.title)) {
            doc.font("Helvetica-Bold").fontSize(styles.meta + 0.2).fillColor("#526074")
              .text(clean(exp.title), { lineGap: 0.4 });
          }
          if (clean(exp?.location)) {
            doc.font("Helvetica-Oblique").fontSize(styles.meta).fillColor("#526074")
              .text(clean(exp.location), { lineGap: 0.4 });
          }
          bullets(exp?.bullets).forEach((bullet) => writeBullet(doc, bullet, styles, width));
          doc.moveDown(0.13);
        });
      }

      if (asArray(resume.education).length) {
        section(doc, "Education", styles);
        asArray(resume.education).forEach((edu) => {
          writeEntryHeader(doc, edu?.degree, edu?.dates, styles);
          if (clean(edu?.institution)) {
            doc.font("Helvetica").fontSize(styles.meta + 0.2).fillColor("#526074")
              .text(`— ${clean(edu.institution)}`, { lineGap: 0.5 });
          }
          if (clean(edu?.details)) {
            doc.font("Helvetica").fontSize(styles.body).fillColor("#243247")
              .text(clean(edu.details), { width, lineGap: 0.7 });
          }
          doc.moveDown(0.12);
        });
      }

      if (asArray(resume.projects).length) {
        section(doc, "Key Projects", styles);
        asArray(resume.projects).forEach((project) => {
          writeEntryHeader(doc, project?.name, project?.dates, styles);
          if (clean(project?.role)) {
            doc.font("Helvetica").fontSize(styles.meta + 0.2).fillColor("#526074")
              .text(clean(project.role), { lineGap: 0.4 });
          }
          bullets(project?.bullets).forEach((bullet) => writeBullet(doc, bullet, styles, width));
          doc.moveDown(0.12);
        });
      }

      if (asArray(resume.certifications).length) {
        section(doc, "Certifications", styles);
        asArray(resume.certifications).forEach((cert) => {
          const line = [cert?.name, cert?.issuer, cert?.date].map(clean).filter(Boolean).join(" — ");
          if (!line) return;
          doc.font("Helvetica").fontSize(styles.body).fillColor("#243247")
            .text(line, { width, lineGap: 0.7 });
          doc.moveDown(0.05);
        });
      }

      // If content is unusually long, allow a clean second page instead of
      // shrinking/distorting the entire document with vertical scaling.
      const range = doc.bufferedPageRange();
      if (range.count > 1) {
        for (let i = range.start; i < range.start + range.count; i += 1) {
          doc.switchToPage(i);
          doc.font("Helvetica").fontSize(6.8).fillColor("#7A8699")
            .text(`Page ${i + 1 - range.start} of ${range.count}`, doc.page.margins.left, doc.page.height - 18, {
              width,
              align: "center",
            });
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateAtsPdfBuffer };
