/**
 * insuranceAnalyzerService.js
 * Frontend API service for the AI Insurance Policy Analyzer feature.
 */

import API from "./api";

const BASE = "/api/insurance-analyzer";

/**
 * Upload an insurance policy document and receive an AI analysis.
 * @param {FormData} formData — must contain a "file" field
 */
export const analyzeInsurancePolicy = async (formData) => {
  const response = await API.post(`${BASE}/analyze`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120_000,
  });
  return response.data;
};

/**
 * Fetch all past insurance analyses for the authenticated user.
 */
export const getInsuranceAnalyses = async () => {
  const response = await API.get(`${BASE}/analyses`);
  return response.data;
};

/**
 * Fetch a single insurance analysis by Firestore document ID.
 * @param {string} id
 */
export const getInsuranceAnalysisById = async (id) => {
  const response = await API.get(`${BASE}/analyses/${id}`);
  return response.data;
};
