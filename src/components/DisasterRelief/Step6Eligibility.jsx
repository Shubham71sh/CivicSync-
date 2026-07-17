import React from "react";
import { Check, XCircle, ChevronRight } from "lucide-react";

export default function Step6Eligibility({
  eligibility,
  analysis,
  onNext,
})
{
console.log("Eligibility Data");
console.log(JSON.stringify(eligibility, null, 2));

if (!eligibility || Object.keys(eligibility).length === 0) {
  return (
    <div className="text-center py-10 text-white">
      Loading eligibility...
    </div>
  );
}

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#171923] to-[#0F1118] border border-[rgba(255,255,255,0.08)] p-7">

    <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-[#F4C95D]/10 blur-3xl"></div>

    <div className="flex justify-between items-start relative">

        <div>

            <span className="px-3 py-1 rounded-full bg-[#F4C95D]/10 border border-[#F4C95D]/20 text-[#F4C95D] text-[10px] font-bold tracking-widest uppercase">
                AI VERIFIED
            </span>

            <h2 className="mt-5 text-3xl font-bold text-white font-poppins">
                Eligibility Verification
            </h2>

            <p className="mt-2 text-sm text-[#A5A8B5] max-w-xl">
                CivicSync AI has completed your disaster eligibility assessment by analyzing
                structural damage, disaster severity, government policies and regional relief rules.
            </p>

        </div>

        <div className="flex flex-col items-center">

    <div className="relative w-32 h-32">

        <svg
            className="absolute inset-0 rotate-[-90deg]"
            width="128"
            height="128"
        >
            <circle
                cx="64"
                cy="64"
                r="54"
                stroke="#262B38"
                strokeWidth="8"
                fill="none"
            />

            <circle
                cx="64"
                cy="64"
                r="54"
                stroke="#F4C95D"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="339.3"
                strokeDashoffset="20"
            />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">

            <h2 className="text-4xl font-bold text-white">
                {analysis?.ai_confidence ?? "--"}
            </h2>

            <p className="text-[11px] text-[#A5A8B5] uppercase tracking-widest">
                AI Score
            </p>

        </div>

    </div>

    <div className="mt-4 flex gap-2">

        <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[11px] font-bold">
            VERIFIED
        </span>

        <span className="px-3 py-1 rounded-full bg-[#F4C95D]/10 text-[#F4C95D] text-[11px] font-bold">
           {analysis?.severity ?? "--"}
        </span>

    </div>

</div>

    </div>

</div>

<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

  {/* Eligible */}
  <div className="rounded-[22px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] p-5 hover:border-green-500/30 transition-all">

    <div className="flex justify-between items-center">

      <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center">
        <Check className="w-6 h-6 text-green-500"/>
      </div>

      <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/10 text-green-400 font-bold">
        VERIFIED
      </span>

    </div>

    <p className="mt-6 text-[#A5A8B5] text-xs uppercase tracking-wider">
      Eligibility
    </p>

    <h2 className="mt-2 text-2xl font-bold text-white">
      {eligibility.is_eligible ? "Eligible" : "Not Eligible"}
    </h2>

  </div>


  {/* Scheme */}

  <div className="rounded-[22px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] p-5 hover:border-[#F4C95D]/30 transition-all">

    <p className="text-[#A5A8B5] text-xs uppercase tracking-wider">
      Government Scheme
    </p>

    <h2 className="mt-3 text-lg font-bold text-[#F4C95D] leading-7">
      {eligibility.scheme_name}
    </h2>

    <p className="mt-3 text-xs text-[#A5A8B5]">
      AI matched this scheme using disaster severity.
    </p>

  </div>


  {/* Priority */}

  <div className="rounded-[22px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] p-5 hover:border-red-500/30 transition-all">

    <p className="text-[#A5A8B5] text-xs uppercase tracking-wider">
      Priority
    </p>

    <h2 className="mt-3 text-3xl font-bold text-red-400">
      {analysis?.severity ?? "--"}
    </h2>

    <p className="mt-3 text-xs text-[#A5A8B5]">
      Fast-track processing enabled.
    </p>

  </div>


  {/* Status */}

  <div className="rounded-[22px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] p-5 hover:border-blue-500/30 transition-all">

    <p className="text-[#A5A8B5] text-xs uppercase tracking-wider">
      Verification Status
    </p>

    <h2 className="mt-3 text-2xl font-bold text-blue-400">
      Completed
    </h2>

    <p className="mt-3 text-xs text-[#A5A8B5]">
      AI verification finished successfully.
    </p>

  </div>

</div>


{/* ================= AI Decision Dashboard ================= */}

<div className="w-full">

 
  {/* Why Eligible */}

  <div className="rounded-[22px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] p-6">

    <h3 className="text-lg font-bold text-white mb-5">
      Why are you eligible?
    </h3>

    <div className="space-y-4">

      <div className="flex gap-3">

        <div className="w-3 h-3 rounded-full bg-[#F4C95D] mt-2"></div>

        <div>

          <h4 className="text-white font-semibold">
            Damage Assessment
          </h4>

          <p className="text-sm text-[#A5A8B5]">
            AI detected {analysis?.damage_percent ?? "--"}% structural damage in uploaded evidence.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-3 h-3 rounded-full bg-[#22C55E] mt-2"></div>

        <div>

          <h4 className="text-white font-semibold">
            Government Rules
          </h4>

          <p className="text-sm text-[#A5A8B5]">
            Your damage level satisfies minimum government relief criteria.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-3 h-3 rounded-full bg-blue-400 mt-2"></div>

        <div>

          <h4 className="text-white font-semibold">
            AI Explanation
          </h4>

          <p className="text-sm text-[#A5A8B5]">
            {eligibility.reason}
          </p>

        </div>

      </div>

    </div>

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
