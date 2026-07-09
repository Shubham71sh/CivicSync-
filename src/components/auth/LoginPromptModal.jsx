import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { X, Lock, ShieldAlert, Sparkles } from "lucide-react";

export default function LoginPromptModal({ isOpen, onClose, actionLabel = "this feature" }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#020205]/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-card border border-border p-6 shadow-2xl z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-textSecondary hover:bg-[#171a21] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Accent */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center mt-4">
              {/* Icon Container */}
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5 relative">
                <Lock className="w-6 h-6 text-accent" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Authentication Required
              </h3>
              
              <p className="text-sm text-textSecondary leading-relaxed mb-8 max-w-sm">
                To access <span className="text-white font-semibold">{actionLabel}</span>, please sign in or register for a free CivicSync account.
              </p>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="w-full py-3.5 rounded-xl bg-accent text-[#0a0a0f] font-semibold text-center hover:bg-accentHover transition-all shadow-glow-accent duration-200"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  onClick={onClose}
                  className="w-full py-3.5 rounded-xl bg-card border border-border text-white font-semibold text-center hover:bg-cardHover transition-colors duration-200"
                >
                  Create Free Account
                </Link>
              </div>

              {/* Notice */}
              <p className="text-[10px] text-textMuted mt-4 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-textMuted" />
                Account creation takes less than a minute.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
