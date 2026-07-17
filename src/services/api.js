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

// ---------------- Eligibility ----------------
export async function checkEligibility(reportId) {
  const response = await fetch(
    `${BASE_URL}/reports/${reportId}/eligibility`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Eligibility check failed");
  }

  return response.json();
}

// ---------------- Documents ----------------

export async function saveDocuments(reportId) {

  const response = await fetch(
    `${BASE_URL}/reports/${reportId}/documents`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save documents");
  }

  return response.json();
}

export async function getDocuments(reportId) {

  const response = await fetch(
    `${BASE_URL}/reports/${reportId}/documents`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }

  return response.json();
}

// ---------------- Timeline ----------------

export async function saveTimeline(reportId) {

  const response = await fetch(
    `${BASE_URL}/reports/${reportId}/timeline`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save timeline");
  }

  return response.json();
}

export async function getTimeline(reportId) {

  const response = await fetch(
    `${BASE_URL}/reports/${reportId}/timeline`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch timeline");
  }

  return response.json();
}

// ---------------- Nearby Help ----------------

export async function saveNearbyHelp(reportId) {

  const response = await fetch(
    `${BASE_URL}/reports/${reportId}/nearby-help`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save nearby help");
  }

  return response.json();
}

export async function getNearbyHelp(reportId) {

  const response = await fetch(
    `${BASE_URL}/reports/${reportId}/nearby-help`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch nearby help");
  }

  return response.json();
}

// ---------------- Government Schemes ----------------

export async function getSchemes(disaster, damage, state) {

    const response = await fetch(
        `${BASE_URL}/schemes?disaster=${disaster}&damage=${damage}&state=${state}`
    );

    const data = await response.json();

    console.log("SCHEME API RESPONSE");
    console.log(JSON.stringify(data,null,2));

    return data;
}

// ---------------- AI Chat ----------------
export const sendMessage = async (message, language = "en") => {
  const response = await axios.post(`${BASE_URL}/chat`, {
    message,
    language,
  });

  return response.data;
};
