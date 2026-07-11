import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Building2, Mail, Lock, ArrowRight, ShieldCheck, Circle, Eye, EyeOff, AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Where to redirect after successful login
  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await login(email, password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || "Login failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#12141d] border-r border-border relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/50 to-[#0a0a0f]"></div>
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <Building2 className="w-8 h-8 text-accent" />
            <span className="text-2xl font-bold text-white tracking-tight">CivicSync</span>
          </Link>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-white mb-6 leading-tight"
          >
            Welcome Back to <br/>
            <span className="text-accent">Civic Intelligence</span>
          </motion.h1>
          <p className="text-lg text-textSecondary max-w-md">Access your personalized dashboard, track bills, and monitor local governance in real-time.</p>
        </div>

        <div className="relative z-10 flex items-center gap-4 bg-[#171a21] p-6 rounded-2xl border border-border w-max">
          <ShieldCheck className="w-8 h-8 text-success" />
          <div>
            <h4 className="text-white font-bold">Bank-Grade Security</h4>
            <p className="text-sm text-textSecondary">Your civic data is encrypted end-to-end.</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24">
        <div className="lg:hidden mb-10 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-accent" />
          <span className="text-2xl font-bold text-white tracking-tight">CivicSync</span>
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md w-full mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
            <p className="text-textSecondary">Enter your credentials to access your account.</p>
          </div>

          {/* Demo hint */}
          <div className="mb-6 p-4 rounded-xl bg-accent/5 border border-accent/20 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-accent font-semibold mb-1">Demo Mode Active</p>
              <p className="text-xs text-textSecondary">Use any email & password to sign in. <span className="text-accent font-medium">demo@civicsync.com</span> for the demo account.</p>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-3"
            >
              <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
              <p className="text-sm text-danger">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs text-textSecondary uppercase tracking-widest font-semibold block mb-2">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" />
                <input 
                  required 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@example.com" 
                  className="w-full bg-[#171a21] border border-border rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-accent transition-colors" 
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-textSecondary uppercase tracking-widest font-semibold block">Password</label>
                <a href="#" className="text-xs text-accent hover:text-white transition-colors">Forgot Password?</a>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" />
                <input 
                  required 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-[#171a21] border border-border rounded-xl py-3.5 pl-12 pr-12 text-white focus:outline-none focus:border-accent transition-colors" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-textMuted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              disabled={isSubmitting} 
              type="submit" 
              className="w-full py-4 rounded-xl bg-accent text-[#0a0a0f] font-bold shadow-glow-accent hover:bg-accentHover transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {isSubmitting ? "Authenticating..." : <><span>Sign In</span> <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <div className="mt-8 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
            <span className="relative bg-[#0a0a0f] px-4 text-xs text-textSecondary uppercase tracking-widest">Or continue with</span>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#171a21] border border-border hover:bg-cardHover transition-colors text-white font-semibold text-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#171a21] border border-border hover:bg-cardHover transition-colors text-white font-semibold text-sm">
              <Circle className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-textSecondary">
            Don't have an account? <Link to="/signup" className="text-accent hover:text-white font-bold transition-colors">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
