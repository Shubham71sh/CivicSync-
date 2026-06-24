import { motion } from "framer-motion";
import { Bell, ShieldAlert, FileText, Award, Calendar, CheckCircle2 } from "lucide-react";

const NOTIFICATIONS = [
  {
    id: 1,
    type: "alert",
    icon: ShieldAlert,
    title: "Corruption Risk Detected in Area",
    desc: "Unusual bidding pattern found in Metro Project Phase 4. Estimated discrepancy: $1.2M.",
    time: "2 mins ago",
    read: false
  },
  {
    id: 2,
    type: "info",
    icon: FileText,
    title: "New Environmental Bill (r-401)",
    desc: "CivicSync AI identifies 3 clauses that may impact your current tax bracket.",
    time: "1 hour ago",
    read: false
  },
  {
    id: 3,
    type: "success",
    icon: Award,
    title: "Community Milestone Reached",
    desc: "Transparency petition for public parks has reached 10,000 verified signatures.",
    time: "4 hours ago",
    read: true
  },
  {
    id: 4,
    type: "warning",
    icon: Calendar,
    title: "Upcoming Deadline",
    desc: "Tax Filing Assistance for your business profile expires in 6 hours.",
    time: "Yesterday",
    read: true
  }
];

export default function Notifications() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
            <Bell className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Notifications</h1>
            <p className="text-sm text-textSecondary">Your recent alerts and system updates.</p>
          </div>
        </div>
        <button className="text-xs font-semibold text-accent hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Mark all as read
        </button>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
        {NOTIFICATIONS.map((notif) => {
          const Icon = notif.icon;
          return (
            <motion.div 
              key={notif.id} 
              variants={itemVariants} 
              className={`p-4 rounded-2xl border flex gap-4 items-start group hover:border-white/10 transition-colors cursor-pointer ${notif.read ? 'bg-[#12141d] border-border opacity-70' : 'bg-[#171a21] border-border'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${
                notif.type === 'alert' ? 'bg-danger/10 text-danger' : 
                notif.type === 'success' ? 'bg-success/10 text-success' : 
                notif.type === 'warning' ? 'bg-accent/10 text-accent' : 
                'bg-blue-500/10 text-blue-400'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <h4 className={`text-sm ${notif.read ? 'font-medium text-textSecondary' : 'font-bold text-white'}`}>{notif.title}</h4>
                  <span className="text-xs text-textSecondary whitespace-nowrap ml-4">{notif.time}</span>
                </div>
                <p className="text-sm text-textSecondary leading-relaxed">{notif.desc}</p>
              </div>
              {!notif.read && <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0"></div>}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
