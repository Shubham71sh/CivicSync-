import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Image as ImageIcon, Video, X, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  { label: "House Photos", color: "bg-blue-50 text-blue-700 border-blue-100" },
  { label: "Crop Photos", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { label: "Vehicle Photos", color: "bg-amber-50 text-amber-700 border-amber-100" },
  { label: "Shop Photos", color: "bg-purple-50 text-purple-700 border-purple-100" },
  { label: "Documents", color: "bg-slate-50 text-slate-700 border-slate-100" },
  { label: "Videos", color: "bg-red-50 text-red-700 border-red-100" }
];

export default function UploadZone({ onFilesUploaded }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("House Photos");
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

  const processFiles = (newFileList) => {
    const uploadedList = Array.from(newFileList).map((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      
      const newFileObj = {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        type: file.type,
        category: selectedCategory,
        progress: 0,
        status: "uploading",
        preview: isImage ? URL.createObjectURL(file) : null,
        isImage,
        isVideo
      };

      // Simulate upload progress
      const interval = setInterval(() => {
        setFiles((currentFiles) =>
          currentFiles.map((f) => {
            if (f.id === newFileObj.id) {
              const nextProgress = f.progress + Math.floor(Math.random() * 30) + 10;
              if (nextProgress >= 100) {
                clearInterval(interval);
                return { ...f, progress: 100, status: "completed" };
              }
              return { ...f, progress: nextProgress };
            }
            return f;
          })
        );
      }, 300);

      return newFileObj;
    });

    const updatedFiles = [...files, ...uploadedList];
    setFiles(updatedFiles);
    
    if (onFilesUploaded) {
      onFilesUploaded(updatedFiles);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id) => {
    setFiles((currentFiles) => {
      const target = currentFiles.find(f => f.id === id);
      if (target && target.preview) {
        URL.revokeObjectURL(target.preview);
      }
      const updated = currentFiles.filter((f) => f.id !== id);
      if (onFilesUploaded) {
        onFilesUploaded(updated);
      }
      return updated;
    });
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
      <div>
        <h3 className="text-sm font-bold text-slate-800">Upload Disaster Evidence</h3>
        <p className="text-[11px] text-slate-400">Select evidence type, then drag and drop files below for AI inspection</p>
      </div>

      {/* Evidence Categories Selector */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setSelectedCategory(cat.label)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
              selectedCategory === cat.label
                ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                : "border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 relative ${
          isDragActive
            ? "border-blue-600 bg-blue-50/30 scale-[0.99]"
            : "border-slate-200 bg-slate-50 hover:bg-slate-50/50 hover:border-slate-300"
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

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <UploadCloud className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">
              Drag & drop files here or <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Supports JPEG, PNG, MP4, and PDF (Max 25MB) for <span className="font-semibold">{selectedCategory}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Uploading & Completed File Previews */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-2 pt-2 border-t border-slate-50"
          >
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Uploaded Items</h4>
            <div className="grid gap-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all duration-200"
                >
                  {/* Thumbnail / Icon */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                    {file.isImage && file.preview ? (
                      <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
                    ) : file.isVideo ? (
                      <Video className="w-5 h-5 text-red-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-500" />
                    )}
                  </div>

                  {/* Info & Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 truncate block">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium ml-2">
                        {file.size}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-500">
                        {file.category}
                      </span>
                      
                      {file.status === "uploading" ? (
                        <div className="flex-1 flex items-center gap-2">
                          <div className="h-1.5 bg-slate-100 rounded-full flex-1 overflow-hidden">
                            <motion.div
                              className="h-full bg-blue-600"
                              initial={{ width: 0 }}
                              animate={{ width: `${file.progress}%` }}
                              transition={{ duration: 0.1 }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold shrink-0">
                            {file.progress}%
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600 text-[9px] font-bold">
                          <Check className="w-3 h-3" />
                          <span>AI Analysis Ready</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
