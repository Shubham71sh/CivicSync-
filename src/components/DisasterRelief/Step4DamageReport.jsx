import React, { useState } from "react";
import {
  Sparkles, Eye, X, Landmark, CloudRain, Zap,
  DollarSign, Cpu, ChevronRight, AlertCircle, Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Safe percentage formatter.
 * Returns "Not detected" if value is null / undefined / negative.
 * Returns "N/A" only when explicitly forced.
 * Never returns "NaN%" or "0%" from a missing field.
 */
function fmtPct(value) {
  if (value === null || value === undefined || value < 0) return "Not detected";
  if (typeof value === "string") {
    const n = parseFloat(value);
    if (Number.isNaN(n) || n < 0) return "Not detected";
    return `${Math.round(n)}%`;
  }
  return `${Math.round(value)}%`;
}

/** Safe integer loss formatter — never shows ₹0 when value is missing. */
function fmtLoss(value) {
  if (value === null || value === undefined || value <= 0) return "Not assessed";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n) || n <= 0) return "Not assessed";
  return `₹${n.toLocaleString("en-IN")}`;
}

function severityColor(val) {
  const n = typeof val === "number" ? val : parseFloat(val);
  if (Number.isNaN(n) || n < 0) return "bg-[#A5A8B5]/10 text-[#A5A8B5]";
  if (n >= 70) return "bg-[#EF4444]/10 text-[#EF4444]";
  if (n >= 40) return "bg-[#F59E0B]/10 text-[#F59E0B]";
  return "bg-[#22C55E]/10 text-[#22C55E]";
}

function severityLabel(val) {
  const n = typeof val === "number" ? val : parseFloat(val);
  if (Number.isNaN(n) || n < 0) return "Unknown";
  if (n >= 70) return "Severe";
  if (n >= 40) return "Moderate";
  return "Low";
}

// ── Disaster-specific metric builders (using ONLY real data, no fabrication) ─

