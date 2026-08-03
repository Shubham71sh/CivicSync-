import React, { useState, useRef } from "react";
import { uploadImages } from "../../Services/api";
import { Upload, X, FileText, Image as ImageIcon, Video, Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const UPLOAD_CATEGORIES = [
  "House Photos",
  "Crop Photos",
  "Vehicle Photos",
  "Shop Photos",
  "Videos",
  "Documents"
];

export default function Step2UploadCenter({
  reportId,
  onNext,
  onFilesChange
}) {
  const [activeCategory, setActiveCategory] = useState("House Photos");
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      addFiles(e.target.files);
    }
  };

  const addFiles = (fileList) => {
    const list = Array.from(fileList).map((file) => {
      const isImg = file.type.startsWith("image/");
      const isVid = file.type.startsWith("video/");
      
      const fileId = Math.random().toString(36).substring(2, 9);
      const newFile = {
        id: fileId,
        name: file.name,
        originalFile: file,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        type: file.type,
        category: activeCategory,
        progress: 0,
        status: "uploading",
        preview: isImg ? URL.createObjectURL(file) : null,
        isImg,
        isVid
      };

      // Simulate loading progress
      const interval = setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((f) => {
            if (f.id === fileId) {
              const nextVal = f.progress + Math.floor(Math.random() * 25) + 15;
              if (nextVal >= 100) {
                clearInterval(interval);
                return { ...f, progress: 100, status: "completed" };
              }
              return { ...f, progress: nextVal };
            }
            return f;
          })
        );
      }, 250);

      return newFile;
    });

    const newFiles = [...uploadedFiles, ...list];
    setUploadedFiles(newFiles);
    if (onFilesChange) onFilesChange(newFiles);
  };
const handleUploadToBackend = async () => {
  console.log("Report ID received:", reportId);
  try {

   const formData = new FormData();

uploadedFiles.forEach((file) => {
  formData.append("files", file.originalFile);
});

await uploadImages(reportId, formData);

    alert("Images uploaded successfully!");

    onNext();

  } catch (error) {

    console.error(error);

    alert("Upload failed");

  }
};
  const removeFile = (id) => {
    setUploadedFiles((prev) => {
      const target = prev.find(f => f.id === id);
      if (target && target.preview) URL.revokeObjectURL(target.preview);
      const filtered = prev.filter(f => f.id !== id);
      if (onFilesChange) onFilesChange(filtered);
      return filtered;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-poppins">Upload Evidence</h3>
          <p className="text-xs text-[#A5A8B5] font-inter">Provide structural damage or asset photos to verify your claim</p>
        </div>
        <span className="text-[10px] text-[#F4C95D] bg-[#F4C95D]/10 border border-[#F4C95D]/20 px-2 py-0.5 rounded-full font-bold">
          Step 2 of 9
        </span>
      </div>

      {/* Category Selection Tab Pills */}
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

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-[20px] p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
          isDragActive
            ? "border-[#F4C95D] bg-[#F4C95D]/5 scale-[0.99] shadow-[0_0_20px_rgba(244,201,93,0.05)]"
            : "border-[rgba(255,255,255,0.08)] bg-[#11131A] hover:bg-[#171923] hover:border-[rgba(255,255,255,0.2)]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
          accept="image/*,video/*,application/pdf"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-[16px] bg-[#171923] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#F4C95D]">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white font-inter">
              Drag & drop photos or <span className="text-[#F4C95D] underline">browse files</span>
            </p>
            <p className="text-[10px] text-[#A5A8B5] mt-1 font-inter">
              Supports JPEG, PNG, MP4, and PDF for <span className="font-semibold text-white">{activeCategory}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Previews / Selected Files list */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-3"
          >
            <h4 className="text-[10px] font-bold text-[#A5A8B5] uppercase tracking-widest font-poppins">Uploaded Evidence</h4>
            <div className="grid gap-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-[#11131A] border border-[rgba(255,255,255,0.08)] rounded-[20px] transition-all duration-300"
                >
                  {/* Icon or Thumbnail */}
                  <div className="w-10 h-10 rounded-[12px] bg-[#171923] border border-[rgba(255,255,255,0.05)] overflow-hidden flex items-center justify-center shrink-0">
                    {file.isImg && file.preview ? (
                      <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
                    ) : file.isVid ? (
                      <Video className="w-5 h-5 text-[#EF4444]" />
                    ) : (
                      <FileText className="w-5 h-5 text-[#F4C95D]" />
                    )}
                  </div>

                  {/* Name and Progress bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate block font-inter">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-[#A5A8B5] shrink-0 font-medium">
                        {file.size}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-[#171923] border border-[rgba(255,255,255,0.05)] font-semibold text-[#A5A8B5]">
                        {file.category}
                      </span>
                      
                      {file.status === "uploading" ? (
                        <div className="flex-1 flex items-center gap-2">
                          <div className="h-1.5 bg-[#171923] rounded-full flex-1 overflow-hidden">
                            <motion.div
                              className="h-full bg-[#F4C95D]"
                              initial={{ width: 0 }}
                              animate={{ width: `${file.progress}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-[#A5A8B5] font-bold shrink-0 font-space-grotesk">
                            {file.progress}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-[#22C55E] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>AI Scanned Successfully</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 rounded-[8px] hover:bg-[#171923] text-[#A5A8B5] hover:text-white transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Navigation */}
      <div className="flex justify-end pt-4 border-t border-[rgba(255,255,255,0.05)]">
        <button
          onClick={handleUploadToBackend}
          disabled={uploadedFiles.length === 0}
          className="px-6 py-2.5 bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] font-bold text-xs rounded-[16px] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
        >
          <span>Run AI Damage Analysis</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
