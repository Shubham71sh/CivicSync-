import api from "../api/axiosInstance";

// ─────────────────────────────────────────────────────────────────────────────
// Bill Service - Real Backend Integration
// Connected to FastAPI + MongoDB + Gemini AI backend
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload a bill document for AI analysis.
 * @param {FormData} formData - Must include `file` field
 * @returns {{ bill, analysisId }}
 *
 * Backend: POST /api/bills/upload (multipart/form-data)
 */
export const uploadBill = async (formData) => {
  try {
    const { data } = await api.post("/bills/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data; // { bill, analysisId }
  } catch (error) {
    console.error("[billService.uploadBill] Error:", error);
    throw new Error(
      error.response?.data?.detail || 
      "Failed to upload bill. Please try again."
    );
  }
};

/**
 * Get the user's bill list.
 * @param {{ page, limit, status, search }} params
 * @returns {{ bills, total, page, pages }}
 *
 * Backend: GET /api/bills
 */
export const getBills = async (params = {}) => {
  try {
    const { data } = await api.get("/bills", { params });
    return data; // { bills, total, page, pages }
  } catch (error) {
    console.error("[billService.getBills] Error:", error);
    throw new Error(
      error.response?.data?.detail || 
      "Failed to fetch bills. Please try again."
    );
  }
};

/**
 * Get a single bill with full details.
 * @param {string} billId
 * @returns {{ bill }}
 *
 * Backend: GET /api/bills/:id
 */
export const getBillById = async (billId) => {
  try {
    const { data } = await api.get(`/bills/${billId}`);
    return data; // { bill }
  } catch (error) {
    console.error("[billService.getBillById] Error:", error);
    throw new Error(
      error.response?.data?.detail || 
      "Failed to fetch bill details. Please try again."
    );
  }
};

/**
 * Compare two or more bills side by side.
 * @param {string[]} billIds
 * @returns {{ comparison }}
 *
 * Backend: POST /api/bills/compare
 */
export const compareBills = async (billIds) => {
  try {
    const { data } = await api.post("/bills/compare", { billIds });
    return data; // { comparison }
  } catch (error) {
    console.error("[billService.compareBills] Error:", error);
    throw new Error(
      error.response?.data?.detail || 
      "Failed to compare bills. Please try again."
    );
  }
};

/**
 * Delete a bill from the user's history.
 * @param {string} billId
 * Backend: DELETE /api/bills/:id
 */
export const deleteBill = async (billId) => {
  try {
    const { data } = await api.delete(`/bills/${billId}`);
    return data;
  } catch (error) {
    console.error("[billService.deleteBill] Error:", error);
    throw new Error(
      error.response?.data?.detail || 
      "Failed to delete bill. Please try again."
    );
  }
};
