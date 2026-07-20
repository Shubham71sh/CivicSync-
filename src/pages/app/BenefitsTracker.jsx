import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Loader2, RefreshCw, Search, Filter, X,
  CheckCircle2, Clock, AlertCircle, XCircle, ArrowUpRight,
  FileText, Calendar, IndianRupee, ChevronDown, ChevronLeft,
  ChevronRight, TrendingUp, Award, ClipboardList, BadgeCheck,
} from "lucide-react";
import { getApplications, getApplicationById } from "../../services/schemeService";
import Skeleton from "../../components/ui/Skeleton";
import clsx from "clsx";

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  submitted:    { label: "Submitted",    icon: ClipboardList, color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  pending:      { label: "Pending",      icon: Clock,         color: "text-orange-400", bg: "bg-orange-500/10 border-orange-400/20" },
  under_review: { label: "Under Review", icon: AlertCircle,   color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-400/20" },
  approved:     { label: "Approved",     icon: CheckCircle2,  color: "text-success",    bg: "bg-success/10 border-success/20" },
  rejected:     { label: "Rejected",     icon: XCircle,       color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20" },
};

const TIMELINE_STEPS = ["submitted", "pending", "under_review", "approved"];

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-5 rounded-2xl bg-[#171a21] border border-border"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center border", color.bg)}>
          <Icon className={clsx("w-5 h-5", color.icon)} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-textMuted" />
      </div>
      <p className={clsx("text-3xl font-bold mb-1", color.icon)}>{value}</p>
      <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold">{label}</p>
    </motion.div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  const Icon = cfg.icon;
  return (
    <span className={clsx("inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider", cfg.bg, cfg.color)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Progress Timeline ─────────────────────────────────────────────────────────

function ApplicationTimeline({ status }) {
  const steps = TIMELINE_STEPS;
  const currentIndex = steps.indexOf(status);
  const isRejected = status === "rejected";

  return (
    <div className="flex items-center gap-0 mt-4">
      {steps.map((step, i) => {
        const cfg = STATUS_CONFIG[step];
        const isDone = currentIndex > i || (status === "approved" && step === "approved");
        const isCurrent = currentIndex === i && !isRejected;
        const stepLabel = cfg?.label || step;

        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={clsx(
                "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors",
                isRejected     ? "bg-[#1e222e] border-red-500/40" :
                isDone || isCurrent ? "bg-success border-success"    :
                "bg-[#1e222e] border-border"
              )}>
                {isRejected ? (
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                ) : isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0a0a0f]" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-[#0a0a0f] animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#2a2e3d]" />
                )}
              </div>
              <p className="text-[9px] text-textMuted mt-1 text-center uppercase tracking-wider font-bold">{stepLabel}</p>
            </div>
            {i < steps.length - 1 && (
              <div className={clsx(
                "flex-1 h-px -mt-4 mx-0.5",
                isDone && !isRejected ? "bg-success" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Application Row (Table) ───────────────────────────────────────────────────

function ApplicationRow({ app, onExpand, isExpanded }) {
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <>
      <tr
        className="border-b border-border hover:bg-white/[0.02] cursor-pointer transition-colors"
        onClick={() => onExpand(isExpanded ? null : app._id)}
      >
        <td className="py-3.5 px-4 text-sm text-white font-semibold">{app.schemeName}</td>
        <td className="py-3.5 px-4 text-sm text-textSecondary hidden sm:table-cell">
          <span className={clsx(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
            `bg-white/5 text-textSecondary border-border`
          )}>
            {app.schemeCategory}
          </span>
        </td>
        <td className="py-3.5 px-4 text-sm text-textSecondary hidden md:table-cell">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(app.appliedAt)}</span>
        </td>
        <td className="py-3.5 px-4"><StatusBadge status={app.status} /></td>
        <td className="py-3.5 px-4 text-sm text-accent font-semibold hidden lg:table-cell">{app.estimatedBenefit || "—"}</td>
        <td className="py-3.5 px-4">
          <ChevronDown className={clsx("w-4 h-4 text-textMuted transition-transform", isExpanded && "rotate-180")} />
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-border">
          <td colSpan={6} className="px-4 pb-4 pt-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-xl bg-[#12141d] border border-border space-y-3"
            >
              <div className="flex flex-wrap gap-4 text-sm">
                {app.estimatedBenefit && (
                  <div>
                    <p className="text-textMuted text-xs uppercase tracking-wider font-bold mb-0.5">Estimated Benefit</p>
                    <p className="text-accent font-semibold">{app.estimatedBenefit}</p>
                  </div>
                )}
                {app.notes && (
                  <div>
                    <p className="text-textMuted text-xs uppercase tracking-wider font-bold mb-0.5">Remarks</p>
                    <p className="text-textSecondary">{app.notes}</p>
                  </div>
                )}
              </div>
              <ApplicationTimeline status={app.status} />
            </motion.div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Skeleton Row ──────────────────────────────────────────────────────────────

function TableSkeletonRow() {
  return (
    <tr className="border-b border-border">
      <td className="py-3.5 px-4"><Skeleton className="w-40 h-4" /></td>
      <td className="py-3.5 px-4 hidden sm:table-cell"><Skeleton className="w-20 h-4" /></td>
      <td className="py-3.5 px-4 hidden md:table-cell"><Skeleton className="w-24 h-4" /></td>
      <td className="py-3.5 px-4"><Skeleton className="w-20 h-5 rounded-full" /></td>
      <td className="py-3.5 px-4 hidden lg:table-cell"><Skeleton className="w-24 h-4" /></td>
      <td className="py-3.5 px-4"><Skeleton className="w-4 h-4" /></td>
    </tr>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BenefitsTracker() {
  const [applications, setApplications] = useState([]);
  const [summary, setSummary]           = useState({});
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [expandedId, setExpandedId]     = useState(null);

  // Filters
  const [search,    setSearch]    = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const fetchBenefits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getApplications();
      setApplications(result.applications || []);
      setSummary(result.summary || {});
    } catch (err) {
      console.error("[BenefitsTracker] fetch error:", err);
      setError("Failed to load applications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBenefits(); }, [fetchBenefits]);

  // Filter logic
  const filtered = applications.filter(app => {
    const matchSearch  = !search || app.schemeName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus  = statusFilter === "all" || app.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const STAT_CARDS = [
    { label: "Total Applied",   value: summary.total      ?? 0, icon: ClipboardList,  color: { icon: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" } },
    { label: "Approved",        value: summary.approved   ?? 0, icon: CheckCircle2,   color: { icon: "text-success",    bg: "bg-success/10 border-success/20" } },
    { label: "Pending",         value: (summary.submitted ?? 0) + (summary.pending ?? 0) + (summary.under_review ?? 0), icon: Clock, color: { icon: "text-orange-400", bg: "bg-orange-500/10 border-orange-400/20" } },
    { label: "Rejected",        value: summary.rejected   ?? 0, icon: XCircle,        color: { icon: "text-red-400",    bg: "bg-red-500/10 border-red-500/20" } },
    { label: "Benefits Earned", value: summary.totalBenefitsReceived ?? summary.approved ?? 0, icon: Award, color: { icon: "text-accent", bg: "bg-accent/10 border-accent/20" } },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Target className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Benefits Tracker</h1>
            <p className="text-sm text-textSecondary">
              {loading ? "Loading..." : `${summary.total ?? 0} total applications tracked`}
            </p>
          </div>
        </div>
        <button
          onClick={fetchBenefits}
          disabled={loading}
          className="p-2 rounded-xl border border-border text-textSecondary hover:text-white hover:border-white/20 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#171a21] border border-border space-y-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="w-16 h-7" />
              <Skeleton className="w-24 h-3" />
            </div>
          ))
          : STAT_CARDS.map((c, i) => (
            <StatCard key={c.label} {...c} delay={i * 0.05} />
          ))
        }
      </div>

      {/* Error */}
      {!loading && error && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
          <p className="text-red-400 font-semibold">{error}</p>
          <button onClick={fetchBenefits} className="px-4 py-2 rounded-lg bg-accent text-[#0a0a0f] text-sm font-bold hover:bg-accentHover transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Table Section */}
      {!error && (
        <div className="rounded-2xl bg-[#171a21] border border-border overflow-hidden">
          {/* Table Controls */}
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
              <input
                type="text"
                placeholder="Search by scheme name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#12141d] border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-textMuted focus:outline-none focus:border-accent transition-colors"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#12141d] border border-border rounded-xl py-2.5 pl-3 pr-9 text-sm text-white appearance-none focus:outline-none focus:border-accent transition-colors"
              >
                <option value="all">All Status</option>
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>{cfg.label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-[#12141d]">
                  <th className="text-left py-3 px-4 text-[10px] text-textMuted uppercase tracking-widest font-bold">Scheme</th>
                  <th className="text-left py-3 px-4 text-[10px] text-textMuted uppercase tracking-widest font-bold hidden sm:table-cell">Category</th>
                  <th className="text-left py-3 px-4 text-[10px] text-textMuted uppercase tracking-widest font-bold hidden md:table-cell">Applied On</th>
                  <th className="text-left py-3 px-4 text-[10px] text-textMuted uppercase tracking-widest font-bold">Status</th>
                  <th className="text-left py-3 px-4 text-[10px] text-textMuted uppercase tracking-widest font-bold hidden lg:table-cell">Benefit</th>
                  <th className="py-3 px-4 w-8" />
                </tr>
              </thead>
              <tbody>
                {/* Loading skeletons */}
                {loading && Array.from({ length: 5 }).map((_, i) => <TableSkeletonRow key={i} />)}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <FileText className="w-10 h-10 text-textMuted mx-auto mb-3" />
                      <p className="text-white font-bold mb-1">No applications found</p>
                      <p className="text-textSecondary text-sm">
                        {search || statusFilter !== "all"
                          ? "Try adjusting your search or filter."
                          : "Apply for schemes via the Scheme Finder to start tracking benefits."}
                      </p>
                    </td>
                  </tr>
                )}

                {/* Application rows */}
                {!loading && paginated.map((app) => (
                  <ApplicationRow
                    key={app._id}
                    app={app}
                    onExpand={setExpandedId}
                    isExpanded={expandedId === app._id}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-xs text-textSecondary">
                Showing <span className="text-white font-semibold">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)}</span> of{" "}
                <span className="text-white font-semibold">{filtered.length}</span> applications
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-textSecondary text-xs font-semibold hover:text-white hover:border-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-textSecondary text-xs font-semibold hover:text-white hover:border-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
