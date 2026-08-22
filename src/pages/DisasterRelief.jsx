import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronLeft, ChevronRight, ChevronDown, FileText, Mail, Send, Loader2, CheckCircle2, AlertCircle, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Sidebar from "../components/shared/Sidebar";

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
import { downloadCaseSummaryPDF } from "../utils/generatePdf";

// import {
//   mockDamageData,
//   mockGalleryImages,
//   mockSchemes,
// } from "../components/DisasterRelief/reliefMockData";

import {
  checkBackend,
  createReport,
  getReportStatus,
  checkEligibility,
  saveDocuments,
  getDocuments,
  saveTimeline,
  getTimeline,
  saveNearbyHelp,
  getNearbyHelp,
  getSchemes,
  submitReport,
  getRAGSchemes,
  getRAGEligibility,
  getRAGDocuments,
  getRAGTimeline,
} from "../services/api";

import { getAssignedOfficer, getDynamicInspectionSlot } from "../utils/disasterHelpers";


const STEP_LABELS = [
  "Select Disaster",
  "Upload Evidence",
  "AI Analysis",
  "Damage Report",
  "Government Schemes",
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
  const [uploadedFiles, setUploadedFiles]   = useState([]);
  const [evidenceResult, setEvidenceResult] = useState(null);  // validated evidence from Step 2
  const [reportId, setReportId] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [eligibilityData, setEligibilityData] = useState({});
  const [documents, setDocuments] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [officerData, setOfficerData] = useState(null);
  const [nearbyHelpData, setNearbyHelpData] = useState([]);
  const [governmentSchemes, setGovernmentSchemes] = useState([]);
  const [appliedSchemes, setAppliedSchemes] = useState([]); // multi-select array (user can apply to multiple schemes)
  const [docSummary, setDocSummary] = useState([]); // lifted from Step 7 for Step 8 consumption
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailNotice, setEmailNotice] = useState(null);
  const [toast, setToast] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // RAG state — Disaster Relief specific (Steps 5–8)
  const [ragSchemes, setRagSchemes] = useState(null);
  const [ragEligibility, setRagEligibility] = useState({});
  const [ragDocuments, setRagDocuments] = useState(null);
  const [ragTimeline, setRagTimeline] = useState(null);
  const [ragLoading, setRagLoading] = useState({});

  // ── sessionStorage keys ────────────────────────────────────────────────
  const SESSION_KEY_REPORT   = "dr_report_id";
  const SESSION_KEY_DISASTER = "dr_disaster_type";
  const SESSION_KEY_STEP     = "dr_current_step";

  // ── Persist workflow identifiers to sessionStorage on every change ─────
  // (Raw File objects cannot be serialised — only metadata from backend is restored)
  useEffect(() => {
    if (reportId)         sessionStorage.setItem(SESSION_KEY_REPORT,   reportId);
  }, [reportId]);

  useEffect(() => {
    if (selectedDisaster) sessionStorage.setItem(SESSION_KEY_DISASTER, selectedDisaster);
  }, [selectedDisaster]);

  useEffect(() => {
    if (currentStep > 1)  sessionStorage.setItem(SESSION_KEY_STEP, String(currentStep));
  }, [currentStep]);

  // ── Restore workflow state from backend on mount ───────────────────────
  // This runs once. If a reportId exists in sessionStorage we call /status
  // and rebuild analysisData + evidenceResult from Firestore — no re-upload needed.
  useEffect(() => {
    const savedId       = sessionStorage.getItem(SESSION_KEY_REPORT);
    const savedDisaster = sessionStorage.getItem(SESSION_KEY_DISASTER);
    const savedStep     = parseInt(sessionStorage.getItem(SESSION_KEY_STEP) || "1", 10);

    if (!savedId) return; // fresh session — nothing to restore

    async function restoreWorkflow() {
      try {
        const status = await getReportStatus(savedId);
        if (!status?.success) return;

        // Restore base identifiers
        setReportId(savedId);
        if (savedDisaster) setSelectedDisaster(savedDisaster);

        // Restore analysis if it was already completed
        if (status.analysis?.damage_percent != null) {
          setAnalysisData(status.analysis);
        }

        // Rebuild evidenceResult summary from persisted validations (no files — metadata only)
        const validations = status.evidence_validations || [];
        const accepted = validations.filter((v) => v.valid && v.relevant);
        if (accepted.length > 0) {
          const merged = accepted.reduce(
            (acc, v) => ({
              ...acc,
              detected_objects: [...new Set([...acc.detected_objects, ...(v.detected_objects || [])])],
              evidence:         [...new Set([...acc.evidence,         ...(v.evidence         || [])])],
              possible_damage:  [...new Set([...acc.possible_damage,  ...(v.possible_damage  || [])])],
              confidence:       Math.max(acc.confidence, v.confidence || 0),
              file_type:        acc.file_type || v.file_type || "unknown",
              summary:          acc.summary   || v.summary   || "",
              disaster:         savedDisaster || "flood",
            }),
            { detected_objects: [], evidence: [], possible_damage: [], confidence: 0, file_type: "", summary: "", disaster: savedDisaster }
          );
          setEvidenceResult(merged);

          // Reconstruct uploadedFiles display list from metadata (no originalFile — cannot re-upload)
          const restoredFiles = validations.map((v) => ({
            id:               v.filename + "_restored",
            name:             v.filename || "Evidence file",
            originalFile:     null,  // File object not available after reload
            size:             "Stored",
            type:             v.file_type === "image" ? "image/jpeg" : (v.file_type === "pdf" ? "application/pdf" : ""),
            category:         "Restored",
            preview:          null,
            isImg:            v.file_type === "image",
            isVid:            v.file_type === "video",
            validationStatus: v.valid && v.relevant ? "accepted" : "rejected",
            validationResult: {
              valid:            v.valid,
              relevant:         v.relevant,
              confidence:       v.confidence,
              file_type:        v.file_type,
              detected_objects: v.detected_objects,
              evidence:         v.evidence,
              possible_damage:  v.possible_damage,
              summary:          v.summary,
              reject_reason:    v.reject_reason,
              restored:         true,  // flag so UI knows this is a restored entry
            },
          }));
          setUploadedFiles(restoredFiles);
        }

        // Restore step — but cap at the last confirmed completed step from backend
        const backendStep  = status.completed_step || 1;
        const targetStep   = Math.max(1, Math.min(savedStep, backendStep + 1));
        setCurrentStep(targetStep);
      } catch (err) {
        // Restoration failed (e.g. backend down) — start fresh, don't crash
        console.warn("[DisasterRelief] Could not restore workflow:", err?.message);
      }
    }

    restoreWorkflow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Disable background scrolling while drawer is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileSidebarOpen]);

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
    if (!userEmail || !userEmail.includes("@")) {
      setToast({
        type: "warning",
        msg: "Email address not available. Please update your profile."
      });
      setTimeout(() => setToast(null), 6000);
      return;
    }

    setIsSubmitting(true);
    try {
      const schemeId = selectedSchemeState?.id || selectedSchemeState?.scheme_id || firstScheme?.id || firstScheme?.scheme_id;
      const isEligible = eligibilityData[schemeId]?.is_eligible !== false;
      const eligStatus = isEligible ? "Verified Eligible" : "Pending Verification";

      const selScheme =
        selectedSchemeState?.official_name ||
        selectedSchemeState?.schemeName ||
        selectedSchemeState?.name ||
        eligibilityData?.scheme_name ||
        governmentSchemes?.[0]?.schemeName ||
        governmentSchemes?.[0]?.name ||
        "National Disaster Relief Fund";
      const relAmt =
        selectedSchemeState?.reliefAmount ||
        selectedSchemeState?.relief_amount ||
        selectedSchemeState?.benefit ||
        governmentSchemes?.[0]?.reliefAmount ||
        "Not Available";
      
      const subDate = new Date().toLocaleDateString("en-GB");
      const subTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      // Step 1 & 2 & 3: Save application & send email on backend
      const response = await submitReport(reportId || "REP-789234", {
        email: userEmail,
        user_name: userName,
        disaster_type: selectedDisaster || "Disaster Relief Claim",
        scheme_name: selScheme,
        relief_amount: relAmt,
        submission_date: subDate,
        submission_time: subTime,
        eligibility_status: eligStatus,
        application_status: "Submitted & AI Verified",
        next_step: "Be present at your property for physical inspection by the assigned officer.",
        applied_scheme_ids: appliedSchemes.map((s) => s.id || s.scheme_id).filter(Boolean),
      });

      // Update officerData with actual assigned officer from backend
      if (response?.success && response?.data) {
        const rdata = response.data;
        if (rdata.officer_name) {
          setOfficerData({
            name: rdata.officer_name,
            role: rdata.officer_role || "District Emergency Coordinator",
            designation: rdata.officer_role || "District Emergency Coordinator",
            department: rdata.officer_department || "Department of Civil Defense & Relief",
            phone: rdata.officer_phone || "+91 90000 90123",
            inspectionDate: rdata.inspection_date,
            inspectionTime: rdata.inspection_time,
            note: rdata.officer_note || "",
            remarks: rdata.officer_note || "",
          });
        }
      }

      // Step 4: Capture real email delivery response from backend
      const isEmailDelivered = response?.email_sent === true;
      setEmailNotice({
        emailSent: isEmailDelivered,
        email: userEmail,
        message: response?.message || (
          isEmailDelivered
            ? `✅ Application Submitted Successfully\n\nA confirmation email has been sent to your registered email address.`
            : `Application submitted successfully, but the confirmation email could not be sent. Please verify your email address.`
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
          msg: "Application submitted successfully, but confirmation email could not be sent. Please verify your email address."
        });
      }
      setTimeout(() => setToast(null), 6000);

      // Step 5: Navigate to Success Screen (Do NOT download PDF automatically)
      setIsSubmitted(true);
      clearWorkflowSession();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


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

    // Map global eligibility result per scheme ID
    const newEligibilityMap = {};
    appliedSchemes.forEach(sch => {
      newEligibilityMap[sch.id] = result.eligibility || {};
    });
    setEligibilityData(newEligibilityMap);

    // Fetch RAG eligibility in background — non-blocking
    setRagLoading(prev => ({ ...prev, eligibility: true }));
    getRAGEligibility(
      selectedDisaster,
      analysisData?.damage_percent || 50,
      analysisData?.severity || "Moderate",
      appliedSchemes
    ).then(ragData => {
      const newRagMap = {};
      appliedSchemes.forEach(sch => {
        newRagMap[sch.id] = ragData;
      });
      setRagEligibility(newRagMap);
      setRagLoading(prev => ({ ...prev, eligibility: false }));
    }).catch(() => {
      setRagLoading(prev => ({ ...prev, eligibility: false }));
    });

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

    // Fetch RAG documents in background — non-blocking
    setRagLoading(prev => ({ ...prev, documents: true }));
    getRAGDocuments(
      selectedDisaster,
      analysisData?.damage_percent || 50,
      analysisData?.severity || "Moderate",
      appliedSchemes
    ).then(ragData => {
      setRagDocuments(ragData);
      setRagLoading(prev => ({ ...prev, documents: false }));
    }).catch(() => {
      setRagLoading(prev => ({ ...prev, documents: false }));
    });

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

      const officer = result.officer || null;

      setTimelineData(result.timeline);
      setOfficerData(officer);

      // Fetch RAG timeline in background — non-blocking
      setRagLoading(prev => ({ ...prev, timeline: true }));
      getRAGTimeline(
        selectedDisaster,
        analysisData?.damage_percent || 50,
        analysisData?.severity || "Moderate"
      ).then(ragData => {
        setRagTimeline(ragData);
        setRagLoading(prev => ({ ...prev, timeline: false }));
      }).catch(() => {
        setRagLoading(prev => ({ ...prev, timeline: false }));
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
  try {
    // Allow proceeding even without damage_percent if user is on restored session
    const damagePercent = analysisData?.damage_percent ?? 50;
    const severity      = analysisData?.severity       ?? "Moderate";

    if (!selectedDisaster) {
      console.warn("[DisasterRelief] No disaster type — cannot proceed to Step 5.");
      return;
    }

    // Start RAG loading state immediately
    setRagLoading(prev => ({ ...prev, schemes: true }));

    // Navigate to Step 5 immediately — RAG data arrives in background
    goNext();

    // Fire legacy API (non-blocking, 5s timeout) — don't await
    getSchemes(selectedDisaster, damagePercent, null)
      .then(legacyResult => {
        if (legacyResult && legacyResult.length > 0) {
          setGovernmentSchemes(legacyResult);
        }
      })
      .catch(() => {});

    // Primary: RAG is authoritative source for Step 5 schemes
    getRAGSchemes(selectedDisaster, damagePercent, severity)
      .then(ragData => {
        setRagSchemes(ragData);
        setRagLoading(prev => ({ ...prev, schemes: false }));
        // Auto-select the first verified scheme as the default for Step 6
        if (ragData?.rag_available && ragData.data) {
          const d = ragData.data;
          const schemesArr = Array.isArray(d) ? d : (Array.isArray(d.schemes) ? d.schemes : []);
          if (schemesArr.length > 0) {
            setAppliedSchemes(prev => {
              if (prev.length > 0) return prev; // preserve existing selection
              const first = schemesArr[0];
              return [{
                scheme_id: first.scheme_id || first.id || "rag-0",
                id: first.id || first.scheme_id || "rag-0",
                official_name: first.name || first.official_name || first.scheme_name || "",
                name: first.name || first.official_name || first.scheme_name || "",
                schemeName: first.name || first.official_name || first.scheme_name || "",
                disasterType: first.applicable_disaster || first.disaster_type || selectedDisaster || "",
                eligibility: first.eligibility_summary || "",
                benefit: first.benefit_amount || first.relief_amount || "",
                reliefAmount: first.relief_amount || first.benefit_amount || "",
                required_documents: first.required_documents || [],
                requiredDocuments: first.required_documents || [],
                benefits: first.benefits || [],
                authority: first.source_authority || first.authority || "",
                department: first.source_authority || first.authority || "",
                official_source_url: first.official_source_url || first.source_url || "",
                source_url: first.official_source_url || first.source_url || "",
                document_name: first.document_name || "",
              verified: first.verified !== false,
              source_authority: first.source_authority || first.authority || "",
            }];
          });
        }
      }
    }).catch((err) => {
      console.warn("[DisasterRAG] RAG schemes fetch failed:", err?.message);
      setRagLoading(prev => ({ ...prev, schemes: false }));
    });

  } catch (err) {
    console.error("[DisasterRelief] handleGovernmentSchemes error:", err);
  }
}



  const jumpTo = (step) => {
    if (step < currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  // ── AI service status (shown in Step 2 header) ────────────────────────
  const [aiStatus, setAiStatus] = useState("unknown"); // "online"|"warming_up"|"offline"|"unknown"

  useEffect(() => {
    checkBackend()
      .then((data) => setAiStatus(data?.ai_status || (data?.status === "healthy" ? "warming_up" : "offline")))
      .catch(() => setAiStatus("offline"));
  }, []);

  // ── Clear session when user explicitly starts a new report ─────────────
  const clearWorkflowSession = () => {
    sessionStorage.removeItem(SESSION_KEY_REPORT);
    sessionStorage.removeItem(SESSION_KEY_DISASTER);
    sessionStorage.removeItem(SESSION_KEY_STEP);
  };
  const creatingReportRef = useRef(false);

  const handleCreateReport = async () => {
    if (!selectedDisaster) {
      alert("Please select a disaster type.");
      return;
    }
    // Idempotency: if a reportId already exists this session, just advance
    if (reportId) {
      goNext();
      return;
    }
    // Prevent concurrent creation (StrictMode / double-click)
    if (creatingReportRef.current) return;
    creatingReportRef.current = true;

    try {
      const response = await createReport({
        disaster_type: selectedDisaster,
        location: "Location will come later",
        description: "Created from Step 1",
      });

      setReportId(response.report_id);
      goNext();
    } catch (error) {
      console.error(error);
      alert("Failed to create report.");
    } finally {
      creatingReportRef.current = false;
    }
  };


const firstScheme = governmentSchemes?.[0];

// Derive list of actually applicable schemes based on Step 6 evaluation
const uniqueApplicableSchemes = Array.from(
  new Map(
    appliedSchemes
      .filter((scheme) => {
        const schemeId = scheme.id || scheme.scheme_id;
        const local = eligibilityData[schemeId] || {};
        const rag = ragEligibility[schemeId] || {};

        const dmg =
          typeof analysisData?.damage_percent === "number"
            ? analysisData.damage_percent
            : parseInt(analysisData?.damage_percent || "0", 10);
        const minDmg =
          typeof scheme?.minDamage === "number"
            ? scheme.minDamage
            : typeof scheme?.min_damage === "number"
            ? scheme.min_damage
            : 0;
        if (dmg > 0 && minDmg > 0 && dmg < minDmg) {
          return false;
        }

        const localStatus = (local.status || "").toLowerCase();
        if (localStatus.includes("not") && localStatus.includes("eligible")) return false;
        if (localStatus.includes("reject")) return false;
        if (local.is_eligible === false) return false;

        const ragResult = rag.data || {};
        const ragStatus = (ragResult.status || "").toLowerCase();
        if (ragStatus.includes("not") && ragStatus.includes("eligible")) return false;
        if (ragStatus.includes("reject")) return false;
        if (ragResult.is_eligible === false) return false;

        return true;
      })
      .map((s) => [s.id || s.scheme_id, s])
  ).values()
);

// Derive a single "primary" scheme alias from the first APPLICABLE scheme
// — used by Step 9 summary, PDF download, and submit handler (single-scheme compat)
const selectedSchemeState = uniqueApplicableSchemes[0] || null;

const reliefAmount =
  selectedSchemeState?.reliefAmount ||
  selectedSchemeState?.relief_amount ||
  selectedSchemeState?.benefit ||
  firstScheme?.reliefAmount ||
  "Not Available";

const matchedSchemes = governmentSchemes?.length || 0;

const aiConfidence = analysisData?.ai_confidence || "--";

const severity = analysisData?.severity || "--";

const damagePercent = analysisData?.damage_percent || "--";

const activeOfficer = officerData || null;
const officerName = activeOfficer?.name || "Officer not assigned yet";
const inspectionDate = activeOfficer?.inspectionDate || "Inspection not scheduled yet";
const inspectionTime = activeOfficer?.inspectionTime || "";
const officerNote = activeOfficer?.note || activeOfficer?.remarks || "";

const selectedScheme =
  selectedSchemeState?.official_name ||
  selectedSchemeState?.schemeName ||
  selectedSchemeState?.name ||
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

          {/* Logo — always left */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <Building2 className="w-5 h-5 text-[#F4C95D]" />
            <span className="text-sm font-bold tracking-tight">CivicSync</span>
          </Link>

          {/* Step label pill — desktop only */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#11131A]">
            <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider">
              Step {currentStep} of {STEP_LABELS.length}
            </span>
            <span className="text-[9px] font-bold text-[#F4C95D] font-poppins">
              {STEP_LABELS[currentStep - 1]}
            </span>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Back + Exit — desktop only */}
            {currentStep > 1 && (
              <button
                onClick={goPrev}
                className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#11131A] hover:bg-[#171923] text-xs font-bold text-[#A5A8B5] transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <Link
              to="/"
              className="hidden lg:block px-3 py-1.5 rounded-[10px] text-xs font-bold text-[#A5A8B5] hover:text-white transition-colors"
            >
              Exit
            </Link>

            {/* Hamburger — mobile/tablet only */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#A5A8B5] hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F4C95D]"
              aria-label="Open navigation menu"
              aria-expanded={mobileSidebarOpen}
              aria-controls="disaster-relief-sidebar-drawer"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ── Mobile sub-header: step info + back/exit ── */}
        <div className="lg:hidden border-t border-[rgba(255,255,255,0.06)] bg-[#0B0B12]/95 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[#A5A8B5] font-bold uppercase tracking-wider">
              Step {currentStep} of {STEP_LABELS.length}
            </span>
            <span className="text-[9px] text-[rgba(255,255,255,0.2)]">·</span>
            <span className="text-[9px] font-bold text-[#F4C95D]">
              {STEP_LABELS[currentStep - 1]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                onClick={goPrev}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] border border-[rgba(255,255,255,0.08)] bg-[#11131A] hover:bg-[#171923] text-[10px] font-bold text-[#A5A8B5] transition-all"
              >
                <ChevronLeft className="w-3 h-3" />
                Back
              </button>
            )}
            <Link
              to="/"
              className="px-2.5 py-1 rounded-[8px] text-[10px] font-bold text-[#A5A8B5] hover:text-white transition-colors"
            >
              Exit
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Mobile/Tablet Sidebar Drawer ────────────────────────── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Semi-transparent backdrop — above all page content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ zIndex: 9998 }}
              className="fixed inset-0 bg-black/70 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-in Sidebar Drawer — highest z-index, always above page */}
            <motion.div
              id="disaster-relief-sidebar-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation Menu"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              style={{ zIndex: 9999 }}
              className="fixed inset-y-0 left-0 w-64 bg-[#0d0f14] shadow-2xl border-r border-[rgba(255,255,255,0.08)] lg:hidden flex flex-col"
            >
              {/* Drawer header with close button */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.08)] bg-[#0d0f14] shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#F4C95D]">
                  Navigation
                </span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-[#A5A8B5] hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F4C95D]"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Reused Sidebar content — isDrawerOnly avoids re-rendering the top bar */}
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  mobileOpen={true}
                  setMobileOpen={setMobileSidebarOpen}
                  isDrawerOnly={true}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ────────────────────────────────────────── */}
      {/* Mobile: navbar 64px + sub-header ~44px = ~108px → pt-[6.75rem]; desktop: pt-28 */}
      <main className="pt-[6.75rem] lg:pt-28 pb-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">

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
                disasterType={selectedDisaster}
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
                aiStatus={aiStatus}
                onNext={(evResult) => {
                  setEvidenceResult(evResult);
                  goNext();
                }}
              />
            )}
            {currentStep === 3 && (
              <Step3AIAnalysis
                reportId={reportId}
                selectedDisaster={selectedDisaster}
                evidenceResult={evidenceResult}
                setAnalysisData={setAnalysisData}
                onComplete={goNext}
              />
            )}
            {currentStep === 4 && (
              <Step4DamageReport
                data={analysisData}
                disasterType={selectedDisaster}
                images={[]}
                onNext={handleGovernmentSchemes}
              />
            )}
            {currentStep === 5 && (
              <Step5GovernmentSchemes
                schemes={governmentSchemes}
                onNext={handleEligibility}
                onSelectScheme={(sch) => {
                  setAppliedSchemes((prev) => {
                    const id = sch.id || sch.scheme_id;
                    const already = prev.some((s) => (s.id || s.scheme_id) === id);
                    if (already) return prev.filter((s) => (s.id || s.scheme_id) !== id);
                    return [...prev, sch];
                  });
                }}
                appliedSchemes={appliedSchemes}
                selectedScheme={selectedSchemeState}
                ragData={ragSchemes}
                ragLoading={ragLoading.schemes}
                disasterType={selectedDisaster}
              />
            )}
            {currentStep === 6 && (
              <Step6Eligibility
                eligibility={eligibilityData}
                analysis={analysisData}
                appliedSchemes={appliedSchemes}
                matchedScheme={selectedSchemeState || firstScheme}
                onNext={handleDocuments}
                onBack={() => setCurrentStep(5)}
                ragData={ragEligibility}
                ragLoading={ragLoading.eligibility}
              />
            )}

            {currentStep === 7 && (
              <Step7Documents
                documents={documents}
                disasterType={selectedDisaster}
                applicableSchemes={uniqueApplicableSchemes}
                scheme={selectedSchemeState || firstScheme}
                schemeName={selectedScheme}
                onNext={handleTimeline}
                onDocumentsUpdate={setDocSummary}
                ragData={ragDocuments}
                ragLoading={ragLoading.documents}
              />
            )}
            {currentStep === 8 && (
              <Step8ClaimTimeline
                timeline={timelineData}
                officer={activeOfficer}
                reportId={reportId}
                selectedScheme={selectedScheme}
                selectedDisaster={selectedDisaster}
                docList={docSummary}
                onNext={handleNearbyHelp}
                ragData={ragTimeline}
                ragLoading={ragLoading.timeline}
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
                          officer: officerData || {
                            name: "Not assigned yet",
                            role: "Not assigned yet",
                            designation: "Not assigned yet",
                            department: "",
                            phone: "",
                            inspectionDate: "Not scheduled yet",
                            inspectionTime: ""
                          },
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
      <FloatingAIChat />
    </div>
  );
}
