import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/ui/LoadingSpinner";

/**
 * ProtectedRoute
 * 
 * Wraps dashboard routes. Behavior:
 * - If auth is still loading (hydrating from localStorage) → show full-page spinner
 * - If user is NOT authenticated → redirect to /login, preserving the intended path in state
 * - If user IS authenticated → render child routes via <Outlet />
 *
 * Usage in App.jsx:
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 * </Route>
 */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading your civic dashboard..." />;
  }

  if (!isAuthenticated) {
    // Pass the original location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
