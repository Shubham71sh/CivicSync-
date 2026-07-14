import React from "react";
import { MapPin, Calendar, CloudRain, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";

export default function DisasterSummary({ data }) {
  const { type, location, riskLevel, date, weather, status } = data;

  const getRiskBadge = (level) => {
    switch (level.toLowerCase()) {
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
            <AlertCircle className="w-3 h-3 text-red-600" />
            {level} Risk
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            {level} Risk
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            {level} Risk
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Disaster Profile</span>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-0.5">
            {type} Incident
            <span className="inline-flex items-center w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {getRiskBadge(riskLevel)}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Location */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Location</span>
          <div className="flex items-center gap-1.5 text-slate-700">
            <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-xs font-semibold">{location}</span>
          </div>
        </div>

        {/* Disaster Date */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Declared Date</span>
          <div className="flex items-center gap-1.5 text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold">{date}</span>
          </div>
        </div>

        {/* Current Weather */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Current Weather</span>
          <div className="flex items-center gap-1.5 text-slate-700">
            <CloudRain className="w-4 h-4 text-blue-400 shrink-0 animate-bounce" />
            <span className="text-xs font-semibold">{weather}</span>
          </div>
        </div>

        {/* Recovery Status */}
        <div className="space-y-1 col-span-2 sm:col-span-3 pt-2 border-t border-slate-50 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Recovery Status</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
