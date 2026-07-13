import { motion } from "framer-motion";
import { GitCompare, FileText, CheckCircle2, ShieldAlert, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getBills, compareBills } from "../../services/billService";
import { SkeletonList } from "../../components/ui/Skeleton";

export default function CompareBills() {
  const [searchParams] = useSearchParams();
  const [bills, setBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [selectedBill1, setSelectedBill1] = useState("");
  const [selectedBill2, setSelectedBill2] = useState("");
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState("");

  // Fetch available bills
  useEffect(() => {
    const fetchBills = async () => {
      try {
        const result = await getBills({ limit: 100 });
        setBills(result.bills || []);
        
        // Pre-select bill from URL params if provided
        const billFromUrl = searchParams.get("bill");
        if (billFromUrl && result.bills.length > 0) {
          setSelectedBill1(billFromUrl);
        } else if (result.bills.length > 0) {
          setSelectedBill1(result.bills[0]._id);
        }
        
        if (result.bills.length > 1) {
          setSelectedBill2(result.bills[1]._id);
        }
      } catch (err) {
        console.error("[CompareBills] Failed to fetch bills:", err);
        setError("Failed to load bills. Please try again.");
      } finally {
        setLoadingBills(false);
      }
    };

    fetchBills();
  }, [searchParams]);

  const handleCompare = async () => {
    if (!selectedBill1 || !selectedBill2) {
      setError("Please select two bills to compare.");
      return;
    }

    if (selectedBill1 === selectedBill2) {
      setError("Please select two different bills.");
      return;
    }

    setComparing(true);
    setError("");
    setComparison(null);

    try {
      const result = await compareBills([selectedBill1, selectedBill2]);
      setComparison(result.comparison);
    } catch (err) {
      console.error("[CompareBills] Compare failed:", err);
      setError(err.message || "Comparison failed. Please try again.");
    } finally {
      setComparing(false);
    }
  };

  const bill1 = comparison?.bills?.[0];
  const bill2 = comparison?.bills?.[1];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Compare Bills</h1>
          <p className="text-sm text-textSecondary">Analyze differences and similarities between two bills using AI.</p>
        </div>
        
        <button 
          onClick={handleCompare}
          disabled={comparing || loadingBills || !selectedBill1 || !selectedBill2}
          className="px-5 py-2.5 rounded-lg bg-accent text-[#0a0a0f] text-sm font-bold hover:bg-accentHover shadow-glow-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {comparing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> 
              Comparing...
            </>
          ) : (
            <>
              <GitCompare className="w-4 h-4" />
              Run AI Comparison
            </>
          )}
        </button>
      </div>

      {/* Bill Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-textSecondary uppercase tracking-widest font-semibold block mb-2">
            First Bill
          </label>
          <select 
            className="w-full bg-[#12141d] border border-border rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-accent"
            value={selectedBill1}
            onChange={(e) => setSelectedBill1(e.target.value)}
            disabled={loadingBills}
          >
            <option value="">Select a bill...</option>
            {bills.map(b => (
              <option key={b._id} value={b._id}>
                {b.title} ({b.billNumber})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-textSecondary uppercase tracking-widest font-semibold block mb-2">
            Second Bill
          </label>
          <select 
            className="w-full bg-[#12141d] border border-border rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-accent"
            value={selectedBill2}
            onChange={(e) => setSelectedBill2(e.target.value)}
            disabled={loadingBills}
          >
            <option value="">Select a bill...</option>
            {bills.map(b => (
              <option key={b._id} value={b._id}>
                {b.title} ({b.billNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-danger/5 border border-danger/20 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </motion.div>
      )}

      {/* Loading State */}
      {comparing && (
        <div className="flex items-center justify-center p-10">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-3" />
            <p className="text-sm text-textSecondary">AI is analyzing the bills...</p>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {comparison && !comparing && (
        <>
          {/* Bill Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bill 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="p-6 rounded-3xl bg-[#171a21] border border-border flex flex-col"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base truncate">{bill1?.title || "Bill 1"}</h3>
                  <p className="text-xs text-textSecondary">{bill1?.billNumber || "N/A"}</p>
                </div>
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-2">Summary</p>
                  <p className="text-sm text-textSecondary leading-relaxed line-clamp-4">
                    {bill1?.summary || "No summary available."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div>
                    <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">Status</p>
                    <p className="text-sm text-white capitalize">{bill1?.status?.replace('_', ' ') || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">Impact</p>
                    <p className="text-sm text-accent font-bold">{bill1?.impactScore || 0}%</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bill 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 }}
              className="p-6 rounded-3xl bg-[#1a1c23] border border-accent/20 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base truncate">{bill2?.title || "Bill 2"}</h3>
                  <p className="text-xs text-accent">{bill2?.billNumber || "N/A"}</p>
                </div>
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-2">Summary</p>
                  <p className="text-sm text-textSecondary leading-relaxed line-clamp-4">
                    {bill2?.summary || "No summary available."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div>
                    <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">Status</p>
                    <p className="text-sm text-white capitalize">{bill2?.status?.replace('_', ' ') || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-1">Impact</p>
                    <p className="text-sm text-accent font-bold">{bill2?.impactScore || 0}%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Similarities & Differences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Similarities */}
            {comparison.similarities && comparison.similarities.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2 }}
                className="p-6 rounded-3xl bg-[#171a21] border border-success/20"
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <h3 className="font-bold text-white">Similarities</h3>
                </div>
                <ul className="space-y-2">
                  {comparison.similarities.map((item, i) => (
                    <li key={i} className="text-sm text-textSecondary flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span className="flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Differences */}
            {comparison.differences && comparison.differences.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.3 }}
                className="p-6 rounded-3xl bg-[#171a21] border border-accent/20"
              >
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-white">Key Differences</h3>
                </div>
                <ul className="space-y-2">
                  {comparison.differences.map((item, i) => (
                    <li key={i} className="text-sm text-textSecondary flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span className="flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {!comparison && !comparing && !error && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="p-10 rounded-3xl bg-[#171a21] border border-border border-dashed text-center"
        >
          <GitCompare className="w-12 h-12 text-textSecondary mx-auto mb-4" />
          <p className="text-textSecondary mb-2">Select two bills above and click "Run AI Comparison"</p>
          <p className="text-xs text-textMuted">Our AI will analyze the bills and highlight their similarities and differences.</p>
        </motion.div>
      )}
    </div>
  );
}
