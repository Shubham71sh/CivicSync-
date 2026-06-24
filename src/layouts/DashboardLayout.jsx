import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ChatWidget from "../components/ChatWidget";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-background text-white">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden pt-16 lg:pt-0 relative">
        <div className="max-w-7xl mx-auto p-6 lg:p-10">
          <Outlet />
        </div>
        
        <ChatWidget />
      </main>
    </div>
  );
}