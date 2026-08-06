import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Briefcase, MapPin, Sparkles, Filter, ExternalLink,
  CheckCircle2, AlertCircle, Loader2, ArrowLeft, RefreshCw,
  Settings, Check, X, ShieldCheck, Award, FileText, ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../../hooks/useAuth";
import {
  getRecommendations,
  getSchemeNotifications,
  markRead,
  markAllRead,
  getPreferences,
  savePreferences
} from "../../services/schemeNotificationService";

const PROFESSIONS = [
  "Farmer", "Student", "Doctor", "Teacher", "Entrepreneur", "Engineer",
  "Daily Wage Worker", "Self Employed", "Homemaker", "Artisan", "Retired", "Unemployed"
];

const STATES = [
  "All India", "Andhra Pradesh", "Assam", "Bihar", "Delhi", "Gujarat",
  "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"
];

const PRIORITY_BADGES = {
  high:   { label: "High Match", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/30" },
  medium: { label: "Medium Match", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" },
  low:    { label: "Low Match", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" }
};

export default function SchemeNotifications() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profession, setProfession] = useState(user?.profession || "Farmer");
  const [state, setState] = useState(user?.location || "All India");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState(null);

  // Load existing notifications on mount
  useEffect(() => {
    fetchNotifications();
    getPreferences().then(res => setPrefs(res.preferences)).catch(console.error);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getSchemeNotifications();
      if (res.notifications && res.notifications.length > 0) {
        setNotifications(res.notifications);
      } else {
        // Auto-generate if empty
        await handleGenerateRecs();
      }
    } catch (err) {
      console.error("[SchemeNotifications] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecs = async () => {
    setGenerating(true);
    try {
      const res = await getRecommendations({ profession, state });
      if (res.recommendations) {
        setNotifications(res.recommendations);
      }
    } catch (err) {
      console.error("[SchemeNotifications] generate error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("[SchemeNotifications] mark read error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("[SchemeNotifications] mark all read error:", err);
    }
  };

  const handleSavePrefs = async (newPrefs) => {
    try {
      const res = await savePreferences(newPrefs);
      setPrefs(res.preferences);
      setShowSettings(false);
    } catch (err) {
      console.error("[SchemeNotifications] save prefs error:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const categories = ["all", ...new Set(notifications.map(n => n.category).filter(Boolean))];

  const filteredNotifications = notifications.filter(n => {
    if (selectedCategory !== "all" && n.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center relative">
            <Bell className="w-6 h-6 text-cyan-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-400 text-[#0a0a0f] text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Scheme Alerts</h1>
            <p className="text-sm text-textSecondary">AI-curated government scheme notifications based on your profession</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-xl bg-[#1e222e] border border-border text-textSecondary hover:text-white transition-colors"
            title="Notification Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="px-4 py-2 rounded-xl bg-[#1e222e] border border-border text-textSecondary hover:text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Mark all read
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm text-textSecondary hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* Profession & Filter Bar */}
      <div className="p-5 rounded-2xl bg-[#171a21] border border-border space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1e222e] border border-border">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <select
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
              >
                {PROFESSIONS.map(p => (
                  <option key={p} value={p} className="bg-[#171a21] text-white">{p}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1e222e] border border-border">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
              >
                {STATES.map(s => (
                  <option key={s} value={s} className="bg-[#171a21] text-white">{s}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateRecs}
            disabled={generating}
            className="px-6 py-2.5 rounded-xl bg-cyan-400 text-[#0a0a0f] font-bold text-sm hover:bg-cyan-300 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.25)] active:scale-95 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#0a0a0f]" />
                Scanning Schemes...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Find Schemes for Me
              </>
            )}
          </button>
        </div>

        {/* Category Pills */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50 overflow-x-auto scrollbar-hide">
            <Filter className="w-3.5 h-3.5 text-textSecondary flex-shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={clsx(
                  "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap",
                  selectedCategory === cat
                    ? "bg-cyan-400 text-[#0a0a0f] font-bold shadow-sm"
                    : "bg-[#1e222e] text-textSecondary hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-6 rounded-2xl bg-[#171a21] border border-border animate-pulse space-y-3">
              <div className="h-5 bg-[#2a2e3d] rounded w-1/3" />
              <div className="h-4 bg-[#2a2e3d] rounded w-3/4" />
              <div className="h-4 bg-[#2a2e3d] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-[#171a21] border border-border">
          <Award className="w-12 h-12 text-textMuted mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No scheme alerts found</h3>
          <p className="text-sm text-textSecondary mb-6 max-w-sm mx-auto">
            Click "Find Schemes for Me" to generate AI recommendations tailored to your profile.
          </p>
          <button
            onClick={handleGenerateRecs}
            className="px-6 py-2.5 rounded-xl bg-cyan-400 text-[#0a0a0f] font-bold text-sm hover:bg-cyan-300 transition-colors"
          >
            Generate Recommendations
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredNotifications.map((item, idx) => {
              const badge = PRIORITY_BADGES[item.priority] || PRIORITY_BADGES.medium;
              return (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.05 }}
                  className={clsx(
                    "p-6 rounded-2xl border transition-all relative group",
                    item.isRead
                      ? "bg-[#14161d] border-border opacity-85 hover:opacity-100"
                      : "bg-[#171a21] border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.05)]"
                  )}
                >
                  {!item.isRead && (
                    <div className="absolute top-6 left-3 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  )}

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", badge.color, badge.bg, badge.border)}>
                          {badge.label} ({item.relevanceScore}%)
                        </span>
                        {item.category && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-textSecondary uppercase tracking-wider">
                            {item.category}
                          </span>
                        )}
                        {item.ministry && (
                          <span className="text-[10px] text-textSecondary">
                            · {item.ministry}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {item.schemeName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!item.isRead && (
                        <button
                          onClick={() => handleMarkRead(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#2a2e3d] text-xs font-semibold text-textSecondary hover:text-white transition-colors"
                        >
                          Mark Read
                        </button>
                      )}
                      {item.officialLink && (
                        <a
                          href={item.officialLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-1.5 rounded-lg bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400 hover:text-[#0a0a0f] text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          Apply / Official Site <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-textSecondary leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-border/50 text-xs">
                    {item.benefit && (
                      <div>
                        <span className="font-bold text-white block mb-0.5">Benefit:</span>
                        <span className="text-textSecondary">{item.benefit}</span>
                      </div>
                    )}
                    {item.eligibility && (
                      <div>
                        <span className="font-bold text-white block mb-0.5">Eligibility:</span>
                        <span className="text-textSecondary">{item.eligibility}</span>
                      </div>
                    )}
                  </div>

                  {item.relevanceReason && (
                    <div className="mt-3 p-3 rounded-xl bg-cyan-400/5 border border-cyan-400/15 flex items-center gap-2 text-xs text-cyan-300">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{item.relevanceReason}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Preferences Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[#171a21] border border-border space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  Alert Preferences
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-textSecondary hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="font-bold text-white block mb-1">Target Profession</label>
                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#1e222e] border border-border text-white focus:outline-none focus:border-cyan-400"
                  >
                    {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-white block mb-1">Target State / Region</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#1e222e] border border-border text-white focus:outline-none focus:border-cyan-400"
                  >
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-xl bg-[#2a2e3d] text-textSecondary hover:text-white text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleSavePrefs({ profession, state });
                    handleGenerateRecs();
                  }}
                  className="px-5 py-2 rounded-xl bg-cyan-400 text-[#0a0a0f] font-bold text-sm hover:bg-cyan-300 transition-colors"
                >
                  Save & Refresh Alerts
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
