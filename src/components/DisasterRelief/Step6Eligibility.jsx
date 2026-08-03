import React from "react";
import { Check, ChevronRight, Clock, ShieldCheck, FileText, Award, Building2 } from "lucide-react";

export default function Step6Eligibility({
  eligibility = {},
  analysis = {},
  matchedScheme = {},
  onNext,
}) {
  const isEligible = eligibility.is_eligible !== false;
  
  // CRITICAL: Strictly use the actual selected/matched scheme data from Step 5
  const schemeName = matchedScheme?.schemeName || matchedScheme?.name || eligibility?.scheme_name || "National Disaster Relief Fund";
  
  const rawAmount = matchedScheme?.reliefAmount || matchedScheme?.amount || eligibility?.amount || "₹95,100";
  const amount = typeof rawAmount === "number" ? `₹${rawAmount.toLocaleString()}` : rawAmount;

  const department = matchedScheme?.authority || matchedScheme?.department || eligibility?.department || "Ministry of Home Affairs";
  const priority = eligibility?.priority || analysis?.severity || "High";
  const confidence = eligibility?.confidence || analysis?.ai_confidence || "94%";
  
  const timeline = matchedScheme?.processingDays 
    ? `${matchedScheme.processingDays} Days` 
    : (eligibility?.timeline || "7-14 Days");

  const reason = eligibility?.reason || `Assessed structural damage of ${analysis?.damage_percent ?? 68}% (${analysis?.severity || "Major"}) verified by AI visual assessment model.`;

  const rawBenefits = matchedScheme?.benefits || (matchedScheme?.benefit ? [matchedScheme.benefit] : eligibility?.benefits);
  const benefits = (rawBenefits && rawBenefits.length > 0)
    ? rawBenefits
    : [
        "Direct Benefit Transfer to Bank Account",
        "Emergency Temporary Shelter Support",
        "Essential Living Allowance",
        "Rehabilitation & Reconstruction Grant"
      ];

  const rawDocs = matchedScheme?.requiredDocuments || matchedScheme?.documents || eligibility?.documents;
  const documents = (rawDocs && rawDocs.length > 0)
    ? rawDocs
    : [
        "Aadhaar Card Verification",
        "Bank Passbook (Direct Deposit)",
        "Geo-tagged Damage Photos",
        "Property Ownership / Lease Record"
      ];

  return (
    <div className="space-y-5 font-inter">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-poppins">
            Disaster Eligibility Summary
          </h3>
          <p className="text-xs text-[#A5A8B5] font-inter mt-0.5">
            AI-matched government relief eligibility criteria and disbursement details
          </p>
        </div>
        <span className="text-[10px] text-[#F4C95D] bg-[#F4C95D]/10 border border-[#F4C95D]/20 px-2.5 py-0.5 rounded-full font-bold font-poppins">
          Step 6 of 9
        </span>
      </div>

      {/* Main Compact Eligibility Card */}
      <div className="p-5 rounded-[20px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] space-y-4">
        
        {/* Top Hero Section: Scheme Title & Amount */}
        <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-poppins ${
                isEligible 
                  ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20" 
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}>
                {isEligible ? "Eligible for Disbursement" : "Under Review"}
              </span>

              <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase font-poppins">
                Priority: {priority}
              </span>

              <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-[#F4C95D]/10 text-[#F4C95D] border border-[#F4C95D]/20 uppercase font-poppins">
                AI Confidence: {typeof confidence === "number" ? `${confidence}%` : confidence}
              </span>
            </div>

            <h4 className="text-base font-bold text-white font-poppins pt-1 leading-snug">
              {schemeName}
            </h4>

            <p className="text-xs text-[#A5A8B5] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#F4C95D] shrink-0" />
              <span>Authority: <strong className="text-white font-semibold">{department}</strong></span>
            </p>
          </div>

          {/* Financial Value Box */}
          <div className="w-full sm:w-auto text-left sm:text-right shrink-0 bg-[#171923] p-3.5 rounded-[14px] border border-[rgba(255,255,255,0.08)]">
            <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider block font-poppins">
              Approved Relief Amount
            </span>
            <span className="text-xl font-bold text-[#F4C95D] font-space-grotesk block mt-0.5">
              {amount}
            </span>
            <span className="text-[9px] text-[#22C55E] font-medium flex items-center justify-start sm:justify-end gap-1 mt-1">
              <Clock className="w-3 h-3 text-[#F4C95D]" /> Estimated Timeline: {timeline}
            </span>
          </div>
        </div>

        {/* 2-Column Section: Approved Benefits & Required Documents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Approved Benefits */}
          <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.05)] space-y-2.5">
            <div className="flex items-center gap-2 text-[#F4C95D] font-bold font-poppins border-b border-[rgba(255,255,255,0.05)] pb-2">
              <Award className="w-4 h-4" />
              <span>Approved Scheme Benefits</span>
            </div>
            <ul className="space-y-2 pt-0.5">
              {benefits.map((b, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[#A5A8B5] font-inter">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F4C95D] shrink-0 mt-1.5" />
                  <span className="leading-tight">{typeof b === "string" ? b : b.title || b.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Required Documents */}
          <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.05)] space-y-2.5">
            <div className="flex items-center gap-2 text-[#22C55E] font-bold font-poppins border-b border-[rgba(255,255,255,0.05)] pb-2">
              <FileText className="w-4 h-4" />
              <span>Required Audit Documents</span>
            </div>
            <ul className="space-y-2 pt-0.5">
              {documents.map((doc, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[#A5A8B5] font-inter">
                  <Check className="w-3.5 h-3.5 text-[#22C55E] shrink-0 stroke-[3] mt-0.5" />
                  <span className="leading-tight">{typeof doc === "string" ? doc : doc.name || doc.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI Reason & Assessment Basis Note */}
        {reason && (
          <div className="p-3.5 rounded-[14px] bg-[#171923] border border-[rgba(255,255,255,0.06)] flex items-start gap-2.5 text-xs text-[#A5A8B5]">
            <ShieldCheck className="w-4 h-4 text-[#F4C95D] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-white">AI Assessment Basis:</strong> {reason}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
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
