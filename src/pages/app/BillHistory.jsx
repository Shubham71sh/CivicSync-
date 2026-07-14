import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Upload, Search, Filter, Trash2, Eye, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import clsx from "clsx";
import { getBills, deleteBill } from "../../services/billService";
import { SkeletonList } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";

const STATUS_CONFIG = {
  passed: { label: "Passed", color: "text-success", bg: "bg-success/10 border-success/20" },
  pending: { label: "Pending", color: "text-accent", bg: "bg-accent/10 border-accent/20" },
  under_review: { label: "Under Review", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  rejected: { label: "Rejected", color: "text-danger", bg: "bg-danger/10 border-danger/20" },
};

export default function BillHistory() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Fetch bills with current filters
  const fetchBills = async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const filters = {
        page: 1,
        limit: 10,
        search: search || undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        ...params
      };
      
      const result = await getBills(filters);
      setBills(result.bills || []);
      setPagination({
        page: result.page || 1,
        pages: result.pages || 1,
        total: result.total || 0
      });
    } catch (err) {
      console.error("[BillHistory] Failed to fetch bills:", err);
      setError(err.message || "Failed to load bills. Please try again.");
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  // Backend: GET /api/bills
  useEffect(() => {
    fetchBills();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (!loading) fetchBills();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [search, filterStatus]);

  // Handle bill deletion
  const handleDeleteBill = async (billId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this bill?")) return;

    try {
      await deleteBill(billId);
      // Refresh the bills list
      fetchBills();
    } catch (err) {
      console.error("[BillHistory] Delete failed:", err);
      setError(err.message || "Failed to delete bill. Please try again.");
    }
  };

  // Handle viewing bill details
  const handleViewBill = (billId) => {
    navigate(`/dashboard/bills/${billId}`);
  };

  const filtered = bills;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Bill History</h1>
          <p className="text-sm text-textSecondary">All bills you've analyzed through CivicSync AI.</p>
        </div>
        <button
          onClick={() => navigate("/dashboard/upload")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-[#0a0a0f] font-bold text-sm hover:bg-accentHover transition-colors shadow-glow-accent"
        >
          <Upload className="w-4 h-4" />
          Upload New Bill
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input
            type="text"
            placeholder="Search by title or bill number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#12141d] border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#12141d] border border-border rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-accent"
        >
          <option value="all">All Statuses</option>
          <option value="passed">Passed</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonList rows={4} />
      ) : error ? (
        <div className="text-center p-6 text-danger bg-danger/5 border border-danger/20 rounded-2xl">
          <p className="mb-2">{error}</p>
          <button 
            onClick={() => fetchBills()} 
            className="px-4 py-2 text-sm bg-danger/10 hover:bg-danger/20 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search || filterStatus !== "all" ? "No bills match your filter" : "No bills yet"}
          description={search || filterStatus !== "all" ? "Try adjusting your search or filter." : "Upload your first bill to get started with AI analysis."}
          action={
            !search && filterStatus === "all" && (
              <button
                onClick={() => navigate("/dashboard/upload")}
                className="px-6 py-2.5 rounded-xl bg-accent text-[#0a0a0f] font-bold text-sm hover:bg-accentHover transition-colors shadow-glow-accent"
              >
                Upload First Bill
              </button>
            )
          }
        />
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
          {filtered.map((bill) => {
            const status = STATUS_CONFIG[bill.status] || STATUS_CONFIG.pending;
            return (
              <motion.div
                key={bill._id}
                variants={itemVariants}
                className="p-5 rounded-2xl bg-[#171a21] border border-border hover:border-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-white text-sm truncate">{bill.title}</h3>
                        <p className="text-xs text-textSecondary mt-0.5">{bill.billNumber}</p>
                      </div>
                      <span className={clsx("text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0", status.color, status.bg)}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-textSecondary leading-relaxed mb-3 line-clamp-2">{bill.summary}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-xs text-textSecondary">
                          <Clock className="w-3 h-3" />
                          {new Date(bill.uploadedAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs font-semibold text-accent">Impact: {bill.impactScore}%</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleViewBill(bill._id)}
                          className="p-1.5 rounded-lg hover:bg-[#2a2e3d] text-textSecondary hover:text-white transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteBill(bill._id, e)}
                          className="p-1.5 rounded-lg hover:bg-danger/10 text-textSecondary hover:text-danger transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
