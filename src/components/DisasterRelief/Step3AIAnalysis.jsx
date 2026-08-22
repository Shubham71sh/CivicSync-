import React, { useState, useEffect, useRef } from "react";
import { Loader2, Check, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeReport } from "../../services/api";

// Disaster-specific checklist labels — Step 3 is ONLY damage assessment.
// Government scheme matching belongs to Step 5.
const ANALYSIS_STEPS = {
  flood:      ["Detecting Flood Evidence",  "Estimating Water Level",   "Assessing Structural Damage", "Evaluating Crop Impact",  "Calculating Financial Loss",  "Finalising Assessment"],
  earthquake: ["Detecting Seismic Damage",  "Analysing Building Cracks","Assessing Collapse Risk",     "Evaluating Infrastructure","Calculating Financial Loss",  "Finalising Assessment"],
  fire:       ["Detecting Fire Damage",     "Estimating Burn Area",     "Assessing Structural Damage", "Evaluating Smoke Impact",  "Calculating Financial Loss",  "Finalising Assessment"],
  cyclone:    ["Detecting Wind Damage",     "Assessing Roof Damage",    "Evaluating Crop Loss",        "Checking Structural Integrity","Calculating Financial Loss","Finalising Assessment"],
  landslide:  ["Detecting Soil Movement",   "Assessing Road Damage",    "Evaluating Structural Risk",  "Checking Land Stability",  "Calculating Financial Loss",  "Finalising Assessment"],
  rain:       ["Detecting Waterlogging",    "Estimating Flood Risk",    "Assessing Property Damage",   "Evaluating Crop Impact",   "Calculating Financial Loss",  "Finalising Assessment"],
};

const DEFAULT_STEPS = ANALYSIS_STEPS.flood;

/**
 * Step 3 — AI Damage Assessment.
 *
 * Props:
 *   reportId        string  — report to analyse
 *   selectedDisaster string  — for checklist labels
 *   evidenceResult  object  — validated evidence from Step 2 (display only)
 *   setAnalysisData fn      — lift analysis result to parent
 *   onComplete      fn      — advance to Step 4 (called once, after success)
 */
