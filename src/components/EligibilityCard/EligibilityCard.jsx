import React from "react";
import { CheckCircle2, XCircle, Sparkles, HelpCircle } from "lucide-react";

export default function EligibilityCard({ checklist, confidence }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Eligibility Breakdown</h3>
          <p className="text-[11px] text-slate-400">Automatic rules-engine compliance matching for state relief schemes</p>
        </div>
        
        {/* Confidence pill */}
        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-blue-100">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>{confidence}% Match Confidence</span>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="space-y-3">
        {checklist.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 p-2.5 rounded-xl border transition-colors ${
              item.verified 
                ? "bg-emerald-50/20 border-emerald-100/50 hover:bg-emerald-50/40" 
                : "bg-slate-50 border-slate-100"
            }`}
          >
            {item.verified ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold leading-normal ${item.verified ? "text-slate-800" : "text-slate-500"}`}>
                {item.label}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5 font-medium">
                {item.verified ? "Verified via municipal database and geotag" : "Awaiting review or document upload"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 justify-center text-[10px] text-slate-400 font-medium">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Need to contest? Submit an appeal in Townhall Services.</span>
      </div>
    </div>
  );
}
