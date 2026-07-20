import {
  firestoreGetSchemes,
  firestoreGetSchemeById,
  firestoreCheckEligibility,
  firestoreGetApplications,
  firestoreApplyForScheme,
  firestoreGetApplicationById,
  firestoreUpdateApplicationStatus
} from "../firebase/firestore";

// ─── Scheme Finder API Calls ──────────────────────────────────────────────────

/**
 * Get all schemes or filter/search schemes.
 * Query params can be: keyword, category, state, age, maxIncome, page, limit
 */
export const getSchemes = async (params = {}) => {
  return await firestoreGetSchemes(params);
};

/**
 * Get details of a single scheme by ID.
 */
export const getSchemeById = async (schemeId) => {
  return await firestoreGetSchemeById(schemeId);
};

// ─── Eligibility Checker API Calls ────────────────────────────────────────────

/**
 * Checks eligibility using either a saved profile or custom dynamic values.
 * Body can contain: schemeId, age, income, gender, state, occupation, education, category, disability
 */
export const checkEligibility = async (payload) => {
  return await firestoreCheckEligibility(payload);
};

// ─── Benefits Tracker API Calls ───────────────────────────────────────────────

/**
 * Fetch all applications (benefits tracker) for the logged-in user.
 */
export const getApplications = async () => {
  return await firestoreGetApplications();
};

/**
 * Submit a new application for a scheme.
 */
export const applyForScheme = async (schemeId) => {
  return await firestoreApplyForScheme(schemeId);
};

/**
 * Get detailed logs/remarks of a specific application.
 */
export const getApplicationById = async (applicationId) => {
  return await firestoreGetApplicationById(applicationId);
};

/**
 * Update the status of an application (mainly for demonstration/testing).
 */
export const updateApplicationStatus = async (applicationId, status, remarks = "") => {
  return await firestoreUpdateApplicationStatus(applicationId, status, remarks);
};
