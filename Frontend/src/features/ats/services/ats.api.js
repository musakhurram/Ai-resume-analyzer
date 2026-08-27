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
  try {
    const response = await api.get(`/api/resume/ats-preview/${id}`, {
      responseType: "arraybuffer",
      headers: { Accept: "application/pdf" },
    });
    return response.data;
  } catch (error) {
    // Some deployed versions may not yet expose the dedicated preview route.
    // Fall back to the authenticated download endpoint, which returns the
    // same generated PDF without exposing the report publicly.
    if (error?.response?.status === 404) {
      const response = await api.get(`/api/resume/ats-download/${id}`, {
        responseType: "arraybuffer",
        headers: { Accept: "application/pdf" },
      });
      return response.data;
    }
    throw error;
  }
}

export async function getAtsOriginalPdf(id, originalPdfUrl = "") {
  if (originalPdfUrl) {
    const response = await api.get(originalPdfUrl, {
      responseType: "arraybuffer",
      headers: { Accept: "application/pdf" },
    });
    return response.data;
  }
  const response = await api.get(`/api/resume/ats-original/${id}`, {
    responseType: "arraybuffer",
    headers: { Accept: "application/pdf" },
  });
  return response.data;
}

export async function downloadAtsPdf(id, candidateName = "ATS-Resume") {
  const response = await api.get(`/api/resume/ats-download/${id}`, { responseType: "blob", headers: { Accept: "application/pdf" } });
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
