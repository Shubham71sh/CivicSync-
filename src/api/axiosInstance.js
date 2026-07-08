import axios from "axios";

// ─── Base URL ────────────────────────────────────────────────────────────────
// Change this to your production API URL when deploying.
// In development, your Express server should run on port 5000.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attach the JWT token from localStorage to every outgoing request.
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
// On 401 Unauthorized, clear local storage and redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("civicsync_token");
      localStorage.removeItem("civicsync_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
