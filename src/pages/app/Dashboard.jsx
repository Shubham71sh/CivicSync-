import { Search, ShieldAlert, FileText, Bell, MapPin, CheckCircle2, ChevronRight, Activity, Calendar, Award, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../../hooks/useAuth";
import { getBills } from "../../services/billService";
import { SkeletonCard } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eli15Mode, setEli15Mode] = useState(false);
  const [applyState, setApplyState] = useState("idle"); // idle, loading, applied
  const [simState, setSimState] = useState("idle"); // idle, running, done
  const [bills, setBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(true);
  
  // ─── Fetch bills on mount ────────────────────────────────────────────────────
  // Backend: GET /api/bills
  useEffect(() => {
    getBills()
      .then(({ bills }) => setBills(bills))
      .catch((err) => console.error("[Dashboard] Failed to load bills:", err))
      .finally(() => setBillsLoading(false));
  }, []);

  const handleApply = () => {
    if (applyState !== "idle") return;
    setApplyState("loading");
    setTimeout(() => setApplyState("applied"), 2000);
  };

  const handleSimulate = () => {
    if (simState !== "idle") return;
    setSimState("running");
    setTimeout(() => setSimState("done"), 2500);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome, {user?.firstName || "Citizen"}
            </h1>
            <p className="text-sm text-textSecondary mt-0.5">Your civic intelligence dashboard</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-[#1a1d24] border border-border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-widest">AI Sync Active</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input 
              type="text" 
              placeholder="Search bills, laws, or schemes..." 
              className="bg-[#12141d] border border-border rounded-lg py-2 pl-10 pr-4 text-sm w-full lg:w-72 focus:outline-none focus:border-accent text-white"
            />
          </div>
          <button 
            onClick={() => navigate("/dashboard/upload")}
            className="px-5 py-2.5 rounded-lg bg-accent text-[#0a0a0f] text-sm font-bold hover:bg-accentHover transition-colors shadow-glow-accent whitespace-nowrap active:scale-95"
          >
            New Analysis
          </button>
        </div>
      </div>

      {/* Stats Cards (5 cards) */}
      {billsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-[#171a21] border border-border relative overflow-hidden hover:border-white/10 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <FileText className="w-5 h-5 text-textSecondary" />
              <span className="text-xs font-semibold text-textSecondary">+12%</span>
            </div>
            <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">Bills Analyzed</p>
            <h3 className="text-3xl font-bold text-white mb-3">{bills.length > 0 ? `${bills.length}` : "1,284"}</h3>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-border"><div className="h-full w-2/3 bg-accent"></div></div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-[#171a21] border border-border relative overflow-hidden hover:border-white/10 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <Activity className="w-5 h-5 text-textSecondary" />
              <span className="text-xs font-semibold text-textSecondary">New</span>
            </div>
            <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">Schemes</p>
            <h3 className="text-3xl font-bold text-white mb-3">42</h3>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-border"><div className="h-full w-1/3 bg-success"></div></div>
          </motion.div>

          <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-[#171a21] border border-border relative overflow-hidden hover:border-white/10 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <Calendar className="w-5 h-5 text-textSecondary" />
              <span className="text-xs font-semibold text-textSecondary">3 Today</span>
            </div>
            <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">Upcoming Deadlines</p>
            <h3 className="text-3xl font-bold text-white mb-1">14</h3>
            <p className="text-[10px] text-textMuted truncate">Next: Tax Filing Assistance (6h)</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-border"><div className="h-full w-1/2 bg-white/20"></div></div>
          </motion.div>

          <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-[#171a21] border border-danger/30 relative overflow-hidden hover:border-danger/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <ShieldAlert className="w-5 h-5 text-danger" />
              <span className="text-xs font-semibold text-danger animate-pulse">Critical</span>
            </div>
            <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">Corruption Alerts</p>
            <h3 className="text-3xl font-bold text-danger mb-3">02</h3>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-border"><div className="h-full w-full bg-danger"></div></div>
          </motion.div>

          <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-[#171a21] border border-border relative overflow-hidden hover:border-white/10 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <Award className="w-5 h-5 text-accent" />
              <span className="text-xs font-semibold text-textSecondary">$4,250 Est.</span>
            </div>
            <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">Unclaimed Benefits</p>
            <h3 className="text-3xl font-bold text-accent mb-3">05</h3>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-border"><div className="h-full w-4/5 bg-accent"></div></div>
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 space-y-6">
          {/* Status & Eligibility */}
          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-white">Your Status & Eligibility</h2>
                <p className="text-sm text-textSecondary">Real-time matching with 852 federal and state policies.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={clsx("text-xs font-semibold uppercase tracking-widest transition-colors", eli15Mode ? "text-accent" : "text-textSecondary")}>ELI15 Mode</span>
                <div 
                  onClick={() => setEli15Mode(!eli15Mode)}
                  className={clsx("w-10 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors", eli15Mode ? "bg-accent" : "bg-white")}
                >
                  <motion.div 
                    layout
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: "#0a0a0f" }}
                    initial={false}
                    animate={{ x: eli15Mode ? 16 : 0 }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3 space-y-3">
                <div className="p-4 rounded-2xl bg-[#1e222e] border border-border hover:border-white/10 transition-all cursor-pointer">
                  <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-2">Housing Grant</h4>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-bold text-accent">94%</span>
                    <span className="text-xs font-semibold px-2 py-1 bg-accent/10 text-accent rounded-md border border-accent/20">High Match</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-[#1e222e] border border-border hover:border-white/10 transition-all cursor-pointer">
                  <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-2">Solar Rebate</h4>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-bold text-white">62%</span>
                    <span className="text-xs font-semibold px-2 py-1 bg-white/5 text-textSecondary rounded-md border border-white/10">Potential</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-2/3">
                <h3 className="font-bold text-white text-lg mb-3">AI Summary: Bill #4290</h3>
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={eli15Mode ? "eli15" : "normal"}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm text-textSecondary leading-relaxed mb-6"
                  >
                    {eli15Mode 
                      ? <span className="text-white font-semibold block">Basically, the government wants to give you money for having a business near trees. It's an easy win!</span>
                      : <span>This bill simplifies small business taxes by 12% if you operate in "Green Zones." You are currently 4km away from the nearest zone.</span>
                    }
                  </motion.p>
                </AnimatePresence>
                <div className="flex gap-3">
                  <button 
                    onClick={handleApply}
                    disabled={applyState !== "idle"}
                    className={clsx(
                      "px-5 py-2.5 rounded-lg font-semibold text-sm transition-all border w-32 flex items-center justify-center",
                      applyState === "applied" ? "bg-success/20 text-success border-success/30" : "bg-[#2a2e3d] text-white border-border hover:bg-[#323749]"
                    )}
                  >
                    {applyState === "idle" && "Apply Now"}
                    {applyState === "loading" && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
                    {applyState === "applied" && <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Applied</span>}
                  </button>
                  <button className="px-5 py-2.5 rounded-lg bg-transparent text-textSecondary font-semibold text-sm hover:text-white transition-colors border border-border">
                    Read Full Text
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Pulse Feed */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Live Pulse Feed</h2>
              <button className="text-xs font-semibold text-textSecondary hover:text-white uppercase tracking-widest transition-colors">Mark all read</button>
            </div>
            {billsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-[#171a21] border border-border flex gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-[#2a2e3d] flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#2a2e3d] rounded w-3/4" />
                      <div className="h-3 bg-[#2a2e3d] rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { icon: ShieldAlert, color: "danger", title: "Anomalous Contract Detected", desc: "Unusual bidding pattern found in Metro Project Phase 4. Estimated discrepancy: $1.2M.", time: "2 mins ago" },
                  { icon: FileText, color: "success", title: "New Environmental Bill (r-401)", desc: "CivicSync AI identifies 3 clauses that may impact your current tax bracket.", time: "1 hour ago" },
                  { icon: Award, color: "accent", title: "Community Milestone Reached", desc: "Transparency petition for public parks has reached 10,000 verified signatures.", time: "4 hours ago" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="p-4 rounded-2xl bg-[#171a21] border border-border flex gap-4 items-start group hover:border-white/10 transition-colors cursor-pointer">
                      <div className={`w-10 h-10 rounded-xl bg-${item.color}/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-5 h-5 text-${item.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-bold text-white text-sm">{item.title}</h4>
                          <span className="text-xs text-textSecondary">{item.time}</span>
                        </div>
                        <p className="text-sm text-textSecondary">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
          {/* Civic GPS Map Widget */}
          <div className="p-5 rounded-3xl bg-[#171a21] border border-border relative h-[320px] flex flex-col justify-between overflow-hidden group cursor-pointer hover:border-white/10 transition-colors">
            <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <path d="M10,50 Q30,20 50,50 T90,50" stroke="#fff" strokeWidth="0.5" fill="none" strokeDasharray="2,2"/>
                <circle cx="50" cy="50" r="40" stroke="#fff" strokeWidth="0.2" fill="none"/>
              </svg>
            </div>
            
            <div className="relative z-10">
              <h3 className="font-bold text-white text-sm">CIVIC GPS</h3>
              <p className="text-xs text-textSecondary">Region: Central<br/>District</p>
            </div>
            
            <div className="relative z-10 flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-danger animate-pulse"></div>
                <span className="text-[10px] text-textSecondary">Corruption Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span className="text-[10px] text-textSecondary">Active Projects</span>
              </div>
            </div>

            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-accent rounded-full shadow-[0_0_10px_rgba(244,211,124,0.8)] z-10"></div>
            <div className="absolute top-1/3 left-2/3 w-2 h-2 bg-danger rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10"></div>
          </div>

          {/* Impact Projection */}
          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <h3 className="text-lg font-bold text-white mb-6">Impact Projection</h3>
            
            <div className="flex items-end justify-between h-32 mb-6 gap-2">
              {[40, 60, 90, 50, 80, 20].map((h, i) => (
                <motion.div 
                  key={i} 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                  className={`w-full rounded-t-sm ${i === 2 ? 'bg-accent shadow-glow-accent' : 'bg-[#2a2e3d]'}`} 
                />
              ))}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-textSecondary">Governance Transparency</span>
                <span className="font-bold text-success">+24%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-textSecondary">Personal Tax Optimization</span>
                <span className="font-bold text-success">+$1.2k</span>
              </div>
            </div>

            <button 
              onClick={handleSimulate}
              disabled={simState !== "idle"}
              className="w-full py-3 rounded-lg bg-transparent border border-border text-white font-semibold text-sm hover:bg-[#2a2e3d] transition-colors flex justify-center items-center gap-2"
            >
              {simState === "idle" && "Run Full Simulation"}
              {simState === "running" && <><Loader2 className="w-4 h-4 animate-spin text-accent" /> Running...</>}
              {simState === "done" && <><CheckCircle2 className="w-4 h-4 text-success" /> Simulation Complete</>}
            </button>
          </div>
        </motion.div>

      </div>

      {/* Footer Area inside Dashboard */}
      <div className="flex justify-between items-center pt-8 border-t border-border/50 text-xs text-textSecondary">
        <span>© 2024 CivicSync AI. Secure Governance Systems.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white">Privacy Policy</a>
          <a href="#" className="hover:text-white">AI Ethics</a>
          <a href="#" className="hover:text-white">Transparency</a>
        </div>
      </div>
    </div>
  );
}
