import api from "../../../shared/api/client";

export async function analyzeAtsResume({ resume, resumeText, fileName, category = "general", title = "" }) {
  if (resume) {
    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("category", category);
    if (title) formData.append("title", title);
    const response = await api.post("/api/resume/ats-analyze", formData, { headers: { "Content-Type": "multipart/form-data" } });
    return response.data;
  }
  const response = await api.post("/api/resume/ats-analyze", { resume: resumeText, fileName: fileName || "Pasted-Resume.txt", category, title });
  return response.data;
}

export async function reviseAtsResume({ id, sections = "all", customNotes = "" }) {
  const response = await api.post("/api/resume/ats-revise", { id, sections, customNotes });
  return response.data;
}

export async function saveAtsManualRevision(id, revisedResume) {
  const response = await api.put(`/api/resume/ats-revision/${id}`, { revisedResume });
  return response.data;
}

export async function getAtsReportById(id) {
  const response = await api.get(`/api/resume/ats-report/${id}`);
  return response.data;
}

export async function listAtsReports({ search = "", sort = "recent", limit = 50 } = {}) {
  const params = { sort, limit };
  if (search.trim()) params.search = search.trim();
  const response = await api.get("/api/resume/ats-reports", { params });
  return response.data;
}

export async function getAtsPreviewPdf(id) {
  const response = await api.get(`/api/resume/ats-revision-pdf/${id}`, {
    responseType: "arraybuffer",
    headers: { Accept: "application/pdf" },
  });
  return response.data;
}

export async function getAtsOriginalPdf(id, originalPdfUrl = "") {
  if (originalPdfUrl?.startsWith("blob:")) {
    const response = await fetch(originalPdfUrl);
    if (!response.ok) throw new Error(`Unable to read the uploaded resume PDF (${response.status}).`);
    return response.arrayBuffer();
  }
  if (originalPdfUrl) {
    const response = await api.get(originalPdfUrl, { responseType: "arraybuffer", headers: { Accept: "application/pdf" } });
    return response.data;
  }
  const response = await api.get(`/api/resume/ats-original/${id}`, { responseType: "arraybuffer", headers: { Accept: "application/pdf" } });
  return response.data;
}

export async function downloadAtsPdf(id, candidateName = "ATS-Resume") {
  const response = await api.get(`/api/resume/ats-revision-pdf/${id}`, {
    responseType: "blob",
    headers: { Accept: "application/pdf" },
  });
  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(candidateName || "ATS-Resume").replace(/[^a-zA-Z0-9_-]/g, "_")}_ATS_Optimized.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
