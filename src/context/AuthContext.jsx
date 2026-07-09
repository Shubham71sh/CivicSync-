import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { login as loginService, register as registerService, logout as logoutService, getMe } from "../services/authService";

// ─────────────────────────────────────────────────────────────────────────────
// Auth Context
// Provides: user, token, loading, login(), signup(), logout()
// ─────────────────────────────────────────────────────────────────────────────

export const AuthContext = createContext(null);

const TOKEN_KEY = "civicsync_token";
const USER_KEY = "civicsync_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true); // true during initial hydration
  const [error, setError] = useState(null);

  // ── Hydrate from localStorage on mount ───────────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setLoading(false);
      return;
    }

    // Token exists — verify it with the server and rehydrate user
    getMe()
      .then(({ user }) => {
        setUser(user);
        setToken(storedToken);
      })
      .catch(() => {
        // Token is invalid/expired — clear it
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const { user, token } = await loginService({ email, password });
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setUser(user);
      setToken(token);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Invalid credentials. Please try again.";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // ── Signup ────────────────────────────────────────────────────────────────
  const signup = useCallback(async (formData) => {
    setError(null);
    try {
      const { user, token } = await registerService(formData);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setUser(user);
      setToken(token);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed. Please try again.";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutService();
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setToken(null);
      // Redirect handled by the caller or ProtectedRoute
    }
  }, []);

  // ── Update user locally (after profile update) ────────────────────────────
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
