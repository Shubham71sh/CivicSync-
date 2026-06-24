import { Zap } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background pt-16 pb-8 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-card border border-white/10 flex items-center justify-center glow-box">
                <Zap className="w-4 h-4 text-accent" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                CivicSync<span className="text-secondary">.AI</span>
              </span>
            </Link>
            <p className="text-textSecondary text-sm max-w-sm leading-relaxed mb-6">
              Empowering citizens with AI-driven insights, policy simplification, and real-time impact tracking.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/dashboard" className="text-sm text-textSecondary hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link to="/bills" className="text-sm text-textSecondary hover:text-white transition-colors">Bill Simplifier</Link></li>
              <li><Link to="/fraud" className="text-sm text-textSecondary hover:text-white transition-colors">Fraud Watch</Link></li>
              <li><Link to="/gps" className="text-sm text-textSecondary hover:text-white transition-colors">Civic GPS</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-textSecondary hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/roadmap" className="text-sm text-textSecondary hover:text-white transition-colors">Roadmap</Link></li>
              <li><Link to="/support" className="text-sm text-textSecondary hover:text-white transition-colors">Support</Link></li>
              <li><Link to="/privacy" className="text-sm text-textSecondary hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-textSecondary">
            &copy; {new Date().getFullYear()} CivicSync AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-textSecondary hover:text-white transition-colors">Twitter</a>
            <a href="#" className="text-textSecondary hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="text-textSecondary hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
