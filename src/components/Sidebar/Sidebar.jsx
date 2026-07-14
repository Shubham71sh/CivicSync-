import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, FileText, GitCompare, Search, 
  AlertTriangle, MessageSquare, Settings, Menu, X, Landmark
} from "lucide-react";
import { motion } from "framer-motion";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Bill Simplifier", path: "/bills", icon: FileText },
  { name: "Compare Bills", path: "/compare", icon: GitCompare },
  { name: "Government Schemes", path: "/eligibility", icon: Search },
  { name: "Disaster Relief", path: "/disaster-relief", icon: AlertTriangle, active: true },
  { name: "AI Chat", path: "/chat", icon: MessageSquare },
  { name: "Settings", path: "/settings", icon: Settings }
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-100 bg-white h-screen sticky top-0 shrink-0">
        {/* Brand/Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-50 gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Landmark className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">CivicSync</span>
            <span className="text-[10px] text-blue-600 font-semibold block uppercase tracking-wider -mt-1">Gov AI Hub</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Since we are on Disaster Relief, we check if it is active
            const isCurrent = item.active || location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isCurrent 
                    ? "bg-blue-50 text-blue-600" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon className={`w-4 h-4 ${isCurrent ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span>{item.name}</span>
                {item.active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-50">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
              JD
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-slate-800 truncate">John Doe</h4>
              <p className="text-[10px] text-slate-400 truncate">Patna Resident • Verified</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: mobileOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
        className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 z-55 flex flex-col lg:hidden"
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Landmark className="w-4.5 h-4.5" />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">CivicSync</span>
          </div>
          <button 
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = item.active || location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isCurrent 
                    ? "bg-blue-50 text-blue-600" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon className={`w-4 h-4 ${isCurrent ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.name}</span>
                {item.active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
              JD
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-800">John Doe</h4>
              <p className="text-[10px] text-slate-400">Patna Resident • Verified</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
