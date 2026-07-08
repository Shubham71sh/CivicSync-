import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import clsx from "clsx";

/**
 * LoadingSpinner
 * Full-page or inline spinner for loading states.
 *
 * @param {boolean} fullScreen - If true, takes full viewport height
 * @param {string} message - Optional message below spinner
 * @param {string} size - "sm" | "md" | "lg"
 */
export default function LoadingSpinner({ fullScreen = false, message = "", size = "md" }) {
  const sizeClasses = { sm: "w-6 h-6", md: "w-10 h-10", lg: "w-16 h-16" };

  const spinner = (
    <div className="flex flex-col items-center gap-4">
      {/* Outer ring */}
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={clsx(
            "rounded-full border-2 border-accent/20 border-t-accent",
            sizeClasses[size]
          )}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-accent/60" />
        </div>
      </div>
      {message && (
        <p className="text-sm text-textSecondary font-medium animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      {spinner}
    </div>
  );
}
