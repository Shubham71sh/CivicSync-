import React, { useState } from "react";
import { Phone, Navigation, Landmark, HeartHandshake, ShieldAlert, Zap, Heart, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const typeIconMap = {
  "Relief Camp": Landmark,
  "Hospital": Heart,
  "Food Center": HeartHandshake,
  "Police": ShieldAlert,
  "Electricity Office": Zap,
  "Government Help Center": Landmark
};

export default function NearbyServices({ services }) {
  const [selectedService, setSelectedService] = useState(services[0]);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-800">Nearby Relief & Emergency Services</h3>
        <p className="text-[11px] text-slate-400">Locate resources, active shelters, medical facilities, and contact helplines</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side: Services List (3 cols on large screens) */}
        <div className="lg:col-span-3 space-y-3 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
          {services.map((service) => {
            const Icon = typeIconMap[service.type] || Landmark;
            const isSelected = selectedService.id === service.id;

            return (
              <div
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 flex items-start gap-3.5 relative overflow-hidden ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 shadow-sm"
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                {/* Icon Indicator */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                  isSelected 
                    ? "bg-blue-600 text-white border-transparent"
                    : "bg-slate-50 text-slate-500 border-slate-100"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">
                      {service.type}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold shrink-0">
                      {service.distance}
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                    {service.name}
                  </h4>
                  
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2 text-[10px]">
                    <span className="font-semibold text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {service.phone}
                    </span>
                    <span className={`font-semibold ${
                      service.capacity.includes('Critical') || service.capacity.includes('Queue: Short')
                        ? "text-red-500" 
                        : "text-emerald-600"
                    }`}>
                      {service.capacity}
                    </span>
                  </div>
                </div>

                {/* Selection border highlight */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                )}
              </div>
            );
          })}
        </div>

        {/* Right Side: Interactive Map Placeholder (2 cols) */}
        <div className="lg:col-span-2 flex flex-col h-[420px] bg-slate-50 border border-slate-200/60 rounded-2xl overflow-hidden relative shadow-inner">
          {/* Map Header */}
          <div className="p-3 bg-white/80 backdrop-blur-sm border-b border-slate-100 absolute top-0 left-0 right-0 z-10 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Patna Live GPS Map</span>
            </span>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
              {selectedService.distance} away
            </span>
          </div>

          {/* Map Body (Vector SVG Mockup representing Patna coordinates layout) */}
          <div className="flex-1 w-full h-full relative p-4 flex items-center justify-center">
            {/* Grid background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 bg-slate-400" />

            {/* Custom SVG Route Lines & Local Map representation */}
            <svg viewBox="0 0 200 200" className="w-full h-full text-slate-200">
              {/* Mock river (Ganges Patna) */}
              <path
                d="M -10,30 Q 80,60 210,20"
                fill="none"
                stroke="#dbeafe"
                strokeWidth="18"
                className="opacity-75"
              />
              <path
                d="M -10,30 Q 80,60 210,20"
                fill="none"
                stroke="#bfdbfe"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Roads grid */}
              <line x1="0" y1="90" x2="200" y2="90" stroke="white" strokeWidth="6" />
              <line x1="0" y1="90" x2="200" y2="90" stroke="#e2e8f0" strokeWidth="1" />
              
              <line x1="70" y1="0" x2="70" y2="200" stroke="white" strokeWidth="6" />
              <line x1="70" y1="0" x2="70" y2="200" stroke="#e2e8f0" strokeWidth="1" />

              <line x1="140" y1="0" x2="140" y2="200" stroke="white" strokeWidth="6" />
              <line x1="140" y1="0" x2="140" y2="200" stroke="#e2e8f0" strokeWidth="1" />

              {/* Citizen Current location marker */}
              <circle cx="95" cy="115" r="16" fill="rgba(37,99,235,0.15)" className="animate-ping" />
              <circle cx="95" cy="115" r="6" fill="#2563eb" stroke="white" strokeWidth="2" />
              <text x="95" y="105" textAnchor="middle" className="text-[6px] font-black fill-blue-700 bg-white">
                YOU
              </text>
            </svg>

            {/* Render Pins dynamically on top of the mockup grid coordinates */}
            {services.map((service, idx) => {
              // Custom map placement based on index
              const coordinatesOffset = [
                { x: "40%", y: "45%" }, // Service 1
                { x: "65%", y: "30%" }, // PMCH
                { x: "25%", y: "60%" }, // Food center
                { x: "32%", y: "28%" }, // Police
                { x: "75%", y: "70%" }, // Elec
                { x: "48%", y: "52%" }, // Help center
              ];

              const coord = coordinatesOffset[idx] || { x: "50%", y: "50%" };
              const isSelected = selectedService.id === service.id;

              return (
                <motion.div
                  key={service.id}
                  style={{ left: coord.x, top: coord.y }}
                  animate={{ scale: isSelected ? 1.25 : 1 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
                  onClick={() => setSelectedService(service)}
                >
                  <div className={`p-1.5 rounded-full border shadow-md flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white border-transparent scale-110 z-30"
                      : "bg-white text-slate-600 border-slate-200 hover:scale-105"
                  }`}>
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  
                  {/* Tooltip on active */}
                  {isSelected && (
                    <div className="absolute bottom-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-40">
                      {service.name}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Map Footer Info */}
          <div className="p-3 bg-white border-t border-slate-100 z-10 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="truncate font-semibold text-slate-800">
              Active: {selectedService.name}
            </span>
            <button className="flex items-center gap-1 font-bold text-blue-600 shrink-0 hover:underline">
              <Navigation className="w-3 h-3" />
              <span>Route</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
