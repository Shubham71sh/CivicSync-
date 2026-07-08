import React from "react";
import { CheckCircle2, Clock, PlayCircle, ShieldCheck } from "lucide-react";

export default function RecoveryTimeline({ timeline }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-800">Claim & Recovery Timeline</h3>
        <p className="text-[11px] text-slate-400">Track the verification and direct benefit disbursement progress of your case</p>
      </div>

      {/* Horizontal timeline for medium+ screens, stacks vertically on mobile */}
      <div className="hidden md:flex items-center justify-between relative py-4">
        {/* Connecting Line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 -z-0" />
        
        {timeline.map((step, idx) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center text-center max-w-[120px] flex-1">
              {/* Dot */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isCompleted 
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/10" 
                  : isCurrent 
                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/10 scale-110" 
                  : "bg-white border-slate-200 text-slate-400"
              }`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isCurrent ? (
                  <PlayCircle className="w-4 h-4 animate-pulse" />
                ) : (
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                )}
              </div>

              {/* Title & Info */}
              <span className={`text-[11px] font-bold mt-2.5 block ${isCurrent ? "text-blue-600" : isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                {step.title}
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5 block truncate max-w-full">
                {step.date}
              </span>
            </div>
          );
        })}
      </div>

      {/* Vertical list for mobile screen responsiveness */}
      <div className="md:hidden flex flex-col gap-4 relative pl-4 border-l-2 border-slate-100 ml-3">
        {timeline.map((step, idx) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";

          return (
            <div key={step.id} className="relative flex gap-3.5 items-start">
              {/* Vertical Dot */}
              <div className={`absolute -left-[27px] w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isCompleted
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : isCurrent
                  ? "bg-blue-600 border-blue-600 text-white scale-105"
                  : "bg-white border-slate-200 text-slate-400"
              }`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isCurrent ? (
                  <PlayCircle className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[8px] font-bold">{idx + 1}</span>
                )}
              </div>

              {/* Text Description */}
              <div className="space-y-0.5">
                <span className={`text-xs font-bold block ${isCurrent ? "text-blue-600" : isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                  {step.title}
                </span>
                <p className="text-[10px] text-slate-400 font-medium">
                  {step.desc}
                </p>
                <span className="text-[9px] font-bold text-slate-500 block">
                  {step.date}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 p-3 bg-blue-50/30 border border-blue-50/50 rounded-xl text-[10px] text-blue-700">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <div>
          <span className="font-bold">Next Action:</span> Physical verify audit by Officer <span className="font-bold text-slate-800">Rajesh Kumar</span> scheduled on 8 July. Keep documents handy.
        </div>
      </div>
    </div>
  );
}
