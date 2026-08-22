import React, { useState } from "react";
import {
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  Loader2,
  AlertCircle,
  Info,
  FileText,
  X,
  Check,
  ArrowRight,
  Star,
} from "lucide-react";

// Match rank labels by position in RAG results
const MATCH_LABELS = ["Primary Match", "Strong Match", "Relevant Match"];
const MATCH_COLORS = [
  "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20",
  "bg-[#F4C95D]/10 text-[#F4C95D] border-[#F4C95D]/20",
  "bg-[#A5A8B5]/10 text-[#A5A8B5] border-[#A5A8B5]/20",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getSchemeId(scheme) {
  return scheme.id || scheme.scheme_id || "";
}

// ── Clean Scheme Summary Card ─────────────────────────────────────────────────
function VerifiedSchemeCard({
  scheme,
  rank,
  isApplied,
  appliedCount,
  onToggle,
  onViewDetails,
  onViewProcess,
}) {
  const name =
    scheme.name || scheme.official_name || scheme.scheme_name || "Government Relief Provision";
  const authority =
    scheme.source_authority || scheme.authority || "Ministry of Home Affairs / NDMA";
  const verified = scheme.verified !== false;
  const explanation = scheme.explanation || scheme.relevance || "";
  const disasterType = scheme.applicable_disaster || scheme.disaster_type || "";
  const benefit =
    scheme.relief_amount || scheme.benefit_amount || scheme.reliefAmount || "";

  const displayBenefit = benefit
    ? typeof benefit === "string" && benefit.includes("₹")
      ? benefit
      : `₹${benefit}`
    : "As per govt. norms";

  const matchLabel = MATCH_LABELS[rank] || "Relevant Match";
  const matchColor = MATCH_COLORS[rank] || MATCH_COLORS[2];
  const hasApplicationUrl = !!scheme.application_url;

  const shortExplanation = explanation
    ? explanation.length > 110
      ? explanation.slice(0, 107) + "…"
      : explanation
    : "Matched based on your reported disaster, damage type, and location.";

  return (
    <div
      className={`p-5 rounded-[20px] bg-[#11131A] border flex flex-col gap-4 transition-all duration-200 ${
        isApplied
          ? "border-[#F4C95D] bg-[#F4C95D]/5 shadow-[0_0_24px_rgba(244,201,93,0.08)]"
          : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] hover:bg-[#141720]"
      }`}
    >
      {/* Top row: badges */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {verified && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 px-2 py-0.5 rounded-full font-poppins">
              <ShieldCheck className="w-3 h-3" />
              VERIFIED GOVT. SOURCE
            </span>
          )}
          <span
            className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border font-poppins uppercase tracking-wider ${matchColor}`}
          >
            {matchLabel}
          </span>
        </div>
        {isApplied && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#22C55E] font-poppins shrink-0">
            <Check className="w-3.5 h-3.5" /> Applied
          </span>
        )}
      </div>

      {/* Scheme name */}
      <h4 className="text-sm md:text-[15px] font-bold text-white font-poppins leading-snug">
        {name}
      </h4>

      {/* Key info row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 border-t border-b border-[rgba(255,255,255,0.05)]">
        <div className="space-y-0.5">
          <span className="text-[9px] uppercase font-bold text-[#A5A8B5]/50 block tracking-wider">
            Disaster
          </span>
          <span className="text-xs font-semibold text-white capitalize flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F4C95D] shrink-0" />
            {disasterType || "—"}
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[9px] uppercase font-bold text-[#A5A8B5]/50 block tracking-wider">
            Authority
          </span>
          <span className="text-xs font-semibold text-white leading-tight line-clamp-2">
            {authority}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-0.5">
          <span className="text-[9px] uppercase font-bold text-[#A5A8B5]/50 block tracking-wider">
            Applicable Benefit
          </span>
          <span className="text-base font-black text-[#F4C95D] font-space-grotesk block leading-tight">
            {displayBenefit}
          </span>
        </div>
      </div>

      {/* Why matched — short */}
      <p className="text-[11px] text-[#A5A8B5] leading-relaxed font-inter line-clamp-2">
        <span className="text-[#A5A8B5]/50 font-bold uppercase text-[9px] tracking-wider mr-1.5">
          Why matched —
        </span>
        {shortExplanation}
      </p>

      {/* Actions */}
      <div
        className="flex items-center justify-between gap-2 pt-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(scheme)}
            className="px-3.5 py-2 rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[#171923] hover:bg-[#202330] text-[11px] font-bold text-[#A5A8B5] hover:text-white transition-all cursor-pointer font-poppins"
          >
            View Details
          </button>

          {!hasApplicationUrl && (
            <button
              onClick={() => {
                onToggle(scheme);
                onViewProcess(scheme);
              }}
              className="px-3.5 py-2 rounded-[12px] bg-[#F4C95D]/10 hover:bg-[#F4C95D]/20 text-[#F4C95D] border border-[#F4C95D]/30 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer font-poppins flex items-center gap-1.5"
            >
              Official Process
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Toggle APPLY / ✓ APPLIED */}
        {isApplied ? (
          <button
            onClick={() => onToggle(scheme)}
            className="px-4 py-2 rounded-[12px] bg-[#22C55E]/10 hover:bg-red-500/10 text-[#22C55E] hover:text-red-400 border border-[#22C55E]/30 hover:border-red-500/30 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer font-poppins flex items-center gap-1.5"
          >
            <Check className="w-3 h-3" />
            ✓ APPLIED
          </button>
        ) : (
          <button
            onClick={() => onToggle(scheme)}
            className="px-4 py-2 rounded-[12px] bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] text-[11px] font-bold uppercase tracking-wider transition-all font-poppins flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            Apply
          </button>
        )}
      </div>
    </div>
  );
}

// ── Scheme Details Modal ──────────────────────────────────────────────────────
function SchemeDetailsModal({ scheme, onClose, activeTab, setActiveTab }) {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!scheme) return null;

  const name =
    scheme.name || scheme.official_name || scheme.scheme_name || "Government Relief Provision";
  const authority =
    scheme.source_authority || scheme.authority || "Ministry of Home Affairs / NDMA";
  const verified = scheme.verified !== false;
  const matchRank = scheme._rank || 0;
  const matchLabel = MATCH_LABELS[matchRank] || "Relevant Match";
  const matchColor = MATCH_COLORS[matchRank] || MATCH_COLORS[2];
  const documentName = scheme.document_name || "Official guidelines document";
  const sourceUrl = scheme.source_url || scheme.official_source_url || "";
  const date = scheme.document_date || "";
  const hasApplicationUrl = !!scheme.application_url;
  const benefits = Array.isArray(scheme.benefits) ? scheme.benefits : [];
  const requiredDocuments = Array.isArray(scheme.required_documents)
    ? scheme.required_documents
    : Array.isArray(scheme.requiredDocuments)
    ? scheme.requiredDocuments
    : [];

  const rawBenefit =
    scheme.relief_amount || scheme.benefit_amount || scheme.reliefAmount || "";
  const displayBenefitFormatted = rawBenefit
    ? typeof rawBenefit === "string" && rawBenefit.includes("₹")
      ? rawBenefit
      : `₹${rawBenefit}`
    : "As per applicable government norms";

  const explanation =
    scheme.explanation || scheme.relevance || scheme.description || "";
  const eligibilitySummary =
    scheme.eligibility_summary || scheme.eligibility || "";
  const disasterType = scheme.applicable_disaster || scheme.disaster_type || "";

  const TABS = ["Overview", "Eligibility", "Benefit", "Documents", "Process"];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-2xl lg:max-w-3xl max-h-[96vh] sm:max-h-[88vh] flex flex-col bg-[#11131A] sm:rounded-[24px] border border-[rgba(255,255,255,0.08)] shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden animate-modalSlideUp">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[rgba(255,255,255,0.06)] bg-[#0E1017] shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-[10px] text-[#A5A8B5] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-wrap mb-3 pr-10">
            {verified && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 px-2 py-0.5 rounded-full font-poppins">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED GOVERNMENT SOURCE
              </span>
            )}
            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border font-poppins uppercase tracking-wider ${matchColor}`}>
              {matchLabel}
            </span>
          </div>
          <h2 className="text-base md:text-lg font-bold text-white font-poppins leading-snug pr-10 mb-1">
            {name}
          </h2>
          <p className="text-[11px] text-[#A5A8B5] font-inter">
            <span className="text-[9px] uppercase font-bold text-[#A5A8B5]/50 tracking-wider mr-1.5">Authority</span>
            <span className="text-white/80 font-medium">{authority}</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[rgba(255,255,255,0.05)] px-5 bg-[#0E1017] overflow-x-auto scrollbar-none shrink-0">
          {TABS.map((tab) => {
            const tabId = tab.toLowerCase();
            const isActive = activeTab === tabId;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tabId)}
                className={`px-4 py-3 text-[11px] font-bold font-poppins whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-[#F4C95D] text-[#F4C95D]"
                    : "border-transparent text-[#A5A8B5] hover:text-white"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 font-inter text-xs leading-relaxed">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h5 className="text-[9px] uppercase font-bold text-[#F4C95D] tracking-widest font-poppins">About this Provision</h5>
                <p className="text-white/90 font-medium text-[13px] leading-relaxed">
                  {explanation || "Financial assistance may be available to households whose property has been damaged, subject to official assessment and government norms."}
                </p>
              </div>
              <div className="space-y-3">
                <h5 className="text-[9px] uppercase font-bold text-[#F4C95D] tracking-widest font-poppins">Why This Matched You</h5>
                <div className="grid gap-2">
                  {[
                    `Administered under official ${authority} guidelines.`,
                    `Benefit of ${displayBenefitFormatted} according to notified norms.`,
                    `Applies to verified ${disasterType || "disaster"} occurrences in your reported area.`,
                    "Subject to field damage assessment by competent local revenue authorities.",
                    "Final eligibility and disbursement determined by the government authority.",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-[#22C55E] shrink-0 text-sm font-bold mt-0.5">✓</span>
                      <span className="text-[#A5A8B5] text-[12px] leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "eligibility" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h5 className="text-[9px] uppercase font-bold text-[#F4C95D] tracking-widest font-poppins">Who Can Apply?</h5>
                <p className="text-white/90 font-medium text-[13px] leading-relaxed">
                  {eligibilitySummary || "Households whose residential property is in the officially declared disaster-affected area and whose damage is certified by the competent revenue authority."}
                </p>
              </div>
              <div className="space-y-2">
                <h5 className="text-[9px] uppercase font-bold text-[#A5A8B5]/50 tracking-widest font-poppins">Assessed Conditions</h5>
                {[
                  `Applies specifically to verified ${disasterType || "disaster"} occurrences.`,
                  "Must be the owner or certified occupant of the damaged structure.",
                  "Commercial, industrial, or unauthorized structures are typically excluded.",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-2 px-3 rounded-[10px] bg-[#0B0B12] border border-[rgba(255,255,255,0.03)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F4C95D] shrink-0 mt-1.5" />
                    <span className="text-[#A5A8B5] text-[12px] leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2.5 p-3.5 rounded-[12px] bg-[#F4C95D]/5 border border-[#F4C95D]/20">
                <Info className="w-4 h-4 text-[#F4C95D] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#A5A8B5] leading-relaxed">
                  <strong className="text-white block mb-0.5">Eligibility Disclaimer</strong>
                  Final eligibility is determined solely by the competent government authority after official damage assessment.
                </p>
              </div>
            </div>
          )}

          {activeTab === "benefit" && (
            <div className="space-y-6">
              <div className="p-5 rounded-[16px] bg-[#F4C95D]/5 border border-[#F4C95D]/20 text-center space-y-1">
                <span className="text-[9px] uppercase font-bold text-[#F4C95D]/70 tracking-widest font-poppins block">Applicable Benefit Amount</span>
                <div className="text-3xl md:text-4xl font-black text-[#F4C95D] font-space-grotesk leading-none py-1">
                  {displayBenefitFormatted}
                </div>
                <p className="text-[10px] text-[#A5A8B5] font-inter">As per notified government norms — subject to assessment</p>
              </div>
              <div className="space-y-2">
                <h5 className="text-[9px] uppercase font-bold text-[#F4C95D] tracking-widest font-poppins">Benefit Details</h5>
                {benefits.length > 0 ? (
                  <ul className="space-y-2">
                    {benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 py-2 px-3 rounded-[10px] bg-[#0B0B12] border border-[rgba(255,255,255,0.03)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F4C95D] shrink-0 mt-1.5" />
                        <span className="text-[#A5A8B5] text-[12px] leading-relaxed">{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#A5A8B5] italic text-[12px] leading-relaxed">
                    Specific breakdown not specified in the available official source. Relief is typically disbursed via Direct Benefit Transfer (DBT).
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4">
              <h5 className="text-[9px] uppercase font-bold text-[#F4C95D] tracking-widest font-poppins">Required Documents</h5>
              {requiredDocuments.length > 0 ? (
                <ul className="space-y-2.5">
                  {requiredDocuments.map((doc, i) => {
                    const docName = typeof doc === "string" ? doc : doc.name || "";
                    return (
                      <li key={i} className="flex items-start gap-3 p-3 rounded-[12px] bg-[#0B0B12] border border-[rgba(255,255,255,0.04)]">
                        <FileText className="w-4 h-4 text-[#F4C95D] shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="text-white font-bold text-[12px] block">{docName}</span>
                          {typeof doc === "object" && doc.why_required && (
                            <span className="text-[11px] text-[#A5A8B5] block leading-snug">{doc.why_required}</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[#A5A8B5] italic text-[12px]">Not specified in the available official source.</p>
              )}
            </div>
          )}

          {activeTab === "process" && (
            <div className="space-y-5">
              <h5 className="text-[9px] uppercase font-bold text-[#F4C95D] tracking-widest font-poppins">Application Process</h5>
              <div className={`p-3.5 rounded-[12px] border ${hasApplicationUrl ? "bg-[#22C55E]/5 border-[#22C55E]/20 text-[#22C55E]" : "bg-[#F4C95D]/5 border-[#F4C95D]/20 text-[#F4C95D]"}`}>
                <div className="flex gap-2 items-center">
                  <div className={`w-2 h-2 rounded-full ${hasApplicationUrl ? "bg-[#22C55E]" : "bg-[#F4C95D]"} shrink-0`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider font-poppins">
                    {hasApplicationUrl ? "Online Portal Application" : "Offline / State Revenue Processing"}
                  </span>
                </div>
                <p className="text-[11px] text-[#A5A8B5] mt-1.5 leading-relaxed">
                  {hasApplicationUrl
                    ? "This provision has an online portal. Submit documents and verify your identity digitally."
                    : "This provision requires physical verification and submission at the local revenue office (Tehsildar) or Gram Panchayat."}
                </p>
              </div>
              <div className="space-y-3">
                <h6 className="text-[9px] uppercase font-bold text-[#A5A8B5]/50 tracking-widest font-poppins">Processing Timeline</h6>
                <div className="relative pl-7 space-y-5 border-l border-[rgba(255,255,255,0.08)] ml-2 py-1">
                  {[
                    { step: "1", color: "#F4C95D", title: "Application Submission", desc: "Submit document dossier with damage photos to local Panchayat/Tehsildar." },
                    { step: "2", color: "#F4C95D", title: "Field Damage Survey", desc: "Revenue Inspector or Patwari inspects structures within 7–15 days of event." },
                    { step: "3", color: "#F4C95D", title: "District Collector Verification", desc: "Approval of relief list and sanctioning of Direct Benefit Transfer (DBT)." },
                    { step: "✓", color: "#22C55E", title: "Disbursement", desc: "Direct credit of relief package to beneficiary bank account in 30–45 days.", isLast: true },
                  ].map((s, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[30px] top-0 w-5 h-5 rounded-full bg-[#11131A] border-2 flex items-center justify-center text-[8px] font-black text-white" style={{ borderColor: s.color }}>
                        {s.step}
                      </div>
                      <h6 className="text-white font-bold text-[12px] leading-none" style={s.isLast ? { color: "#22C55E" } : {}}>
                        {s.title}
                      </h6>
                      <p className="text-[11px] text-[#A5A8B5] mt-1 leading-snug">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              {sourceUrl && (
                <div className="space-y-2 pt-2">
                  <h6 className="text-[9px] uppercase font-bold text-[#A5A8B5]/50 tracking-widest font-poppins">Official Source</h6>
                  <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-[#22C55E] hover:text-[#4ADE80] font-bold transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    View Official Government Source
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.05)] bg-[#0E1017] shrink-0">
          <div className="flex items-center gap-3">
            {sourceUrl && (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[#171923] hover:bg-[#202330] text-[11px] font-bold text-[#A5A8B5] hover:text-white transition-all cursor-pointer font-poppins">
                <ExternalLink className="w-3.5 h-3.5" />
                View Official Source
              </a>
            )}
            {hasApplicationUrl ? (
              <a href={scheme.application_url} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 px-4 rounded-[12px] bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] text-[11px] font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer font-poppins transition-all">
                Apply Now <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button onClick={() => setActiveTab("process")} className="flex-1 py-2.5 px-4 rounded-[12px] bg-[#F4C95D]/10 hover:bg-[#F4C95D]/20 text-[#F4C95D] border border-[#F4C95D]/30 text-[11px] font-bold uppercase tracking-wider text-center cursor-pointer font-poppins transition-all flex items-center justify-center gap-1.5">
                View Official Process <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)]">
            <span className="text-[10px] text-[#A5A8B5]/60 font-inter"><strong className="text-[#A5A8B5]/80">Doc:</strong> {documentName}</span>
            {date && <span className="text-[10px] text-[#A5A8B5]/60 font-inter"><strong className="text-[#A5A8B5]/80">Date:</strong> {date}</span>}
            <span className="text-[10px] text-[#A5A8B5]/60 font-inter flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${verified ? "bg-[#22C55E]" : "bg-[#F4C95D]"}`} />
              {verified ? "Active / Verified" : "Needs Verification"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ icon, label, sublabel }) {
  return (
    <div className="flex items-center gap-2.5 pb-1">
      <div className="flex items-center justify-center w-5 h-5 shrink-0">{icon}</div>
      <div>
        <span className="text-[10px] uppercase font-bold text-white/70 tracking-widest font-poppins">{label}</span>
        {sublabel && <span className="text-[10px] text-[#A5A8B5] font-inter ml-2">{sublabel}</span>}
      </div>
      <div className="flex-1 h-px bg-[rgba(255,255,255,0.05)]" />
    </div>
  );
}

// ── Main Step5 Component ───────────────────────────────────────────────────────
export default function Step5GovernmentSchemes({
  schemes,
  onNext,
  onSelectScheme,
  appliedSchemes = [],   // NEW: full array of applied schemes
  selectedScheme,        // kept for legacy compat (alias to appliedSchemes[0])
  ragData,
  ragLoading,
  disasterType,
}) {
  const [activeScheme, setActiveScheme] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [modalOpen, setModalOpen] = useState(false);

  // Extract verified schemes from RAG data
  const ragSchemes = (() => {
    if (!ragData || !ragData.rag_available) {
      if (Array.isArray(schemes) && schemes.length > 0) {
        return schemes.map((s, idx) => ({
          ...s,
          id: s.id || s.scheme_id || `RAG-SCHEME-${idx + 1}`,
          scheme_id: s.id || s.scheme_id || `RAG-SCHEME-${idx + 1}`,
          _rank: idx,
        }));
      }
      return [];
    }
    const d = ragData.data || {};
    const rawList = Array.isArray(d) ? d : (Array.isArray(d.schemes) ? d.schemes : []);
    return rawList.map((scheme, idx) => {
      const derivedId = scheme.id || scheme.scheme_id || `RAG-SCHEME-${idx + 1}`;
      return {
        ...scheme,
        id: derivedId,
        scheme_id: derivedId,
        _rank: idx
      };
    });
  })();

  const topSource = (ragData?.sources || [])[0] || {};

  const appliedCount = appliedSchemes.length;

  // Check if a specific scheme is in the applied array
  const isSchemeApplied = (scheme) => {
    const id = getSchemeId(scheme);
    return appliedSchemes.some((s) => getSchemeId(s) === id);
  };

  const handleToggle = (scheme) => {
    if (onSelectScheme) {
      const idx = ragSchemes.indexOf(scheme);
      const derivedId = scheme.id || scheme.scheme_id || `RAG-SCHEME-${idx + 1}`;
      onSelectScheme({
        id: derivedId,
        scheme_id: derivedId,
        official_name: scheme.name || scheme.official_name || scheme.scheme_name || "",
        information_type: scheme.information_type || "SDRF_NDRF_PROVISION",
        name: scheme.name || scheme.official_name || scheme.scheme_name || "",
        schemeName: scheme.name || scheme.official_name || scheme.scheme_name || "",
        disasterType: scheme.applicable_disaster || scheme.disaster_type || disasterType || "",
        eligibility: scheme.eligibility_summary || scheme.eligibility || "",
        benefit: scheme.relief_amount || scheme.benefit_amount || scheme.reliefAmount || "",
        reliefAmount: scheme.relief_amount || scheme.benefit_amount || scheme.reliefAmount || "",
        required_documents: scheme.required_documents || [],
        requiredDocuments: scheme.required_documents || [],
        benefits: scheme.benefits || [],
        authority: scheme.source_authority || scheme.authority || "",
        department: scheme.source_authority || scheme.authority || "",
        official_source_url: scheme.source_url || "",
        source_url: scheme.source_url || "",
        document_name: scheme.document_name || "",
        verified: scheme.verified !== false,
        source_authority: scheme.source_authority || scheme.authority || "",
        document_date: scheme.document_date || "",
        minDamage: scheme.minDamage || scheme.min_damage || 30,
        maxDamage: scheme.maxDamage || scheme.max_damage || 100,
      });
    }
  };

  const handleViewDetails = (scheme) => {
    setActiveScheme(scheme);
    setActiveTab("overview");
    setModalOpen(true);
  };

  const handleViewProcess = (scheme) => {
    setActiveScheme(scheme);
    setActiveTab("process");
    setModalOpen(true);
  };

  // Proceed only if at least one scheme is selected
  const canProceed = ragSchemes.length === 0 || appliedCount > 0;

  // Split schemes: recommended (top 3) vs others
  const recommendedSchemes = ragSchemes.slice(0, 3);
  const otherSchemes = ragSchemes.slice(3);

  return (
    <div className="space-y-5 relative">

      {/* Inline styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes modalSlideUp {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-modalSlideUp {
          animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}} />

      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-wider font-poppins">
            Government Scheme Match
          </h3>
          <p className="text-[11px] text-[#A5A8B5] font-inter mt-0.5">
            Personalized schemes matched to your disaster, damage and location.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Applied counter */}
          {!ragLoading && ragSchemes.length > 0 && (
            <span
              className={`text-[10px] font-bold font-poppins px-2.5 py-0.5 rounded-full border ${
                appliedCount > 0
                  ? "text-[#F4C95D] bg-[#F4C95D]/10 border-[#F4C95D]/20"
                  : "text-[#A5A8B5] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]"
              }`}
            >
              Applied: {appliedCount}
            </span>
          )}
          <span className="text-[10px] text-[#F4C95D] bg-[#F4C95D]/10 border border-[#F4C95D]/20 px-2 py-0.5 rounded-full font-bold font-inter">
            Step 5 of 9
          </span>
        </div>
      </div>

      {/* ── Compact info banner ───────────────────────────────────── */}
      {!ragLoading && ragSchemes.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-[12px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-[#F4C95D] bg-[#F4C95D]/10 border border-[#F4C95D]/20 px-2 py-0.5 rounded-full font-bold font-poppins">
              {ragSchemes.length} Match{ragSchemes.length > 1 ? "es" : ""} Found
            </span>
            <span className="text-[10px] text-[#22C55E] font-inter flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Verified government sources
            </span>
            <span className="text-[10px] text-[#A5A8B5] font-inter">•</span>
            <span className="text-[10px] text-[#A5A8B5] font-inter">
              Final eligibility is determined by the concerned authority.
            </span>
          </div>
          {topSource.url && (
            <a href={topSource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[9px] text-[#22C55E] hover:text-[#4ADE80] font-bold transition-colors shrink-0">
              <ExternalLink className="w-2.5 h-2.5" />
              View Source
            </a>
          )}
        </div>
      )}

      {/* ── Scheme Lists ─────────────────────────────────────────── */}
      <div className="space-y-6">
        {ragLoading ? (
          <RagLoadingState />
        ) : ragSchemes.length > 0 ? (
          <>
            {/* Recommended section */}
            {recommendedSchemes.length > 0 && (
              <div className="space-y-3">
                <SectionLabel
                  icon={<Star className="w-3.5 h-3.5 text-[#F4C95D]" />}
                  label="Recommended for You"
                  sublabel={`Top ${recommendedSchemes.length} most relevant matches`}
                />
                <div className="space-y-4">
                  {recommendedSchemes.map((scheme, idx) => {
                    const schemeWithMeta = { ...scheme, _rank: idx };
                    return (
                      <VerifiedSchemeCard
                        key={idx}
                        scheme={schemeWithMeta}
                        rank={idx}
                        isApplied={isSchemeApplied(scheme)}
                        appliedCount={appliedCount}
                        onToggle={handleToggle}
                        onViewDetails={handleViewDetails}
                        onViewProcess={handleViewProcess}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Other schemes section */}
            {otherSchemes.length > 0 && (
              <div className="space-y-3">
                <SectionLabel
                  icon={<Info className="w-3.5 h-3.5 text-[#A5A8B5]" />}
                  label="Other Relevant Schemes"
                  sublabel={`${otherSchemes.length} additional match${otherSchemes.length > 1 ? "es" : ""}`}
                />
                <div className="space-y-4">
                  {otherSchemes.map((scheme, i) => {
                    const idx = i + 3;
                    const schemeWithMeta = { ...scheme, _rank: idx };
                    return (
                      <VerifiedSchemeCard
                        key={idx}
                        scheme={schemeWithMeta}
                        rank={Math.min(idx, MATCH_LABELS.length - 1)}
                        isApplied={isSchemeApplied(scheme)}
                        appliedCount={appliedCount}
                        onToggle={handleToggle}
                        onViewDetails={handleViewDetails}
                        onViewProcess={handleViewProcess}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <NoDataState disasterType={disasterType} />
        )}
      </div>

      {/* ── Hint ─────────────────────────────────────────────────── */}
      {!ragLoading && ragSchemes.length > 0 && appliedCount === 0 && (
        <p className="text-[10px] text-[#A5A8B5] text-center font-inter">
          Select at least one scheme above to proceed to eligibility assessment.
        </p>
      )}

      {/* ── Step Navigation ───────────────────────────────────────── */}
      <div className="flex justify-end pt-4 border-t border-[rgba(255,255,255,0.05)]">
        <button
          onClick={onNext}
          disabled={ragLoading || !canProceed}
          className="px-6 py-2.5 bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] font-bold text-xs rounded-[16px] transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-[0_4px_20px_rgba(244,201,93,0.15)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Check Eligibility Rules</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Details Modal ─────────────────────────────────────────── */}
      {modalOpen && activeScheme && (
        <SchemeDetailsModal
          scheme={activeScheme}
          onClose={() => setModalOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function RagLoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-5 rounded-[20px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-4 w-40 bg-[rgba(255,255,255,0.06)] rounded" />
            <div className="h-4 w-20 bg-[rgba(255,255,255,0.04)] rounded-full" />
          </div>
          <div className="h-5 w-3/4 bg-[rgba(255,255,255,0.06)] rounded mb-2" />
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="h-10 bg-[rgba(255,255,255,0.04)] rounded-[10px]" />
            <div className="h-10 bg-[rgba(255,255,255,0.04)] rounded-[10px]" />
            <div className="h-10 bg-[rgba(255,255,255,0.04)] rounded-[10px]" />
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <div className="h-8 w-24 bg-[rgba(255,255,255,0.06)] rounded-[10px]" />
            <div className="h-8 w-20 bg-[rgba(255,255,255,0.06)] rounded-[10px]" />
          </div>
        </div>
      ))}
      <div className="flex items-center justify-center gap-2 py-2">
        <Loader2 className="w-3.5 h-3.5 text-[#F4C95D] animate-spin" />
        <span className="text-[10px] text-[#A5A8B5] font-inter">
          Retrieving verified government information from official sources…
        </span>
      </div>
    </div>
  );
}

// ── No-data state ─────────────────────────────────────────────────────────────
function NoDataState({ disasterType }) {
  return (
    <div className="p-10 rounded-xl border border-dashed border-gray-700 text-center space-y-3">
      <AlertCircle className="w-8 h-8 text-[#A5A8B5] mx-auto opacity-50" />
      <h3 className="text-sm font-bold text-white font-poppins">
        No Verified Government Information Found
      </h3>
      <p className="text-xs text-[#A5A8B5] font-inter max-w-sm mx-auto leading-relaxed">
        No verified government relief records were found for{" "}
        <strong className="text-white capitalize">{disasterType || "this disaster type"}</strong> in the knowledge base.
      </p>
      <div className="flex items-start gap-2 p-3 rounded-[12px] bg-[#171923] border border-[rgba(255,255,255,0.05)] text-left max-w-sm mx-auto">
        <Info className="w-3.5 h-3.5 text-[#F4C95D] shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#A5A8B5] font-inter leading-relaxed">
          Contact your District Collector's office or visit{" "}
          <a href="https://ndma.gov.in" target="_blank" rel="noopener noreferrer" className="text-[#22C55E] font-bold hover:underline">
            ndma.gov.in
          </a>{" "}
          for official disaster relief information.
        </p>
      </div>
    </div>
  );
}
