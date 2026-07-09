import { motion } from "framer-motion";
import { useState } from "react";
import { TrendingUp, BarChart3, Globe, Users, DollarSign, Leaf, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { simulateImpact } from "../../services/aiService";
import clsx from "clsx";

const DEFAULT_PARAMS = {
  corporateTax: 25,
  greenSubsidy: 60,
  infrastructureBudget: 45,
  digitalLevy: 15,
};

const METRICS = [
  { key: "gdpGrowth", label: "GDP Growth", icon: TrendingUp, color: "text-success", suffix: "%" },
  { key: "employment", label: "Job Creation", icon: Users, color: "text-accent", suffix: "k" },
  { key: "co2Reduction", label: "CO₂ Reduction", icon: Leaf, color: "text-green-400", suffix: "Mt" },
  { key: "taxRevenue", label: "Tax Revenue", icon: DollarSign, color: "text-blue-400", prefix: "$", suffix: "B" },
];

function Slider({ label, value, onChange, min = 0, max = 100 }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-textSecondary font-medium">{label}</span>
        <span className="text-white font-bold">{value}%</span>
      </div>
      <div className="relative h-2 bg-[#2a2e3d] rounded-full">
        <div
          className="absolute inset-y-0 left-0 bg-accent rounded-full transition-all duration-150"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

export default function ImpactSimulator() {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [simulating, setSimulating] = useState(false);
  const [results, setResults] = useState(null);

  const setParam = (key, val) => setParams((prev) => ({ ...prev, [key]: val }));

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      // Backend: POST /api/ai/simulate
      const result = await simulateImpact(params);
      setResults(result.metrics);
    } catch (err) {
      console.error("[ImpactSimulator] Simulate failed:", err);
    } finally {
      setSimulating(false);
    }
  };

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setResults(null);
  };

  const BAR_DATA = [35, 55, 40, 70, 50, 85, 45, 60, 90, 30, 65, 80];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Impact Simulator</h1>
          <p className="text-sm text-textSecondary">Adjust policy parameters to simulate their effect on national metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Controls */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 p-6 rounded-3xl bg-[#171a21] border border-border space-y-6">
          <h3 className="font-bold text-white">Policy Parameters</h3>
          <Slider label="Corporate Tax Rate" value={params.corporateTax} onChange={(v) => setParam("corporateTax", v)} />
          <Slider label="Green Subsidy Budget" value={params.greenSubsidy} onChange={(v) => setParam("greenSubsidy", v)} />
          <Slider label="Infrastructure Budget" value={params.infrastructureBudget} onChange={(v) => setParam("infrastructureBudget", v)} />
          <Slider label="Digital Services Levy" value={params.digitalLevy} onChange={(v) => setParam("digitalLevy", v)} />

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="flex-1 py-3 rounded-xl bg-accent text-[#0a0a0f] font-bold text-sm hover:bg-accentHover transition-colors shadow-glow-accent disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {simulating ? <><Loader2 className="w-4 h-4 animate-spin" /> Simulating...</> : "Run Simulation"}
            </button>
            <button onClick={handleReset} className="p-3 rounded-xl bg-[#12141d] border border-border text-textSecondary hover:text-white transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3 space-y-4">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-4">
            {METRICS.map((metric) => {
              const Icon = metric.icon;
              const val = results?.[metric.key];
              return (
                <div key={metric.key} className="p-5 rounded-2xl bg-[#171a21] border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={clsx("w-4 h-4", metric.color)} />
                    <span className="text-xs text-textSecondary font-semibold uppercase tracking-widest">{metric.label}</span>
                  </div>
                  <p className={clsx("text-3xl font-bold", val ? metric.color : "text-textSecondary")}>
                    {val != null
                      ? `${metric.prefix || ""}${val}${metric.suffix || ""}`
                      : "—"}
                  </p>
                  {val != null && (
                    <p className="text-xs text-success mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Projected
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white">5-Year Projection</h3>
              <div className="flex items-center gap-3 text-xs text-textSecondary">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent inline-block" />Projected</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2a2e3d] inline-block" />Baseline</span>
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-36">
              {BAR_DATA.map((h, i) => {
                const boosted = results ? Math.min(h + (results.gdpGrowth || 0) * 3, 100) : h;
                return (
                  <div key={i} className="flex-1 flex flex-col gap-1 items-center h-full justify-end">
                    <motion.div
                      className="w-full rounded-t bg-accent/70"
                      initial={{ height: 0 }}
                      animate={{ height: `${boosted}%` }}
                      transition={{ duration: 0.8, delay: i * 0.04 }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-textSecondary">
              {["2024", "2025", "2026", "2027", "2028"].map((y) => (
                <span key={y}>{y}</span>
              ))}
            </div>
          </div>

          {/* Globe widget */}
          <div className="p-5 rounded-3xl bg-[#171a21] border border-border flex items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-accent" />
                <h4 className="font-bold text-white text-sm">Global Ranking Impact</h4>
              </div>
              <p className="text-xs text-textSecondary">Under current parameters, estimated to move from <span className="text-white font-bold">#28</span> → <span className="text-success font-bold">#22</span> in the Governance Index.</p>
            </div>
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Globe className="w-6 h-6 text-accent" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
