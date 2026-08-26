const fs = require("fs");
const path = require("path");
let puppeteer;
try {
  puppeteer = require("puppeteer");
} catch {
  puppeteer = require("puppeteer-core");
}

/**
 * Locate Chrome or Edge executable across various OS environments
 */
function findBrowserExecutable() {
  if (
    process.env.PUPPETEER_EXECUTABLE_PATH &&
    fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)
  ) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidatePaths = [
    // Windows Chrome
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA
      ? path.join(
          process.env.LOCALAPPDATA,
          "Google\\Chrome\\Application\\chrome.exe",
        )
      : null,
    // Windows Edge
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    // Linux Chrome/Chromium
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
    // macOS Chrome/Edge
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ].filter(Boolean);

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return undefined;
}

/**
 * Escape HTML special characters for safe template rendering
 */
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = {
  findBrowserExecutable,
  escapeHtml,
};

/**
 * Render structured resume JSON to clean single-column ATS-friendly HTML/CSS
 */
function renderAtsHtmlTemplate(resume) {
  const contact = resume.contact || {};
  const summary = resume.summary || "";
  const experience = Array.isArray(resume.experience) ? resume.experience : [];
  const skills = Array.isArray(resume.skills) ? resume.skills : [];
  const education = Array.isArray(resume.education) ? resume.education : [];
  const projects = Array.isArray(resume.projects) ? resume.projects : [];
  const certifications = Array.isArray(resume.certifications) ? resume.certifications : [];

  // Build contact row items
  const contactItems = [
    contact.email ? escapeHtml(contact.email) : null,
    contact.phone ? escapeHtml(contact.phone) : null,
    contact.location ? escapeHtml(contact.location) : null,
    contact.linkedin ? `<a href="${escapeHtml(contact.linkedin)}" target="_blank">${escapeHtml(contact.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "linkedin.com/in/"))}</a>` : null,
    contact.github ? `<a href="${escapeHtml(contact.github)}" target="_blank">${escapeHtml(contact.github.replace(/^https?:\/\/(www\.)?github\.com\//i, "github.com/"))}</a>` : null,
    contact.website ? `<a href="${escapeHtml(contact.website)}" target="_blank">${escapeHtml(contact.website.replace(/^https?:\/\//i, ""))}</a>` : null,
  ].filter(Boolean).join(' <span class="contact-sep">•</span> ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(contact.fullName || "Resume")}</title>
  <style>
    @page {
      size: letter;
      margin: 18mm 16mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, Calibri, sans-serif;
      font-size: 10.5pt;
      line-height: 1.45;
      color: #111827;
      background: #ffffff;
      padding: 0;
    }
    a {
      color: #111827;
      text-decoration: none;
    }
    .header {
      text-align: center;
      margin-bottom: 14pt;
      border-bottom: 1.5pt solid #111827;
      padding-bottom: 8pt;
    }
    .name {
      font-size: 20pt;
      font-weight: 700;
      letter-spacing: -0.2pt;
      color: #0f172a;
      margin-bottom: 4pt;
      text-transform: uppercase;
    }
    .contact-line {
      font-size: 9.5pt;
      color: #334155;
      line-height: 1.4;
    }
    .contact-sep {
      color: #94a3b8;
      margin: 0 3pt;
    }
    .section {
      margin-bottom: 12pt;
    }
    .section-title {
      font-size: 11.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6pt;
      color: #0f172a;
      border-bottom: 1pt solid #cbd5e1;
      padding-bottom: 2pt;
      margin-bottom: 6pt;
    }
    .summary-text {
      font-size: 10pt;
      line-height: 1.45;
      color: #334155;
      text-align: justify;
    }
    .item {
      margin-bottom: 8pt;
      page-break-inside: avoid;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1.5pt;
    }
    .item-title-group {
      font-weight: 700;
      font-size: 10.5pt;
      color: #0f172a;
    }
    .item-company {
      font-weight: 700;
    }
    .item-role {
      font-weight: 600;
      color: #334155;
    }
    .item-date {
      font-size: 9.5pt;
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
    }
    .item-location {
      font-size: 9pt;
      color: #64748b;
      font-style: italic;
      margin-bottom: 2pt;
    }
    ul.bullets {
      list-style-type: disc;
      margin-left: 16pt;
      margin-top: 2pt;
      margin-bottom: 2pt;
    }
    ul.bullets li {
      font-size: 10pt;
      line-height: 1.4;
      color: #1e293b;
      margin-bottom: 2.5pt;
    }
    .skills-group {
      margin-bottom: 4pt;
      font-size: 10pt;
      line-height: 1.4;
    }
    .skills-category {
      font-weight: 700;
      color: #0f172a;
      display: inline;
    }
    .skills-list {
      color: #334155;
      display: inline;
    }
    .education-item {
      margin-bottom: 6pt;
      page-break-inside: avoid;
    }
    .education-degree {
      font-weight: 700;
      font-size: 10.5pt;
      color: #0f172a;
    }
    .education-inst {
      color: #334155;
    }
    .education-details {
      font-size: 9.5pt;
      color: #475569;
      margin-top: 1pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${escapeHtml(contact.fullName || "Candidate Name")}</div>
    <div class="contact-line">${contactItems}</div>
  </div>

  ${summary ? `
  <div class="section">
    <h2 class="section-title">Professional Summary</h2>
    <p class="summary-text">${escapeHtml(summary)}</p>
  </div>` : ""}

  ${skills.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Technical Skills</h2>
    ${skills.map((s) => `
      <div class="skills-group">
        <span class="skills-category">${escapeHtml(s.category)}:</span>
        <span class="skills-list">${Array.isArray(s.items) ? escapeHtml(s.items.join(", ")) : escapeHtml(s.items || "")}</span>
      </div>
    `).join("")}
  </div>` : ""}

  ${experience.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Professional Experience</h2>
    ${experience.map((exp) => `
      <div class="item">
        <div class="item-header">
          <div class="item-title-group">
            <span class="item-company">${escapeHtml(exp.company)}</span>${exp.title ? ` — <span class="item-role">${escapeHtml(exp.title)}</span>` : ""}
          </div>
          <div class="item-date">${escapeHtml(exp.dates || "")}</div>
        </div>
        ${exp.location ? `<div class="item-location">${escapeHtml(exp.location)}</div>` : ""}
        ${Array.isArray(exp.bullets) && exp.bullets.length > 0 ? `
          <ul class="bullets">
            ${exp.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
          </ul>
        ` : ""}
      </div>
    `).join("")}
  </div>` : ""}

  ${education.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Education</h2>
    ${education.map((edu) => `
      <div class="education-item">
        <div class="item-header">
          <div class="education-degree">
            ${escapeHtml(edu.degree)}${edu.institution ? ` — <span class="education-inst">${escapeHtml(edu.institution)}</span>` : ""}
          </div>
          <div class="item-date">${escapeHtml(edu.dates || "")}</div>
        </div>
        ${edu.details ? `<div class="education-details">${escapeHtml(edu.details)}</div>` : ""}
      </div>
    `).join("")}
  </div>` : ""}

  ${projects.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Key Projects</h2>
    ${projects.map((proj) => `
      <div class="item">
        <div class="item-header">
          <div class="item-title-group">
            <span class="item-company">${escapeHtml(proj.name)}</span>${proj.role ? ` — <span class="item-role">${escapeHtml(proj.role)}</span>` : ""}${proj.link ? ` (<a href="${escapeHtml(proj.link)}" target="_blank">Link</a>)` : ""}
          </div>
        </div>
        ${Array.isArray(proj.bullets) && proj.bullets.length > 0 ? `
          <ul class="bullets">
            ${proj.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
          </ul>
        ` : ""}
      </div>
    `).join("")}
  </div>` : ""}

  ${certifications.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Certifications</h2>
    ${certifications.map((cert) => `
      <div class="education-item">
        <div class="item-header">
          <div class="education-degree">${escapeHtml(cert.name)}${cert.issuer ? ` — <span class="education-inst">${escapeHtml(cert.issuer)}</span>` : ""}</div>
          ${cert.date ? `<div class="item-date">${escapeHtml(cert.date)}</div>` : ""}
        </div>
      </div>
    `).join("")}
  </div>` : ""}
</body>
</html>`;
}

/**
 * Generate PDF buffer from revised resume JSON using Puppeteer
 */
async function generateAtsPdfBuffer(revisedResume) {
  const html = renderAtsHtmlTemplate(revisedResume);
  const executablePath = findBrowserExecutable();

  const launchOptions = {
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: ["load", "networkidle0"],
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm",
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = {
  findBrowserExecutable,
  escapeHtml,
  renderAtsHtmlTemplate,
  generateAtsPdfBuffer,
};
