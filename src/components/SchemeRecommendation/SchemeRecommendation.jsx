import React, { useState } from "react";
import { CheckCircle2, AlertOctagon, Clock, Calendar, ShieldCheck, ChevronDown, ChevronUp, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SchemeRecommendation({ schemes }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Recommended Government Schemes</h3>
          <p className="text-[11px] text-slate-400">Personalized programs matched to your demographic and damage assessment profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schemes.map((scheme) => {
          const isEligible = scheme.status.toLowerCase() === "eligible";
          const isExpanded = expandedId === scheme.id;

          return (
            <div
              key={scheme.id}
              className={`bg-white border rounded-2xl p-5 hover:shadow-sm transition-all duration-200 ${
                isEligible ? "border-slate-100" : "border-slate-100 opacity-75"
              }`}
            >
              {/* Top Row: Title & Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">
                    {scheme.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 line-clamp-2">
                    {scheme.description}
                  </p>
                </div>
                
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isEligible
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                }`}>
                  {isEligible ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{scheme.amount}</span>
                    </>
                  ) : (
                    <>
                      <AlertOctagon className="w-3 h-3 text-red-500" />
                      <span>Not Eligible</span>
                    </>
                  )}
                </span>
              </div>

              {/* Middle Row: Meta details */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-50 text-[10px]">
                <div>
                  <span className="text-slate-400 block uppercase font-bold tracking-wider">Priority</span>
                  <span className={`font-semibold ${
                    scheme.priority.toLowerCase() === 'high' ? 'text-red-500' : 'text-slate-700'
                  }`}>
                    {scheme.priority}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold tracking-wider">Approval Time</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {scheme.approvalTime}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold tracking-wider">Deadline</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {scheme.deadline}
                  </span>
                </div>
              </div>

              {/* Bottom Row: Actions */}
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                <button
                  onClick={() => toggleExpand(scheme.id)}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <span>{isExpanded ? "Hide Details" : "View Details & Guide"}</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {isEligible && (
                  <button className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    <span>Apply Guide</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Accordion Expand Area */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100/50 space-y-2 text-[10px]">
                      <div className="flex gap-1.5 items-start">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-700">Scheme Guidelines</p>
                          <p className="text-slate-500 leading-relaxed mt-0.5">{scheme.description}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/55">
                        <p className="font-bold text-slate-700">How to Claim via CivicSync</p>
                        <p className="text-slate-500 leading-relaxed mt-0.5">{scheme.guide}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
