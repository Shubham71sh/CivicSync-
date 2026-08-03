import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, CheckCircle2, Loader2, X, AlertTriangle,
  TrendingDown, IndianRupee, ShieldAlert, Lightbulb, Clock,
  ChevronDown, ChevronUp, BarChart3, ArrowLeft, RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { analyzeLoanDocument, getLoanAnalyses } from "../../services/loanAnalyzerService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  "Low":       { color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/30",  bar: "bg-green-400"  },
  "Medium":    { color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", bar: "bg-yellow-400" },
  "High":      { color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", bar: "bg-orange-400" },
  "Very High": { color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/30",    bar: "bg-red-400"    },
};

function RiskGauge({ score, level }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG["Medium"];
  return (
    <div className={clsx("p-5 rounded-2xl border", cfg.bg, cfg.border)}>
      <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mb-3">Risk Score</p>
      <div className="flex items-end gap-3 mb-3">
        <span className={clsx("text-5xl font-black", cfg.color)}>{score}</span>
        <span className={clsx("text-sm font-bold mb-1", cfg.color)}>/ 100</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={clsx("h-full rounded-full", cfg.bar)}
        />
      </div>
      <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full border", cfg.color, cfg.bg, cfg.border)}>
        {level} Risk
      </span>
    </div>
  );
}

function InfoCard({ label, value, icon: Icon, accent = false }) {
  return (
    <div className={clsx(
      "p-4 rounded-xl border",
      accent ? "bg-accent/10 border-accent/30" : "bg-[#1e222e] border-border"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={clsx("w-4 h-4", accent ? "text-accent" : "text-textSecondary")} />
        <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">{label}</p>
      </div>
      <p className={clsx("font-bold text-sm", accent ? "text-accent" : "text-white")}>{value || "—"}</p>
    </div>
  );
}

function ListSection({ title, items = [], icon: Icon, colorClass = "text-textSecondary", emptyText = "None identified." }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="p-5 rounded-2xl bg-[#171a21] border border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <div className="flex items-center gap-2">
          <Icon className={clsx("w-4 h-4", colorClass)} />
          <h4 className="font-bold text-white text-sm">{title}</h4>
          {items.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-[10px] text-textSecondary font-bold">{items.length}</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-textSecondary" /> : <ChevronDown className="w-4 h-4 text-textSecondary" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {items.length === 0
              ? <li className="text-sm text-textSecondary">{emptyText}</li>
              : items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-textSecondary">
                  <span className={clsx("mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0", colorClass.replace("text-", "bg-"))} />
                  {item}
                </li>
              ))
            }
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function HistoryCard({ analysis, onClick }) {
  const cfg = RISK_CONFIG[analysis.riskLevel] || RISK_CONFIG["Medium"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="p-4 rounded-2xl bg-[#171a21] border border-border hover:border-white/10 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{analysis.fileName}</p>
          <p className="text-xs text-textSecondary mt-0.5">{analysis.lenderName || "—"} · {analysis.loanType || "Loan"}</p>
        </div>
        <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0", cfg.color, cfg.bg, cfg.border)}>
          {analysis.riskLevel || "—"}
        </span>
      </div>
      <div className="flex items-center gap-4 mt-3">
        <span className="text-xs text-textSecondary">Principal: <span className="text-white font-semibold">{analysis.principalAmount || "—"}</span></span>
        <span className="text-xs text-textSecondary">Rate: <span className="text-white font-semibold">{analysis.interestRate || "—"}</span></span>
        <span className={clsx("text-xs font-bold ml-auto", cfg.color)}>{analysis.riskScore}/100</span>
      </div>
    </motion.div>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({ onFileSelect, uploading }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) { setFile(f); }
  }, []);

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleAnalyze = () => {
    if (file && !uploading) onFileSelect(file);
  };

  const reset = (e) => { e.stopPropagation(); setFile(null); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "relative p-10 rounded-3xl border-2 border-dashed transition-all duration-300 text-center",
        dragging ? "border-accent bg-accent/5 scale-[1.01]" : "border-border bg-[#12141d] hover:border-textSecondary",
        file && !uploading && "border-yellow-400/40 bg-[#171a21]"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {!uploading && (
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      )}
      <AnimatePresence mode="wait">
        {uploading ? (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
              <div className="absolute inset-3 rounded-full bg-accent/10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
              </div>
            </div>
            <div>
              <p className="font-bold text-white text-sm">AI Analyzing Document…</p>
              <p className="text-xs text-textSecondary mt-1">Extracting terms, clauses & risk factors</p>
            </div>
            <div className="flex gap-1 mt-2">
              {["Extracting text", "Parsing clauses", "Computing risk", "Generating insights"].map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity }}
                  className="px-2 py-1 rounded-md bg-white/5 text-[10px] text-textSecondary">{step}</motion.div>
              ))}
            </div>
          </motion.div>
        ) : !file ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 flex items-center justify-center mx-auto mb-4">
              <IndianRupee className="w-7 h-7 text-yellow-400" />
            </div>
            <h3 className="text-lg font-bold mb-1">Upload Loan Document</h3>
            <p className="text-sm text-textSecondary mb-5">Drop your loan agreement, sanction letter, or EMI schedule</p>
            <button className="px-6 py-2.5 rounded-lg bg-[#2a2e3d] text-white text-sm font-semibold pointer-events-none">
              Browse Files
            </button>
            <p className="text-xs text-textSecondary mt-4">PDF · DOC · DOCX · TXT · up to 50 MB</p>
          </motion.div>
        ) : (
          <motion.div key="file" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 flex items-center justify-center">
              <FileText className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <p className="font-bold text-white text-sm truncate max-w-[240px]">{file.name}</p>
              <p className="text-xs text-textSecondary mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB · Ready for AI</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAnalyze}
                className="px-7 py-2.5 rounded-xl bg-yellow-400 text-[#0a0a0f] font-bold text-sm hover:bg-yellow-300 transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)] flex items-center gap-2 active:scale-95 relative z-10"
              >
                <BarChart3 className="w-4 h-4" />
                Analyze Loan
              </button>
              <button
                onClick={reset}
                className="w-10 h-10 rounded-xl bg-[#2a2e3d] text-textSecondary hover:text-white flex items-center justify-center transition-colors relative z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Analysis Result ──────────────────────────────────────────────────────────

function AnalysisResult({ data, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Analysis Complete</span>
          </div>
          <h2 className="text-xl font-bold text-white">{data.loanType || "Loan"} Analysis</h2>
          <p className="text-sm text-textSecondary">{data.lenderName || "Unknown Lender"}</p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2a2e3d] text-textSecondary hover:text-white text-sm font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          New Analysis
        </button>
      </div>

      {/* Risk + Key Numbers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RiskGauge score={data.riskScore || 0} level={data.riskLevel || "Medium"} />
        <div className="space-y-3">
          <InfoCard label="Principal Amount" value={data.principalAmount} icon={IndianRupee} accent />
          <InfoCard label="Interest Rate" value={data.interestRate} icon={TrendingDown} />
        </div>
        <div className="space-y-3">
          <InfoCard label="Monthly EMI" value={data.emiAmount} icon={Clock} accent />
          <InfoCard label="Total Payable" value={data.totalPayable} icon={BarChart3} />
        </div>
      </div>

      {/* More Info Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoCard label="Tenure" value={data.tenureMonths ? `${data.tenureMonths} months` : data.policyNumber} icon={Clock} />
        <InfoCard label="Processing Fee" value={data.processingFee} icon={IndianRupee} />
        <InfoCard label="Prepayment Penalty" value={data.prepaymentPenalty} icon={ShieldAlert} />
        <InfoCard label="Late Penalty" value={data.latePenalty} icon={AlertTriangle} />
      </div>

      {/* Risk Reason */}
      {data.riskReason && (
        <div className="p-4 rounded-2xl bg-[#1e222e] border border-border">
          <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mb-2">Risk Assessment</p>
          <p className="text-sm text-textSecondary leading-relaxed">{data.riskReason}</p>
        </div>
      )}

      {/* EMI Schedule Sample */}
      {data.emiScheduleSample?.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#171a21] border border-border">
          <h4 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            EMI Schedule (First 3 Months)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-textSecondary uppercase tracking-widest border-b border-border">
                  <th className="text-left pb-2 font-bold">Month</th>
                  <th className="text-right pb-2 font-bold">Principal</th>
                  <th className="text-right pb-2 font-bold">Interest</th>
                  <th className="text-right pb-2 font-bold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.emiScheduleSample.map((row, i) => (
                  <tr key={i} className="text-textSecondary hover:text-white transition-colors">
                    <td className="py-2">{row.month}</td>
                    <td className="py-2 text-right text-green-400">{row.principal}</td>
                    <td className="py-2 text-right text-red-400">{row.interest}</td>
                    <td className="py-2 text-right">{row.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ListSection title="Hidden Charges" items={data.hiddenCharges || []} icon={AlertTriangle} colorClass="text-orange-400" emptyText="No hidden charges detected." />
        <ListSection title="Red Flags" items={data.redFlags || []} icon={ShieldAlert} colorClass="text-red-400" emptyText="No red flags detected." />
        <ListSection title="Key Terms" items={data.keyTerms || []} icon={FileText} colorClass="text-blue-400" emptyText="No key terms listed." />
        <ListSection title="AI Recommendations" items={data.recommendations || []} icon={Lightbulb} colorClass="text-yellow-400" emptyText="No recommendations." />
      </div>

      {/* Summary */}
      {data.overallSummary && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-400/5 to-transparent border border-yellow-400/20">
          <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            Overall AI Summary
          </h4>
          <p className="text-sm text-textSecondary leading-relaxed">{data.overallSummary}</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LoanAnalyzer() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    getLoanAnalyses()
      .then((res) => setHistory(res.analyses || []))
      .catch((e) => console.error("[LoanAnalyzer] history fetch failed:", e))
      .finally(() => setHistoryLoading(false));
  }, []);

  const handleFileSelect = async (file) => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await analyzeLoanDocument(formData);
      setAnalysis(res.analysis);
      setHistory((prev) => [res.analysis, ...prev]);
    } catch (err) {
      console.error("[LoanAnalyzer] analyze error:", err);
      setError(err?.response?.data?.detail || err.message || "Analysis failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setError("");
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <IndianRupee className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Loan Analyzer</h1>
            <p className="text-sm text-textSecondary">Upload any loan document for instant AI-powered risk analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e222e] border border-border text-textSecondary hover:text-white text-sm font-semibold transition-colors"
          >
            <Clock className="w-4 h-4" />
            History {history.length > 0 && `(${history.length})`}
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

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-red-400/10 border border-red-400/30 text-red-400"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
            <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-2xl bg-[#171a21] border border-border space-y-3">
              <h3 className="font-bold text-white text-sm">Past Loan Analyses</h3>
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-[#2a2e3d] animate-pulse" />)}
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-textSecondary">No past analyses yet.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((a, i) => (
                    <HistoryCard key={a.id || i} analysis={a} onClick={() => { setAnalysis(a); setShowHistory(false); }} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {analysis ? (
        <AnalysisResult data={analysis} onReset={reset} />
      ) : (
        <UploadZone onFileSelect={handleFileSelect} uploading={uploading} />
      )}

      {/* How it works */}
      {!analysis && !uploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            { icon: Upload, label: "Upload", desc: "Drop your loan agreement or sanction letter" },
            { icon: BarChart3, label: "AI Analysis", desc: "Gemini AI extracts clauses and computes risk" },
            { icon: Lightbulb, label: "Insights", desc: "Get personalised recommendations to protect yourself" },
          ].map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="p-4 rounded-xl bg-[#12141d] border border-border text-center">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="font-bold text-white text-sm mb-1">{step.label}</p>
                <p className="text-xs text-textSecondary">{step.desc}</p>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
