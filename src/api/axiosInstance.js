import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Keep profile, bill, and chat requests tied to the same signed-in citizen.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("civicsync_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
