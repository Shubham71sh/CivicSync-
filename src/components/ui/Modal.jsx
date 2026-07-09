import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

/**
 * Modal
 * Accessible overlay modal with Framer Motion enter/exit animation.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {React.ReactNode} children
 * @param {string} title - Optional header title
 * @param {string} maxWidth - Tailwind max-width class (default: "max-w-md")
 */
export default function Modal({ isOpen, onClose, children, title, maxWidth = "max-w-md" }) {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full ${maxWidth} z-[101] mx-4`}
          >
            <div className="bg-[#12141d] border border-border rounded-2xl shadow-2xl overflow-hidden">
              {title && (
                <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                  <h2 className="text-lg font-bold text-white">{title}</h2>
                  <button
                    onClick={onClose}
                    className="text-textSecondary hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div className="p-6">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
