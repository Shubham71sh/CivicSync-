import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, ChevronDown, ExternalLink, FileText,
  Calendar, MapPin, IndianRupee, Users, X, RefreshCw,
  Loader2, ChevronLeft, ChevronRight, BookOpen, BadgeCheck,
} from "lucide-react";
import { getSchemes, applyForScheme, checkEligibility } from "../../services/schemeService";
import Skeleton from "../../components/ui/Skeleton";
import clsx from "clsx";

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "agriculture", label: "Agriculture" },
  { value: "healthcare", label: "Healthcare" },
  { value: "housing", label: "Housing" },
  { value: "education", label: "Education" },
  { value: "scholarship", label: "Scholarship" },
  { value: "employment", label: "Employment" },
  { value: "business", label: "Business" },
  { value: "digital", label: "Digital" },
  { value: "women", label: "Women" },
  { value: "disability", label: "Disability" },
  { value: "other", label: "Other" },
];

const STATES = [
  "All India", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
];

const OCCUPATIONS = [
  "Farmer", "Student", "Unemployed", "Artisan", "Street Vendor", 
  "Daily Wage Worker", "Homemaker", "Entrepreneur"
];

const EDUCATIONS = [
  "None", "Primary", "Secondary", "Higher Secondary", "Graduate", "Post Graduate"
];

const CATEGORY_COLORS = {
  agriculture: "bg-green-500/10 text-green-400 border-green-500/20",
  healthcare:  "bg-red-500/10 text-red-400 border-red-500/20",
  housing:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
  education:   "bg-purple-500/10 text-purple-400 border-purple-500/20",
  scholarship: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  employment:  "bg-orange-500/10 text-orange-400 border-orange-500/20",
  business:    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  digital:     "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  women:       "bg-pink-500/10 text-pink-400 border-pink-500/20",
  disability:  "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  other:       "bg-white/5 text-textSecondary border-white/10",
};

// ─── Scheme Card ───────────────────────────────────────────────────────────────

