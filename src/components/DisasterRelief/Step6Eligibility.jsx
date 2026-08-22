import React, { useState } from "react";
import {
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ExternalLink,
  Loader2,
  AlertCircle,
  Info,
  ArrowLeft,
} from "lucide-react";

// ── Eligibility status config ─────────────────────────────────────────────────
function getStatusConfig(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("eligible") && !s.includes("not") && !s.includes("possibly") && !s.includes("potentially")) {
    return {
      label: "Eligible",
      color: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20",
      dot: "bg-[#22C55E]",
      icon: "✓",
    };
  }
  if (s.includes("possibly") || s.includes("potentially") || s.includes("may") || s.includes("eligible")) {
    return {
      label: "Potentially Eligible",
      color: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20",
      dot: "bg-[#22C55E]",
      icon: "✓",
    };
  }
  if (s.includes("not eligible")) {
    return {
      label: "Not Eligible",
      color: "text-red-400 bg-red-500/10 border-red-500/20",
      dot: "bg-red-400",
      icon: "✗",
    };
  }
  return {
    label: "Verification Required",
    color: "text-[#F4C95D] bg-[#F4C95D]/10 border-[#F4C95D]/20",
    dot: "bg-[#F4C95D]",
    icon: "?",
  };
}

// ── Collapsible section ───────────────────────────────────────────────────────
function CollapsibleSection({ title, children, defaultOpen = false, accentColor = "#A5A8B5" }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-[rgba(255,255,255,0.05)]">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full py-3 text-left group cursor-pointer"
      >
        <span
          className="text-[10px] uppercase font-bold tracking-wider font-poppins transition-colors"
          style={{ color: open ? accentColor : "#A5A8B5" }}
        >
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-[#A5A8B5] shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[#A5A8B5] shrink-0" />
        )}
      </button>
      {open && <div className="pb-4 space-y-2">{children}</div>}
    </div>
  );
}

