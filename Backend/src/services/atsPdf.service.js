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
