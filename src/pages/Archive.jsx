import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive as ArchiveIcon,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  FileText,
  Waves,
  Flame,
  Activity,
  Wind,
  Mountain,
  CloudRain,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Calendar,
  MapPin,
  IndianRupee,
  SlidersHorizontal,
  X,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ARCHIVE_RECORDS = [
  {
    id: "CS-2025-F001",
    type: "Flood",
    icon: "Waves",
    location: "Patna, Bihar — Ward 14",
    date: "June 28, 2025",
    status: "approved",
    relief: "₹60,000",
    confidence: 94,
    schemes: ["PMRF", "BSMY", "NDRF"],
    officer: "Rajesh Kumar (BDO)",
    summary: "Structural damage to residential property. Flood depth 1.8m. 82% overall damage assessed by AI model.",
    documents: 4,
    stage: "Disbursement Complete",
  },
  {
    id: "CS-2025-Q002",
    type: "Earthquake",
    icon: "Activity",
    location: "Jaipur, Rajasthan — Sector 9",
    date: "May 14, 2025",
    status: "under_review",
    relief: "₹1,10,000",
    confidence: 87,
    schemes: ["SDRF", "PM Awas Yojana"],
    officer: "Kavita Sharma (BDO)",
    summary: "Partial collapse of two walls. Cracks detected in load-bearing structure. On-site audit pending.",
    documents: 3,
    stage: "Physical Inspection Scheduled",
  },
  {
    id: "CS-2025-C003",
    type: "Cyclone",
    icon: "Wind",
    location: "Bhubaneswar, Odisha — Block 7",
    date: "April 3, 2025",
    status: "rejected",
    relief: "—",
    confidence: 55,
    schemes: [],
    officer: "Suresh Nayak (BDO)",
    summary: "Damage could not be verified due to insufficient photographic evidence. Resubmission allowed within 30 days.",
    documents: 1,
    stage: "Claim Rejected",
  },
  {
    id: "CS-2024-F004",
    type: "Flood",
    icon: "Waves",
    location: "Patna, Bihar — Ward 22",
    date: "September 10, 2024",
    status: "approved",
    relief: "₹45,000",
    confidence: 91,
    schemes: ["PMRF", "NDRF"],
    officer: "Rajesh Kumar (BDO)",
    summary: "Ground floor inundated. Furniture and electronics loss verified. Full relief disbursed.",
    documents: 5,
    stage: "Disbursement Complete",
  },
  {
    id: "CS-2024-L005",
    type: "Landslide",
    icon: "Mountain",
    location: "Shimla, Himachal Pradesh — Zone 3",
    date: "July 22, 2024",
    status: "pending",
    relief: "₹80,000 (Estimated)",
    confidence: 78,
    schemes: ["NDRF", "CM Relief Fund"],
    officer: "Anil Verma (BDO)",
    summary: "Retaining wall collapsed. Agricultural land affected. Officer assigned, awaiting final approval.",
    documents: 2,
    stage: "Officer Verification",
  },
  {
    id: "CS-2024-D006",
    type: "Drought",
    icon: "CloudRain",
    location: "Vidarbha, Maharashtra — District HQ",
    date: "June 1, 2024",
    status: "approved",
    relief: "₹25,000",
    confidence: 89,
    schemes: ["PM-KISAN", "SDRF Crop Loss"],
    officer: "Meera Patil (BDO)",
    summary: "3.5 acres of soybean crop failed. Satellite imagery confirmed drought index. Relief disbursed to Jan Dhan account.",
    documents: 4,
    stage: "Disbursement Complete",
  },
];

const iconMap = {
  Waves, Flame, Activity, Wind, Mountain, CloudRain,
};

const STATUS_CONFIG = {
  approved: {
    label: "Approved",
    color: "text-[#22C55E]",
    bg: "bg-[#22C55E]/10",
    border: "border-[#22C55E]/20",
    icon: CheckCircle2,
    dot: "bg-[#22C55E]",
  },
  under_review: {
    label: "Under Review",
    color: "text-[#F59E0B]",
    bg: "bg-[#F59E0B]/10",
    border: "border-[#F59E0B]/20",
    icon: Clock,
    dot: "bg-[#F59E0B]",
  },
  rejected: {
    label: "Rejected",
    color: "text-[#EF4444]",
    bg: "bg-[#EF4444]/10",
    border: "border-[#EF4444]/20",
    icon: XCircle,
    dot: "bg-[#EF4444]",
  },
  pending: {
    label: "Pending",
    color: "text-[#A5A8B5]",
    bg: "bg-white/5",
    border: "border-white/10",
    icon: AlertCircle,
    dot: "bg-[#A5A8B5]",
  },
};

