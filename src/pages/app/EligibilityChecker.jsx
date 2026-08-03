import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare, Loader2, CheckCircle2, AlertCircle, XCircle,
  ChevronDown, User, IndianRupee, MapPin, Briefcase,
  BookOpen, Users, Shield, Activity, Lightbulb, FileText,
  ArrowRight,
} from "lucide-react";
import { checkEligibility } from "../../services/schemeService";
import clsx from "clsx";

// ─── Form Field Definitions ────────────────────────────────────────────────────

const GENDERS = ["Male", "Female", "Transgender", "Prefer not to say"];
const STATES = [
  "All India", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
];
const OCCUPATIONS = [
  "Farmer", "Student", "Government Employee", "Private Employee",
  "Self Employed", "Entrepreneur", "Daily Wage Worker", "Homemaker",
  "Artisan", "Street Vendor", "Unorganized Worker", "Unemployed", "Other",
];
const EDUCATIONS = [
  "No Formal Education", "Primary (1–5)", "Middle School (6–8)",
  "High School (9–10)", "Higher Secondary (11–12)", "Graduate",
  "Post Graduate", "Doctorate", "Professional Degree",
];
const CATEGORIES = ["General", "SC", "ST", "OBC", "EWS", "Minority"];

// ─── Score Gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score }) {
  const angle = (score / 100) * 180;
  const color = score >= 80 ? "#4ade80" : score >= 50 ? "#fb923c" : "#f87171";

  return (
    <div className="flex flex-col items-center py-4">
      <svg viewBox="0 0 200 110" className="w-48 h-28">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#1e222e"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${(angle / 180) * 251.3} 251.3`}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        {/* Score number */}
        <text x="100" y="90" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">
          {score}%
        </text>
        <text x="100" y="108" textAnchor="middle" fill="#6b7280" fontSize="10">
          MATCH SCORE
        </text>
      </svg>
    </div>
  );
}

// ─── Verdict Badge ─────────────────────────────────────────────────────────────

