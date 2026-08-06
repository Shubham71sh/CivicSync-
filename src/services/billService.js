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

/**
 * Translate a bill's summary into a target language.
 * @param {string} billId - The bill document ID
 * @param {string} targetLanguage - Language code (e.g., 'hi', 'bn', 'ta', 'te', 'pa') or name (e.g., 'Hindi')
 * @returns {{ language, translated_summary, cached }}
 *
 * Backend: POST /api/translation/translate
 */
export const translateBill = async (billId, targetLanguage) => {
  try {
    const { data } = await api.post("/translation/translate", {
      bill_id: billId,
      target_language: targetLanguage,
    });
    return data; // { language, translated_summary, cached }
  } catch (error) {
    console.error("[billService.translateBill] Error:", error);
    throw new Error(
      error.response?.data?.detail ||
      "Translation failed. Please try again."
    );
  }
};

/**
 * Get the total count of bills analyzed by the logged-in user.
 * @returns {{ total: number }}
 *
 * Backend: GET /api/bills?limit=1
 */
export const getBillsCount = async () => {
  try {
    const { data } = await api.get("/bills", { params: { limit: 1, page: 1 } });
    return { total: data.total || 0 };
  } catch (error) {
    console.error("[billService.getBillsCount] Error:", error);
    return { total: 0 };
  }
};

/**
 * Get the most recently analyzed bill for the AI Summary card.
 * @returns {{ bill: object | null }}
 *
 * Backend: GET /api/bills?limit=1&sort=newest
 */
export const getLatestBill = async () => {
  try {
    const { data } = await api.get("/bills", { params: { limit: 1, page: 1 } });
    const bills = data.bills || data.data || [];
    return { bill: bills.length > 0 ? bills[0] : null };
  } catch (error) {
    console.error("[billService.getLatestBill] Error:", error);
    return { bill: null };
  }
};

/**
 * Search bills by keyword for the dashboard search bar.
 * @param {string} keyword
 * @returns {{ bills: object[] }}
 *
 * Backend: GET /api/bills?search=keyword
 */
export const searchBills = async (keyword) => {
  try {
    const { data } = await api.get("/bills", {
      params: { search: keyword, limit: 10, page: 1 },
    });
    return { bills: data.bills || data.data || [] };
  } catch (error) {
    console.error("[billService.searchBills] Error:", error);
    return { bills: [] };
  }
};

/**
 * Get list of supported translation languages.
 * @returns {string[]} - Array of language names
 *
 * Backend: GET /api/translation/languages
 */
export const getSupportedLanguages = async () => {
  try {
    const { data } = await api.get("/translation/languages");
    return data; // ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Punjabi']
  } catch (error) {
    console.error("[billService.getSupportedLanguages] Error:", error);
    return ["English", "Hindi", "Bengali", "Tamil", "Telugu", "Punjabi"];
  }
};

