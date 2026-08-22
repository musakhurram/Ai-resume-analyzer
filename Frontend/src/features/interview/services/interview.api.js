import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

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
