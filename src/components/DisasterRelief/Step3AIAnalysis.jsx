import React, { useState, useEffect, useRef } from "react";
import { Loader2, Check, Sparkles, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeReport } from "../../services/api";
import { flushSync } from "react-dom";

const analysisStepsMap = {
  flood: [
    "Detecting Flood",
    "Reading GPS Metadata",
    "Estimating Water Level",
    "Detecting Structural Damage",
    "Matching Government Schemes",
    "Calculating Estimated Loss"
  ],

  earthquake: [
    "Detecting Earthquake",
    "Reading Seismic Damage",
    "Analyzing Building Cracks",
    "Detecting Structural Collapse",
    "Matching Government Schemes",
    "Calculating Estimated Loss"
  ],

  fire: [
    "Detecting Fire",
    "Estimating Burn Area",
    "Analyzing Smoke Damage",
    "Detecting Structural Damage",
    "Matching Government Schemes",
    "Calculating Estimated Loss"
  ],

  cyclone: [
    "Detecting Cyclone",
    "Estimating Wind Damage",
    "Analyzing Roof Damage",
    "Detecting Structural Damage",
    "Matching Government Schemes",
    "Calculating Estimated Loss"
  ],

  landslide: [
    "Detecting Landslide",
    "Estimating Soil Movement",
    "Analyzing Road Damage",
    "Detecting Structural Damage",
    "Matching Government Schemes",
    "Calculating Estimated Loss"
  ],

  rain: [
    "Detecting Heavy Rain",
    "Analyzing Waterlogging",
    "Estimating Flood Risk",
    "Detecting Property Damage",
    "Matching Government Schemes",
    "Calculating Estimated Loss"
  ]
};


export default function Step3AIAnalysis({
    reportId,
    selectedDisaster,
    setAnalysisData,
    onComplete
}) {

  const analysisSteps =
  analysisStepsMap[selectedDisaster] || analysisStepsMap.flood;
  const [completedSteps, setCompletedSteps] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const hasCalledComplete = useRef(false);
  const analysisStarted = useRef(false);
  
const runAnalysis = async () => {

    if (analysisStarted.current) return;

    analysisStarted.current = true;

    try {

        const result = await analyzeReport(reportId);

        console.log("FULL RESULT");
        console.log(JSON.stringify(result, null, 2));

        console.log("Analysis Data");
        console.log(result);

        flushSync(() => {
            setAnalysisData(result.analysis);
        });

        onComplete();

    } catch (error) {

        console.error(error);
        alert("Analysis failed");

    }
};

  useEffect(() => {
    // ── Progress bar: 0 → 100 over ~4s ──────────────────────
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(progressTimer); return 100; }
        return Math.min(p + 1.5, 100);
      });
    }, 60);

    // ── Checklist: tick one item every 650ms ─────────────────
    let idx = 0;
    const stepTimer = setInterval(() => {
      const current = idx;
      setCompletedSteps((prev) => [...prev, analysisSteps[current]]);
      idx += 1;

      if (idx < analysisSteps.length) {
        setActiveIdx(idx);
      } else {
        clearInterval(stepTimer);
        // Mark done & auto-advance after 1.2s
        setIsDone(true);
        setActiveIdx(analysisSteps.length);
        if (!hasCalledComplete.current) {
          hasCalledComplete.current = true;
          setTimeout(() => runAnalysis(), 1200);
        }
      }
    }, 650);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-[#0B0B12] rounded-[20px] p-8 border border-[rgba(255,255,255,0.08)] flex flex-col items-center justify-center min-h-[420px] text-center relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#F4C95D]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-8 relative z-10">

        {/* Spinner / Done tick */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {isDone ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-12 h-12 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]"
              >
                <Check className="w-6 h-6 stroke-[3]" />
              </motion.div>
            ) : (
              <>
                <Loader2 className="w-12 h-12 text-[#F4C95D] animate-spin stroke-[1.5]" />
                <div className="absolute inset-0 w-12 h-12 bg-[#F4C95D]/15 rounded-full blur-md animate-pulse pointer-events-none" />
              </>
            )}
          </div>
          <span className={`text-xs font-bold uppercase tracking-widest mt-4 flex items-center gap-1.5 font-poppins ${isDone ? "text-[#22C55E]" : "text-[#F4C95D]"}`}>
            <Sparkles className="w-3.5 h-3.5" />
            {isDone ? "Analysis Complete" : "AI Computer Vision Model Active"}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-[#A5A8B5] font-space-grotesk font-semibold">
            <span>{isDone ? "All checks passed" : "Analyzing evidence files"}</span>
            <span>{Math.floor(progress)}%</span>
          </div>
          <div className="h-2 bg-[#171923] rounded-full overflow-hidden border border-[rgba(255,255,255,0.05)]">
            <motion.div
              style={{ width: `${progress}%` }}
              className={`h-full rounded-full ${isDone ? "bg-[#22C55E]" : "bg-gradient-to-r from-[#F4C95D] to-[#FFD978]"}`}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>

        {/* Live Checklist */}
        <div className="bg-[#11131A] rounded-[20px] border border-[rgba(255,255,255,0.05)] p-5 text-left space-y-3">
          <h4 className="text-[10px] font-bold text-[#A5A8B5] uppercase tracking-wider font-poppins pb-2 border-b border-[rgba(255,255,255,0.05)]">
            Neural Network Inferences
          </h4>

          <div className="grid gap-2.5 text-xs">
            {analysisSteps.map((step, idx) => {
              const done = completedSteps.includes(step);
              const active = idx === activeIdx && !isDone;

              return (
                <div
                  key={step}
                  className={`flex items-center gap-2.5 transition-all duration-300 ${
                    done ? "text-white" : active ? "text-[#F4C95D] font-bold" : "text-[#A5A8B5] opacity-40"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    done
                      ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
                      : active
                      ? "bg-[#F4C95D]/10 border-[#F4C95D]/30"
                      : "bg-[#171923] border-[rgba(255,255,255,0.05)]"
                  }`}>
                    {done ? (
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    ) : active ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F4C95D] animate-ping" />
                    ) : null}
                  </div>
                  <span className="font-inter">{step}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manual Continue button — appears once done */}

      </div>
    </div>
  );
}
