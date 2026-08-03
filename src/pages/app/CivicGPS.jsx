import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, CheckCircle2, AlertCircle, Calendar, Briefcase,
  ChevronRight, Upload, Lock, Loader2, ArrowUpRight, Award,
  Trash2, Check, Bell, RefreshCw, Plus, Clock, FileText,
  ChevronLeft, X, CheckSquare, Info, Shield, HelpCircle,
} from "lucide-react";
import {
  getGpsDashboard,
  getGpsRoadmap,
  generateGpsRoadmap,
  getGpsTasks,
  getGpsDocuments,
  uploadGpsDocument,
  deleteGpsDocument,
  getGpsRecommendations,
  getGpsDeadlines,
  getGpsCalendar,
  getGpsApplicationProgress,
  getGpsNotifications,
} from "../../services/gpsService";
import Skeleton from "../../components/ui/Skeleton";
import clsx from "clsx";

// ─── Status Badge Colors ───────────────────────────────────────────────────────

const STATUS_THEMES = {
  completed:       "bg-success/10 text-success border-success/20",
  action_required: "bg-red-500/10 text-red-400 border-red-500/20",
  upcoming:        "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pending:         "bg-[#2a2e3d] text-textSecondary border-border",
};

const ICON_MAP = {
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  FileText,
  Calendar,
  MapPin,
  Lock,
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CivicGPS() {
  // Page states
  const [dashboard, setDashboard] = useState(null);
  const [roadmap, setRoadmap]     = useState(null);
  const [tasks, setTasks]         = useState([]);
  const [documents, setDocuments] = useState([]);
  const [recs, setRecs]           = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [calendar, setCalendar]   = useState([]);
  const [progress, setProgress]   = useState([]);
  const [alerts, setAlerts]       = useState([]);

  // Load flags
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Document Upload modal fields
  const [showUpload, setShowUpload] = useState(false);
  const [docName, setDocName] = useState("Income Certificate");
  const [docFile, setDocFile] = useState(null);
  const [docExpiry, setDocExpiry] = useState("");

  const loadAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [
        dashRes,
        roadRes,
        taskRes,
        docRes,
        recRes,
        deadRes,
        calRes,
        progRes,
        alertRes,
      ] = await Promise.all([
        getGpsDashboard(),
        getGpsRoadmap(),
        getGpsTasks(),
        getGpsDocuments(),
        getGpsRecommendations(),
        getGpsDeadlines(),
        getGpsCalendar(),
        getGpsApplicationProgress(),
        getGpsNotifications(),
      ]);

      setDashboard(dashRes);
      setRoadmap(roadRes);
      setTasks(taskRes);
      setDocuments(docRes);
      setRecs(recRes);
      setDeadlines(deadRes);
      setCalendar(calRes);
      setProgress(progRes);
      setAlerts(alertRes);
    } catch (err) {
      console.error("[CivicGPS] Load error:", err);
      setError("Failed to sync your Civic GPS trajectory. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle roadmap rebuild
  const handleRegenerate = async () => {
    setRefreshing(true);
    try {
      await generateGpsRoadmap();
      await loadAllData(true);
    } catch (err) {
      console.error("[CivicGPS] Regenerate error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Convert uploaded file to base64 & upload to database
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocFile(file);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!docFile) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result.split(",")[1];
        await uploadGpsDocument({
          name: docName,
          fileName: docFile.name,
          fileSize: docFile.size,
          fileData: base64Data,
          expiryDate: docExpiry || undefined,
        });

        // Clear forms
        setDocFile(null);
        setDocExpiry("");
        setShowUpload(false);
        // Refresh page
        await loadAllData(true);
      };
      reader.readAsDataURL(docFile);
    } catch (err) {
      console.error("[CivicGPS] Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteGpsDocument(docId);
      await loadAllData(true);
    } catch (err) {
      console.error("[CivicGPS] Delete error:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-20 max-w-7xl mx-auto">
        <div className="flex justify-between items-center pb-6 border-b border-border">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="w-full h-80 rounded-3xl" />
            <Skeleton className="w-full h-64 rounded-3xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="w-full h-48 rounded-3xl" />
            <Skeleton className="w-full h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/20 text-center space-y-4 max-w-xl mx-auto my-20">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sync Disrupted</h2>
        <p className="text-sm text-textSecondary">{error}</p>
        <button
          onClick={() => loadAllData()}
          className="px-6 py-2.5 rounded-xl bg-accent text-[#0a0a0f] font-bold hover:bg-accentHover transition-colors"
        >
          Re-establish Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Civic GPS: Policy Roadmap</h1>
          <p className="text-sm text-textSecondary">Your personalized AI-driven journey planner for government services</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRegenerate}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-textSecondary text-sm font-semibold hover:text-white transition-colors"
          >
            <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
            Sync Roadmap
          </button>
        </div>
      </div>

      {/* ─── Stats Dashboard ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Roadmap Completion", value: `${dashboard?.roadmapCompletion ?? 0}%`, color: "text-accent" },
          { label: "Submitted Apps", value: dashboard?.applicationsSubmitted ?? 0, color: "text-blue-400" },
          { label: "Approved Apps", value: dashboard?.applicationsApproved ?? 0, color: "text-success" },
          { label: "Benefits Claimed", value: dashboard?.benefitsClaimed ?? 0, color: "text-purple-400" },
          { label: "Pending Actions", value: dashboard?.pendingTasksCount ?? 0, color: "text-orange-400" },
          { label: "Vault Documents", value: dashboard?.documentsUploadedCount ?? 0, color: "text-cyan-400" },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-2xl bg-[#171a21] border border-border text-center">
            <p className={clsx("text-3xl font-bold mb-1", stat.color)}>{stat.value}</p>
            <p className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Main Grid Layout ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">

          {/* AI Personalized Roadmap timeline */}
          <div className="p-6 rounded-3xl bg-[#12141d] border border-border relative">
            <div className="flex justify-between items-center mb-8">
              <span className="text-xs font-semibold text-textSecondary uppercase tracking-widest bg-[#171a21] border border-border px-3 py-1 rounded-full">
                Active Trajectory
              </span>
              <span className="text-[10px] text-accent uppercase font-bold tracking-widest">
                Updates dynamically
              </span>
            </div>

            {/* Vertical connector line */}
            <div className="absolute left-[37px] top-24 bottom-12 w-px bg-border" />

            <div className="space-y-6 relative z-10">
              {roadmap?.items && roadmap.items.length > 0 ? (
                roadmap.items.map((item, idx) => {
                  const Icon = ICON_MAP[item.icon] || FileText;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="flex gap-4 items-start"
                    >
                      {/* Circle icon marker */}
                      <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#12141d] flex-shrink-0 z-10 shadow-lg",
                        item.status === "completed" ? "bg-success text-[#0a0a0f]" :
                        item.status === "action_required" ? "bg-red-500 text-white animate-pulse" :
                        item.status === "upcoming" ? "bg-blue-500 text-white" :
                        "bg-[#2a2e3d] text-textSecondary"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Step Card */}
                      <div className="flex-1 p-4 rounded-2xl bg-[#171a21] border border-border">
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <h4 className="text-white font-bold text-sm">{item.title}</h4>
                          <span className={clsx("text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", STATUS_THEMES[item.status] || STATUS_THEMES.pending)}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-xs text-textSecondary leading-relaxed">{item.desc}</p>
                        {item.date && (
                          <p className="text-[10px] text-accent font-semibold mt-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {item.date}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-textSecondary bg-[#171a21] rounded-2xl border border-border">
                  <p className="font-semibold text-sm">
                    {roadmap?.message || "No roadmap items found for your profile."}
                  </p>
                  <p className="text-xs text-textSecondary/70 mt-1">
                    Click "Sync Roadmap" above to generate your personalized civic trajectory.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Next Best Action List */}
          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-4">Next Best Action</h3>
            <div className="space-y-3">
              {tasks.map((task, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#12141d] border border-border flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "w-1.5 h-1.5 rounded-full",
                        task.priority === "high" ? "bg-red-400" : task.priority === "medium" ? "bg-orange-400" : "bg-blue-400"
                      )} />
                      <h4 className="text-white font-semibold text-sm">{task.title}</h4>
                    </div>
                    <p className="text-xs text-textSecondary leading-relaxed">{task.description}</p>
                  </div>
                  {task.category === "document" && (
                    <button
                      onClick={() => { setDocName(task.title.replace("Upload ", "")); setShowUpload(true); }}
                      className="px-4 py-2 rounded-xl bg-accent text-[#0a0a0f] text-xs font-bold hover:bg-accentHover transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload File
                    </button>
                  )}
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-textSecondary text-center py-4">All compliance gaps met! Your path is completely clear.</p>
              )}
            </div>
          </div>

          {/* Active Application Progress Timeline */}
          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-4">Active Applications Status</h3>
            <div className="space-y-4">
              {progress.map((app, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#12141d] border border-border space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-white font-bold text-sm">{app.schemeName}</h4>
                      <p className="text-[10px] text-textSecondary uppercase mt-0.5 tracking-wider">{app.schemeCategory}</p>
                    </div>
                    <span className="text-xs text-accent font-semibold">{app.estimatedBenefit}</span>
                  </div>

                  {/* Horizontal application pipeline */}
                  <div className="flex items-center justify-between relative mt-2">
                    {["submitted", "pending", "under_review", "approved"].map((step, stepIdx, arr) => {
                      const isComplete = ["approved"].includes(app.status) || arr.indexOf(app.status) >= stepIdx;
                      return (
                        <div key={step} className="flex items-center flex-1 last:flex-initial">
                          <div className="flex flex-col items-center flex-1 z-10">
                            <div className={clsx(
                              "w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-colors",
                              isComplete ? "bg-success border-success text-[#0a0a0f]" : "bg-[#171a21] border-border text-textSecondary"
                            )}>
                              {isComplete ? "✓" : stepIdx + 1}
                            </div>
                            <span className="text-[8px] text-textMuted uppercase mt-1 tracking-wider">{step.replace("_", " ")}</span>
                          </div>
                          {stepIdx < arr.length - 1 && (
                            <div className={clsx("flex-1 h-[2px] -mt-3.5", isComplete ? "bg-success" : "bg-border")} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {progress.length === 0 && (
                <p className="text-sm text-textSecondary text-center py-4">No active applications currently filed. Visit the Scheme Finder to apply.</p>
              )}
            </div>
          </div>

          {/* Document Checklist Vault */}
          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-widest">Document Vault Checklist</h3>
              <button
                onClick={() => setShowUpload(true)}
                className="px-3 py-1.5 rounded-lg border border-border text-accent hover:border-accent text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Document
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc._id} className="p-4 rounded-2xl bg-[#12141d] border border-border flex flex-col justify-between h-32 relative group">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-white font-bold text-sm">{doc.name}</h4>
                      <p className="text-[10px] text-textSecondary font-medium truncate max-w-[150px] mt-0.5">{doc.fileName}</p>
                    </div>
                    <span className={clsx(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                      doc.status === "verified" ? "bg-success/10 text-success border-success/20" :
                      doc.status === "pending" ? "bg-orange-400/10 text-orange-400 border-orange-400/20" :
                      "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      {doc.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/[0.03]">
                    <span className="text-[10px] text-textMuted flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : "No Expiry"}
                    </span>
                    <button
                      onClick={() => handleDeleteDoc(doc._id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Column */}
        <div className="space-y-6">

          {/* AI Smart Notifications Panel */}
          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-accent" /> Smart Notifications
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {alerts.map((alert, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#12141d] border border-border space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <p className="text-xs font-semibold text-white leading-tight">{alert.title || "Timeline Notification"}</p>
                  </div>
                  <p className="text-[11px] text-textSecondary leading-normal pl-3">{alert.message || alert.desc}</p>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-xs text-textSecondary text-center py-4">No recent notification logs.</p>
              )}
            </div>
          </div>

          {/* Next Expiry / Deadline Tracker */}
          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-4">Deadline Tracker</h3>
            <div className="space-y-3">
              {deadlines.map((dead, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#12141d] border border-border flex justify-between items-center">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{dead.title}</h4>
                    <p className="text-[10px] text-textSecondary mt-0.5">{new Date(dead.date).toLocaleDateString()}</p>
                  </div>
                  <div className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex-shrink-0">
                    {dead.daysLeft}d left
                  </div>
                </div>
              ))}
              {deadlines.length === 0 && (
                <p className="text-xs text-textSecondary text-center py-4">No immediate deadlines pending.</p>
              )}
            </div>
          </div>

          {/* AI Recommended Schemes/Benefits */}
          <div className="p-6 rounded-3xl bg-[#171a21] border border-accent/20">
            <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-4">AI Recommendations</h3>
            <div className="space-y-3">
              {recs.map((rec, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#12141d] border border-border space-y-2 hover:border-accent/40 transition-colors">
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="font-bold text-white text-xs truncate max-w-[140px]">{rec.title}</h4>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-bold">
                      {rec.matchScore}% Match
                    </span>
                  </div>
                  <p className="text-[11px] text-textSecondary leading-relaxed">{rec.description}</p>
                  <p className="text-[10px] text-accent font-semibold">{rec.whyRecommended}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Calendar Events */}
          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-4">Smart Calendar</h3>
            <div className="space-y-3">
              {calendar.slice(0, 4).map((event, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#12141d] border border-border flex items-start gap-3">
                  <div className="p-2 rounded bg-accent/10 border border-accent/20 text-accent text-xs font-bold text-center w-12 flex-shrink-0">
                    {new Date(event.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{event.title}</h4>
                    <p className="text-[10px] text-textSecondary mt-0.5 line-clamp-1">{event.description || event.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ─── Upload Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm" onClick={() => setShowUpload(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#171a21] border border-border rounded-3xl p-6 relative z-10 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="text-white font-bold text-base">Upload Document Vault Item</h3>
                <button onClick={() => setShowUpload(false)} className="text-textSecondary hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-bold mb-2 block">Document Type</label>
                  <div className="relative">
                    <select
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full bg-[#12141d] border border-border rounded-xl py-3 px-4 text-sm text-white appearance-none focus:outline-none focus:border-accent transition-colors"
                    >
                      <option value="Income Certificate">Income Certificate</option>
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Residence Certificate">Residence Certificate</option>
                      <option value="Caste Certificate">Caste Certificate</option>
                      <option value="Bank Passbook">Bank Passbook</option>
                      <option value="Education Certificate">Education Certificate</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-bold mb-2 block">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={docExpiry}
                    onChange={(e) => setDocExpiry(e.target.value)}
                    className="w-full bg-[#12141d] border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-bold mb-2 block">Select File (PDF / Image)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    required
                    className="w-full text-sm text-textSecondary file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-border file:bg-[#12141d] file:text-white file:text-xs file:font-semibold hover:file:bg-[#1a1d24] file:cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3.5 rounded-xl bg-accent text-[#0a0a0f] font-bold text-sm hover:bg-accentHover transition-colors flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Storing Base64...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Save to Vault</>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
