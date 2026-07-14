export const disasterSummary = {
  type: "Flood",
  location: "Patna, Bihar",
  riskLevel: "High",
  date: "6 July 2026",
  weather: "Heavy Rain",
  status: "In Progress",
  coordinates: [25.5941, 85.1376],
};

export const disasterTypes = [
  { id: "flood", name: "Flood", icon: "Waves", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "fire", name: "Fire", icon: "Flame", color: "text-red-600 bg-red-50 border-red-200" },
  { id: "earthquake", name: "Earthquake", icon: "Activity", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "cyclone", name: "Cyclone", icon: "Wind", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  { id: "landslide", name: "Landslide", icon: "Mountain", color: "text-amber-800 bg-amber-100 border-amber-300" },
  { id: "rain", name: "Heavy Rain", icon: "CloudRain", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
];

export const mockGalleryImages = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=800",
    label: "House Exterior - Flood Damage",
    detections: [
      { id: "d1", label: "Wall Crack", confidence: 82, x: "10%", y: "20%", w: "40%", h: "50%", severity: "Moderate" },
      { id: "d2", label: "Water Damage line", confidence: 95, x: "5%", y: "65%", w: "90%", h: "15%", severity: "Severe" }
    ]
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
    label: "Roof & Ceiling Inspection",
    detections: [
      { id: "d3", label: "Roof Damage", confidence: 95, x: "20%", y: "10%", w: "60%", h: "40%", severity: "Severe" },
      { id: "d4", label: "Structural Risk", confidence: 89, x: "40%", y: "30%", w: "20%", h: "50%", severity: "High" }
    ]
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800",
    label: "Interior Living Room",
    detections: [
      { id: "d5", label: "Water Level (4.8 ft)", confidence: 98, x: "0%", y: "45%", w: "100%", h: "50%", severity: "Severe" },
      { id: "d6", label: "Wall Plaster Peel", confidence: 78, x: "15%", y: "10%", w: "30%", h: "35%", severity: "Moderate" }
    ]
  }
];

export const damageAssessment = {
  overallDamage: 82,
  metrics: [
    { name: "House Damage", value: "82%", status: "Severe", color: "bg-red-500 text-white" },
    { name: "Roof Damage", value: "Severe", status: "Critical", color: "bg-red-500 text-white" },
    { name: "Wall Damage", value: "Moderate", status: "Warning", color: "bg-amber-500 text-white" },
    { name: "Structural Risk", value: "High", status: "Danger", color: "bg-red-500 text-white" },
    { name: "Water Level", value: "4.8 ft", status: "Submerged", color: "bg-blue-500 text-white" },
    { name: "Electricity Status", value: "Disconnected", status: "Off", color: "bg-slate-500 text-white" },
  ],
  financials: {
    estimatedLoss: 235000,
    aiConfidence: 94,
  }
};

export const governmentAssistance = {
  estimatedRelief: 60000,
  basis: [
    "AI-analyzed structural damage of 82%",
    "State flood mitigation policy guidelines (Section 4A)",
    "Citizen Income Bracket Verification (Low-to-Medium)",
    "Geotagged image GPS coordinate confirmation (Patna Ward 14)"
  ]
};

export const recommendedSchemes = [
  {
    id: "scheme-1",
    name: "State Flood Relief Scheme",
    status: "Eligible",
    amount: "₹10,000",
    priority: "High",
    approvalTime: "24-48 Hours",
    deadline: "30 July 2026",
    description: "Immediate direct benefit transfer (DBT) to victims of declared flood zones for food and essentials.",
    guide: "Requires Aadhaar verification and active bank account link. No structural certificate needed for baseline amount."
  },
  {
    id: "scheme-2",
    name: "House Repair Grant",
    status: "Eligible",
    amount: "₹50,000",
    priority: "High",
    approvalTime: "5-7 Days",
    deadline: "15 Aug 2026",
    description: "Financial assistance for repairing structures damaged by natural calamities like storms and floods.",
    guide: "Needs geotagged images showing structural cracks, certified by the block development officer (or CivicSync AI verification report)."
  },
  {
    id: "scheme-3",
    name: "Electricity Bill Waiver Program",
    status: "Eligible",
    amount: "50% Waiver",
    priority: "Medium",
    approvalTime: "10 Days",
    deadline: "31 Aug 2026",
    description: "Surcharge and usage waiver for households affected by power shutoffs and grid damage during the crisis.",
    guide: "Applied automatically once the local grid logs power disconnect. Bring utility bill copy to verify consumer account number."
  },
  {
    id: "scheme-4",
    name: "Emergency Crop Compensation",
    status: "Not Eligible",
    amount: "Up to ₹25,000",
    priority: "Low",
    approvalTime: "N/A",
    deadline: "10 Aug 2026",
    description: "Compensation for agricultural losses and washed-out seeds in rural farming jurisdictions.",
    guide: "Only applicable for land classified under agricultural usage. Citizen profile registered as Urban Residential in municipal logs."
  }
];

