import { motion } from "framer-motion";
import { FileText } from "lucide-react";

/**
 * EmptyState
 * Displayed when a data set is empty (no bills, no notifications, etc.)
 *
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} title - Main message
 * @param {string} description - Supportive text
 * @param {React.ReactNode} action - Optional CTA button/link
 */
export default function EmptyState({
  icon: Icon = FileText,
  title = "Nothing here yet",
  description = "When data is added, it will appear here.",
  action = null,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#171a21] border border-border flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-textSecondary" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-textSecondary max-w-xs leading-relaxed mb-6">{description}</p>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
