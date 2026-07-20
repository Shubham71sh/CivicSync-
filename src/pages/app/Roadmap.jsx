import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Map, CheckCircle2, AlertCircle, Clock, ChevronRight,
  Award, FileText, Calendar, Loader2, RefreshCw,
} from "lucide-react";
import { getGpsRoadmap } from "../../services/gpsService";

// ─── Icon Map ─────────────────────────────────────────────────────────────────
// Maps string icon names (stored in MongoDB) to Lucide React components.
const ICON_MAP = {
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  FileText,
  Calendar,
  Map,
};

// ─── Roadmap Page ─────────────────────────────────────────────────────────────
// Fetches the citizen's personalized civic roadmap from Firestore.
// ─────────────────────────────────────────────────────────────────────────────

export default function Roadmap() {
  const [roadmap, setRoadmap] = useState(null);
  const [summary, setSummary] = useState({ completed: 0, actionRequired: 0, upcoming: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRoadmap = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGpsRoadmap();
      setRoadmap(data);
      setSummary(data.summary || {});
    } catch (err) {
      console.error("[Roadmap] Failed to load:", err);
      setError("Failed to load your roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Map className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Civic GPS Roadmap</h1>
            <p className="text-sm text-textSecondary">Your personalized timeline of benefits, bills, and civic milestones.</p>
          </div>
        </div>
        {!loading && (
          <button
            onClick={fetchRoadmap}
            className="p-2 rounded-lg border border-border text-textSecondary hover:text-white hover:border-white/20 transition-colors"
            title="Refresh roadmap"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-sm text-textSecondary">Loading your civic roadmap...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
          <p className="text-red-400 font-semibold">{error}</p>
          <button
            onClick={fetchRoadmap}
            className="px-4 py-2 rounded-lg bg-accent text-[#0a0a0f] text-sm font-bold hover:bg-accentHover transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loaded State */}
      {!loading && !error && roadmap && (
        <>
          {/* Progress Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Completed", value: summary.completed ?? 0, color: "text-success" },
              { label: "Action Required", value: summary.actionRequired ?? 0, color: "text-orange-400" },
              { label: "Upcoming", value: summary.upcoming ?? 0, color: "text-blue-400" },
              { label: "Pending", value: summary.pending ?? 0, color: "text-textSecondary" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-4 rounded-2xl bg-[#171a21] border border-border text-center"
              >
                <p className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</p>
                <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Timeline */}
          {roadmap.items && roadmap.items.length > 0 ? (
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-4">
                {roadmap.items.map((item, i) => {
                  const Icon = ICON_MAP[item.icon] || FileText;
                  return (
                    <motion.div
                      key={item._id || i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`relative flex gap-5 p-5 rounded-2xl border ml-3 cursor-pointer group hover:border-white/10 transition-colors ${
                        item.status === "action_required"
                          ? "bg-orange-400/5 border-orange-400/20"
                          : "bg-[#171a21] border-border"
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute -left-8 w-5 h-5 rounded-full border-2 border-[#171a21] z-10 flex-shrink-0 ${
                        item.status === "completed"       ? "bg-success" :
                        item.status === "action_required" ? "bg-orange-400" :
                        item.status === "upcoming"        ? "bg-blue-400" :
                        "bg-[#2a2e3d]"
                      }`} />

                      {/* Icon box */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${
                        item.status === "completed"       ? "bg-success/10" :
                        item.status === "action_required" ? "bg-orange-400/10" :
                        "bg-[#2a2e3d]"
                      }`}>
                        <Icon className={`w-5 h-5 text-${item.color || "textSecondary"}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-bold text-white text-sm">{item.title}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 uppercase tracking-wider ${item.badgeBg || "bg-[#2a2e3d] text-textSecondary border-border"}`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-xs text-accent font-semibold mb-1.5 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" /> {item.date}
                        </p>
                        <p className="text-sm text-textSecondary leading-relaxed">{item.desc}</p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-textSecondary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-textSecondary">
              <Map className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No roadmap items yet.</p>
              <p className="text-sm mt-1">Complete your profile to unlock personalized milestones.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