export const eligibilityChecklist = [
  { label: "Flood officially declared in Bihar state government gazette", verified: true },
  { label: "AI assessed structural house damage exceeds 40% threshold", verified: true },
  { label: "GPS location confirms residential address is within the affected boundary", verified: true },
  { label: "Citizen household income verified under municipal ceiling", verified: true },
  { label: "Identity matching (Aadhaar & Voter ID) authenticated successfully", verified: true }
];

export const missingDocuments = {
  submitted: [
    { name: "Aadhaar Card", verified: true },
    { name: "Residence Proof (Electricity/Water Bill)", verified: true },
    { name: "House Photos showing clear damages", verified: true }
  ],
  missing: [
    { name: "Bank Passbook Copy (Front Page with IFSC)", verified: false },
    { name: "Local Area Officer Damage Certificate", verified: false }
  ],
  completionPercentage: 60
};

export const recoveryTimeline = [
  { id: "step-1", title: "Report Submitted", status: "completed", date: "6 July, 10:15 AM", desc: "Disaster incident logged by user with photo uploads" },
  { id: "step-2", title: "AI Verification", status: "completed", date: "6 July, 10:20 AM", desc: "Damage models run; structural risk and loss estimated" },
  { id: "step-3", title: "Officer Assigned", status: "current", date: "7 July, 09:30 AM", desc: "Block Officer Rajesh Kumar assigned for physical audit" },
  { id: "step-4", title: "Physical Verification", status: "pending", date: "Scheduled 8 July", desc: "On-site review of structural integrity and document inspection" },
  { id: "step-5", title: "Approved", status: "pending", date: "Pending Verification", desc: "Validation of reports and final claim signing by supervisor" },
  { id: "step-6", title: "Payment Released", status: "pending", date: "Pending Approval", desc: "Direct bank transfer of ₹60,000 to Jan Dhan Account" }
];

export const nearbyServices = [
  { id: "service-1", type: "Relief Camp", name: "Patna Central High School Shelter", distance: "0.8 km", status: "Active", phone: "+91 612 223412", capacity: "120/500 left", coords: [25.5991, 85.1426] },
  { id: "service-2", type: "Hospital", name: "Patna Medical College & Hospital", distance: "2.4 km", status: "Critical Care Active", phone: "+91 612 2300084", capacity: "Emergency Open", coords: [25.6202, 85.1558] },
  { id: "service-3", type: "Food Center", name: "Community Kitchen Ward 12", distance: "1.2 km", status: "Active", phone: "+91 99345 88210", capacity: "Serving Meals Now", coords: [25.5901, 85.1326] },
  { id: "service-4", type: "Police Station", name: "Kotwali Police Station Patna", distance: "1.5 km", status: "24x7 Active Patrol", phone: "+91 612 222123", capacity: "Helpline Active", coords: [25.6021, 85.1296] },
  { id: "service-5", type: "Electricity Office", name: "SBPDCL Substation", distance: "3.1 km", status: "Restoration in Progress", phone: "+91 1912", capacity: "Tech Staff Deployed", coords: [25.5841, 85.1486] },
  { id: "service-6", type: "Government Help Center", name: "Disaster Relief Nodal Desk", distance: "0.5 km", status: "Helpdesk Active", phone: "1070 (Toll-Free)", capacity: "Queue: Short", coords: [25.5921, 85.1386] }
];

export const communityInsights = {
  nearbyReports: 128,
  verifiedReports: 102,
  pendingReports: 26,
  averageDamage: 72,
  heatmapPoints: [
    { lat: 25.5941, lng: 85.1376, intensity: 0.9 },
    { lat: 25.5991, lng: 85.1426, intensity: 0.7 },
    { lat: 25.5901, lng: 85.1326, intensity: 0.8 },
    { lat: 25.6021, lng: 85.1296, intensity: 0.5 },
    { lat: 25.6202, lng: 85.1558, intensity: 0.4 },
  ]
};

export const financialBreakdown = {
  items: [
    { name: "House Structural Walls & Foundation", amount: 210000 },
    { name: "Furniture (Beds, Sofa, Wardrobe)", amount: 20000 },
    { name: "Electronics (Refrigerator, Inverter)", amount: 15000 },
    { name: "Vehicle (Damage Assessment: Checked)", amount: 0 }
  ],
  totalLoss: 245000
};

export const chatbotActions = [
  "Explain Report",
  "Eligible Schemes",
  "Missing Documents",
  "Nearest Relief Camp",
  "Track Application"
];

export const chatbotConversations = [
  { sender: "ai", text: "Hello! I am your AI Disaster Relief Assistant. I have analyzed your uploaded images and municipal details. How can I help you navigate your recovery today?" },
  { sender: "user", text: "My house was damaged during the flood." },
  { sender: "ai", text: "Based on the uploaded evidence, you qualify for the State Flood Relief Scheme and House Repair Grant. Estimated government assistance is ₹60,000. I recommend uploading your missing Bank Passbook copy to avoid approval delays." }
];
