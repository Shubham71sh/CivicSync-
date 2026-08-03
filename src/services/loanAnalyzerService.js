/**
 * loanAnalyzerService.js
 * Frontend API service for the AI Loan Analyzer feature.
 * All requests go to http://127.0.0.1:8000/api/loan-analyzer/
 */

import API from "./api";

const BASE = "/api/loan-analyzer";

/**
 * Upload a loan document and receive an AI analysis.
 * @param {FormData} formData — must contain a "file" field
 * @returns {Promise<{success: boolean, analysis: object}>}
 */
export const analyzeLoanDocument = async (formData) => {
  const response = await API.post(`${BASE}/analyze`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120_000, // AI + PDF extraction can take up to 2 min
  });
  return response.data;
};

/**
 * Fetch all past loan analyses for the authenticated user.
 * @returns {Promise<{success: boolean, analyses: object[], total: number}>}
 */
export const getLoanAnalyses = async () => {
  const response = await API.get(`${BASE}/analyses`);
  return response.data;
};

/**
 * Fetch a single loan analysis by its Firestore document ID.
 * @param {string} id
 * @returns {Promise<{success: boolean, analysis: object}>}
 */
export const getLoanAnalysisById = async (id) => {
  const response = await API.get(`${BASE}/analyses/${id}`);
  return response.data;
};
