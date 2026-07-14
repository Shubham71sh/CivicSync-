import axios from "axios";

// ─── Base URL ────────────────────────────────────────────────────────────────
// Change this to your production API URL when deploying.
// In development, FastAPI server runs on port 8000.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;