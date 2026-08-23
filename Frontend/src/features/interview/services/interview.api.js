import api from "../../../shared/api/client";

export async function submitReview({ resume, selfDescription, jobDescription }) {
  const formData = new FormData();
  formData.append("resume", resume);
  formData.append("selfDescription", selfDescription || "");
  formData.append("jobDescription", jobDescription);

  const response = await api.post("/api/interview", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function listReports() {
  const response = await api.get("/api/interview");
  return response.data;
}

export async function getReportById(id) {
  const response = await api.get(`/api/interview/${id}`);
  return response.data;
}

export async function downloadReportPdf(id) {
  const response = await api.get(`/api/interview/${id}/pdf`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `interview-report-${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
