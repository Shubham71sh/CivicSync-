import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

// ---------------- Health Check ----------------
export async function checkBackend() {
  const response = await fetch(`${BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend not running");
  }

  return response.json();
}

// ---------------- Disaster Report ----------------
export async function createReport(reportData) {
  const response = await fetch(`${BASE_URL}/reports/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reportData),
  });

  if (!response.ok) {
    throw new Error("Failed to create report");
  }

  return response.json();
}

// ---------------- Upload Images ----------------
export async function uploadImages(reportId, files) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch(
    `${BASE_URL}/reports/${reportId}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Image upload failed");
  }

  return response.json();
}

// ---------------- AI Analysis ----------------
export async function analyzeReport(reportId) {
  const response = await fetch(
    `${BASE_URL}/reports/${reportId}/analyze`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Analysis failed");
  }

  return response.json();
}

// ---------------- AI Chat ----------------
export const sendMessage = async (message, language = "en") => {
  const response = await axios.post(`${BASE_URL}/chat`, {
    message,
    language,
  });

  return response.data;
};