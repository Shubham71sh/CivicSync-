/**
 * CivicSync Disaster Relief Dynamic Data Helpers
 */

// ── Officer Pool (20 Realistic Government Officers) ──────────────────────────
export const OFFICER_POOL = [
  {
    name: "Rajesh Kumar",
    designation: "Block Development Officer",
    department: "Department of Disaster Relief & Rehabilitation",
    zone: "Ward 14 (Central Sector)",
    phone: "+91 98765 43210",
    remarks: "Please keep original Aadhaar card and property ownership documents ready for physical audit."
  },
  {
    name: "Ananya Sharma",
    designation: "District Relief Collector",
    department: "Revenue & Disaster Management Department",
    zone: "Zone 3 North (Sub-Division A)",
    phone: "+91 98123 45678",
    remarks: "Ensure access to damaged area for photographic evidence and structural measurement."
  },
  {
    name: "Vikram Singh",
    designation: "Tehsildar & Disaster In-Charge",
    department: "District Administration & Revenue",
    zone: "Sub-Division East (Sector 7)",
    phone: "+91 97654 32109",
    remarks: "Verify bank passbook details and linked Aadhaar before field inspection."
  },
  {
    name: "Sunita Verma",
    designation: "Revenue Divisional Officer",
    department: "Department of Revenue & Land Records",
    zone: "Central Sector (Zone 2)",
    phone: "+91 96543 21098",
    remarks: "Physical survey will cover structural, crop, and asset damage evaluation."
  },
  {
    name: "Amit Patel",
    designation: "Disaster Management Officer",
    department: "State Disaster Response Authority",
    zone: "Sector 7-B (Urban Ward 9)",
    phone: "+91 95432 10987",
    remarks: "Field inspector will verify geo-tagged photos uploaded during claim submission."
  },
  {
    name: "Priya Nair",
    designation: "Senior Field Audit Inspector",
    department: "Department of Housing & Urban Development",
    zone: "Ward 22 (South Division)",
    phone: "+91 94321 09876",
    remarks: "Please keep land record deed / lease certificate ready for verification."
  },
  {
    name: "Rahul Deshmukh",
    designation: "Municipal Relief Coordinator",
    department: "Municipal Corporation Relief Unit",
    zone: "Zone 1 South (Ward 4)",
    phone: "+91 93210 98765",
    remarks: "Site inspection scheduled for structural safety assessment."
  },
  {
    name: "Meena Gupta",
    designation: "Assistant Commissioner",
    department: "Relief & Resettlement Department",
    zone: "District West (Sub-Division C)",
    phone: "+91 92109 87654",
    remarks: "Keep copy of disaster incident report and local panchayat certificate."
  },
  {
    name: "Suresh Reddy",
    designation: "Chief Rehabilitation Inspector",
    department: "State Emergency Management Cell",
    zone: "Sector 4 (North Ward)",
    phone: "+91 91098 76543",
    remarks: "Officer will cross-check damage assessment with AI evaluation report."
  },
  {
    name: "Kavita Joshi",
    designation: "Block Relief Officer",
    department: "Rural Development & Disaster Relief",
    zone: "Ward 9 (East Sector)",
    phone: "+91 90987 65432",
    remarks: "Physical verification mandatory for claim approval and direct benefit transfer."
  },
  {
    name: "Alok Mishra",
    designation: "Urban Planning & Relief Specialist",
    department: "Department of Urban Land & Housing",
    zone: "Zone 5 (West Division)",
    phone: "+91 98760 12345",
    remarks: "Field auditor will assess boundary wall and foundation stability."
  },
  {
    name: "Deepa Saxena",
    designation: "District Assessment Lead",
    department: "District Disaster Management Unit",
    zone: "Sub-Division West (Sector 11)",
    phone: "+91 97650 23456",
    remarks: "Carry photo ID, bank passbook, and electricity bill for address validation."
  },
  {
    name: "Manoj Kumar",
    designation: "Executive Relief Engineer",
    department: "Public Works & Disaster Reconstruction",
    zone: "Sector 12 (Central Ward)",
    phone: "+91 96540 34567",
    remarks: "Structural safety assessment will determine house reconstruction subsidy grade."
  },
  {
    name: "Ritu Choudhary",
    designation: "Field Verification Specialist",
    department: "Social Welfare & Emergency Relief",
    zone: "Ward 18 (North-East Sector)",
    phone: "+91 95430 45678",
    remarks: "Keep mobile number active for pre-visit confirmation call."
  },
  {
    name: "Arvind Swamy",
    designation: "Regional Disaster Officer",
    department: "State Disaster Rehabilitation Bureau",
    zone: "Central Zone (Sub-Division B)",
    phone: "+91 94320 56789",
    remarks: "Bring income certificate and property tax receipt if applicable."
  },
  {
    name: "Pooja Bhatia",
    designation: "Senior Revenue Inspector",
    department: "Department of Revenue & Excise",
    zone: "Sector 2 (South Ward)",
    phone: "+91 93210 67890",
    remarks: "Audit inspector will issue instant physical verification slip upon inspection."
  },
  {
    name: "Sanjay Malhotra",
    designation: "Relief & Resettlement Officer",
    department: "Disaster Emergency Task Force",
    zone: "Ward 5 (Sub-Division 2)",
    phone: "+91 92100 78901",
    remarks: "Verification of crop/commercial asset loss will be conducted on-site."
  },
  {
    name: "Neha Kapoor",
    designation: "Chief Field Auditor",
    department: "District Administration Relief Wing",
    zone: "Zone 4 East (Ward 15)",
    phone: "+91 91000 89012",
    remarks: "Ensure house owner / authorized family member is present at inspection time."
  },
  {
    name: "Harpreet Singh",
    designation: "District Emergency Coordinator",
    department: "Department of Civil Defense & Relief",
    zone: "Sub-Division South (Sector 8)",
    phone: "+91 90000 90123",
    remarks: "Inspectors will verify original documents against online application submission."
  },
  {
    name: "Shalini Rao",
    designation: "Senior Block Development Inspector",
    department: "Department of Panchayati Raj & Relief",
    zone: "Ward 31 (West Sector)",
    phone: "+91 98989 12345",
    remarks: "Physical verification report will be uploaded directly to the state relief portal."
  }
];

