import {
  firestoreGetProfile,
  firestoreUpdateProfile,
  firestoreGetNotifications,
  firestoreMarkNotificationRead,
  firestoreMarkAllNotificationsRead
} from "../firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// Profile Service (Firestore Integrated)
// Replaced Node.js backend with Cloud Firestore.
// Return structures matched exactly.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the current user's full profile.
 * @returns {{ profile }}
 */
export const getProfile = async () => {
  return await firestoreGetProfile();
};

/**
 * Update the current user's profile.
 * @param {object} updateData
 * @returns {{ profile, success: true }}
 */
export const updateProfile = async (updateData) => {
  return await firestoreUpdateProfile(updateData);
};

/**
 * Get all notifications for the current user.
 * @param {{ unreadOnly?: boolean }} params
 * @returns {{ notifications: object[], unreadCount: number }}
 */
export const getNotifications = async (params = {}) => {
  return await firestoreGetNotifications(params);
};

/**
 * Mark a single notification as read.
 * @param {string} notificationId
 * @returns {{ success: boolean }}
 */
export const markNotificationRead = async (notificationId) => {
  return await firestoreMarkNotificationRead(notificationId);
};

/**
 * Mark all notifications as read.
 * @returns {{ success: boolean, count: number }}
 */
export const markAllNotificationsRead = async () => {
  return await firestoreMarkAllNotificationsRead();
};
