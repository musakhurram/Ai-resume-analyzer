const fs = require("fs");
const path = require("path");
let puppeteerPromise;

async function loadPuppeteer() {
  if (!puppeteerPromise) {
    puppeteerPromise = import("puppeteer").catch(() => import("puppeteer-core"));
  }

  return puppeteerPromise;
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

/**
 * Render structured resume JSON to clean single-column ATS-friendly HTML/CSS.
 *
 * Design constraints (ATS-safety):
 *  - Single column, no tables, no floated/positioned layout, no images/icons.
 *  - Standard web-safe fonts only (Arial/Helvetica/Calibri fallback chain).
 *  - Headings and links are real text nodes (not text-transform tricks that
 *    would change extracted text, not background-image labels, etc).
 *  - All sizing that affects vertical rhythm (font-size, section/item
 *    spacing, list spacing) is expressed via calc(...) against the single
 *    `--s` custom property so the one-page auto-fit pass in
 *    generateAtsPdfBuffer can shrink the whole document proportionally
 *    without touching the markup or re-rendering from scratch.
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
  ].filter(Boolean).join(' <span class="contact-sep">|</span> ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(contact.fullName || "Resume")}</title>
  <style>
    /* Margins are controlled entirely from Puppeteer's page.pdf({ margin })
       call (single source of truth for the printable area), so the @page
       box itself stays at zero margin here to avoid the two settings
       silently disagreeing with each other. */
    @page {
      size: letter;
      margin: 0;
    }
    :root {
      /* Uniform shrink factor applied to every font-size and every piece of
         vertical rhythm below. The PDF service reads/writes this custom
         property on document.documentElement to auto-fit the resume onto
         a single page without needing separate "compact" markup/CSS. */
      --s: 1;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
    }
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, Calibri, sans-serif;
      font-size: calc(10.2pt * var(--s));
      line-height: 1.38;
      color: #1a1a1a;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      hyphens: manual;
    }
    a {
      color: #1a1a1a;
      text-decoration: none;
    }
    .header {
      text-align: center;
      margin-bottom: calc(11pt * var(--s));
      border-bottom: 1.25pt solid #111827;
      padding-bottom: calc(7pt * var(--s));
    }
    .name {
      font-size: calc(19pt * var(--s));
      font-weight: 700;
      letter-spacing: 0.3pt;
      color: #0f172a;
      margin-bottom: calc(4pt * var(--s));
    }
    .contact-line {
      font-size: calc(9.3pt * var(--s));
      color: #334155;
      line-height: 1.5;
    }
    .contact-sep {
      color: #94a3b8;
      margin: 0 4pt;
    }
    .section {
      margin-bottom: calc(9.5pt * var(--s));
    }
    .section:last-child {
      margin-bottom: 0;
    }
    .section-title {
      font-size: calc(10.8pt * var(--s));
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.7pt;
      color: #0f172a;
      border-bottom: 0.9pt solid #cbd5e1;
      padding-bottom: calc(2.5pt * var(--s));
      margin-bottom: calc(5.5pt * var(--s));
    }
    .summary-text {
      font-size: calc(9.9pt * var(--s));
      line-height: 1.42;
      color: #26324a;
      text-align: left;
    }
    .item {
      margin-bottom: calc(7.5pt * var(--s));
      page-break-inside: avoid;
    }
    .item:last-child {
      margin-bottom: 0;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8pt;
      margin-bottom: calc(1pt * var(--s));
    }
    .item-title-group {
      font-weight: 700;
      font-size: calc(10.2pt * var(--s));
      color: #0f172a;
    }
    .item-role {
      font-weight: 600;
      color: #334155;
    }
    .item-date {
      font-size: calc(9.3pt * var(--s));
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .item-location {
      font-size: calc(8.9pt * var(--s));
      color: #64748b;
      font-style: italic;
      margin-bottom: calc(1.5pt * var(--s));
    }
    ul.bullets {
      list-style-type: disc;
      margin-left: 14pt;
      margin-top: calc(2pt * var(--s));
    }
    ul.bullets li {
      font-size: calc(9.7pt * var(--s));
      line-height: 1.36;
      color: #1e293b;
      margin-bottom: calc(2pt * var(--s));
      padding-left: 1pt;
    }
    ul.bullets li:last-child {
      margin-bottom: 0;
    }
    .skills-group {
      margin-bottom: calc(3.5pt * var(--s));
      font-size: calc(9.8pt * var(--s));
      line-height: 1.4;
    }
    .skills-group:last-child {
      margin-bottom: 0;
    }
    .skills-category {
      font-weight: 700;
      color: #0f172a;
    }
    .skills-list {
      color: #334155;
    }
    .education-item {
      margin-bottom: calc(5.5pt * var(--s));
      page-break-inside: avoid;
    }
    .education-item:last-child {
      margin-bottom: 0;
    }
    .education-degree {
      font-weight: 700;
      font-size: calc(10.2pt * var(--s));
      color: #0f172a;
    }
    .education-inst {
      font-weight: 400;
      color: #334155;
    }
    .education-details {
      font-size: calc(9.2pt * var(--s));
      color: #475569;
      margin-top: calc(1pt * var(--s));
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
        <span class="skills-category">${escapeHtml(s.category)}: </span><span class="skills-list">${Array.isArray(s.items) ? escapeHtml(s.items.join(", ")) : escapeHtml(s.items || "")}</span>
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
            ${escapeHtml(exp.company)}${exp.title ? ` &mdash; <span class="item-role">${escapeHtml(exp.title)}</span>` : ""}
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
            ${escapeHtml(edu.degree)}${edu.institution ? ` &mdash; <span class="education-inst">${escapeHtml(edu.institution)}</span>` : ""}
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
            ${escapeHtml(proj.name)}${proj.role ? ` &mdash; <span class="item-role">${escapeHtml(proj.role)}</span>` : ""}${proj.link ? ` (<a href="${escapeHtml(proj.link)}" target="_blank">Link</a>)` : ""}
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
          <div class="education-degree">${escapeHtml(cert.name)}${cert.issuer ? ` &mdash; <span class="education-inst">${escapeHtml(cert.issuer)}</span>` : ""}</div>
          ${cert.date ? `<div class="item-date">${escapeHtml(cert.date)}</div>` : ""}
        </div>
      </div>
    `).join("")}
  </div>` : ""}
</body>
</html>`;
}

// In-memory cache for fast instant PDF delivery (keyed by report ID / resume JSON hash)
const pdfCache = new Map();

let warmBrowserInstance = null;
let browserIdleTimeout = null;

function scheduleBrowserIdleClose() {
  if (browserIdleTimeout) clearTimeout(browserIdleTimeout);
  browserIdleTimeout = setTimeout(async () => {
    if (warmBrowserInstance && warmBrowserInstance.connected) {
      try {
        await warmBrowserInstance.close();
      } catch {
        // Ignore close errors
      }
      warmBrowserInstance = null;
    }
  }, 45000); // Keep alive for 45 seconds of inactivity
}

async function getWarmBrowser() {
  if (browserIdleTimeout) {
    clearTimeout(browserIdleTimeout);
    browserIdleTimeout = null;
  }

  if (warmBrowserInstance && warmBrowserInstance.connected) {
    return warmBrowserInstance;
  }

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
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-default-apps",
      "--disable-sync",
      "--disable-translate",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-default-browser-check",
    ],
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  const puppeteer = await loadPuppeteer();
  warmBrowserInstance = await puppeteer.launch(launchOptions);
  warmBrowserInstance.on("disconnected", () => {
    warmBrowserInstance = null;
  });

  return warmBrowserInstance;
}

/**
 * One-page auto-fit geometry.
 *
 * The template's font sizes and vertical spacing are all expressed as
 * calc(<base> * var(--s)), so shrinking the whole resume to fit one page is
 * just a matter of finding the smallest --s (down to MIN_FONT_SCALE) that
 * makes the rendered content height fit inside the printable area. This is
 * measured directly in the browser (fast, no repeated PDF renders needed)
 * by setting the viewport to the printable width and reading
 * document.documentElement.scrollHeight.
 */
const PAGE_WIDTH_IN = 8.5;
const PAGE_HEIGHT_IN = 11; // US Letter
const PX_PER_IN = 96; // CSS reference pixel, matches Chromium's print pipeline
const PX_PER_MM = PX_PER_IN / 25.4;
const mmToPx = (mm) => mm * PX_PER_MM;

// Margins to try, widest (most generous) first. If the resume still doesn't
// fit at the smallest allowed font scale, margins are tightened step by
// step as a last resort before falling back to letting it spill onto a
// second page (better than illegibly small text).
const MARGIN_STEPS_MM = [15, 13, 11, 10];
const MIN_FONT_SCALE = 0.72;
const MAX_FIT_ATTEMPTS = 8;

/**
 * Sets the viewport to the printable content area for a given margin, then
 * iteratively shrinks --s until the rendered content fits within one
 * printable page height (or the scale floor is hit).
 */
async function fitToOnePage(page, marginMm) {
  const printableWidthPx = PAGE_WIDTH_IN * PX_PER_IN - 2 * mmToPx(marginMm);
  const printableHeightPx = PAGE_HEIGHT_IN * PX_PER_IN - 2 * mmToPx(marginMm);

  await page.setViewport({
    width: Math.round(printableWidthPx),
    height: Math.round(printableHeightPx) + 400, // headroom so nothing clips during measurement
  });

  let scale = 1;
  await page.evaluate((s) => {
    document.documentElement.style.setProperty("--s", String(s));
  }, scale);

  let contentHeight = await page.evaluate(() => document.documentElement.scrollHeight);

  let attempts = 0;
  while (
    contentHeight > printableHeightPx &&
    scale > MIN_FONT_SCALE &&
    attempts < MAX_FIT_ATTEMPTS
  ) {
    const ratio = printableHeightPx / contentHeight;
    // Small safety buffer (0.985) so the search converges from above rather
    // than oscillating just over the limit due to sub-pixel layout rounding.
    scale = Math.max(MIN_FONT_SCALE, scale * ratio * 0.985);
    await page.evaluate((s) => {
      document.documentElement.style.setProperty("--s", String(s));
    }, scale);
    contentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    attempts += 1;
  }

  return { fits: contentHeight <= printableHeightPx, scale, contentHeight, printableHeightPx };
}

/**
 * Generate a single-page, ATS-friendly PDF buffer from revised resume JSON
 * using Puppeteer. Automatically shrinks font size/spacing (and, only as a
 * last resort, page margins) so typical one-to-two-page resume content
 * lands on a single US Letter page without truncating any content.
 */
async function generateAtsPdfBuffer(revisedResume, cacheKey = null) {
  const effectiveCacheKey = cacheKey || JSON.stringify(revisedResume);
  if (pdfCache.has(effectiveCacheKey)) {
    return pdfCache.get(effectiveCacheKey);
  }

  const html = renderAtsHtmlTemplate(revisedResume);
  const browser = await getWarmBrowser();
  const page = await browser.newPage();

  try {
    // Fast inline rendering without waiting for external network idle
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });

    let marginMm = MARGIN_STEPS_MM[0];
    let fit = await fitToOnePage(page, marginMm);

    for (let i = 1; i < MARGIN_STEPS_MM.length && !fit.fits; i += 1) {
      marginMm = MARGIN_STEPS_MM[i];
      fit = await fitToOnePage(page, marginMm);
    }

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: {
        top: `${marginMm}mm`,
        right: `${marginMm}mm`,
        bottom: `${marginMm}mm`,
        left: `${marginMm}mm`,
      },
    });

    // Store in cache (cap at 40 items)
    if (pdfCache.size > 40) {
      const oldestKey = pdfCache.keys().next().value;
      pdfCache.delete(oldestKey);
    }
    pdfCache.set(effectiveCacheKey, pdfBuffer);

    return pdfBuffer;
  } finally {
    await page.close();
    scheduleBrowserIdleClose();
  }
}

module.exports = {
  findBrowserExecutable,
  escapeHtml,
  renderAtsHtmlTemplate,
  generateAtsPdfBuffer,
};