function SchemeCard({ scheme, onApply, applying }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = CATEGORY_COLORS[scheme.category] || CATEGORY_COLORS.other;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-5 rounded-2xl bg-[#171a21] border border-border hover:border-white/10 transition-colors group"
    >
      {/* Top Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", catColor)}>
              {scheme.category}
            </span>
            {scheme.state && scheme.state !== "All India" && (
              <span className="text-[10px] font-semibold text-textSecondary bg-[#1e222e] border border-border px-2 py-0.5 rounded-full flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" /> {scheme.state}
              </span>
            )}
          </div>
          <h3 className="text-white font-bold text-sm leading-tight">{scheme.name}</h3>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-accent font-bold text-sm">{scheme.benefitAmount || scheme.estimatedBenefit}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-textSecondary leading-relaxed mb-4 line-clamp-2">{scheme.description}</p>

      {/* Metadata Row */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-textSecondary">
        {scheme.applicationDeadline && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {scheme.applicationDeadline}
          </span>
        )}
        {scheme.minimumAge && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            Age {scheme.minimumAge}{scheme.maximumAge ? `–${scheme.maximumAge}` : "+"}
          </span>
        )}
        {scheme.incomeLimit && (
          <span className="flex items-center gap-1">
            <IndianRupee className="w-3 h-3" />
            Income ≤ ₹{scheme.incomeLimit.toLocaleString()}
          </span>
        )}
      </div>

      {/* Expand Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            {scheme.requiredDocuments?.length > 0 && (
              <div className="p-3 rounded-xl bg-[#12141d] border border-border mb-3">
                <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold mb-2 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Required Documents
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {scheme.requiredDocuments.map((doc, i) => (
                    <span key={i} className="text-xs bg-[#1e222e] border border-border text-textSecondary px-2 py-0.5 rounded-lg">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {scheme.officialWebsite && (
              <a
                href={scheme.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-accent hover:text-white transition-colors font-semibold"
              >
                <ExternalLink className="w-3 h-3" /> Official Website
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 py-2 rounded-xl border border-border text-textSecondary text-xs font-semibold hover:text-white hover:border-white/20 transition-colors flex items-center justify-center gap-1.5"
        >
          <BookOpen className="w-3.5 h-3.5" />
          {expanded ? "Less" : "View Details"}
          <ChevronDown className={clsx("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
        </button>
        <button
          onClick={() => onApply(scheme)}
          disabled={applying === scheme._id}
          className="flex-1 py-2 rounded-xl bg-accent text-[#0a0a0f] text-xs font-bold hover:bg-accentHover transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {applying === scheme._id
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Applying...</>
            : <><BadgeCheck className="w-3.5 h-3.5" /> Apply Now</>
          }
        </button>
      </div>
    </motion.div>
  );
}

// ─── Skeleton Row ──────────────────────────────────────────────────────────────

function SchemeSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-[#171a21] border border-border space-y-3">
      <div className="flex justify-between">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-24 h-4" />
      </div>
      <Skeleton className="w-3/4 h-5 mt-1" />
      <Skeleton className="w-full h-3" />
      <Skeleton className="w-5/6 h-3" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="flex-1 h-8 rounded-xl" />
        <Skeleton className="flex-1 h-8 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SchemeFinder() {
  const [schemes, setSchemes]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [applying, setApplying] = useState(null);
  const [toast, setToast]       = useState(null);

  // Filters
  const [keyword,  setKeyword]  = useState("");
  const [category, setCategory] = useState("all");
  const [state,    setState]    = useState("all");
  const [eligibilityFilter, setEligibilityFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("");
  const [incomeFilter, setIncomeFilter] = useState("");
  const [occupationFilter, setOccupationFilter] = useState("all");
  const [educationFilter, setEducationFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Debounced keyword
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 450);
    return () => clearTimeout(t);
  }, [keyword]);

  const fetchSchemes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (eligibilityFilter === "eligible") {
        // Fetch all eligible/maybe eligible schemes via checkEligibility
        const res = await checkEligibility({});
        let list = res.suggestedSchemes || [];
        
        // Filter by keyword, category, state client-side
        if (debouncedKeyword) {
          const kw = debouncedKeyword.toLowerCase();
          list = list.filter(s => 
            s.name?.toLowerCase().includes(kw) || 
            s.description?.toLowerCase().includes(kw) ||
            s.category?.toLowerCase().includes(kw)
          );
        }
        if (category !== "all") {
          list = list.filter(s => s.category === category);
        }
        if (state !== "all") {
          list = list.filter(s => s.state === state || s.state === "All India");
        }
        if (ageFilter) {
          const ageNum = parseInt(ageFilter);
          if (!isNaN(ageNum)) {
            list = list.filter(s => (s.minimumAge === null || s.minimumAge <= ageNum) && (s.maximumAge === null || s.maximumAge >= ageNum));
          }
        }
        if (incomeFilter) {
          const incomeNum = parseFloat(incomeFilter);
          if (!isNaN(incomeNum)) {
            list = list.filter(s => s.incomeLimit === null || s.incomeLimit >= incomeNum);
          }
        }
        if (occupationFilter !== "all") {
          list = list.filter(s => s.occupation === "All" || s.occupation?.toLowerCase().includes(occupationFilter.toLowerCase()));
        }
        if (educationFilter !== "all") {
          list = list.filter(s => s.education === "None" || s.education?.toLowerCase().includes(educationFilter.toLowerCase()));
        }
        
        setSchemes(list.slice((page - 1) * 9, page * 9));
        setTotal(list.length);
        setPages(Math.ceil(list.length / 9) || 1);
      } else {
        const params = { page, limit: 9 };
        if (debouncedKeyword) params.keyword = debouncedKeyword;
        if (category !== "all") params.category = category;
        if (state !== "all") params.state = state;
        if (ageFilter) params.age = ageFilter;
        if (incomeFilter) params.income = incomeFilter;
        if (occupationFilter !== "all") params.occupation = occupationFilter;
        if (educationFilter !== "all") params.education = educationFilter;
        
        const result = await getSchemes(params);
        setSchemes(result.schemes || []);
        setTotal(result.total || 0);
        setPages(result.pages || 1);
      }
    } catch (err) {
      console.error("[SchemeFinder] fetch error:", err);
      setError("Failed to load schemes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedKeyword, category, state, eligibilityFilter, ageFilter, incomeFilter, occupationFilter, educationFilter]);

  useEffect(() => { fetchSchemes(); }, [fetchSchemes]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [debouncedKeyword, category, state, eligibilityFilter, ageFilter, incomeFilter, occupationFilter, educationFilter]);

  const handleApply = async (scheme) => {
    setApplying(scheme._id);
    try {
      await applyForScheme(scheme._id);
      showToast(`Applied for "${scheme.name}" successfully!`, "success");
    } catch (err) {
      const msg = err.response?.data?.message || "Application failed.";
      showToast(msg, "error");
    } finally {
      setApplying(null);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const clearFilters = () => {
    setKeyword("");
    setCategory("all");
    setState("all");
    setEligibilityFilter("all");
    setAgeFilter("");
    setIncomeFilter("");
    setOccupationFilter("all");
    setEducationFilter("all");
  };
  const hasFilters = keyword || category !== "all" || state !== "all" || eligibilityFilter !== "all" || ageFilter || incomeFilter || occupationFilter !== "all" || educationFilter !== "all";

  return (
    <div className="space-y-6 pb-20">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={clsx(
              "fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl border shadow-2xl text-sm font-semibold flex items-center gap-2",
              toast.type === "success"
                ? "bg-[#171a21] border-success/40 text-success"
                : "bg-[#171a21] border-red-500/40 text-red-400"
            )}
          >
            <BadgeCheck className="w-4 h-4" />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
            <Search className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Scheme Finder</h1>
            <p className="text-sm text-textSecondary">
              {loading ? "Searching schemes..." : `${total} government schemes available`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors",
              showFilters
                ? "bg-accent/10 border-accent/30 text-accent"
                : "bg-[#171a21] border-border text-textSecondary hover:text-white"
            )}
          >
            <Filter className="w-4 h-4" /> Filters
            {hasFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            )}
          </button>
          <button
            onClick={fetchSchemes}
            disabled={loading}
            className="p-2 rounded-xl border border-border text-textSecondary hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" />
        <input
          type="text"
          placeholder="Search schemes by name, category, or benefit..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full bg-[#171a21] border border-border rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-textMuted focus:outline-none focus:border-accent transition-colors"
        />
        {keyword && (
          <button onClick={() => setKeyword("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-textMuted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-2xl bg-[#171a21] border border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Category */}
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider font-bold mb-2 block">Category</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#12141d] border border-border rounded-xl py-2.5 px-3 text-sm text-white appearance-none focus:outline-none focus:border-accent transition-colors"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
                </div>
              </div>

              {/* State */}
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider font-bold mb-2 block">State</label>
                <div className="relative">
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-[#12141d] border border-border rounded-xl py-2.5 px-3 text-sm text-white appearance-none focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="all">All States</option>
                    {STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
                </div>
              </div>

              {/* Eligibility */}
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider font-bold mb-2 block">Eligibility</label>
                <div className="relative">
                  <select
                    value={eligibilityFilter}
                    onChange={(e) => setEligibilityFilter(e.target.value)}
                    className="w-full bg-[#12141d] border border-border rounded-xl py-2.5 px-3 text-sm text-white appearance-none focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="all">All Schemes</option>
                    <option value="eligible">Eligible Only</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider font-bold mb-2 block">Age</label>
                <input
                  type="number"
                  placeholder="e.g. 25"
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  className="w-full bg-[#12141d] border border-border rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              {/* Income */}
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider font-bold mb-2 block">Annual Income (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={incomeFilter}
                  onChange={(e) => setIncomeFilter(e.target.value)}
                  className="w-full bg-[#12141d] border border-border rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              {/* Occupation */}
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider font-bold mb-2 block">Occupation</label>
                <div className="relative">
                  <select
                    value={occupationFilter}
                    onChange={(e) => setOccupationFilter(e.target.value)}
                    className="w-full bg-[#12141d] border border-border rounded-xl py-2.5 px-3 text-sm text-white appearance-none focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="all">All Occupations</option>
                    {OCCUPATIONS.map(occ => (
                      <option key={occ} value={occ.toLowerCase()}>{occ}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
                </div>
              </div>

              {/* Education */}
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider font-bold mb-2 block">Education</label>
                <div className="relative">
                  <select
                    value={educationFilter}
                    onChange={(e) => setEducationFilter(e.target.value)}
                    className="w-full bg-[#12141d] border border-border rounded-xl py-2.5 px-3 text-sm text-white appearance-none focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="all">All Education Levels</option>
                    {EDUCATIONS.map(edu => (
                      <option key={edu} value={edu.toLowerCase()}>{edu}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
                </div>
              </div>

              {/* Clear */}
              {hasFilters && (
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full py-2.5 rounded-xl border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-3.5 h-3.5" /> Clear Filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {!loading && error && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
          <p className="text-red-400 font-semibold">{error}</p>
          <button
            onClick={fetchSchemes}
            className="px-4 py-2 rounded-lg bg-accent text-[#0a0a0f] text-sm font-bold hover:bg-accentHover transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <SchemeSkeleton key={i} />)}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && schemes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#171a21] border border-border flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-textMuted" />
          </div>
          <p className="text-white font-bold text-lg mb-2">No schemes found</p>
          <p className="text-textSecondary text-sm mb-6">Try adjusting your filters or search query</p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg bg-accent text-[#0a0a0f] text-sm font-bold hover:bg-accentHover transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Scheme Grid */}
      {!loading && !error && schemes.length > 0 && (
        <>
          <motion.div
            layout
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {schemes.map((scheme) => (
                <SchemeCard
                  key={scheme._id}
                  scheme={scheme}
                  onApply={handleApply}
                  applying={applying}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-sm text-textSecondary">
                Page <span className="text-white font-semibold">{page}</span> of{" "}
                <span className="text-white font-semibold">{pages}</span>
                <span className="ml-2 text-textMuted">({total} total)</span>
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-textSecondary text-sm font-semibold hover:text-white hover:border-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-textSecondary text-sm font-semibold hover:text-white hover:border-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