function buildMetrics(disaster, d) {
  const type = (disaster || "flood").toLowerCase().replace(/\s+/g, "_");

  // We only show a metric if the backend actually returned a non-null value.
  // Derived values like `Math.max(0, house - 15)` have been removed entirely.
  const house   = d.house_damage;
  const crop    = d.crop_damage;
  const vehicle = d.vehicle_damage;

  // If the backend returned a `metrics` array (new format), use it directly
  if (Array.isArray(d.metrics) && d.metrics.length > 0) {
    return d.metrics
      .filter((m) => m.value !== null && m.value !== undefined && m.value >= 0)
      .map((m) => ({
        name:   m.label,
        value:  m.value,
        status: severityLabel(m.value),
      }));
  }

  // Legacy fallback: build from scalar fields present in the response
  const rows = [];
  if (type.includes("earthquake")) {
    if (house   !== null && house   !== undefined && house   >= 0) rows.push({ name: "Structural Damage",    value: house,   status: severityLabel(house)   });
    if (vehicle !== null && vehicle !== undefined && vehicle >= 0) rows.push({ name: "Vehicle Damage",        value: vehicle, status: severityLabel(vehicle) });
  } else if (type.includes("fire")) {
    if (house   !== null && house   !== undefined && house   >= 0) rows.push({ name: "Structural Damage",    value: house,   status: severityLabel(house)   });
    if (vehicle !== null && vehicle !== undefined && vehicle >= 0) rows.push({ name: "Vehicle Damage",        value: vehicle, status: severityLabel(vehicle) });
  } else if (type.includes("cyclone")) {
    if (house   !== null && house   !== undefined && house   >= 0) rows.push({ name: "Structural Damage",    value: house,   status: severityLabel(house)   });
    if (crop    !== null && crop    !== undefined && crop    >= 0) rows.push({ name: "Crop Damage",           value: crop,    status: severityLabel(crop)    });
    if (vehicle !== null && vehicle !== undefined && vehicle >= 0) rows.push({ name: "Vehicle Damage",        value: vehicle, status: severityLabel(vehicle) });
  } else if (type.includes("landslide")) {
    if (house   !== null && house   !== undefined && house   >= 0) rows.push({ name: "Structural Damage",    value: house,   status: severityLabel(house)   });
    if (vehicle !== null && vehicle !== undefined && vehicle >= 0) rows.push({ name: "Vehicle Damage",        value: vehicle, status: severityLabel(vehicle) });
  } else if (type.includes("rain") || type.includes("heavy")) {
    if (house   !== null && house   !== undefined && house   >= 0) rows.push({ name: "Property Damage",      value: house,   status: severityLabel(house)   });
    if (crop    !== null && crop    !== undefined && crop    >= 0) rows.push({ name: "Crop Damage",           value: crop,    status: severityLabel(crop)    });
    if (vehicle !== null && vehicle !== undefined && vehicle >= 0) rows.push({ name: "Vehicle Damage",        value: vehicle, status: severityLabel(vehicle) });
  } else {
    // Flood (default)
    if (house   !== null && house   !== undefined && house   >= 0) rows.push({ name: "House Damage",         value: house,   status: severityLabel(house)   });
    if (crop    !== null && crop    !== undefined && crop    >= 0) rows.push({ name: "Crop Damage",           value: crop,    status: severityLabel(crop)    });
    if (vehicle !== null && vehicle !== undefined && vehicle >= 0) rows.push({ name: "Vehicle Damage",        value: vehicle, status: severityLabel(vehicle) });
  }

  return rows;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Step4DamageReport({
  data = {},
  disasterType = "flood",
  images = [],
  onNext,
}) {
  const [activeImage, setActiveImage] = useState(null);

  const isFallback = data.is_fallback === true;
  const metrics    = buildMetrics(disasterType, data);

  const overallPct  = data.damage_percent;
  const overallSev  = data.severity || (typeof overallPct === "number" && overallPct >= 70 ? "Severe" : null);
  const confidence  = data.ai_confidence;
  const estimLoss   = data.estimated_loss;
  const evidenceSummary = data.evidence_summary || "";
  const observations    = data.observations    || [];
  const limitations     = data.limitations     || [];

  return (
    <div className="space-y-6">

      {/* ── Title row ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-poppins">
            AI Damage Assessment Report
          </h3>
          <p className="text-xs text-[#A5A8B5] font-inter capitalize">
            Based on validated <span className="text-white font-semibold">{disasterType}</span> evidence
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#F4C95D]/20 bg-[#F4C95D]/5 text-[#F4C95D] text-xs font-semibold">
          <Cpu className="w-3.5 h-3.5" />
          <span className="font-space-grotesk">
            {isFallback
              ? "Fallback Mode — AI unavailable"
              : confidence !== null && confidence !== undefined
              ? `${confidence}% AI Confidence`
              : "AI Analysis"}
          </span>
        </div>
      </div>

      {/* ── Fallback warning ── */}
      {isFallback && (
        <div className="flex items-start gap-3 p-3.5 rounded-[16px] bg-[#F59E0B]/8 border border-[#F59E0B]/20 text-[#F59E0B] text-xs font-inter">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">Estimated values — AI service unavailable</p>
            <p className="text-[10px] opacity-80 leading-relaxed">
              Real-time AI analysis could not be completed. The values below are conservative
              estimates for the selected disaster type. A field officer will conduct an
              on-site verification before any relief is disbursed.
            </p>
          </div>
        </div>
      )}

      {/* ── Evidence summary ── */}
      {evidenceSummary && !isFallback && (
        <div className="flex items-start gap-3 p-3.5 rounded-[16px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-xs font-inter">
          <Info className="w-4 h-4 text-[#F4C95D] shrink-0 mt-0.5" />
          <p className="text-[#A5A8B5] leading-relaxed italic">"{evidenceSummary}"</p>
        </div>
      )}

      {/* ── Damage metric cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((item, idx) => {
          const lowerName = item.name.toLowerCase();
          let Icon = Landmark;
          if (lowerName.includes("water") || lowerName.includes("crop") || lowerName.includes("rain")) Icon = CloudRain;
          else if (lowerName.includes("burn") || lowerName.includes("vehicle") || lowerName.includes("electric")) Icon = Zap;

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
                  {fmtPct(item.value)}
                </span>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-poppins ${severityColor(item.value)}`}>
                  {item.status}
                </span>
              </div>
            </div>
          );
        })}

        {/* Financial Loss card */}
        <div className="p-5 rounded-[20px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] flex flex-col justify-between hover:border-[rgba(255,255,255,0.15)] transition-all duration-300 min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins">
              Estimated Loss
            </span>
            <DollarSign className="w-3.5 h-3.5 text-[#F4C95D]" />
          </div>
          <div className="mt-4">
            <span className={`text-xl font-bold font-space-grotesk ${estimLoss > 0 ? "text-[#F4C95D]" : "text-[#A5A8B5]"}`}>
              {fmtLoss(estimLoss)}
            </span>
            <span className="text-[8px] text-[#A5A8B5] block mt-1 uppercase tracking-wider">
              {estimLoss > 0 ? "AI Estimate" : "Insufficient data"}
            </span>
          </div>
        </div>

        {/* Overall severity card */}
        <div className="p-5 rounded-[20px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] flex flex-col justify-between hover:border-[rgba(255,255,255,0.15)] transition-all duration-300 min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins">
              Overall Severity
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#F4C95D]" />
          </div>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-xl font-bold text-white font-space-grotesk">
              {fmtPct(overallPct)}
            </span>
            {overallSev && (
              <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-poppins ${severityColor(overallPct)}`}>
                {overallSev}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── No metrics detected warning ── */}
      {metrics.length === 0 && !isFallback && (
        <div className="flex items-start gap-3 p-3.5 rounded-[16px] bg-[#F59E0B]/8 border border-[#F59E0B]/20 text-[#F59E0B] text-xs font-inter">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            AI could not detect specific damage categories from the uploaded evidence.
            Overall severity and loss estimate are shown. A field officer will conduct an on-site assessment.
          </p>
        </div>
      )}

      {/* ── Observations ── */}
      {observations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-[#A5A8B5] uppercase tracking-wider font-poppins">
            Key Observations
          </h4>
          <ul className="space-y-1.5">
            {observations.map((obs, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#A5A8B5] font-inter">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F4C95D] shrink-0 mt-1.5" />
                {obs}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Limitations ── */}
      {limitations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-[#A5A8B5] uppercase tracking-wider font-poppins">
            Assessment Limitations
          </h4>
          <ul className="space-y-1.5">
            {limitations.map((lim, i) => (
              <li key={i} className="flex items-start gap-2 text-[10px] text-[#A5A8B5]/70 font-inter italic">
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-[#F59E0B]/60" />
                {lim}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Image gallery (only if images prop is populated) ── */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-[#A5A8B5] uppercase tracking-wider font-poppins">
            Vision Model Detections
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {images.map((img) => (
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
      )}

      {/* ── Image modal ── */}
      <AnimatePresence>
        {activeImage && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveImage(null)}
              className="absolute inset-0 bg-[#0B0B12]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-[#11131A] border border-[rgba(255,255,255,0.08)] rounded-[20px] max-w-3xl w-full overflow-hidden shadow-2xl z-10"
            >
              <div className="relative aspect-video w-full">
                <img src={activeImage.url} alt={activeImage.label} className="w-full h-full object-cover" />
                {(activeImage.detections || []).map((det) => {
                  const isHigh = det.severity === "Severe" || det.severity === "High";
                  return (
                    <div
                      key={det.id}
                      style={{ position: "absolute", left: det.x, top: det.y, width: det.w, height: det.h }}
                      className={`border-2 rounded-[8px] ${isHigh ? "border-[#EF4444] bg-[#EF4444]/10" : "border-[#F59E0B] bg-[#F59E0B]/10"}`}
                    >
                      <span className={`absolute -top-6 left-0 px-2 py-0.5 rounded-[6px] text-[8px] font-bold text-white uppercase tracking-wider ${isHigh ? "bg-[#EF4444]" : "bg-[#F59E0B]"}`}>
                        {det.label} ({det.confidence}%)
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 flex items-center justify-between border-t border-[rgba(255,255,255,0.08)]">
                <div>
                  <h4 className="text-xs font-bold text-white font-poppins">{activeImage.label}</h4>
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

      {/* ── Navigation ── */}
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
