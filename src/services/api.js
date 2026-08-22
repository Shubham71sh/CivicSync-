import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
  // RAG endpoints: 45s for first-request after server cold start; subsequent requests are fast.
  timeout: 45000,
});

// Optional: If you're using JWT authentication
API.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("civicsync_token") || localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ============================
// Send Message
// ============================
export const sendMessage = async (data) => {
  // AI generation gets a longer allowance than lightweight history requests.
  const response = await API.post("/chat", data, { timeout: 45000 });
  return response.data;
};

// ============================
// Create Conversation
// ============================
export const createConversation = async (title = "New Chat") => {
  const response = await API.post("/chat/conversation", {
    title,
  });

  return response.data;
};

// ============================
// Get All Conversations
// ============================
export const getConversations = async () => {
  const response = await API.get("/chat/conversations");
  return response.data.conversations;
};

// ============================
// Get Messages of One Conversation
// ============================
export const getMessages = async (conversationId) => {
  const response = await API.get(
    `/chat/history/${conversationId}`
  );

  return response.data.history;
};

// ============================
// Delete Conversation
// ============================
export const deleteConversation = async (conversationId) => {
  const response = await API.delete(
    `/chat/conversation/${conversationId}`
  );

  return response.data;
};

// ============================
// Clear One Conversation
// ============================
export const clearConversation = async (conversationId) => {
  const response = await API.delete(
    `/chat/history/${conversationId}`
  );

  return response.data;
};

// ============================
// Clear All Conversations
// ============================
export const clearAllHistory = async () => {
  const response = await API.delete("/chat/history");
  return response.data;
};

// ============================
// Disaster Relief Services
// ============================
export const checkBackend = async () => {
  const response = await API.get("/health");
  return response.data;
};

export const createReport = async (data) => {
  // No fallback — if backend is down the error must surface so the user sees it
  const response = await API.post("/reports", data);
  return response.data;
};

/**
 * Restore full workflow state for an existing report.
 * Called on Disaster Relief page mount when a reportId exists in sessionStorage.
 * Returns: { report_id, disaster_type, completed_step, analysis, evidence_validations }
 */
export const getReportStatus = async (reportId) => {
  const response = await API.get(`/reports/${reportId}/status`, { timeout: 15000 });
  return response.data;
};

export const checkEligibility = async (reportId) => {
  const response = await API.post(`/reports/${reportId}/eligibility`);
  return response.data;
};

export const saveDocuments = async (reportId) => {
  const response = await API.post(`/reports/${reportId}/documents`);
  return response.data;
};

export const getDocuments = async (reportId) => {
  const response = await API.get(`/reports/${reportId}/documents`);
  return response.data;
};

export const saveTimeline = async (reportId) => {
  const response = await API.post(`/reports/${reportId}/timeline`);
  return response.data;
};

export const getTimeline = async (reportId) => {
  const response = await API.get(`/reports/${reportId}/timeline`);
  return response.data;
};

export const saveNearbyHelp = async (reportId) => {
  const response = await API.post(`/reports/${reportId}/nearby-help`);
  return response.data;
};

export const getNearbyHelp = async (reportId) => {
  const response = await API.get(`/reports/${reportId}/nearby-help`);
  return response.data;
};

export const uploadImages = async (reportId, formData) => {
  const response = await API.post(`/reports/${reportId}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

/**
 * Step 2 — Validate a single file against the selected disaster type.
 * Sends the raw file bytes to the backend Gemini Vision endpoint.
 * Returns: { valid, relevant, confidence, file_type, detected_objects,
 *            evidence, possible_damage, reject_reason, summary }
 */
export const validateEvidence = async (reportId, file, disasterType) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("disaster_type", disasterType);
  // 60s — Gemini Vision cold-start on first request
  const response = await API.post(
    `/reports/${reportId}/validate-evidence`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 }
  );
  return response.data;
};

/**
 * Step 3 — Run AI damage assessment.
 * Checks backend cache first (returns immediately if already analysed).
 * Pass force=true to re-run Gemini even if cached result exists.
 */
export const analyzeReport = async (reportId, force = false) => {
  const response = await API.post(
    `/reports/${reportId}/analyze${force ? "?force=true" : ""}`,
    {},
    { timeout: 60000 },
  );
  return response.data;
};

export const submitReport = async (reportId, payload) => {
  const response = await API.post(`/reports/${reportId}/submit`, payload);
  return response.data;
};

// ============================
// Get Government Schemes
// ============================
// NOTE: Mock scheme fallbacks have been removed per spec.
// Step 5 is now driven entirely by the RAG system (getRAGSchemes),
// which uses verified SDRF/NDRF government data from the knowledge base.
// This function is kept for legacy API compatibility but returns [] on failure.
export const getSchemes = async (
  disasterType,
  damagePercent,
  state
) => {
  try {
    // Short timeout — this is non-critical; RAG is the authoritative source
    const response = await API.get("/reports/schemes", {
      params: {
        disaster: disasterType,
        damage: damagePercent,
        state: state,
      },
      timeout: 5000,
    });

    if (response.data && response.data.recommended && response.data.recommended.length > 0) {
      return response.data.recommended;
    }
  } catch (error) {
    // Expected to fail if legacy endpoint doesn't exist — RAG will provide data
  }

  // Return empty — Step 5 is populated by getRAGSchemes(), not mock data.
  return [];
};

// ============================
// Disaster Relief RAG Endpoints (Steps 5–8)
// Each returns null on failure — existing functionality is unaffected.
// ============================

export const getRAGSchemes = async (disasterType, damagePercent, severity) => {
  try {
    // 60s timeout: covers the ~19s MiniLM cold start on first server boot
    const response = await API.post("/disaster-rag/schemes", {
      disaster_type: disasterType || "flood",
      damage_percent: damagePercent || 50,
      severity: severity || "Moderate",
    }, { timeout: 60000 });
    return response.data?.rag || null;
  } catch (error) {
    console.warn("[DisasterRAG] RAG schemes unavailable:", error?.message);
    return null;
  }
};

export const getRAGEligibility = async (disasterType, damagePercent, severity, appliedSchemes = []) => {
  try {
    const response = await API.post("/disaster-rag/eligibility", {
      disaster_type: disasterType || "flood",
      damage_percent: damagePercent || 50,
      severity: severity || "Moderate",
      applied_schemes: appliedSchemes,
    }, { timeout: 30000 });
    return response.data?.rag || null;
  } catch (error) {
    console.warn("[DisasterRAG] RAG eligibility unavailable:", error?.message);
    return null;
  }
};

export const getRAGDocuments = async (disasterType, damagePercent, severity, appliedSchemes = []) => {
  try {
    const response = await API.post("/disaster-rag/documents", {
      disaster_type: disasterType || "flood",
      damage_percent: damagePercent || 50,
      severity: severity || "Moderate",
      applied_schemes: appliedSchemes,
    }, { timeout: 30000 });
    return response.data?.rag || null;
  } catch (error) {
    console.warn("[DisasterRAG] RAG documents unavailable:", error?.message);
    return null;
  }
};

export const getRAGTimeline = async (disasterType, damagePercent, severity) => {
  try {
    const response = await API.post("/disaster-rag/timeline", {
      disaster_type: disasterType || "flood",
      damage_percent: damagePercent || 50,
      severity: severity || "Moderate",
    }, { timeout: 30000 });
    return response.data?.rag || null;
  } catch (error) {
    console.warn("[DisasterRAG] RAG timeline unavailable:", error?.message);
    return null;
  }
};

export default API;
