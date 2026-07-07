import api from "../api/axiosInstance";

// ─────────────────────────────────────────────────────────────────────────────
// Auth Service
// Placeholder implementations — each function maps to a real backend endpoint.
// To connect the backend, simply replace the placeholder body with a real api call.
// The function signatures & return shapes stay the same.
// ─────────────────────────────────────────────────────────────────────────────

// DEMO credentials for hackathon / development mode
export const DEMO_USER = {
  _id: "demo_user_001",
  firstName: "John",
  lastName: "Doe",
  email: "demo@civicsync.com",
  avatar: "https://i.pravatar.cc/150?img=11",
  role: "citizen",
  verified: true,
  location: "Central District, Jharkhand",
  profession: "Tech Professional",
  incomeRange: "$50,000 - $100,000",
  dob: "1996-05-14",
  phone: "+1 (555) 019-2834",
  createdAt: new Date().toISOString(),
};

const DEMO_TOKEN = "civicsync_demo_token_xyz123";

/**
 * Register a new user.
 * @param {{ firstName, lastName, email, password }} formData
 * @returns {{ user, token }}
 *
 * Backend: POST /api/auth/register
 */
export const register = async (formData) => {
  // --- PLACEHOLDER (remove when backend is ready) ---
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const user = { ...DEMO_USER, ...formData, _id: `user_${Date.now()}` };
  return { user, token: DEMO_TOKEN };

  // --- REAL BACKEND (uncomment when backend is ready) ---
  // const { data } = await api.post("/auth/register", formData);
  // return data; // { user, token }
};

/**
 * Login an existing user.
 * @param {{ email, password }} credentials
 * @returns {{ user, token }}
 *
 * Backend: POST /api/auth/login
 */
export const login = async (credentials) => {
  // --- PLACEHOLDER ---
  await new Promise((resolve) => setTimeout(resolve, 1200));
  // Accept any email/password or the demo credentials
  const user = {
    ...DEMO_USER,
    email: credentials.email,
    firstName: credentials.email === "demo@civicsync.com" ? "John" : credentials.email.split("@")[0],
  };
  return { user, token: DEMO_TOKEN };

  // --- REAL BACKEND ---
  // const { data } = await api.post("/auth/login", credentials);
  // return data; // { user, token }
};

/**
 * Get the currently authenticated user from the token.
 * Called on app mount to rehydrate auth state.
 * @returns {{ user }}
 *
 * Backend: GET /api/auth/me
 */
export const getMe = async () => {
  // --- PLACEHOLDER ---
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { user: DEMO_USER };

  // --- REAL BACKEND ---
  // const { data } = await api.get("/auth/me");
  // return data; // { user }
};

/**
 * Logout the current user (server-side session invalidation).
 * Backend: POST /api/auth/logout
 */
export const logout = async () => {
  // --- PLACEHOLDER ---
  return true;

  // --- REAL BACKEND ---
  // await api.post("/auth/logout");
};
