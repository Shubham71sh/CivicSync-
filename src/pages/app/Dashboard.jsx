import {
  Search, ShieldAlert, FileText, Bell, MapPin,
  CheckCircle2, Activity, Calendar,
  Award, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../../hooks/useAuth";
import { useDashboardData } from "../../hooks/useDashboardData";
import { searchBills } from "../../services/billService";

// ─── Icon map for activity feed types ────────────────────────────────────────
const FEED_ICON_MAP = {
  corruption:     { Icon: ShieldAlert,  bg: "bg-danger/10",   color: "text-danger"  },
  fraud_alert:    { Icon: ShieldAlert,  bg: "bg-danger/10",   color: "text-danger"  },
  fraud:          { Icon: ShieldAlert,  bg: "bg-danger/10",   color: "text-danger"  },
  alert:          { Icon: ShieldAlert,  bg: "bg-danger/10",   color: "text-danger"  },
  bill_analyzed:  { Icon: FileText,     bg: "bg-success/10",  color: "text-success" },
  bill:           { Icon: FileText,     bg: "bg-success/10",  color: "text-success" },
  scheme_matched: { Icon: Award,        bg: "bg-accent/10",   color: "text-accent"  },
  scheme:         { Icon: Award,        bg: "bg-accent/10",   color: "text-accent"  },
  benefit:        { Icon: Award,        bg: "bg-accent/10",   color: "text-accent"  },
  roadmap:        { Icon: MapPin,       bg: "bg-accent/10",   color: "text-accent"  },
  profile:        { Icon: CheckCircle2, bg: "bg-success/10",  color: "text-success" },
  application:    { Icon: CheckCircle2, bg: "bg-success/10",  color: "text-success" },
  notification:   { Icon: Bell,         bg: "bg-white/5",     color: "text-textSecondary" },
  info:           { Icon: Bell,         bg: "bg-white/5",     color: "text-textSecondary" },
};

const getFeedIcon = (type) =>
  FEED_ICON_MAP[(type || "").toLowerCase()] || FEED_ICON_MAP.info;

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={clsx("animate-pulse rounded bg-white/5", className)} />
);

