import { motion } from "framer-motion";
import { Settings as SettingsIcon, Bell, Shield, Eye, Palette, Globe, Trash2, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../../hooks/useAuth";

const SETTING_GROUPS = [
  {
    title: "Notifications",
    icon: Bell,
    settings: [
      { id: "bill_alerts", label: "Bill Alerts", desc: "Notify me when new bills match my profile", defaultOn: true },
      { id: "corruption_alerts", label: "Corruption Alerts", desc: "Real-time fraud detection notifications", defaultOn: true },
      { id: "deadline_reminders", label: "Deadline Reminders", desc: "Reminders for upcoming benefit deadlines", defaultOn: true },
      { id: "community_updates", label: "Community Updates", desc: "Townhall events and civic milestones", defaultOn: false },
    ]
  },
  {
    title: "Privacy",
    icon: Shield,
    settings: [
      { id: "profile_visibility", label: "Public Profile", desc: "Allow other citizens to see your civic activity", defaultOn: false },
      { id: "data_analytics", label: "Data Analytics", desc: "Help improve CivicSync by sharing anonymous usage data", defaultOn: true },
    ]
  },
  {
    title: "Display",
    icon: Palette,
    settings: [
      { id: "eli15_default", label: "ELI15 Mode by Default", desc: "Show simplified explanations across all bill summaries", defaultOn: false },
      { id: "compact_view", label: "Compact View", desc: "Denser information layout for power users", defaultOn: false },
    ]
  },
];

function Toggle({ on, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={clsx("w-10 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors flex-shrink-0", on ? "bg-accent" : "bg-[#2a2e3d]")}
    >
      <motion.div
        layout
        className="w-4 h-4 rounded-full bg-white shadow-sm"
        animate={{ x: on ? 16 : 0 }}
        initial={false}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </div>
  );
}

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [toggles, setToggles] = useState(
    Object.fromEntries(SETTING_GROUPS.flatMap(g => g.settings.map(s => [s.id, s.defaultOn])))
  );

  const handleToggle = (id) => {
    setToggles(prev => ({ ...prev, [id]: !prev[id] }));
    // TODO: Backend: PATCH /api/settings → save preference
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-sm text-textSecondary">Manage your preferences and account options.</p>
        </div>
      </div>

      <div className="space-y-6">
        {SETTING_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          return (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl bg-[#171a21] border border-border"
            >
              <div className="flex items-center gap-3 mb-6">
                <GroupIcon className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-white">{group.title}</h3>
              </div>
              <div className="space-y-4">
                {group.settings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-white">{setting.label}</p>
                      <p className="text-xs text-textSecondary mt-0.5">{setting.desc}</p>
                    </div>
                    <Toggle on={toggles[setting.id]} onToggle={() => handleToggle(setting.id)} />
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-3xl bg-[#1a1214] border border-danger/20">
          <h3 className="font-bold text-danger mb-6">Danger Zone</h3>
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#12141d] border border-border text-textSecondary hover:border-danger/30 hover:text-danger transition-colors text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Sign Out of All Devices
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#12141d] border border-border text-textSecondary hover:border-danger/30 hover:text-danger transition-colors text-sm font-semibold">
              <Trash2 className="w-4 h-4" />
              Delete Account
              <span className="ml-auto text-xs text-textSecondary">(Irreversible)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
