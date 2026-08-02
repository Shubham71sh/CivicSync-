import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, CheckCircle2, Loader2, X, AlertTriangle,
  ShieldCheck, ShieldAlert, Star, Lightbulb, Clock, ChevronDown,
  ChevronUp, Heart, ArrowLeft, RefreshCw, Ban, CheckCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { analyzeInsurancePolicy, getInsuranceAnalyses } from "../../services/insuranceAnalyzerService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const POLICY_TYPE_COLORS = {
  Health:  { bg: "bg-red-400/10",    border: "border-red-400/30",    text: "text-red-400",    icon: Heart },
  Life:    { bg: "bg-purple-400/10", border: "border-purple-400/30", text: "text-purple-400", icon: ShieldCheck },
  Motor:   { bg: "bg-blue-400/10",   border: "border-blue-400/30",   text: "text-blue-400",   icon: ShieldCheck },
  Home:    { bg: "bg-green-400/10",  border: "border-green-400/30",  text: "text-green-400",  icon: ShieldCheck },
  Travel:  { bg: "bg-cyan-400/10",   border: "border-cyan-400/30",   text: "text-cyan-400",   icon: ShieldCheck },
  Term:    { bg: "bg-indigo-400/10", border: "border-indigo-400/30", text: "text-indigo-400", icon: ShieldCheck },
  Other:   { bg: "bg-white/5",       border: "border-white/10",      text: "text-textSecondary", icon: ShieldCheck },
};

function getPolicyCfg(type) {
  return POLICY_TYPE_COLORS[type] || POLICY_TYPE_COLORS["Other"];
}

function RatingBadge({ rating }) {
  const pct = (rating / 10) * 100;
  const color = rating >= 8 ? "text-green-400" : rating >= 5 ? "text-yellow-400" : "text-red-400";
  const barColor = rating >= 8 ? "bg-green-400" : rating >= 5 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="p-5 rounded-2xl bg-[#1e222e] border border-border">
      <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mb-3">Policy Rating</p>
      <div className="flex items-end gap-2 mb-3">
        <span className={clsx("text-5xl font-black", color)}>{rating}</span>
        <span className={clsx("text-sm font-bold mb-1", color)}>/ 10</span>
      </div>
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.06 }}
            className={clsx("h-4 flex-1 rounded-sm origin-bottom", i < rating ? barColor : "bg-white/5")}
          />
        ))}
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={clsx("w-3 h-3", i < Math.round(rating / 2) ? "text-yellow-400 fill-yellow-400" : "text-white/10")} />
        ))}
        <span className="text-xs text-textSecondary ml-1">{rating >= 8 ? "Excellent" : rating >= 5 ? "Good" : "Poor"} Policy</span>
      </div>
    </div>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="p-3 rounded-xl bg-[#1e222e] border border-border">
      <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-1">{label}</p>
      <p className="font-bold text-white text-sm">{value || "—"}</p>
    </div>
  );
}

function CoverageList({ title, items = [], covered = true }) {
  return (
    <div className={clsx(
      "p-5 rounded-2xl border",
      covered ? "bg-green-400/5 border-green-400/20" : "bg-red-400/5 border-red-400/20"
    )}>
      <div className="flex items-center gap-2 mb-4">
        {covered
          ? <CheckCheck className="w-4 h-4 text-green-400" />
          : <Ban className="w-4 h-4 text-red-400" />
        }
        <h4 className={clsx("font-bold text-sm", covered ? "text-green-400" : "text-red-400")}>{title}</h4>
        <span className="ml-auto text-xs font-bold text-textSecondary">{items.length}</span>
      </div>
      {items.length === 0
        ? <p className="text-sm text-textSecondary">None listed.</p>
        : <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-textSecondary">
                <span className={clsx("mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0", covered ? "bg-green-400" : "bg-red-400")} />
                {item}
              </li>
            ))}
          </ul>
      }
    </div>
  );
}

