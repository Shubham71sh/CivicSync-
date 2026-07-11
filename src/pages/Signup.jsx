import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Mail, Lock, ArrowRight, User, MapPin } from "lucide-react";
import { useState } from "react";

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSignup = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-row-reverse">
      {/* Right Side - Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#12141d] border-l border-border relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f]"></div>
        
        <div className="relative z-10 flex justify-end">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-2xl font-bold text-white tracking-tight">CivicSync</span>
            <Building2 className="w-8 h-8 text-accent" />
          </Link>
        </div>

        <div className="relative z-10 text-right">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-white mb-6 leading-tight"
          >
            Claim Your <br/>
            <span className="text-accent">Civic Identity</span>
          </motion.h1>
          <p className="text-lg text-textSecondary max-w-md ml-auto">Join the new era of democratic transparency. AI-powered tools to verify, simplify, and track governance.</p>
        </div>
      </div>

      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12 overflow-y-auto">
        <div className="lg:hidden mb-10 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-accent" />
          <span className="text-2xl font-bold text-white tracking-tight">CivicSync</span>
        </div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-textSecondary">Setup your profile to personalize legislative impact.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-widest font-semibold block mb-2">First Name</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" />
                  <input required type="text" placeholder="John" className="w-full bg-[#171a21] border border-border rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-accent transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-widest font-semibold block mb-2">Last Name</label>
                <input required type="text" placeholder="Doe" className="w-full bg-[#171a21] border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-xs text-textSecondary uppercase tracking-widest font-semibold block mb-2">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" />
                <input required type="email" placeholder="john.doe@example.com" className="w-full bg-[#171a21] border border-border rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-accent transition-colors" />
              </div>
            </div>
            
            <div>
              <label className="text-xs text-textSecondary uppercase tracking-widest font-semibold block mb-2">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" />
                <input required type="password" placeholder="••••••••" className="w-full bg-[#171a21] border border-border rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-accent transition-colors" />
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full py-4 rounded-xl bg-accent text-[#0a0a0f] font-bold shadow-glow-accent hover:bg-accentHover transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-70">
              {loading ? "Creating Identity..." : <>Get Started <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-textSecondary">
            Already have an account? <Link to="/login" className="text-accent hover:text-white font-bold transition-colors">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
