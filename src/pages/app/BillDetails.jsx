import { motion } from "framer-motion";
import { FileText, ArrowLeft, Calendar, Hash, Shield, TrendingUp, Download, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBillById } from "../../services/billService";
import clsx from "clsx";

const STATUS_CONFIG = {
  passed: { label: "Passed", color: "text-success", bg: "bg-success/10 border-success/20" },
  pending: { label: "Pending", color: "text-accent", bg: "bg-accent/10 border-accent/20" },
  under_review: { label: "Under Review", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  rejected: { label: "Rejected", color: "text-danger", bg: "bg-danger/10 border-danger/20" },
};

export default function BillDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBillDetails = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      
      try {
        const result = await getBillById(id);
        setBill(result.bill);
      } catch (err) {
        console.error("[BillDetails] Failed to fetch bill:", err);
        setError(err.message || "Failed to load bill details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBillDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="max-w-4xl mx-auto pb-20">
        <button
          onClick={() => navigate("/dashboard/bills")}
          className="flex items-center gap-2 text-textSecondary hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bill History
        </button>
        <div className="p-10 rounded-3xl bg-danger/5 border border-danger/20 text-center">
          <p className="text-danger mb-4">{error || "Bill not found"}</p>
          <button
            onClick={() => navigate("/dashboard/bills")}
            className="px-6 py-2.5 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger font-bold transition-colors"
          >
            Return to Bill History
          </button>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[bill.status] || STATUS_CONFIG.pending;

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/bills")}
        className="flex items-center gap-2 text-textSecondary hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Bill History
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl bg-[#171a21] border border-border"
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-7 h-7 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{bill.title}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1.5 text-sm text-textSecondary">
                    <Hash className="w-3 h-3" />
                    {bill.billNumber}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-textSecondary">
                    <Calendar className="w-3 h-3" />
                    {new Date(bill.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <span className={clsx("text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0", status.color, status.bg)}>
                {status.label}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Impact Score & Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="p-5 rounded-2xl bg-[#171a21] border border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold">Impact Score</p>
          </div>
          <p className="text-4xl font-bold text-accent">{bill.impactScore || 0}%</p>
        </div>
        <div className="md:col-span-2 p-5 rounded-2xl bg-[#171a21] border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-accent" />
            <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold">Citizen Impact</p>
          </div>
          <p className="text-sm text-white leading-relaxed">{bill.userImpact || "No citizen impact analysis available."}</p>
        </div>
      </motion.div>

      {/* AI Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-3xl bg-[#171a21] border border-border"
      >
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          AI-Generated Summary
        </h3>
        <p className="text-textSecondary leading-relaxed">{bill.summary || "No summary available."}</p>
      </motion.div>

      {/* Key Points */}
      {bill.keyPoints && bill.keyPoints.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-3xl bg-[#171a21] border border-border"
        >
          <h3 className="font-bold text-white mb-4">Key Points</h3>
          <ul className="space-y-3">
            {bill.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-textSecondary">
                <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Tags */}
      {bill.tags && bill.tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-3xl bg-[#171a21] border border-border"
        >
          <h3 className="font-bold text-white mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {bill.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-lg bg-[#12141d] border border-border text-xs text-textSecondary font-semibold hover:border-accent/50 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-3xl bg-[#171a21] border border-border"
      >
        <h3 className="font-bold text-white mb-4">Document Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">Document ID</p>
            <p className="text-sm text-white font-mono">{bill._id}</p>
          </div>
          <div>
            <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">Upload Date</p>
            <p className="text-sm text-white">{new Date(bill.uploadedAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">Bill Number</p>
            <p className="text-sm text-white">{bill.billNumber}</p>
          </div>
          <div>
            <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">Status</p>
            <span className={clsx("text-xs font-semibold px-2.5 py-1 rounded-full border inline-block", status.color, status.bg)}>
              {status.label}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex gap-3"
      >
        <button
          onClick={() => navigate(`/dashboard/compare?bill=${bill._id}`)}
          className="flex-1 px-6 py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent font-bold hover:bg-accent/20 transition-colors"
        >
          Compare with Other Bills
        </button>
        <button
          onClick={() => navigate("/dashboard/bills")}
          className="px-6 py-3 rounded-xl bg-[#2a2e3d] text-white font-bold hover:bg-[#323749] transition-colors"
        >
          Back to History
        </button>
      </motion.div>
    </div>
  );
}
