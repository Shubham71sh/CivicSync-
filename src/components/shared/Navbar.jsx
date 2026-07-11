import { Link, useNavigate } from "react-router-dom";
import { Building2, Bell, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import clsx from "clsx";

/**
 * Navbar — Public landing page navbar.
 * Adapts based on auth state:
 * - Guest: Sign In + Get Started
 * - Authenticated: Go to Dashboard + user avatar
 */
export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-accent" />
          <span className="text-xl font-bold tracking-tight">CivicSync</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#platform" className="text-sm text-textSecondary hover:text-white transition-colors">Platform</a>
          <Link to="/features" className="text-sm text-textSecondary hover:text-white transition-colors">Features</Link>
          <Link to="/about" className="text-sm text-textSecondary hover:text-white transition-colors">About</Link>
          <Link to="/contact" className="text-sm text-textSecondary hover:text-white transition-colors">Contact</Link>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="hidden md:flex items-center gap-2 text-sm font-semibold text-textSecondary hover:text-white transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <div className="w-9 h-9 rounded-full bg-accent text-background flex items-center justify-center font-bold text-sm cursor-pointer shadow-glow-accent">
                {user?.avatar 
                  ? <img src={user.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                  : `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase()
                }
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden md:block text-sm font-semibold text-textSecondary hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/signup" className="px-6 py-2.5 rounded-lg bg-accent text-[#0a0a0f] text-sm font-semibold hover:bg-accentHover transition-colors shadow-glow-accent">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