export function getAssignedOfficer(reportId) {
  if (!reportId) {
    const randomIdx = Math.floor(Math.random() * OFFICER_POOL.length);
    return formatOfficerData(OFFICER_POOL[randomIdx]);
  }
  
  let hash = 0;
  for (let i = 0; i < reportId.length; i++) {
    hash = (hash << 5) - hash + reportId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % OFFICER_POOL.length;
  return formatOfficerData(OFFICER_POOL[index], reportId);
}

function formatOfficerData(officer, reportId = "") {
  const { inspectionDate, inspectionTime } = getDynamicInspectionSlot(reportId);
  return {
    name: officer.name,
    role: officer.designation,
    designation: officer.designation,
    department: officer.department,
    zone: officer.zone,
    phone: officer.phone,
    inspectionDate,
    inspectionTime,
    note: officer.remarks,
    remarks: officer.remarks
  };
}

// ── Dynamic Date & Time Slot Generators ──────────────────────────────────────
const TIME_SLOTS = [
  "10:00 AM – 12:00 PM",
  "11:30 AM – 01:30 PM",
  "02:00 PM – 04:00 PM",
  "03:30 PM – 05:30 PM"
];

export function getDynamicInspectionSlot(seed = "") {
  const now = new Date();
  
  let offsetDays = 3;
  let slotIdx = 0;
  
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    offsetDays = 2 + (Math.abs(hash) % 4);
    slotIdx = Math.abs(hash >> 2) % TIME_SLOTS.length;
  } else {
    offsetDays = Math.floor(Math.random() * 4) + 2;
    slotIdx = Math.floor(Math.random() * TIME_SLOTS.length);
  }

  const inspDate = new Date(now);
  inspDate.setDate(now.getDate() + offsetDays);

  const day = String(inspDate.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedDate = `${day} ${monthNames[inspDate.getMonth()]} ${inspDate.getFullYear()}`;

  return {
    inspectionDate: formattedDate,
    inspectionTime: TIME_SLOTS[slotIdx]
  };
}

export function getDynamicDates() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedToday = `${day} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const formatted12Hour = hours % 12 || 12;
  const submissionTime = `${String(formatted12Hour).padStart(2, "0")}:${minutes} ${ampm}`;

  const verifyDateObj = new Date(now);
  verifyDateObj.setDate(now.getDate() + 1);
  const verifyDay = String(verifyDateObj.getDate()).padStart(2, "0");
  const formattedVerifyDate = `${verifyDay} ${monthNames[verifyDateObj.getMonth()]} ${verifyDateObj.getFullYear()}`;

  return {
    reportCreatedDate: formattedToday,
    submissionDate: formattedToday,
    submissionTime: submissionTime,
    verificationDate: formattedVerifyDate
  };
}

// ── Realistic Document Checklist Generator (Pool of 15 Documents) ────────────
// ── Realistic Document Checklist Generator (Pool of 15 Documents) ────────────
export function generateDocumentChecklist(disasterType = "flood", scheme = null) {
  const dt = (disasterType || "").toLowerCase();

  // Core base documents required for all government relief claims
  const commonDocs = [
    { name: "Aadhaar Card", status: "Verified", size: "2.1 MB" },
    { name: "PAN Card", status: "Verified", size: "1.4 MB" },
    { name: "Bank Passbook", status: "Verified", size: "1.8 MB" },
    { name: "Residence Proof", status: "Uploaded", size: "1.9 MB" },
    { name: "Damage Photos", status: "Verified", size: "4.2 MB" },
    { name: "Geo-tagged Images", status: "Uploaded", size: "5.4 MB" }
  ];

  let list = [];

  if (dt.includes("fire")) {
    list = [
      ...commonDocs,
      { name: "Property Ownership Proof", status: "Verified", size: "3.1 MB" },
      { name: "Disaster Incident Report", status: "Verified", size: "1.5 MB" },
      { name: "Electricity Bill", status: "Uploaded", size: "1.2 MB" },
      { name: "Insurance Documents", status: "Required", size: "" },
      { name: "Income Certificate", status: "Pending", size: "" },
      { name: "Survey Report", status: "Required", size: "" }
    ];
  } else if (dt.includes("earthquake")) {
    list = [
      ...commonDocs,
      { name: "Property Ownership Proof", status: "Verified", size: "3.1 MB" },
      { name: "Land Record", status: "Pending", size: "" },
      { name: "Disaster Incident Report", status: "Verified", size: "1.6 MB" },
      { name: "Structural Survey Report", status: "Required", size: "" },
      { name: "Electricity Bill", status: "Uploaded", size: "1.1 MB" },
      { name: "Panchayat Certificate", status: "Pending", size: "" }
    ];
  } else if (dt.includes("cyclone")) {
    list = [
      ...commonDocs,
      { name: "Property Ownership Proof", status: "Verified", size: "3.1 MB" },
      { name: "Disaster Incident Report", status: "Verified", size: "1.5 MB" },
      { name: "Land Record", status: "Pending", size: "" },
      { name: "Panchayat Certificate", status: "Required", size: "" },
      { name: "Insurance Documents", status: "Required", size: "" },
      { name: "Survey Report", status: "Pending", size: "" }
    ];
  } else if (dt.includes("landslide")) {
    list = [
      ...commonDocs,
      { name: "Property Ownership Proof", status: "Verified", size: "3.1 MB" },
      { name: "Land Record", status: "Verified", size: "2.8 MB" },
      { name: "Disaster Incident Report", status: "Verified", size: "1.5 MB" },
      { name: "Income Certificate", status: "Pending", size: "" },
      { name: "Panchayat Certificate", status: "Required", size: "" },
      { name: "Survey Report", status: "Required", size: "" }
    ];
  } else {
    // Default Flood / Heavy Rain (10 documents)
    list = [
      ...commonDocs,
      { name: "Property Ownership Proof", status: "Verified", size: "3.1 MB" },
      { name: "Land Record", status: "Pending", size: "" },
      { name: "Electricity Bill", status: "Uploaded", size: "1.2 MB" },
      { name: "Water Bill", status: "Pending", size: "" },
      { name: "Income Certificate", status: "Pending", size: "" },
      { name: "Disaster Incident Report", status: "Verified", size: "1.5 MB" },
      { name: "Panchayat Certificate", status: "Required", size: "" },
      { name: "Survey Report", status: "Required", size: "" }
    ];
  }

  // If scheme has specific required documents, ensure they are present in the list
  const schemeDocs = typeof scheme === "object" ? (scheme?.requiredDocuments || scheme?.documents || []) : [];
  if (Array.isArray(schemeDocs) && schemeDocs.length > 0) {
    schemeDocs.forEach((sDoc) => {
      const docName = typeof sDoc === "string" ? sDoc : sDoc?.name;
      if (docName && !list.some((item) => item.name.toLowerCase() === docName.toLowerCase())) {
        list.push({
          name: docName,
          status: "Required",
          size: ""
        });
      }
    });
  }

  return list;
}


