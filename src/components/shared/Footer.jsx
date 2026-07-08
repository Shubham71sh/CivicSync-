import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-accent" />
          <span className="font-bold">CivicSync AI</span>
          <span className="text-xs text-textSecondary ml-4">© 2024 CivicSync AI. Secure Governance Systems. Built for citizens and government.</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-textSecondary font-medium">
          <Link to="/about" className="hover:text-white transition-colors">About</Link>
          <Link to="/features" className="hover:text-white transition-colors">Features</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">AI Ethics</a>
        </div>
        <div className="w-10 h-10 rounded-full bg-accent text-[#0a0a0f] flex items-center justify-center cursor-pointer shadow-glow-accent">
          <Building2 className="w-4 h-4" />
        </div>
      </div>
    </footer>
  );
}
