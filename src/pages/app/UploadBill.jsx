import { motion, AnimatePresence } from "framer-motion";
import { Upload as UploadIcon, FileText, CheckCircle2, Loader2, ArrowRight, X } from "lucide-react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { uploadBill } from "../../services/billService";

export default function UploadBill() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadState, setUploadState] = useState("idle"); // idle, uploading, done, error
  const [error, setError] = useState("");
  const [uploadResult, setUploadResult] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file || uploadState !== "idle") return;
    setError("");
    setUploadState("uploading");

    try {
      // Build FormData — backend expects: POST /api/bills/upload (multipart)
      const formData = new FormData();
      formData.append("file", file);

      // Calls billService.uploadBill → POST /api/bills/upload
      const result = await uploadBill(formData);
      setUploadResult(result);
      setUploadState("done");
      
      // Redirect to bill history after short delay
      setTimeout(() => navigate("/dashboard/bills"), 2000);
    } catch (err) {
      console.error("[UploadBill] Upload failed:", err);
      setError(err.message || "Upload failed. Please try again.");
      setUploadState("error");
    }
  };

  const resetFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setUploadState("idle");
    setError("");
    setUploadResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Page Header */}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6 shadow-glow">
          <UploadIcon className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-3xl font-bold mb-3 tracking-tight">Upload Bill for Analysis</h1>
        <p className="text-textSecondary">Upload any legislative document (PDF, DOCX) and CivicSync AI will summarize its impact in seconds.</p>
      </div>

      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx(
          "p-10 rounded-3xl border-2 border-dashed transition-all duration-300 text-center relative",
          isDragging ? "border-accent bg-accent/5 scale-105" : "border-border bg-[#12141d] hover:border-textSecondary",
          file && uploadState === "idle" && "border-success/50 bg-[#171a21]",
          uploadState === "error" && "border-danger/50 bg-danger/5"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt"
          disabled={uploadState !== "idle"}
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FileText className="w-12 h-12 text-textMuted mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-1">Drag & drop your file here</h3>
              <p className="text-sm text-textSecondary mb-6">Supported formats: PDF, DOCX, TXT up to 50MB</p>
              <button className="px-6 py-2.5 rounded-lg bg-[#2a2e3d] text-white text-sm font-semibold hover:bg-[#323749] transition-colors pointer-events-none">
                Browse Files
              </button>
            </motion.div>
          ) : (
            <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
              <div className={clsx(
                "w-16 h-16 rounded-xl flex items-center justify-center mb-4",
                uploadState === "done" ? "bg-success/20" : uploadState === "error" ? "bg-danger/20" : "bg-success/20"
              )}>
                <FileText className={clsx(
                  "w-8 h-8",
                  uploadState === "done" ? "text-success" : uploadState === "error" ? "text-danger" : "text-success"
                )} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1 truncate max-w-[250px]">{file.name}</h3>
              <p className="text-sm text-textSecondary mb-6">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI</p>
              
              {uploadState === "idle" && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAnalyze}
                    className="relative z-20 px-8 py-3 rounded-xl bg-accent text-[#0a0a0f] font-bold shadow-glow-accent hover:bg-accentHover transition-all flex items-center gap-2"
                  >
                    Start AI Analysis <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={resetFile}
                    className="relative z-20 w-10 h-10 rounded-xl bg-[#2a2e3d] text-textSecondary hover:text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {uploadState === "uploading" && (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <span className="text-sm font-bold text-textSecondary uppercase tracking-widest">Scanning Document...</span>
                </div>
              )}
              {uploadState === "done" && (
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                  <div className="text-center">
                    <span className="text-sm font-bold text-success uppercase tracking-widest block">Analysis Complete</span>
                    {uploadResult?.bill?.title && (
                      <p className="text-xs text-textSecondary mt-1">✓ {uploadResult.bill.title}</p>
                    )}
                    {uploadResult?.bill?.impactScore && (
                      <p className="text-xs text-accent mt-1">Impact Score: {uploadResult.bill.impactScore}%</p>
                    )}
                  </div>
                </div>
              )}
              {uploadState === "error" && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-danger">{error}</p>
                  <button onClick={resetFile} className="px-6 py-2.5 rounded-lg bg-[#2a2e3d] text-white text-sm font-semibold hover:bg-[#323749] transition-colors">
                    Try Again
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tips */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 grid grid-cols-3 gap-4">
        {[
          { label: "Max File Size", value: "50 MB" },
          { label: "Formats", value: "PDF, DOCX, TXT" },
          { label: "Analysis Time", value: "~5 seconds" },
        ].map((tip, i) => (
          <div key={i} className="p-4 rounded-xl bg-[#12141d] border border-border text-center">
            <p className="text-xs text-textSecondary uppercase tracking-widest mb-1">{tip.label}</p>
            <p className="font-semibold text-white text-sm">{tip.value}</p>
          </div>
        ))}
      </motion.div>

      <div className="mt-8 text-center">
        <button onClick={() => navigate("/dashboard")} className="text-sm font-semibold text-textSecondary hover:text-white transition-colors">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
