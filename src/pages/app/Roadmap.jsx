import { motion } from "framer-motion";
import { Map, CheckCircle2, AlertCircle, Clock, ChevronRight, Award, FileText, Calendar } from "lucide-react";

const TIMELINE_ITEMS = [
  {
    id: 1,
    icon: CheckCircle2,
    color: "accent",
    status: "completed",
    title: "Digital Literacy Subsidy",
    date: "Oct 2, 2024",
    desc: "$500 applied to your account under the Digital Skills Act.",
    badge: "Claimed",
    badgeBg: "bg-success/10 text-success border-success/20",
  },
  {
    id: 2,
    icon: Award,
    color: "accent",
    status: "completed",
    title: "Green Energy Rebate",
    date: "Oct 8, 2024",
    desc: "Successfully enrolled. First disbursement expected in 14 days.",
    badge: "Active",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
  },
  {
    id: 3,
    icon: AlertCircle,
    color: "orange-400",
    status: "action_required",
    title: "Housing Assistance Scheme",
    date: "Deadline: Oct 30, 2024",
    desc: "Submit utility bill proof to qualify for 2024 Housing Support Grant.",
    badge: "Action Required",
    badgeBg: "bg-orange-400/10 text-orange-400 border-orange-400/20",
  },
  {
    id: 4,
    icon: FileText,
    color: "blue-400",
    status: "upcoming",
    title: "Infrastructure Act — Phase 2",
    date: "Voting: Nov 14, 2024",
    desc: "High impact bill. AI estimates 67% probability of passing and 54% impact on your profile.",
    badge: "Upcoming",
    badgeBg: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  },
  {
    id: 5,
    icon: Clock,
    color: "textSecondary",
    status: "pending",
    title: "Small Business Tax Relief",
    date: "Expected: Q1 2025",
    desc: "Awaiting Senate committee vote. You are pre-qualified based on your income range.",
    badge: "Pending",
    badgeBg: "bg-[#2a2e3d] text-textSecondary border-border",
  },
];

export default function Roadmap() {
  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Map className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Civic GPS Roadmap</h1>
          <p className="text-sm text-textSecondary">Your personalized timeline of benefits, bills, and civic milestones.</p>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Completed", value: "2", color: "text-success" },
          { label: "Action Required", value: "1", color: "text-orange-400" },
          { label: "Upcoming", value: "2", color: "text-accent" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-2xl bg-[#171a21] border border-border text-center"
          >
            <p className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</p>
            <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-4">
          {TIMELINE_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex gap-5 p-5 rounded-2xl border ml-3 cursor-pointer group hover:border-white/10 transition-colors ${
                  item.status === "action_required"
                    ? "bg-orange-400/5 border-orange-400/20"
                    : "bg-[#171a21] border-border"
                }`}
              >
                {/* Timeline dot */}
                <div className={`absolute -left-8 w-5 h-5 rounded-full border-2 border-[#171a21] flex items-center justify-center z-10 flex-shrink-0 ${
                  item.status === "completed" ? "bg-success" :
                  item.status === "action_required" ? "bg-orange-400" :
                  item.status === "upcoming" ? "bg-blue-400" : "bg-[#2a2e3d]"
                }`} />

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${
                  item.status === "completed" ? "bg-success/10" :
                  item.status === "action_required" ? "bg-orange-400/10" :
                  "bg-[#2a2e3d]"
                }`}>
                  <Icon className={`w-5 h-5 text-${item.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-white text-sm">{item.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 uppercase tracking-wider ${item.badgeBg}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-accent font-semibold mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> {item.date}
                  </p>
                  <p className="text-sm text-textSecondary leading-relaxed">{item.desc}</p>
                </div>

                <ChevronRight className="w-4 h-4 text-textSecondary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