function VerdictBadge({ verdict }) {
  const config = {
    Eligible: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10 border-success/30", label: "Eligible" },
    "Maybe Eligible": { icon: AlertCircle, color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30", label: "Maybe Eligible" },
    "Not Eligible": { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "Not Eligible" },
  };
  const cfg = config[verdict] || config["Not Eligible"];
  const Icon = cfg.icon;

  return (
    <div className={clsx("inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border font-bold text-lg", cfg.bg, cfg.color)}>
      <Icon className="w-6 h-6" />
      {cfg.label}
    </div>
  );
}

// ─── Field Wrapper ─────────────────────────────────────────────────────────────

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="text-xs text-textSecondary uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full bg-[#12141d] border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-accent transition-colors";
const selectClass = `${inputClass} appearance-none`;

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function EligibilityChecker() {
  const [form, setForm] = useState({
    age: "",
    income: "",
    gender: "",
    state: "",
    occupation: "",
    education: "",
    category: "",
    disability: false,
  });
  const [loading, setLoading]   = useState(false);
  const [result,  setResult]    = useState(null);
  const [error,   setError]     = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = {
        age:        form.age        ? Number(form.age) : undefined,
        income:     form.income     ? Number(form.income) : undefined,
        gender:     form.gender     || undefined,
        state:      form.state      || undefined,
        occupation: form.occupation || undefined,
        education:  form.education  || undefined,
        category:   form.category   || undefined,
        disability: form.disability,
      };
      const res = await checkEligibility(payload);
      setResult(res);
    } catch (err) {
      console.error("[EligibilityChecker] error:", err);
      setError(err.response?.data?.message || "Failed to check eligibility. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <CheckSquare className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Eligibility Checker</h1>
          <p className="text-sm text-textSecondary">Enter your details to find matching government schemes and check eligibility.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── Form ─────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-[#171a21] border border-border h-fit"
        >
          <h2 className="text-base font-bold text-white mb-5">Your Details</h2>
          <form onSubmit={handleCheck} className="space-y-4">

            {/* Age */}
            <Field label="Age" icon={User}>
              <input
                type="number"
                name="age"
                min="1"
                max="120"
                placeholder="e.g. 28"
                value={form.age}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            {/* Annual Income */}
            <Field label="Annual Family Income (₹)" icon={IndianRupee}>
              <input
                type="number"
                name="income"
                min="0"
                placeholder="e.g. 250000"
                value={form.income}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            {/* Gender */}
            <Field label="Gender" icon={Users}>
              <div className="relative">
                <select name="gender" value={form.gender} onChange={handleChange} className={selectClass}>
                  <option value="">Select Gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
              </div>
            </Field>

            {/* State */}
            <Field label="State of Residence" icon={MapPin}>
              <div className="relative">
                <select name="state" value={form.state} onChange={handleChange} className={selectClass}>
                  <option value="">Select State</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
              </div>
            </Field>

            {/* Occupation */}
            <Field label="Occupation" icon={Briefcase}>
              <div className="relative">
                <select name="occupation" value={form.occupation} onChange={handleChange} className={selectClass}>
                  <option value="">Select Occupation</option>
                  {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
              </div>
            </Field>

            {/* Education */}
            <Field label="Education Level" icon={BookOpen}>
              <div className="relative">
                <select name="education" value={form.education} onChange={handleChange} className={selectClass}>
                  <option value="">Select Education</option>
                  {EDUCATIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
              </div>
            </Field>

            {/* Category */}
            <Field label="Caste Category" icon={Shield}>
              <div className="relative">
                <select name="category" value={form.category} onChange={handleChange} className={selectClass}>
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
              </div>
            </Field>

            {/* Disability Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#12141d] border border-border">
              <div>
                <p className="text-sm text-white font-semibold">Disability Status</p>
                <p className="text-xs text-textSecondary">Do you have a certified disability?</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="disability"
                  checked={form.disability}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#2a2e3d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-accent text-[#0a0a0f] font-bold text-sm hover:bg-accentHover transition-colors flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking Eligibility...</>
                : <><Activity className="w-4 h-4" /> Check My Eligibility</>
              }
            </button>
          </form>
        </motion.div>

        {/* ─── Results Panel ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Placeholder before check */}
          {!result && !error && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 rounded-2xl bg-[#171a21] border border-border border-dashed"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-accent" />
              </div>
              <p className="text-white font-bold text-lg mb-2">Ready to Check</p>
              <p className="text-textSecondary text-sm max-w-xs">
                Fill in your details on the left and click <span className="text-accent font-semibold">Check My Eligibility</span> to discover matching government schemes.
              </p>
            </motion.div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 rounded-2xl bg-[#171a21] border border-border">
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
              <p className="text-textSecondary text-sm">Scanning {`>`} 20 Indian government schemes...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
              <XCircle className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-red-400 font-semibold">{error}</p>
            </div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Verdict Card */}
                <div className="p-6 rounded-2xl bg-[#171a21] border border-border text-center space-y-4">
                  <VerdictBadge verdict={result.verdict} />
                  <ScoreGauge score={result.score ?? result.matchScore ?? 0} />
                  {result.eligibleCount !== undefined && (
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {[
                        { label: "Eligible",       value: result.eligibleCount,    color: "text-success" },
                        { label: "Maybe",          value: result.maybeCount,       color: "text-orange-400" },
                        { label: "Not Eligible",   value: result.notEligibleCount, color: "text-red-400" },
                      ].map((s, i) => (
                        <div key={i} className="p-3 rounded-xl bg-[#12141d] border border-border">
                          <p className={`text-2xl font-bold ${s.color}`}>{s.value ?? 0}</p>
                          <p className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reasons / Criteria */}
                {result.reasons?.length > 0 && (
                  <div className="p-5 rounded-2xl bg-[#171a21] border border-border">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-accent" /> Eligibility Criteria
                    </h3>
                    <ul className="space-y-2">
                      {result.reasons.map((r, i) => (
                        <li key={i} className={clsx(
                          "text-sm flex items-start gap-2",
                          r.startsWith("✓") ? "text-success" : r.startsWith("✗") ? "text-red-400" : "text-textSecondary"
                        )}>
                          <span className="flex-shrink-0 mt-0.5">{r.startsWith("✓") ? "✓" : r.startsWith("✗") ? "✗" : "•"}</span>
                          <span>{r.replace(/^[✓✗] /, "")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Requirements */}
                {result.missingRequirements?.length > 0 && (
                  <div className="p-5 rounded-2xl bg-orange-400/5 border border-orange-400/20">
                    <h3 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Missing Requirements
                    </h3>
                    <ul className="space-y-2">
                      {result.missingRequirements.map((m, i) => (
                        <li key={i} className="text-sm text-textSecondary flex items-start gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Schemes */}
                {(result.suggestedSchemes?.length > 0 || result.detailedReport?.eligible?.length > 0) && (
                  <div className="p-5 rounded-2xl bg-[#171a21] border border-border">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-accent" /> Recommended Schemes
                    </h3>
                    <ul className="space-y-2">
                      {(result.suggestedSchemes?.length > 0 ? result.suggestedSchemes : result.detailedReport?.eligible || []).slice(0, 6).map((s, i) => (
                        <li key={i} className="flex flex-col gap-2 p-3 rounded-xl bg-[#12141d] border border-border">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                              <span className="text-sm text-white font-semibold truncate">{s.name}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={clsx(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                s.verdict === "Eligible"
                                  ? "bg-success/10 text-success border-success/20"
                                  : "bg-orange-400/10 text-orange-400 border-orange-400/20"
                              )}>
                                {s.verdict || "Eligible"}
                              </span>
                            </div>
                          </div>
                          {s.requiredDocuments?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1 border-t border-border/30 pt-2">
                              {s.requiredDocuments.map((doc, idx) => (
                                <span key={idx} className="text-[10px] bg-[#1e222e] text-textSecondary border border-border px-1.5 py-0.5 rounded">
                                  {doc}
                                </span>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