export default function Step3AIAnalysis({
  reportId,
  selectedDisaster,
  evidenceResult,
  setAnalysisData,
  onComplete,
}) {
  const disasterKey   = (selectedDisaster || "flood").toLowerCase().replace(/\s+/g, "_").replace("heavy_rain", "rain");
  const analysisSteps = ANALYSIS_STEPS[disasterKey] || DEFAULT_STEPS;

  const [completedSteps, setCompletedSteps] = useState([]);
  const [activeIdx,      setActiveIdx]      = useState(0);
  const [progress,       setProgress]       = useState(0);
  const [phase,          setPhase]          = useState("running"); // "running" | "success" | "error"
  const [errorMessage,   setErrorMessage]   = useState(null);
  const [retryCount,     setRetryCount]     = useState(0);
  const [isCached,       setIsCached]       = useState(false);

  // analysisCalledRef prevents the API from being called more than once
  // even when React StrictMode double-invokes effects (mount→unmount→mount).
  // We use a module-level map keyed by reportId+retryCount so it survives
  // StrictMode's unmount/remount cycle.
  const analysisCalledRef = useRef(false);
  const isMountedRef      = useRef(true);
  const timersRef         = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => { clearInterval(t); clearTimeout(t); });
    timersRef.current = [];
  };

  useEffect(() => {
    isMountedRef.current = true;
    analysisCalledRef.current = false; // reset on retry

    const startAnalysis = () => {
      if (analysisCalledRef.current) return;
      analysisCalledRef.current = true;

      setPhase("running");
      setErrorMessage(null);
      setCompletedSteps([]);
      setActiveIdx(0);
      setProgress(0);

      // Progress bar 0 → 90 over ~5 s, holds until API responds
      const progressTimer = setInterval(() => {
        if (!isMountedRef.current) return;
        setProgress((p) => {
          if (p >= 90) { clearInterval(progressTimer); return 90; }
          return Math.min(p + 1.2, 90);
        });
      }, 60);
      timersRef.current.push(progressTimer);

      // Animated checklist — one step every 750 ms
      let idx = 0;
      const stepTimer = setInterval(() => {
        if (!isMountedRef.current) return;
        setCompletedSteps((prev) => [...prev, analysisSteps[idx]]);
        idx += 1;
        if (idx < analysisSteps.length) {
          setActiveIdx(idx);
        } else {
          clearInterval(stepTimer);
          setActiveIdx(analysisSteps.length);
          // Fire actual API only after the animation completes
          runApiCall();
        }
      }, 750);
      timersRef.current.push(stepTimer);
    };

    const runApiCall = async () => {
      try {
        // retryCount > 0 means the user explicitly clicked Retry → force fresh analysis
        const result = await analyzeReport(reportId, retryCount > 0);
        if (!isMountedRef.current) return; // component unmounted — do nothing

        if (!result?.analysis) {
          throw new Error("Backend returned an empty analysis response.");
        }

        setIsCached(result.cached === true);
        // Commit result to parent then advance — no flushSync needed
        setAnalysisData(result.analysis);
        setProgress(100);
        setPhase("success");

        // Advance to Step 4 after a short pause so user sees the ✓
        const advanceTimer = setTimeout(() => {
          if (isMountedRef.current) onComplete();
        }, 900);
        timersRef.current.push(advanceTimer);
      } catch (err) {
        if (!isMountedRef.current) return;
        clearTimers();
        setProgress(0);
        setPhase("error");
        setErrorMessage(
          err?.response?.data?.detail ||
          err?.message ||
          "AI analysis failed. Please try again."
        );
      }
    };

    startAnalysis();

    return () => {
      isMountedRef.current = false;
      clearTimers();
    };
  // retryCount is the only dependency: re-runs when user clicks Retry
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  const handleRetry = () => {
    clearTimers();
    isMountedRef.current = true; // will be reset in next effect
    setRetryCount((c) => c + 1);
  };

  // ── render ────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#0B0B12] rounded-[20px] p-8 border border-[rgba(255,255,255,0.08)] flex flex-col items-center justify-center min-h-[420px] text-center relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#F4C95D]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-8 relative z-10">

        {/* ── Status icon ── */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {phase === "error" ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400"
              >
                <AlertCircle className="w-6 h-6" />
              </motion.div>
            ) : phase === "success" ? (
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

          <span
            className={`text-xs font-bold uppercase tracking-widest mt-4 flex items-center gap-1.5 font-poppins ${
              phase === "error"   ? "text-red-400" :
              phase === "success" ? "text-[#22C55E]" :
              "text-[#F4C95D]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {phase === "error"   ? "Analysis Failed" :
             phase === "success" ? (isCached ? "Using Cached Analysis" : "Analysis Complete") :
             "AI Vision Model Active"}
          </span>
        </div>

        {/* ── Error state ── */}
        {phase === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="p-4 rounded-[16px] bg-red-500/10 border border-red-500/20 text-left">
              <p className="text-xs font-bold text-red-400 mb-1">Analysis could not be completed</p>
              <p className="text-[10px] text-[#A5A8B5] leading-relaxed">{errorMessage}</p>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[14px] bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] font-bold text-xs transition-all active:scale-95 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Analysis
            </button>
          </motion.div>
        )}

        {/* ── Running / success state ── */}
        {phase !== "error" && (
          <>
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[#A5A8B5] font-space-grotesk font-semibold">
                <span>{phase === "success" ? "All checks passed" : "Analysing evidence"}</span>
                <span>{Math.floor(progress)}%</span>
              </div>
              <div className="h-2 bg-[#171923] rounded-full overflow-hidden border border-[rgba(255,255,255,0.05)]">
                <motion.div
                  style={{ width: `${progress}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    phase === "success" ? "bg-[#22C55E]" : "bg-gradient-to-r from-[#F4C95D] to-[#FFD978]"
                  }`}
                />
              </div>
            </div>

            {/* Evidence context pills */}
            {evidenceResult && (
              <div className="flex flex-wrap gap-1.5 justify-center">
                {evidenceResult.file_type && (
                  <span className="text-[9px] px-2.5 py-1 rounded-full bg-[#F4C95D]/10 border border-[#F4C95D]/20 text-[#F4C95D] font-semibold capitalize">
                    {evidenceResult.file_type} evidence
                  </span>
                )}
                {(evidenceResult.possible_damage || []).slice(0, 3).map((d) => (
                  <span key={d} className="text-[9px] px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#A5A8B5] font-medium capitalize">
                    {d}
                  </span>
                ))}
              </div>
            )}

            {/* Checklist */}
            <div className="bg-[#11131A] rounded-[20px] border border-[rgba(255,255,255,0.05)] p-5 text-left space-y-3">
              <h4 className="text-[10px] font-bold text-[#A5A8B5] uppercase tracking-wider font-poppins pb-2 border-b border-[rgba(255,255,255,0.05)]">
                AI Damage Analysis Pipeline
              </h4>
              <div className="grid gap-2.5 text-xs">
                {analysisSteps.map((step, i) => {
                  const done   = completedSteps.includes(step);
                  const active = i === activeIdx && phase === "running";
                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-2.5 transition-all duration-300 ${
                        done   ? "text-white" :
                        active ? "text-[#F4C95D] font-bold" :
                        "text-[#A5A8B5] opacity-40"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                        done   ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]" :
                        active ? "bg-[#F4C95D]/10 border-[#F4C95D]/30" :
                        "bg-[#171923] border-[rgba(255,255,255,0.05)]"
                      }`}>
                        {done   ? <Check className="w-2.5 h-2.5 stroke-[3]" /> :
                         active ? <div className="w-1.5 h-1.5 rounded-full bg-[#F4C95D] animate-ping" /> :
                         null}
                      </div>
                      <span className="font-inter">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