const SUMMARY_STATS = [
  { label: "Total Cases", value: "6", sub: "All time", color: "text-white" },
  { label: "Total Relief", value: "₹2,20,000", sub: "Disbursed", color: "text-[#F4C95D]" },
  { label: "Approval Rate", value: "83%", sub: "3 of 4 verified", color: "text-[#22C55E]" },
  { label: "Pending Review", value: "2", sub: "Active cases", color: "text-[#F59E0B]" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Archive() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = ARCHIVE_RECORDS.filter((r) => {
    const matchesQuery =
      r.id.toLowerCase().includes(query.toLowerCase()) ||
      r.type.toLowerCase().includes(query.toLowerCase()) ||
      r.location.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="space-y-6 pb-20">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#171a21] border border-border flex items-center justify-center">
            <ArchiveIcon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Case Archive</h1>
            <p className="text-sm text-textSecondary">All your submitted disaster relief claims, in one place.</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-[#1a1d24] border border-border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-widest">Live Sync</span>
          </div>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#171a21] border border-border text-sm font-semibold text-textSecondary hover:text-white hover:border-white/10 transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* ── Summary Stats ────────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {SUMMARY_STATS.map((stat) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            className="p-5 rounded-2xl bg-[#171a21] border border-border relative overflow-hidden hover:border-white/10 transition-colors"
          >
            <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">{stat.label}</p>
            <h3 className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</h3>
            <p className="text-[10px] text-textMuted">{stat.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Search + Filter Bar ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input
            type="text"
            placeholder="Search by Case ID, type, or location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#12141d] border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent text-white placeholder:text-textMuted"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "approved", "under_review", "pending", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-[10px] border text-xs font-semibold transition-all ${
                statusFilter === s
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-[#12141d] text-textSecondary hover:border-white/10 hover:text-white"
              }`}
            >
              {s === "all" ? "All" : s === "under_review" ? "Under Review" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Records List ─────────────────────────────────────────── */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-textMuted">
            <ArchiveIcon className="w-10 h-10 opacity-30" />
            <p className="text-sm font-semibold">No records match your search.</p>
          </div>
        ) : (
          filtered.map((record) => {
            const Icon = iconMap[record.icon] || FileText;
            const status = STATUS_CONFIG[record.status];
            const StatusIcon = status.icon;
            const isExpanded = expandedId === record.id;

            return (
              <motion.div
                key={record.id}
                variants={itemVariants}
                layout
                className="rounded-2xl bg-[#171a21] border border-border overflow-hidden hover:border-white/10 transition-colors"
              >
                {/* ── Row Header ── */}
                <button
                  onClick={() => toggleExpand(record.id)}
                  className="w-full flex items-center gap-4 p-4 sm:p-5 text-left"
                >
                  {/* Type Icon */}
                  <div className="w-10 h-10 rounded-xl bg-[#0B0B12] border border-border flex items-center justify-center shrink-0 text-accent">
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-white">{record.type} Disaster</span>
                      <span className="text-[10px] font-mono text-textMuted border border-border px-1.5 py-0.5 rounded">
                        {record.id}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-textSecondary">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {record.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {record.date}
                      </span>
                    </div>
                  </div>

                  {/* Relief Amount */}
                  <div className="hidden sm:block text-right shrink-0">
                    <p className="text-[10px] text-textMuted uppercase tracking-widest mb-0.5">Relief</p>
                    <p className="text-sm font-bold text-accent">{record.relief}</p>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${status.color} ${status.bg} ${status.border} shrink-0`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${status.dot} ${record.status === "under_review" ? "animate-pulse" : ""}`} />
                    {status.label}
                  </div>

                  {/* Expand Chevron */}
                  <ChevronDown
                    className={`w-4 h-4 text-textMuted shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                {/* ── Expanded Detail ── */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-5 border-t border-border/50 space-y-4 pt-4">
                        {/* Summary */}
                        <p className="text-sm text-textSecondary leading-relaxed">{record.summary}</p>

                        {/* Detail Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: "AI Confidence", value: `${record.confidence}%`, color: "text-white" },
                            { label: "Stage", value: record.stage, color: "text-[#F4C95D]" },
                            { label: "Documents", value: `${record.documents} Uploaded`, color: "text-white" },
                            { label: "Assigned Officer", value: record.officer, color: "text-[#22C55E]" },
                          ].map((d) => (
                            <div key={d.label} className="p-3 rounded-xl bg-[#0B0B12] border border-border">
                              <p className="text-[9px] text-textMuted uppercase tracking-widest mb-1">{d.label}</p>
                              <p className={`text-xs font-bold ${d.color}`}>{d.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Schemes */}
                        {record.schemes.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-textMuted font-bold uppercase tracking-widest">Schemes:</span>
                            {record.schemes.map((s) => (
                              <span
                                key={s}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-accent/20 bg-accent/10 text-accent"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Status (mobile) + Actions */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2 border-t border-border/50">
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold sm:hidden ${status.color} ${status.bg} ${status.border}`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </div>

                          <div className="ml-auto flex items-center gap-2">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-transparent text-xs font-semibold text-textSecondary hover:text-white hover:border-white/10 transition-all">
                              <Eye className="w-3.5 h-3.5" />
                              View Report
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-transparent text-xs font-semibold text-textSecondary hover:text-white hover:border-white/10 transition-all">
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </button>
                            {record.status === "rejected" && (
                              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-[#0B0B12] text-xs font-bold hover:bg-accentHover transition-all active:scale-95">
                                Resubmit Claim
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="flex justify-between items-center pt-8 border-t border-border/50 text-xs text-textSecondary">
        <span>Showing {filtered.length} of {ARCHIVE_RECORDS.length} records</span>
        <span>© 2025 CivicSync AI. Secure Governance Systems.</span>
      </div>
    </div>
  );
}