// ─── Number formatter ─────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString();
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [eli15Mode,  setEli15Mode]  = useState(false);
  const [applyState, setApplyState] = useState("idle"); // idle | loading | applied
  const [simState,   setSimState]   = useState("idle"); // idle | running | done

  const [searchQuery,     setSearchQuery]     = useState("");
  const [searchResults,   setSearchResults]   = useState([]);
  const [searchLoading,   setSearchLoading]   = useState(false);
  const [showSearchDrop,  setShowSearchDrop]  = useState(false);
  const searchRef = useRef(null);

  // ── Live data hook ─────────────────────────────────────────────────────────
  const {
    billsCount,
    schemesCount,
    deadlines,
    corruptionAlerts,
    unclaimedBenefits,
    eligibility,
    latestBill,
    gps,
    activityFeed,
    unreadCount,
    analytics,
    loading,
    error,
    refresh,
    handleMarkAllRead,
  } = useDashboardData();

  // ── Handlers ──────────────────────────────────────────────────────────────
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

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearchChange = useCallback(async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setShowSearchDrop(false);
      return;
    }
    setSearchLoading(true);
    setShowSearchDrop(true);
    try {
      const { bills } = await searchBills(q);
      setSearchResults(bills.slice(0, 6));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Animation variants ────────────────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0 },
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const billsProgress  = billsCount  ? Math.min(100, Math.round((billsCount  / 1500) * 100)) : 0;
  const schemesProgress = schemesCount ? Math.min(100, Math.round((schemesCount / 60)   * 100)) : 0;

  const topScheme1 = eligibility?.topSchemes?.[0] ?? null;
  const topScheme2 = eligibility?.topSchemes?.[1] ?? null;

  // Impact chart: real monthly analytics bars
  const impactBars = analytics?.monthlyApplications
    ? analytics.monthlyApplications.map((m) => {
        const maxVal = Math.max(
          ...analytics.monthlyApplications.map((x) => x.applications || 0),
          1
        );
        return Math.round(((m.applications || 0) / maxVal) * 90) || 4;
      })
    : [0, 0, 0, 0, 0, 0];

  const peakBarIdx  = impactBars.indexOf(Math.max(...impactBars));
  const gpsProgress = gps?.progressPct ?? 0;

  // ─────────────────────────────────────────────────────────────────────────
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
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-widest">
              AI Sync Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Live Search Bar */}
          <div className="relative" ref={searchRef}>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery && setShowSearchDrop(true)}
              placeholder="Search bills, laws, or schemes..."
              className="bg-[#12141d] border border-border rounded-lg py-2 pl-10 pr-4 text-sm w-full lg:w-72 focus:outline-none focus:border-accent text-white"
            />
            <AnimatePresence>
              {showSearchDrop && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-[#1a1d24] border border-border rounded-lg overflow-hidden z-50 shadow-xl"
                >
                  {searchLoading && (
                    <div className="p-3 text-xs text-textMuted flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                    </div>
                  )}
                  {!searchLoading && searchResults.length === 0 && searchQuery && (
                    <div className="p-3 text-xs text-textMuted">No results found</div>
                  )}
                  {!searchLoading && searchResults.map((bill) => (
                    <button
                      key={bill._id || bill.id}
                      onClick={() => {
                        navigate(`/dashboard/bills/${bill._id || bill.id}`);
                        setShowSearchDrop(false);
                        setSearchQuery("");
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-3 h-3 text-textMuted flex-shrink-0" />
                      <span className="truncate">{bill.title || bill.billNumber || "Bill"}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* New Analysis → /dashboard/upload */}
          <button
            onClick={() => navigate("/dashboard/upload")}
            className="px-5 py-2.5 rounded-lg bg-accent text-[#0a0a0f] text-sm font-bold hover:bg-accentHover transition-colors shadow-glow-accent whitespace-nowrap active:scale-95"
          >
            New Analysis
          </button>
        </div>
      </div>

      {/* Global error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={refresh}
              className="ml-auto flex items-center gap-1 text-xs text-danger/70 hover:text-danger transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats Cards (5 cards) ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {/* Card 1: Bills Analyzed */}
        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl bg-[#171a21] border border-border relative overflow-hidden hover:border-white/10 transition-colors"
        >
          <div className="flex justify-between items-start mb-4">
            <FileText className="w-5 h-5 text-textSecondary" />
            <span className="text-xs font-semibold text-textSecondary">
              {loading ? "—" : billsCount > 0 ? "Updated" : "None yet"}
            </span>
          </div>
          <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">
            Bills Analyzed
          </p>
          {loading ? (
            <Skeleton className="h-9 w-16 mb-3" />
          ) : (
            <h3 className="text-3xl font-bold text-white mb-3">{fmt(billsCount)}</h3>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
            <div
              className="h-full bg-accent transition-all duration-700"
              style={{ width: loading ? "0%" : `${billsProgress}%` }}
            />
          </div>
        </motion.div>

        {/* Card 2: Government Schemes */}
        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl bg-[#171a21] border border-border relative overflow-hidden hover:border-white/10 transition-colors"
        >
          <div className="flex justify-between items-start mb-4">
            <Activity className="w-5 h-5 text-textSecondary" />
            <span className="text-xs font-semibold text-textSecondary">
              {loading ? "—" : schemesCount > 0 ? "Live" : "—"}
            </span>
          </div>
          <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">
            Schemes
          </p>
          {loading ? (
            <Skeleton className="h-9 w-12 mb-3" />
          ) : (
            <h3 className="text-3xl font-bold text-white mb-3">{fmt(schemesCount)}</h3>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
            <div
              className="h-full bg-success transition-all duration-700"
              style={{ width: loading ? "0%" : `${schemesProgress}%` }}
            />
          </div>
        </motion.div>

        {/* Card 3: Upcoming Deadlines */}
        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl bg-[#171a21] border border-border relative overflow-hidden hover:border-white/10 transition-colors"
        >
          <div className="flex justify-between items-start mb-4">
            <Calendar className="w-5 h-5 text-textSecondary" />
            <span className="text-xs font-semibold text-textSecondary">
              {loading ? "—" : deadlines?.count > 0 ? `${deadlines.count} total` : "None"}
            </span>
          </div>
          <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">
            Upcoming Deadlines
          </p>
          {loading ? (
            <>
              <Skeleton className="h-9 w-8 mb-1" />
              <Skeleton className="h-3 w-36 mt-1" />
            </>
          ) : (
            <>
              <h3 className="text-3xl font-bold text-white mb-1">{deadlines?.count ?? 0}</h3>
              {deadlines?.nearest ? (
                <p className="text-[10px] text-textMuted truncate">
                  Next: {deadlines.nearest}
                  {deadlines.nearestTime ? ` (${deadlines.nearestTime})` : ""}
                </p>
              ) : (
                <p className="text-[10px] text-textMuted">No upcoming deadlines</p>
              )}
            </>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
            <div
              className="h-full bg-white/20 transition-all duration-700"
              style={{
                width: loading
                  ? "0%"
                  : deadlines?.count > 0 ? `${Math.min(deadlines.count * 7, 100)}%` : "0%",
              }}
            />
          </div>
        </motion.div>

        {/* Card 4: Corruption Alerts */}
        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl bg-[#171a21] border border-danger/30 relative overflow-hidden hover:border-danger/50 transition-colors"
        >
          <div className="flex justify-between items-start mb-4">
            <ShieldAlert className="w-5 h-5 text-danger" />
            {loading ? (
              <Skeleton className="h-4 w-10" />
            ) : corruptionAlerts?.count > 0 ? (
              <span className="text-xs font-semibold text-danger animate-pulse">Critical</span>
            ) : (
              <span className="text-xs font-semibold text-success">Clear</span>
            )}
          </div>
          <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">
            Corruption Alerts
          </p>
          {loading ? (
            <Skeleton className="h-9 w-8 mb-3" />
          ) : corruptionAlerts?.count > 0 ? (
            <h3 className="text-3xl font-bold text-danger mb-3">
              {String(corruptionAlerts.count).padStart(2, "0")}
            </h3>
          ) : (
            <p className="text-sm font-semibold text-success mb-3 mt-1">No active alerts</p>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
            <div
              className="h-full transition-all duration-700"
              style={{
                width: loading ? "0%" : corruptionAlerts?.count > 0 ? "100%" : "0%",
                backgroundColor: corruptionAlerts?.count > 0 ? "var(--danger, #ef4444)" : "transparent",
              }}
            />
          </div>
        </motion.div>

        {/* Card 5: Unclaimed Benefits */}
        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl bg-[#171a21] border border-border relative overflow-hidden hover:border-white/10 transition-colors"
        >
          <div className="flex justify-between items-start mb-4">
            <Award className="w-5 h-5 text-accent" />
            <span className="text-xs font-semibold text-textSecondary">
              {loading
                ? "—"
                : unclaimedBenefits?.estimatedAmount > 0
                  ? `₹${(unclaimedBenefits.estimatedAmount / 1000).toFixed(0)}k Est.`
                  : "—"}
            </span>
          </div>
          <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">
            Unclaimed Benefits
          </p>
          {loading ? (
            <Skeleton className="h-9 w-8 mb-3" />
          ) : (
            <h3 className="text-3xl font-bold text-accent mb-3">
              {String(unclaimedBenefits?.count ?? 0).padStart(2, "0")}
            </h3>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
            <div
              className="h-full bg-accent transition-all duration-700"
              style={{
                width: loading
                  ? "0%"
                  : unclaimedBenefits?.count > 0 ? `${Math.min(unclaimedBenefits.count * 10, 100)}%` : "5%",
              }}
            />
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Status & Eligibility */}
          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-white">Your Status &amp; Eligibility</h2>
                <p className="text-sm text-textSecondary">
                  {loading
                    ? "Loading eligibility data..."
                    : schemesCount
                      ? `Real-time matching with ${schemesCount} federal and state policies.`
                      : "Real-time matching with government policies."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={clsx(
                    "text-xs font-semibold uppercase tracking-widest transition-colors",
                    eli15Mode ? "text-accent" : "text-textSecondary"
                  )}
                >
                  ELI15 Mode
                </span>
                <div
                  onClick={() => setEli15Mode(!eli15Mode)}
                  className={clsx(
                    "w-10 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors",
                    eli15Mode ? "bg-accent" : "bg-white"
                  )}
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
              {/* Eligibility scores */}
              <div className="w-full md:w-1/3 space-y-3">
                {loading ? (
                  <>
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                  </>
                ) : topScheme1 ? (
                  <>
                    <div
                      className="p-4 rounded-2xl bg-[#1e222e] border border-border hover:border-white/10 transition-all cursor-pointer"
                      onClick={() => navigate("/dashboard/eligibility")}
                    >
                      <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-2 truncate">
                        {topScheme1.name}
                      </h4>
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-bold text-accent">{topScheme1.score}%</span>
                        <span className="text-xs font-semibold px-2 py-1 bg-accent/10 text-accent rounded-md border border-accent/20">
                          {topScheme1.verdict}
                        </span>
                      </div>
                    </div>
                    {topScheme2 && (
                      <div
                        className="p-4 rounded-2xl bg-[#1e222e] border border-border hover:border-white/10 transition-all cursor-pointer"
                        onClick={() => navigate("/dashboard/eligibility")}
                      >
                        <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-2 truncate">
                          {topScheme2.name}
                        </h4>
                        <div className="flex justify-between items-end">
                          <span className="text-2xl font-bold text-white">{topScheme2.score}%</span>
                          <span className="text-xs font-semibold px-2 py-1 bg-white/5 text-textSecondary rounded-md border border-white/10">
                            {topScheme2.verdict}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#1e222e] border border-border text-center">
                    <p className="text-xs text-textMuted mb-2">Complete your profile to see eligibility scores</p>
                    <button
                      onClick={() => navigate("/dashboard/profile")}
                      className="text-xs text-accent hover:underline"
                    >
                      Update Profile →
                    </button>
                  </div>
                )}
              </div>

              {/* AI Summary Card */}
              <div className="w-full md:w-2/3">
                {loading ? (
                  <>
                    <Skeleton className="h-5 w-48 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-4/5 mb-2" />
                    <Skeleton className="h-4 w-3/5 mb-6" />
                    <div className="flex gap-3">
                      <Skeleton className="h-10 w-28 rounded-lg" />
                      <Skeleton className="h-10 w-28 rounded-lg" />
                    </div>
                  </>
                ) : latestBill ? (
                  <>
                    <h3 className="font-bold text-white text-lg mb-3 truncate">
                      AI Summary: {latestBill.title || latestBill.billNumber || "Latest Bill"}
                    </h3>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={eli15Mode ? "eli15" : "normal"}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-sm text-textSecondary leading-relaxed mb-6"
                      >
                        {eli15Mode ? (
                          <span className="text-white font-semibold block">
                            {latestBill.eli15Summary ||
                              latestBill.summary_eli15 ||
                              "This bill has been simplified by CivicSync AI for easy reading!"}
                          </span>
                        ) : (
                          <span>
                            {latestBill.summary ||
                              latestBill.aiSummary ||
                              latestBill.analysis?.summary ||
                              "AI summary for this bill is being generated. Click 'Open Bill' for full details."}
                          </span>
                        )}
                      </motion.p>
                    </AnimatePresence>
                    {(latestBill.analyzedAt || latestBill.createdAt) && (
                      <p className="text-[10px] text-textMuted mb-3">
                        Analyzed: {new Date(latestBill.analyzedAt || latestBill.createdAt).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={handleApply}
                        disabled={applyState !== "idle"}
                        className={clsx(
                          "px-5 py-2.5 rounded-lg font-semibold text-sm transition-all border w-32 flex items-center justify-center",
                          applyState === "applied"
                            ? "bg-success/20 text-success border-success/30"
                            : "bg-[#2a2e3d] text-white border-border hover:bg-[#323749]"
                        )}
                      >
                        {applyState === "idle"    && "Apply Now"}
                        {applyState === "loading" && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
                        {applyState === "applied" && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Applied
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/bills/${latestBill._id || latestBill.id}`)}
                        className="px-5 py-2.5 rounded-lg bg-transparent text-textSecondary font-semibold text-sm hover:text-white transition-colors border border-border"
                      >
                        Open Bill
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-white text-lg mb-3">AI Summary</h3>
                    <p className="text-sm text-textSecondary leading-relaxed mb-6">
                      No bills analyzed yet. Upload your first bill to get an AI-powered summary.
                    </p>
                    <button
                      onClick={() => navigate("/dashboard/upload")}
                      className="px-5 py-2.5 rounded-lg bg-accent text-[#0a0a0f] font-bold text-sm hover:bg-accentHover transition-colors"
                    >
                      Upload Bill
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Live Pulse Feed */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                Live Pulse Feed
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                    {unreadCount}
                  </span>
                )}
              </h2>
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-textSecondary hover:text-white uppercase tracking-widest transition-colors"
              >
                Mark all read
              </button>
            </div>

            <div className="space-y-3">
              {loading ? (
                [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-[#171a21] border border-border flex gap-4 items-start"
                  >
                    <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))
              ) : activityFeed.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#171a21] border border-border text-center">
                  <Bell className="w-8 h-8 text-textMuted mx-auto mb-2" />
                  <p className="text-sm text-textSecondary">No activity yet.</p>
                  <p className="text-xs text-textMuted mt-1">
                    Actions like bill uploads and scheme applications will appear here.
                  </p>
                </div>
              ) : (
                activityFeed.slice(0, 5).map((item) => {
                  const { Icon, bg, color } = getFeedIcon(item.type || item.iconType);
                  return (
                    <div
                      key={item.id}
                      className={clsx(
                        "p-4 rounded-2xl bg-[#171a21] border border-border flex gap-4 items-start group hover:border-white/10 transition-colors cursor-pointer",
                        !item.read && "border-accent/20"
                      )}
                    >
                      <div
                        className={clsx(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform",
                          bg
                        )}
                      >
                        <Icon className={clsx("w-5 h-5", color)} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-bold text-white text-sm">{item.title}</h4>
                          <span className="text-xs text-textSecondary whitespace-nowrap ml-2">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-sm text-textSecondary">{item.desc}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Right Column ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Civic GPS Card */}
          <div
            onClick={() => navigate("/dashboard/gps")}
            className="p-5 rounded-3xl bg-[#171a21] border border-border relative h-[320px] flex flex-col justify-between overflow-hidden group cursor-pointer hover:border-white/10 transition-colors"
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <path d="M10,50 Q30,20 50,50 T90,50" stroke="#fff" strokeWidth="0.5" fill="none" strokeDasharray="2,2" />
                <circle cx="50" cy="50" r="40" stroke="#fff" strokeWidth="0.2" fill="none" />
              </svg>
            </div>

            <div className="relative z-10">
              <h3 className="font-bold text-white text-sm">CIVIC GPS</h3>
              {loading ? (
                <Skeleton className="h-3 w-32 mt-1" />
              ) : gps ? (
                <p className="text-xs text-textSecondary mt-1 leading-tight line-clamp-2">
                  {gps.currentStage}
                </p>
              ) : (
                <p className="text-xs text-textSecondary mt-1">No roadmap generated yet</p>
              )}
            </div>

            {!loading && gps?.hasRoadmap && (
              <div className="relative z-10 mt-2">
                <div className="flex justify-between text-[10px] text-textMuted mb-1">
                  <span>Progress</span>
                  <span>{gps.progressPct}%</span>
                </div>
                <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${gps.progressPct}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-accent rounded-full"
                  />
                </div>
                <p className="text-[10px] text-textMuted mt-2 line-clamp-1">
                  Next: {gps.nextAction}
                </p>
              </div>
            )}

            <div className="relative z-10 flex gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                <span className="text-[10px] text-textSecondary">
                  {gps?.actionRequired > 0 ? `${gps.actionRequired} Action Required` : "No Alerts"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    "w-2 h-2 rounded-full",
                    gps?.completedSteps > 0 ? "bg-success" : "bg-white/20"
                  )}
                />
                <span className="text-[10px] text-textSecondary">
                  {gps ? `${gps.completedSteps}/${gps.totalSteps} Done` : "Active Projects"}
                </span>
              </div>
            </div>

            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-accent rounded-full shadow-[0_0_10px_rgba(244,211,124,0.8)] z-10" />
            {gps?.actionRequired > 0 && (
              <div className="absolute top-1/3 left-2/3 w-2 h-2 bg-danger rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10" />
            )}
          </div>

          {/* Impact Projection */}
          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <h3 className="text-lg font-bold text-white mb-6">Impact Projection</h3>

            <div className="flex items-end justify-between h-32 mb-6 gap-2">
              {loading ? (
                [0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-full flex items-end h-full">
                    <Skeleton
                      className="w-full rounded-t-sm"
                      style={{ height: `${[30, 50, 70, 40, 60, 20][i]}%` }}
                    />
                  </div>
                ))
              ) : (
                impactBars.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(h, 4)}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                    className={clsx(
                      "w-full rounded-t-sm",
                      i === peakBarIdx ? "bg-accent shadow-glow-accent" : "bg-[#2a2e3d]"
                    )}
                  />
                ))
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-textSecondary">Roadmap Completion</span>
                {loading ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  <span className="font-bold text-success">{gpsProgress}%</span>
                )}
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-textSecondary">Eligible Schemes</span>
                {loading ? (
                  <Skeleton className="h-4 w-10" />
                ) : (
                  <span className="font-bold text-success">
                    {analytics?.eligibleVsApplied?.eligible ?? schemesCount ?? "—"}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-textSecondary">Benefits Claimed</span>
                {loading ? (
                  <Skeleton className="h-4 w-10" />
                ) : (
                  <span className="font-bold text-white">{analytics?.totalApproved ?? 0}</span>
                )}
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={simState !== "idle"}
              className="w-full py-3 rounded-lg bg-transparent border border-border text-white font-semibold text-sm hover:bg-[#2a2e3d] transition-colors flex justify-center items-center gap-2"
            >
              {simState === "idle"    && "Run Full Simulation"}
              {simState === "running" && <><Loader2 className="w-4 h-4 animate-spin text-accent" /> Running...</>}
              {simState === "done"    && <><CheckCircle2 className="w-4 h-4 text-success" /> Simulation Complete</>}
            </button>
          </div>
        </motion.div>

      </div>

      {/* Footer */}
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
