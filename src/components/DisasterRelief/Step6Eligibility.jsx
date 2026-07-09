import React from "react";
import { Check, XCircle, ChevronRight } from "lucide-react";

export default function Step6Eligibility({
  eligibility = {},
  onNext,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-poppins">Eligibility Audit</h3>
          <p className="text-xs text-[#A5A8B5] font-inter">Rules engine verification of regional regulatory requirements</p>
        </div>
        <span className="text-[10px] text-[#F4C95D] bg-[#F4C95D]/10 border border-[#F4C95D]/20 px-2 py-0.5 rounded-full font-bold">
          Step 6 of 9
        </span>
      </div>

      {/* Checklist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(eligibility || {}).map(([key, value], idx) => (
          <div
            key={idx}
            className="p-5 rounded-[20px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] flex flex-col justify-between hover:border-[rgba(255,255,255,0.15)] transition-all duration-300 min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              {/* Gold Checkmark */}
              <div className="w-7 h-7 rounded-[10px] bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E] shrink-0">
                {value ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                    <XCircle className="w-4 h-4 stroke-[3] text-red-500" />
                )}
              </div>
              <span
                  className={`text-[10px] font-bold uppercase tracking-wider font-poppins ${
                    value ? "text-[#22C55E]" : "text-red-500"
                  }`}
                >
                  {value ? "Passed" : "Failed"}
              </span>
            </div>

            <div className="space-y-1 mt-4">
              <h4 className="text-xs font-bold text-white font-poppins">
                {key
                  .replaceAll("_", " ")
                  .replace(/\b\w/g, c => c.toUpperCase())
                }
              </h4>
              <p className="text-[9px] text-[#A5A8B5] leading-normal font-inter">
                {value ? "Requirement verified successfully." : "Requirement not satisfied."}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Step Navigation */}
      <div className="flex justify-end pt-4 border-t border-[rgba(255,255,255,0.05)]">
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] font-bold text-xs rounded-[16px] transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-[0_4px_20px_rgba(244,201,93,0.15)]"
        >
          <span>Verify Documents</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
