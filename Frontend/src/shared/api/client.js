import axios from "axios";

// In production this must be set to the deployed backend URL.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Cookie auth is the primary mechanism.
// Bearer token is a fallback for mobile browsers where
// cross-site cookies may not be sent reliably.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ra_auth_token");

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;