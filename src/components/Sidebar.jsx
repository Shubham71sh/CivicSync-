import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, MapPin, ShieldAlert, MessageSquare, TrendingUp, Archive as ArchiveIcon,
  Settings, HelpCircle, Menu, X, FileText, Search, Users, User, Bookmark, History, 
  Bell, FileCheck, Target, GitCompare, BarChart2, CheckSquare, AlertTriangle,
  ShieldCheck, IndianRupee, Sparkles
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

const navGroups = [
  {
    title: "Intelligence",
    items: [
      { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
      { name: "Bill Simplifier", path: "/bills", icon: FileText },
      { name: "Compare Bills", path: "/compare", icon: GitCompare },
      { name: "Loan Analyzer", path: "/dashboard/loan-analyzer", icon: IndianRupee },
      { name: "Insurance Analyzer", path: "/dashboard/insurance-analyzer", icon: ShieldCheck },
      { name: "Corruption Detector", path: "/fraud", icon: ShieldAlert },
      { name: "Civic GPS", path: "/gps", icon: MapPin },
      { name: "Impact Simulator", path: "/impact", icon: TrendingUp },
      { name: "AI Chat", path: "/chat", icon: MessageSquare },
      { name: "Disaster Relief", path: "/disaster-relief", icon: AlertTriangle },
      { name: "Emergency Navigator", path: "/emergency", icon: AlertTriangle },
    ]
  },
  {
    title: "Gov Services",
    items: [
      { name: "Scheme Finder", path: "/scheme", icon: Search },
      { name: "Eligibility Checker", path: "/eligibility", icon: CheckSquare },
      { name: "Benefits Tracker", path: "/benefits", icon: Target },
      { name: "Scheme Alerts", path: "/dashboard/scheme-notifications", icon: Sparkles },
      { name: "Townhall Events", path: "/townhall", icon: Users },
    ]
  },
  {
    title: "My Account",
    items: [
      { name: "My Profile", path: "/profile", icon: User },
      { name: "My Analyses", path: "/analyses", icon: History },
      { name: "Saved Bills", path: "/saved", icon: Bookmark },
      { name: "Document Vault", path: "/archive", icon: ArchiveIcon },
      { name: "Notifications", path: "/notifications", icon: Bell },
    ]
  }
];

const bottomNav = [
  { name: "Reports & Analytics", path: "/reports", icon: BarChart2 },
  { name: "Settings", path: "/settings", icon: Settings },
  { name: "Help Center", path: "/support", icon: HelpCircle },
];

function NavItem({ item, isActive, onClick }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm",
        isActive 
          ? "bg-accent text-background shadow-glow-accent" 
          : "text-textSecondary hover:bg-cardHover hover:text-white"
      )}
    >
      <Icon className={clsx("w-4 h-4", isActive ? "text-background" : "text-textSecondary group-hover:text-white")} />
      <span className="truncate">{item.name}</span>
    </Link>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0d0f14] border-r border-border w-64 pt-6 pb-4">
      {/* Brand */}
      <div className="px-6 mb-6">
        <Link to="/" className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-accent">
            CivicSync <span className="text-white">AI</span>
          </span>
          <span className="text-xs text-textSecondary mt-1 uppercase tracking-widest font-semibold">
            Command Center v2.4
          </span>
        </Link>
      </div>

      {/* Main Nav */}
      <div className="flex-1 overflow-y-auto px-4 space-y-6 scrollbar-hide pb-4">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2 px-3">{group.title}</h4>
            <nav className="space-y-1">
              {group.items.map((item) => (
                <NavItem 
                  key={item.path} 
                  item={item} 
                  isActive={location.pathname === item.path || (location.pathname === '/citizen' && item.path === '/dashboard')} 
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </nav>
          </div>
        ))}

        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2 px-3">System</h4>
          <nav className="space-y-1">
            {bottomNav.map((item) => (
              <NavItem 
                key={item.path} 
                item={item} 
                isActive={location.pathname === item.path}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-4 mt-auto pt-2">
        <Link to="/profile" onClick={() => setMobileOpen(false)}>
          <div className="p-3 flex items-center gap-3 rounded-xl border border-border bg-cardHover/50 hover:border-accent/50 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-accent text-background flex items-center justify-center font-bold">
              JD
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">John Doe</h4>
              <p className="text-[10px] text-textSecondary truncate">Verified Citizen</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0d0f14] border-b border-border z-40 flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-accent">CivicSync AI</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-textSecondary hover:text-white">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 z-40">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
