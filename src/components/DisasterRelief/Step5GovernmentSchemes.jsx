import React, { useState } from "react";
import { ChevronRight, Clock } from "lucide-react";

export default function Step5GovernmentSchemes({ schemes, onNext, onSelectScheme }) {
  console.log(
  "Schemes received:",
  JSON.stringify(schemes, null, 2)
);

  const [appliedSchemes, setAppliedSchemes] = useState({});

  const handleApply = (schemeObj, id) => {
    if (onSelectScheme && schemeObj) {
      onSelectScheme(schemeObj);
    }
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
        {(!schemes || schemes.length === 0) && (
          <div className="p-10 rounded-xl border border-dashed border-gray-700 text-center">
            <h3 className="text-lg font-bold text-white">
              No Disaster Relief Scheme Found
            </h3>

            <p className="text-gray-400 mt-2">
              No scheme matches the selected disaster, state and damage percentage.
            </p>
          </div>
        )}

        {(schemes || []).map((scheme, idx) => {
          const schemeId = scheme.id || `scheme-${idx}`;
          const isEligible = true;
          const applyState = appliedSchemes[schemeId];
          const name = scheme.schemeName || scheme.name || "Government Relief Scheme";
          const desc = scheme.description || scheme.benefit || "Relief support scheme.";
          const amountStr = scheme.reliefAmount || scheme.amount || "₹95,100";
          const displayAmount = typeof amountStr === "string" ? amountStr : `₹${amountStr.toLocaleString()}`;

          return (
            <div
              key={schemeId}
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
                    {isEligible ? "Eligible" : "Not Eligible"}
                  </span>
                  
                  {isEligible && (
                    <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-space-grotesk flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#F4C95D]" />
                      {scheme.processingDays || 7} Days
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white font-poppins leading-tight">
                  {name}
                </h4>

                <p className="text-[11px] text-[#A5A8B5] leading-relaxed max-w-xl font-inter">
                  <span className="font-semibold text-[#F4C95D]">Reason:</span> {desc}
                </p>
                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">

                  <div>
                    <span className="text-[#A5A8B5]">Damage Range</span>
                    <p className="text-white font-semibold">
                      {scheme.minDamage != null ? `${scheme.minDamage}% - ${scheme.maxDamage ?? 100}%` : "30% - 100%"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[#A5A8B5]">Authority</span>
                    <p className="text-white font-semibold">
                      {scheme.authority || scheme.department || "Ministry of Home Affairs"}
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="text-[#F4C95D] text-xs font-semibold">
                      Required Documents
                    </p>

                    <ul className="mt-1 space-y-1">
                      {(scheme.requiredDocuments || scheme.documents || ["Aadhaar Card", "Bank Passbook", "Damage Photos"]).map((doc) => (
                        <li key={doc} className="text-xs text-[#A5A8B5]">
                          • {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3">
                    <p className="text-[#F4C95D] text-xs font-semibold">
                      Benefits
                    </p>

                    <ul className="mt-1 space-y-1">
                      {(scheme.benefits || [scheme.benefit || "Direct Benefit Transfer to Bank Account", "Immediate Rehabilitation"]).map((item) => (
                        <li key={item} className="text-xs text-[#A5A8B5]">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>

              {/* Right Column: Benefit Amount & Apply */}
              <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[rgba(255,255,255,0.05)]">
                <div className="text-left md:text-right">
                  <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider block font-poppins">Benefit Value</span>
                  <span className="text-lg font-bold text-[#F4C95D] font-space-grotesk block mt-0.5">
                    {displayAmount.startsWith("₹") ? displayAmount : `₹${displayAmount}`}
                  </span>
                </div>

                {isEligible ? (
                  <button
                    onClick={() => handleApply(scheme, schemeId)}
                    disabled={applyState === "completed" || applyState === "applying"}
                    className={`px-5 py-2 rounded-[12px] font-bold text-xs transition-all duration-300 min-w-[100px] border cursor-pointer ${
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
