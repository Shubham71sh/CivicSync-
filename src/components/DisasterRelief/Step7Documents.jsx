import React, { useState, useRef } from "react";
import {
  Check,
  Upload,
  ChevronRight,
  FileText,
  Eye,
  X,
  ShieldCheck,
  Clock,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

import { generateDocumentChecklist } from "../../utils/disasterHelpers";

export default function Step7Documents({
  documents = [],
  disasterType = "flood",
  scheme = null,
  schemeName = "",
  onNext,
}) {
  const selectedSchemeObj = typeof scheme === "object" ? scheme : null;
  const activeSchemeName = schemeName || selectedSchemeObj?.schemeName || selectedSchemeObj?.name || "";

  const defaultList = generateDocumentChecklist(disasterType, selectedSchemeObj || activeSchemeName);
  const initialDocs = (documents && documents.length >= 6) ? documents : defaultList;

  const [docList, setDocList] = useState(initialDocs);
  const fileInputRef = useRef(null);
  const [selectedDocIndex, setSelectedDocIndex] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const verifiedCount = docList.filter((d) => d.status === "Verified").length;
  const uploadedCount = docList.filter((d) => d.status === "Uploaded").length;
  const pendingCount = docList.filter((d) => d.status === "Pending").length;
  const requiredCount = docList.filter((d) => d.status === "Required").length;

  const totalCount = docList.length || 1;
  const completionPercentage = Math.round((verifiedCount / totalCount) * 100);

  const handleUploadClick = (index) => {
    setSelectedDocIndex(index);
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || selectedDocIndex === null) return;

    setDocList((prev) =>
      prev.map((doc, idx) =>
        idx === selectedDocIndex
          ? {
              ...doc,
              status: "Scanning",
              size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
              fileName: file.name,
              uploadedFile: file,
            }
          : doc
      )
    );

    setTimeout(() => {
      setDocList((prev) =>
        prev.map((doc, idx) =>
          idx === selectedDocIndex
            ? {
                ...doc,
                status: "Verified",
              }
            : doc
        )
      );
    }, 2000);

    e.target.value = "";
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileChange}
      />

      <div className="space-y-5 font-inter">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-poppins">
              Document Vault Verification
            </h3>
            <p className="text-xs text-[#A5A8B5] font-inter mt-0.5">
              Validate uploaded file logs against structural scheme guidelines
            </p>
          </div>
          <span className="text-[10px] text-[#F4C95D] bg-[#F4C95D]/10 border border-[#F4C95D]/20 px-2.5 py-0.5 rounded-full font-bold font-poppins">
            Step 7 of 9
          </span>
        </div>

        {/* Full-Width Progress & Overview Banner (Fixes left-side blank space) */}
        <div className="p-4 bg-[#11131A] border border-[rgba(255,255,255,0.08)] rounded-[20px] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Progress dial & text summary */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#F4C95D"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="251.2"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * completionPercentage) / 100 }}
                  transition={{ duration: 1 }}
                />
              </svg>

              <div className="absolute text-center">
                <span className="text-sm font-bold text-white font-space-grotesk block leading-none">
                  {completionPercentage}%
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white font-poppins">
                Document Checklist Audit
              </h4>
              <p className="text-[11px] text-[#A5A8B5] font-inter mt-0.5">
                <strong className="text-white font-semibold">{verifiedCount} of {totalCount}</strong> files verified. Upload remaining records for field audit.
              </p>
            </div>
          </div>

          {/* Status Breakdown Pills */}
          <div className="flex items-center gap-2 flex-wrap sm:justify-end w-full sm:w-auto">
            <span className="px-2.5 py-1 rounded-[8px] bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-[10px] font-bold font-poppins">
              {verifiedCount} Verified
            </span>
            {uploadedCount > 0 && (
              <span className="px-2.5 py-1 rounded-[8px] bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold font-poppins">
                {uploadedCount} Uploaded
              </span>
            )}
            {pendingCount > 0 && (
              <span className="px-2.5 py-1 rounded-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold font-poppins">
                {pendingCount} Pending
              </span>
            )}
            {requiredCount > 0 && (
              <span className="px-2.5 py-1 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold font-poppins">
                {requiredCount} Required
              </span>
            )}
          </div>
        </div>

        {/* Full-Width 2-Column Responsive Document Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {docList.map((doc, idx) => {
            const isVerified = doc.status === "Verified";
            const isScanning = doc.status === "Scanning";

            return (
              <div
                key={idx}
                className="p-3.5 bg-[#11131A] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] rounded-[18px] flex items-center justify-between gap-3 transition-all"
              >
                {/* Left: Document Icon & Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 border ${
                      isVerified
                        ? "bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]"
                        : isScanning
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        : "bg-[#F4C95D]/10 border-[#F4C95D]/20 text-[#F4C95D]"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate block font-inter">
                      {doc.name}
                    </h4>
                    {doc.fileName ? (
                      <p className="text-[10px] text-[#F4C95D] truncate mt-0.5 font-mono">
                        📄 {doc.fileName}
                      </p>
                    ) : (
                      <span className="text-[9px] text-[#A5A8B5] block font-space-grotesk mt-0.5">
                        {isVerified ? doc.size || "Verified Record" : "Upload Required"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Status & Action Button */}
                <div className="shrink-0">
                  {isScanning ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-blue-500/10 border border-blue-500/20">
                      <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[9px] text-blue-400 font-bold uppercase font-poppins">
                        Scanning...
                      </span>
                    </div>
                  ) : isVerified ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-[9px] font-bold uppercase tracking-wider font-poppins">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Verified</span>
                      </span>

                      {doc.uploadedFile && (
                        <button
                          onClick={() => setPreviewFile(doc.uploadedFile)}
                          className="p-1.5 rounded-[8px] bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/20 transition cursor-pointer"
                          title="Preview File"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : doc.status === "Uploaded" ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-wider font-poppins">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Uploaded</span>
                      </span>
                      <button
                        onClick={() => handleUploadClick(idx)}
                        className="px-2.5 py-1 rounded-[8px] bg-[#171923] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] text-[9px] font-bold text-[#A5A8B5] hover:text-white transition cursor-pointer font-poppins"
                      >
                        Re-Upload
                      </button>
                    </div>
                  ) : doc.status === "Pending" ? (
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold uppercase tracking-wider font-poppins">
                        Pending
                      </span>
                      <button
                        onClick={() => handleUploadClick(idx)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] text-[9px] font-bold uppercase tracking-wider font-poppins shrink-0 transition-colors shadow-sm cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-wider font-poppins">
                        Required
                      </span>
                      <button
                        onClick={() => handleUploadClick(idx)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] text-[9px] font-bold uppercase tracking-wider font-poppins shrink-0 transition-colors shadow-sm cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-end pt-3 border-t border-[rgba(255,255,255,0.05)]">
          <button
            onClick={onNext}
            className="px-6 py-2.5 bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] font-bold text-xs rounded-[16px] transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-[0_4px_20px_rgba(244,201,93,0.15)] cursor-pointer"
          >
            <span>Track Claim Timeline</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-4xl h-[80vh] bg-[#11131A] rounded-2xl border border-[rgba(255,255,255,0.1)] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
              <div>
                <h3 className="text-white font-bold text-sm font-poppins">
                  Document Preview
                </h3>
                <p className="text-xs text-[#A5A8B5] font-inter mt-0.5">
                  {previewFile.name}
                </p>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <iframe
              title="Document Preview"
              src={URL.createObjectURL(previewFile)}
              className="w-full flex-1 bg-white"
            />
          </div>
        </div>
      )}
    </>
  );
}
