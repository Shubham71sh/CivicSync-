import React, { useState, useRef, useEffect } from "react";
import { validateEvidence } from "../../services/api";
import {
  Upload, X, FileText, Video, Check, ChevronRight,
  AlertCircle, Loader2, ShieldCheck, ShieldX, Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const UPLOAD_CATEGORIES = [
  "House Photos",
  "Crop Photos",
  "Vehicle Photos",
  "Shop Photos",
  "Videos",
  "Documents",
];

const ACCEPTED_MIME = [
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "video/mp4", "video/webm", "video/quicktime",
  "application/pdf",
];

const MAX_FILE_MB = 20;

/**
 * Step 2 — Upload Evidence with real AI validation.
 *
 * Props:
 *   reportId        string    — current report ID (from Step 1)
 *   disasterType    string    — selected disaster (from Step 1)
 *   uploadedFiles   array     — file list owned by parent (DisasterRelief.jsx)
 *   setUploadedFiles fn       — parent setter (single source of truth for files)
 *   aiStatus        string    — "online"|"warming_up"|"offline"|"unknown" (from /health)
 *   onNext          fn        — advance to Step 3, called with merged evidenceResult
 */
export default function Step2UploadCenter({
  reportId,
  disasterType,
  uploadedFiles,
  setUploadedFiles,
  aiStatus = "unknown",
  onNext,
}) {
  const [activeCategory, setActiveCategory] = useState("House Photos");
  const [isDragActive,   setIsDragActive]   = useState(false);
  const [globalError,    setGlobalError]    = useState(null);
  const fileInputRef = useRef(null);

  // ── helpers ────────────────────────────────────────────────────────────

  // updateFile: patches a single file entry in the parent-owned array.
  // Uses functional updater — safe to call from async callbacks.
  const updateFile = (id, patch) =>
    setUploadedFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const hasAnyAccepted = uploadedFiles.some((f) => f.validationStatus === "accepted");
  const hasAnyPending  = uploadedFiles.some((f) => f.validationStatus === "validating");
  const allDone        = uploadedFiles.length > 0 && !hasAnyPending;

  // ── drag/drop handlers ─────────────────────────────────────────────────

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e) => {
    if (e.target.files?.length) addFiles(e.target.files);
    // Reset so re-selecting same file triggers onChange
    e.target.value = "";
  };

  // ── add + validate files ───────────────────────────────────────────────

  const addFiles = (fileList) => {
    setGlobalError(null);
    const incoming = Array.from(fileList);
    const newEntries = [];

    for (const file of incoming) {
      // Client-side quick checks before sending to backend
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > MAX_FILE_MB) {
        setGlobalError(`"${file.name}" exceeds the ${MAX_FILE_MB} MB size limit.`);
        continue;
      }
      if (!ACCEPTED_MIME.includes(file.type) && file.type !== "") {
        setGlobalError(`"${file.name}" has an unsupported format. Upload JPEG, PNG, WEBP, PDF, or MP4.`);
        continue;
      }

      const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      const isImg = file.type.startsWith("image/");
      const isVid = file.type.startsWith("video/");

      newEntries.push({
        id,
        name:         file.name,
        originalFile: file,
        size:         sizeMB.toFixed(2) + " MB",
        type:         file.type,
        category:     activeCategory,
        preview:      isImg ? URL.createObjectURL(file) : null,
        isImg,
        isVid,
        // validation state
        validationStatus: "validating",   // "validating" | "accepted" | "rejected" | "error"
        validationResult: null,
      });
    }

    if (!newEntries.length) return;

    // IMPORTANT: call onFilesChange AFTER state is committed, not inside the updater.
    // Calling a prop callback inside a setState updater causes the React warning:
    // "Cannot update a component while rendering a different component".
    setUploadedFiles((prev) => [...prev, ...newEntries]);

    // Fire validation requests for each new entry
    newEntries.forEach((entry) => validateFile(entry));
  };

  const validateFile = async (entry) => {
    if (!reportId) {
      updateFile(entry.id, {
        validationStatus: "error",
        validationResult: {
          valid: false,
          relevant: false,
          reject_reason: "Report not initialised. Please restart from Step 1.",
        },
      });
      return;
    }

    try {
      const result = await validateEvidence(reportId, entry.originalFile, disasterType || "flood");

      if (!result.valid) {
        updateFile(entry.id, {
          validationStatus: "rejected",
          validationResult: result,
        });
        return;
      }

      if (!result.relevant && !result.ai_unavailable) {
        updateFile(entry.id, {
          validationStatus: "rejected",
          validationResult: result,
        });
        return;
      }

      updateFile(entry.id, {
        validationStatus: "accepted",
        validationResult: result,
      });
    } catch (err) {
      // Network/backend failure — don't silently accept
      updateFile(entry.id, {
        validationStatus: "error",
        validationResult: {
          valid: false,
          relevant: false,
          reject_reason:
            err?.response?.data?.detail ||
            "Evidence validation failed. Please check your connection and try again.",
        },
      });
    }
  };

  // ── remove file ────────────────────────────────────────────────────────

  const removeFile = (id) => {
    setUploadedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleContinue = () => {
    if (!hasAnyAccepted) return;

    // Build a consolidated evidence result from all accepted files
    const acceptedFiles = uploadedFiles.filter((f) => f.validationStatus === "accepted");
    const mergedEvidence = acceptedFiles.reduce(
      (acc, f) => {
        const r = f.validationResult || {};
        return {
          ...acc,
          detected_objects: [...new Set([...acc.detected_objects, ...(r.detected_objects || [])])],
          evidence:         [...new Set([...acc.evidence,         ...(r.evidence         || [])])],
          possible_damage:  [...new Set([...acc.possible_damage,  ...(r.possible_damage  || [])])],
          confidence:       Math.max(acc.confidence, r.confidence || 0),
          file_type:        acc.file_type || r.file_type || "unknown",
          summary:          acc.summary   || r.summary   || "",
          disaster:         disasterType  || "flood",
        };
      },
      { detected_objects: [], evidence: [], possible_damage: [], confidence: 0, file_type: "", summary: "", disaster: disasterType }
    );

    onNext(mergedEvidence);
  };

  // ── render ──────────────────────────────────────────────────────────────

  const aiStatusConfig = {
    online:     { dot: "bg-[#22C55E]", text: "text-[#22C55E]", label: "AI Online" },
    warming_up: { dot: "bg-[#F59E0B] animate-pulse", text: "text-[#F59E0B]", label: "AI Warming Up" },
    offline:    { dot: "bg-red-500", text: "text-red-400", label: "AI Offline" },
    unknown:    { dot: "bg-[#A5A8B5]", text: "text-[#A5A8B5]", label: "Checking AI…" },
  };
  const aiCfg = aiStatusConfig[aiStatus] || aiStatusConfig.unknown;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-poppins">
            Upload Evidence
          </h3>
          <p className="text-xs text-[#A5A8B5] font-inter">
            Upload photos, documents, or videos of{" "}
            <span className="text-white font-semibold capitalize">{disasterType || "disaster"}</span>{" "}
            damage — AI will validate relevance before analysis
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] text-[#F4C95D] bg-[#F4C95D]/10 border border-[#F4C95D]/20 px-2 py-0.5 rounded-full font-bold">
            Step 2 of 9
          </span>
          {/* Real AI status indicator — reflects actual /health endpoint */}
          <span className={`text-[9px] font-bold flex items-center gap-1.5 ${aiCfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${aiCfg.dot}`} />
            {aiCfg.label}
          </span>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {UPLOAD_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-[12px] border text-xs font-semibold font-inter transition-all duration-300 ${
              activeCategory === cat
                ? "border-[#F4C95D] bg-[#F4C95D]/10 text-[#F4C95D]"
                : "border-[rgba(255,255,255,0.05)] bg-[#171923] text-[#A5A8B5] hover:border-[rgba(255,255,255,0.15)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Restored evidence notice ── */}
      {uploadedFiles.some((f) => f.validationResult?.restored) && (
        <div className="flex items-start gap-3 p-3.5 rounded-[14px] bg-[#F4C95D]/8 border border-[#F4C95D]/20 text-xs font-inter">
          <Info className="w-4 h-4 text-[#F4C95D] shrink-0 mt-0.5" />
          <div className="text-[#A5A8B5]">
            <span className="text-[#F4C95D] font-semibold">Evidence restored from previous session.</span>{" "}
            Your files were already validated and stored. Upload new files only if you need to add more evidence.
          </div>
        </div>
      )}

      {/* ── Global error ── */}
      <AnimatePresence>
        {globalError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-3.5 rounded-[14px] bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-inter"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{globalError}</span>
            <button onClick={() => setGlobalError(null)} className="ml-auto shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Drop Zone ── */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-[20px] p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
          isDragActive
            ? "border-[#F4C95D] bg-[#F4C95D]/5 scale-[0.99]"
            : "border-[rgba(255,255,255,0.08)] bg-[#11131A] hover:bg-[#171923] hover:border-[rgba(255,255,255,0.2)]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,application/pdf"
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-[16px] bg-[#171923] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#F4C95D]">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white font-inter">
              Drag & drop or{" "}
              <span className="text-[#F4C95D] underline">browse files</span>
            </p>
            <p className="text-[10px] text-[#A5A8B5] mt-1 font-inter">
              JPEG, PNG, WEBP, PDF, MP4 · max {MAX_FILE_MB} MB ·{" "}
              <span className="font-semibold text-white">{activeCategory}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── File list with validation status ── */}
      <AnimatePresence initial={false}>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h4 className="text-[10px] font-bold text-[#A5A8B5] uppercase tracking-widest font-poppins">
              Evidence Files
            </h4>

            <div className="grid gap-3">
              {uploadedFiles.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  disasterType={disasterType}
                  onRemove={removeFile}
                  onRetry={() => {
                    updateFile(file.id, { validationStatus: "validating", validationResult: null });
                    validateFile(file);
                  }}
                />
              ))}
            </div>

            {/* ── Summary bar after all validations are done ── */}
            {allDone && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 p-3.5 rounded-[14px] border text-xs font-inter ${
                  hasAnyAccepted
                    ? "bg-[#22C55E]/8 border-[#22C55E]/20 text-[#22C55E]"
                    : "bg-red-500/8 border-red-500/20 text-red-400"
                }`}
              >
                {hasAnyAccepted ? (
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <ShieldX className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  {hasAnyAccepted ? (
                    <p className="font-semibold">
                      Evidence validated — ready for AI damage analysis.{" "}
                      <span className="opacity-75">
                        ({uploadedFiles.filter((f) => f.validationStatus === "accepted").length} accepted,{" "}
                        {uploadedFiles.filter((f) => f.validationStatus === "rejected" || f.validationStatus === "error").length} rejected)
                      </span>
                    </p>
                  ) : (
                    <p className="font-semibold">
                      No valid evidence accepted. Please upload relevant{" "}
                      <span className="capitalize">{disasterType}</span>-related evidence to continue.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Continue button ── */}
      <div className="flex justify-end pt-4 border-t border-[rgba(255,255,255,0.05)]">
        <button
          onClick={handleContinue}
          disabled={!hasAnyAccepted || hasAnyPending}
          className="px-6 py-2.5 bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] font-bold text-xs rounded-[16px] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
        >
          {hasAnyPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Validating Evidence…</span>
            </>
          ) : (
            <>
              <span>Validate &amp; Analyse Evidence</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FileRow — one uploaded file with validation status display
// ─────────────────────────────────────────────────────────────────────────────

function FileRow({ file, disasterType, onRemove, onRetry }) {
  const [expanded, setExpanded] = useState(false);
  const { validationStatus, validationResult: vr } = file;

  const statusConfig = {
    validating: {
      icon:  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4C95D]" />,
      label: "Validating…",
      color: "text-[#F4C95D]",
      bar:   "bg-[#F4C95D]",
    },
    accepted: {
      icon:  <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />,
      label: vr?.ai_unavailable ? "Accepted (AI offline)" : `Accepted · ${vr?.confidence ?? 0}% confidence`,
      color: "text-[#22C55E]",
      bar:   "bg-[#22C55E]",
    },
    rejected: {
      icon:  <ShieldX className="w-3.5 h-3.5 text-red-400" />,
      label: "Rejected",
      color: "text-red-400",
      bar:   "bg-red-500",
    },
    error: {
      icon:  <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B]" />,
      label: "Validation error",
      color: "text-[#F59E0B]",
      bar:   "bg-[#F59E0B]",
    },
  };

  const cfg = statusConfig[validationStatus] || statusConfig.validating;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={`rounded-[20px] border transition-all duration-300 overflow-hidden ${
        validationStatus === "accepted"
          ? "bg-[#11131A] border-[#22C55E]/20"
          : validationStatus === "rejected" || validationStatus === "error"
          ? "bg-[#11131A] border-red-500/20"
          : "bg-[#11131A] border-[rgba(255,255,255,0.08)]"
      }`}
    >
      {/* ── Main row ── */}
      <div className="flex items-center gap-3 p-3">
        {/* Thumbnail / icon */}
        <div className="w-10 h-10 rounded-[12px] bg-[#171923] border border-[rgba(255,255,255,0.05)] overflow-hidden flex items-center justify-center shrink-0">
          {file.isImg && file.preview ? (
            <img src={file.preview} alt="" className="w-full h-full object-cover" />
          ) : file.isVid ? (
            <Video className="w-5 h-5 text-[#EF4444]" />
          ) : (
            <FileText className="w-5 h-5 text-[#F4C95D]" />
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-white truncate font-inter">{file.name}</span>
            <span className="text-[10px] text-[#A5A8B5] shrink-0 ml-2">{file.size}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] px-2 py-0.5 rounded bg-[#171923] border border-[rgba(255,255,255,0.05)] font-semibold text-[#A5A8B5]">
              {file.category}
            </span>

            <span className={`text-[9px] font-bold flex items-center gap-1 ${cfg.color}`}>
              {cfg.icon}
              {cfg.label}
            </span>

            {/* Expand button for details */}
            {(validationStatus === "accepted" || validationStatus === "rejected") && vr && (
              <button
                onClick={() => setExpanded((x) => !x)}
                className="ml-auto text-[9px] text-[#A5A8B5] hover:text-white flex items-center gap-0.5 font-semibold"
              >
                <Info className="w-3 h-3" />
                {expanded ? "Hide" : "Details"}
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {(validationStatus === "rejected" || validationStatus === "error") && (
            <button
              onClick={onRetry}
              className="text-[9px] font-bold text-[#F4C95D] hover:text-white px-2 py-1 rounded-[8px] bg-[#F4C95D]/10 hover:bg-[#F4C95D]/20 transition-colors"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => onRemove(file.id)}
            className="p-1 rounded-[8px] hover:bg-[#171923] text-[#A5A8B5] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Expanded details panel ── */}
      <AnimatePresence>
        {expanded && vr && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-[rgba(255,255,255,0.05)] space-y-3">
              {/* Rejection reason */}
              {validationStatus === "rejected" && vr.reject_reason && (
                <div className="flex items-start gap-2 p-3 rounded-[12px] bg-red-500/8 border border-red-500/15">
                  <ShieldX className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-red-400 mb-0.5">Evidence Rejected</p>
                    <p className="text-[10px] text-[#A5A8B5] leading-relaxed">{vr.reject_reason}</p>
                    <p className="text-[9px] text-[#A5A8B5] mt-1.5 opacity-70">
                      Please upload evidence clearly showing{" "}
                      <span className="capitalize text-white">{disasterType}</span>-related damage.
                    </p>
                  </div>
                </div>
              )}

              {/* Accepted: evidence details */}
              {validationStatus === "accepted" && (
                <div className="space-y-2.5">
                  {vr.summary && (
                    <p className="text-[10px] text-[#A5A8B5] leading-relaxed italic">
                      "{vr.summary}"
                    </p>
                  )}

                  {vr.detected_objects?.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold text-[#A5A8B5] uppercase tracking-wider mb-1">
                        Detected Objects
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {vr.detected_objects.map((obj) => (
                          <span
                            key={obj}
                            className="text-[9px] px-2 py-0.5 rounded-full bg-[#171923] border border-[rgba(255,255,255,0.08)] text-[#A5A8B5] font-medium"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {vr.evidence?.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold text-[#A5A8B5] uppercase tracking-wider mb-1">
                        Evidence Found
                      </p>
                      <ul className="space-y-1">
                        {vr.evidence.map((ev) => (
                          <li key={ev} className="flex items-start gap-1.5 text-[10px] text-white">
                            <Check className="w-3 h-3 text-[#22C55E] shrink-0 mt-0.5" />
                            {ev}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {vr.possible_damage?.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold text-[#A5A8B5] uppercase tracking-wider mb-1">
                        Possible Damage Categories
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {vr.possible_damage.map((d) => (
                          <span
                            key={d}
                            className="text-[9px] px-2 py-0.5 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] font-medium"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
