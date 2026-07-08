import React from "react";
import { DollarSign, ShieldAlert, Cpu, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function DamageAssessment({ data }) {
  const { overallDamage, metrics, financials } = data;

  // Circle progress computations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallDamage / 100) * circumference;
  
  const confidenceOffset = circumference - (financials.aiConfidence / 100) * circumference;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Damage Assessment Dashboard</h3>
          <p className="text-[11px] text-slate-400">Quantitative metrics determined by AI model inference and geotag analysis</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
          <Cpu className="w-3.5 h-3.5" />
          <span>94% Confidence</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Overall Circular Progress */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50/30 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Overall Severity</span>
          
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="10"
                fill="transparent"
              />
              <motion.circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-red-500"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-slate-800">{overallDamage}%</span>
              <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider">Severe</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-4 leading-relaxed px-2">
            Damage crosses the 40% government threshold for accelerated relief fund release.
          </p>
        </div>

        {/* Center: Detailed stats grid */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {metrics.map((metric, idx) => (
            <div 
              key={idx} 
              className="p-3.5 bg-white border border-slate-100 rounded-xl hover:border-slate-200 hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
            >
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                {metric.name}
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-sm font-extrabold text-slate-800">{metric.value}</span>
                <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  metric.status.toLowerCase() === 'severe' || metric.status.toLowerCase() === 'danger'
                    ? "bg-red-50 text-red-600 border border-red-100" 
                    : metric.status.toLowerCase() === 'warning' || metric.status.toLowerCase() === 'critical'
                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                    : "bg-slate-50 text-slate-600 border border-slate-100"
                }`}>
                  {metric.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial stats footer banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
        <div className="p-4 bg-blue-50/50 border border-blue-50 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest block">Estimated Loss</span>
            <span className="text-base font-extrabold text-slate-800">
              ₹{financials.estimatedLoss.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">AI Model Confidence</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-2 bg-slate-200 rounded-full flex-1 overflow-hidden">
                <div 
                  style={{ width: `${financials.aiConfidence}%` }} 
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
              <span className="text-[11px] font-extrabold text-slate-700 shrink-0">
                {financials.aiConfidence}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
