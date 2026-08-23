import axios from "axios";

// In production this must be set to the deployed backend URL
// (e.g. https://api.yourapp.com). Falls back to localhost for local dev.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
