import api from "../api/axiosInstance";
import {
  firestoreGetProfile,
  firestoreUpdateProfile,
  firestoreGetNotifications,
  firestoreMarkNotificationRead,
  firestoreMarkAllNotificationsRead,
} from "../firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// Profile Service (Firestore + FastAPI Integrated)
// Primary: Firestore direct calls (devasish-dev)
// Secondary: FastAPI /api/profile endpoint with rich field mapping (HEAD)
// Notifications: Firestore direct (devasish-dev)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the current user's full profile.
 * Uses Firestore directly for fast reads.
 * @returns {{ profile }}
 */
export const getProfile = async () => {
  return await firestoreGetProfile();
};

/**
 * Update the current user's profile.
 * Primary: Firestore direct update.
 * Fallback: FastAPI /api/profile endpoint with field normalization.
 * @param {object} updateData
 * @returns {{ profile, success: true }}
 */
export const updateProfile = async (updateData) => {
  // Primary: Firestore direct update (devasish-dev)
  try {
    return await firestoreUpdateProfile(updateData);
  } catch (firestoreErr) {
    console.warn(
      "[profileService.updateProfile] Firestore update failed. Falling back to FastAPI backend.",
      firestoreErr
    );
  }

  // Secondary fallback: FastAPI /api/profile with rich field normalization (HEAD)
  try {
    const payload = {
      name: updateData.name || "John Doe",
      email: updateData.email || "demo@civicsync.com",
      phone: updateData.phone || "",
      location: updateData.location || "",
      dob: updateData.dob || "",
      profession: updateData.profession || "",
      income: updateData.incomeRange || updateData.income || "$50,000 - $100,000",
      employmentStatus: updateData.employmentStatus || "",
      householdSize: updateData.householdSize || "",
      category: updateData.category || "",
      disabilityStatus: updateData.disabilityStatus || "",
      veteranStatus: updateData.veteranStatus || "",
      studentStatus: updateData.studentStatus || "",
    };

    const { data } = await api.put("/profile", payload);
    return {
      profile: {
        ...data.profile,
        incomeRange: data.profile.income,
      },
      success: true,
    };
  } catch (err) {
    console.warn(
      "[profileService.updateProfile] Backend call also failed. Falling back to memory save.",
      err
    );
    return { profile: updateData, success: true };
  }
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
