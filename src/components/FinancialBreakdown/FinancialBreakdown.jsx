import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Landmark, Smartphone, Car, Sofa, Info } from "lucide-react";

const categoryIcons = {
  "House Structural Walls & Foundation": Landmark,
  "Furniture (Beds, Sofa, Wardrobe)": Sofa,
  "Electronics (Refrigerator, Inverter)": Smartphone,
  "Vehicle (Damage Assessment: Checked)": Car
};

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444"];

export default function FinancialBreakdown({ data }) {
  const { items, totalLoss } = data;

  // Filter items for chart (excluding ₹0 items to avoid rendering empty slices)
  const chartData = items
    .filter(item => item.amount > 0)
    .map(item => ({
      name: item.name.split(" (")[0].split(" Structural")[0], // Clean name
      value: item.amount
    }));

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-800">Financial Loss Breakdown</h3>
        <p className="text-[11px] text-slate-400">Estimated cost of replacing structural features and household property</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
        {/* Left Side: Recharts Pie Chart (2 cols) */}
        <div className="md:col-span-2 h-44 flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, "Loss"]}
                contentStyle={{ background: "#0f172a", border: "none", borderRadius: "8px", fontSize: "10px", color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Centered Total Loss indicator inside donut */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Loss</span>
            <span className="text-xs font-black text-slate-800">₹2.45L</span>
          </div>
        </div>

        {/* Right Side: Data List (3 cols) */}
        <div className="md:col-span-3 space-y-3">
          <div className="space-y-2">
            {items.map((item, idx) => {
              const Icon = categoryIcons[item.name] || Landmark;
              const color = item.amount > 0 ? COLORS[idx % COLORS.length] : "#94a3b8";

              return (
                <div key={idx} className="flex items-center justify-between text-xs pb-2 border-b border-slate-50 last:border-b-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      style={{ backgroundColor: `${color}15`, color: color }} 
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-slate-600 truncate block">
                      {item.name.split(" (")[0]}
                    </span>
                  </div>
                  <span className={`font-extrabold shrink-0 ${item.amount > 0 ? "text-slate-800" : "text-slate-400"}`}>
                    ₹{item.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between mt-4">
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Total Asset Loss</span>
            <span className="text-sm font-black text-red-600">
              ₹{totalLoss.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
