import { motion } from "framer-motion";
import { Bell, ShieldAlert, FileText, Award, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getNotifications, markAllNotificationsRead } from "../../services/profileService";
import { SkeletonList } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";

const ICON_MAP = { ShieldAlert, FileText, Award, Calendar, Bell };

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Backend: GET /api/notifications
  useEffect(() => {
    getNotifications()
      .then(({ notifications, unreadCount }) => {
        setNotifications(notifications);
        setUnreadCount(unreadCount);
      })
      .catch((err) => console.error("[Notifications] Failed to load:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      // Backend: POST /api/notifications/read-all
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("[Notifications] Mark all read failed:", err);
    } finally {
      setMarking(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-accent" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Notifications</h1>
            <p className="text-sm text-textSecondary">Your recent alerts and system updates.</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            disabled={marking}
            className="text-xs font-semibold text-accent hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {marking ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Marking...</> : <><CheckCircle2 className="w-4 h-4" /> Mark all as read</>}
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonList rows={4} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up!"
          description="You have no notifications. We'll alert you when bills matching your profile are updated."
        />
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
          {notifications.map((notif) => {
            const Icon = ICON_MAP[notif.iconType] || Bell;
            return (
              <motion.div
                key={notif._id}
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
      )}
    </div>
  );
}
