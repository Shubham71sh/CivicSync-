import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

export default function ImpactSimulator() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-card border border-white/10 flex items-center justify-center shadow-glow">
          <TrendingUp className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Impact Simulator</h1>
          <p className="text-textSecondary">Manage and analyze your impact simulator metrics.</p>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="p-6 rounded-3xl bg-card border border-white/5 md:col-span-2 min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4">Main Dashboard Area</h3>
          <div className="flex-1 rounded-xl bg-background/50 border border-white/5 flex items-center justify-center text-textMuted border-dashed">
            Predictive Data Visualization Placeholder
          </div>
        </div>
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <p className="text-sm text-textSecondary">Update item #00{i}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 rounded-3xl bg-card border border-white/5">
            <h3 className="text-lg font-bold text-white mb-2">Quick Actions</h3>
            <button className="w-full py-2.5 mt-4 rounded-xl bg-secondary text-white font-medium shadow-glow hover:bg-secondary/90 transition-colors">
              Perform Action
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
