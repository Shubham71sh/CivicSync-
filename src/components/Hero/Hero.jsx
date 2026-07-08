import React from "react";
import { Sparkles, Upload } from "lucide-react";

export default function Hero({ onStartAssessment, onUploadClick }) {
  return (
    <div className="relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-50 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Active Response Module</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          AI Disaster Relief Assistant
        </h1>
        
        <p className="mt-3 text-slate-500 text-sm md:text-base leading-relaxed">
          Upload disaster evidence and let AI analyze the damage to recommend personalized government relief schemes and guide citizens through the recovery process.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onStartAssessment}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start AI Assessment</span>
          </button>
          
          <button
            onClick={onUploadClick}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 rounded-xl shadow-sm transition-all duration-200 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Images</span>
          </button>
        </div>
      </div>
    </div>
  );
}
