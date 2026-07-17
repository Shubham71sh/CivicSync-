import React from "react";
import { Check, ChevronRight, Clock, User, Phone, Calendar, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";


// The currently active officer details

export default function Step8ClaimTimeline({
  timeline = [],
  officer,
  onNext,
}) {
  const formattedTimeline = timeline.map((item, index) => ({
    id: index + 1,
    label: item.title,
    desc: "",
    date: item.status,
    completed: item.status?.toLowerCase() === "completed",
  }));

  const completedCount = formattedTimeline.filter(
  (s) => s.completed
).length;

const totalStages = formattedTimeline.length;

const progress = totalStages
  ? Math.round((completedCount / totalStages) * 100)
  : 0;

const currentStage = Math.min(completedCount + 1, totalStages);

const remainingStages = Math.max(totalStages - completedCount, 0);

const officerData = officer;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#171923] to-[#0F1118] border border-[rgba(255,255,255,0.08)] p-7">

    <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-[#F4C95D]/10 blur-3xl"></div>

    <div className="flex justify-between items-start relative">

        <div>

            <span className="px-3 py-1 rounded-full bg-[#F4C95D]/10 border border-[#F4C95D]/20 text-[#F4C95D] text-[10px] font-bold tracking-widest uppercase">
                LIVE CLAIM STATUS
            </span>

            <h2 className="mt-5 text-3xl font-bold text-white">
                Relief Claim Processing
            </h2>

            <p className="mt-3 text-sm text-[#A5A8B5] max-w-xl">
                Your disaster relief request is currently being processed by the government.
                CivicSync AI continuously tracks every approval stage and keeps you updated in real time.
            </p>

        </div>

        <div className="grid grid-cols-2 gap-4">

            <div className="rounded-2xl bg-[#11131A] border border-white/10 px-5 py-4 text-center">

                <p className="text-[10px] uppercase text-[#A5A8B5]">
                    Progress
                </p>

                <h2 className="text-3xl font-bold text-[#F4C95D] mt-2">
                    {progress}%
                </h2>

            </div>

            <div className="rounded-2xl bg-[#11131A] border border-white/10 px-5 py-4 text-center">

                <p className="text-[10px] uppercase text-[#A5A8B5]">
                    ETA
                </p>

                <h2 className="text-3xl font-bold text-green-400 mt-2">
    {remainingStages} Steps Left
</h2>

            </div>

        </div>

    </div>

</div>

      {/* Progress Summary Bar */}
      <div className="p-4 bg-[#11131A] rounded-[20px] border border-[rgba(255,255,255,0.08)] flex items-center gap-4">
        <div className="shrink-0">
          <span className="text-[10px] text-[#A5A8B5] uppercase tracking-wider font-bold font-poppins">
            Overall Progress
          </span>
          <p className="text-xs text-white font-semibold font-inter mt-0.5">
            {completedCount} of {totalStages} stages done
          </p>
        </div>
        <div className="flex-1 h-1.5 bg-[#171923] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#F4C95D] to-[#FFD978]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>
        <span className="text-sm font-bold text-[#F4C95D] font-space-grotesk shrink-0">
          {progress}%
        </span>
      </div>

      {/* Horizontal Timeline */}
      <div className="relative overflow-x-auto pb-2">
        {/* Connector line */}
        <div className="absolute top-[22px] left-8 right-8 h-px bg-[rgba(255,255,255,0.06)] hidden md:block" />

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-3 relative">
          {formattedTimeline.map((stage, idx) => {
            const isCompleted = stage.completed;
            const isNext =
  idx === completedCount &&
  !stage.completed;

            return (
              <div
                key={stage.id}
                className="flex flex-col items-start md:items-center text-left md:text-center gap-2.5 relative"
              >
                {/* Node circle */}
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-300 z-10 relative ${
                    isCompleted
                      ? "bg-[#F4C95D] border-[#F4C95D] shadow-[0_0_16px_rgba(244,201,93,0.35)]"
                      : isNext
                      ? "bg-[#11131A] border-[#F4C95D]/60 shadow-[0_0_10px_rgba(244,201,93,0.12)]"
                      : "bg-[#11131A] border-[rgba(255,255,255,0.08)]"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-[#0B0B12] stroke-[3]" />
                  ) : isNext ? (
                    <Clock className="w-4 h-4 text-[#F4C95D]" />
                  ) : (
                    <span className="text-xs font-bold text-[rgba(255,255,255,0.2)] font-space-grotesk">
                      {stage.id}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  <h4
                    className={`text-[11px] font-bold leading-tight font-poppins ${
                      isCompleted ? "text-white" : isNext ? "text-[#F4C95D]" : "text-[#A5A8B5]"
                    }`}
                  >
                    {stage.label}
                  </h4>
                  <p className="text-[9px] text-[#A5A8B5] leading-normal font-inter hidden md:block">
                    {stage.desc}
                  </p>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider font-space-grotesk ${
                      isCompleted
                        ? "text-[#22C55E]"
                        : isNext
                        ? "text-[#F59E0B]"
                        : "text-[rgba(255,255,255,0.15)]"
                    }`}
                  >
                    {stage.date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Assigned Officer Card ──────────────────────────────── */}
      <div className="p-5 rounded-[20px] bg-[#11131A] border border-[#F4C95D]/20 relative overflow-hidden">
        {/* Subtle gold glow in top-right */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F4C95D]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Card Title */}
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-[#F4C95D]" />
            <span className="text-[10px] font-bold text-[#F4C95D] uppercase tracking-widest font-poppins">
              Currently Active · Stage {currentStage} of {totalStages}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Officer Info */}
            <div className="space-y-3">
              <div>
                <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                  Assigned Officer
                </p>
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#F4C95D]/10 border border-[#F4C95D]/20 flex items-center justify-center text-[#F4C95D] shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-poppins leading-none">
                      {officerData.name}
                    </h4>
                    <p className="text-[10px] text-[#A5A8B5] font-inter mt-0.5">
                      {officerData.role}
                    </p>
                    <p className="text-[9px] text-[#A5A8B5]/70 font-inter">
                      {officerData.zone}
                    </p>
                  </div>
                </div>
              </div>

              <a
                href={`tel:${officerData.phone}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-[#171923] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] transition-all text-xs font-bold text-white"
              >
                <Phone className="w-3.5 h-3.5 text-[#F4C95D]" />
                {officerData.phone}
              </a>
            </div>

            {/* Right: Inspection Schedule */}
            <div className="space-y-3">
              <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                Scheduled Inspection
              </p>

              <div className="flex items-start gap-3 p-3 rounded-[14px] bg-[#F59E0B]/5 border border-[#F59E0B]/20">
                <Calendar className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white font-poppins">
                    {officerData.inspectionDate}
                  </p>
                  <p className="text-[10px] text-[#A5A8B5] font-inter">
                    {officerData.inspectionTime}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-[14px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                <AlertCircle className="w-3.5 h-3.5 text-[#A5A8B5] shrink-0 mt-0.5" />
                <p className="text-[9px] text-[#A5A8B5] leading-relaxed font-inter">
                  {officerData.note}
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
          <span>Find Nearby Help</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
