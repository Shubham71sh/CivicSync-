import { motion, AnimatePresence } from "framer-motion";
import { Search, ZoomIn, Filter, MapPin, CheckCircle2, AlertCircle, Calendar, Briefcase, ChevronRight, Upload, Lock, Loader2 } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

export default function CivicGPS() {
  const [showFilters, setShowFilters] = useState(false);
  const [uploadState, setUploadState] = useState("idle");
  const [applyState, setApplyState] = useState("idle");

  const handleUpload = () => {
    if (uploadState !== "idle") return;
    setUploadState("uploading");
    setTimeout(() => setUploadState("done"), 2000);
  };

  const handleApply = () => {
    if (applyState !== "idle") return;
    setApplyState("applying");
    setTimeout(() => setApplyState("done"), 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Civic GPS: Your Policy Roadmap</h1>
          <p className="text-sm text-textSecondary">Navigating statutory evolution through AI-driven foresight</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 rounded-full bg-[#1a1d24] border border-border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-widest">AI Live Scan</span>
          </div>
          <div className="w-10 h-10 rounded-full border border-border overflow-hidden bg-card cursor-pointer hover:border-accent transition-colors">
            <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timeline Area (Takes 2 columns) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#12141d] border border-border relative min-h-[600px] overflow-hidden">
          
          {/* Top Bar inside Map */}
          <div className="flex justify-between items-center mb-10 relative z-10">
            <div className="px-4 py-1.5 rounded-full bg-[#1a1d24] border border-border">
              <span className="text-xs font-semibold text-textSecondary uppercase tracking-widest">Active Trajectory</span>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-xl bg-[#1a1d24] border border-border flex items-center justify-center hover:bg-cardHover text-textSecondary transition-colors">
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="relative">
                <button onClick={() => setShowFilters(!showFilters)} className={clsx("w-10 h-10 rounded-xl border flex items-center justify-center transition-colors", showFilters ? "bg-accent text-[#0a0a0f] border-accent" : "bg-[#1a1d24] border-border text-textSecondary hover:bg-cardHover")}>
                  <Filter className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showFilters && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-12 w-48 bg-card border border-border rounded-xl shadow-2xl p-4 z-50">
                      <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Quick Filters</h4>
                      <label className="flex items-center gap-2 text-sm text-textSecondary hover:text-white cursor-pointer py-1"><input type="checkbox" defaultChecked className="accent-accent" /> Federal</label>
                      <label className="flex items-center gap-2 text-sm text-textSecondary hover:text-white cursor-pointer py-1"><input type="checkbox" defaultChecked className="accent-accent" /> State</label>
                      <label className="flex items-center gap-2 text-sm text-textSecondary hover:text-white cursor-pointer py-1"><input type="checkbox" className="accent-accent" /> Local</label>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Vertical Line */}
          <motion.div initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ duration: 1.5 }} className="absolute left-1/2 top-24 bottom-0 w-1 -translate-x-1/2 flex flex-col z-0 origin-top">
             <div className="w-full h-1/2 bg-gradient-to-b from-secondary/20 to-secondary rounded-t-full"></div>
             <div className="w-full h-1/2 bg-gradient-to-b from-[#2a1d2e] to-danger/30 rounded-b-full"></div>
          </motion.div>

          {/* Timeline Items */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full max-w-lg mx-auto pb-10 space-y-16">
            
            {/* Completed Item */}
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="relative w-full flex justify-start -ml-16">
              <div className="w-64 p-5 rounded-2xl bg-[#171a21] border border-success/30 relative hover:border-success/60 transition-colors cursor-pointer group">
                <div className="flex gap-3 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">Digital India Subsidies</h4>
                    <p className="text-xs text-textSecondary leading-relaxed">Active tech grant for professionals in Jharkhand. Disbursing Monthly.</p>
                  </div>
                </div>
                <div className="flex justify-between items-end mt-4 pt-4 border-t border-border">
                  <span className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold">Claimed</span>
                  <span className="text-white font-bold">₹12,500/mo</span>
                </div>
              </div>
              <div className="absolute top-1/2 right-[-54px] w-3 h-3 rounded-full bg-[#c0e0b8] border-2 border-[#12141d] -translate-y-1/2 z-10"></div>
            </motion.div>

            {/* You Are Here */}
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring", bounce: 0.5 }} className="relative z-20 flex flex-col items-center">
               <div className="w-12 h-12 rounded-full bg-accent text-[#0a0a0f] flex items-center justify-center mb-2 shadow-glow-accent animate-bounce">
                 <MapPin className="w-6 h-6" />
               </div>
               <div className="px-3 py-1 rounded-md bg-accent text-[#0a0a0f] text-[10px] font-bold uppercase tracking-widest">
                 You Are Here
               </div>
            </motion.div>

            {/* Warning Item */}
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 }} className="relative w-full flex justify-end -mr-16">
              <div className="absolute top-1/2 left-[-54px] w-3 h-3 rounded-full bg-[#f4a7a7] border-2 border-[#12141d] -translate-y-1/2 z-10"></div>
              <div className={clsx("w-64 p-5 rounded-2xl relative transition-all duration-300", uploadState === "done" ? "bg-[#171a21] border-success/40" : "bg-[#1a141a] border-danger/40")}>
                <div className="flex gap-3 mb-4">
                  <div className="w-5 h-5 bg-[#2a1d2e] rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">!</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">{uploadState === "done" ? "Compliance Met" : "Compliance GAP"}</h4>
                    <p className="text-xs text-textSecondary leading-relaxed">
                      {uploadState === "done" ? "Document verified successfully. Roadmap updated." : "Updated Income Certificate required for 2025 roadmap eligibility."}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleUpload}
                  disabled={uploadState !== "idle"}
                  className={clsx(
                    "w-full py-2.5 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2",
                    uploadState === "idle" ? "bg-[#2a1d2e] border border-danger/30 text-white hover:bg-[#3d273f]" :
                    uploadState === "uploading" ? "bg-[#171a21] border border-border text-textSecondary" :
                    "bg-success/20 border border-success/30 text-success"
                  )}
                >
                  {uploadState === "idle" && "UPLOAD DOCUMENT"}
                  {uploadState === "uploading" && <><Loader2 className="w-4 h-4 animate-spin" /> UPLOADING...</>}
                  {uploadState === "done" && <><CheckCircle2 className="w-4 h-4" /> VERIFIED</>}
                </button>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="space-y-6">
          
          {/* Global Eligibility Score */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-3xl bg-[#171a21] border border-border text-center group hover:border-white/10 transition-colors">
            <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-6">Global Eligibility Score</h3>
            
            <div className="relative w-40 h-40 mx-auto mb-6">
               <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#24283b" strokeWidth="8" />
                  <motion.circle 
                    initial={{ strokeDashoffset: 439.8 }}
                    animate={{ strokeDashoffset: 65.97 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx="80" cy="80" r="70" fill="none" stroke="#f4d37c" strokeWidth="8" strokeDasharray="439.8" strokeLinecap="round" 
                  />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-4xl font-bold text-white mb-1">85<span className="text-xl">%</span></span>
                  <span className="text-[10px] text-accent uppercase tracking-widest font-semibold">Optimized</span>
               </div>
            </div>
            
            <p className="text-sm text-textSecondary px-2">Your score increased by <span className="text-white font-semibold">+12%</span> after recent tax audit analysis.</p>
          </motion.div>

          {/* Profile Active Filters */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-widest">Profile Active Filters</h3>
              <button className="text-xs font-semibold text-accent hover:text-white transition-colors">Edit</button>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#12141d] border border-border flex justify-between items-center group cursor-pointer hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-textSecondary group-hover:text-white transition-colors" />
                  <span className="text-sm font-medium text-white">Age: 28</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-textSecondary" />
              </div>
              <div className="p-3 rounded-xl bg-[#12141d] border border-border flex justify-between items-center group cursor-pointer hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-textSecondary group-hover:text-white transition-colors" />
                  <span className="text-sm font-medium text-white">Jharkhand</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-textSecondary" />
              </div>
              <div className="p-3 rounded-xl bg-[#12141d] border border-border flex justify-between items-center group cursor-pointer hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-textSecondary group-hover:text-white transition-colors" />
                  <span className="text-sm font-medium text-white">Tech Professional</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-textSecondary" />
              </div>
            </div>
          </motion.div>

          {/* Recommended Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="p-6 rounded-3xl bg-[#171a21] border border-accent/20">
            <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-6">Recommended Actions</h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#12141d] border border-border relative overflow-hidden group hover:border-accent/50 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-white text-sm">Startup Jharkhand Grant</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#252822] text-[#83a273] font-bold tracking-widest uppercase border border-[#303828]">Ready</span>
                </div>
                <p className="text-xs text-textSecondary mb-4">Estimated value: ₹5,00,000</p>
                <button 
                  onClick={handleApply}
                  disabled={applyState !== "idle"}
                  className={clsx(
                    "w-full py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2",
                    applyState === "idle" ? "bg-accent text-[#0a0a0f] hover:bg-accentHover" :
                    applyState === "applying" ? "bg-[#171a21] text-textSecondary border border-border" :
                    "bg-success text-[#0a0a0f]"
                  )}
                >
                  {applyState === "idle" && <><CheckCircle2 className="w-4 h-4" /> One-Click Apply</>}
                  {applyState === "applying" && <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>}
                  {applyState === "done" && <><CheckCircle2 className="w-4 h-4" /> Applied successfully!</>}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#12141d] border border-border relative opacity-60 hover:opacity-100 transition-opacity cursor-not-allowed">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-white text-sm">E-Rickshaw Subsidy</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1a1d24] text-textSecondary font-bold tracking-widest uppercase border border-border">Locked</span>
                </div>
                <p className="text-xs text-textSecondary mb-4">Sustainable travel incentive</p>
                <div className="flex justify-center mt-2">
                  <Lock className="w-5 h-5 text-textMuted" />
                </div>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
}