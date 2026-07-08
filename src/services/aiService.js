import api from "../api/axiosInstance";

// ─────────────────────────────────────────────────────────────────────────────
// AI Service
// Placeholder implementations — ready to connect to Node.js + Express backend.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_RESPONSES = [
  "Based on your profile, you're eligible for the Solar Rebate under Section 42-B. Would you like me to start the application?",
  "The new Zoning Law (Bill #4290) has a 94% match with your interests. It primarily affects tech businesses in the Central District.",
  "I've analyzed the carbon tax bill — small businesses with revenue below $1M are exempt from the levy until 2028 under Clause 14.2.",
  "Your corruption risk alert has been securely forwarded to the local oversight committee.",
  "The Infrastructure Act allocates 34% of funds to digital connectivity in rural districts — this may benefit you based on your location.",
];

/**
 * Summarize a bill by ID using AI.
 * @param {string} billId
 * @param {{ mode: 'standard' | 'eli15' }} options
 * @returns {{ summary, keyPoints, impactScore, userImpact }}
 *
 * Backend: POST /api/ai/summarize
 */
export const summarizeBill = async (billId, options = { mode: "standard" }) => {
  // --- PLACEHOLDER ---
  await new Promise((resolve) => setTimeout(resolve, 1800));
  console.log("[aiService.summarizeBill] billId:", billId, "mode:", options.mode);
  return {
    summary: options.mode === "eli15"
      ? "Basically, the government wants to give you money for having a business near trees. Easy win!"
      : "This bill simplifies small business taxes by 12% if you operate in 'Green Zones.' You are currently 4km away from the nearest zone.",
    keyPoints: [
      "Tax reduction of 12% for qualifying businesses",
      "Effective from Q1 2025",
      "Requires annual environmental compliance report",
    ],
    impactScore: 84,
    userImpact: "High — Based on your profession and location, you qualify for up to $2,500 in deductions.",
  };

  // --- REAL BACKEND ---
  // const { data } = await api.post("/ai/summarize", { billId, mode: options.mode });
  // return data;
};

/**
 * Send a question to CivicSync AI chat.
 * @param {string} message - The user's question
 * @param {{ billId?: string, context?: string }} options
 * @returns {{ response, sources }}
 *
 * Backend: POST /api/ai/chat
 */
export const chatQuery = async (message, options = {}) => {
  // --- PLACEHOLDER ---
  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log("[aiService.chatQuery] message:", message, "context:", options);
  const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
  return {
    response,
    sources: ["Bill #4290 — Section 14.2", "Infrastructure Act 2024 — Annex B"],
  };

  // --- REAL BACKEND ---
  // const { data } = await api.post("/ai/chat", { message, ...options });
  // return data; // { response, sources }
};

/**
 * Get public sentiment analysis for a bill.
 * @param {string} billId
 * @returns {{ positive, negative, neutral, total, comments, shares, objections, trend }}
 *
 * Backend: GET /api/ai/sentiment/:billId
 */
export const getSentimentData = async (billId) => {
  // --- PLACEHOLDER ---
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    positive: 72,
    negative: 18,
    neutral: 10,
    total: 4200,
    comments: 4200,
    shares: 1800,
    objections: 124,
    trend: [40, 25, 45, 30, 60, 40, 80, 50, 70, 90, 65, 85, 40, 50, 20, 60],
  };

  // --- REAL BACKEND ---
  // const { data } = await api.get(`/ai/sentiment/${billId}`);
  // return data;
};

/**
 * Analyze a citizen's profile impact from a specific bill.
 * @param {{ billId, profession, income, location }} params
 * @returns {{ opportunities, risks, personalizedImpact }}
 *
 * Backend: POST /api/ai/profile-impact
 */
export const analyzeProfileImpact = async (params) => {
  // --- PLACEHOLDER ---
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return {
    opportunities: [
      { title: "Tax Saving Opportunity", desc: "New Section 42-B allows deducting up to $2,500 for home office equipment.", type: "tax" },
      { title: "Professional Eligibility", desc: "You qualify for the 'Tech Hub Grant' under the Digital Infrastructure Bill 2024.", type: "grant" },
    ],
    risks: [],
    personalizedImpact: "Estimated annual benefit: $3,750",
  };

  // --- REAL BACKEND ---
  // const { data } = await api.post("/ai/profile-impact", params);
  // return data;
};

/**
 * Simulate the macroeconomic impact of policy parameters.
 * @param {{ corporateTax, greenSubsidy, infrastructureBudget, digitalLevy }} params
 * @returns {{ metrics: { gdpGrowth, employment, co2Reduction, taxRevenue } }}
 *
 * Backend: POST /api/ai/simulate
 */
export const simulateImpact = async (params) => {
  // --- PLACEHOLDER ---
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log("[aiService.simulateImpact] params:", params);
  // Simple heuristic simulation based on slider values
  const gdpGrowth = +(((params.greenSubsidy / 100) * 2.4 + (params.infrastructureBudget / 100) * 1.8 - (params.corporateTax / 100) * 0.6)).toFixed(1);
  const employment = Math.round((params.infrastructureBudget / 100) * 520 + (params.greenSubsidy / 100) * 180);
  const co2Reduction = +(params.greenSubsidy / 100 * 48.5).toFixed(1);
  const taxRevenue = +((params.corporateTax / 100) * 18.4 + (params.digitalLevy / 100) * 3.2).toFixed(1);
  return {
    metrics: { gdpGrowth, employment, co2Reduction, taxRevenue },
  };

  // --- REAL BACKEND ---
  // const { data } = await api.post("/ai/simulate", params);
  // return data;
};

