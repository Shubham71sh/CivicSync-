import { motion } from "framer-motion";
import clsx from "clsx";

/**
 * GenericPage — Placeholder for pages not yet fully built.
 * Used for stub routes like /dashboard/eligibility, /dashboard/benefits, etc.
 * Shows a "coming soon" card with the page's icon and description.
 *
 * @param {string} title
 * @param {string} description
 * @param {React.ComponentType} icon
 */
export default function GenericPage({ title, description, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.3 }}
        className="max-w-md"
      >
        {Icon && (
          <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-8 shadow-glow">
            <Icon className="w-10 h-10 text-accent" />
          </div>
        )}
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/5 border border-accent/20 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse inline-block" />
          <span className="text-xs font-semibold text-accent uppercase tracking-widest">Coming Soon</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
        <p className="text-textSecondary leading-relaxed mb-8">{description}</p>

        <div className="p-4 rounded-2xl bg-[#171a21] border border-border text-left">
          <p className="text-xs text-textSecondary font-semibold uppercase tracking-widest mb-3">What's coming:</p>
          <ul className="space-y-2">
            {["Full backend integration", "Real-time data sync", "Personalized AI insights", "Export & reporting tools"].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-textSecondary">
                <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
