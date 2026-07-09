import { motion } from "framer-motion";
import { FileText, TrendingUp, BarChart3, Sparkles } from "lucide-react";
import { useState } from "react";
import { summarizeBill } from "../../services/aiService";
import { SkeletonCard } from "../../components/ui/Skeleton";

export default function AISummary() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [eli15Mode, setEli15Mode] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    try {
      // Backend: POST /api/ai/summarize
      const result = await summarizeBill("bill_001", { mode: eli15Mode ? "eli15" : "standard" });
      setSummary(result);
    } catch (err) {
      console.error("[AISummary] Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-glow">
          <FileText className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">AI Bill Summary</h1>
          <p className="text-sm text-textSecondary">Get instant plain-language summaries of any legislation.</p>
        </div>
      </div>

      {/* Bill Selector */}
      <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
        <h3 className="font-bold text-white mb-4">Select Bill to Analyze</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs text-textSecondary uppercase tracking-widest font-semibold block mb-2">Bill Number / Name</label>
            <input type="text" defaultValue="Infrastructure Development Act 2024" className="w-full bg-[#12141d] border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-accent" />
          </div>
          <div className="flex items-center gap-3 pb-0.5">
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-widest">ELI15</span>
            <div onClick={() => setEli15Mode(!eli15Mode)} className={`w-10 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${eli15Mode ? "bg-accent" : "bg-[#2a2e3d]"}`}>
              <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" animate={{ x: eli15Mode ? 16 : 0 }} initial={false} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
            </div>
          </div>
          <button onClick={handleSummarize} disabled={loading} className="px-6 py-3 rounded-xl bg-accent text-[#0a0a0f] font-bold text-sm hover:bg-accentHover transition-colors shadow-glow-accent disabled:opacity-70 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {loading ? "Analyzing..." : "Summarize"}
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : summary ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-white">AI Summary</h3>
              {eli15Mode && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-semibold">ELI15</span>}
            </div>
            <p className="text-textSecondary leading-relaxed">{summary.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#171a21] border border-border">
              <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-3">Impact Score</p>
              <p className="text-4xl font-bold text-accent">{summary.impactScore}%</p>
            </div>
            <div className="md:col-span-2 p-5 rounded-2xl bg-[#171a21] border border-border">
              <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-3">Your Personal Impact</p>
              <p className="text-sm text-white">{summary.userImpact}</p>
            </div>
          </div>

          {summary.keyPoints?.length > 0 && (
            <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
              <h3 className="font-bold text-white mb-4">Key Points</h3>
              <ul className="space-y-3">
                {summary.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-textSecondary">
                    <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i + 1}</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="p-10 rounded-3xl bg-[#171a21] border border-border border-dashed text-center">
          <BarChart3 className="w-10 h-10 text-textSecondary mx-auto mb-3" />
          <p className="text-textSecondary">Select a bill above and click Summarize to get your AI analysis.</p>
        </div>
      )}
    </div>
  );
}
