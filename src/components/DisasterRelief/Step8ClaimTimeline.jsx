import React, { useState } from "react";
import {
  Check,
  ChevronRight,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
  ShieldCheck,
  User,
  MapPin,
  Calendar,
  FileText,
  Building2,
  CreditCard,
  Info,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";

// ── Status helpers ────────────────────────────────────────────────────────────
const STAGE_STATUS = {
  COMPLETED:   "Completed",
  IN_PROGRESS: "In Progress",
  SCHEDULED:   "Scheduled",
  PENDING:     "Pending",
  NOT_STARTED: "Not Started",
};

function getStatusStyle(status) {
  const s = (status || "").toLowerCase();
  if (s === "completed" || s === "complete")
    return {
      dot: "bg-[#22C55E]",
      line: "bg-[#22C55E]/40",
      badge: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/25",
      card: "border-[#22C55E]/15 bg-[#0d1410]",
      icon: "bg-[#22C55E]/10 border-[#22C55E]/25 text-[#22C55E]",
      num:  "bg-[#22C55E] text-[#0B0B12]",
    };
  if (s === "in progress" || s === "active" || s === "current")
    return {
      dot: "bg-[#F4C95D]",
      line: "bg-[rgba(255,255,255,0.08)]",
      badge: "bg-[#F4C95D]/10 text-[#F4C95D] border-[#F4C95D]/25",
      card: "border-[#F4C95D]/25 bg-[#13120a]",
      icon: "bg-[#F4C95D]/10 border-[#F4C95D]/25 text-[#F4C95D]",
      num:  "bg-[#F4C95D] text-[#0B0B12]",
    };
  if (s === "scheduled")
    return {
      dot: "bg-blue-400",
      line: "bg-[rgba(255,255,255,0.08)]",
      badge: "bg-blue-500/10 text-blue-400 border-blue-500/25",
      card: "border-blue-500/15 bg-[#0b0e14]",
      icon: "bg-blue-500/10 border-blue-500/25 text-blue-400",
      num:  "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    };
  // Pending / Not Started
  return {
    dot: "bg-[rgba(255,255,255,0.15)]",
    line: "bg-[rgba(255,255,255,0.06)]",
    badge: "bg-[rgba(255,255,255,0.04)] text-[#A5A8B5] border-[rgba(255,255,255,0.08)]",
    card: "border-[rgba(255,255,255,0.06)] bg-[#11131A]",
    icon: "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[#A5A8B5]",
    num:  "bg-[rgba(255,255,255,0.06)] text-[#A5A8B5] border border-[rgba(255,255,255,0.08)]",
  };
}

// ── Format date ───────────────────────────────────────────────────────────────
function fmt(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const day = String(d.getDate()).padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const h = d.getHours(), m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}, ${h % 12 || 12}:${m} ${ampm}`;
}

// ── Info row inside a stage card ──────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, valueClass = "text-white" }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <div className="w-5 h-5 rounded-[6px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3 h-3 text-[#A5A8B5]" />
      </div>
      <div className="min-w-0">
        <span className="text-[9px] text-[#A5A8B5] uppercase tracking-wider font-bold font-poppins block">
          {label}
        </span>
        <span className={`text-[11px] font-semibold font-inter leading-snug ${valueClass}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ── Placeholder note ──────────────────────────────────────────────────────────
function PendingNote({ text }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
      <Info className="w-3 h-3 text-[#A5A8B5] shrink-0 mt-0.5" />
      <p className="text-[10px] text-[#A5A8B5] font-inter leading-relaxed italic">{text}</p>
    </div>
  );
}

// ── Official RAG Process Section (collapsed) ───────────────────────────────────
function OfficialProcessSection({ stages, topSource, sourceUrl, totalProcessNote, ragLoading }) {
  const [expanded, setExpanded] = useState(false);

  if (ragLoading) {
    return (
      <div className="p-3.5 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)] flex items-center gap-2.5">
        <Loader2 className="w-3.5 h-3.5 text-[#F4C95D] animate-spin shrink-0" />
        <span className="text-[10px] text-[#A5A8B5] font-inter">
          Loading official government process timeline…
        </span>
      </div>
    );
  }

  if (!stages || stages.length === 0) return null;

  return (
    <div className="rounded-[18px] border border-[#22C55E]/15 bg-[#0B0B12] overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
          <span className="text-[10px] font-bold text-[#22C55E] uppercase tracking-wider font-poppins">
            Verified Government Process &amp; Timeline
          </span>
          <span className="text-[9px] font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded-full font-poppins">
            Official Source ✓
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-[#A5A8B5] shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[#A5A8B5] shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[rgba(255,255,255,0.04)]">
          {topSource?.authority && (
            <div className="pt-3 flex flex-wrap items-center gap-2">
              <span className="text-[9px] text-[#A5A8B5] font-poppins uppercase tracking-wider">Source:</span>
              <span className="text-[9px] font-bold text-white font-inter">{topSource.authority}</span>
              {topSource.document && (
                <span className="text-[9px] text-[#A5A8B5] font-inter">— {topSource.document}</span>
              )}
            </div>
          )}
          {totalProcessNote && (
            <p className="text-[10px] text-[#A5A8B5] font-inter leading-relaxed italic border-l-2 border-[#F4C95D] pl-3">
              {totalProcessNote}
            </p>
          )}
          <div className="space-y-2 pt-1">
            {stages.map((stage, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#11131A] border border-[rgba(255,255,255,0.06)] rounded-[14px] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] flex items-center justify-center text-xs font-bold font-poppins shrink-0 mt-0.5">
                    {stage.step_number || (idx + 1)}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white font-poppins">
                      {stage.stage_name || `Stage ${stage.step_number || (idx + 1)}`}
                    </h5>
                    {stage.description && (
                      <p className="text-[10px] text-[#A5A8B5] font-inter leading-relaxed mt-0.5">
                        {stage.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex flex-wrap gap-2 sm:flex-col sm:items-end text-right border-t sm:border-t-0 border-[rgba(255,255,255,0.04)] pt-2 sm:pt-0">
                  {stage.typical_duration && (
                    <div>
                      <span className="text-[8px] text-[#A5A8B5] font-bold uppercase tracking-wider block font-poppins">Typical Duration</span>
                      <span className="text-[10px] font-bold text-[#F4C95D] font-space-grotesk">{stage.typical_duration}</span>
                    </div>
                  )}
                  {stage.authority && (
                    <span className="text-[9px] text-[#A5A8B5]/80 font-inter">
                      Auth: <strong className="text-white">{stage.authority}</strong>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {sourceUrl && (
            <div className="pt-1">
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[9px] text-[#22C55E] hover:text-[#4ADE80] font-bold transition-colors">
                <ExternalLink className="w-2.5 h-2.5" />
                View Official Process Guidelines
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stage Card ────────────────────────────────────────────────────────────────
function StageCard({ number, title, status, icon: Icon, children, isLast }) {
  const style = getStatusStyle(status);
  const isCompleted = (status || "").toLowerCase() === "completed" || (status || "").toLowerCase() === "complete";

  return (
    <div className="flex gap-4">
      {/* Left: connector line + dot */}
      <div className="flex flex-col items-center gap-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black font-poppins shrink-0 ${style.num}`}>
          {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : number}
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 mt-1 min-h-[32px] ${style.line}`} />
        )}
      </div>

      {/* Right: card */}
      <div className={`flex-1 mb-5 border rounded-[18px] p-5 ${style.card} transition-all`}>
        {/* Stage header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center border ${style.icon}`}>
              <Icon className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white font-poppins uppercase tracking-wide">
              {title}
            </h4>
          </div>
          <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider font-poppins ${style.badge}`}>
            {status}
          </span>
        </div>

        {/* Content */}
        <div className="space-y-3 pl-0">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Document status counts from docList ───────────────────────────────────────
function getDocCounts(docList) {
  if (!Array.isArray(docList) || docList.length === 0) return null;
  const verified = docList.filter(d => d.status === "Verified").length;
  const pending  = docList.filter(d => d.status === "Pending Verification" || d.status === "Uploaded" || d.status === "Verifying").length;
  const rejected = docList.filter(d => d.status === "Rejected").length;
  const missing  = docList.filter(d => d.status === "Required").length;
  return { verified, pending, rejected, missing, total: docList.length };
}

// ── Determine overall claim status from docList ───────────────────────────────
function deriveCurrentStatus(docList) {
  const counts = getDocCounts(docList);
  if (!counts) return { stageIndex: 0, label: "Application Submitted" };
  if (counts.missing > 0) return { stageIndex: 1, label: "Document Submission" };
  if (counts.pending > 0 || counts.rejected > 0) return { stageIndex: 1, label: "Document Verification" };
  return { stageIndex: 2, label: "Document Verification" };
}

// ── Main Step8 Component ───────────────────────────────────────────────────────
export default function Step8ClaimTimeline({
  timeline = [],
  officer,
  reportId = "",
  selectedScheme = "",
  selectedDisaster = "",
  docList = [],
  onNext,
  ragData,
  ragLoading,
}) {
  // ── RAG data ──────────────────────────────────────────────────────────────
  const ragResult = ragData?.data || {};
  const sources = ragData?.sources || [];
  const topSource = sources[0] || {};
  const stages = Array.isArray(ragResult?.stages) ? ragResult.stages : [];
  const sourceUrl = ragResult?.source_url || topSource.url || "";
  const totalProcessNote = ragResult?.total_process_note || "";

  // ── Derive current status from document state ─────────────────────────────
  const docCounts = getDocCounts(docList);
  const currentStatus = deriveCurrentStatus(docList);

  // ── Officer data ──────────────────────────────────────────────────────────
  const hasOfficer = !!(officer && officer.name);
  const officerName = officer?.name || null;
  const officerDesignation = officer?.designation || officer?.role || null;
  const officerDepartment = officer?.department || null;
  const officerPhone = officer?.phone || null;
  const officerZone = officer?.zone || null;
  const officerInspDate = officer?.inspectionDate || null;
  const officerInspTime = officer?.inspectionTime || null;
  const officerNote = officer?.note || officer?.remarks || null;

  // ── Application submission time ───────────────────────────────────────────
  const submissionTime = fmt(new Date());

  // ── Stage statuses (data-driven) ──────────────────────────────────────────
  // Stage 1 — Application Submission: always completed (user is on Step 8)
  // Stage 2 — Document Verification: in progress or completed based on docList
  // Stage 3 — Field Inspection: scheduled if officer assigned, else pending
  // Stage 4 — Authority Review: pending
  // Stage 5 — Approval / Sanction: pending
  // Stage 6 — Disbursement: pending

  const stage1Status = STAGE_STATUS.COMPLETED;
  const stage2Status = (() => {
    if (!docCounts) return STAGE_STATUS.IN_PROGRESS;
    if (docCounts.missing > 0) return STAGE_STATUS.IN_PROGRESS;
    if (docCounts.pending > 0 || docCounts.rejected > 0) return STAGE_STATUS.IN_PROGRESS;
    if (docCounts.verified === docCounts.total) return STAGE_STATUS.COMPLETED;
    return STAGE_STATUS.IN_PROGRESS;
  })();
  const hasInspection = !!(officerInspDate && officerInspDate !== "Not scheduled yet" && officerInspDate !== "Inspection not scheduled yet");
  const stage3Status = hasOfficer
    ? (hasInspection ? STAGE_STATUS.SCHEDULED : STAGE_STATUS.IN_PROGRESS)
    : STAGE_STATUS.PENDING;
  const stage4Status = STAGE_STATUS.PENDING;
  const stage5Status = STAGE_STATUS.PENDING;
  const stage6Status = STAGE_STATUS.PENDING;

  const completedCount = [stage1Status, stage2Status, stage3Status, stage4Status, stage5Status, stage6Status]
    .filter(s => s === STAGE_STATUS.COMPLETED).length;
  const totalStages = 6;

  // Next action
  const nextAction = (() => {
    if (stage2Status === STAGE_STATUS.IN_PROGRESS && docCounts?.missing > 0)
      return `Upload ${docCounts.missing} remaining required document${docCounts.missing > 1 ? "s" : ""}`;
    if (stage2Status === STAGE_STATUS.IN_PROGRESS)
      return "Await document verification by assigned officer";
    if (stage3Status === STAGE_STATUS.SCHEDULED && hasInspection)
      return `Be present at your property on ${officerInspDate} (${officerInspTime || "scheduled slot"}) for field inspection`;
    if (hasOfficer && !hasInspection)
      return `Await field inspection date scheduling by ${officerName || "assigned officer"}`;
    if (stage3Status === STAGE_STATUS.PENDING)
      return "Await field inspection officer assignment by competent authority";
    return "Await authority review and approval decision";
  })();

  // Scheme display
  const schemeDisplay = selectedScheme || "Government Relief Scheme";
  const disasterDisplay = selectedDisaster || "Disaster";
  const appId = reportId || "REP-XXXXXX";

  return (
    <div className="space-y-6 font-inter">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-wider font-poppins">
            Relief Claim Processing Timeline
          </h3>
          <p className="text-xs text-[#A5A8B5] font-inter mt-0.5">
            Track every stage of your disaster relief application
          </p>
        </div>
        <span className="text-[10px] text-[#F4C95D] bg-[#F4C95D]/10 border border-[#F4C95D]/20 px-2.5 py-0.5 rounded-full font-bold font-poppins shrink-0">
          Step 8 of 9
        </span>
      </div>

      {/* ── Application context card ─────────────────────────────────── */}
      <div className="p-4 bg-[#11131A] border border-[rgba(255,255,255,0.08)] rounded-[20px] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <p className="text-[9px] text-[#A5A8B5] uppercase tracking-wider font-bold font-poppins">Application ID</p>
            <p className="text-sm font-bold text-[#F4C95D] font-mono mt-0.5">{appId}</p>
          </div>
          <div>
            <p className="text-[9px] text-[#A5A8B5] uppercase tracking-wider font-bold font-poppins">Disaster Type</p>
            <p className="text-sm font-bold text-white font-poppins mt-0.5 capitalize">{disasterDisplay}</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-[9px] text-[#A5A8B5] uppercase tracking-wider font-bold font-poppins">Selected Scheme</p>
            <p className="text-xs font-bold text-white font-inter mt-0.5 leading-snug">{schemeDisplay}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="border-t border-[rgba(255,255,255,0.05)] pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#A5A8B5] font-bold font-poppins uppercase tracking-wider">Overall Progress</span>
              <span className="text-[10px] font-bold text-white font-poppins">{completedCount} / {totalStages} stages completed</span>
            </div>
            <span className="text-xs font-bold text-[#F4C95D] font-space-grotesk">{Math.round((completedCount / totalStages) * 100)}%</span>
          </div>
          <div className="h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden border border-[rgba(255,255,255,0.04)]">
            <motion.div
              className="h-full bg-gradient-to-r from-[#F4C95D] to-[#22C55E] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / totalStages) * 100}%` }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          </div>
          <div className="flex items-start gap-2 pt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F4C95D] shrink-0 mt-1" />
            <div>
              <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins">Next Action: </span>
              <span className="text-[11px] text-white font-inter font-semibold leading-snug">{nextAction}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Vertical Timeline ─────────────────────────────────────────── */}
      <div className="space-y-0 pt-2">

        {/* ─── Stage 1: APPLICATION SUBMISSION ─── */}
        <StageCard number={1} title="Application Submission" status={stage1Status} icon={FileText} isLast={false}>
          <InfoRow icon={Calendar} label="Completed On" value={submissionTime} valueClass="text-[#22C55E]" />
          <InfoRow icon={Building2} label="Responsible" value="CivicSync Application System" />
          <div className="p-3 rounded-[12px] bg-[rgba(34,197,94,0.05)] border border-[#22C55E]/15">
            <p className="text-[11px] text-[#A5A8B5] font-inter leading-relaxed">
              Your disaster relief application and required documents were submitted through CivicSync.
              The case has been registered with Application ID <strong className="text-white font-mono">{appId}</strong>.
            </p>
          </div>
        </StageCard>

        {/* ─── Stage 2: DOCUMENT VERIFICATION ─── */}
        <StageCard number={2} title="Document Verification" status={stage2Status} icon={ShieldCheck} isLast={false}>
          <InfoRow
            icon={Building2}
            label="Responsible"
            value={hasOfficer ? `${officerName} — ${officerDesignation || "Verification Officer"}` : "Assigned Verification Officer"}
            valueClass={hasOfficer ? "text-white" : "text-[#A5A8B5]"}
          />
          <div className="p-3 rounded-[12px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
            <p className="text-[11px] text-[#A5A8B5] font-inter leading-relaxed mb-2">
              Submitted documents are checked against the required document list for the selected government scheme.
            </p>
            {docCounts ? (
              <div className="flex flex-wrap gap-2">
                {docCounts.verified > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] font-poppins">
                    {docCounts.verified} Verified
                  </span>
                )}
                {docCounts.pending > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-poppins">
                    {docCounts.pending} Pending Verification
                  </span>
                )}
                {docCounts.rejected > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-poppins">
                    {docCounts.rejected} Rejected
                  </span>
                )}
                {docCounts.missing > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-poppins">
                    {docCounts.missing} Not Uploaded
                  </span>
                )}
              </div>
            ) : (
              <PendingNote text="Document status will appear here after upload." />
            )}
          </div>
          {stage2Status === STAGE_STATUS.IN_PROGRESS && docCounts?.missing > 0 && (
            <div className="flex items-start gap-2 p-2.5 rounded-[10px] bg-amber-500/5 border border-amber-500/20">
              <AlertCircle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-400 font-inter leading-relaxed">
                <strong>{docCounts.missing} required document{docCounts.missing > 1 ? "s" : ""} still need{docCounts.missing === 1 ? "s" : ""} to be uploaded.</strong> Go back to Step 7 to complete your document submission.
              </p>
            </div>
          )}
        </StageCard>

        {/* ─── Stage 3: FIELD INSPECTION ─── */}
        <StageCard number={3} title="Field Inspection" status={stage3Status} icon={MapPin} isLast={false}>
          {hasOfficer ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow icon={User} label="Officer Status" value="Officer Assigned" valueClass="text-[#22C55E] font-bold" />
                <InfoRow icon={User} label="Assigned Officer" value={officerName} valueClass="text-[#F4C95D]" />
                <InfoRow icon={Building2} label="Designation" value={officerDesignation || "Field Verification Officer"} />
                <InfoRow icon={Building2} label="Department" value={officerDepartment || "Revenue & Disaster Management"} />
                {officerPhone && <InfoRow icon={Phone} label="Contact" value={officerPhone} />}
                {officerZone && <InfoRow icon={MapPin} label="Zone / Area" value={officerZone} />}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                {hasInspection ? (
                  <>
                    <InfoRow icon={Calendar} label="Inspection Status" value="Inspection Scheduled" valueClass="text-[#22C55E] font-bold" />
                    <InfoRow icon={Calendar} label="Inspection Date" value={officerInspDate} valueClass="text-[#F4C95D] font-bold" />
                    {officerInspTime && (
                      <InfoRow icon={Clock} label="Inspection Time" value={officerInspTime} valueClass="text-[#F4C95D] font-bold" />
                    )}
                  </>
                ) : (
                  <>
                    <InfoRow icon={Calendar} label="Inspection Status" value="Inspection Not Scheduled" valueClass="text-[#F4C95D] font-bold" />
                    <InfoRow icon={Calendar} label="Inspection Date" value="Inspection not scheduled yet" valueClass="text-[#A5A8B5] italic" />
                  </>
                )}
              </div>
              <div className="p-3 rounded-[12px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                <p className="text-[10px] font-bold text-[#A5A8B5] uppercase tracking-wider font-poppins mb-2">What the officer will verify:</p>
                <ul className="space-y-1">
                  {[
                    "Damage reported in the application against physical condition",
                    "Property / location as stated in the application",
                    "Supporting photographic and documentary evidence",
                    "Eligibility conditions as per the selected government scheme",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[10px] text-[#A5A8B5] font-inter">
                      <span className="w-1 h-1 rounded-full bg-[#F4C95D] shrink-0 mt-1.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {officerNote && (
                <div className="flex items-start gap-2 p-2.5 rounded-[10px] bg-[#F4C95D]/5 border border-[#F4C95D]/15">
                  <Info className="w-3 h-3 text-[#F4C95D] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[#F4C95D] font-inter leading-relaxed">{officerNote}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                <InfoRow icon={User} label="Officer Status" value="Officer Not Assigned" valueClass="text-[#A5A8B5]" />
                <InfoRow icon={Calendar} label="Inspection Status" value="Inspection Not Scheduled" valueClass="text-[#A5A8B5]" />
              </div>
              <PendingNote text="Officer not assigned yet. Assignment will appear here once the competent authority assigns a field inspection officer." />
              <div className="p-3 rounded-[12px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                <p className="text-[10px] font-bold text-[#A5A8B5] uppercase tracking-wider font-poppins mb-2">What will happen at inspection:</p>
                <ul className="space-y-1">
                  {[
                    "An officer will be assigned by the District Administration",
                    "Physical verification of reported damage at your location",
                    "Cross-verification of documents submitted with the application",
                    "Eligibility confirmation as per the selected government scheme",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[10px] text-[#A5A8B5] font-inter">
                      <span className="w-1 h-1 rounded-full bg-[#A5A8B5]/40 shrink-0 mt-1.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </StageCard>

        {/* ─── Stage 4: DISTRICT / AUTHORITY REVIEW ─── */}
        <StageCard number={4} title="District / Authority Review" status={stage4Status} icon={Building2} isLast={false}>
          <InfoRow icon={Building2} label="Responsible Authority" value="District Collector / Competent Authority" />
          <div className="p-3 rounded-[12px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
            <p className="text-[11px] text-[#A5A8B5] font-inter leading-relaxed">
              The field inspection report and your application are reviewed by the competent government authority.
              The review determines the final relief quantum and verifies all submitted claims against official records.
            </p>
          </div>
          <InfoRow icon={Clock} label="Expected Duration" value="7 – 14 working days after field inspection" valueClass="text-[#A5A8B5]" />
          <PendingNote text="Awaiting authority action. This stage begins after field inspection is completed." />
        </StageCard>

        {/* ─── Stage 5: APPROVAL / SANCTION ─── */}
        <StageCard number={5} title="Approval / Sanction" status={stage5Status} icon={Check} isLast={false}>
          <InfoRow icon={Building2} label="Responsible Authority" value="State Relief Commissioner / District Sanction Committee" />
          <div className="p-3 rounded-[12px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
            <p className="text-[11px] text-[#A5A8B5] font-inter leading-relaxed">
              The competent authority makes the final relief decision based on the inspection report, submitted documents,
              and the applicable government scheme rules (SDRF/NDRF/State Scheme). A Sanction Order is issued if approved.
            </p>
          </div>
          <InfoRow icon={Clock} label="Expected Duration" value="3 – 7 working days after authority review" valueClass="text-[#A5A8B5]" />
          <PendingNote text="Awaiting authority action. No action required from your side at this stage." />
        </StageCard>

        {/* ─── Stage 6: DISBURSEMENT ─── */}
        <StageCard number={6} title="Relief Disbursement" status={stage6Status} icon={CreditCard} isLast={true}>
          <InfoRow icon={CreditCard} label="Payment Method" value="Direct Benefit Transfer (DBT) to registered bank account" />
          <InfoRow icon={User} label="Beneficiary" value="As per application (bank account linked to Aadhaar)" />
          <div className="p-3 rounded-[12px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
            <p className="text-[11px] text-[#A5A8B5] font-inter leading-relaxed">
              Upon sanction order, the relief amount is transferred directly to your linked bank account.
              You will receive an SMS notification on your registered mobile number once the transfer is initiated.
            </p>
          </div>
          <InfoRow icon={Clock} label="Expected" value="After approval sanction order — typically 5 – 10 working days" valueClass="text-[#A5A8B5]" />
          <PendingNote text="Disbursement is pending. Ensure your bank account details and Aadhaar are correctly linked." />
        </StageCard>

      </div>

      {/* ── Disclaimer ────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2.5 p-3 rounded-[12px] bg-[#171923] border border-[rgba(255,255,255,0.05)]">
        <Info className="w-3.5 h-3.5 text-[#A5A8B5] shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#A5A8B5] font-inter leading-relaxed">
          The timeline above reflects your <strong className="text-white">CivicSync application progress</strong>.
          Actual government claim processing timelines are determined by the District Administration and may vary.
          Dates shown for inspection and review are indicative — you will be notified through official channels.
        </p>
      </div>

      {/* ── Official Government Process (RAG, collapsed) ─────────────── */}
      <OfficialProcessSection
        stages={stages}
        topSource={topSource}
        sourceUrl={sourceUrl}
        totalProcessNote={totalProcessNote}
        ragLoading={ragLoading}
      />

      {/* ── Navigation ───────────────────────────────────────────────── */}
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
