import React from "react";
import { Check, XCircle, ChevronRight } from "lucide-react";

export default function Step6Eligibility({
  eligibility = {},
  onNext,
}) 
{
console.log("Eligibility Data");
console.log(JSON.stringify(eligibility, null, 2));
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

  {/* Eligibility */}
  <div className="p-5 rounded-[20px] bg-[#11131A] border border-[rgba(255,255,255,0.08)]">
    <div className="flex items-center justify-between mb-4">
      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
        {eligibility.is_eligible ? (
          <Check className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
      </div>

      <span
        className={`text-xs font-bold ${
          eligibility.is_eligible
            ? "text-green-500"
            : "text-red-500"
        }`}
      >
        {eligibility.is_eligible ? "PASSED" : "FAILED"}
      </span>
    </div>

    <h4 className="text-sm font-bold text-white">
      Eligibility
    </h4>

    <p className="text-xs text-[#A5A8B5] mt-2">
      {eligibility.is_eligible
        ? "You are eligible for relief."
        : "You are not eligible."}
    </p>
  </div>

  {/* Scheme */}
  <div className="p-5 rounded-[20px] bg-[#11131A] border border-[rgba(255,255,255,0.08)]">

    <h4 className="text-sm font-bold text-white mb-3">
      Scheme
    </h4>

    <p className="text-[#F4C95D] font-semibold">
      {eligibility.scheme_name}
    </p>

  </div>

  {/* Reason */}
  <div className="p-5 rounded-[20px] bg-[#11131A] border border-[rgba(255,255,255,0.08)]">

    <h4 className="text-sm font-bold text-white mb-3">
      Reason
    </h4>

    <p className="text-xs text-[#A5A8B5] leading-6">
      {eligibility.reason}
    </p>

  </div>

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