// ── Single scheme eligibility card ────────────────────────────────────────────
function SchemeEligibilityCard({
  scheme,
  index,
  total,
  eligibility,
  analysis,
  ragData,
  ragLoading,
  defaultExpanded,
}) {
  // Extract scheme identity
  const schemeName =
    scheme?.official_name || scheme?.schemeName || scheme?.name || "Government Relief Provision";
  const authority =
    scheme?.authority || scheme?.department || scheme?.source_authority || "Ministry of Home Affairs";
  const rawBenefit = scheme?.reliefAmount || scheme?.benefit || scheme?.relief_amount || "";
  const displayBenefit = rawBenefit || "Benefit amount per applicable government norms.";
  const sourceUrl = scheme?.official_source_url || scheme?.source_url || "";
  const documentName = scheme?.document_name || "";
  const schemeVerified = scheme?.verified !== false;
  const disasterType = scheme?.disasterType || scheme?.disaster_type || analysis?.disaster_type || "";
  const explanation = scheme?.explanation || scheme?.relevance || scheme?.eligibility || "";

  // RAG eligibility data (shared context — not per-scheme)
  const ragResult = ragData?.data || {};
  const ragStatus = ragResult?.status || "";

  const damagePercent = typeof analysis?.damage_percent === "number" ? analysis.damage_percent : parseInt(analysis?.damage_percent || "0", 10);
  const minDamage = typeof scheme?.minDamage === "number" ? scheme.minDamage : (typeof scheme?.min_damage === "number" ? scheme.min_damage : 0);

  // Status config: check damage percent vs minDamage threshold
  let displayStatus = ragStatus || "Potentially Eligible";
  if (damagePercent > 0 && minDamage > 0 && damagePercent < minDamage) {
    displayStatus = "Not Eligible";
  }
  const statusConfig = getStatusConfig(displayStatus);

  const conditionsMatched = (() => {
    const list = [];
    if (damagePercent > 0 && minDamage > 0 && damagePercent >= minDamage) {
      list.push(`AI assessed damage (${damagePercent}%) meets the minimum threshold of ${minDamage}%`);
    } else if (damagePercent > 0 && minDamage === 0) {
      list.push(`AI assessed damage (${damagePercent}%) matches general relief guidelines`);
    }
    if (disasterType) {
      list.push(`Disaster type (${disasterType}) matches the scheme's coverage guidelines`);
    }
    if (Array.isArray(ragResult?.conditions_matched)) {
      ragResult.conditions_matched.forEach((c) => {
        if (!list.includes(c)) list.push(c);
      });
    }
    return list;
  })();

  const conditionsPending = (() => {
    const list = [];
    const reqDocs = scheme?.required_documents || scheme?.requiredDocuments || [];
    reqDocs.forEach((d) => {
      const docName = typeof d === "string" ? d : d.name;
      if (docName && !list.some((item) => item.includes(docName))) {
        list.push(`Submit verified copy of ${docName}`);
      }
    });
    if (Array.isArray(ragResult?.conditions_pending)) {
      ragResult.conditions_pending.forEach((c) => {
        if (!list.includes(c)) list.push(c);
      });
    }
    return list;
  })();

  const ragExplanation = ragResult?.explanation || "";
  const disclaimer =
    ragResult?.disclaimer ||
    "Final eligibility is determined by the concerned government authority — this is informational only.";

  // Assessment basis
  const priority = eligibility?.priority || analysis?.severity || "High";
  const assessmentItems = [
    disasterType && `Disaster type: ${disasterType}`,
    analysis?.damage_percent && `AI assessed damage: ${analysis.damage_percent}%`,
    minDamage > 0 && `Minimum damage required: ${minDamage}%`,
    analysis?.severity && `Severity: ${analysis.severity}`,
    schemeName && `Matched provision: ${schemeName}`,
  ].filter(Boolean);

  const [detailsOpen, setDetailsOpen] = useState(defaultExpanded);

  return (
    <div className={`rounded-[20px] bg-[#11131A] border overflow-hidden transition-all duration-200 ${
      detailsOpen ? "border-[#F4C95D]/30" : "border-[rgba(255,255,255,0.08)]"
    }`}>
      {/* ── Card Summary (always visible) ──────────────────────── */}
      <div className="p-5 space-y-4">
        {/* Status + scheme number */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase font-poppins flex items-center gap-1 ${statusConfig.color}`}>
              {ragLoading ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Assessing…</>
              ) : (
                <>{statusConfig.icon} {statusConfig.label}</>
              )}
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase font-poppins">
              Priority: {priority}
            </span>
          </div>
          <span className="text-[9px] text-[#A5A8B5]/50 font-inter font-bold">
            {index + 1} of {total}
          </span>
        </div>

        {/* Scheme name */}
        <div>
          <h4 className="text-sm md:text-[15px] font-bold text-white font-poppins leading-snug">
            {schemeName}
          </h4>
          {schemeVerified && (
            <div className="flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-3 h-3 text-[#22C55E]" />
              <span className="text-[9px] font-bold text-[#22C55E] uppercase tracking-wider font-poppins">
                Verified Government Source
              </span>
            </div>
          )}
        </div>

        {/* Authority + Benefit row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 pb-1">
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase font-bold text-[#A5A8B5]/50 tracking-wider block">Authority</span>
            <span className="text-xs text-white font-semibold leading-snug">{authority}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase font-bold text-[#A5A8B5]/50 tracking-wider block">
              Applicable Assistance
            </span>
            <span className="text-base font-black text-[#F4C95D] font-space-grotesk block leading-tight">
              {displayBenefit}
            </span>
          </div>
        </div>

        {/* Why matched (short) */}
        {explanation && (
          <p className="text-[11px] text-[#A5A8B5] font-inter leading-relaxed">
            <span className="text-[9px] uppercase font-bold text-[#A5A8B5]/50 tracking-wider mr-1.5">
              Why matched —
            </span>
            {explanation.length > 120 ? explanation.slice(0, 117) + "…" : explanation}
          </p>
        )}

        {/* Expand/collapse toggle */}
        <button
          onClick={() => setDetailsOpen((p) => !p)}
          className="flex items-center gap-1.5 text-[10px] font-bold text-[#F4C95D] hover:text-[#FFD978] transition-colors cursor-pointer font-poppins pt-1"
        >
          {detailsOpen ? "Hide Details" : "View Eligibility Details"}
          {detailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── Collapsible Detail Sections ─────────────────────────── */}
      {detailsOpen && (
        <div className="px-5 pb-5 space-y-0 border-t border-[rgba(255,255,255,0.05)]">

          {/* RAG loading within expanded */}
          {ragLoading && (
            <div className="flex items-center gap-2.5 py-4">
              <Loader2 className="w-3.5 h-3.5 text-[#F4C95D] animate-spin shrink-0" />
              <span className="text-[10px] text-[#A5A8B5] font-inter">
                Loading verified eligibility conditions…
              </span>
            </div>
          )}

          {/* RAG explanation */}
          {!ragLoading && ragExplanation && (
            <div className="py-4 border-b border-[rgba(255,255,255,0.05)]">
              <p className="text-[11px] text-[#A5A8B5] font-inter leading-relaxed border-l-2 border-[#22C55E]/40 pl-3">
                {ragExplanation}
              </p>
            </div>
          )}

          {/* Conditions Met */}
          {!ragLoading && conditionsMatched.length > 0 && (
            <CollapsibleSection title="Conditions Met" defaultOpen={true} accentColor="#22C55E">
              <ul className="space-y-1.5">
                {conditionsMatched.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-white font-inter">
                    <span className="text-[#22C55E] font-bold shrink-0 mt-0.5">✓</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Conditions fallback */}
          {!ragLoading && conditionsMatched.length === 0 && conditionsPending.length === 0 && (
            <CollapsibleSection title="General Eligibility Conditions" defaultOpen={true} accentColor="#A5A8B5">
              <ul className="space-y-1.5">
                {[
                  "Disaster must be officially declared by State/Central Government",
                  "Damage must be certified by Revenue Officer or competent authority",
                  "Applicant must be a resident/owner of the affected property",
                  "Commercial/industrial properties are not eligible under SDRF norms",
                ].map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-[#A5A8B5] font-inter">
                    <span className="text-[#A5A8B5] font-bold shrink-0 mt-0.5">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[9px] text-[#A5A8B5]/50 font-inter italic pt-1">
                General SDRF conditions — specific conditions load from verified sources.
              </p>
            </CollapsibleSection>
          )}

          {/* Needs Verification */}
          {!ragLoading && conditionsPending.length > 0 && (
            <CollapsibleSection title="Verification Required" accentColor="#F4C95D">
              <ul className="space-y-1.5">
                {conditionsPending.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-[#A5A8B5] font-inter">
                    <span className="text-[#F4C95D] font-bold shrink-0 mt-0.5">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Assessment Details */}
          {assessmentItems.length > 0 && (
            <CollapsibleSection title="Assessment Details" accentColor="#A5A8B5">
              <ul className="space-y-1.5">
                {assessmentItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-[#A5A8B5] font-inter">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A5A8B5]/40 shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[9px] text-[#A5A8B5]/50 font-inter italic pt-1">
                CivicSync does not claim government approval — this is informational only.
              </p>
            </CollapsibleSection>
          )}

          {/* Official Source */}
          {(sourceUrl || documentName || schemeVerified) && (
            <CollapsibleSection title="Official Government Source" accentColor="#22C55E">
              <div className="space-y-1.5 pl-1">
                {authority && (
                  <p className="text-[11px] text-[#A5A8B5] font-inter">
                    <strong className="text-white">Authority:</strong> {authority}
                  </p>
                )}
                {documentName && (
                  <p className="text-[11px] text-[#A5A8B5] font-inter">
                    <strong className="text-white">Document:</strong> {documentName}
                  </p>
                )}
                {schemeVerified && (
                  <p className="text-[11px] text-[#A5A8B5] font-inter">
                    <strong className="text-white">Status:</strong>{" "}
                    <span className="text-[#22C55E]">🟢 Current / Verified</span>
                  </p>
                )}
                {sourceUrl && (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-[#22C55E] hover:text-[#4ADE80] font-bold transition-colors mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Official Source
                  </a>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Disclaimer */}
          <div className="pt-3">
            <div className="flex items-start gap-2 p-2.5 rounded-[10px] bg-[#171923] border border-[rgba(255,255,255,0.04)]">
              <Info className="w-3 h-3 text-[#F4C95D] shrink-0 mt-0.5" />
              <p className="text-[9px] text-[#A5A8B5] font-inter leading-relaxed">{disclaimer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Step6 Component ───────────────────────────────────────────────────────
export default function Step6Eligibility({
  eligibility = {},
  analysis = {},
  appliedSchemes = [],   // array of all applied schemes from Step 5
  matchedScheme = {},    // kept for backwards compat
  onNext,
  onBack,
  ragData,
  ragLoading,
}) {
  // Resolve the list of schemes to render eligibility for: ONLY applied schemes!
  const schemes = Array.isArray(appliedSchemes) ? appliedSchemes : [];

  // Helper to determine if a scheme is eligible based on its local/RAG eligibility data
  const isSchemeEligible = (scheme) => {
    const schemeId = scheme.id || scheme.scheme_id;
    const local = eligibility[schemeId] || {};
    const rag = ragData?.[schemeId] || null;

    // 1. Damage check (AI assessed vs scheme minDamage)
    const damagePercent = typeof analysis?.damage_percent === "number" ? analysis.damage_percent : parseInt(analysis?.damage_percent || "0", 10);
    const minDamage = typeof scheme?.minDamage === "number" ? scheme.minDamage : (typeof scheme?.min_damage === "number" ? scheme.min_damage : 0);
    if (damagePercent > 0 && minDamage > 0 && damagePercent < minDamage) {
      return false;
    }

    // 2. Local database status check
    const localStatus = (local.status || "").toLowerCase();
    if (localStatus.includes("not") && localStatus.includes("eligible")) return false;
    if (localStatus.includes("reject")) return false;
    if (local.is_eligible === false) return false;

    // 3. RAG status check
    const ragResult = rag?.data || {};
    const ragStatus = (ragResult.status || "").toLowerCase();
    if (ragStatus.includes("not") && ragStatus.includes("eligible")) return false;
    if (ragStatus.includes("reject")) return false;
    if (ragResult.is_eligible === false) return false;

    return true;
  };

  const hasResults = Object.keys(eligibility).length > 0 || Object.keys(ragData || {}).length > 0;

  const eligibleAppliedSchemes = schemes.filter((scheme) => {
    if (!hasResults && ragLoading) return true;
    return isSchemeEligible(scheme);
  });

  // Deduplicate by scheme.id
  const uniqueEligibleSchemes = Array.from(
    new Map(
      eligibleAppliedSchemes.map((scheme) => [scheme.id || scheme.scheme_id, scheme])
    ).values()
  );

  const appliedCount = schemes.length;
  const eligibleCount = uniqueEligibleSchemes.length;

  // Empty state if no applied schemes match eligibility criteria
  if (appliedCount > 0 && eligibleCount === 0) {
    return (
      <div className="space-y-5 font-inter">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-wider font-poppins">
              Eligibility
            </h3>
            <p className="text-xs text-[#A5A8B5] font-inter mt-0.5">
              Based on verified official government eligibility criteria
            </p>
          </div>
          <span className="text-[10px] text-[#F4C95D] bg-[#F4C95D]/10 border border-[#F4C95D]/20 px-2.5 py-0.5 rounded-full font-bold font-poppins shrink-0">
            Step 6 of 9
          </span>
        </div>

        <div className="p-10 rounded-[20px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-[#A5A8B5] mx-auto opacity-50 font-poppins" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white font-poppins">
              No applied schemes currently match your eligibility criteria.
            </h4>
            <p className="text-xs text-[#A5A8B5] font-inter max-w-sm mx-auto leading-relaxed">
              Your selected schemes were evaluated using the available disaster, damage and eligibility information.
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[#171923] hover:bg-[#202330] text-xs font-bold text-[#A5A8B5] hover:text-white transition-all cursor-pointer font-poppins"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Go to Government Schemes
            </button>
          )}
        </div>
      </div>
    );
  }

  // Complete fallback empty state
  if (appliedCount === 0) {
    return (
      <div className="space-y-5 font-inter">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-wider font-poppins">
              Eligibility
            </h3>
            <p className="text-xs text-[#A5A8B5] font-inter mt-0.5">
              Based on verified official government eligibility criteria
            </p>
          </div>
          <span className="text-[10px] text-[#F4C95D] bg-[#F4C95D]/10 border border-[#F4C95D]/20 px-2.5 py-0.5 rounded-full font-bold font-poppins shrink-0">
            Step 6 of 9
          </span>
        </div>

        <div className="p-10 rounded-[20px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-[#A5A8B5] mx-auto opacity-50" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white font-poppins">No schemes applied yet.</h4>
            <p className="text-xs text-[#A5A8B5] font-inter max-w-xs mx-auto leading-relaxed">
              Please return to Government Schemes and click Apply on the relief provisions you wish to claim.
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[#171923] hover:bg-[#202330] text-xs font-bold text-[#A5A8B5] hover:text-white transition-all cursor-pointer font-poppins"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Go to Government Schemes
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-inter">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-wider font-poppins">
            Eligibility
          </h3>
          <p className="text-[11px] text-[#A5A8B5] font-inter mt-0.5">
            Based on verified official government eligibility criteria for your selected provisions
          </p>
        </div>
        <span className="text-[10px] text-[#F4C95D] bg-[#F4C95D]/10 border border-[#F4C95D]/20 px-2.5 py-0.5 rounded-full font-bold font-poppins shrink-0">
          Step 6 of 9
        </span>
      </div>

      {/* ── Selection count banner ────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />
        <span className="text-[10px] text-[#A5A8B5] font-inter">
          <strong className="text-white">
            {eligibleCount} of {appliedCount} applied scheme{appliedCount !== 1 ? "s" : ""}
          </strong>{" "}
          appear applicable to your case
          {ragLoading && (
            <span className="ml-2 text-[#F4C95D] flex items-center gap-1 inline-flex">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading verified conditions…
            </span>
          )}
        </span>
      </div>

      {/* ── Per-scheme eligibility cards ─────────────────────── */}
      <div className="space-y-5">
        {uniqueEligibleSchemes.map((scheme, idx) => {
          const schemeId = scheme.id || scheme.scheme_id;
          return (
            <SchemeEligibilityCard
              key={schemeId || idx}
              scheme={scheme}
              index={idx}
              total={uniqueEligibleSchemes.length}
              eligibility={eligibility[schemeId] || {}}
              analysis={analysis}
              ragData={ragData?.[schemeId] || null}
              ragLoading={ragLoading}
              defaultExpanded={idx === 0} // first card expanded by default
            />
          );
        })}
      </div>

      {/* ── Navigation ──────────────────────────────────────────── */}
      <div className="flex justify-end pt-3 border-t border-[rgba(255,255,255,0.05)]">
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] font-bold text-xs rounded-[16px] transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-[0_4px_20px_rgba(244,201,93,0.15)] cursor-pointer"
        >
          <span>Verify Documents</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
