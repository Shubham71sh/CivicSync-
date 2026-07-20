import React, { useState } from "react";
import { CheckCircle, XCircle, ChevronRight, Award, Clock } from "lucide-react";

export default function Step5GovernmentSchemes({ schemes, onNext }) {
  console.log(
  "Schemes received:",
  JSON.stringify(schemes, null, 2)
);

  const [appliedSchemes, setAppliedSchemes] = useState({});

  const handleApply = (id) => {
    setAppliedSchemes(prev => ({
      ...prev,
      [id]: "applying"
    }));

    setTimeout(() => {
      setAppliedSchemes(prev => ({
        ...prev,
        [id]: "completed"
      }));
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-poppins">Government Scheme Match</h3>
          <p className="text-xs text-[#A5A8B5] font-inter">Personalized relief schemes mapped to your structural damages and locality parameters</p>
        </div>
        <span className="text-[10px] text-[#F4C95D] bg-[#F4C95D]/10 border border-[#F4C95D]/20 px-2 py-0.5 rounded-full font-bold">
          Step 5 of 9
        </span>
      </div>

      {/* Horizontal Cards Grid */}
      <div className="space-y-4">
      <p className="text-red-500">
  Total Schemes: {schemes.length}
</p>
        {(schemes || []).slice(0, 4).map((scheme) => {
          const isEligible = true;
          const applyState = appliedSchemes[scheme.id];

          return (
            <div
              key={scheme.id}
              className={`p-5 rounded-[20px] bg-[#11131A] border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 ${
                isEligible 
                  ? "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]"
                  : "border-[rgba(255,255,255,0.04)] opacity-60"
              }`}
            >
              {/* Left Column: Scheme Info */}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isEligible
                      ? "bg-[#22C55E]/10 text-[#22C55E]"
                      : "bg-[#EF4444]/10 text-[#EF4444]"
                  }`}>
                    Eligible
                  </span>
                  
                  {isEligible && (
                    <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-space-grotesk flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#F4C95D]" />
                      {scheme.processing_time || "3-7 Days"}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white font-poppins leading-tight">
                  {scheme.name}
                </h4>

                <p className="text-[11px] text-[#A5A8B5] leading-relaxed max-w-xl font-inter">
                  <span className="font-semibold text-[#F4C95D]">Reason:</span> {scheme.benefit}
                </p>
              </div>

              {/* Right Column: Benefit Amount & Apply */}
              <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[rgba(255,255,255,0.05)]">
                <div className="text-left md:text-right">
                  <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider block font-poppins">Benefit Value</span>
                  <span className="text-lg font-bold text-[#F4C95D] font-space-grotesk block mt-0.5">
                    {scheme.amount}
                  </span>
                </div>

                {isEligible ? (
                  <button
                    onClick={() => handleApply(scheme.id)}
                    disabled={applyState === "completed" || applyState === "applying"}
                    className={`px-5 py-2 rounded-[12px] font-bold text-xs transition-all duration-300 min-w-[100px] border ${
                      applyState === "completed"
                        ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30"
                        : applyState === "applying"
                        ? "bg-[#171923] text-white border-[rgba(255,255,255,0.1)]"
                        : "bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] border-transparent shadow-sm"
                    }`}
                  >
                    {applyState === "completed" ? (
                      "Applied"
                    ) : applyState === "applying" ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        Processing
                      </span>
                    ) : (
                      "Apply Now"
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-5 py-2 bg-[#171923] text-[#A5A8B5]/40 border border-[rgba(255,255,255,0.03)] rounded-[12px] font-bold text-xs cursor-not-allowed min-w-[100px]"
                  >
                    Locked
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Navigation */}
      <div className="flex justify-end pt-4 border-t border-[rgba(255,255,255,0.05)]">
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] font-bold text-xs rounded-[16px] transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-[0_4px_20px_rgba(244,201,93,0.15)]"
        >
          <span>Check Eligibility Rules</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
