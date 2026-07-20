import api from "../api/axiosInstance.js";

// ─────────────────────────────────────────────────────────────────────────────
// Profile Service
// Placeholder implementations — ready to connect to Node.js + Express backend.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS = [
  {
    _id: "notif_001",
    type: "alert",
    iconType: "ShieldAlert",
    title: "Corruption Risk Detected in Area",
    desc: "Unusual bidding pattern found in Metro Project Phase 4. Estimated discrepancy: $1.2M.",
    time: "2 mins ago",
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "notif_002",
    type: "info",
    iconType: "FileText",
    title: "New Environmental Bill (r-401)",
    desc: "CivicSync AI identifies 3 clauses that may impact your current tax bracket.",
    time: "1 hour ago",
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: "notif_003",
    type: "success",
    iconType: "Award",
    title: "Community Milestone Reached",
    desc: "Transparency petition for public parks has reached 10,000 verified signatures.",
    time: "4 hours ago",
    read: true,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    _id: "notif_004",
    type: "warning",
    iconType: "Calendar",
    title: "Upcoming Deadline",
    desc: "Tax Filing Assistance for your business profile expires in 6 hours.",
    time: "Yesterday",
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

/**
 * Get the current user's full profile.
 * @returns {{ profile }}
 *
 * Backend: GET /api/profile
 */
export const getProfile = async () => {
  try {
    const { data } = await api.get("/profile");
    return {
      profile: {
        ...data,
        incomeRange: data.income || data.incomeRange || "$50,000 - $100,000",
        connectedIds: [
          { name: "National ID / SSN", verified: true, verifiedAt: "Oct 2023" },
          { name: "Tax Payer Portal", verified: false },
        ]
      }
    };
  } catch (err) {
    console.warn("[profileService.getProfile] Backend call failed. Falling back to mock profile.", err);
    return {
      profile: {
        name: "John Doe",
        email: "demo@civicsync.com",
        location: "Central District, Jharkhand",
        profession: "Tech Professional",
        incomeRange: "$50,000 - $100,000",
        dob: "1996-05-14",
        phone: "+1 (555) 019-2834",
        connectedIds: [
          { name: "National ID / SSN", verified: true, verifiedAt: "Oct 2023" },
          { name: "Tax Payer Portal", verified: false },
        ],
      },
    };
  }
};

/**
 * Update the current user's profile.
 * @param {object} updateData
 * @returns {{ profile }}
 *
 * Backend: PUT /api/profile
 */
export const updateProfile = async (updateData) => {
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
    console.warn("[profileService.updateProfile] Backend call failed. Falling back to memory save.", err);
    return { profile: updateData, success: true };
  }
};

/**
 * Get all notifications for the current user.
 * @param {{ page, limit, unreadOnly }} params
 * @returns {{ notifications, unreadCount }}
 *
 * Backend: GET /api/notifications
 */
export const getNotifications = async (params = {}) => {
  // --- PLACEHOLDER ---
  await new Promise((resolve) => setTimeout(resolve, 600));
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
  return { notifications: MOCK_NOTIFICATIONS, unreadCount };

  // --- REAL BACKEND ---
  // const { data } = await api.get("/notifications", { params });
  // return data; // { notifications, unreadCount }
};

/**
 * Mark a single notification as read.
 * @param {string} notificationId
 * Backend: PATCH /api/notifications/:id/read
 */
export const markNotificationRead = async (notificationId) => {
  // --- PLACEHOLDER ---
  await new Promise((resolve) => setTimeout(resolve, 200));
  return { success: true };

  // --- REAL BACKEND ---
  // const { data } = await api.patch(`/notifications/${notificationId}/read`);
  // return data;
};

/**
 * Mark all notifications as read.
 * Backend: POST /api/notifications/read-all
 */
export const markAllNotificationsRead = async () => {
  // --- PLACEHOLDER ---
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { success: true };

  // --- REAL BACKEND ---
  // const { data } = await api.post("/notifications/read-all");
  // return data;
};
