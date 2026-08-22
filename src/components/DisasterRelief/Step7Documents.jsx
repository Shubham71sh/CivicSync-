import React, { useState, useRef, useEffect } from "react";
import {
  Check,
  Upload,
  ChevronRight,
  FileText,
  Eye,
  Trash2,
  X,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ExternalLink,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";

// ── Fallback document explanations ───────────────────────────────────────────
function getDocumentExplanation(name) {
  const n = name.toLowerCase();
  if (n.includes("aadhaar") || n.includes("identity") || n.includes("pan card") || n.includes("voter id")) {
    return "Required for identity verification.";
  }
  if (n.includes("damage") || n.includes("assessment") || n.includes("photo") || n.includes("images")) {
    return "Required to verify the reported disaster damage.";
  }
  if (n.includes("land") || n.includes("ownership") || n.includes("property") || n.includes("lease") || n.includes("record")) {
    return "Required to verify ownership/occupancy for land-related assistance.";
  }
  if (n.includes("bank") || n.includes("passbook") || n.includes("account")) {
    return "Required for Direct Benefit Transfer (DBT) relief fund disbursement.";
  }
  if (n.includes("residence") || n.includes("domicile") || n.includes("bill")) {
    return "Required to verify local residency in the affected disaster zone.";
  }
  return "Required as supporting evidence for your government relief application.";
}

// Normalize database/API statuses to match UI expectations:
// - "Verified" -> "Verified"
// - "Uploaded", "Verifying", "Pending Verification" -> "Uploaded"
// - "Rejected" -> "Rejected"
// - "Required", "Pending" -> "Required"
function normalizeStatus(status) {
  if (!status) return "Required";
  const s = String(status).toLowerCase();
  if (s === "verified") return "Verified";
  if (s === "uploaded" || s === "verifying" || s === "pending verification" || s === "pending_verification") return "Uploaded";
  if (s === "rejected") return "Rejected";
  return "Required";
}

// ── Convert RAG document objects to internal doc format ───────────────────────
function ragDocsToChecklist(ragDocs = [], schemeDocuments = []) {
  // Build from RAG first
  const result = ragDocs.map((doc) => {
    const docName = typeof doc === "string" ? doc : (doc.name || "Document");
    const whyRequired = typeof doc === "string" ? "" : (doc.why_required || "");
    const rawStatus = typeof doc === "string" ? "Required" : (doc.status || "Required");
    return {
      name: docName,
      status: normalizeStatus(rawStatus),
      size: "",
      uploadedFile: null,
      fileName: "",
      required: typeof doc === "string" ? true : (doc.mandatory !== false),
      why_required: whyRequired || getDocumentExplanation(docName),
      conditional_note: typeof doc === "string" ? "" : (doc.conditional_note || ""),
      source_authority: typeof doc === "string" ? "" : (doc.source_authority || ""),
    };
  });

  // Merge any scheme-specific documents not already in the list
  (schemeDocuments || []).forEach((sDoc) => {
    const docName = typeof sDoc === "string" ? sDoc : sDoc?.name;
    if (docName && !result.some((d) => d.name.toLowerCase() === docName.toLowerCase())) {
      const whyRequired = typeof sDoc === "string" ? "" : (sDoc.why_required || "");
      const rawStatus = typeof sDoc === "string" ? "Required" : (sDoc.status || "Required");
      result.push({
        name: docName,
        status: normalizeStatus(rawStatus),
        size: "",
        uploadedFile: null,
        fileName: "",
        required: true,
        why_required: whyRequired || getDocumentExplanation(docName),
        conditional_note: typeof sDoc === "string" ? "" : (sDoc.conditional_note || ""),
        source_authority: typeof sDoc === "string" ? "" : (sDoc.source_authority || ""),
      });
    }
  });

  return result;
}

// ── Delete Confirmation Modal ─────────────────────────────────────────────────
function DeleteConfirmModal({ docName, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[#11131A] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-poppins">Delete Document</h3>
            <p className="text-xs text-[#A5A8B5] font-inter">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-xs text-[#A5A8B5] font-inter leading-relaxed">
          Delete <strong className="text-white">{docName}</strong>? The document status will reset to Required.
        </p>
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#171923] hover:bg-[#202330] text-xs font-bold text-[#A5A8B5] hover:text-white transition-all cursor-pointer font-poppins"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-[10px] bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold text-red-400 hover:text-red-300 transition-all cursor-pointer font-poppins"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── File Preview Modal ────────────────────────────────────────────────────────
function PreviewModal({ file, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-4xl h-[80vh] bg-[#11131A] rounded-2xl border border-[rgba(255,255,255,0.1)] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
          <div>
            <h3 className="text-white font-bold text-sm font-poppins">Document Preview</h3>
            <p className="text-xs text-[#A5A8B5] font-inter mt-0.5">{file.name || "Document"}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {file instanceof File ? (
          <iframe
            title="Document Preview"
            src={URL.createObjectURL(file)}
            className="w-full flex-1 bg-white"
          />
        ) : (
          <div className="w-full flex-1 bg-[#0B0B12] flex items-center justify-center text-[#A5A8B5] text-xs font-inter p-6 text-center">
            <div className="max-w-md space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F4C95D]/10 border border-[#F4C95D]/30 flex items-center justify-center text-[#F4C95D] mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-sm font-poppins">{file.name}</h4>
              <p className="leading-relaxed">File preview is available for directly uploaded documents.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Step7 Component ───────────────────────────────────────────────────────
export default function Step7Documents({
  documents = [],
  disasterType = "flood",
  applicableSchemes = [], // Array of actually applicable schemes (filtered in Step 6)
  scheme = null,          // Fallback legacy scheme
  schemeName = "",
  onNext,
  onDocumentsUpdate,
  ragData,
  ragLoading,
}) {
  const fileInputRef = useRef(null);
  const [selectedDocIndex, setSelectedDocIndex] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Combine document requirements from all applicable schemes ──────────────
  const schemeDocs = (() => {
    const list = [];
    const seen = new Set();
    applicableSchemes.forEach((sch) => {
      const schDocs = sch.required_documents || sch.requiredDocuments || [];
      schDocs.forEach((doc) => {
        const docName = typeof doc === "string" ? doc : doc?.name;
        if (docName && !seen.has(docName.toLowerCase())) {
          seen.add(docName.toLowerCase());
          list.push(doc);
        }
      });
    });
    // Fallback if empty, use legacy scheme docs
    if (list.length === 0 && scheme) {
      const schDocs = scheme.required_documents || scheme.requiredDocuments || [];
      schDocs.forEach((doc) => {
        const docName = typeof doc === "string" ? doc : doc?.name;
        if (docName && !seen.has(docName.toLowerCase())) {
          seen.add(docName.toLowerCase());
          list.push(doc);
        }
      });
    }
    return list;
  })();

  const ragDocList = (() => {
    if (!ragData || !ragData.rag_available) return null;
    const d = ragData.data || {};
    if (Array.isArray(d.documents) && d.documents.length > 0) return d.documents;
    return null;
  })();

  // Helper to merge parent document statuses with default initialized checklist
  const mergeParentStatuses = (initialList) => {
    if (Array.isArray(documents) && documents.length > 0) {
      return initialList.map((item) => {
        const parentDoc = documents.find((pd) => pd.name.toLowerCase() === item.name.toLowerCase());
        if (parentDoc) {
          const normStatus = normalizeStatus(parentDoc.status);
          return {
            ...item,
            status: normStatus,
            size: parentDoc.size || item.size,
            fileName: parentDoc.fileName || parentDoc.filename || item.fileName || (normStatus !== "Required" ? "document.pdf" : ""),
          };
        }
        return item;
      });
    }
    return initialList;
  };

  // Initialize docList state
  const [docList, setDocList] = useState(() => {
    let initialList = [];
    if (ragDocList && ragDocList.length > 0) {
      initialList = ragDocsToChecklist(ragDocList, schemeDocs);
    } else if (schemeDocs.length > 0) {
      initialList = ragDocsToChecklist([], schemeDocs);
    }
    return mergeParentStatuses(initialList);
  });

  // ── Sync docList when RAG data arrives ───────────────────────────────────
  const [ragSynced, setRagSynced] = useState(false);
  if (!ragLoading && ragDocList && ragDocList.length > 0 && !ragSynced) {
    setRagSynced(true);
    const newList = ragDocsToChecklist(ragDocList, schemeDocs);
    // Preserve existing upload state for matching doc names
    const merged = newList.map((nd) => {
      const existing = docList.find((d) => d.name.toLowerCase() === nd.name.toLowerCase()) ||
                       (Array.isArray(documents) ? documents.find((pd) => pd.name.toLowerCase() === nd.name.toLowerCase()) : null);
      if (existing) {
        return {
          ...nd,
          status: normalizeStatus(existing.status || nd.status),
          size: existing.size || nd.size,
          fileName: existing.fileName || existing.filename || nd.fileName || (normalizeStatus(existing.status) !== "Required" ? "document.pdf" : ""),
          uploadedFile: existing.uploadedFile || null,
        };
      }
      return nd;
    });
    setDocList(merged);
  }

  // Lift state up so Step 8 and others can display it correctly
  useEffect(() => {
    if (onDocumentsUpdate) {
      onDocumentsUpdate(docList);
    }
  }, [docList, onDocumentsUpdate]);

  // ── Computed progress ─────────────────────────────────────────────────────
  const requiredDocs = docList.filter((d) => d.required !== false);
  const uploadedDocs = docList.filter((d) => d.status === "Uploaded" || d.status === "Verified" || d.status === "Verifying");
  const verifiedDocs = docList.filter((d) => d.status === "Verified");

  const totalRequired = requiredDocs.length || 1;
  const uploadedCount = uploadedDocs.length;
  const verifiedCount = verifiedDocs.length;
  const pendingCount = docList.filter((d) => d.status === "Verifying" || d.status === "Uploaded").length;
  const notUploadedCount = docList.filter((d) => d.status === "Required").length;
  const completionPercentage = Math.round((uploadedCount / totalRequired) * 100);

  // ── Upload handler ────────────────────────────────────────────────────────
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
              status: "Uploaded",
              size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
              fileName: file.name,
              uploadedFile: file,
            }
          : doc
      )
    );
    e.target.value = "";
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDeleteConfirm = () => {
    if (deleteTarget === null) return;
    setDocList((prev) =>
      prev.map((doc, idx) =>
        idx === deleteTarget
          ? { ...doc, status: "Required", size: "", fileName: "", uploadedFile: null }
          : doc
      )
    );
    setDeleteTarget(null);
  };

  // ── View handler ──────────────────────────────────────────────────────────
  const handleView = (doc) => {
    setPreviewFile(doc.uploadedFile || { name: doc.name });
  };

  // ── Source metadata from RAG ──────────────────────────────────────────────
  const topSource = (ragData?.sources || [])[0] || {};
  const sourceAuthority = topSource.authority || (applicableSchemes[0] || scheme)?.authority || "Ministry of Home Affairs";
  const sourceUrl = topSource.url || (applicableSchemes[0] || scheme)?.official_source_url || "https://ndma.gov.in";
  const sourceDoc = topSource.document || (applicableSchemes[0] || scheme)?.document_name || "";

  const schemeTitleDisplay = applicableSchemes.map((s) => s.name || s.official_name || s.schemeName).join(", ");

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
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-poppins">
              Document Vault
            </h3>
            <p className="text-xs text-[#A5A8B5] font-inter mt-0.5">
              Upload and verify required documents for your relief claim
            </p>
          </div>
          <span className="text-[10px] text-[#F4C95D] bg-[#F4C95D]/10 border border-[#F4C95D]/20 px-2.5 py-0.5 rounded-full font-bold font-poppins">
            Step 7 of 9
          </span>
        </div>

        {/* ── Scheme context badge ─────────────────────────────────── */}
        {schemeTitleDisplay && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
            <ShieldCheck className="w-3 h-3 text-[#22C55E] shrink-0" />
            <span className="text-[9px] text-[#A5A8B5] font-inter truncate">
              Documents for: <strong className="text-white">{schemeTitleDisplay}</strong>
            </span>
          </div>
        )}

        {/* ── RAG loading message ──────────────────────────────────── */}
        {ragLoading && (
          <div className="flex items-center gap-2.5 p-3 rounded-[12px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
            <Loader2 className="w-3.5 h-3.5 text-[#F4C95D] animate-spin shrink-0" />
            <span className="text-[10px] text-[#A5A8B5] font-inter">
              Loading required document list from verified government source…
            </span>
          </div>
        )}

        {/* ── No document list fallback ────────────────────────────── */}
        {!ragLoading && docList.length === 0 && (
          <div className="p-6 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)] flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-6 h-6 text-[#A5A8B5] opacity-50" />
            <p className="text-xs text-[#A5A8B5] font-inter leading-relaxed max-w-sm">
              Document requirements are not specified in the available official source.
              Contact your District Collector's office for the current document checklist.
            </p>
            <a
              href="https://ndma.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[9px] text-[#22C55E] hover:text-[#4ADE80] font-bold transition-colors"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              Visit NDMA Official Website
            </a>
          </div>
        )}

        {/* ── Progress Banner ──────────────────────────────────────── */}
        {docList.length > 0 && (
          <div className="p-4 bg-[#11131A] border border-[rgba(255,255,255,0.08)] rounded-[20px] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                  <motion.circle
                    cx="50" cy="50" r="40" stroke="#F4C95D" strokeWidth="8" fill="none"
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
                <h4 className="text-xs font-bold text-white font-poppins">Document Vault</h4>
                <p className="text-[11px] text-[#A5A8B5] font-inter mt-0.5">
                  Required documents for your applicable relief schemes:
                </p>
                <p className="text-[11px] text-[#A5A8B5] font-inter mt-0.5">
                  <strong className="text-white">{totalRequired} required</strong> · <strong className="text-white">{uploadedCount} uploaded</strong> · <strong className="text-white">{verifiedCount} verified</strong> · <strong className="text-[#F4C95D]">{totalRequired - uploadedCount} remaining</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:justify-end w-full sm:w-auto">
              <span className="px-2.5 py-1 rounded-[8px] bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-[10px] font-bold font-poppins">
                {verifiedCount} Verified
              </span>
              {uploadedCount - verifiedCount > 0 && (
                <span className="px-2.5 py-1 rounded-[8px] bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold font-poppins">
                  {uploadedCount - verifiedCount} Uploaded
                </span>
              )}
              {pendingCount > 0 && (
                <span className="px-2.5 py-1 rounded-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold font-poppins">
                  {pendingCount} Verifying
                </span>
              )}
              {notUploadedCount > 0 && (
                <span className="px-2.5 py-1 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold font-poppins">
                  {notUploadedCount} Required
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Document Cards Grid (Restored EXACT 2-column layout) ── */}
        {docList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {docList.map((doc, idx) => {
              const isVerified = doc.status === "Verified";
              const isVerifying = doc.status === "Verifying";
              const isUploaded = doc.status === "Uploaded";
              const isRejected = doc.status === "Rejected";
              const cleanName = doc.name.replace(/\(Source:.*\)/gi, "").trim();
              const isOptional = doc.required === false;

              return (
                <div
                  key={idx}
                  className="p-3.5 bg-[#11131A] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] rounded-[18px] flex flex-col gap-2.5 transition-all"
                >
                  {/* Top row: icon + name + status */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 border ${
                        isVerified
                          ? "bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]"
                          : isVerifying
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : isUploaded
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : isRejected
                          ? "bg-red-500/10 border-red-500/25 text-red-400"
                          : "bg-[#F4C95D]/10 border-[#F4C95D]/20 text-[#F4C95D]"
                      }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-white truncate font-inter">{cleanName}</h4>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-poppins border ${
                            isOptional
                              ? "bg-[#F4C95D]/10 text-[#F4C95D] border-[#F4C95D]/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            {isOptional ? "Optional" : "Required"}
                          </span>
                        </div>
                        <div className="text-[10px] font-medium font-poppins flex items-center gap-1 mt-0.5">
                          {isVerified ? (
                            <span className="text-[#22C55E]">✓ Verified</span>
                          ) : isVerifying ? (
                            <span className="text-blue-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 border border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                              Verifying…
                            </span>
                          ) : isUploaded ? (
                            <span className="text-blue-400">Uploaded · Pending Verification</span>
                          ) : isRejected ? (
                            <span className="text-red-400">Rejected — Re-upload Required</span>
                          ) : (
                            <span className="text-red-400">Not Uploaded</span>
                          )}
                        </div>
                        {doc.fileName && (
                          <p className="text-[9px] text-[#A5A8B5] font-inter truncate mt-0.5">{doc.fileName}</p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {isVerifying ? (
                        <span className="text-[10px] text-blue-400/60 font-bold uppercase font-poppins px-2 py-1.5">
                          Pending
                        </span>
                      ) : isVerified ? (
                        <>
                          <button
                            onClick={() => handleView(doc)}
                            className="px-3 py-1.5 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#171923] hover:bg-[#202330] text-[11px] font-bold text-white transition cursor-pointer font-poppins"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setDeleteTarget(idx)}
                            className="p-1.5 rounded-[8px] border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : isUploaded ? (
                        <>
                          <button
                            onClick={() => handleView(doc)}
                            className="px-3 py-1.5 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#171923] hover:bg-[#202330] text-[11px] font-bold text-white transition cursor-pointer font-poppins"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setDeleteTarget(idx)}
                            className="p-1.5 rounded-[8px] border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : isRejected ? (
                        <button
                          onClick={() => handleUploadClick(idx)}
                          className="px-3 py-1.5 rounded-[10px] bg-[#171923] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] text-[11px] font-bold text-white transition cursor-pointer font-poppins"
                        >
                          Replace
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUploadClick(idx)}
                          className="px-4 py-1.5 rounded-[10px] bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] text-[11px] font-bold uppercase tracking-wider transition cursor-pointer font-poppins"
                        >
                          Upload
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Why required / conditional note */}
                  {(doc.why_required || doc.conditional_note) && (
                    <div className="pl-12 space-y-0.5">
                      {doc.why_required && (
                        <p className="text-[9px] text-[#A5A8B5] font-inter leading-relaxed">{doc.why_required}</p>
                      )}
                      {doc.conditional_note && (
                        <p className="text-[9px] text-[#F4C95D]/80 font-inter italic">Note: {doc.conditional_note}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Verified Source Footer ───────────────────────────────── */}
        {!ragLoading && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-[14px] bg-[#0B0B12] border border-[#22C55E]/20">
            <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-[#22C55E] uppercase tracking-wider font-poppins">
                Verified Government Source
              </p>
              <p className="text-[10px] text-[#A5A8B5] font-inter mt-0.5 truncate">
                {sourceAuthority}
                {sourceDoc ? ` · ${sourceDoc}` : ""}
              </p>
            </div>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1 text-[9px] text-[#22C55E] hover:text-[#4ADE80] font-bold transition-colors"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              View Official Source
            </a>
          </div>
        )}

        {/* ── Navigation ──────────────────────────────────────────── */}
        <div className="flex justify-end pt-3">
          <button
            onClick={onNext}
            className="px-6 py-2.5 bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] font-bold text-xs rounded-[16px] transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-[0_4px_20px_rgba(244,201,93,0.15)] cursor-pointer"
          >
            <span>Track Claim Timeline</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}
      {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      {deleteTarget !== null && (
        <DeleteConfirmModal
          docName={docList[deleteTarget]?.name || "this document"}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
}
