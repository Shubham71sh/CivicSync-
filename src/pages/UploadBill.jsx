import { motion, AnimatePresence } from "framer-motion";
import { Upload as UploadIcon, FileText, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

export default function UploadBill() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadState, setUploadState] = useState("idle"); // idle, uploading, done

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (!file || uploadState !== "idle") return;
    setUploadState("uploading");
    
    // Simulate processing
    setTimeout(() => {
      setUploadState("done");
      // Redirect to bills dashboard after a short delay
      setTimeout(() => navigate("/dashboard"), 1500);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6 shadow-glow">
            <UploadIcon className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight">Upload Bill for Analysis</h1>
          <p className="text-textSecondary">Upload any legislative document (PDF, DOCX) and CivicSync AI will summarize its impact in seconds.</p>
        </div>

        <div 
          className={clsx(
            "p-10 rounded-3xl border-2 border-dashed transition-all duration-300 text-center relative",
            isDragging ? "border-accent bg-accent/5 scale-105" : "border-border bg-[#12141d] hover:border-textSecondary",
            file && "border-success/50 bg-[#171a21]"
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
                <div className="w-16 h-16 rounded-xl bg-success/20 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1 truncate max-w-[250px]">{file.name}</h3>
                <p className="text-sm text-textSecondary mb-6">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI</p>
                
                {uploadState === "idle" && (
                  <button onClick={handleAnalyze} className="relative z-20 px-8 py-3 rounded-xl bg-accent text-[#0a0a0f] font-bold shadow-glow-accent hover:bg-accentHover transition-all flex items-center gap-2">
                    Start AI Analysis <ArrowRight className="w-5 h-5" />
                  </button>
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
                    <span className="text-sm font-bold text-success uppercase tracking-widest">Analysis Complete</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => navigate("/")} className="text-sm font-semibold text-textSecondary hover:text-white transition-colors">
            Cancel & Return Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
