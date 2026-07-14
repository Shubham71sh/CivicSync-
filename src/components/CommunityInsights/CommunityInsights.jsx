import React from "react";
import { Users, FileCheck, HelpCircle, Activity, Sparkles } from "lucide-react";

export default function CommunityInsights({ data }) {
  const { nearbyReports, verifiedReports, pendingReports, averageDamage } = data;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-800">Community Insights & Heatmap</h3>
        <p className="text-[11px] text-slate-400">Aggregated crowdsourced reports inside Patna Ward 14 to guide municipal dispatch</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Reports Statistics Grid (left 2 cols) */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {/* Total Reports */}
          <div className="p-4 bg-slate-50 border border-slate-100/50 rounded-xl hover:shadow-sm transition-all duration-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nearby Reports</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-xl font-extrabold text-slate-800">{nearbyReports}</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </div>

          {/* Verified Reports */}
          <div className="p-4 bg-emerald-50/20 border border-emerald-100/50 rounded-xl hover:shadow-sm transition-all duration-200">
            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Verified Claims</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-xl font-extrabold text-emerald-800">{verifiedReports}</span>
              <FileCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          {/* Pending Reports */}
          <div className="p-4 bg-amber-50/20 border border-amber-100/50 rounded-xl hover:shadow-sm transition-all duration-200">
            <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Awaiting Audit</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-xl font-extrabold text-amber-800">{pendingReports}</span>
              <HelpCircle className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          {/* Average Damage */}
          <div className="p-4 bg-red-50/20 border border-red-100/50 rounded-xl hover:shadow-sm transition-all duration-200">
            <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider block">Average Severity</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-xl font-extrabold text-red-800">{averageDamage}%</span>
              <Activity className="w-4 h-4 text-red-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Heatmap Visual Mockup (right 2 cols) */}
        <div className="md:col-span-2 h-[168px] bg-slate-100 border border-slate-200 rounded-xl overflow-hidden relative shadow-inner flex items-center justify-center">
          {/* Base map mockup image */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10 bg-slate-400" />

          {/* Radial Heatmap hotspots */}
          <div className="absolute top-[35%] left-[45%] w-24 h-24 bg-red-500/30 rounded-full filter blur-xl animate-pulse" />
          <div className="absolute top-[40%] left-[40%] w-16 h-16 bg-amber-500/40 rounded-full filter blur-lg" />
          <div className="absolute top-[25%] left-[55%] w-20 h-20 bg-red-500/25 rounded-full filter blur-xl animate-pulse" />
          <div className="absolute top-[55%] left-[30%] w-12 h-12 bg-amber-500/30 rounded-full filter blur-md" />

          {/* Top banner overlay */}
          <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>Crisis Heatmap Overlay</span>
          </div>

          <div className="relative z-10 text-center pointer-events-none px-3">
            <span className="text-[10px] font-bold text-slate-800 block uppercase tracking-widest">Patna Ward 14</span>
            <p className="text-[9px] text-slate-500 mt-1 leading-normal max-w-[180px] mx-auto">
              Flood water level logs show high concentration around Central High School grid block.
            </p>
          </div>
          
          <div className="absolute bottom-2 right-2 bg-white/90 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600 border border-slate-200">
            Avg Water: 4.2 ft
          </div>
        </div>
      </div>
    </div>
  );
}
