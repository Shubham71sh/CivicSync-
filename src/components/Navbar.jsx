import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Shield, Activity, Map, MessageSquare, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "Roadmap", href: "#roadmap" },
  { name: "Impact", href: "#impact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 lg:px-12 py-4",
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-white/5" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-card border border-white/10 flex items-center justify-center glow-box group-hover:border-secondary/50 transition-colors">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-accent transition-colors">
            CivicSync<span className="text-secondary">.AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6 bg-card/50 px-6 py-2 rounded-full border border-white/5 backdrop-blur-sm">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-textSecondary hover:text-white transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-full bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition-all shadow-glow hover:shadow-[0_0_20px_rgba(29,78,216,0.8)]"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-textSecondary hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-full left-0 right-0 bg-card border-b border-white/5 px-6 py-4 flex flex-col gap-4 shadow-xl"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-textSecondary hover:text-white font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <Link
              to="/dashboard"
              className="w-full py-3 rounded-xl bg-secondary text-white text-center font-medium shadow-glow"
              onClick={() => setMobileMenuOpen(false)}
            >
              Go to Dashboard
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
