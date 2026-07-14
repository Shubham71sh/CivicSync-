import React, { useState } from "react";
import { Check, AlertTriangle, Upload, ChevronRight, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function Step7Documents({
  documents = [],
  onNext,
}) {
  console.log("Documents Data");
console.log(JSON.stringify(documents, null, 2));

  const [docList, setDocList] = useState(documents);
  const verifiedCount = docList.filter(
  d => d.status === "Verified"
).length;
  const totalCount = docList.length;
  const completionPercentage = Math.round((verifiedCount / totalCount) * 100);

  const handleUploadMissing = () => {
    // Simulate uploading the missing document
    setDocList(prev => 
      prev.map(d => d.name.includes("Passbook") ? { ...d, status: "Verified", size: "1.5 MB" } : d)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-poppins">Document Vault Verification</h3>
          <p className="text-xs text-[#A5A8B5] font-inter">Validate uploaded file logs against structural scheme guidelines</p>
        </div>
        <span className="text-[10px] text-[#F4C95D] bg-[#F4C95D]/10 border border-[#F4C95D]/20 px-2 py-0.5 rounded-full font-bold">
          Step 7 of 9
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
        {/* Left Side: Circular completion progress (2 cols) */}
        <div className="md:col-span-2 flex flex-col items-center justify-center py-6 bg-[#11131A] border border-[rgba(255,255,255,0.08)] rounded-[20px] relative overflow-hidden">
          {/* Custom SVG Dial */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="7"
                fill="none"
              />
              {/* Progress ring */}
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                stroke="#F4C95D"
                strokeWidth="7"
                fill="none"
                strokeDasharray="251.2"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 251.2 - (251.2 * completionPercentage) / 100 }}
                transition={{ duration: 1 }}
              />
            </svg>
            
            {/* Inner text */}
            <div className="absolute text-center">
              <span className="text-2xl font-bold text-white font-space-grotesk block leading-none">
                {completionPercentage}%
              </span>
              <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider mt-1 block font-poppins">
                Complete
              </span>
            </div>
          </div>

          <p className="text-[10px] text-[#A5A8B5] text-center mt-4 max-w-[200px] font-inter">
            {verifiedCount} of {totalCount} files verified. Upload remaining records to unlock scheme releases.
          </p>
        </div>

        {/* Right Side: Documents checklist (3 cols) */}
        <div className="md:col-span-3 space-y-3">
          <div className="space-y-2">
            {docList.map((doc, idx) => {
              const isVerified = doc.status === "Verified";
              return (
                <div
                  key={idx}
                  className="p-3.5 bg-[#11131A] border border-[rgba(255,255,255,0.08)] rounded-[20px] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0 border ${
                      isVerified
                        ? "bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]"
                        : "bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]"
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate block font-inter">
                        {doc.name}
                      </h4>
                      <span className="text-[9px] text-[#A5A8B5] block font-space-grotesk">
                        {isVerified ? doc.size : "Required"}
                      </span>
                    </div>
                  </div>

                  {isVerified ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-[9px] font-bold uppercase tracking-wider font-poppins shrink-0">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>Verified</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleUploadMissing}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] text-[9px] font-bold uppercase tracking-wider font-poppins shrink-0 transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-end pt-4 border-t border-[rgba(255,255,255,0.05)]">
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] font-bold text-xs rounded-[16px] transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-[0_4px_20px_rgba(244,201,93,0.15)]"
        >
          <span>Track Claim Timeline</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
