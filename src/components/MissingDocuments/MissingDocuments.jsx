import React from "react";
import { Check, X, FileWarning, Upload } from "lucide-react";
import { motion } from "framer-motion";

export default function MissingDocuments({ data, onUploadRequest }) {
  const { submitted, missing, completionPercentage } = data;

  // SVG Circular progress configurations
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Document Verification</h3>
          <p className="text-[11px] text-slate-400">Complete required uploads to accelerate officer validation</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
        {/* Left: Circular Completion Dial */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-slate-200"
                strokeWidth="6"
                fill="transparent"
              />
              <motion.circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-blue-600"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-sm font-extrabold text-slate-800">{completionPercentage}%</span>
              <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Ready</span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-slate-500 mt-2">Claim Strength</span>
        </div>

        {/* Right: Document List */}
        <div className="flex-1 w-full space-y-2.5">
          {/* Submitted Docs */}
          {submitted.map((doc, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4.5 h-4.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span className="font-semibold text-slate-700">{doc.name}</span>
              </div>
              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-md">
                Verified
              </span>
            </div>
          ))}

          {/* Missing Docs */}
          {missing.map((doc, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4.5 h-4.5 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shrink-0">
                  <X className="w-3 h-3" />
                </div>
                <span className="font-semibold text-slate-500">{doc.name}</span>
              </div>
              
              <button 
                onClick={onUploadRequest}
                className="flex items-center gap-1 text-[9px] text-red-600 font-bold bg-red-50 border border-red-100 hover:bg-red-100/50 px-2 py-0.5 rounded-md transition-colors"
              >
                <Upload className="w-2.5 h-2.5" />
                <span>Upload</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 bg-red-50/50 border border-red-50 rounded-xl text-[10px] text-red-700">
        <FileWarning className="w-4 h-4 shrink-0" />
        <p className="font-medium leading-relaxed">
          <span className="font-bold">Missing Bank Passbook</span> is blocking direct benefit payment release. Please upload a copy to prevent delays.
        </p>
      </div>
    </div>
  );
}