function CollapsibleList({ title, items = [], icon: Icon, colorClass, emptyText }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="p-5 rounded-2xl bg-[#171a21] border border-border">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={clsx("w-4 h-4", colorClass)} />
          <h4 className="font-bold text-white text-sm">{title}</h4>
          {items.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-[10px] text-textSecondary font-bold">{items.length}</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-textSecondary" /> : <ChevronDown className="w-4 h-4 text-textSecondary" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden">
            {items.length === 0
              ? <li className="text-sm text-textSecondary">{emptyText || "None identified."}</li>
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
  const cfg = getPolicyCfg(analysis.policyType);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="p-4 rounded-2xl bg-[#171a21] border border-border hover:border-white/10 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{analysis.fileName}</p>
          <p className="text-xs text-textSecondary mt-0.5">{analysis.insurer || "—"} · {analysis.policyType || "Policy"}</p>
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={clsx("w-3 h-3", i < Math.round((analysis.overallRating || 0) / 2) ? "text-yellow-400 fill-yellow-400" : "text-white/10")} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3">
        <span className="text-xs text-textSecondary">Sum: <span className="text-white font-semibold">{analysis.sumInsured || "—"}</span></span>
        <span className="text-xs text-textSecondary">Premium: <span className="text-white font-semibold">{analysis.premiumAmount || "—"}</span></span>
        <span className="text-xs font-bold ml-auto text-yellow-400">{analysis.overallRating}/10</span>
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
    if (f) setFile(f);
  }, []);

  const handleChange = (e) => { const f = e.target.files?.[0]; if (f) setFile(f); };
  const handleAnalyze = () => { if (file && !uploading) onFileSelect(file); };
  const reset = (e) => { e.stopPropagation(); setFile(null); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "relative p-10 rounded-3xl border-2 border-dashed transition-all duration-300 text-center",
        dragging ? "border-accent bg-accent/5 scale-[1.01]" : "border-border bg-[#12141d] hover:border-textSecondary",
        file && !uploading && "border-red-400/40 bg-[#171a21]"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {!uploading && (
        <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      )}
      <AnimatePresence mode="wait">
        {uploading ? (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-red-400/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-400 animate-spin" />
              <div className="absolute inset-3 rounded-full bg-red-400/10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
              </div>
            </div>
            <div>
              <p className="font-bold text-white text-sm">AI Reading Policy…</p>
              <p className="text-xs text-textSecondary mt-1">Identifying coverages, exclusions & red flags</p>
            </div>
            <div className="flex gap-1 flex-wrap justify-center mt-2">
              {["Reading clauses", "Finding exclusions", "Checking red flags", "Rating policy"].map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity }}
                  className="px-2 py-1 rounded-md bg-white/5 text-[10px] text-textSecondary">{step}</motion.div>
              ))}
            </div>
          </motion.div>
        ) : !file ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="w-14 h-14 rounded-2xl bg-red-400/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-lg font-bold mb-1">Upload Insurance Policy</h3>
            <p className="text-sm text-textSecondary mb-5">Drop your policy document, schedule, or renewal notice</p>
            <button className="px-6 py-2.5 rounded-lg bg-[#2a2e3d] text-white text-sm font-semibold pointer-events-none">Browse Files</button>
            <p className="text-xs text-textSecondary mt-4">PDF · DOC · DOCX · TXT · up to 50 MB</p>
          </motion.div>
        ) : (
          <motion.div key="file" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-400/10 flex items-center justify-center">
              <FileText className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <p className="font-bold text-white text-sm truncate max-w-[240px]">{file.name}</p>
              <p className="text-xs text-textSecondary mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB · Ready for AI</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAnalyze}
                className="px-7 py-2.5 rounded-xl bg-red-400 text-white font-bold text-sm hover:bg-red-300 transition-all flex items-center gap-2 active:scale-95 relative z-10">
                <ShieldCheck className="w-4 h-4" />
                Analyze Policy
              </button>
              <button onClick={reset}
                className="w-10 h-10 rounded-xl bg-[#2a2e3d] text-textSecondary hover:text-white flex items-center justify-center transition-colors relative z-10">
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
  const cfg = getPolicyCfg(data.policyType);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Analysis Complete</span>
            <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full border ml-2", cfg.text, cfg.bg, cfg.border)}>
              {data.policyType || "Policy"}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">{data.insurer || "Unknown Insurer"}</h2>
          <p className="text-sm text-textSecondary">Policy: {data.policyNumber || "—"} · Holder: {data.policyHolderName || "—"}</p>
        </div>
        <button onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2a2e3d] text-textSecondary hover:text-white text-sm font-semibold transition-colors">
          <RefreshCw className="w-4 h-4" />
          New Analysis
        </button>
      </div>

      {/* Rating + Key Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RatingBadge rating={data.overallRating || 0} />
        <div className="space-y-3">
          <InfoPill label="Sum Insured" value={data.sumInsured} />
          <InfoPill label="Premium" value={`${data.premiumAmount || "—"} (${data.premiumFrequency || "—"})`} />
        </div>
        <div className="space-y-3">
          <InfoPill label="Policy Term" value={data.policyTerm} />
          <InfoPill label="Grace Period" value={data.gracePeriod} />
        </div>
      </div>

      {/* More Details */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoPill label="Start Date" value={data.startDate} />
        <InfoPill label="Expiry Date" value={data.expiryDate} />
        <InfoPill label="Renewal Terms" value={data.renewalTerms} />
        <InfoPill label="Tax Benefit" value={data.taxBenefit} />
      </div>

      {/* Rating Reason */}
      {data.ratingReason && (
        <div className="p-4 rounded-2xl bg-[#1e222e] border border-border">
          <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mb-2">AI Rating Rationale</p>
          <p className="text-sm text-textSecondary leading-relaxed">{data.ratingReason}</p>
        </div>
      )}

      {/* Coverages vs Exclusions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CoverageList title="Covered ✓" items={data.coverages || []} covered={true} />
        <CoverageList title="Excluded ✗" items={data.exclusions || []} covered={false} />
      </div>

      {/* Other Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CollapsibleList title="Waiting Periods" items={data.waitingPeriods || []} icon={Clock} colorClass="text-orange-400" emptyText="No waiting periods listed." />
        <CollapsibleList title="Key Benefits" items={data.keyBenefits || []} icon={ShieldCheck} colorClass="text-green-400" emptyText="No key benefits listed." />
        <CollapsibleList title="Claim Process" items={data.claimProcess || []} icon={FileText} colorClass="text-blue-400" emptyText="No claim process listed." />
        <CollapsibleList title="Red Flags" items={data.redFlags || []} icon={ShieldAlert} colorClass="text-red-400" emptyText="No red flags detected." />
      </div>

      {/* Network Hospitals */}
      {data.networkHospitals && (
        <div className="p-4 rounded-xl bg-[#1e222e] border border-border flex items-center gap-3">
          <Heart className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-textSecondary uppercase tracking-widest">Network Hospitals</p>
            <p className="text-sm text-white font-semibold mt-0.5">{data.networkHospitals}</p>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <CollapsibleList title="AI Recommendations" items={data.recommendations || []} icon={Lightbulb} colorClass="text-yellow-400" emptyText="No recommendations." />

      {/* Overall Summary */}
      {data.overallSummary && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-red-400/5 to-transparent border border-red-400/20">
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

export default function InsuranceAnalyzer() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    getInsuranceAnalyses()
      .then((res) => setHistory(res.analyses || []))
      .catch((e) => console.error("[InsuranceAnalyzer] history fetch failed:", e))
      .finally(() => setHistoryLoading(false));
  }, []);

  const handleFileSelect = async (file) => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await analyzeInsurancePolicy(formData);
      setAnalysis(res.analysis);
      setHistory((prev) => [res.analysis, ...prev]);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Analysis failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setAnalysis(null); setError(""); };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-400/10 border border-red-400/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Insurance Analyzer</h1>
            <p className="text-sm text-textSecondary">Upload any policy document for instant AI-powered coverage analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e222e] border border-border text-textSecondary hover:text-white text-sm font-semibold transition-colors">
            <Clock className="w-4 h-4" />
            History {history.length > 0 && `(${history.length})`}
          </button>
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-textSecondary hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-red-400/10 border border-red-400/30 text-red-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
            <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-5 rounded-2xl bg-[#171a21] border border-border space-y-3">
              <h3 className="font-bold text-white text-sm">Past Policy Analyses</h3>
              {historyLoading
                ? [1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-[#2a2e3d] animate-pulse" />)
                : history.length === 0
                  ? <p className="text-sm text-textSecondary">No past analyses yet.</p>
                  : history.map((a, i) => <HistoryCard key={a.id || i} analysis={a} onClick={() => { setAnalysis(a); setShowHistory(false); }} />)
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      {analysis
        ? <AnalysisResult data={analysis} onReset={reset} />
        : <UploadZone onFileSelect={handleFileSelect} uploading={uploading} />
      }

      {/* How it works */}
      {!analysis && !uploading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Upload, label: "Upload", desc: "Drop your insurance policy or renewal notice" },
            { icon: ShieldCheck, label: "AI Reads", desc: "Gemini AI identifies coverages, exclusions, and red flags" },
            { icon: Star, label: "Get Rated", desc: "Receive a 0-10 policy rating with actionable recommendations" },
          ].map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="p-4 rounded-xl bg-[#12141d] border border-border text-center">
                <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-red-400" />
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
