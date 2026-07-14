import React, { useState } from "react";
import { Sparkles, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AssistanceCard({ data, onApply }) {
  const { estimatedRelief, basis } = data;
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    setApplying(true);
    setTimeout(() => {
      setApplying(false);
      setApplied(true);
      if (onApply) {
        onApply();
      }
    }, 2000);
  };

  return (
    <div className="relative overflow-hidden bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/10 flex flex-col justify-between min-h-[300px]">
      {/* Background glow effects */}
      <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-blue-500 rounded-full blur-2xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-indigo-500 rounded-full blur-2xl opacity-40 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Estimated Assistance</span>
        </div>

        <span className="text-[11px] text-blue-200 font-bold uppercase tracking-widest block">Total Estimated Relief</span>
        <h2 className="text-4xl font-black mt-1 leading-none">
          ₹{estimatedRelief.toLocaleString("en-IN")}
        </h2>
        
        {/* Verification Checklist */}
        <div className="mt-6 space-y-2 border-t border-white/15 pt-5">
          <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block">Based On AI Assessment</span>
          <div className="space-y-2">
            {basis.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
                <span className="text-xs text-blue-100 leading-normal">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="relative z-10 mt-6 pt-4 border-t border-white/15">
        {applied ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full py-3 bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-emerald-400"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Relief Application Filed!</span>
          </motion.div>
        ) : (
          <button
            onClick={handleApply}
            disabled={applying}
            className="w-full py-3 bg-white hover:bg-slate-50 text-blue-600 font-extrabold text-xs rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-blue-200 disabled:text-blue-400"
          >
            {applying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Filing Claim with Bihar Gov...</span>
              </>
            ) : (
              <>
                <span>Apply for Relief</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
        <p className="text-[9px] text-blue-200/70 text-center mt-2.5">
          Funds disbursed directly via DBT once verified by a local Block Officer.
        </p>
      </div>
    </div>
  );
}
