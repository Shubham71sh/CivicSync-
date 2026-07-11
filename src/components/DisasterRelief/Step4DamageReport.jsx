import React, { useState } from "react";
import { Sparkles, Eye, X, Landmark, CloudRain, Zap, DollarSign, Cpu, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const iconMap = {
  House: Landmark,
  Roof: Landmark,
  Wall: Landmark,
  Water: CloudRain,
  Electricity: Zap,
  Loss: DollarSign,
  Confidence: Cpu
};

export default function Step4DamageReport({
  data = {},
  images = [],
  onNext,
}) {
  const [activeImage, setActiveImage] = useState(null);
  const metrics = [
  {
    name: "House Damage",
    value: `${data.house_damage ?? 0}%`,
    status: data.house_damage >= 70 ? "Severe" : "Normal",
  },
  {
    name: "Crop Damage",
    value: `${data.crop_damage ?? 0}%`,
    status: data.crop_damage >= 70 ? "Severe" : "Normal",
  },
  {
    name: "Vehicle Damage",
    value: `${data.vehicle_damage ?? 0}%`,
    status: data.vehicle_damage >= 70 ? "Severe" : "Normal",
  },
  {
    name: "Severity",
    value: data.severity,
    status: data.severity,
  },
];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-poppins">AI Damage Assessment Report</h3>
          <p className="text-xs text-[#A5A8B5] font-inter">Verified metrics inferred from geographic logs, depth layers, and image feeds</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#F4C95D]/20 bg-[#F4C95D]/5 text-[#F4C95D] text-xs font-semibold">
          <Cpu className="w-3.5 h-3.5" />
          <span className="font-space-grotesk">{data.ai_confidence ?? 0}% Model Confidence</span>
        </div>
      </div>

      {/* Grid of Premium Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((item, idx) => {

          let Icon = Landmark;
          if (item.name.includes("Water")) Icon = CloudRain;
          else if (item.name.includes("Electricity")) Icon = Zap;
          else if (item.name.includes("Roof")) Icon = Landmark;
          
          return (
            <div
              key={idx}
              className="p-5 rounded-[20px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] flex flex-col justify-between hover:border-[rgba(255,255,255,0.15)] transition-all duration-300 min-h-[110px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins">
                  {item.name}
                </span>
                <Icon className="w-3.5 h-3.5 text-[#F4C95D]" />
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-xl font-bold text-white font-space-grotesk">
                  {item.value}
                </span>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-poppins ${
                  item.status === 'Severe' || item.status === 'Danger'
                    ? "bg-[#EF4444]/10 text-[#EF4444]" 
                    : item.status === 'Warning' || item.status === 'Critical'
                    ? "bg-[#F59E0B]/10 text-[#F59E0B]"
                    : "bg-[#22C55E]/10 text-[#22C55E]"
                }`}>
                  {item.status}
                </span>
              </div>
            </div>
          );
        })}

        {/* Financial Loss Card */}
        <div className="p-5 rounded-[20px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] flex flex-col justify-between hover:border-[rgba(255,255,255,0.15)] transition-all duration-300 min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins">
              Estimated Loss
            </span>
            <DollarSign className="w-3.5 h-3.5 text-[#F4C95D]" />
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold text-[#F4C95D] font-space-grotesk">
            ₹{(data.estimated_loss ?? 0).toLocaleString("en-IN")}
            </span>
            <span className="text-[8px] text-[#A5A8B5] block mt-1 uppercase tracking-wider">
              Asset Value Checked
            </span>
          </div>
        </div>

        {/* Overall Damage Card */}
        <div className="p-5 rounded-[20px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] flex flex-col justify-between hover:border-[rgba(255,255,255,0.15)] transition-all duration-300 min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins">
              Overall Severity
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#F4C95D]" />
          </div>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-xl font-bold text-white font-space-grotesk">
              {data.damage_percent ?? 0}%
            </span>
            <span className="text-[8px] text-[#EF4444] font-bold bg-[#EF4444]/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-poppins">
              Severe
            </span>
          </div>
        </div>
      </div>

      {/* Image Gallery Grid */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-[#A5A8B5] uppercase tracking-wider font-poppins">
          Vision Model Detections
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {(images || []).map((img) => (
            <div
              key={img.id}
              onClick={() => setActiveImage(img)}
              className="aspect-video bg-[#11131A] rounded-[20px] overflow-hidden border border-[rgba(255,255,255,0.08)] relative cursor-pointer group hover:border-[#F4C95D]/50 transition-all duration-300"
            >
              <img src={img.url} alt={img.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-[#0B0B12]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <span className="absolute bottom-2 left-2 bg-[#11131A]/85 backdrop-blur-sm border border-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded-[8px] text-[8px] font-bold text-white">
                {(img.detections || []).length} AI markers
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Image Overlay Modal */}
      <AnimatePresence>
        {activeImage && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveImage(null)}
              className="absolute inset-0 bg-[#0B0B12]/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-[#11131A] border border-[rgba(255,255,255,0.08)] rounded-[20px] max-w-3xl w-full overflow-hidden shadow-2xl z-10"
            >
              <div className="relative aspect-video w-full">
                <img src={activeImage.url} alt={activeImage.label} className="w-full h-full object-cover" />
                
                {/* Bounding box overlays */}
                {(activeImage?.detections || []).map((det) => {
                  const isHigh = det.severity === "Severe" || det.severity === "High";
                  return (
                    <div
                      key={det.id}
                      style={{
                        position: "absolute",
                        left: det.x,
                        top: det.y,
                        width: det.w,
                        height: det.h
                      }}
                      className={`border-2 rounded-[8px] ${
                        isHigh ? "border-[#EF4444] bg-[#EF4444]/10" : "border-[#F59E0B] bg-[#F59E0B]/10"
                      }`}
                    >
                      <span className={`absolute -top-6 left-0 px-2 py-0.5 rounded-[6px] text-[8px] font-bold text-white uppercase tracking-wider ${
                        isHigh ? "bg-[#EF4444]" : "bg-[#F59E0B]"
                      }`}>
                        {det.label} ({det.confidence}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Description & Footer */}
              <div className="p-4 flex items-center justify-between border-t border-[rgba(255,255,255,0.08)]">
                <div>
                  <h4 className="text-xs font-bold text-white font-poppins">{activeImage.label}</h4>
                  <p className="text-[10px] text-[#A5A8B5] font-inter mt-1">Geotag verification: Bihar Area Municipality Zone 14</p>
                </div>
                <button
                  onClick={() => setActiveImage(null)}
                  className="px-3.5 py-1.5 bg-[#171923] hover:bg-[#202330] border border-[rgba(255,255,255,0.08)] rounded-[12px] text-xs font-bold text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Step Navigation */}
      <div className="flex justify-end pt-4 border-t border-[rgba(255,255,255,0.05)]">
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] font-bold text-xs rounded-[16px] transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-[0_4px_20px_rgba(244,201,93,0.15)]"
        >
          <span>Match Government Schemes</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
