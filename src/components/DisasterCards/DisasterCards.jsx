import React from "react";
import { Waves, Flame, Activity, Wind, Mountain, CloudRain } from "lucide-react";
import { motion } from "framer-motion";

const iconMap = {
  Waves: Waves,
  Flame: Flame,
  Activity: Activity,
  Wind: Wind,
  Mountain: Mountain,
  CloudRain: CloudRain
};

export default function DisasterCards({ items, selectedType, onSelect }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Select Disaster Type</h3>
          <p className="text-[11px] text-slate-400">Choose a category to refine AI detection models</p>
        </div>
        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-semibold text-slate-500">
          6 Available Models
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((item) => {
          const Icon = iconMap[item.icon] || Waves;
          const isSelected = selectedType.toLowerCase() === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onSelect(item.id)}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 relative overflow-hidden transition-all duration-200 ${
                isSelected
                  ? "border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/10"
                  : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              {/* Icon Container */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                isSelected 
                  ? "bg-blue-600 text-white border-transparent"
                  : "bg-slate-50 text-slate-500 border-slate-100"
              }`}>
                <Icon className="w-4.5 h-4.5" />
              </div>

              {/* Label */}
              <div>
                <span className={`text-xs font-bold block ${isSelected ? "text-blue-700" : "text-slate-800"}`}>
                  {item.name}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  {isSelected ? "Model Active" : "Click to load"}
                </span>
              </div>

              {/* Selected indicator corner */}
              {isSelected && (
                <div className="absolute top-0 right-0 w-8 h-8 bg-blue-600 rounded-bl-3xl flex items-center justify-center pl-2 pb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
