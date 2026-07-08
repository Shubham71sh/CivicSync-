import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Building2, ArrowRight, ShieldCheck } from "lucide-react";
import Modal from "../ui/Modal";

/**
 * LoginPromptModal
 * Shown when a guest user attempts to access a protected action from the landing page.
 * (e.g., clicking "Upload Bill" without being logged in)
 */
export default function LoginPromptModal({ isOpen, onClose, actionLabel = "this feature" }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <div className="text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-8 h-8 text-accent" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">Sign in to Continue</h3>
        <p className="text-sm text-textSecondary leading-relaxed mb-6">
          You need a CivicSync account to use {actionLabel}. It's free and takes less than 60 seconds.
        </p>

        {/* Trust signal */}
        <div className="flex items-center justify-center gap-2 text-xs text-textSecondary mb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          <span>Bank-grade encryption. Your data is always private.</span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-accent text-[#0a0a0f] font-bold flex items-center justify-center gap-2 hover:bg-accentHover transition-colors shadow-glow-accent"
          >
            Sign In <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/signup"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#171a21] border border-border text-white font-semibold text-sm hover:bg-cardHover transition-colors"
          >
            Create Free Account
          </Link>
        </div>

        <button
          onClick={onClose}
          className="mt-4 text-xs text-textSecondary hover:text-white transition-colors"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
}
