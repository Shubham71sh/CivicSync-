import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export default function GenericPage({ title, description, icon: Icon = FileText }) {
  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-glow">
          <Icon className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-sm text-textSecondary">{description}</p>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="p-6 rounded-3xl bg-[#171a21] border border-border md:col-span-2 min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4">Module Details</h3>
          <div className="flex-1 rounded-xl bg-[#12141d] border border-border flex flex-col items-center justify-center text-textMuted border-dashed p-8 text-center gap-4">
            <Icon className="w-12 h-12 text-textMuted opacity-50" />
            <div>
              <p className="font-semibold text-white mb-1">Coming Soon</p>
              <p className="text-sm">The {title} module is currently under development. AI models are being trained for this feature.</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <h3 className="text-sm font-bold text-white mb-4">Module Info</h3>
            <ul className="space-y-3 text-sm text-textSecondary">
               <li className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-accent"></div> Syncing data
               </li>
               <li className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-accent"></div> Validating logic
               </li>
               <li className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-accent"></div> UI refinement
               </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
