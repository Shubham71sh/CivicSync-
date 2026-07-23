import React from "react";
import { Check, ChevronRight, Clock, User, Phone, Calendar, AlertCircle, MapPin } from "lucide-react";
import { motion } from "framer-motion";

import { getAssignedOfficer, getDynamicDates } from "../../utils/disasterHelpers";

export default function Step8ClaimTimeline({
  timeline = [],
  officer,
  reportId = "",
  onNext,
}) {
  const dynamicOfficer = officer || getAssignedOfficer(reportId);
  const { reportCreatedDate, submissionDate } = getDynamicDates();

  const formattedTimeline = (timeline && timeline.length > 0)
    ? timeline.map((item, index) => ({
        id: index + 1,
        label: item.step || item.title || `Stage ${index + 1}`,
        desc: item.desc || item.description || "",
        date: item.date && item.date !== "Pending" ? item.date : (index === 0 ? submissionDate : index === 1 ? submissionDate : index === 2 ? dynamicOfficer.inspectionDate : "Pending Approval"),
        status: item.status || (index < 2 ? "Completed font-bold" : index === 2 ? "Active" : "Pending"),
        completed: item.status?.toLowerCase() === "completed" || index < 2,
      }))
    : [
        { id: 1, label: "Application Submitted", date: submissionDate, status: "Completed", completed: true },
        { id: 2, label: "AI Damage Assessment", date: submissionDate, status: "Completed", completed: true },
        { id: 3, label: "Officer Field Inspection", date: dynamicOfficer.inspectionDate, status: "Active", completed: false },
        { id: 4, label: "Relief Disbursement", date: "Pending Approval", status: "Upcoming", completed: false },
      ];

  const completedCount = formattedTimeline.filter((s) => s.completed).length;
  const totalStages = formattedTimeline.length || 4;
  const progress = totalStages ? Math.round((completedCount / totalStages) * 100) : 0;
  const currentStage = Math.min(completedCount + 1, totalStages);
  const remainingStages = Math.max(totalStages - completedCount, 0);

  // Dynamic Officer Data handling (never hardcoding static text)
  const officerName = dynamicOfficer.name;
  const officerDesignation = dynamicOfficer.designation || dynamicOfficer.role;
  const officerZone = dynamicOfficer.zone;
  const officerPhone = dynamicOfficer.phone;
  const inspectionDate = dynamicOfficer.inspectionDate;
  const inspectionTime = dynamicOfficer.inspectionTime;
  const officerNote = dynamicOfficer.note || dynamicOfficer.remarks;

  return (
    <div className="space-y-6 font-inter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-poppins">
            Relief Claim Processing Timeline
          </h3>
          <p className="text-xs text-[#A5A8B5] font-inter">
            Real-time status tracking for claim evaluation and field verification
          </p>
        </div>
        <span className="text-[10px] text-[#F4C95D] bg-[#F4C95D]/10 border border-[#F4C95D]/20 px-2 py-0.5 rounded-full font-bold">
          Step 8 of 9
        </span>
      </div>

      {/* Overview Stats Bar */}
      <div className="p-4 bg-[#11131A] rounded-[20px] border border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <span className="text-[10px] text-[#A5A8B5] uppercase tracking-wider font-bold font-poppins block">
              Overall Progress
            </span>
            <p className="text-xs text-white font-semibold font-inter mt-0.5">
              Stage {currentStage} of {totalStages} Active ({completedCount} Completed)
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-md h-2 bg-[#0B0B12] rounded-full overflow-hidden border border-[rgba(255,255,255,0.05)] hidden sm:block">
          <motion.div
            className="h-full bg-gradient-to-r from-[#F4C95D] to-[#22C55E]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>

        <span className="text-sm font-bold text-[#F4C95D] font-space-grotesk shrink-0">
          {remainingStages} Steps Left
        </span>
      </div>

      {/* Horizontal Timeline Stages */}
      <div className="relative overflow-x-auto pb-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {formattedTimeline.map((stage, idx) => {
            const isCompleted = stage.completed;
            const isActive = idx === completedCount && !stage.completed;

            return (
              <div
                key={stage.id}
                className={`p-3.5 rounded-[16px] border flex flex-col items-start gap-2 ${
                  isActive
                    ? "bg-[#171923] border-[#F4C95D]/40"
                    : "bg-[#11131A] border-[rgba(255,255,255,0.06)]"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? "bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E]"
                        : isActive
                        ? "bg-[#F4C95D] text-[#0B0B12]"
                        : "bg-[#0B0B12] text-[#A5A8B5]"
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stage.id}
                  </div>
                  <span
                    className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isCompleted
                        ? "bg-[#22C55E]/10 text-[#22C55E]"
                        : isActive
                        ? "bg-[#F4C95D]/10 text-[#F4C95D]"
                        : "bg-[#0B0B12] text-[#A5A8B5]/60"
                    }`}
                  >
                    {isCompleted ? "Done" : isActive ? "Active" : stage.status}
                  </span>
                </div>

                <div>
                  <h4 className={`text-xs font-bold font-poppins ${isActive ? "text-[#F4C95D]" : "text-white"}`}>
                    {stage.label}
                  </h4>
                  {stage.date && stage.date !== "Pending" && (
                    <p className="text-[9px] text-[#A5A8B5] font-mono mt-0.5">
                      {stage.date}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Officer Card */}
      <div className="p-5 rounded-[20px] bg-[#11131A] border border-[#F4C95D]/20 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-[#F4C95D]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-poppins">
              Assigned Field Verification Officer
            </h4>
          </div>
          <span className="text-[9px] font-bold text-[#F4C95D] uppercase tracking-wider">
            Stage {currentStage} Verification
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Officer Info */}
          <div className="space-y-3 p-3.5 rounded-[14px] bg-[#0B0B12] border border-[rgba(255,255,255,0.05)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F4C95D]/10 border border-[#F4C95D]/20 flex items-center justify-center text-[#F4C95D] shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-white font-poppins">
                  {officerName}
                </h5>
                <p className="text-xs text-[#A5A8B5]">
                  {officerDesignation}
                </p>
                {officerZone && (
                  <p className="text-[10px] text-[#A5A8B5]/70 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#F4C95D]" /> {officerZone}
                  </p>
                )}
              </div>
            </div>

            {officerPhone && (
              <a
                href={`tel:${officerPhone}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#171923] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] transition-all text-xs font-bold text-white"
              >
                <Phone className="w-3.5 h-3.5 text-[#F4C95D]" />
                <span>Call Officer: {officerPhone}</span>
              </a>
            )}
          </div>

          {/* Scheduled Inspection */}
          <div className="space-y-2.5 p-3.5 rounded-[14px] bg-[#0B0B12] border border-[rgba(255,255,255,0.05)]">
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-[#F4C95D] shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider block font-poppins">
                  Scheduled Inspection
                </span>
                <p className="text-xs font-bold text-white font-poppins mt-0.5">
                  {inspectionDate}
                </p>
                <p className="text-[10px] text-[#F4C95D] font-mono">
                  {inspectionTime}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1 border-t border-[rgba(255,255,255,0.04)]">
              <AlertCircle className="w-3.5 h-3.5 text-[#A5A8B5] shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#A5A8B5] leading-relaxed">
                {officerNote}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-end pt-4 border-t border-[rgba(255,255,255,0.05)]">
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] font-bold text-xs rounded-[16px] transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-[0_4px_20px_rgba(244,201,93,0.15)] cursor-pointer"
        >
          <span>Find Nearby Help</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
