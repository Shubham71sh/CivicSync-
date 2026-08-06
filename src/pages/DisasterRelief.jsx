import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronLeft, ChevronRight, ChevronDown, FileText, Mail, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { flushSync } from "react-dom";
import { useAuth } from "../hooks/useAuth";

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
// import FloatingAIChat from "../components/DisasterRelief/FloatingAIChat";
import { downloadCaseSummaryPDF } from "../utils/generatePdf";

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
  getSchemes,
  submitReport
} from "../services/api";

import { getAssignedOfficer, getDynamicInspectionSlot } from "../utils/disasterHelpers";


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
  const { user } = useAuth();
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
  const [selectedSchemeState, setSelectedSchemeState] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailNotice, setEmailNotice] = useState(null);
  const [toast, setToast] = useState(null);

  const userEmail =
    user?.email ||
    (() => {
      try {
        const stored = localStorage.getItem("civicsync_user");
        return stored ? JSON.parse(stored).email : null;
      } catch (e) {
        return null;
      }
    })() ||
    "devasish778@gmail.com";

  const userName =
    user?.displayName ||
    user?.firstName ||
    (() => {
      try {
        const stored = localStorage.getItem("civicsync_user");
        return stored ? (JSON.parse(stored).displayName || JSON.parse(stored).firstName) : null;
      } catch (e) {
        return null;
      }
    })() ||
    "Citizen";

  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    try {
      const activeOff = officerData || getAssignedOfficer(reportId);
      const selScheme =
        eligibilityData?.scheme_name ||
        governmentSchemes?.[0]?.schemeName ||
        governmentSchemes?.[0]?.name ||
        "National Disaster Relief Fund";
      const relAmt = governmentSchemes?.[0]?.reliefAmount || "Not Available";
      const inspDate = activeOff?.inspectionDate || getDynamicInspectionDate();
      const offName = activeOff?.name || "Not Assigned";
      
      const subDate = new Date().toLocaleDateString("en-GB");
      const subTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      // Step 1 & 2 & 3: Save application & send email on backend
      const response = await submitReport(reportId || "REP-789234", {
        email: userEmail,
        user_name: userName,
        disaster_type: selectedDisaster || "Disaster Relief Claim",
        scheme_name: selScheme,
        relief_amount: relAmt,
        inspection_date: inspDate,
        officer_name: offName,
        submission_date: subDate,
        submission_time: subTime,
      });

      // Step 4: Capture real email delivery response from backend
      const isEmailDelivered = response?.email_sent !== false;
      setEmailNotice({
        emailSent: isEmailDelivered,
        email: userEmail,
        message: response?.message || (
          isEmailDelivered
            ? `✅ Application Submitted Successfully\n\nA confirmation email has been sent to your registered email address.`
            : `Application submitted successfully, but the confirmation email could not be sent.`
        ),
      });

      // Show toast message matching specs
      if (isEmailDelivered) {
        setToast({
          type: "success",
          msg: "✅ Application Submitted Successfully\n\nA confirmation email has been sent to your registered email address."
        });
      } else {
        setToast({
          type: "warning",
          msg: "Application submitted successfully, but the confirmation email could not be sent."
        });
      }
      setTimeout(() => setToast(null), 6000);

      // Step 5: Navigate to Success Screen (Do NOT download PDF automatically)
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const getDynamicInspectionDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const day = String(d.getDate()).padStart(2, "0");
    const monthNames = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return `${day} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  };

  const handleTimeline = async () => {
    try {
      await saveTimeline(reportId);

      const result = await getTimeline(reportId);

      console.log("Timeline");
      console.log(result);

      const officer = result.officer || getAssignedOfficer(reportId);

      setTimelineData(result.timeline);
      setOfficerData(officer);

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
    console.log("damage =", analysisData?.damage_percent);

    if (!analysisData || analysisData.damage_percent == null) {
    console.log("Analysis data missing");
    return;
}

    const result = await getSchemes(
    selectedDisaster,
    analysisData.damage_percent,
    "Punjab"
);

    console.log("API RESULT");
    console.log(result);

    console.log("Full Result:", JSON.stringify(result, null, 2));

    flushSync(() => {
    setGovernmentSchemes(result);
    if (result && result.length > 0) {
      setSelectedSchemeState(result[0]);
    }
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

const reliefAmount = firstScheme?.reliefAmount || "Not Available";

const matchedSchemes = governmentSchemes?.length || 0;

const aiConfidence = analysisData?.ai_confidence || "--";

const severity = analysisData?.severity || "--";

const damagePercent = analysisData?.damage_percent || "--";

const activeOfficer = officerData || getAssignedOfficer(reportId);

const inspectionDate = activeOfficer.inspectionDate;
const officerName = activeOfficer.name;
const inspectionTime = activeOfficer.inspectionTime;
const officerNote = activeOfficer.note || activeOfficer.remarks;

const selectedScheme =
  eligibilityData?.scheme_name ||
  firstScheme?.schemeName ||
  firstScheme?.name ||
  "National Disaster Relief Fund";



  return (
    <div className="min-h-screen bg-[#0B0B12] text-white font-inter antialiased">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-6 z-50 px-5 py-4 rounded-2xl border shadow-2xl text-xs font-semibold flex items-start gap-3 max-w-sm ${
              toast.type === "success"
                ? "bg-[#11131A] border-[#22C55E]/30 text-white"
                : "bg-[#11131A] border-[#F59E0B]/30 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
            )}
            <div className="flex flex-col gap-1">
              <span className="font-[#A5A8B5] whitespace-pre-line leading-relaxed">{toast.msg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                onSelectScheme={(sch) => setSelectedSchemeState(sch)}
              />
            )}
            {currentStep === 6 && (
              <Step6Eligibility
                eligibility={eligibilityData}
                analysis={analysisData}
                matchedScheme={selectedSchemeState || firstScheme}
                onNext={handleDocuments}
              />
            )}

            {currentStep === 7 && (
              <Step7Documents
                documents={documents}
                disasterType={selectedDisaster}
                scheme={selectedSchemeState || firstScheme}
                schemeName={selectedScheme}
                onNext={handleTimeline}
              />
            )}
            {currentStep === 8 && (
              <Step8ClaimTimeline
                timeline={timelineData}
                officer={officerData}
                reportId={reportId}
                onNext={handleNearbyHelp}
              />
            )}
            {currentStep === 9 && (
              <Step9NearbyHelp
                services={nearbyHelpData}
                selectedDisaster={selectedDisaster}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Navigation */}
        {currentStep < 4 && currentStep !== 3 && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={goPrev}
              className="px-5 py-2.5 rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[#171923] hover:bg-[#202330] text-xs font-bold text-[#A5A8B5] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>

            <button
              onClick={goNext}
              className="px-6 py-2.5 rounded-[14px] bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0B12] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_4px_20px_rgba(244,201,93,0.15)]"
            >
              <span>Continue to Step {currentStep + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}


        {/* Step 9 Final Section: Application Summary + Submit CTA (Before submission) OR Success Screen (After submission) */}
        {currentStep === 9 && (
          <div className="space-y-6 font-inter">
            {!isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[24px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] p-6 sm:p-8 space-y-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[rgba(255,255,255,0.08)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[14px] bg-[#F4C95D]/10 border border-[#F4C95D]/30 flex items-center justify-center text-[#F4C95D] shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white font-poppins">Application Summary</h3>
                      <p className="text-xs text-[#A5A8B5] font-inter mt-0.5">
                        Review your disaster relief application summary before final government submission.
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#F4C95D]/10 border border-[#F4C95D]/20 text-[#F4C95D] text-[10px] font-bold uppercase tracking-wider font-poppins">
                    Status: Pending Submission
                  </div>
                </div>

                {/* Grid of 9 Required Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* 1. Report ID */}
                  <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
                    <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                      Report ID
                    </p>
                    <p className="text-sm font-bold text-[#F4C95D] font-mono">
                      {reportId || "REP-789234"}
                    </p>
                  </div>

                  {/* 2. Disaster Type */}
                  <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
                    <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                      Disaster Type
                    </p>
                    <p className="text-sm font-bold text-white font-poppins">
                      {selectedDisaster || "Flood"}
                    </p>
                  </div>

                  {/* 3. Selected Government Scheme */}
                  <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
                    <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                      Selected Government Scheme
                    </p>
                    <p className="text-sm font-bold text-white font-poppins truncate">
                      {selectedScheme}
                    </p>
                  </div>

                  {/* 4. Relief Amount */}
                  <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
                    <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                      Relief Amount
                    </p>
                    <p className="text-base font-bold text-[#22C55E] font-space-grotesk">
                      {reliefAmount}
                    </p>
                  </div>

                  {/* 5. Eligibility Status */}
                  <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
                    <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                      Eligibility Status
                    </p>
                    <p className="text-sm font-bold text-[#22C55E] font-poppins flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                      {eligibilityData?.is_eligible !== false ? "Verified Eligible" : "Pending Verification"}
                    </p>
                  </div>

                  {/* 6. AI Damage % */}
                  <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
                    <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                      AI Damage %
                    </p>
                    <p className="text-base font-bold text-white font-space-grotesk">
                      {typeof damagePercent === "number" ? `${damagePercent}%` : damagePercent}%
                    </p>
                  </div>

                  {/* 7. Assigned Officer */}
                  <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
                    <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                      Assigned Officer
                    </p>
                    <p className="text-sm font-bold text-white font-poppins truncate">
                      {officerName}
                    </p>
                  </div>

                  {/* 8. Inspection Date & Time */}
                  <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
                    <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                      Inspection Date & Time
                    </p>
                    <p className="text-xs font-bold text-white font-poppins">
                      {inspectionDate} ({inspectionTime})
                    </p>
                  </div>

                  {/* 9. Current Application Status */}
                  <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
                    <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                      Current Application Status
                    </p>
                    <p className="text-xs font-bold text-[#F4C95D] font-poppins">
                      Pending Submission
                    </p>
                  </div>
                </div>

                {/* Email Confirmation Notice */}
                <div className="p-4 rounded-[14px] bg-[#171923] border border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-3 text-xs text-[#A5A8B5]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#F4C95D] shrink-0" />
                    <span>Confirmation email will be sent to:</span>
                  </div>
                  <span className="font-bold text-white font-mono bg-[#0B0B12] px-2.5 py-1 rounded-[8px] border border-[rgba(255,255,255,0.06)] truncate max-w-[200px] sm:max-w-none">
                    {userEmail}
                  </span>
                </div>

                {/* Primary CTA Button (Standard CivicSync primary button size) */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSubmitApplication}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 rounded-[14px] bg-[#F4C95D] hover:bg-[#FFD978] disabled:opacity-75 disabled:cursor-not-allowed text-[#0B0B12] font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(244,201,93,0.2)] cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Disaster Relief Application</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Success Screen (Appears only after successful submission) */
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[24px] bg-[#11131A] border border-[#F4C95D]/30 overflow-hidden relative shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
              >
                {/* Gold radial glow */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#F4C95D]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 p-6 sm:p-8 space-y-6 font-inter">
                  {/* Top: Badge + Title */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-5 border-b border-[rgba(255,255,255,0.08)]">
                    <div className="w-14 h-14 rounded-[18px] bg-[#F4C95D]/10 border border-[#F4C95D]/30 flex items-center justify-center text-2xl shrink-0 shadow-[0_0_15px_rgba(244,201,93,0.2)]">
                      🎉
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-[9px] font-extrabold uppercase tracking-widest mb-2 font-poppins">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                        APPLICATION SUBMITTED & AI VERIFIED
                      </div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white font-poppins leading-tight">
                        Disaster Relief Case Summary
                      </h3>
                      <p className="text-xs text-[#A5A8B5] font-inter mt-1 max-w-xl">
                        {`Your disaster relief claim is registered under Case ID ${reportId || "REP-ACTIVE"}. AI assessment results and government scheme matching are locked for officer verification.`}
                      </p>

                      {/* Real Backend Notification Response Banner */}
                      {emailNotice ? (
                        <div
                          className={`mt-3 inline-flex items-start gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold font-inter border ${
                            emailNotice.emailSent !== false
                              ? "bg-[#22C55E]/10 border-[#22C55E]/25 text-[#22C55E]"
                              : "bg-[#F59E0B]/10 border-[#F59E0B]/25 text-[#F59E0B]"
                          }`}
                        >
                          {emailNotice.emailSent !== false ? (
                            <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-[#22C55E] mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-[#F59E0B] mt-0.5" />
                          )}
                          <span className="whitespace-pre-line leading-relaxed">
                            {emailNotice.emailSent !== false
                              ? `✅ Application Submitted Successfully\n\nA confirmation email has been sent to your registered email address.`
                              : `Application submitted successfully, but the confirmation email could not be sent.`}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-3 inline-flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-xs font-semibold">
                          <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                          <span className="whitespace-pre-line leading-relaxed">✅ Application Submitted Successfully\n\nA confirmation email has been sent to your registered email address.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 7 Key Summary Metrics (Dynamic Props/State) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-poppins">
                        Claim Summary & Inspection Details
                      </h4>
                      <span className="text-[10px] text-[#F4C95D] font-mono font-bold">
                        Case #{reportId || "ACTIVE"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* 1. Matched Scheme */}
                      <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)] col-span-2">
                        <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                          Matched Scheme
                        </p>
                        <p className="text-sm font-bold text-[#F4C95D] font-poppins truncate">
                          {selectedScheme}
                        </p>
                      </div>

                      {/* 2. Estimated Benefit */}
                      <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
                        <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                          Estimated Benefit
                        </p>
                        <p className="text-lg font-bold text-white font-space-grotesk">
                          {reliefAmount}
                        </p>
                      </div>

                      {/* 3. Priority */}
                      <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
                        <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                          Priority Level
                        </p>
                        <p className="text-lg font-bold text-red-400 font-space-grotesk">
                          {severity}
                        </p>
                      </div>

                      {/* 4. Assigned Officer */}
                      <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)] col-span-2 sm:col-span-1">
                        <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                          Assigned Officer
                        </p>
                        <p className="text-sm font-bold text-white font-poppins truncate">
                          {officerName}
                        </p>
                      </div>

                      {/* 5. Inspection Date */}
                      <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
                        <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                          Inspection Date
                        </p>
                        <p className="text-sm font-bold text-white font-space-grotesk">
                          {inspectionDate}
                        </p>
                      </div>

                      {/* 6. Inspection Time */}
                      <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
                        <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                          Inspection Time
                        </p>
                        <p className="text-xs font-bold text-[#F4C95D] font-mono truncate">
                          {inspectionTime}
                        </p>
                      </div>

                      {/* 7. AI Confidence */}
                      <div className="p-4 rounded-[16px] bg-[#0B0B12] border border-[rgba(255,255,255,0.06)]">
                        <p className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider font-poppins mb-1">
                          AI Confidence
                        </p>
                        <p className="text-lg font-bold text-[#22C55E] font-space-grotesk">
                          {typeof aiConfidence === "number" ? `${aiConfidence}%` : aiConfidence}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Achievements checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {[
                      "Disaster type identified & AI model loaded",
                      "Evidence photos uploaded & geo-verified",
                      `Structural damage assessed at ${damagePercent}% (${severity})`,
                      `${matchedSchemes} government schemes matched`,
                      eligibilityData?.is_eligible
                        ? "Eligibility successfully verified"
                        : "Eligibility pending verification",
                      `${officerName} assigned for physical audit`,
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
                        Be present at your property between <span className="text-white font-semibold">{inspectionTime}</span> for physical inspection by {officerName}. Carry your Aadhaar card and land ownership documents. 
                      </p>
                      <p className="text-[10px] text-[#F4C95D] mt-1 font-inter">{officerNote}</p>
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
                      onClick={() => {
                        downloadCaseSummaryPDF({
                          reportId: reportId || "REP-789234",
                          disasterType: selectedDisaster || "Disaster Relief Claim",
                          location: "Disaster Relief Zone (Punjab Sector)",
                          submissionDate: new Date().toLocaleDateString("en-GB"),
                          submissionTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                          uploadedFiles: uploadedFiles || [],
                          analysis: analysisData || {},
                          schemes: governmentSchemes || [],
                          scheme: firstScheme || {},
                          eligibility: eligibilityData || {},
                          documents: documents || [],
                          officer: activeOfficer || {},
                          timeline: timelineData || [],
                          nearbyHelp: nearbyHelpData || [],
                        });
                      }}
                      className="w-full sm:w-auto px-6 py-3 rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[#171923] hover:bg-[#202330] text-xs font-bold text-[#A5A8B5] hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      Download Case Summary
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>

      {/* Floating AI Chat */}
      {/* <FloatingAIChat /> */}
    </div>
  );
}
