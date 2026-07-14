import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  "Select Disaster",
  "Upload Evidence",
  "AI Analysis",
  "Damage Report",
  "Gov. Schemes",
  "Eligibility",
  "Documents",
  "Claim Timeline",
  "Nearby Help",
];

export default function StepperProgress({ currentStep }) {
  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex items-center min-w-max gap-0">
        {STEPS.map((label, idx) => {
          const stepNum = idx + 1;
          const isCompleted = currentStep > stepNum;
          const isActive = currentStep === stepNum;

          return (
            <React.Fragment key={label}>
              {/* Step Node */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 ${
                    isCompleted
                      ? "bg-[#F4C95D] border-[#F4C95D] shadow-[0_0_12px_rgba(244,201,93,0.3)]"
                      : isActive
                      ? "bg-[#11131A] border-[#F4C95D]"
                      : "bg-[#11131A] border-[rgba(255,255,255,0.08)]"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-[#0B0B12] stroke-[3]" />
                  ) : (
                    <span
                      className={`text-[10px] font-bold font-space-grotesk ${
                        isActive ? "text-[#F4C95D]" : "text-[rgba(255,255,255,0.2)]"
                      }`}
                    >
                      {stepNum}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[9px] font-bold whitespace-nowrap font-poppins transition-colors ${
                    isActive
                      ? "text-[#F4C95D]"
                      : isCompleted
                      ? "text-[#A5A8B5]"
                      : "text-[rgba(255,255,255,0.2)]"
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Connector Line */}
              {idx < STEPS.length - 1 && (
                <div className="w-12 h-px mx-1 mb-5 relative shrink-0">
                  <div className="absolute inset-0 bg-[rgba(255,255,255,0.06)] rounded-full" />
                  {isCompleted && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      className="absolute inset-0 bg-[#F4C95D] rounded-full"
                    />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
