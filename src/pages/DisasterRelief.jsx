import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { flushSync } from "react-dom";

import StepperProgress from "../components/DisasterRelief/StepperProgress";
import Step1DisasterSelect from "../components/DisasterRelief/Step1DisasterSelect";
import Step2UploadCenter from "../components/DisasterRelief/Step2UploadCenter";
import Step3AIAnalysis from "../components/DisasterRelief/Step3AIAnalysis";
import Step4DamageReport from "../components/DisasterRelief/Step4DamageReport";
import Step5GovernmentSchemes from "../components/DisasterRelief/Step5GovernmentSchemes";
import Step6Eligibility from "../components/DisasterRelief/Step6Eligibility";
import Step7Documents from "../components/DisasterRelief/Step7Documents";
import Step8ClaimTimeline from "../components/DisasterRelief/Step8ClaimTimeline";
import Step9NearbyHelp from "../components/DisasterRelief/Step9NearbyHelp";
import FloatingAIChat from "../components/DisasterRelief/FloatingAIChat";

// import {
//   mockDamageData,
//   mockGalleryImages,
//   mockSchemes,
// } from "../components/DisasterRelief/reliefMockData";

import {
  checkBackend,
  createReport,
  checkEligibility,
  saveDocuments,
  getDocuments,
  saveTimeline,
  getTimeline,
  saveNearbyHelp,
  getNearbyHelp,
  getSchemes          // <-- Add this
} from "../services/api";

const STEP_LABELS = [
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

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.28 },
};

