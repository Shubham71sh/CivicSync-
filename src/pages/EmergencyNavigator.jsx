import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function EmergencyNavigator() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-card border border-white/10 flex items-center justify-center shadow-glow">
          <AlertTriangle className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Emergency Navigator</h1>
          <p className="text-textSecondary">Real-time alerts and routes during crisis events.</p>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="p-6 rounded-3xl bg-card border border-white/5 md:col-span-2 min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4">Emergency Dispatch Center</h3>
          <div className="flex-1 rounded-xl bg-background/50 border border-white/5 flex items-center justify-center text-textMuted border-dashed">
            Interactive Crisis Routing Map Placeholder
          </div>
        </div>
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4">Recent Emergency Feeds</h3>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <p className="text-sm text-textSecondary">Flood alert warning in Zone {i}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 rounded-3xl bg-card border border-white/5">
            <h3 className="text-lg font-bold text-white mb-2">SOS Helpdesk</h3>
            <button className="w-full py-2.5 mt-4 rounded-xl bg-red-500 text-white font-medium shadow-glow hover:bg-red-600 transition-colors">
              Trigger SOS Alert
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
