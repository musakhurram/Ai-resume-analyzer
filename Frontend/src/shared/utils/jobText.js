// Small helpers for turning a raw, user-pasted job description (often
// markdown, sometimes with headers like "# Data Analyst **Company:** ...")
// into clean, display-safe text — used anywhere a JD gets summarized.

/**
 * Strip common markdown syntax so raw JD text is safe to show as plain
 * prose (no literal #, **, *, `, _ characters, no [text](url) links).
 * Preserves line breaks — callers decide whether to collapse them.
 */
export function stripMarkdown(text = "") {
  if (!text) return "";
  return text
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headers
    .replace(/\*\*(.*?)\*\*/g, "$1") // bold
    .replace(/__(.*?)__/g, "$1") // bold (underscore)
    .replace(/\*(.*?)\*/g, "$1") // italic
    .replace(/`{1,3}([^`]*)`{1,3}/g, "$1") // inline/code
    .replace(/^\s*[-*+]\s+/gm, "") // bullet list markers
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // [text](url) -> text
    .replace(/[ \t]+\n/g, "\n") // trailing spaces before line breaks
    .trim();
}

/**
 * Pull a clean, short role title out of a JD's first non-empty line
 * (e.g. "# Backend Software Engineer" -> "Backend Software Engineer").
 * Falls back to a flattened excerpt if the JD has no clear first line.
 */
export function parseJobTitle(jobDescription = "", max = 70) {
  if (!jobDescription) return "Untitled role";
  const firstLine = jobDescription
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  const cleaned = stripMarkdown(firstLine || "").trim();
  if (!cleaned) return "Untitled role";
  return cleaned.length > max ? `${cleaned.slice(0, max)}…` : cleaned;
}

/**
 * Best-effort company name extraction from a "**Company:** X" style line,
 * markdown or not. Returns "" if no clear match is found — callers should
 * treat that as "omit this field" rather than showing a placeholder.
 */
export function parseJobCompany(jobDescription = "") {
  if (!jobDescription) return "";
  const match = jobDescription.match(/\*{0,2}company\*{0,2}\s*:\s*([^\n|]+)/i);
  if (!match) return "";
  return stripMarkdown(match[1]).trim();
}

/** Convenience wrapper returning { title, company } together. */
export function parseJobMeta(jobDescription = "") {
  return {
    title: parseJobTitle(jobDescription),
    company: parseJobCompany(jobDescription),
  };
}
