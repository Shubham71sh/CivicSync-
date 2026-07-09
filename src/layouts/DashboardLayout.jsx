import { Outlet } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";
import ChatWidget from "../components/ChatWidget";
import ErrorBoundary from "../components/ui/ErrorBoundary";

/**
 * DashboardLayout
 * Wraps all protected /dashboard/* routes with the Sidebar and ChatWidget.
 * The ProtectedRoute in App.jsx is the actual auth guard — this layout
 * is purely for structural composition.
 */
export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-background text-white">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden pt-16 lg:pt-0 relative">
        <div className="max-w-7xl mx-auto p-6 lg:p-10">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
        <ChatWidget />
      </main>
    </div>
  );
}