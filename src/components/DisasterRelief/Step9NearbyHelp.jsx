import React, { useState } from "react";
import { MapPin, Phone, Navigation, Heart, ShieldAlert, Zap, Landmark, HeartHandshake } from "lucide-react";
import { motion } from "framer-motion";

const iconMap = {
  "Relief Camp": Landmark,
  "Hospital": Heart,
  "Police Station": ShieldAlert,
  "Food Center": HeartHandshake,
  "Electricity Office": Zap,
};

const services = [
  { id: 1, type: "Relief Camp", name: "Patna Central High School Shelter", distance: "0.8 km", time: "3 min", phone: "+91 612 223412", capacity: "Active · 120 spaces", color: "#F4C95D" },
  { id: 2, type: "Hospital", name: "Patna Medical College & Hospital", distance: "2.4 km", time: "9 min", phone: "+91 612 230084", capacity: "Emergency Open", color: "#EF4444" },
  { id: 3, type: "Food Center", name: "Community Kitchen Ward 12", distance: "1.2 km", time: "5 min", phone: "+91 99345 88210", capacity: "Serving Meals Now", color: "#22C55E" },
  { id: 4, type: "Police Station", name: "Kotwali Police Station Patna", distance: "1.5 km", time: "6 min", phone: "+91 612 222123", capacity: "Helpline Active", color: "#A5A8B5" },
  { id: 5, type: "Electricity Office", name: "BSPDCL Substation Ward 14", distance: "3.1 km", time: "12 min", phone: "+91 612 289000", capacity: "Restoration in Progress", color: "#F59E0B" },
];

// Positions for the mock map pins (percentage values)
const PIN_POSITIONS = [
  { x: "42%", y: "44%" },
  { x: "65%", y: "28%" },
  { x: "26%", y: "60%" },
  { x: "33%", y: "30%" },
  { x: "72%", y: "65%" },
];

export default function Step9NearbyHelp() {
  const [selected, setSelected] = useState(services[0]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-poppins">Nearby Emergency Help</h3>
          <p className="text-xs text-[#A5A8B5] font-inter">Active relief resources, shelters, and emergency contacts within your district</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#22C55E]/20 bg-[#22C55E]/5 text-[#22C55E] text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          Live Data
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Service List (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          {services.map((service) => {
            const Icon = iconMap[service.type] || Landmark;
            const isSelected = selected.id === service.id;

            return (
              <motion.div
                key={service.id}
                onClick={() => setSelected(service)}
                whileHover={{ x: 2 }}
                className={`p-4 rounded-[20px] border cursor-pointer transition-all duration-300 flex items-center gap-4 relative overflow-hidden ${
                  isSelected
                    ? "border-[rgba(244,201,93,0.2)] bg-[#11131A] shadow-[0_0_20px_rgba(244,201,93,0.04)]"
                    : "border-[rgba(255,255,255,0.06)] bg-[#11131A] hover:border-[rgba(255,255,255,0.12)]"
                }`}
              >
                {/* Gold left border accent */}
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-[#F4C95D]" />
                )}

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: `${service.color}12`,
                    borderColor: `${service.color}20`,
                    color: service.color,
                  }}
                >
                  <Icon className="w-5 h-5 stroke-[1.5]" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest font-poppins" style={{ color: service.color }}>
                      {service.type}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate font-inter">{service.name}</h4>
                  <div className="flex items-center gap-3 mt-1.5 text-[9px] text-[#A5A8B5] font-semibold font-space-grotesk">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {service.phone}
                    </span>
                    <span className="text-[#22C55E]">{service.capacity}</span>
                  </div>
                </div>

                {/* Distance + Time */}
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-white font-space-grotesk block">{service.distance}</span>
                  <span className="text-[9px] text-[#A5A8B5] font-medium">{service.time} drive</span>
                  <button className="mt-2 flex items-center gap-1 text-[#F4C95D] text-[9px] font-bold hover:underline ml-auto">
                    <Navigation className="w-2.5 h-2.5" />
                    Route
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right: Interactive Map Placeholder (2 cols) */}
        <div className="lg:col-span-2 bg-[#11131A] border border-[rgba(255,255,255,0.08)] rounded-[20px] overflow-hidden flex flex-col" style={{ minHeight: "380px" }}>
          {/* Map Header */}
          <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between bg-[#0B0B12]/60 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-white font-poppins flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#F4C95D]" />
              Patna Ward 14 · Live GPS
            </span>
            <span className="text-[9px] font-bold text-[#22C55E]">{selected.distance} away</span>
          </div>

          {/* SVG Vector Map */}
          <div className="flex-1 relative overflow-hidden">
            {/* Background grid */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* SVG representing Patna roads + Ganges */}
            <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full">
              {/* Ganges river */}
              <path d="M -20,40 Q 100,80 320,30" fill="none" stroke="#1e40af" strokeWidth="20" opacity="0.15" />
              <path d="M -20,40 Q 100,80 320,30" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="6 4" opacity="0.3" />

              {/* Roads */}
              <line x1="0" y1="120" x2="300" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <line x1="0" y1="120" x2="300" y2="120" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1="90" y1="0" x2="90" y2="300" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <line x1="90" y1="0" x2="90" y2="300" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1="200" y1="0" x2="200" y2="300" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <line x1="200" y1="0" x2="200" y2="300" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <line x1="0" y1="190" x2="300" y2="190" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
            </svg>

            {/* You are here indicator */}
            <div className="absolute" style={{ left: "50%", top: "52%", transform: "translate(-50%,-50%)" }}>
              <div className="w-10 h-10 rounded-full bg-[#2563eb]/15 animate-ping absolute inset-0" />
              <div className="w-4 h-4 rounded-full bg-[#3b82f6] border-2 border-white shadow-lg relative z-10 m-3" />
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#A5A8B5] whitespace-nowrap">YOU</span>
            </div>

            {/* Service Pins */}
            {services.map((service, idx) => {
              const pos = PIN_POSITIONS[idx];
              const isActive = selected.id === service.id;
              const Icon = iconMap[service.type] || MapPin;

              return (
                <motion.div
                  key={service.id}
                  style={{ left: pos.x, top: pos.y, position: "absolute", transform: "translate(-50%,-50%)" }}
                  animate={{ scale: isActive ? 1.3 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onClick={() => setSelected(service)}
                  className="cursor-pointer z-20"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-lg transition-all ${
                      isActive ? "border-[#F4C95D]" : "border-[rgba(255,255,255,0.15)]"
                    }`}
                    style={{
                      backgroundColor: isActive ? service.color : "#11131A",
                      color: isActive ? "#0B0B12" : service.color,
                    }}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  {isActive && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#0B0B12] border border-[rgba(255,255,255,0.1)] text-white text-[8px] font-bold px-2 py-1 rounded-[8px] whitespace-nowrap shadow-xl z-30">
                      {service.name.split(" ").slice(0, 3).join(" ")}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Map Footer */}
          <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)] bg-[#0B0B12]/40 flex items-center justify-between">
            <span className="text-[10px] text-white font-bold truncate max-w-[160px] font-inter">
              {selected.name}
            </span>
            <button className="flex items-center gap-1 text-[#F4C95D] text-[9px] font-bold hover:underline shrink-0">
              <Navigation className="w-3 h-3" />
              Get Directions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