export default function DisasterRelief() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [reportId, setReportId] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [eligibilityData, setEligibilityData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [officerData, setOfficerData] = useState(null);
  const [nearbyHelpData, setNearbyHelpData] = useState([]);
  const [governmentSchemes, setGovernmentSchemes] = useState([]);

  useEffect(() => {
  async function testConnection() {
    try {
      const data = await checkBackend();
      console.log("✅ Backend Connected");
      console.log(data);
    } catch (error) {
      console.error("❌ Backend Error");
      console.error(error);
    }
  }

  testConnection();
}, []);

useEffect(() => {
  console.log("Current Step:", currentStep);
}, [currentStep]);

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, STEP_LABELS.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goPrev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleEligibility = async () => {
  try {
    const result = await checkEligibility(reportId);

    console.log("Eligibility Result");
    console.log(result);

    setEligibilityData(result.eligibility);

    goNext();
  } catch (error) {
    console.error(error);
    alert("Eligibility check failed");
  }
};


const handleDocuments = async () => {
  try {

    await saveDocuments(reportId);

    const result = await getDocuments(reportId);

    console.log("Documents");
    console.log(result);

    setDocuments(result.documents);

    goNext();

  } catch (error) {

    console.error(error);

    alert("Document loading failed");

  }
};

const handleTimeline = async () => {
  try {

    await saveTimeline(reportId);

    const result = await getTimeline(reportId);

    console.log("Timeline");
    console.log(result);

    setTimelineData(result.timeline);
    setOfficerData({
  name: "Rajesh Kumar",
  role: "Block Development Officer",
  zone: "Ward 14",
  phone: "9876543210",
  inspectionDate: "16 Jul 2026",
  inspectionTime: "10:00 AM - 12:00 PM",
  note: "Please keep all original documents ready."
});

    goNext();

  } catch (error) {
    console.error(error);
    alert("Timeline failed");
  }
};

const handleNearbyHelp = async () => {
  try {

    await saveNearbyHelp(reportId);

    const result = await getNearbyHelp(reportId);

    console.log("Nearby Help");
    console.log(result);

    setNearbyHelpData(result.services);

    goNext();

  } catch (error) {
    console.error(error);
    alert("Nearby Help failed");
  }
};

const handleGovernmentSchemes = async () => {
  console.log("FUNCTION CALLED");

  try {

    console.log("Selected Disaster:", selectedDisaster);
    console.log("Analysis:", analysisData);
    console.log("damage =", analysisData?.analysis?.damage_percent);

    if (!analysisData) {
    console.log("No analysis");
    return;
}

    const result = await getSchemes(
    selectedDisaster,
    analysisData.damage_percent,
    "Punjab"
);

    console.log("API RESULT");
    console.log(result);

    flushSync(() => {
    setGovernmentSchemes(result.schemes || []);
});

goNext();

  } catch(err) {
    console.log("ERROR");
    console.log(err);
  }
}


  const jumpTo = (step) => {
    if (step < currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const handleCreateReport = async () => {
  try {
    if (!selectedDisaster) {
      alert("Please select a disaster type.");
      return;
    }

    const response = await createReport({
      disaster_type: selectedDisaster,
      location: "Location will come later",
      description: "Created from Step 1",
    });

    console.log("FULL RESPONSE");
    console.log(JSON.stringify(response, null, 2));

    console.log("Response from backend:", response);
    console.log("Report ID:", response.report_id);
    setReportId(response.report_id);


    goNext();
  } catch (error) {
    console.error(error);
    alert("Failed to create report.");
  }
};

console.log("Government Schemes State:", governmentSchemes);

const firstScheme = governmentSchemes?.[0];

const reliefAmount = firstScheme?.amount || "Not Available";

const matchedSchemes = governmentSchemes?.length || 0;

const aiConfidence = analysisData?.ai_confidence || "--";

const severity = analysisData?.severity || "--";

const damagePercent = analysisData?.damage_percent || "--";

const inspectionDate =
  officerData?.inspectionDate ||
  "Pending";

const officerName =
  officerData?.name ||
  "Officer will be assigned";

const inspectionTime =
  officerData?.inspectionTime ||
  "Pending";

const officerNote =
  officerData?.note ||
  "No additional instructions.";

const selectedScheme =
  eligibilityData?.scheme_name ||
  firstScheme?.name ||
  "Scheme Pending";


  return (
    <div className="min-h-screen bg-[#0B0B12] text-white font-inter antialiased">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0B0B12]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <Building2 className="w-5 h-5 text-[#F4C95D]" />
            <span className="text-sm font-bold tracking-tight">CivicSync</span>
          </Link>

          {/* Step label pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#11131A]">
            <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider">
              Step {currentStep} of {STEP_LABELS.length}
            </span>
            <span className="text-[9px] font-bold text-[#F4C95D] font-poppins">
              {STEP_LABELS[currentStep - 1]}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                onClick={goPrev}
                className="px-3 py-1.5 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#11131A] hover:bg-[#171923] text-xs font-bold text-[#A5A8B5] transition-all flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <Link
              to="/"
              className="px-3 py-1.5 rounded-[10px] text-xs font-bold text-[#A5A8B5] hover:text-white transition-colors"
            >
              Exit
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="pt-28 pb-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">

        {/* Stepper */}
        <div className="bg-[#11131A] border border-[rgba(255,255,255,0.08)] rounded-[20px] px-6 py-4">
          <StepperProgress currentStep={currentStep} />
        </div>

        {/* ── Completed Steps (Collapsed summary) ─────────────── */}
        {currentStep > 1 && (
          <div className="space-y-2">
            {Array.from({ length: currentStep - 1 }).map((_, i) => {
              const stepNum = i + 1;
              return (
                <button
                  key={stepNum}
                  onClick={() => jumpTo(stepNum)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-[#11131A] border border-[rgba(255,255,255,0.06)] rounded-[16px] hover:border-[rgba(255,255,255,0.12)] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#F4C95D] flex items-center justify-center">
                      <span className="text-[8px] font-black text-[#0B0B12]">✓</span>
                    </div>
                    <span className="text-xs font-bold text-[#A5A8B5] group-hover:text-white transition-colors font-poppins">
                      Step {stepNum} — {STEP_LABELS[i]}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#F4C95D] font-bold group-hover:underline">Edit</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Active Step Panel ─────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            {...fadeUp}
            className="bg-[#11131A] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 sm:p-8"
          >
            {currentStep === 1 && (
              <Step1DisasterSelect
                selectedType={selectedDisaster}
                onSelect={setSelectedDisaster}
                onNext={handleCreateReport}
              />
            )}
            {currentStep === 2 && (
              <Step2UploadCenter
                reportId={reportId}
                onNext={goNext}
                onFilesChange={setUploadedFiles}
              />
            )}
            {currentStep === 3 && (
              <Step3AIAnalysis
    reportId={reportId}
    selectedDisaster={selectedDisaster}
    setAnalysisData={setAnalysisData}
    onComplete={goNext}
/>
            )}
            {currentStep === 4 && (
              <Step4DamageReport
    data={analysisData}
    images={[]}
    onNext={handleGovernmentSchemes}
/>
            )}
            {currentStep === 5 && (
              <Step5GovernmentSchemes
    schemes={governmentSchemes}
    onNext={handleEligibility}
/>
            )}
            {currentStep === 6 && (
  <Step6Eligibility
      eligibility={eligibilityData}
      analysis={analysisData}
      onNext={handleDocuments}
  />
)}
            {currentStep === 7 && (
              <Step7Documents
    documents={documents}
    onNext={handleTimeline}
/>
            )}
            {currentStep === 8 && (
              <Step8ClaimTimeline
    timeline={timelineData}
    officer={officerData}
    onNext={handleNearbyHelp}
/>
            )}
            {currentStep === 9 && (
    <Step9NearbyHelp
        services={nearbyHelpData}
    />
)}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Navigation */}
{currentStep < 4 && currentStep !== 3 && (
  <div className="flex items-center justify-between pt-2">

    <button
      onClick={goPrev}
    >
      Previous Step
    </button>

    <button
      onClick={goNext}
    >
      Continue to Step...
    </button>

  </div>

)}

        {/* Final completion card on Step 9 */}
        {currentStep === 9 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[20px] bg-[#11131A] border border-[#F4C95D]/20 overflow-hidden relative"
          >
            {/* Gold radial glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 bg-[#F4C95D]/8 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 p-6 sm:p-8 space-y-6">
              {/* Top: Badge + Title */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-14 h-14 rounded-[18px] bg-[#F4C95D]/10 border border-[#F4C95D]/25 flex items-center justify-center text-2xl shrink-0">
                  🎉
                </div>
                <div className="text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-[9px] font-bold uppercase tracking-widest mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                    Application Submitted
                  </div>
                  <h3 className="text-lg font-extrabold text-white font-poppins leading-tight">
                    Relief Claim Successfully Submitted
                  </h3>
                  <p className="text-xs text-[#A5A8B5] font-inter mt-1 max-w-lg">
                    {`Your disaster relief application has been successfully generated and submitted. Your Report ID is ${reportId}. The matched government scheme and AI assessment have been saved for further verification.`}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Relief Approved", value: reliefAmount, color: "#F4C95D" },
                  { label: "Schemes Matched", value: `${matchedSchemes} Schemes`, color: "#22C55E" },
                  { label: "AI Confidence", value: `${aiConfidence}%`, color: "#A5A8B5" },
                  { label: "Inspection Date", value: inspectionDate, color: "#F59E0B" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)] text-center"
                  >
                    <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                      {stat.label}
                    </p>
                    <p className="text-lg font-bold font-space-grotesk" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Achievements checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Disaster type identified & AI model loaded",
                  "Evidence photos uploaded & geo-verified",
                  `Structural damage assessed at ${damagePercent}% (${severity})`,
`${matchedSchemes} government schemes matched`,
eligibilityData?.is_eligible
  ? "Eligibility successfully verified"
  : "Eligibility pending verification",
`${officerName} assigned`,
`Inspection scheduled for ${inspectionDate}`,
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-xs text-[#A5A8B5] font-inter">
                    <div className="w-4 h-4 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center shrink-0">
                      <svg className="w-2.5 h-2.5 text-[#22C55E]" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 5l2.5 2.5L8.5 2" />
                      </svg>
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              {/* Next Steps banner */}
              <div className="p-4 rounded-[14px] bg-[#F59E0B]/5 border border-[#F59E0B]/15 flex items-start gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-white font-poppins">Action Required — {inspectionDate}</p>
                  <p className="text-[10px] text-[#A5A8B5] font-inter mt-0.5 leading-relaxed">
                    Be present at your Ward 14 property between <span className="text-white font-semibold">{inspectionTime}</span> for physical inspection by BDO {officerName}. Carry your Aadhaar card and land ownership documents. 
                  </p>
                  <p className="text-[10px] text-[#F4C95D] mt-2">{officerNote}</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                <Link
                  to="/"
                  className="w-full sm:w-auto px-8 py-3 rounded-[14px] bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(244,201,93,0.2)] active:scale-95"
                >
                  Return to Dashboard
                </Link>
                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-6 py-3 rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[#171923] hover:bg-[#202330] text-xs font-bold text-[#A5A8B5] hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  Download Case Summary
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Floating AI Chat */}
      <FloatingAIChat />
    </div>
  );
}
