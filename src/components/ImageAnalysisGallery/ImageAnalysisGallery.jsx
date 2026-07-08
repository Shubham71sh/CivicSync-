import React, { useState } from "react";
import { Sparkles, Eye, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function ImageAnalysisGallery({ images }) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">AI Computer Vision Analysis</h3>
          <p className="text-[11px] text-slate-400">Deep-learning segmentation bounding boxes overlaid on disaster evidence</p>
        </div>
        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-blue-100">
          <Sparkles className="w-3 h-3 text-blue-600" />
          <span>Vision Models Loaded</span>
        </div>
      </div>

      {/* Main Focus Image with Bounding Boxes */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center group shadow-inner">
        <img
          src={selectedImage.url}
          alt={selectedImage.label}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
        />

        {/* Bounding Boxes Overlays */}
        {selectedImage.detections.map((det) => {
          const isHighSeverity = det.severity === "Severe" || det.severity === "High";
          return (
            <div
              key={det.id}
              style={{
                position: "absolute",
                left: det.x,
                top: det.y,
                width: det.w,
                height: det.h,
              }}
              className={`border-2 rounded-lg transition-all duration-300 ${
                isHighSeverity 
                  ? "border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20" 
                  : "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20"
              }`}
            >
              {/* Confidence Label */}
              <span className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-extrabold text-white shadow-sm flex items-center gap-1 ${
                isHighSeverity ? "bg-red-500" : "bg-amber-500"
              }`}>
                {det.label} ({det.confidence}%)
              </span>
            </div>
          );
        })}

        {/* Caption bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/60 backdrop-blur-md px-4 py-3 flex items-center justify-between text-white">
          <p className="text-xs font-semibold">{selectedImage.label}</p>
          <div className="flex gap-2">
            {selectedImage.detections.map((det) => (
              <span key={det.id} className="text-[9px] bg-white/20 px-2 py-0.5 rounded font-medium">
                {det.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Grid selector thumbnails */}
      <div className="grid grid-cols-3 gap-3">
        {images.map((img) => {
          const isSelected = selectedImage.id === img.id;
          return (
            <button
              key={img.id}
              onClick={() => setSelectedImage(img)}
              className={`aspect-video rounded-xl overflow-hidden border-2 relative transition-all duration-200 ${
                isSelected 
                  ? "border-blue-600 ring-2 ring-blue-500/10" 
                  : "border-slate-100 hover:border-slate-300"
              }`}
            >
              <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
              
              {/* Thumbnail Hover Icon */}
              {!isSelected && (
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white filter drop-shadow-sm" />
                </div>
              )}
              
              {/* Detections Counter Badge */}
              <span className="absolute bottom-1 right-1 bg-slate-900/80 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">
                {img.detections.length} defects
              </span>
            </button>
          );
        })}
      </div>
      
      <div className="flex items-start gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-50 text-[11px] text-blue-700">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold">AI Note:</span> Bounding boxes are generated in real-time. Confidences exceed 80% which qualifies for accelerated policy processing rules.
        </div>
      </div>
    </div>
  );
}
