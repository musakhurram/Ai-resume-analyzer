import axios from "axios";

// Vite bakes VITE_* values into the production bundle. Never let a stale
// localhost value from Vercel point a deployed frontend at the user's machine.
const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim();
const isLocalhost = typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);
const isConfiguredLocalApi = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(configuredApiUrl);

const baseURL = !isLocalhost && isConfiguredLocalApi
  ? "https://resume-backend-musa-ba96.vercel.app"
  : configuredApiUrl ||
    (isLocalhost ? "http://localhost:3000" : "https://resume-backend-musa-ba96.vercel.app");

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Cookie auth is the primary mechanism.
// Bearer token is a fallback for browsers where cross-site cookies are not sent reliably.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ra_auth_token");

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Preview is a protected PDF endpoint. If a deployment is running an older
// backend without /ats-preview/:id, retry through the authenticated download endpoint.
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
