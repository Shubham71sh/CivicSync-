import { motion } from "framer-motion";
import { GitCompare, FileText, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

export default function CompareBills() {
  const [selectedBill, setSelectedBill] = useState("b-401");

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Compare Bills</h1>
          <p className="text-sm text-textSecondary">Analyze exact changes between old statutes and new amendments.</p>
        </div>
        
        <div className="flex gap-4">
          <select 
            className="bg-[#12141d] border border-border rounded-lg py-2 px-4 text-sm text-white focus:outline-none focus:border-accent"
            value={selectedBill}
            onChange={(e) => setSelectedBill(e.target.value)}
          >
            <option value="b-401">Zoning Amendment (B-401)</option>
            <option value="b-402">Tax Code Revision 2025</option>
          </select>
          <button className="px-5 py-2.5 rounded-lg bg-accent text-[#0a0a0f] text-sm font-bold hover:bg-accentHover shadow-glow-accent">
            Run AI Diff
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Old Bill */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-3xl bg-[#171a21] border border-border flex flex-col">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-textSecondary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-textSecondary" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Original Text</h3>
              <p className="text-xs text-textSecondary">Section 4A (2018)</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-4 font-mono text-sm leading-relaxed text-textSecondary">
            <p>1. Any commercial entity operating within the central district must maintain a carbon offset of <span className="bg-danger/20 text-danger px-1 rounded line-through">10%</span> annually.</p>
            <p>2. Failure to comply will result in a penalty of <span className="bg-danger/20 text-danger px-1 rounded line-through">$5,000</span> per quarter.</p>
            <p>3. Exemptions apply only to entities with fewer than 50 employees.</p>
          </div>
        </motion.div>

        {/* New Bill */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-3xl bg-[#1a1c23] border border-accent/20 flex flex-col">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg">Proposed Amendment</h3>
              <p className="text-xs text-accent">Draft Bill B-401 (2025)</p>
            </div>
            <div className="px-2 py-1 rounded bg-success/10 text-success text-[10px] font-bold uppercase tracking-widest border border-success/20">
              AI Highlights
            </div>
          </div>

          <div className="flex-1 space-y-4 font-mono text-sm leading-relaxed text-textSecondary">
            <p>1. Any commercial entity operating within the central district must maintain a carbon offset of <span className="bg-success/20 text-success px-1 rounded font-bold">25%</span> annually.</p>
            <p>2. Failure to comply will result in a penalty of <span className="bg-success/20 text-success px-1 rounded font-bold">2.5% of annual gross revenue</span> per quarter.</p>
            <p>3. Exemptions apply only to entities with fewer than 50 employees <span className="bg-success/20 text-success px-1 rounded font-bold">and verified green certifications</span>.</p>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-3xl bg-[#171a21] border border-border mt-6">
        <h3 className="text-lg font-bold text-white mb-4">AI Impact Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#12141d] border border-danger/20">
             <div className="flex items-center gap-2 mb-2 text-danger font-bold text-sm">
               <ShieldAlert className="w-4 h-4" /> Risk to your profile
             </div>
             <p className="text-xs text-textSecondary">As a business owner in the Central District with 80 employees, the new penalty structure could expose you to higher liabilities if offsets are not met.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#12141d] border border-success/20">
             <div className="flex items-center gap-2 mb-2 text-success font-bold text-sm">
               <CheckCircle2 className="w-4 h-4" /> Opportunity
             </div>
             <p className="text-xs text-textSecondary">Acquiring a 'Green Certification' before 2025 could completely exempt your business from this clause under the new amendment.</p>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
