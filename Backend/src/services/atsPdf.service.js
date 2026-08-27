const fs = require("fs");
const path = require("path");
let puppeteerPromise;

async function loadPuppeteer() {
  if (!puppeteerPromise) {
    puppeteerPromise = import("puppeteer").catch(() => import("puppeteer-core"));
  }
  return puppeteerPromise;
}

function findBrowserExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidatePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Google\\Chrome\\Application\\chrome.exe") : null,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ].filter(Boolean);

  return candidatePaths.find((candidate) => fs.existsSync(candidate));
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeUrl(value = "") {
  const raw = String(value).trim();
  if (!raw) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function displayUrl(value = "") {
  return String(value)
    .replace(/^https?:\/\/(www\.)?/i, "")
    .replace(/\/$/, "");
}

/**
 * ATS-safe resume template.
 *
 * Important layout rule: the PDF uses explicit CSS page padding rather than
 * mixing @page margins with Puppeteer's margin option. Chromium can otherwise
 * measure the page at one width and print it at another width, which causes
 * right-aligned dates and long lines to appear clipped at the page edge.
 */
function renderAtsHtmlTemplate(resume) {
  const contact = resume.contact || {};
  const summary = resume.summary || "";
  const experience = Array.isArray(resume.experience) ? resume.experience : [];
  const skills = Array.isArray(resume.skills) ? resume.skills : [];
  const education = Array.isArray(resume.education) ? resume.education : [];
  const projects = Array.isArray(resume.projects) ? resume.projects : [];
  const certifications = Array.isArray(resume.certifications) ? resume.certifications : [];

  const contactItems = [
    contact.email ? `<span>${escapeHtml(contact.email)}</span>` : null,
    contact.phone ? `<span>${escapeHtml(contact.phone)}</span>` : null,
    contact.location ? `<span>${escapeHtml(contact.location)}</span>` : null,
    contact.linkedin ? `<a href="${escapeHtml(normalizeUrl(contact.linkedin))}">${escapeHtml(displayUrl(contact.linkedin))}</a>` : null,
    contact.github ? `<a href="${escapeHtml(normalizeUrl(contact.github))}">${escapeHtml(displayUrl(contact.github))}</a>` : null,
    contact.website ? `<a href="${escapeHtml(normalizeUrl(contact.website))}">${escapeHtml(displayUrl(contact.website))}</a>` : null,
  ].filter(Boolean).join('<span class="contact-sep" aria-hidden="true">|</span>');

  const renderItemHeader = (title, role, dates) => `
    <div class="item-header">
      <div class="item-title">
        ${escapeHtml(title || "")}${role ? ` <span class="item-role">— ${escapeHtml(role)}</span>` : ""}
      </div>
      ${dates ? `<div class="item-date">${escapeHtml(dates)}</div>` : ""}
    </div>`;

  const renderBullets = (bullets) => {
    if (!Array.isArray(bullets) || !bullets.length) return "";
    return `<ul class="bullets">${bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(contact.fullName || "Resume")}</title>
  <style>
    @page { size: Letter; margin: 0; }
    :root {
      --s: 1;
      --page-margin: 0.58in;
      --ink: #172033;
      --muted: #526074;
      --rule: #cbd3df;
      --accent: #0f172a;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { width: 100%; margin: 0; padding: 0; }
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, Calibri, sans-serif;
      font-size: calc(10pt * var(--s));
      line-height: 1.35;
      color: var(--ink);
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      overflow-wrap: anywhere;
      word-break: normal;
    }
    .page {
      width: 100%;
      padding: var(--page-margin);
    }
    .header {
      text-align: center;
      padding-bottom: calc(8pt * var(--s));
      margin-bottom: calc(10pt * var(--s));
      border-bottom: 1.25pt solid var(--accent);
    }
    .name {
      font-size: calc(19pt * var(--s));
      line-height: 1.08;
      font-weight: 700;
      letter-spacing: 0.15pt;
      color: var(--accent);
      margin-bottom: calc(4pt * var(--s));
    }
    .contact-line {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      column-gap: 5pt;
      row-gap: 2pt;
      font-size: calc(8.8pt * var(--s));
      line-height: 1.35;
      color: var(--muted);
    }
    .contact-line a { color: inherit; text-decoration: none; }
    .contact-sep { color: #9aa5b5; }

    .section {
      margin-bottom: calc(9pt * var(--s));
      break-inside: auto;
    }
    .section:last-child { margin-bottom: 0; }
    .section-title {
      display: block;
      font-size: calc(10.7pt * var(--s));
      line-height: 1.15;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.75pt;
      color: var(--accent);
      padding-bottom: calc(3pt * var(--s));
      margin-bottom: calc(5pt * var(--s));
      border-bottom: 0.8pt solid var(--rule);
      break-after: avoid;
    }
    .summary-text {
      font-size: calc(9.65pt * var(--s));
      line-height: 1.42;
      margin: 0;
      color: #263449;
    }

    .skills-group {
      margin: 0 0 calc(3.5pt * var(--s));
      font-size: calc(9.55pt * var(--s));
      line-height: 1.38;
    }
    .skills-group:last-child { margin-bottom: 0; }
    .skills-category { font-weight: 700; color: var(--accent); }
    .skills-list { color: #344257; }

    .item {
      margin-bottom: calc(7pt * var(--s));
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .item:last-child { margin-bottom: 0; }
    .item-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: calc(8pt * var(--s));
      align-items: baseline;
      width: 100%;
      margin-bottom: calc(1pt * var(--s));
    }
    .item-title {
      min-width: 0;
      font-size: calc(10pt * var(--s));
      line-height: 1.25;
      font-weight: 700;
      color: var(--accent);
      overflow-wrap: anywhere;
    }
    .item-role { font-weight: 600; color: #3c4b60; }
    .item-date {
      min-width: max-content;
      font-size: calc(9pt * var(--s));
      line-height: 1.2;
      font-weight: 600;
      color: #4b5a70;
      white-space: nowrap;
      text-align: right;
    }
    .item-location {
      margin: 0 0 calc(1.5pt * var(--s));
      font-size: calc(8.7pt * var(--s));
      line-height: 1.2;
      color: #68778b;
      font-style: italic;
    }
    .bullets {
      margin: calc(2pt * var(--s)) 0 0;
      padding-left: calc(14pt * var(--s));
    }
    .bullets li {
      margin: 0 0 calc(2pt * var(--s));
      padding-left: calc(1pt * var(--s));
      font-size: calc(9.45pt * var(--s));
      line-height: 1.35;
      color: #243247;
      overflow-wrap: anywhere;
    }
    .bullets li:last-child { margin-bottom: 0; }

    .education-item {
      margin-bottom: calc(5pt * var(--s));
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .education-item:last-child { margin-bottom: 0; }
    .education-degree {
      min-width: 0;
      font-size: calc(10pt * var(--s));
      line-height: 1.25;
      font-weight: 700;
      color: var(--accent);
      overflow-wrap: anywhere;
    }
    .education-inst { font-weight: 400; color: #3c4b60; }
    .education-details {
      margin-top: calc(1pt * var(--s));
      font-size: calc(9.05pt * var(--s));
      line-height: 1.35;
      color: #4b5a70;
    }

    @media print {
      .section-title { break-after: avoid-page; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="header">
      <div class="name">${escapeHtml(contact.fullName || "Candidate Name")}</div>
      ${contactItems ? `<div class="contact-line">${contactItems}</div>` : ""}
    </header>

    ${summary ? `
    <section class="section">
      <h2 class="section-title">Professional Summary</h2>
      <p class="summary-text">${escapeHtml(summary)}</p>
    </section>` : ""}

    ${skills.length ? `
    <section class="section">
      <h2 class="section-title">Technical Skills</h2>
      ${skills.map((skill) => `
        <div class="skills-group">
          <span class="skills-category">${escapeHtml(skill.category || "Skills")}: </span>
          <span class="skills-list">${escapeHtml(Array.isArray(skill.items) ? skill.items.join(", ") : skill.items || "")}</span>
        </div>`).join("")}
    </section>` : ""}

    ${experience.length ? `
    <section class="section">
      <h2 class="section-title">Professional Experience</h2>
      ${experience.map((exp) => `
        <article class="item">
          ${renderItemHeader(exp.company, exp.title, exp.dates)}
          ${exp.location ? `<div class="item-location">${escapeHtml(exp.location)}</div>` : ""}
          ${renderBullets(exp.bullets)}
        </article>`).join("")}
    </section>` : ""}

    ${education.length ? `
    <section class="section">
      <h2 class="section-title">Education</h2>
      ${education.map((edu) => `
        <article class="education-item">
          <div class="item-header">
            <div class="education-degree">
              ${escapeHtml(edu.degree || "")}${edu.institution ? ` <span class="education-inst">— ${escapeHtml(edu.institution)}</span>` : ""}
            </div>
            ${edu.dates ? `<div class="item-date">${escapeHtml(edu.dates)}</div>` : ""}
          </div>
          ${edu.details ? `<div class="education-details">${escapeHtml(edu.details)}</div>` : ""}
        </article>`).join("")}
    </section>` : ""}

    ${projects.length ? `
    <section class="section">
      <h2 class="section-title">Key Projects</h2>
      ${projects.map((project) => `
        <article class="item">
          ${renderItemHeader(project.name, project.role, project.dates)}
          ${renderBullets(project.bullets)}
        </article>`).join("")}
    </section>` : ""}

    ${certifications.length ? `
    <section class="section">
      <h2 class="section-title">Certifications</h2>
      ${certifications.map((cert) => `
        <article class="education-item">
          <div class="item-header">
            <div class="education-degree">
              ${escapeHtml(cert.name || "")}${cert.issuer ? ` <span class="education-inst">— ${escapeHtml(cert.issuer)}</span>` : ""}
            </div>
            ${cert.date ? `<div class="item-date">${escapeHtml(cert.date)}</div>` : ""}
          </div>
        </article>`).join("")}
    </section>` : ""}
  </main>
</body>
</html>`;
}

const pdfCache = new Map();
let warmBrowserInstance = null;
let browserIdleTimeout = null;

function scheduleBrowserIdleClose() {
  if (browserIdleTimeout) clearTimeout(browserIdleTimeout);
  browserIdleTimeout = setTimeout(async () => {
    if (warmBrowserInstance && warmBrowserInstance.connected) {
      try { await warmBrowserInstance.close(); } catch { /* ignore */ }
      warmBrowserInstance = null;
    }
  }, 45000);
}

async function getWarmBrowser() {
  if (browserIdleTimeout) {
    clearTimeout(browserIdleTimeout);
    browserIdleTimeout = null;
  }
  if (warmBrowserInstance && warmBrowserInstance.connected) return warmBrowserInstance;

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
  if (executablePath) launchOptions.executablePath = executablePath;

  const puppeteer = await loadPuppeteer();
  warmBrowserInstance = await puppeteer.launch(launchOptions);
  warmBrowserInstance.on("disconnected", () => { warmBrowserInstance = null; });
  return warmBrowserInstance;
}

const PAGE_WIDTH_PX = 816; // 8.5in × 96dpi
const PAGE_HEIGHT_PX = 1056; // 11in × 96dpi
const PAGE_MARGIN_IN = 0.58;
const PAGE_MARGIN_PX = PAGE_MARGIN_IN * 96;
const PRINTABLE_WIDTH_PX = PAGE_WIDTH_PX - PAGE_MARGIN_PX * 2;
const PRINTABLE_HEIGHT_PX = PAGE_HEIGHT_PX - PAGE_MARGIN_PX * 2;
const MIN_SCALE = 0.86;
const MAX_SCALE = 1.12;
const MAX_FIT_ATTEMPTS = 7;

async function setLayoutScale(page, scale) {
  await page.evaluate((value) => {
    document.documentElement.style.setProperty("--s", String(value));
  }, scale);
}

async function measureContentHeight(page) {
  return page.evaluate(() => {
    const pageEl = document.querySelector(".page");
    if (!pageEl) return document.documentElement.scrollHeight;
    const styles = getComputedStyle(pageEl);
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;
    return Math.max(0, pageEl.getBoundingClientRect().height - paddingTop - paddingBottom);
  });
}

async function fitResume(page) {
  await page.setViewport({
    width: Math.round(PRINTABLE_WIDTH_PX),
    height: Math.round(PRINTABLE_HEIGHT_PX * 1.5),
    deviceScaleFactor: 1,
  });

  let scale = 1;
  await setLayoutScale(page, scale);
  let contentHeight = await measureContentHeight(page);

  if (contentHeight > PRINTABLE_HEIGHT_PX) {
    let attempts = 0;
    while (contentHeight > PRINTABLE_HEIGHT_PX && scale > MIN_SCALE && attempts < MAX_FIT_ATTEMPTS) {
      const ratio = PRINTABLE_HEIGHT_PX / contentHeight;
      scale = Math.max(MIN_SCALE, scale * ratio * 0.985);
      await setLayoutScale(page, scale);
      contentHeight = await measureContentHeight(page);
      attempts += 1;
    }
  } else if (contentHeight < PRINTABLE_HEIGHT_PX * 0.68) {
    let attempts = 0;
    let lastGood = scale;
    while (scale < MAX_SCALE && attempts < MAX_FIT_ATTEMPTS) {
      const ratio = PRINTABLE_HEIGHT_PX / Math.max(contentHeight, 1);
      const nextScale = Math.min(MAX_SCALE, scale * Math.sqrt(ratio) * 0.97);
      if (nextScale <= scale) break;
      await setLayoutScale(page, nextScale);
      const nextHeight = await measureContentHeight(page);
      if (nextHeight > PRINTABLE_HEIGHT_PX) {
        await setLayoutScale(page, lastGood);
        contentHeight = await measureContentHeight(page);
        break;
      }
      scale = nextScale;
      contentHeight = nextHeight;
      lastGood = scale;
      attempts += 1;
    }
  }

  return { scale, fitsOnePage: contentHeight <= PRINTABLE_HEIGHT_PX, contentHeight };
}

async function generateAtsPdfBuffer(revisedResume, cacheKey = null) {
  const effectiveCacheKey = cacheKey || JSON.stringify(revisedResume);
  if (pdfCache.has(effectiveCacheKey)) return pdfCache.get(effectiveCacheKey);

  const html = renderAtsHtmlTemplate(revisedResume);
  const browser = await getWarmBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 10000 });
    await fitResume(page);

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      displayHeaderFooter: false,
      scale: 1,
    });

    if (pdfCache.size >= 40) {
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
