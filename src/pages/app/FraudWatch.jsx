import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, TrendingDown, Eye, MapPin, Clock, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

const ALERTS = [
  { id: 1, severity: "critical", title: "Anomalous Contract Detected", location: "Metro Project Phase 4", amount: "$1.2M", time: "2 mins ago", pattern: "Unusual bidding pattern — 3 bids from same IP subnet" },
  { id: 2, severity: "high", title: "Procurement Irregularity", location: "City Infrastructure Fund", amount: "$480K", time: "1 hour ago", pattern: "Contract awarded without competitive tender process" },
  { id: 3, severity: "medium", title: "Budget Variance Flagged", location: "Digital Literacy Program", amount: "$95K", time: "Yesterday", pattern: "Expenditure 43% above projected estimate" },
];

const SEVERITY_CONFIG = {
  critical: { color: "text-danger", bg: "bg-danger/10 border-danger/20", dot: "bg-danger" },
  high: { color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20", dot: "bg-orange-400" },
  medium: { color: "text-accent", bg: "bg-accent/10 border-accent/20", dot: "bg-accent" },
};

export default function FraudWatch() {
  const [alerts] = useState(ALERTS);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-danger" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Fraud Watch</h1>
            <p className="text-sm text-textSecondary">AI-powered anomaly detection in public spending data.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/10 border border-danger/20">
          <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
          <span className="text-sm font-semibold text-danger">{alerts.filter(a => a.severity === "critical").length} Critical Alerts Active</span>
        </div>
      </div>

      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Risk Score", value: "84.2%", icon: AlertTriangle, color: "text-danger" },
          { label: "Anomalies Found", value: `${alerts.length}`, icon: Eye, color: "text-accent" },
          { label: "Total Flagged", value: "$1.78M", icon: TrendingDown, color: "text-orange-400" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl bg-[#171a21] border border-border"
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-xs text-textSecondary uppercase tracking-widest font-semibold">{stat.label}</span>
              </div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Alerts List */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Active Alerts</h2>
        <div className="space-y-3">
          {alerts.map((alert, i) => {
            const config = SEVERITY_CONFIG[alert.severity];
            return (
              <motion.div key={alert.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="p-5 rounded-2xl bg-[#171a21] border border-border hover:border-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${config.bg}`}>
                    <ShieldAlert className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-white text-sm">{alert.title}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${config.bg} ${config.color} uppercase tracking-wider`}>{alert.severity}</span>
                      </div>
                      <span className="text-xs text-textSecondary flex items-center gap-1"><Clock className="w-3 h-3" />{alert.time}</span>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-xs text-textSecondary flex items-center gap-1"><MapPin className="w-3 h-3" />{alert.location}</span>
                      <span className={`text-xs font-bold ${config.color}`}>{alert.amount} flagged</span>
                    </div>
                    <p className="text-xs text-textSecondary">{alert.pattern}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Heatmap Placeholder */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-3xl bg-[#171a21] border border-border">
        <h3 className="text-lg font-bold text-white mb-4">Risk Heatmap</h3>
        <div className="rounded-xl bg-[#12141d] border border-border border-dashed h-48 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-8 h-8 text-textSecondary mx-auto mb-2" />
            <p className="text-sm text-textSecondary">Geographic heatmap visualization</p>
            <p className="text-xs text-textSecondary/60 mt-1">Backend: GET /api/fraud/heatmap</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
