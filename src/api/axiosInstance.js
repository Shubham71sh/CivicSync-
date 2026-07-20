import axios from "axios";

// ─── Base URL ────────────────────────────────────────────────────────────────
// Module 1 (AI Civic Twin) — Node.js + Express backend on port 5000.
// Module 3 (Disaster Relief) — FastAPI backend stays on port 8000 (src/services/api.js).
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Automatically attaches the JWT Bearer token to every request.
// Token is stored in localStorage as "civicsync_token".
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("civicsync_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handles 401 globally — clears stale token on auth failure.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage so AuthContext re-hydrates cleanly
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/signup" && path !== "/") {
        localStorage.removeItem("civicsync_token");
        localStorage.removeItem("civicsync_user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;