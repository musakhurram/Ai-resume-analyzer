import api from "../../../shared/api/client";

export async function analyzeAtsResume({ resume, resumeText, fileName, category = "general", title = "" }) {
  if (resume) {
    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("category", category);
    if (title) formData.append("title", title);
    const response = await api.post("/api/resume/ats-analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  const response = await api.post("/api/resume/ats-analyze", {
    resume: resumeText,
    fileName: fileName || "Pasted-Resume.txt",
    category,
    title,
  });
  return response.data;
}

export async function reviseAtsResume({ id, sections = "all", customNotes = "" }) {
  const response = await api.post("/api/resume/ats-revise", { id, sections, customNotes });
  return response.data;
}

export async function getAtsReportById(id) {
  const response = await api.get(`/api/resume/ats-report/${id}`);
  return response.data;
}

export async function listAtsReports({ category = "all", search = "", limit = 50 } = {}) {
  const params = { category, limit };
  if (search.trim()) params.search = search.trim();
  const response = await api.get("/api/resume/ats-reports", { params });
  return response.data;
}

export async function fetchAtsPdfBlobUrl(id) {
  const response = await api.get(`/api/resume/ats-download/${id}`, { responseType: "blob" });
  const blob = new Blob([response.data], { type: "application/pdf" });
  return window.URL.createObjectURL(blob);
}

export async function downloadAtsPdf(id, candidateName = "ATS-Resume") {
  const response = await api.get(`/api/resume/ats-download/${id}`, { responseType: "blob" });
  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeName = (candidateName || "ATS-Resume").replace(/[^a-zA-Z0-9_-]/g, "_");
  link.download = `${safeName}_ATS_Optimized.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
