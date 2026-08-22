// The API's interview report doesn't currently echo back the resume's
// filename, so two reports run against similar/identical job postings are
// indistinguishable in the reports list. Until the backend includes a
// resume identifier on the report itself, we remember the filename the
// user attached, keyed by the report id it produced, so the list/detail
// views can label each report with the resume it came from.
//
// This is a client-side convenience only: it's scoped to this browser and
// won't follow the report across devices or sessions.

const PREFIX = "resume-analyzer:resume-name:";

export function rememberResumeName(reportId, fileName) {
  if (!reportId || !fileName || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${PREFIX}${reportId}`, fileName);
  } catch {
    // Storage unavailable (private mode, quota, etc.) — non-critical.
  }
}

export function recallResumeName(reportId) {
  if (!reportId || typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(`${PREFIX}${reportId}`) || "";
  } catch {
    return "";
  }
}
