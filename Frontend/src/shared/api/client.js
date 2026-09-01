import axios from "axios";

// Use the local backend during development and the deployed backend in
// production. VITE_API_URL can still override this in either environment.
const isLocalhost = typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const baseURL = import.meta.env.VITE_API_URL ||
  (isLocalhost ? "http://localhost:3000" : "https://resume-backend-musa-ba96.vercel.app");

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Cookie auth is the primary mechanism.
// Bearer token is a fallback for mobile browsers where cross-site cookies may not be sent reliably.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ra_auth_token");

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Preview is a protected PDF endpoint. If a deployment is running an older
// backend without /ats-preview/:id, retry through the existing authenticated
// download endpoint instead of exposing a public PDF URL or failing the UI.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    const status = error?.response?.status;
    const url = String(config?.url || "");

    if (
      status === 404 &&
      config &&
      !config._atsPreviewFallback &&
      /\/api\/resume\/ats-preview\/[^/]+(?:$|[?#])/.test(url)
    ) {
      const fallbackConfig = {
        ...config,
        url: url.replace("/ats-preview/", "/ats-download/"),
        _atsPreviewFallback: true,
      };
      return api.request(fallbackConfig);
    }

    return Promise.reject(error);
  },
);

export default api;
