import axios from "axios";
import { auth } from "../firebase/firebase";

// ─── Base URL ────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Always gets a fresh Firebase token before every request.
// Firebase SDK handles caching and auto-refresh internally.
api.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // forceRefresh=false — Firebase returns cached token if still valid,
        // or auto-refreshes it if it has expired
        const freshToken = await currentUser.getIdToken(false);
        config.headers.Authorization = `Bearer ${freshToken}`;
        // Keep localStorage in sync
        localStorage.setItem("civicsync_token", freshToken);
      } else {
        // Fall back to stored token if no Firebase user (e.g. demo mode)
        const storedToken = localStorage.getItem("civicsync_token");
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`;
        }
      }
    } catch (err) {
      // If token refresh fails, try stored token
      const storedToken = localStorage.getItem("civicsync_token");
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token truly invalid — try one force-refresh then retry
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const freshToken = await currentUser.getIdToken(true); // force refresh
          localStorage.setItem("civicsync_token", freshToken);
          // Retry the original request once with the new token
          error.config.headers.Authorization = `Bearer ${freshToken}`;
          return api(error.config);
        }
      } catch (refreshErr) {
        // Refresh failed — clear storage and redirect to login
        localStorage.removeItem("civicsync_token");
        localStorage.removeItem("civicsync_user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
