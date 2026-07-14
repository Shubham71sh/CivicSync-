import React from "react";
import { Waves, Flame, Activity, Wind, Mountain, CloudRain, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const disasterTypes = [
  { id: "flood", name: "Flood", icon: Waves },
  { id: "fire", name: "Fire", icon: Flame },
  { id: "earthquake", name: "Earthquake", icon: Activity },
  { id: "cyclone", name: "Cyclone", icon: Wind },
  { id: "landslide", name: "Landslide", icon: Mountain },
  { id: "rain", name: "Heavy Rain", icon: CloudRain }
];

export default function Step1DisasterSelect({ selectedType, onSelect, onNext }) {
  return (
    <div className="space-y-8">
      {/* Premium Dark Hero */}
      <div className="relative overflow-hidden bg-[#11131A] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-8">
        {/* Glow effect */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#F4C95D]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#F4C95D]/20 bg-[#F4C95D]/5 text-[#F4C95D] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="tracking-widest uppercase text-[10px]">AI Relief Engine v3.0</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white tracking-tight font-poppins">
            AI Disaster Relief Assistant
          </h1>

          <p className="text-[#A5A8B5] text-sm leading-relaxed max-w-2xl font-inter">
            Upload disaster evidence and let AI analyze the damage to recommend government relief schemes and guide you through the recovery process.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <button
              onClick={() => {
                if (selectedType) {
                  onNext();
                } else {
                  alert("Please select a disaster type.");
                }
              }}
              className="px-6 py-3 bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] font-bold text-xs rounded-[16px] transition-all duration-300 flex items-center gap-2 shadow-[0_4px_20px_rgba(244,201,93,0.15)] active:scale-95"
            >
              <span>Start Assessment</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => alert("CivicSync AI Disaster Assistant matches deep damage metrics against regional schemes automatically.")}
              className="px-6 py-3 bg-[#171923] hover:bg-[#202330] text-white font-semibold text-xs border border-[rgba(255,255,255,0.08)] rounded-[16px] transition-all duration-300"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Disaster Cards */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-poppins">Select Crisis Event Type</h3>
          <p className="text-xs text-[#A5A8B5] font-inter">Choose the primary disaster category to customize AI vision segmentation models</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {disasterTypes.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedType === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => onSelect(item.id)}
                whileHover={{ y: -4 }}
                className={`p-5 rounded-[20px] border text-left flex flex-col justify-between h-32 relative overflow-hidden transition-all duration-300 ${
                  isSelected
                    ? "border-[#F4C95D] bg-[#11131A] shadow-[0_0_20px_rgba(244,201,93,0.12)]"
                    : "border-[rgba(255,255,255,0.08)] bg-[#11131A] hover:border-[rgba(255,255,255,0.2)]"
                }`}
              >
                {/* Outline Icon */}
                <div className={`w-9 h-9 rounded-[14px] flex items-center justify-center border transition-all ${
                  isSelected
                    ? "bg-[#F4C95D]/10 text-[#F4C95D] border-[#F4C95D]/30"
                    : "bg-[#171923] text-[#A5A8B5] border-[rgba(255,255,255,0.05)]"
                }`}>
                  <Icon className="w-5 h-5 stroke-[1.5]" />
                </div>

                {/* Name */}
                <div className="space-y-0.5">
                  <span className={`text-xs font-bold block ${isSelected ? "text-[#F4C95D]" : "text-white"}`}>
                    {item.name}
                  </span>
                  <span className="text-[9px] text-[#A5A8B5] block uppercase tracking-wider">
                    {isSelected ? "Model Selected" : "Load Model"}
                  </span>
                </div>

                {/* Active Indicator Corner */}
                {isSelected && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-[#F4C95D] rounded-bl-[20px] flex items-center justify-center pl-2.5 pb-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0B0B12]" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
