// ============================================================
// CivicSync Disaster Relief — Mock Data
// Realistic data modeling Patna, Bihar flood relief scenario
// ============================================================

export const mockDamageData = {
  overallDamage: 82,
  metrics: [
    { name: "House Damage",       value: "78%",   status: "Severe"   },
    { name: "Roof Damage",        value: "64%",   status: "Warning"  },
    { name: "Wall Damage",        value: "89%",   status: "Severe"   },
    { name: "Water Level",        value: "4.2 ft", status: "Critical" },
    { name: "Electricity Status", value: "Off",   status: "Danger"   },
    { name: "AI Confidence",      value: "94%",   status: "Verified" },
  ],
  financials: {
    estimatedLoss: 245000,
    aiConfidence: 94,
    disbursementReady: 60000,
  },
};

export const mockGalleryImages = [
  {
    id: 1,
    label: "External Wall Flood Line",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/FEMA_-_39423_-_Flooded_neighborhood_in_Tennessee.jpg/1280px-FEMA_-_39423_-_Flooded_neighborhood_in_Tennessee.jpg",
    detections: [
      { id: "d1", label: "Wall Crack",     confidence: 82, severity: "Severe",  x: "8%",  y: "30%", w: "28%", h: "35%" },
      { id: "d2", label: "Flood Waterline",confidence: 91, severity: "High",    x: "45%", y: "55%", w: "48%", h: "20%" },
    ],
  },
  {
    id: 2,
    label: "Roof Structural Damage",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/FEMA_-_39420_-_A_family_stands_near_their_flooded_Tennessee_home.jpg/1280px-FEMA_-_39420_-_A_family_stands_near_their_flooded_Tennessee_home.jpg",
    detections: [
      { id: "d3", label: "Roof Collapse",  confidence: 95, severity: "Severe",  x: "15%", y: "10%", w: "60%", h: "40%" },
    ],
  },
  {
    id: 3,
    label: "Foundation Water Seepage",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/2013_SEQ_floods_-_Closeup_of_house_flooded.jpg/1280px-2013_SEQ_floods_-_Closeup_of_house_flooded.jpg",
    detections: [
      { id: "d4", label: "Foundation Seep",confidence: 88, severity: "High",    x: "20%", y: "60%", w: "65%", h: "28%" },
      { id: "d5", label: "Wall Crack",     confidence: 73, severity: "Warning", x: "70%", y: "20%", w: "22%", h: "30%" },
    ],
  },
];

export const mockSchemes = [
  {
    id: "s1",
    name: "State Flood Relief Scheme — Immediate Cash Grant",
    amount: "₹10,000",
    status: "Eligible",
    guide: "Your property falls within the government-declared flood zone and damage exceeds 40% threshold.",
    approvalTime: "3–5 Days",
  },
  {
    id: "s2",
    name: "PMAY House Repair Grant — Structural Damage Repair",
    amount: "₹50,000",
    status: "Eligible",
    guide: "AI-assessed wall damage of 89% qualifies you under PMAY structural damage clause 4.2.",
    approvalTime: "7–14 Days",
  },
  {
    id: "s3",
    name: "Electricity Bill Waiver — Flood Affected Household",
    amount: "50% Waiver",
    status: "Eligible",
    guide: "Your electricity supply was officially cut on June 28 after flood declaration — entitles 6-month waiver.",
    approvalTime: "2–3 Days",
  },
  {
    id: "s4",
    name: "Crop Damage Compensation — Kharif Season 2025",
    amount: "₹8,500/acre",
    status: "Ineligible",
    guide: "Requires registered agricultural farmland status in municipal land records.",
    approvalTime: "N/A",
  },
];
