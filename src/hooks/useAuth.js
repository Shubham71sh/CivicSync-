import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * Convenience hook to access the AuthContext.
 * Usage: const { user, login, logout, loading, isAuthenticated } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider. Wrap your app with <AuthProvider>.");
  }
  return context;
}
