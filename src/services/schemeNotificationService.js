/**
 * schemeNotificationService.js
 * Frontend API service for the Profession-Based Scheme Notification System.
 */

import API from "./api";

const BASE = "/api/scheme-notifications";

/**
 * Generate (or refresh) AI-matched scheme recommendations for the user.
 * Optionally override profession / state / income via query params.
 * @param {object} params - { profession, state, income } — all optional
 */
export const getRecommendations = async (params = {}) => {
  const response = await API.get(`${BASE}/recommendations`, {
    params,
    timeout: 90_000, // AI generation may take a while
  });
  return response.data;
};

/**
 * Fetch all persisted scheme notifications for the authenticated user.
 */
export const getSchemeNotifications = async () => {
  const response = await API.get(`${BASE}/`);
  return response.data;
};

/**
 * Mark a single notification as read.
 * @param {string} notifId
 */
export const markRead = async (notifId) => {
  const response = await API.post(`${BASE}/mark-read/${notifId}`);
  return response.data;
};

/**
 * Mark all notifications for the user as read.
 */
export const markAllRead = async () => {
  const response = await API.post(`${BASE}/mark-all-read`);
  return response.data;
};

/**
 * Fetch the user's notification preferences.
 */
export const getPreferences = async () => {
  const response = await API.get(`${BASE}/preferences`);
  return response.data;
};

/**
 * Save / update the user's notification preferences.
 * @param {object} prefs
 */
export const savePreferences = async (prefs) => {
  const response = await API.post(`${BASE}/preferences`, prefs);
  return response.data;
};
